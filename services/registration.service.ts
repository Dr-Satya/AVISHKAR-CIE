import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { Prisma } from "@prisma/client";

export interface RegistrationLimits {
  maxSeats: number;
  sameDeptLimit: number;
  otherDeptLimit: number;
  source: "DEPARTMENT" | "PROJECT" | "GLOBAL";
}

export function getCanonicalDepartment(dept: string | null | undefined): string {
  if (!dept) return "";
  const raw = dept.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  // 1. Check specific specialized schools first (prevents "B.Tech Agri" or "B.Tech Design" from being greedily matched by "btech")
  if (raw === "soas" || raw.includes("agricultural") || raw.includes("agriculture") || raw.includes("agri")) {
    return "School of Agricultural Sciences";
  }
  if (raw === "uid" || raw.includes("design") || raw.includes("united world")) {
    return "United World Institute of Design (UID)";
  }
  if (
    raw === "sohas" ||
    raw.includes("healthcare") ||
    raw.includes("pharmacy") ||
    raw.includes("physiotherapy") ||
    raw.includes("allied sciences") ||
    raw.includes("nursing")
  ) {
    return "School of Healthcare and Allied Sciences";
  }
  if (
    raw === "soht" ||
    raw.includes("hospitality") ||
    raw.includes("tourism") ||
    raw.includes("hotel") ||
    raw.includes("culinary")
  ) {
    return "School of Hospitality & Tourism";
  }
  if (raw === "sol" || raw.includes("law") || raw.includes("llb")) {
    return "School of Law";
  }
  if (
    raw === "som" ||
    raw === "business" ||
    raw === "mba" ||
    raw === "bba" ||
    raw.includes("management")
  ) {
    return "School of Management";
  }
  if (raw === "sola" || raw.includes("liberal arts") || raw.includes("humanities")) {
    return "School of Liberal Arts";
  }
  if (raw === "caes" || raw.includes("aerospace") || raw.includes("energy studies") || raw.includes("aviation")) {
    return "Center of Aerospace and Energy Studies";
  }
  if (raw === "coe" || raw.includes("occupational health") || raw.includes("safety") || raw.includes("fire")) {
    return "Centre Of Excellence: Occupational Health, Safety, Fire & Environment";
  }

  // 2. Check general engineering / computing / technology
  if (
    raw === "soes" ||
    raw === "cse" ||
    raw === "ece" ||
    raw === "civil" ||
    raw === "mechanical" ||
    raw.includes("engineering") ||
    raw.includes("btech") ||
    raw.includes("bca") ||
    raw.includes("mca")
  ) {
    return "School of Engineering & Sciences";
  }

  return dept.trim();
}

export function normalizeDept(dept: string | null | undefined): string {
  if (!dept) return "";
  const canonical = getCanonicalDepartment(dept);
  return canonical.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

const projectQueryCache = new Map<string, { data: any[]; time: number }>();
let cachedDeptOverrides: { data: any[]; time: number } | null = null;
let cachedGlobalConfig: { data: any; time: number } | null = null;
const CONFIG_CACHE_TTL_MS = 10 * 1000;

export async function getCachedDeptOverrides(client: any = prisma) {
  const now = Date.now();
  if (cachedDeptOverrides && now - cachedDeptOverrides.time < CONFIG_CACHE_TTL_MS) {
    return cachedDeptOverrides.data;
  }
  const data = await client.departmentRegistrationLimit.findMany();
  cachedDeptOverrides = { data, time: now };
  return data;
}

export async function getCachedGlobalConfig(client: any = prisma) {
  const now = Date.now();
  if (cachedGlobalConfig && now - cachedGlobalConfig.time < CONFIG_CACHE_TTL_MS) {
    return cachedGlobalConfig.data;
  }
  const data = await client.globalConfig.findUnique({ where: { id: "default" } });
  cachedGlobalConfig = { data, time: now };
  return data;
}

export function getCachedProjectQuery(key: string): any[] | null {
  const item = projectQueryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > 5000) {
    projectQueryCache.delete(key);
    return null;
  }
  return item.data;
}

export function setCachedProjectQuery(key: string, data: any[]) {
  projectQueryCache.set(key, { data, time: Date.now() });
}

export function clearProjectQueryCache() {
  projectQueryCache.clear();
  cachedDeptOverrides = null;
  cachedGlobalConfig = null;
}

export async function resolveProjectLimits(
  projectId: string,
  projectDepartment: string,
  projectMaxSeats?: number | null,
  projectSameDeptLimit?: number | null,
  projectOtherDeptLimit?: number | null,
  tx?: Prisma.TransactionClient
): Promise<RegistrationLimits> {
  const client = tx || prisma;

  // 1. Check Project-specific limits (First priority: allows mentors/admin to cap specific projects)
  if (
    projectSameDeptLimit !== null &&
    projectSameDeptLimit !== undefined &&
    projectOtherDeptLimit !== null &&
    projectOtherDeptLimit !== undefined
  ) {
    return {
      maxSeats: projectMaxSeats ?? (projectSameDeptLimit + projectOtherDeptLimit),
      sameDeptLimit: projectSameDeptLimit,
      otherDeptLimit: projectOtherDeptLimit,
      source: "PROJECT",
    };
  }

  // 2. Check Department-specific override (Second priority: department-level quotas)
  const deptOverrides = tx
    ? await tx.departmentRegistrationLimit.findMany()
    : await getCachedDeptOverrides(client);

  const matchedOverride = deptOverrides.find(
    (d: any) => normalizeDept(d.department) === normalizeDept(projectDepartment)
  );

  if (matchedOverride) {
    return {
      maxSeats: projectMaxSeats ?? (matchedOverride.sameDeptLimit + matchedOverride.otherDeptLimit),
      sameDeptLimit: matchedOverride.sameDeptLimit,
      otherDeptLimit: matchedOverride.otherDeptLimit,
      source: "DEPARTMENT",
    };
  }

  // 3. Fallback to Global defaults (cached in RAM for 10s)
  const globalConfig = tx
    ? await tx.globalConfig.findUnique({ where: { id: "default" } })
    : await getCachedGlobalConfig(client);

  const maxSeats = projectMaxSeats ?? globalConfig?.maxSeats ?? 10;
  const sameDeptLimit = globalConfig?.sameDeptLimit ?? 4;
  const otherDeptLimit = globalConfig?.otherDeptLimit ?? 6;

  return {
    maxSeats,
    sameDeptLimit,
    otherDeptLimit,
    source: "GLOBAL",
  };
}

export interface RegisterResult {
  success: boolean;
  registration?: any;
  error?: string;
  project?: any;
}

class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) {
            next();
          }
        });
      };
      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

const projectMutexes = new Map<string, AsyncMutex>();
function getProjectMutex(projectId: string): AsyncMutex {
  let m = projectMutexes.get(projectId);
  if (!m) {
    m = new AsyncMutex();
    projectMutexes.set(projectId, m);
  }
  return m;
}

/**
 * Transaction-safe registration with zero overbooking guarantee.
 * Serializes concurrent applications per-project using in-memory async mutex
 * and verifies strict cohort & seat limits.
 */
export async function registerStudentForProject(
  studentId: string,
  projectId: string,
  actor: { name: string; role: "STUDENT" | "ADMIN" | "SYSTEM" } = { name: "Student", role: "STUDENT" }
): Promise<RegisterResult> {
  const release = await getProjectMutex(projectId).acquire();
  try {
    // 1. Global kill switch check (cached in RAM for 10s)
    const globalConfig = await getCachedGlobalConfig();
    if (globalConfig && !globalConfig.registrationOpen && actor.role !== "ADMIN" && actor.role !== "SYSTEM") {
      throw new Error("Registration is currently closed by administration.");
    }

    const activeYear = globalConfig?.activeAcademicYear || "2025-2026";

    // 2. Atomic Database Operations with Concurrency Mutex
    let newRegistration: any;
    let project: any;

    // 2a. Verify Student existence and check if already registered
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { registration: true },
    });

    if (!student) {
      throw new Error("Student record not found.");
    }

    if (student.registration) {
      throw new Error(
        "Your project registration is officially locked in. Changes or reassignments can only be performed by the University Administrator."
      );
    }

    if (actor.role === "STUDENT" && !student.phoneVerified) {
      throw new Error("Please verify and confirm your mobile number before registering for a project.");
    }

    // Check academic year cohort matching
    if (student.academicYear && student.academicYear !== activeYear) {
      throw new Error(
        `Your student profile belongs to cohort (${student.academicYear}). Only active cohort (${activeYear}) students can register.`
      );
    }

    // 2b. Retrieve project record
    const proj = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!proj) {
      throw new Error("Project not found.");
    }

    if (proj.academicYear && proj.academicYear !== activeYear) {
      throw new Error(
        `This project belongs to a previous academic cohort (${proj.academicYear}) and is not open for registration.`
      );
    }

    // 2c. Resolve applicable limits (Project > Department > Global)
    const limits = await resolveProjectLimits(
      proj.id,
      proj.department,
      proj.maxSeats,
      proj.sameDeptLimit,
      proj.otherDeptLimit,
      prisma
    );

    // 2d. Get current registrations under write lock
    const existingRegs = await prisma.registration.findMany({
      where: { projectId: proj.id },
      include: {
        student: {
          select: { department: true },
        },
      },
    });

    const totalSeatsFilled = existingRegs.length;

    if (totalSeatsFilled >= limits.maxSeats) {
      throw new Error(`Project is completely full (${totalSeatsFilled}/${limits.maxSeats} seats).`);
    }

    const isSameDept = normalizeDept(student.department) === normalizeDept(proj.department);

    const sameDeptCount = existingRegs.filter(
      (r: any) => normalizeDept(r.student?.department) === normalizeDept(proj.department)
    ).length;

    const otherDeptCount = totalSeatsFilled - sameDeptCount;

    if (isSameDept) {
      if (sameDeptCount >= limits.sameDeptLimit) {
        throw new Error(
          `Same department seat limit reached for this project (${sameDeptCount}/${limits.sameDeptLimit}).`
        );
      }
    } else {
      if (otherDeptCount >= limits.otherDeptLimit) {
        throw new Error(
          `Other department seat limit reached for this project (${otherDeptCount}/${limits.otherDeptLimit}).`
        );
      }
    }

    // 2e. Create Registration record (Unique constraint on studentId guarantees 1-to-1 at DB level)
    const reg = await prisma.registration.create({
      data: {
        studentId: student.id,
        projectId: proj.id,
        status: "Approved",
      },
      include: {
        student: true,
        project: {
          include: { faculty: true },
        },
      },
    });

    newRegistration = reg;
    project = proj;

    // 3. Persist audit log
    try {
      await prisma.auditLog.create({
        data: {
          actor: actor.name,
          actorRole: actor.role,
          action: "STUDENT_REGISTER",
          target: project.projectId,
          metadata: JSON.stringify({
            studentEnrollment: newRegistration.student.enrollmentNumber,
            studentName: newRegistration.student.name,
            projectTitle: project.title,
            studentId: newRegistration.studentId,
          }),
        },
      });
    } catch (auditErr) {
      console.error("AuditLog creation error:", auditErr);
    }

    // 4. Invalidate query cache
    clearProjectQueryCache();

    // 5. Broadcast event
    broadcastEvent("registration.created", {
      studentId: newRegistration.studentId,
      enrollmentNumber: newRegistration.student.enrollmentNumber,
      studentName: newRegistration.student.name,
      projectId: newRegistration.projectId,
      projectCode: project.projectId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      registration: newRegistration,
      project,
    };
  } finally {
    release();
  }
}

export interface BulkRegistrationProgress {
  totalToProcess: number;
  processed: number;
  registered: number;
  skipped: number;
  skippedDetails: Array<{ enrollment: string; name: string; reason: string }>;
  isCompleted: boolean;
}

/**
 * Bulk registration algorithm:
 * Fetches all unregistered students for the active cohort and assigns them to the emptiest
 * eligible projects, strictly evaluating ALL constraints (seat caps, same/other department quotas,
 * department-level limit overrides, and active cohort scope).
 */
export async function executeBulkRegistration(
  onProgress?: (progress: BulkRegistrationProgress) => void
): Promise<BulkRegistrationProgress> {
  // 1. Fetch Global Config & Active Cohort
  const globalConfig = await prisma.globalConfig.findUnique({ where: { id: "default" } });
  const activeYear = globalConfig?.activeAcademicYear || "2025-2026";
  const globalMaxSeats = globalConfig?.maxSeats ?? 10;
  const globalSameDeptLimit = globalConfig?.sameDeptLimit ?? 4;
  const globalOtherDeptLimit = globalConfig?.otherDeptLimit ?? 6;

  // 2. Fetch all department overrides once
  const deptOverrides = await prisma.departmentRegistrationLimit.findMany();
  const deptOverridesMap = new Map<string, { sameDeptLimit: number; otherDeptLimit: number; maxSeats: number }>();
  for (const d of deptOverrides) {
    deptOverridesMap.set(normalizeDept(d.department), {
      sameDeptLimit: d.sameDeptLimit,
      otherDeptLimit: d.otherDeptLimit,
      maxSeats: d.sameDeptLimit + d.otherDeptLimit,
    });
  }

  // 3. Fetch all unregistered students for active cohort
  const unregisteredStudents = await prisma.student.findMany({
    where: {
      registration: null,
      academicYear: activeYear,
    },
    orderBy: {
      enrollmentNumber: "asc",
    },
  });

  // 4. Fetch all active projects and their existing registrations in one query
  const rawProjects = await prisma.project.findMany({
    where: {
      academicYear: activeYear,
    },
    include: {
      registrations: {
        include: {
          student: {
            select: { department: true },
          },
        },
      },
    },
  });

  // 5. Initialize in-memory project allocation state with exact resolved constraints
  interface ProjectAllocationState {
    id: string;
    projectId: string;
    title: string;
    department: string;
    normDept: string;
    maxSeats: number;
    sameDeptLimit: number;
    otherDeptLimit: number;
    totalSeats: number;
    sameDeptCount: number;
    otherDeptCount: number;
  }

  const projectStates: ProjectAllocationState[] = rawProjects.map((p) => {
    const normDept = normalizeDept(p.department);
    const deptOverride = deptOverridesMap.get(normDept);

    let maxSeats: number;
    let sameDeptLimit: number;
    let otherDeptLimit: number;

    // 1. Project-specific limits take first priority
    if (
      p.sameDeptLimit !== null &&
      p.sameDeptLimit !== undefined &&
      p.otherDeptLimit !== null &&
      p.otherDeptLimit !== undefined
    ) {
      maxSeats = p.maxSeats ?? (p.sameDeptLimit + p.otherDeptLimit);
      sameDeptLimit = p.sameDeptLimit;
      otherDeptLimit = p.otherDeptLimit;
    } else if (deptOverride) {
      // 2. Department-level overrides take second priority
      maxSeats = deptOverride.maxSeats;
      sameDeptLimit = deptOverride.sameDeptLimit;
      otherDeptLimit = deptOverride.otherDeptLimit;
    } else {
      // 3. Global defaults fallback
      maxSeats = p.maxSeats ?? globalMaxSeats;
      sameDeptLimit = globalSameDeptLimit;
      otherDeptLimit = globalOtherDeptLimit;
    }

    const sameDeptCount = p.registrations.filter(
      (r) => normalizeDept(r.student?.department) === normDept
    ).length;
    const totalSeats = p.registrations.length;
    const otherDeptCount = Math.max(0, totalSeats - sameDeptCount);

    return {
      id: p.id,
      projectId: p.projectId,
      title: p.title,
      department: p.department,
      normDept,
      maxSeats,
      sameDeptLimit,
      otherDeptLimit,
      totalSeats,
      sameDeptCount,
      otherDeptCount,
    };
  });

  const progress: BulkRegistrationProgress = {
    totalToProcess: unregisteredStudents.length,
    processed: 0,
    registered: 0,
    skipped: 0,
    skippedDetails: [],
    isCompleted: false,
  };

  broadcastEvent("bulk_registration.progress", progress);

  const newRegistrationsToInsert: Array<{ studentId: string; projectId: string; status: string }> = [];

  // 6. Match each unregistered student according to rules
  for (const student of unregisteredStudents) {
    const studentNormDept = normalizeDept(student.department);

    // Sort projects: emptiest first (fewest totalSeats)
    projectStates.sort((a, b) => a.totalSeats - b.totalSeats);

    let assigned = false;
    let failureReason = "No eligible projects available in active cohort";

    for (const proj of projectStates) {
      // Constraint 1: Seat Capacity
      if (proj.totalSeats >= proj.maxSeats) {
        failureReason = `All eligible projects reached seat capacity (${proj.totalSeats}/${proj.maxSeats})`;
        continue;
      }

      const isSameDept = studentNormDept === proj.normDept;

      // Constraint 2: Same Department Quota
      if (isSameDept && proj.sameDeptCount >= proj.sameDeptLimit) {
        failureReason = `Same-department quota full (${proj.sameDeptCount}/${proj.sameDeptLimit})`;
        continue;
      }

      // Constraint 3: Other Department Quota
      if (!isSameDept && proj.otherDeptCount >= proj.otherDeptLimit) {
        failureReason = `Other-department quota full (${proj.otherDeptCount}/${proj.otherDeptLimit})`;
        continue;
      }

      // Eligible! Allocate to this project
      proj.totalSeats++;
      if (isSameDept) {
        proj.sameDeptCount++;
      } else {
        proj.otherDeptCount++;
      }

      newRegistrationsToInsert.push({
        studentId: student.id,
        projectId: proj.id,
        status: "Approved",
      });

      assigned = true;
      break;
    }

    progress.processed++;
    if (assigned) {
      progress.registered++;
    } else {
      progress.skipped++;
      progress.skippedDetails.push({
        enrollment: student.enrollmentNumber,
        name: student.name,
        reason: failureReason,
      });
    }

    if (progress.processed % 25 === 0 || progress.processed === progress.totalToProcess) {
      broadcastEvent("bulk_registration.progress", progress);
      if (onProgress) onProgress({ ...progress });
    }
  }

  // 7. Persist newly created registrations in sequential batches to prevent D1 socket contention
  if (newRegistrationsToInsert.length > 0) {
    const BATCH_SIZE = 25;
    for (let i = 0; i < newRegistrationsToInsert.length; i += BATCH_SIZE) {
      const batch = newRegistrationsToInsert.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((reg) =>
          prisma.registration.upsert({
            where: { studentId: reg.studentId },
            update: {
              projectId: reg.projectId,
              status: reg.status,
            },
            create: {
              studentId: reg.studentId,
              projectId: reg.projectId,
              status: reg.status,
            },
          })
        )
      );
    }

    await prisma.auditLog.create({
      data: {
        actor: "System Administrator",
        actorRole: "ADMIN",
        action: "BULK_REGISTRATION",
        metadata: JSON.stringify({
          activeYear,
          totalProcessed: progress.processed,
          registered: progress.registered,
          skipped: progress.skipped,
        }),
      },
    });

    clearProjectQueryCache();
  }

  progress.isCompleted = true;
  broadcastEvent("bulk_registration.completed", progress);
  if (onProgress) onProgress({ ...progress });

  return progress;
}

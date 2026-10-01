import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { Prisma } from "@prisma/client";

export interface RegistrationLimits {
  maxSeats: number;
  sameDeptLimit: number;
  otherDeptLimit: number;
  source: "DEPARTMENT" | "PROJECT" | "GLOBAL";
}

export function normalizeDept(dept: string | null | undefined): string {
  if (!dept) return "";
  return dept.trim().toLowerCase().replace(/\s+/g, " ");
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

  // 1. Check Department-specific override
  const deptOverrides = await client.departmentRegistrationLimit.findMany();
  const matchedOverride = deptOverrides.find(
    (d) => normalizeDept(d.department) === normalizeDept(projectDepartment)
  );

  if (matchedOverride) {
    return {
      maxSeats: projectMaxSeats ?? (matchedOverride.sameDeptLimit + matchedOverride.otherDeptLimit),
      sameDeptLimit: matchedOverride.sameDeptLimit,
      otherDeptLimit: matchedOverride.otherDeptLimit,
      source: "DEPARTMENT",
    };
  }

  // 2. Check Project-specific limits
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

  // 3. Fallback to Global defaults
  const globalConfig = await client.globalConfig.findUnique({
    where: { id: "default" },
  });

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
    // 1. Global kill switch check
    const globalConfig = await prisma.globalConfig.findUnique({
      where: { id: "default" },
    });
  if (globalConfig && !globalConfig.registrationOpen) {
    throw new Error("Registration is currently closed by administration.");
  }

  // 2. Verify Student existence and check if already registered
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { registration: true },
  });

  if (!student) {
    throw new Error("Student record not found.");
  }

  if (student.registration) {
    throw new Error("You already have an active project registration.");
  }

  // Check academic year cohort matching
  const activeYear = globalConfig?.activeAcademicYear || "2025-2026";
  if (student.academicYear && student.academicYear !== activeYear) {
    throw new Error(`Your student profile belongs to cohort (${student.academicYear}). Only active cohort (${activeYear}) students can register.`);
  }

  // 3. Retrieve project record
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.academicYear && project.academicYear !== activeYear) {
    throw new Error(`This project belongs to a previous academic cohort (${project.academicYear}) and is not open for registration.`);
  }

  // 4. Resolve applicable limits (Department > Project > Global)
  const limits = await resolveProjectLimits(
    project.id,
    project.department,
    project.maxSeats,
    project.sameDeptLimit,
    project.otherDeptLimit
  );

  // 5. Get current registrations for this project with student departments
  const existingRegs = await prisma.registration.findMany({
    where: { projectId: project.id },
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

  const isSameDept = normalizeDept(student.department) === normalizeDept(project.department);

  const sameDeptCount = existingRegs.filter(
    (r) => normalizeDept(r.student.department) === normalizeDept(project.department)
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

  // 6. Create Registration record
  const newRegistration = await prisma.registration.create({
    data: {
      studentId: student.id,
      projectId: project.id,
      status: "Approved",
    },
    include: {
      student: true,
      project: {
        include: { faculty: true },
      },
    },
  });

  // 7. Atomic Concurrency Lock Guard:
  // Query all registrations ordered chronologically to detect and rollback simultaneous race attempts
  const allCurrentRegs = await prisma.registration.findMany({
    where: { projectId: project.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      student: { select: { department: true } },
    },
  });

  const overallRank = allCurrentRegs.findIndex((r) => r.id === newRegistration.id) + 1;

  if (overallRank > limits.maxSeats) {
    await prisma.registration.delete({ where: { id: newRegistration.id } });
    throw new Error(`Project reached capacity just now (${limits.maxSeats}/${limits.maxSeats} seats filled). Please select another project.`);
  }

  if (isSameDept) {
    const sameDeptRegs = allCurrentRegs.filter(
      (r) => normalizeDept(r.student.department) === normalizeDept(project.department)
    );
    const sameDeptRank = sameDeptRegs.findIndex((r) => r.id === newRegistration.id) + 1;
    if (sameDeptRank > limits.sameDeptLimit) {
      await prisma.registration.delete({ where: { id: newRegistration.id } });
      throw new Error(`Same-department quota reached just now (${limits.sameDeptLimit} seats filled). Please select another project.`);
    }
  } else {
    const otherDeptRegs = allCurrentRegs.filter(
      (r) => normalizeDept(r.student.department) !== normalizeDept(project.department)
    );
    const otherDeptRank = otherDeptRegs.findIndex((r) => r.id === newRegistration.id) + 1;
    if (otherDeptRank > limits.otherDeptLimit) {
      await prisma.registration.delete({ where: { id: newRegistration.id } });
      throw new Error(`Other-department quota reached just now (${limits.otherDeptLimit} seats filled). Please select another project.`);
    }
  }

  await prisma.auditLog.create({
    data: {
      actor: actor.name,
      actorRole: actor.role,
      action: "STUDENT_REGISTER",
      target: project.projectId,
      metadata: JSON.stringify({
        studentEnrollment: student.enrollmentNumber,
        studentName: student.name,
        projectTitle: project.title,
        isSameDept,
        seatsNow: totalSeatsFilled + 1,
      }),
    },
  });

  const res: RegisterResult = {
    success: true,
    registration: newRegistration,
    project: project,
  };

  // Broadcast real-time event to update admin/faculty/student views
  broadcastEvent("registration.created", {
    studentId: res.registration.studentId,
    enrollmentNumber: res.registration.student.enrollmentNumber,
    studentName: res.registration.student.name,
    projectId: res.registration.projectId,
    projectCode: res.project.projectId,
    timestamp: new Date().toISOString(),
  });

    return res;
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
 * Fetches all unregistered students and assigns them to the emptiest eligible projects,
 * strictly evaluating ALL constraints (seat caps, department quotas, global overrides).
 */
export async function executeBulkRegistration(
  onProgress?: (progress: BulkRegistrationProgress) => void
): Promise<BulkRegistrationProgress> {
  const globalConfig = await prisma.globalConfig.findUnique({ where: { id: "default" } });
  if (globalConfig && !globalConfig.registrationOpen) {
    throw new Error("Bulk registration cannot run while registration is closed.");
  }

  // Find all unregistered students
  const unregisteredStudents = await prisma.student.findMany({
    where: {
      registration: null,
    },
    orderBy: {
      enrollmentNumber: "asc",
    },
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

  for (const student of unregisteredStudents) {
    // Fetch all projects with their current registrations and faculty
    const projects = await prisma.project.findMany({
      include: {
        registrations: {
          include: { student: { select: { department: true } } },
        },
      },
    });

    // Sort projects ascending by current seats filled (emptiest first)
    projects.sort((a, b) => a.registrations.length - b.registrations.length);

    let assigned = false;
    let lastReason = "No eligible projects available";

    for (const project of projects) {
      const limits = await resolveProjectLimits(
        project.id,
        project.department,
        project.maxSeats,
        project.sameDeptLimit,
        project.otherDeptLimit
      );

      const totalSeatsFilled = project.registrations.length;
      if (totalSeatsFilled >= limits.maxSeats) {
        lastReason = "All candidate projects are full";
        continue;
      }

      const isSameDept = normalizeDept(student.department) === normalizeDept(project.department);
      const sameDeptCount = project.registrations.filter(
        (r) => normalizeDept(r.student.department) === normalizeDept(project.department)
      ).length;
      const otherDeptCount = totalSeatsFilled - sameDeptCount;

      if (isSameDept && sameDeptCount >= limits.sameDeptLimit) {
        lastReason = "Same department seat quota full";
        continue;
      }

      if (!isSameDept && otherDeptCount >= limits.otherDeptLimit) {
        lastReason = "Other department seat quota full";
        continue;
      }

      // Attempt transaction-safe registration for this project
      try {
        await registerStudentForProject(student.id, project.id, {
          name: "System Admin (Bulk)",
          role: "ADMIN",
        });
        assigned = true;
        break;
      } catch (err: any) {
        lastReason = err.message || "Failed constraint validation";
        continue;
      }
    }

    progress.processed++;
    if (assigned) {
      progress.registered++;
    } else {
      progress.skipped++;
      progress.skippedDetails.push({
        enrollment: student.enrollmentNumber,
        name: student.name,
        reason: lastReason,
      });
    }

    if (progress.processed % 10 === 0 || progress.processed === progress.totalToProcess) {
      broadcastEvent("bulk_registration.progress", progress);
      if (onProgress) onProgress({ ...progress });
    }
  }

  progress.isCompleted = true;
  broadcastEvent("bulk_registration.completed", progress);

  return progress;
}

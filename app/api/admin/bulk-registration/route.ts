import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeBulkRegistration } from "@/services/registration.service";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function cleanStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().replace(/\s+/g, " ");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // If multipart form data: Handle Excel File Upload & Direct Table Population
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const importType = ((formData.get("type") as string) || "STUDENTS").toUpperCase();
      let academicYear = cleanStr(formData.get("academicYear"));

      if (!file || !(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "No Excel file provided." }, { status: 400 });
      }

      // If no academic year specified, fetch the current active academic year
      if (!academicYear) {
        const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
        academicYear = config?.activeAcademicYear || "2025-2026";
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "Excel sheet is empty or has no readable rows." }, { status: 400 });
      }

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // 1. IMPORT STUDENTS (Supports IDP Mapping Format / Mohit Maan & Standard formats)
      if (importType === "STUDENTS") {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const enrollmentNumber = cleanStr(
            r["Enrolment No."] ||
            r["Enrollment No."] ||
            r["EnrollmentNumber"] ||
            r["Enrollment"] ||
            r["Enrolment"]
          );
          if (!enrollmentNumber) {
            skippedCount++;
            continue;
          }

          const name = cleanStr(r["Name "] || r["Name"] || r["Student Name"] || r["StudentName"]) || "Student";
          const department = cleanStr(r["Department"] || r["School"]) || "School of Engineering & Sciences";
          const programme = cleanStr(r["Programme Name"] || r["Programme"]) || null;
          const gender = cleanStr(r["Gender"] || r["Sex"] || r["gender"]) || null;
          const semester = parseInt(cleanStr(r["Semester"]), 10) || 3;
          const batch = cleanStr(r["Batch"]) || "2025";
          const admissionNumber = cleanStr(r["Admission No."] || r["AdmissionNumber"] || r["Admission No"]) || null;
          const email = `${enrollmentNumber.toLowerCase()}@gdgu.org`;

          try {
            const existing = await prisma.student.findUnique({ where: { enrollmentNumber } });
            if (existing) {
              await prisma.student.update({
                where: { enrollmentNumber },
                data: { name, department, programme, gender, semester, batch, admissionNumber, academicYear },
              });
              updatedCount++;
            } else {
              await prisma.student.create({
                data: { enrollmentNumber, name, department, programme, gender, semester, batch, admissionNumber, email, academicYear },
              });
              insertedCount++;
            }
          } catch (err: any) {
            errors.push(`Row ${i + 2} (${enrollmentNumber}): ${err.message}`);
            skippedCount++;
          }
        }
      }
      // 2. IMPORT FACULTY
      else if (importType === "FACULTY") {
        const defaultPasscode = process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026";
        const passcodeHash = await bcrypt.hash(defaultPasscode, 10);

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const email = cleanStr(r["Email ID"] || r["Email"] || r["Official Email"] || r["Faculty Official Email id"]).toLowerCase();
          if (!email || !email.includes("@")) {
            skippedCount++;
            continue;
          }

          const name = cleanStr(r["Faculty Name"] || r["Name"]) || "Faculty Member";
          const department = cleanStr(r["School / Department"] || r["Department"] || r["Faculty Department"] || r["School"]) || "School of Engineering & Sciences";
          const phone = cleanStr(r["Contact No."] || r["Phone"]) || null;

          try {
            const existing = await prisma.faculty.findUnique({ where: { email } });
            if (existing) {
              await prisma.faculty.update({
                where: { email },
                data: { name, department, phone },
              });
              updatedCount++;
            } else {
              await prisma.faculty.create({
                data: { name, email, department, phone, passcodeHash },
              });
              insertedCount++;
            }
          } catch (err: any) {
            errors.push(`Row ${i + 2} (${email}): ${err.message}`);
            skippedCount++;
          }
        }
      }
      // 3. IMPORT SPOC
      else if (importType === "SPOC") {
        const defaultPasscode = process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026";
        const passcodeHash = await bcrypt.hash(defaultPasscode, 10);

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const email = cleanStr(r["Official Email"] || r["Email ID"] || r["Email"]).toLowerCase();
          const department = cleanStr(r["Department"] || r["School"]);
          if (!email || !department) {
            skippedCount++;
            continue;
          }

          const name = cleanStr(r["Faculty Name"] || r["Name"]) || "Department SPOC";

          try {
            let faculty = await prisma.faculty.findUnique({ where: { email } });
            if (!faculty) {
              faculty = await prisma.faculty.create({
                data: { name, email, department, passcodeHash, isSpoc: true, spocDepartment: department },
              });
            } else {
              await prisma.faculty.update({
                where: { id: faculty.id },
                data: { isSpoc: true, spocDepartment: department },
              });
            }

            await prisma.spoc.upsert({
              where: { department },
              update: { email, name, facultyId: faculty.id },
              create: { email, name, department, passcodeHash, facultyId: faculty.id },
            });
            insertedCount++;
          } catch (err: any) {
            errors.push(`Row ${i + 2} (${department}): ${err.message}`);
            skippedCount++;
          }
        }
      }
      // 4. IMPORT PROJECTS (Supports CHC Service Report & Custom Proposal formats)
      else if (importType === "PROJECTS") {
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const title = cleanStr(
            r["Project  Title  ( Workflow  Version   -   1)"] ||
            r["Project Title"] ||
            r["Projet Title"] ||
            r["Title"]
          );
          if (!title) {
            skippedCount++;
            continue;
          }

          let projectId = cleanStr(
            r["Project/Title Code"] ||
            r["Project ID"] ||
            r["ProjectId"] ||
            r["Code"]
          );

          const facultyEmail = cleanStr(
            r["Email  ( Workflow  Version   -   1)"] ||
            r["Faculty Email"] ||
            r["Email ID"] ||
            r["Official Email id"] ||
            r["Email"]
          ).toLowerCase();

          const facultyName = cleanStr(
            r["Name  ( Workflow  Version   -   1)"] ||
            r["Faculty Name"] ||
            r["Name"]
          ) || "Faculty Member";

          const department = cleanStr(
            r["Department  ( Workflow  Version   -   1)"] ||
            r["School"] ||
            r["Department"] ||
            r["School / Department"]
          ) || "School of Engineering & Sciences";

          const phone = cleanStr(
            r["Phone  ( Workflow  Version   -   1)"] ||
            r["Contact No."] ||
            r["Phone"]
          ) || null;

          const category = cleanStr(
            r["Project  Category  (IDP2501/IDP2502)"] ||
            r["Category"] ||
            r["Project  Category  ( Workflow  Version   -   1)"]
          ) || "IDP2502";

          const theme = cleanStr(
            r["Select  One  Theme  ( Workflow  Version   -   1)"] ||
            r["Theme"]
          ) || "Others";

          const sdgMapping = cleanStr(
            r["SD G  Mapping  ( Workflow  Version   -   1)"] ||
            r["SDG Mapping"]
          ) || null;

          const description = cleanStr(
            r["Description  of ID P  project  ( Workflow  Version   -   1)"] ||
            r["Description  of IDP  project"] ||
            r["Description"]
          ) || null;

          try {
            let faculty = facultyEmail
              ? await prisma.faculty.findUnique({ where: { email: facultyEmail } })
              : null;

            if (!faculty && facultyEmail) {
              const defaultPasscode = process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026";
              const passcodeHash = await bcrypt.hash(defaultPasscode, 10);
              faculty = await prisma.faculty.create({
                data: {
                  name: facultyName,
                  email: facultyEmail,
                  department,
                  phone,
                  passcodeHash,
                },
              });
            } else if (!faculty) {
              faculty = await prisma.faculty.findFirst({ where: { department } });
              if (!faculty) faculty = await prisma.faculty.findFirst();
            }

            if (!faculty) {
              errors.push(`Row ${i + 2}: No faculty found to assign project '${title}'`);
              skippedCount++;
              continue;
            }

            if (!projectId) {
              const count = await prisma.project.count();
              projectId = `P${String(count + 1).padStart(3, "0")}`;
            }

            const existing = await prisma.project.findFirst({
              where: {
                OR: [{ projectId }, { title }],
              },
            });

            if (existing) {
              await prisma.project.update({
                where: { id: existing.id },
                data: {
                  projectId,
                  title,
                  department,
                  category,
                  theme,
                  sdgMapping,
                  description,
                  facultyId: faculty.id,
                  academicYear,
                },
              });
              updatedCount++;
            } else {
              await prisma.project.create({
                data: {
                  projectId,
                  title,
                  department,
                  category,
                  theme,
                  sdgMapping,
                  description,
                  facultyId: faculty.id,
                  academicYear,
                },
              });
              insertedCount++;
            }
          } catch (err: any) {
            errors.push(`Row ${i + 2} (${projectId || title}): ${err.message}`);
            skippedCount++;
          }
        }
      }
      // 5. IMPORT COHORTS (Exact IDP Cohorts Details 5Sep-2026 format)
      else if (importType === "COHORTS") {
        const defaultPasscode = process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026";
        const passcodeHash = await bcrypt.hash(defaultPasscode, 10);

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const enrollmentNumber = cleanStr(
            r["Enrollment"] ||
            r["Enrolment No."] ||
            r["Enrollment No."]
          );
          const studentName = cleanStr(r["Student Name"] || r["Name "] || r["Name"]);
          const pId = cleanStr(r["Project ID"] || r["ProjectId"]);
          const facultyEmail = cleanStr(r["Email ID"] || r["Email"]).toLowerCase();
          const facultyName = cleanStr(r["Faculty Name"] || r["Faculty"]);
          const school = cleanStr(r["School"] || r["Department"]) || "School of Engineering & Sciences";
          const title = cleanStr(r["Projet Title"] || r["Project Title"] || r["Title"]);
          const category = cleanStr(r["Project  Category  (IDP2501/IDP2502)"] || r["Category"]) || "IDP2502";
          const theme = cleanStr(r["Theme"]) || "Others";
          const description = cleanStr(r["Description  of IDP  project"] || r["Description"]) || null;
          const phone = cleanStr(r["Contact No."] || r["Phone"]) || null;

          if (!enrollmentNumber || !pId) {
            skippedCount++;
            continue;
          }

          try {
            let faculty = facultyEmail
              ? await prisma.faculty.findUnique({ where: { email: facultyEmail } })
              : null;

            if (!faculty && facultyEmail) {
              faculty = await prisma.faculty.create({
                data: {
                  name: facultyName || "Faculty Member",
                  email: facultyEmail,
                  department: school,
                  phone,
                  passcodeHash,
                },
              });
            } else if (!faculty) {
              faculty = await prisma.faculty.findFirst({ where: { department: school } });
              if (!faculty) faculty = await prisma.faculty.findFirst();
            }

            if (!faculty) {
              errors.push(`Row ${i + 2}: No faculty available for project ${pId}`);
              skippedCount++;
              continue;
            }

            const project = await prisma.project.upsert({
              where: { projectId: pId },
              update: {
                title: title || `Project ${pId}`,
                department: school,
                category,
                theme,
                description,
                facultyId: faculty.id,
                academicYear,
              },
              create: {
                projectId: pId,
                title: title || `Project ${pId}`,
                department: school,
                category,
                theme,
                description,
                facultyId: faculty.id,
                academicYear,
              },
            });

            const studentEmail = `${enrollmentNumber.toLowerCase()}@gdgu.org`;
            const student = await prisma.student.upsert({
              where: { enrollmentNumber },
              update: {
                name: studentName || "Student",
                department: school,
                academicYear,
              },
              create: {
                enrollmentNumber,
                name: studentName || "Student",
                department: school,
                email: studentEmail,
                academicYear,
                semester: 3,
                batch: "2025",
              },
            });

            await prisma.registration.upsert({
              where: { studentId: student.id },
              update: {
                projectId: project.id,
                status: "Approved",
              },
              create: {
                studentId: student.id,
                projectId: project.id,
                status: "Approved",
              },
            });

            insertedCount++;
          } catch (err: any) {
            errors.push(`Row ${i + 2} (${enrollmentNumber} / ${pId}): ${err.message}`);
            skippedCount++;
          }
        }
      }

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "ADMIN",
          action: `IMPORT_${importType}`,
          metadata: JSON.stringify({ academicYear, insertedCount, updatedCount, skippedCount, totalRows: rows.length }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Import completed for ${importType} (${academicYear})`,
        summary: {
          totalRows: rows.length,
          inserted: insertedCount,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errors.slice(0, 10),
        },
      });
    } catch (err: any) {
      console.error("XLSX import failed:", err);
      return NextResponse.json({ error: err.message || "Failed to process Excel file." }, { status: 500 });
    }
  }

  // Fallback: Legacy automatic bulk registration execution
  try {
    const result = await executeBulkRegistration();
    return NextResponse.json({
      success: true,
      message: "Bulk registration algorithm completed.",
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bulk registration failed." },
      { status: 500 }
    );
  }
}

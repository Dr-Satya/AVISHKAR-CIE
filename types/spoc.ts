export type SubmissionStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_REVISION";

export type ArtifactStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";

export type ReviewAction = "APPROVE" | "REJECT" | "NEEDS_REVISION";

export interface Artifact {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  academicYear?: string;
  semester?: number;
  similarityPercent?: number;
  aiPercent?: number;
  similarityChecked: boolean;
  aiChecked: boolean;
  plagiarismReportFileName?: string | null;
  plagiarismReportUrl?: string | null;
  selfDeclaration?: boolean;
  status: ArtifactStatus | string;
  spocNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ProjectData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  theme: string;
  category: string;
  academicYear?: string;
  semester?: number;
  submissionStatus: SubmissionStatus | string;
  spocReviewNote?: string;
  reviewedAt?: string;
  // Research Manuscript & Publication (Optional)
  hasDraftManuscript?: boolean;
  hasCommunicatedManuscript?: boolean;
  draftManuscriptUrl?: string | null;
  draftManuscriptFileName?: string | null;
  journalName?: string | null;
  avishkarAffiliationCommunicated?: boolean;
  isManuscriptPublished?: boolean;
  publicationDoi?: string | null;
  publishedManuscriptUrl?: string | null;
  publishedManuscriptFileName?: string | null;
  avishkarAffiliationPublished?: boolean;
  manuscriptPlagiarismUrl?: string | null;
  manuscriptPlagiarismFileName?: string | null;
  manuscriptSimilarityPercent?: number | null;
  manuscriptAiPercent?: number | null;
  manuscriptSubmittedAt?: string | null;
  faculty: {
    id: string;
    name: string;
    email: string;
    department: string;
    phone?: string;
  };
  studentsCount: number;
  artifacts: Artifact[];
  students: Array<{
    id: string;
    enrollment: string;
    name: string;
    department: string;
    programme?: string;
    semester: number;
    batch: string;
    internalMarks?: number | null;
    externalMarks?: number | null;
    attendancePercent?: number | null;
  }>;
}

export interface FacultyStudentMarks {
  studentId: string;
  enrollmentNumber: string;
  name: string;
  programme?: string;
  internalMarks: number;
  externalMarks: number;
  attendancePercent: number;
  marksShared: boolean;
  projectTitle: string;
  projectId: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isSpoc: boolean;
  projectsCount: number;
  studentsCount: number;
  marksStatus: "SHARED" | "PARTIAL" | "NOT_SHARED" | "NO_STUDENTS";
  marksSharedCount: number;
  marksPendingCount: number;
  studentsWithMarks?: FacultyStudentMarks[];
  projects: Array<{
    id: string;
    projectId: string;
    title: string;
    submissionStatus: string;
  }>;
}

export interface StudentRecord {
  id: string;
  enrollmentNumber: string;
  name: string;
  department: string;
  programme?: string;
  semester: number;
  batch: string;
  email?: string;
  phone?: string;
  internalMarks?: number | null;
  externalMarks?: number | null;
  attendancePercent?: number | null;
  projectId: string;
  projectTitle: string;
  facultyName: string;
  facultyEmail: string;
  registeredAt: string;
}

export interface SpocKpis {
  totalProjects: number;
  totalFaculty: number;
  totalStudents: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  notSubmittedCount: number;
  facultyMarksSharedCount?: number;
  facultyMarksPendingCount?: number;
  facultyMarksPartialCount?: number;
}

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
  status: string;
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
  submissionStatus: string;
  spocReviewNote?: string;
  reviewedAt?: string;
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
  }>;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isSpoc: boolean;
  projectsCount: number;
  studentsCount: number;
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
}

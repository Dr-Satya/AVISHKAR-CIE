export interface FacultyData {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  isAdmin: boolean;
  isSpoc?: boolean;
  spocDepartment?: string | null;
}

export interface StudentInProject {
  id: string;
  enrollment: string;
  name: string;
  department: string;
  programme?: string;
  phone?: string | null;
  email?: string | null;
  semester: number;
  batch: string;
  registeredAt: string;
  status: string;
}

export interface ArtifactData {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
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
}

export interface AssignedProject {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  theme: string;
  category: string;
  maxSeats: number;
  currentRegistrations: number;
  availableSeats: number;
  submissionStatus: string;
  spocReviewNote?: string;
  reviewedAt?: string;
  artifacts?: ArtifactData[];
  students: StudentInProject[];
}

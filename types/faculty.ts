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
  phoneVerified?: boolean;
  email?: string | null;
  semester: number;
  batch: string;
  registeredAt: string;
  status: string;
  internalMarks?: number | null;
  externalMarks?: number | null;
  attendancePercent?: number | null;
}

export interface ArtifactData {
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
}

export interface AssignedProject {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  theme: string;
  category: string;
  academicYear?: string;
  semester?: number;
  maxSeats: number;
  currentRegistrations: number;
  availableSeats: number;
  submissionStatus: string;
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
  artifacts?: ArtifactData[];
  students: StudentInProject[];
}

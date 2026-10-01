export interface KpiData {
  totalStudents: number;
  totalProjects: number;
  totalRegistrations: number;
  totalCapacity: number;
  seatsFilledRatio: string;
}

export interface GlobalConfigData {
  registrationOpen: boolean;
  maxSeats: number;
  sameDeptLimit: number;
  otherDeptLimit: number;
  activeAcademicYear?: string;
  activeSemester?: number;
}

export interface DeptLimit {
  id: string;
  department: string;
  sameDeptLimit: number;
  otherDeptLimit: number;
}

export interface BulkProgressState {
  totalToProcess: number;
  processed: number;
  registered: number;
  skipped: number;
  skippedDetails: Array<{ enrollment: string; name: string; reason: string }>;
  isCompleted: boolean;
}

export interface StudentRecord {
  id: string;
  enrollmentNumber: string;
  name: string;
  department: string;
  programme: string;
  semester: number;
  batch: string;
  admissionNumber?: string;
  academicYear: string;
  registered: boolean;
  registeredProjectTitle?: string | null;
  registeredAt?: string | null;
}

export interface StudentFormData {
  id: string;
  enrollmentNumber: string;
  name: string;
  department: string;
  programme: string;
  semester: number;
  batch: string;
  admissionNumber: string;
  academicYear: string;
}

export interface FacultyRecord {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string | null;
  isAdmin: boolean;
  isSpoc: boolean;
  spocDepartment?: string | null;
  isPasscodeDefault?: boolean;
}

export interface FacultyFormData {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  passcode: string;
  isAdmin: boolean;
  isSpoc: boolean;
  spocDepartment: string;
}

export interface ProjectRecord {
  id: string;
  projectId: string;
  title: string;
  category: string;
  facultyName: string;
  facultyDept: string;
  coGuideName?: string | null;
  seatsTotal: number;
  seatsFilled: number;
  academicYear: string;
  semester: number;
}

export interface RegistrationRecord {
  id: string;
  studentName: string;
  enrollmentNumber: string;
  studentDept: string;
  projectTitle: string;
  projectId: string;
  registeredAt: string;
  status: string;
}

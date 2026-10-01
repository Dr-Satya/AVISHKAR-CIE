export interface StudentData {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  programme?: string;
  semester: number;
  batch: string;
  email: string;
  registration?: {
    id: string;
    status: string;
    project: {
      projectId: string;
      title: string;
      department: string;
      theme: string;
      category: string;
      faculty: {
        name: string;
        department: string;
      };
    };
  };
}

export interface ProjectCardData {
  id: string;
  projectId: string;
  title: string;
  description: string;
  department: string;
  facultyName: string;
  theme: string;
  category: string;
  maxSeats: number;
  seatsFilled: number;
  availableSeats: number;
  sameDeptQuota: string;
  otherDeptQuota: string;
  isSameDept: boolean;
  isEligible: boolean;
  ineligibilityReason: string;
}

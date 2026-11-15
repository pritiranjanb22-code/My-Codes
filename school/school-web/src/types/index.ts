export type Role = 'SUPER_ADMIN' | 'HEADMASTER' | 'TEACHER' | 'PARENT';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type SchoolStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type StudentStatus = 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'DEACTIVATED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'HALF_DAY';
export type AcademicYearStatus = 'CURRENT' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
export type MarkStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  role: Role;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  schoolId: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  school?: School;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  registrationNo: string | null;
  status: SchoolStatus;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    students: number;
    teachers: number;
  };
}

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: string | null;
  rollNumber: number;
  admissionDate: string;
  previousSchool: string | null;
  address: string | null;
  emergencyContact: string | null;
  photoUrl: string | null;
  status: StudentStatus;
  schoolId: string;
  classId: string;
  sectionId: string;
  parentId: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianName: string | null;
  parentPhone: string;
  parentEmail: string | null;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  section?: Section;
  parent?: Parent;
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  dateOfJoining: string;
  qualification: string | null;
  experience: number | null;
  schoolId: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  user: User;
  assignments?: TeacherAssignment[];
  classes?: Class[];
  subjects?: Subject[];
}

export interface Parent {
  id: string;
  userId: string;
  occupation: string | null;
  address: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  children?: ParentStudent[];
}

export interface ParentStudent {
  id: string;
  parentId: string;
  studentId: string;
  relation: string;
  isPrimary: boolean;
  createdAt: string;
  student: Student;
}

export interface Class {
  id: string;
  name: string;
  level: number;
  academicYearId: string;
  schoolId: string;
  classTeacherId: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
  classTeacher?: Teacher;
  sections?: Section[];
  _count?: {
    students: number;
    sections: number;
  };
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  schoolId: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  _count?: {
    students: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  schoolId: string;
  classId: string | null;
  sectionId: string | null;
  teacherId: string | null;
  maxMarks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  section?: Section;
  teacher?: Teacher;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  teacherId: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  date: string;
  period: string;
  status: AttendanceStatus;
  remarks: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  teacher?: Teacher;
}

export interface ExamType {
  id: string;
  name: string;
  code: string;
  weightage: number;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  name: string;
  examTypeId: string;
  academicYearId: string;
  schoolId: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  examType?: ExamType;
  academicYear?: AcademicYear;
  subjects?: ExamSubject[];
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  maxMarks: number;
  passMarks: number;
  date: string;
  subject?: Subject;
}

export interface Mark {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  teacherId: string;
  schoolId: string;
  academicYearId: string;
  obtainedMarks: number;
  maxMarks: number;
  grade: string | null;
  remarks: string | null;
  status: MarkStatus;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  exam?: Exam;
  subject?: Subject;
  teacher?: Teacher;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string | null;
  schoolId: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  attachmentUrl: string | null;
  targetAudience: string;
  targetClassId: string | null;
  targetSectionId: string | null;
  schoolId: string;
  authorId: string;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  schoolId: string;
  academicYearId: string;
  createdAt: string;
  updatedAt: string;
  teacher?: Teacher;
  class?: Class;
  section?: Section;
  subject?: Subject;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
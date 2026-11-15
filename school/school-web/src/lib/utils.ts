import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format: string = 'PP'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: format === 'PP' ? 'medium' : 'short',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getAttendanceColor(status: string): string {
  switch (status) {
    case 'PRESENT':
      return 'text-green-600 bg-green-100';
    case 'ABSENT':
      return 'text-red-600 bg-red-100';
    case 'LATE':
      return 'text-orange-600 bg-orange-100';
    case 'LEAVE':
      return 'text-blue-600 bg-blue-100';
    case 'HALF_DAY':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-green-600 bg-green-100';
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100';
    case 'SUSPENDED':
      return 'text-red-600 bg-red-100';
    case 'REJECTED':
      return 'text-red-600 bg-red-100';
    case 'ARCHIVED':
      return 'text-gray-600 bg-gray-100';
    case 'COMPLETED':
      return 'text-blue-600 bg-blue-100';
    case 'UPCOMING':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function calculatePercentage(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-100';
    case 'B+':
    case 'B':
      return 'text-blue-600 bg-blue-100';
    case 'C+':
    case 'C':
      return 'text-yellow-600 bg-yellow-100';
    case 'D':
      return 'text-orange-600 bg-orange-100';
    case 'F':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
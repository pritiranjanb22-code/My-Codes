'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  GraduationCap,
  UserPlus,
  ClipboardList,
  Building2,
  TrendingUp,
  Award,
  Calendar,
  Bell,
  School,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DashboardStats {
  totalStudents?: number;
  totalTeachers?: number;
  todayAttendance?: number;
  presentCount?: number;
  absentCount?: number;
  attendancePercent?: number;
  pendingTeacherApprovals?: number;
  totalSchools?: number;
  activeSchools?: number;
  pendingSchools?: number;
  myClasses?: any[];
  myChildren?: any[];
}

const statCards = [
  { name: 'Total Students', key: 'totalStudents', icon: GraduationCap, color: 'bg-blue-500', roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Total Teachers', key: 'totalTeachers', icon: UserPlus, color: 'bg-green-500', roles: ['SUPER_ADMIN', 'HEADMASTER'] },
  { name: 'Total Schools', key: 'totalSchools', icon: Building2, color: 'bg-purple-500', roles: ['SUPER_ADMIN'] },
  { name: 'Today\'s Attendance', key: 'todayAttendance', icon: ClipboardList, color: 'bg-orange-500', roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Present', key: 'presentCount', icon: Users, color: 'bg-emerald-500', roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Absent', key: 'absentCount', icon: UserPlus, color: 'bg-red-500', roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'] },
  { name: 'Attendance %', key: 'attendancePercent', icon: TrendingUp, color: 'bg-indigo-500', roles: ['SUPER_ADMIN', 'HEADMASTER', 'TEACHER'], suffix: '%' },
  { name: 'Pending Approvals', key: 'pendingTeacherApprovals', icon: Clock, color: 'bg-yellow-500', roles: ['SUPER_ADMIN', 'HEADMASTER'] },
];

function Clock({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/schools/dashboard');
      return res.data;
    },
    enabled: hasRole(['SUPER_ADMIN', 'HEADMASTER']),
  });

  const { data: teacherClasses } = useQuery({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const res = await api.get('/teachers/my-classes');
      return res.data;
    },
    enabled: hasRole(['TEACHER']),
  });

  const { data: parentChildren } = useQuery({
    queryKey: ['my-children'],
    queryFn: async () => {
      const res = await api.get('/parents/my-children');
      return res.data;
    },
    enabled: hasRole(['PARENT']),
  });

  if (!user) return null;

  const visibleStats = statCards.filter((s) => s.roles.includes(user.role));

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600">Here's what's happening today</p>
          </div>
          <div className="flex gap-2">
            {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
              <Link href="/students/create">
                <Button><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
              </Link>
            )}
            {hasRole(['TEACHER']) && (
              <Link href="/attendance">
                <Button><ClipboardList className="w-4 h-4 mr-2" /> Take Attendance</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleStats.map((stat) => {
            const Icon = stat.icon;
            const value = stats?.[stat.key as keyof DashboardStats] ?? 0;
            return (
              <Card key={stat.name} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                        {stat.suffix || ''}
                      </p>
                    </div>
                    <div className={cn('p-3 rounded-xl', stat.color)}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && stats && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link href="/students/create" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
                    <GraduationCap className="w-8 h-8 mx-auto text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Add Student</p>
                  </Link>
                  <Link href="/teachers/create" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
                    <UserPlus className="w-8 h-8 mx-auto text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Invite Teacher</p>
                  </Link>
                  <Link href="/classes/create" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Create Class</p>
                  </Link>
                  <Link href="/attendance" className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
                    <ClipboardList className="w-8 h-8 mx-auto text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Take Attendance</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {hasRole(['TEACHER']) && teacherClasses && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">My Classes</h2>
              </CardHeader>
              <CardContent>
                {teacherClasses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No classes assigned</p>
                ) : (
                  <div className="space-y-3">
                    {teacherClasses.slice(0, 5).map((cls: any) => (
                      <Link key={cls.id} href={`/attendance?class=${cls.classId}&section=${cls.sectionId}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{cls.class?.name} - {cls.section?.name}</p>
                            <p className="text-sm text-gray-500">{cls.subject?.name}</p>
                          </div>
                        </div>
                        <Badge variant="primary">Take Attendance</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {hasRole(['PARENT']) && parentChildren && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">My Children</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parentChildren.map((child: any) => (
                    <div key={child.studentId} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <Avatar name={`${child.student.firstName} ${child.student.lastName}`} size="md" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{child.student.firstName} {child.student.lastName}</p>
                        <p className="text-sm text-gray-500">{child.student.class?.name} - {child.student.section?.name} • Roll: {child.student.rollNumber}</p>
                      </div>
                      <Link href={`/students/${child.studentId}/attendance`} className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                        View Attendance
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(hasRole(['SUPER_ADMIN']) || hasRole(['HEADMASTER'])) && stats && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Recent Activity</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">New student admissions</p>
                      <p className="text-sm text-gray-500">5 students enrolled this week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Attendance completed</p>
                      <p className="text-sm text-gray-500">Class 5-A attendance marked for today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Results published</p>
                      <p className="text-sm text-gray-500">Quarterly exam results for Class 8</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
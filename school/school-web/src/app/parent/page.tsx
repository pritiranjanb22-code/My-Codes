'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Avatar } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Award,
  BookOpen,
  Users,
  TrendingUp,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDate, getAttendanceColor, calculatePercentage } from '@/lib/utils';

interface Child {
  studentId: string;
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    rollNumber: number;
    class?: { name: string; level: number };
    section?: { name: string };
    photoUrl: string | null;
  };
  relation: string;
  isPrimary: boolean;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  halfDay: number;
  percentage: string;
}

interface ExamResult {
  exam: { name: string; examType?: { name: string } };
  summary: { totalObtained: number; totalMax: number; percentage: string; grade: string };
  marks: any[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  author?: { firstName: string; lastName: string };
}

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const { data: children } = useQuery<Child[]>({
    queryKey: ['my-children'],
    queryFn: async () => { const res = await api.get('/parents/my-children'); return res.data; },
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['parent-announcements'],
    queryFn: async () => { const res = await api.get('/announcements/published'); return res.data; },
  });

  const { data: upcomingHolidays } = useQuery({
    queryKey: ['upcoming-holidays'],
    queryFn: async () => { const res = await api.get('/holidays/upcoming', { params: { days: 30 } }); return res.data; },
  });

  if (!user || !children?.length) return null;

  if (!selectedChild) setSelectedChild(children[0]);

  const { data: attendanceStats } = useQuery<AttendanceStats>({
    queryKey: ['child-attendance-stats', selectedChild?.studentId],
    queryFn: async () => {
      const res = await api.get(`/parents/${user.id}/students/${selectedChild?.studentId}/attendance`);
      return res.data.stats;
    },
    enabled: !!selectedChild,
  });

  const { data: examResults } = useQuery<ExamResult[]>({
    queryKey: ['child-exam-results', selectedChild?.studentId],
    queryFn: async () => {
      const res = await api.get(`/parents/${user.id}/students/${selectedChild?.studentId}/exam-results`);
      return res.data;
    },
    enabled: !!selectedChild,
  });

  const child = selectedChild?.student;
  const stats = attendanceStats;

  return (
    <DashboardLayout title="Parent Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.firstName}!</h1>
            <p className="text-gray-600">Here's an overview of your children's progress</p>
          </div>
          <div className="flex gap-2">
            {children.map((c) => (
              <button
                key={c.studentId}
                onClick={() => setSelectedChild(c)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedChild?.studentId === c.studentId
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                )}
              >
                <Avatar name={`${c.student.firstName} ${c.student.lastName}`} size="sm" src={c.student.photoUrl} />
                <span>{c.student.firstName} ({c.relation})</span>
              </button>
            ))}
          </div>
        </div>

        {child && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance</p>
                    <p className="text-3xl font-bold text-primary-600">{stats.percentage}%</p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-xl"><TrendingUp className="w-6 h-6 text-primary-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Days</p>
                    <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                    <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl"><XCircle className="w-6 h-6 text-red-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Leave Days</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.leave}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl"><Calendar className="w-6 h-6 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Latest Results</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {examResults?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No exam results published yet</p>
              ) : (
                <div className="space-y-3">
                  {examResults?.slice(0, 5).map((result) => (
                    <div key={result.exam.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{result.exam.name}</p>
                        <p className="text-sm text-gray-500">{result.exam.examType?.name || 'Exam'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{result.summary.percentage}%</p>
                        <Badge variant={['A+','A'].includes(result.summary.grade) ? 'success' : ['B+','B'].includes(result.summary.grade) ? 'info' : 'warning'}>{result.summary.grade}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Upcoming Events</h2>
                <Button variant="ghost" size="sm">View Calendar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {(upcomingHolidays?.length === 0 && announcements?.length === 0) ? (
                <p className="text-gray-500 text-center py-8">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingHolidays?.slice(0, 3).map((holiday: any) => (
                    <div key={holiday.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-yellow-600" /></div>
                        <div>
                          <p className="font-medium">{holiday.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(holiday.startDate)} - {formatDate(holiday.endDate)}</p>
                        </div>
                      </div>
                      <Badge variant="warning">Holiday</Badge>
                    </div>
                  ))}
                  {announcements?.slice(0, 3).map((ann) => (
                    <div key={ann.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><Bell className="w-5 h-5 text-primary-600" /></div>
                        <div>
                          <p className="font-medium">{ann.title}</p>
                          <p className="text-sm text-gray-500">By {ann.author?.firstName} {ann.author?.lastName} • {formatDate(ann.publishedAt || '')}</p>
                        </div>
                      </div>
                      <Badge variant="primary">Announcement</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent          </Card>
        </div>

        {child && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{child.firstName}'s Quick Info</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Class & Section</p>
                  <p className="font-semibold">{child.class?.name} - {child.section?.name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-semibold">{child.rollNumber}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Admission No</p>
                  <p className="font-semibold">{child.admissionNo}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Grade Level</p>
                  <p className="font-semibold">Class {child.class?.level}</p>
                </div>
              </div>
            </CardContent          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center gap-2" onClick={() => toast.success('Navigate to attendance')}>
                <Calendar className="w-8 h-8" />
                <span>Attendance</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center gap-2" onClick={() => toast.success('Navigate to results')}>
                <Award className="w-8 h-8" />
                <span>Results</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center gap-2" onClick={() => toast.success('Navigate to calendar')}>
                <BookOpen className="w-8 h-8" />
                <span>Calendar</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center gap-2" onClick={() => toast.success('Navigate to announcements')}>
                <Bell className="w-8 h-8" />
                <span>Announcements</span>
              </Button>
            </div>
          </CardContent        </Card>
      </div>
    </DashboardLayout>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

function XCircle({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
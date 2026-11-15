'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Download,
  FileText,
  BarChart,
  Users,
  GraduationCap,
  Calendar,
  Award,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function ReportsPage() {
  const { hasRole, user } = useAuth();
  const [reportType, setReportType] = useState<'attendance' | 'academic' | 'student' | 'class'>('attendance');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [classFilter, setClassFilter] = useState('');

  const { data: attendanceReport } = useQuery({
    queryKey: ['attendance-report', dateRange, classFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (classFilter) params.append('classId', classFilter);
      const res = await api.get(`/attendance/report?${params}`);
      return res.data;
    },
    enabled: reportType === 'attendance',
  });

  const { data: academicReport } = useQuery({
    queryKey: ['academic-report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      const res = await api.get(`/marks/report?${params}`);
      return res.data;
    },
    enabled: reportType === 'academic',
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-for-report'],
    queryFn: async () => { const res = await api.get('/classes'); return res.data.data; },
  });

  const reportTabs = [
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'academic', label: 'Academic Performance', icon: Award },
    { id: 'student', label: 'Student Reports', icon: GraduationCap },
    { id: 'class', label: 'Class Summary', icon: Users },
  ];

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <DashboardLayout title="Reports" action={
      <Button variant="outline" onClick={() => toast.success('PDF export coming soon')}>
        <Download className="w-4 h-4 mr-2" /> Export PDF
      </Button>
    }>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2 overflow-x-auto" aria-label="Report tabs">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  reportType === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-400">to</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          {reportType === 'attendance' && classes && (
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} options={[{ value: '', label: 'All Classes' }, ...classes.map((c: any) => ({ value: c.id, label: c.name }))]} placeholder="Filter by class" />
          )}
        </div>
      </div>

      {reportType === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{attendanceReport?.totalStudents || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl"><Users className="w-6 h-6 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-3xl font-bold text-green-600">{attendanceReport?.present || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-3xl font-bold text-red-600">{attendanceReport?.absent || 0}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl"><XCircle className="w-6 h-6 text-red-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance %</p>
                    <p className="text-3xl font-bold text-primary-600">{attendanceReport?.percentage || 0}%</p>
                  </div>
                  <div className="p-3 bg-primary-100 rounded-xl"><BarChart className="w-6 h-6 text-primary-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {attendanceReport?.byClass && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Attendance by Class</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceReport.byClass}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {attendanceReport?.byStatus && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Attendance Distribution</h2>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(attendanceReport.byStatus).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(attendanceReport.byStatus).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {reportType === 'academic' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Exam Performance Overview</h2>
            </CardHeader>
            <CardContent>
              {academicReport?.byExam && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={academicReport.byExam}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="average" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} name="Average %" />
                      <Line type="monotone" dataKey="passRate" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Pass Rate %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {academicReport?.bySubject && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Subject-wise Performance</h2>
              </CardHeader>
              <CardContent>
                <Table
                  columns={[
                    { key: 'subject', header: 'Subject', accessor: 'subject' },
                    { key: 'average', header: 'Average %', render: (_, row) => `${row.average?.toFixed(1)}%` },
                    { key: 'passRate', header: 'Pass Rate %', render: (_, row) => `${row.passRate?.toFixed(1)}%` },
                    { key: 'highest', header: 'Highest', render: (_, row) => `${row.highest}%` },
                    { key: 'lowest', header: 'Lowest', render: (_, row) => `${row.lowest}%` },
                  ]}
                  data={academicReport.bySubject}
                  keyExtractor={(row) => row.subject}
                  emptyMessage="No subject data"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {reportType === 'student' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Student Performance Report</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">Select a student from the Students page and click "View Report" to see individual performance.</p>
            <Table
              columns={[
                { key: 'name', header: 'Student', render: (_, row) => `${row.firstName} ${row.lastName}` },
                { key: 'class', header: 'Class', render: (_, row) => `${row.class?.name} - ${row.section?.name}` },
                { key: 'attendance', header: 'Attendance %', render: (_, row) => `${row.attendancePercent}%` },
                { key: 'exams', header: 'Exams', render: (_, row) => row.examCount },
                { key: 'average', header: 'Avg Score', render: (_, row) => `${row.avgScore}%` },
                { key: 'rank', header: 'Class Rank', render: (_, row) => row.rank },
              ]}
              data={[]}
              keyExtractor={(row) => row.id}
              emptyMessage="Student reports are available from the Students page"
            />
          </CardContent>
        </Card>
      )}

      {reportType === 'class' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Class Summary Report</h2>
          </CardHeader>
          <CardContent>
            <Table
              columns={[
                { key: 'class', header: 'Class', render: (_, row) => row.class },
                { key: 'students', header: 'Students', accessor: 'students' },
                { key: 'attendance', header: 'Avg Attendance %', render: (_, row) => `${row.attendance}%` },
                { key: 'avgScore', header: 'Avg Exam Score', render: (_, row) => `${row.avgScore}%` },
                { key: 'passRate', header: 'Pass Rate', render: (_, row) => `${row.passRate}%` },
                { key: 'topStudent', header: 'Top Student', render: (_, row) => row.topStudent },
              ]}
              data={[]}
              keyExtractor={(row) => row.class}
              emptyMessage="Class summary data will appear here"
            />
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

function XCircle({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
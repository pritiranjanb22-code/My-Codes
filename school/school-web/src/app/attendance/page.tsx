'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  UserMinus,
  CheckCheck,
  Save,
  Send,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDate, getAttendanceColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AttendanceStudent {
  studentId: string;
  admissionNo: string;
  rollNumber: number;
  firstName: string;
  lastName: string;
  attendance: { status: string; remarks: string } | null;
}

interface ClassSection {
  id: string;
  name: string;
  classId: string;
  class: { name: string; level: number };
}

interface TeacherClass {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  class: { name: string; level: number };
  section: { name: string };
  subject: { name: string; code: string };
}

export default function AttendancePage() {
  const { hasRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('MORNING');
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: myClasses } = useQuery<TeacherClass[]>({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const res = await api.get('/teachers/my-classes');
      return res.data;
    },
    enabled: hasRole(['TEACHER']),
  });

  const { data: allClasses } = useQuery<ClassSection[]>({
    queryKey: ['classes-for-attendance'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data.data;
    },
    enabled: hasRole(['HEADMASTER', 'SUPER_ADMIN']),
  });

  const fetchStudents = async () => {
    if (!selectedClass || !selectedSection) return;
    try {
      const res = await api.get('/attendance', {
        params: {
          classId: selectedClass,
          sectionId: selectedSection,
          date: selectedDate,
          period: selectedPeriod,
        },
      });
      const data = res.data.data;
      const classItem = myClasses?.find(c => c.classId === selectedClass && c.sectionId === selectedSection) || allClasses?.find(c => c.id === selectedClass);
      const sectionItem = classItem?.section || allClasses?.find(c => c.id === selectedSection);
      
      if (classItem && sectionItem) {
        setStudents(data.map((s: any) => ({
          studentId: s.studentId,
          admissionNo: s.admissionNo,
          rollNumber: s.rollNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          attendance: s.attendance,
        })));
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedSection('');
    setStudents([]);
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    if (selectedClass && sectionId) fetchStudents();
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedClass && selectedSection) fetchStudents();
  };

  const markAll = (status: string) => {
    setStudents(prev => prev.map(s => ({ ...s, attendance: { status, remarks: '' } })));
  };

  const updateStudentAttendance = (studentId: string, status: string, remarks?: string) => {
    setStudents(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, attendance: { status, remarks: remarks || '' } } : s
    ));
  };

  const submitAttendance = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select class and section');
      return;
    }

    const attendances = students
      .filter(s => s.attendance)
      .map(s => ({
        studentId: s.studentId,
        status: s.attendance!.status,
        remarks: s.attendance!.remarks,
      }));

    if (attendances.length === 0) {
      toast.error('No attendance records to submit');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/attendance', {
        classId: selectedClass,
        sectionId: selectedSection,
        date: selectedDate,
        period: selectedPeriod,
        attendances,
      });
      toast.success('Attendance submitted successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = students.length > 0 && students.every(s => s.attendance) && !submitting;

  return (
    <DashboardLayout title="Attendance" action={
      canSubmit && <Button onClick={submitAttendance} loading={submitting}><Save className="w-4 h-4 mr-2" /> Submit Attendance</Button>
    }>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Select
                value={selectedPeriod}
                onChange={(e) => { setSelectedPeriod(e.target.value); fetchStudents(); }}
                options={[
                  { value: 'MORNING', label: 'Morning' },
                  { value: 'AFTERNOON', label: 'Afternoon' },
                ]}
                placeholder="Period"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                options={[
                  { value: '', label: 'Select Class' },
                  ...(hasRole(['TEACHER']) 
                    ? myClasses?.map((c: any) => ({ value: c.classId, label: `${c.class.name} - ${c.section.name} (${c.subject.name})` })) || []
                    : allClasses?.map((c: any) => ({ value: c.id, label: c.name })) || []
                  ),
                ]}
                placeholder="Select Class"
              />
              <Select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                options={[
                  { value: '', label: 'Select Section' },
                  ...(selectedClass 
                    ? (hasRole(['TEACHER']) 
                        ? myClasses?.filter((c: any) => c.classId === selectedClass).map((c: any) => ({ value: c.sectionId, label: c.section.name })) || []
                        : allClasses?.filter((c: any) => c.id === selectedClass).map((c: any) => ({ value: c.id, label: c.name })) || []
                      )
                    : []
                  ),
                ]}
                placeholder="Select Section"
                disabled={!selectedClass}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(!selectedClass || !selectedSection) && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select class and section</h3>
              <p className="text-gray-500">Choose a class, section, and date to mark attendance</p>
            </div>
          )}

          {selectedClass && selectedSection && students.length === 0 && !submitting && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No students found</h3>
              <p className="text-gray-500">No students enrolled in this class/section</p>
            </div>
          )}

          {students.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')}><CheckCircle className="w-4 h-4 mr-1 text-green-600" /> All Present</Button>
                <Button variant="outline" size="sm" onClick={() => markAll('ABSENT')}><XCircle className="w-4 h-4 mr-1 text-red-600" /> All Absent</Button>
                <Button variant="outline" size="sm" onClick={() => markAll('LATE')}><Clock className="w-4 h-4 mr-1 text-orange-600" /> All Late</Button>
                <Button variant="outline" size="sm" onClick={() => markAll('LEAVE')}><UserMinus className="w-4 h-4 mr-1 text-blue-600" /> All Leave</Button>
                {saved && <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCheck className="w-4 h-4" /> Saved</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">Roll</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">Admission No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-64">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{student.rollNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{student.admissionNo}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY'].map((status) => (
                              <button
                                key={status}
                                onClick={() => updateStudentAttendance(student.studentId, status)}
                                className={cn(
                                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                                  student.attendance?.status === status
                                    ? getAttendanceColor(status).replace('bg-', 'bg-').replace('text-', 'text-')
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                {status === 'PRESENT' && <CheckCircle className="w-3.5 h-3.5" />}
                                {status === 'ABSENT' && <XCircle className="w-3.5 h-3.5" />}
                                {status === 'LATE' && <Clock className="w-3.5 h-3.5" />}
                                {status === 'LEAVE' && <UserMinus className="w-3.5 h-3.5" />}
                                {status === 'HALF_DAY' && <span>½</span>}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={student.attendance?.remarks || ''}
                            onChange={(e) => updateStudentAttendance(student.studentId, student.attendance?.status || 'PRESENT', e.target.value)}
                            placeholder="Remarks"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
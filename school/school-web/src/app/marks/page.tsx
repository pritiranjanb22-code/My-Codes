'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Table, Column, Pagination } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const markSchema = z.object({
  studentId: z.string().uuid('Student is required'),
  examId: z.string().uuid('Exam is required'),
  subjectId: z.string().uuid('Subject is required'),
  obtainedMarks: z.coerce.number().min(0, 'Marks cannot be negative'),
  maxMarks: z.coerce.number().min(1, 'Max marks must be at least 1'),
  remarks: z.string().optional(),
});

type MarkForm = z.infer<typeof markSchema>;

interface Mark {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  teacherId: string;
  obtainedMarks: number;
  maxMarks: number;
  grade: string | null;
  remarks: string | null;
  status: string;
  student?: { id: string; admissionNo: string; firstName: string; lastName: string; rollNumber: number; class?: { name: string }; section?: { name: string } };
  exam?: { id: string; name: string; examType?: { name: string } };
  subject?: { name: string; code: string };
}

interface Exam { id: string; name: string; examType?: { name: string }; subjects?: any[]; }
interface Subject { id: string; name: string; code: string; }

export default function MarksPage() {
  const { hasRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMark, setEditingMark] = useState<Mark | null>(null);
  const [bulkExam, setBulkExam] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');

  const { data: exams } = useQuery({
    queryKey: ['exams-for-marks'],
    queryFn: async () => { const res = await api.get('/exams'); return res.data.data; },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects-for-marks', examFilter],
    queryFn: async () => {
      if (!examFilter) return [];
      const exam = exams?.find((e: any) => e.id === examFilter);
      return exam?.subjects?.map((s: any) => ({ id: s.subjectId, name: s.subject?.name, code: s.subject?.code })) || [];
    },
    enabled: !!examFilter,
  });

  const { data: students } = useQuery({
    queryKey: ['students-for-marks', examFilter, subjectFilter],
    queryFn: async () => {
      if (!examFilter || !subjectFilter) return [];
      const res = await api.get('/students', { params: { limit: 200 } });
      return res.data.data;
    },
    enabled: !!examFilter && !!subjectFilter,
  });

  const { data: marksData, isLoading } = useQuery({
    queryKey: ['marks', page, limit, search, examFilter, subjectFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(examFilter && { examId: examFilter }), ...(subjectFilter && { subjectId: subjectFilter }), ...(statusFilter && { status: statusFilter }) });
      const res = await api.get(`/marks?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MarkForm) => { const res = await api.post('/marks', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marks'] }); toast.success('Marks entered'); setModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to enter marks'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MarkForm> }) => { const res = await api.patch(`/marks/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marks'] }); toast.success('Marks updated'); setModalOpen(false); setEditingMark(null); },
    onError: (error: any) => toast.error(error.message || 'Failed to update marks'),
  });

  const submitMutation = useMutation({
    mutationFn: async (ids: string[]) => { await api.post('/marks/submit', { ids }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marks'] }); toast.success('Marks submitted for approval'); },
    onError: (error: any) => toast.error(error.message || 'Failed to submit'),
  });

  const approveMutation = useMutation({
    mutationFn: async (ids: string[]) => { await api.post('/marks/approve', { ids }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marks'] }); toast.success('Marks approved'); },
    onError: (error: any) => toast.error(error.message || 'Failed to approve'),
  });

  const publishMutation = useMutation({
    mutationFn: async (ids: string[]) => { await api.post('/marks/publish', { ids }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marks'] }); toast.success('Marks published'); },
    onError: (error: any) => toast.error(error.message || 'Failed to publish'),
  });

  const columns: Column<Mark>[] = [
    { key: 'student', header: 'Student', render: (_, row) => row.student ? (
      <div>
        <p className="font-medium">{row.student.firstName} {row.student.lastName}</p>
        <p className="text-xs text-gray-500">Roll: {row.student.rollNumber} • {row.student.class?.name} {row.student.section?.name}</p>
      </div>
    ) : '-' },
    { key: 'exam', header: 'Exam', render: (_, row) => row.exam?.name || '-' },
    { key: 'subject', header: 'Subject', render: (_, row) => row.subject?.name || '-' },
    { key: 'marks', header: 'Marks', render: (_, row) => `${row.obtainedMarks}/${row.maxMarks}` },
    { key: 'percentage', header: '%', render: (_, row) => `${((row.obtainedMarks / row.maxMarks) * 100).toFixed(1)}%` },
    { key: 'grade', header: 'Grade', render: (_, row) => row.grade ? <Badge variant={['A+','A'].includes(row.grade) ? 'success' : ['B+','B'].includes(row.grade) ? 'info' : ['C+','C'].includes(row.grade) ? 'warning' : 'danger'}>{row.grade}</Badge> : '-' },
    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'DRAFT' ? 'default' : row.status === 'SUBMITTED' ? 'info' : row.status === 'APPROVED' ? 'warning' : 'success'}>{row.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(row)}><Eye className="w-4 h-4" /></Button>
          {hasRole(['HEADMASTER', 'SUPER_ADMIN', 'TEACHER']) && (
            <>
              {row.status === 'DRAFT' && <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="w-4 h-4" /></Button>}
              {row.status === 'DRAFT' && <Button variant="ghost" size="sm" onClick={() => submitMutation.mutate([row.id])} loading={submitMutation.isPending}><Send className="w-4 h-4" /></Button>}
              {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && row.status === 'SUBMITTED' && <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate([row.id])} loading={approveMutation.isPending}><CheckCircle className="w-4 h-4 text-green-600" /></Button>}
              {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && row.status === 'APPROVED' && <Button variant="ghost" size="sm" onClick={() => publishMutation.mutate([row.id])} loading={publishMutation.isPending}><Award className="w-4 h-4 text-purple-600" /></Button>}
            </>
          )}
        </div>
      ),
    },
  ];

  const handleView = (mark: Mark) => { /* view detail */ };
  const handleEdit = (mark: Mark) => { setEditingMark(mark); setModalOpen(true); };

  const openCreateModal = () => { setEditingMark(null); reset({ studentId: '', examId: '', subjectId: '', obtainedMarks: 0, maxMarks: 100, remarks: '' }); setModalOpen(true); };

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors }, setValue, watch } = useForm<MarkForm>({
    resolver: zodResolver(markSchema),
  });

  const onSubmit = (data: MarkForm) => {
    if (editingMark) updateMutation.mutate({ id: editingMark.id, data });
    else createMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Results" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN', 'TEACHER']) && (
        <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Enter Marks</Button>
      )
    }>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Search marks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Select value={examFilter} onChange={(e) => { setExamFilter(e.target.value); setSubjectFilter(''); }} options={[{ value: '', label: 'All Exams' }, ...(exams?.map((e: any) => ({ value: e.id, label: e.name })) || [])]} placeholder="Filter by exam" />
              <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} options={[{ value: '', label: 'All Subjects' }, ...(subjects || [])]} placeholder="Filter by subject" disabled={!examFilter} />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Status' }, { value: 'DRAFT', label: 'Draft' }, { value: 'SUBMITTED', label: 'Submitted' }, { value: 'APPROVED', label: 'Approved' }, { value: 'PUBLISHED', label: 'Published' }]} placeholder="Filter by status" />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!examFilter || !subjectFilter) && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select exam and subject</h3>
              <p className="text-gray-500">Choose an exam and subject to view or enter marks</p>
            </div>
          )}

          {examFilter && subjectFilter && (
            <>
              <Table columns={columns} data={marksData?.data || []} keyExtractor={(row) => row.id} loading={isLoading} emptyMessage="No marks found" striped hoverable />
              {marksData && <Pagination currentPage={page} totalPages={marksData.meta.totalPages} onPageChange={setPage} total={marksData.meta.total} limit={marksData.meta.limit} />}
            </>
          )}

          {hasRole(['TEACHER']) && examFilter && subjectFilter && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-4">Bulk Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input label="Max Marks for all" type="number" defaultValue={100} onChange={(e) => setValue('maxMarks', parseInt(e.target.value))} />
              </div>
              <p className="text-sm text-gray-500 mb-4">Enter marks for each student:</p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {students?.map((student: any) => (
                  <div key={student.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    <span className="w-12 text-sm font-medium text-gray-500">{student.rollNumber}</span>
                    <span className="flex-1 font-medium">{student.firstName} {student.lastName}</span>
                    <Input
                      type="number"
                      min={0}
                      max={watch('maxMarks') || 100}
                      placeholder="Marks"
                      onChange={(e) => {
                        const marks = parseFloat(e.target.value) || 0;
                        // Store bulk marks in local state
                      }}
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => toast.success('Bulk entry feature - implement local state')}>Save All</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingMark(null); }} title={editingMark ? 'Edit Marks' : 'Enter Marks'} size="lg">
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Exam" error={errors.examId?.message} options={exams?.map((e: any) => ({ value: e.id, label: e.name })) || []} {...register('examId')} onChange={(e) => { setValue('examId', e.target.value); setValue('subjectId', ''); }} />
            <Select label="Subject" error={errors.subjectId?.message} options={subjects?.map((s: any) => ({ value: s.id, label: `${s.name} (${s.code})` })) || []} {...register('subjectId')} disabled={!examFilter} />
          </div>
          <Select label="Student" error={errors.studentId?.message} options={students?.map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (Roll: ${s.rollNumber})` })) || []} {...register('studentId')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Obtained Marks" type="number" min={0} error={errors.obtainedMarks?.message} {...register('obtainedMarks')} />
            <Input label="Max Marks" type="number" min={1} error={errors.maxMarks?.message} {...register('maxMarks')} />
          </div>
          <Input label="Remarks" {...register('remarks')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingMark(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingMark ? 'Update' : 'Save Marks'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
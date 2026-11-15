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
  Trash2,
  FileText,
  Calendar,
  Award,
  Clock,
  Download,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const examTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  weightage: z.coerce.number().min(1).max(100),
});

const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  examTypeId: z.string().uuid('Exam type is required'),
  academicYearId: z.string().uuid('Academic year is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type ExamTypeForm = z.infer<typeof examTypeSchema>;
type ExamForm = z.infer<typeof examSchema>;

interface ExamType { id: string; name: string; code: string; weightage: number; isActive: boolean; }
interface Exam {
  id: string;
  name: string;
  examTypeId: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: string;
  examType?: ExamType;
  academicYear?: { name: string };
  subjects?: any[];
}
interface AcademicYear { id: string; name: string; status: string; }

export default function ExamsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [activeTab, setActiveTab] = useState<'exams' | 'types'>('exams');

  const { data: examTypes } = useQuery({
    queryKey: ['exam-types'],
    queryFn: async () => { const res = await api.get('/exams/types'); return res.data; },
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => { const res = await api.get('/academic-years'); return res.data.data; },
  });

  const { data: examsData, isLoading } = useQuery({
    queryKey: ['exams', page, limit, search, examTypeFilter, academicYearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(examTypeFilter && { examTypeId: examTypeFilter }), ...(academicYearFilter && { academicYearId: academicYearFilter }) });
      const res = await api.get(`/exams?${params}`);
      return res.data;
    },
  });

  const createExamTypeMutation = useMutation({
    mutationFn: async (data: ExamTypeForm) => { const res = await api.post('/exams/types', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exam-types'] }); toast.success('Exam type created'); setModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to create exam type'),
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: ExamForm) => { const res = await api.post('/exams', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); toast.success('Exam created'); setModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to create exam'),
  });

  const updateExamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExamForm> }) => { const res = await api.patch(`/exams/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); toast.success('Exam updated'); setModalOpen(false); setEditingExam(null); },
    onError: (error: any) => toast.error(error.message || 'Failed to update exam'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/exams/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); toast.success('Exam deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete exam'),
  });

  const examColumns: Column<Exam>[] = [
    { key: 'name', header: 'Exam Name', accessor: 'name' },
    { key: 'examType', header: 'Type', render: (_, row) => row.examType?.name || '-' },
    { key: 'academicYear', header: 'Academic Year', render: (_, row) => row.academicYear?.name || '-' },
    { key: 'dates', header: 'Dates', render: (_, row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}` },
    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'SCHEDULED' ? 'info' : row.status === 'ONGOING' ? 'warning' : 'success'}>{row.status}</Badge> },
    { key: 'subjects', header: 'Subjects', render: (_, row) => row.subjects?.length || 0 },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(row)}><Eye className="w-4 h-4" /></Button>
          {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(row.id)} loading={deleteMutation.isPending} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const examTypeColumns: Column<ExamType>[] = [
    { key: 'name', header: 'Name', accessor: 'name' },
    { key: 'code', header: 'Code', accessor: 'code' },
    { key: 'weightage', header: 'Weightage %', accessor: 'weightage' },
    { key: 'isActive', header: 'Status', render: (_, row) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const handleView = (exam: Exam) => { /* view detail */ };
  const handleEdit = (exam: Exam) => { setEditingExam(exam); setModalOpen(true); };

  const openCreateExamModal = () => { setEditingExam(null); reset({ name: '', examTypeId: '', academicYearId: '', startDate: '', endDate: '' }); setModalOpen(true); };
  const openCreateTypeModal = () => { setEditingExam(null); reset({ name: '', code: '', weightage: 25 }); setModalOpen(true); };

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<ExamForm | ExamTypeForm>({
    resolver: zodResolver(activeTab === 'types' ? examTypeSchema : examSchema),
  });

  const onSubmit = (data: ExamForm | ExamTypeForm) => {
    if (activeTab === 'types') createExamTypeMutation.mutate(data as ExamTypeForm);
    else if (editingExam) updateExamMutation.mutate({ id: editingExam.id, data: data as ExamForm });
    else createExamMutation.mutate(data as ExamForm);
  };

  return (
    <DashboardLayout title="Exams" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
        <Button onClick={activeTab === 'types' ? openCreateTypeModal : openCreateExamModal}>
          <Plus className="w-4 h-4 mr-2" /> {activeTab === 'types' ? 'Add Exam Type' : 'Create Exam'}
        </Button>
      )
    }>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4" aria-label="Tabs">
          <button onClick={() => setActiveTab('exams')} className={cn('pb-3 px-1 text-sm font-medium border-b-2 transition-colors', activeTab === 'exams' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>Exams</button>
          <button onClick={() => setActiveTab('types')} className={cn('pb-3 px-1 text-sm font-medium border-b-2 transition-colors', activeTab === 'types' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>Exam Types</button>
        </nav>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search exams..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Select value={examTypeFilter} onChange={(e) => setExamTypeFilter(e.target.value)} options={[{ value: '', label: 'All Types' }, ...(examTypes?.map((t: any) => ({ value: t.id, label: t.name })) || [])]} placeholder="Filter by type" />
              <Select value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)} options={[{ value: '', label: 'All Years' }, ...(academicYears?.map((y: any) => ({ value: y.id, label: y.name })) || [])]} placeholder="Filter by year" />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'exams' ? (
            <Table columns={examColumns} data={examsData?.data || []} keyExtractor={(row) => row.id} loading={isLoading} emptyMessage="No exams found" striped hoverable />
          ) : (
            <Table columns={examTypeColumns} data={examTypes || []} keyExtractor={(row) => row.id} loading={false} emptyMessage="No exam types found" striped hoverable />
          )}
          {examsData && activeTab === 'exams' && <Pagination currentPage={page} totalPages={examsData.meta.totalPages} onPageChange={setPage} total={examsData.meta.total} limit={examsData.meta.limit} />}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingExam(null); }} title={activeTab === 'types' ? 'Create Exam Type' : editingExam ? 'Edit Exam' : 'Create Exam'} size="lg">
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          {activeTab === 'types' ? (
            <>
              <Input label="Name" error={errors.name?.message} {...register('name')} />
              <Input label="Code" error={errors.code?.message} {...register('code')} />
              <Input label="Weightage %" type="number" error={errors.weightage?.message} {...register('weightage')} />
            </>
          ) : (
            <>
              <Input label="Exam Name" error={errors.name?.message} {...register('name')} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select label="Exam Type" error={errors.examTypeId?.message} options={examTypes?.map((t: any) => ({ value: t.id, label: t.name })) || []} {...register('examTypeId')} />
                <Select label="Academic Year" error={errors.academicYearId?.message} options={academicYears?.map((y: any) => ({ value: y.id, label: y.name })) || []} {...register('academicYearId')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate')} />
                <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate')} />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingExam(null); }}>Cancel</Button>
            <Button type="submit" loading={createExamMutation.isPending || updateExamMutation.isPending || createExamTypeMutation.isPending}>{editingExam ? 'Update' : activeTab === 'types' ? 'Create Type' : 'Create Exam'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
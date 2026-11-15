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
  BookOpen,
  Users,
  GraduationCap,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  level: z.coerce.number().min(1).max(8),
  academicYearId: z.string().uuid('Academic year is required'),
  classTeacherId: z.string().optional(),
});

type ClassForm = z.infer<typeof classSchema>;

interface Class {
  id: string;
  name: string;
  level: number;
  academicYearId: string;
  classTeacherId: string | null;
  academicYear?: { name: string; status: string };
  classTeacher?: { user: { firstName: string; lastName: string } };
  _count?: { students: number; sections: number };
}

export default function ClassesPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get('/academic-years');
      return res.data.data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-for-class'],
    queryFn: async () => {
      const res = await api.get('/teachers', { params: { limit: 100, status: 'ACTIVE' } });
      return res.data.data;
    },
  });

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', page, limit, search, academicYearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(academicYearFilter && { academicYearId: academicYearFilter }),
      });
      const res = await api.get(`/classes?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClassForm) => {
      const res = await api.post('/classes', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
      setModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create class'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClassForm> }) => {
      const res = await api.patch(`/classes/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated successfully');
      setModalOpen(false);
      setEditingClass(null);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update class'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to delete class'),
  });

  const columns: Column<Class>[] = [
    { key: 'name', header: 'Class Name', accessor: 'name' },
    { key: 'level', header: 'Level', accessor: 'level' },
    { key: 'academicYear', header: 'Academic Year', render: (_, row) => row.academicYear?.name || '-' },
    { key: 'classTeacher', header: 'Class Teacher', render: (_, row) => row.classTeacher ? `${row.classTeacher.user.firstName} ${row.classTeacher.user.lastName}` : '-' },
    { key: 'students', header: 'Students', render: (_, row) => row._count?.students || 0 },
    { key: 'sections', header: 'Sections', render: (_, row) => row._count?.sections || 0 },
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

  const handleView = (cls: Class) => { /* view detail */ };
  const handleEdit = (cls: Class) => { setEditingClass(cls); setModalOpen(true); };

  const openCreateModal = () => {
    setEditingClass(null);
    reset({ name: '', level: 1, academicYearId: '', classTeacherId: '' });
    setModalOpen(true);
  };

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
  });

  const onSubmit = (data: ClassForm) => {
    if (editingClass) updateMutation.mutate({ id: editingClass.id, data });
    else createMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Classes" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
        <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Create Class</Button>
      )
    }>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Select value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)} options={[{ value: '', label: 'All Years' }, ...(academicYears?.map((y: any) => ({ value: y.id, label: y.name })) || [])]} placeholder="Filter by year" />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table columns={columns} data={classesData?.data || []} keyExtractor={(row) => row.id} loading={isLoading} emptyMessage="No classes found" striped hoverable />
          {classesData && <Pagination currentPage={page} totalPages={classesData.meta.totalPages} onPageChange={setPage} total={classesData.meta.total} limit={classesData.meta.limit} />}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingClass(null); }} title={editingClass ? 'Edit Class' : 'Create Class'}>
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <Input label="Class Name" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Level" error={errors.level?.message} options={Array.from({length: 8}, (_, i) => ({ value: String(i+1), label: `Class ${i+1}` }))} {...register('level')} />
            <Select label="Academic Year" error={errors.academicYearId?.message} options={academicYears?.map((y: any) => ({ value: y.id, label: y.name })) || []} {...register('academicYearId')} />
          </div>
          <Select label="Class Teacher" options={[{ value: '', label: 'None' }, ...(teachers?.map((t: any) => ({ value: t.id, label: `${t.user.firstName} ${t.user.lastName}` })) || [])]} {...register('classTeacherId')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingClass(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingClass ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
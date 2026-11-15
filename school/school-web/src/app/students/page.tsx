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
import { Badge, Avatar } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn, formatDate, getAttendanceColor, getStatusColor } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  rollNumber: z.coerce.number().min(1),
  admissionDate: z.string().min(1, 'Admission date is required'),
  classId: z.string().uuid('Class is required'),
  sectionId: z.string().uuid('Section is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  motherName: z.string().min(1, 'Mother name is required'),
  parentPhone: z.string().min(1, 'Parent phone is required'),
  parentEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  rollNumber: number;
  admissionDate: string;
  status: string;
  classId: string;
  sectionId: string;
  class?: { name: string; level: number };
  section?: { name: string };
  parent?: { user: { firstName: string; lastName: string } };
}

export default function StudentsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data.data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['sections', classFilter],
    queryFn: async () => {
      if (!classFilter) return [];
      const res = await api.get('/sections', { params: { classId: classFilter } });
      return res.data.data;
    },
    enabled: !!classFilter,
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', page, limit, search, classFilter, sectionFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(classFilter && { classId: classFilter }),
        ...(sectionFilter && { sectionId: sectionFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/students?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StudentForm) => {
      const res = await api.post('/students', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
      setModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create student'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentForm> }) => {
      const res = await api.patch(`/students/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
      setModalOpen(false);
      setEditingStudent(null);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update student'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deactivated');
      setDeleteConfirm(null);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to deactivate student'),
  });

  const columns: Column<Student>[] = [
    { key: 'admissionNo', header: 'Admission No', accessor: 'admissionNo' },
    {
      key: 'name',
      header: 'Student',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-gray-500">Roll: {row.rollNumber}</p>
          </div>
        </div>
      ),
    },
    { key: 'class', header: 'Class', render: (_, row) => `${row.class?.name || ''} - ${row.section?.name || ''}` },
    { key: 'gender', header: 'Gender', accessor: 'gender' },
    { key: 'parent', header: 'Parent', render: (_, row) => row.parent ? `${row.parent.user.firstName} ${row.parent.user.lastName}` : '-' },
    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>{row.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(row)}><Eye className="w-4 h-4" /></Button>
          {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(row)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleView = (student: Student) => {
    // Navigate to student detail page
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setDeleteConfirm(student);
  };

  const handleSubmit = (data: StudentForm) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const openCreateModal = () => {
    setEditingStudent(null);
    reset({
      admissionNo: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      rollNumber: 1,
      admissionDate: new Date().toISOString().split('T')[0],
      classId: '',
      sectionId: '',
      fatherName: '',
      motherName: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      bloodGroup: '',
      emergencyContact: '',
    });
    setModalOpen(true);
  };

  return (
    <DashboardLayout title="Students" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
        <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
      )
    }>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select
                value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); }}
                options={[{ value: '', label: 'All Classes' }, ...(classes?.map((c: any) => ({ value: c.id, label: c.name })) || [])]}
                placeholder="Filter by class"
              />
              <Select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                options={[{ value: '', label: 'All Sections' }, ...(sections?.map((s: any) => ({ value: s.id, label: s.name })) || [])]}
                placeholder="Filter by section"
                disabled={!classFilter}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'TRANSFERRED', label: 'Transferred' }, { value: 'DEACTIVATED', label: 'Deactivated' }]}
                placeholder="Filter by status"
              />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={studentsData?.data || []}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyMessage="No students found"
            onSort={() => {}}
            striped
            hoverable
          />
          {studentsData && (
            <Pagination
              currentPage={page}
              totalPages={studentsData.meta.totalPages}
              onPageChange={setPage}
              total={studentsData.meta.total}
              limit={studentsData.meta.limit}
            />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingStudent(null); }} title={editingStudent ? 'Edit Student' : 'Add Student'} size="lg">
        <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Admission No" error={errors.admissionNo?.message} {...register('admissionNo')} />
            <Input label="Roll Number" type="number" error={errors.rollNumber?.message} {...register('rollNumber')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
            <Select label="Gender" error={errors.gender?.message} options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} {...register('gender')} />
            <Input label="Blood Group" {...register('bloodGroup')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Class" error={errors.classId?.message} options={classes?.map((c: any) => ({ value: c.id, label: c.name })) || []} {...register('classId')} onChange={(e) => { setValue('classId', e.target.value); setValue('sectionId', ''); }} />
            <Select label="Section" error={errors.sectionId?.message} options={sections?.map((s: any) => ({ value: s.id, label: s.name })) || []} {...register('sectionId')} disabled={!classFilter} />
          </div>
          <Input label="Admission Date" type="date" error={errors.admissionDate?.message} {...register('admissionDate')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Father's Name" error={errors.fatherName?.message} {...register('fatherName')} />
            <Input label="Mother's Name" error={errors.motherName?.message} {...register('motherName')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Parent Phone" type="tel" error={errors.parentPhone?.message} {...register('parentPhone')} />
            <Input label="Parent Email" type="email" {...register('parentEmail')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Address" {...register('address')} />
            <Input label="Emergency Contact" {...register('emergencyContact')} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingStudent(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingStudent ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate Student" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to deactivate {deleteConfirm?.firstName} {deleteConfirm?.lastName}? This action can be reversed.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} loading={deleteMutation.isPending}>
            Deactivate
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
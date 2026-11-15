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
  Eye,
  Edit,
  Trash2,
  UserPlus,
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  Mail,
  Phone,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const teacherSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  qualification: z.string().optional(),
  experience: z.coerce.number().optional(),
  subjectIds: z.array(z.string()).optional(),
});

type TeacherForm = z.infer<typeof teacherSchema>;

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfJoining: string;
  qualification: string | null;
  experience: number | null;
  status: string;
  user: { firstName: string; lastName: string; email: string; phone: string; avatarUrl: string | null };
  assignments?: any[];
  subjects?: any[];
}

export default function TeachersPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers', page, limit, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/teachers?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TeacherForm) => {
      const res = await api.post('/teachers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher invited successfully');
      setModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create teacher'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeacherForm> }) => {
      const res = await api.patch(`/teachers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
      setModalOpen(false);
      setEditingTeacher(null);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update teacher'),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/teachers/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher approved');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to approve teacher'),
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/teachers/${id}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher suspended');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to suspend teacher'),
  });

  const columns: Column<Teacher>[] = [
    { key: 'employeeId', header: 'Employee ID', accessor: 'employeeId' },
    {
      key: 'name',
      header: 'Teacher',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.user.firstName} ${row.user.lastName}`} size="sm" src={row.user.avatarUrl} />
          <div>
            <p className="font-medium">{row.user.firstName} {row.user.lastName}</p>
            <p className="text-xs text-gray-500">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (_, row) => <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {row.user.email}</span> },
    { key: 'phone', header: 'Phone', render: (_, row) => <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {row.user.phone}</span> },
    { key: 'subjects', header: 'Subjects', render: (_, row) => row.subjects?.map((s: any) => s.name).join(', ') || '-' },
    { key: 'dateOfJoining', header: 'Joined', render: (_, row) => row.dateOfJoining.split('T')[0] },
    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'PENDING' ? 'warning' : 'danger'}>{row.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(row)}><Eye className="w-4 h-4" /></Button>
          {hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
            <>
              {row.status === 'PENDING' && (
                <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(row.id)} loading={approveMutation.isPending}>
                  <Badge variant="success" className="text-xs">Approve</Badge>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="w-4 h-4" /></Button>
              {row.status === 'ACTIVE' && (
                <Button variant="ghost" size="sm" onClick={() => suspendMutation.mutate(row.id)} loading={suspendMutation.isPending} className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const handleView = (teacher: Teacher) => { /* view detail */ };
  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTeacher(null);
    reset({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      qualification: '',
      experience: 0,
    });
    setModalOpen(true);
  };

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
  });

  const onSubmit = (data: TeacherForm) => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <DashboardLayout title="Teachers" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
        <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Invite Teacher</Button>
      )
    }>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'PENDING', label: 'Pending' }, { value: 'SUSPENDED', label: 'Suspended' }]} placeholder="Filter by status" />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={teachersData?.data || []}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyMessage="No teachers found"
            striped
            hoverable
          />
          {teachersData && (
            <Pagination currentPage={page} totalPages={teachersData.meta.totalPages} onPageChange={setPage} total={teachersData.meta.total} limit={teachersData.meta.limit} />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingTeacher(null); }} title={editingTeacher ? 'Edit Teacher' : 'Invite Teacher'} size="lg">
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Employee ID" error={errors.employeeId?.message} {...register('employeeId')} />
            <Input label="Date of Joining" type="date" error={errors.dateOfJoining?.message} {...register('dateOfJoining')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
          </div>
          {!editingTeacher && (
            <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Qualification" {...register('qualification')} />
            <Input label="Experience (years)" type="number" {...register('experience')} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingTeacher(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingTeacher ? 'Update' : 'Invite'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
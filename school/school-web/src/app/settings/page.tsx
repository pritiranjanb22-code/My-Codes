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
  User,
  Building2,
  Calendar,
  Bell,
  Shield,
  Key,
  Save,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const academicYearSchema = z.object({
  name: z.string().min(1, 'Name is required (e.g., 2024-2025)'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['UPCOMING', 'CURRENT', 'COMPLETED', 'ARCHIVED']),
});

const schoolSettingsSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  code: z.string().min(1, 'School code is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  registrationNo: z.string().optional(),
});

type AcademicYearForm = z.infer<typeof academicYearSchema>;
type SchoolSettingsForm = z.infer<typeof schoolSettingsSchema>;

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatarUrl: string | null;
}

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'school' | 'academic-years' | 'users' | 'notifications'>('profile');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => { const res = await api.get('/academic-years'); return res.data.data; },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-settings'],
    queryFn: async () => { const res = await api.get('/users', { params: { limit: 50 } }); return res.data; },
    enabled: hasRole(['SUPER_ADMIN', 'HEADMASTER']),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const res = await api.patch('/users/me', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Profile updated');
      setProfileModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.post('/auth/change-password', data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to change password'),
  });

  const createYearMutation = useMutation({
    mutationFn: async (data: AcademicYearForm) => { const res = await api.post('/academic-years', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-years'] }); toast.success('Academic year created'); setYearModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to create academic year'),
  });

  const updateYearMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AcademicYearForm> }) => { const res = await api.patch(`/academic-years/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-years'] }); toast.success('Academic year updated'); setYearModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to update academic year'),
  });

  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors }, setValue } = useForm<AcademicYearForm>({
    resolver: zodResolver(academicYearSchema),
  });

  const onYearSubmit = (data: AcademicYearForm) => {
    if (editingYear) updateYearMutation.mutate({ id: editingYear.id, data });
    else createYearMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-6xl mx-auto">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4 overflow-x-auto" aria-label="Settings tabs">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'school', label: 'School', icon: Building2 },
              { id: 'academic-years', label: 'Academic Years', icon: Calendar },
              { id: 'users', label: 'User Management', icon: UserPlus },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Profile Information</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar name={`${user?.firstName} ${user?.lastName}`} size="xl" src={user?.avatarUrl} />
                  <div>
                    <h3 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <p className="text-gray-600">{user?.phone}</p>
                    <Badge variant={user?.role === 'SUPER_ADMIN' ? 'danger' : user?.role === 'HEADMASTER' ? 'primary' : user?.role === 'TEACHER' ? 'info' : 'success'} className="mt-2">
                      {user?.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <Button variant="outline" onClick={() => setProfileModalOpen(true)}>Edit Profile</Button>
                  <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>Change Password</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Security</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Active Sessions</p>
                      <p className="text-sm text-gray-500">Manage your logged-in devices</p>
                    </div>
                    <Button variant="outline">View Sessions</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'school' && hasRole(['SUPER_ADMIN', 'HEADMASTER']) && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">School Settings</h2>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="School Name" defaultValue={user?.school?.name} />
                  <Input label="School Code" defaultValue={user?.school?.code} />
                </div>
                <Input label="Address" defaultValue={user?.school?.address} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Phone" type="tel" defaultValue={user?.school?.phone} />
                  <Input label="Email" type="email" defaultValue={user?.school?.email} />
                </div>
                <Input label="Registration Number" defaultValue={user?.school?.registrationNo} />
                <div className="flex justify-end">
                  <Button type="submit"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'academic-years' && hasRole(['SUPER_ADMIN', 'HEADMASTER']) && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Academic Years</h2>
                  <Button onClick={() => { setEditingYear(null); reset({ name: '', startDate: '', endDate: '', status: 'UPCOMING' }); setYearModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Year
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table
                  columns={[
                    { key: 'name', header: 'Name', accessor: 'name' },
                    { key: 'dates', header: 'Dates', render: (_, row) => `${row.startDate.split('T')[0]} - ${row.endDate.split('T')[0]}` },
                    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'CURRENT' ? 'success' : row.status === 'UPCOMING' ? 'info' : 'default'}>{row.status}</Badge> },
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (_, row) => (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingYear(row); setYearModalOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        </div>
                      ),
                    },
                  ]}
                  data={academicYears || []}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No academic years configured"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && hasRole(['SUPER_ADMIN', 'HEADMASTER']) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">User Management</h2>
                <Button onClick={() => toast.success('Invite user feature coming soon')}>
                  <Plus className="w-4 h-4 mr-2" /> Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table
                columns={[
                  { key: 'name', header: 'User', render: (_, row) => <div className="flex items-center gap-3"><Avatar name={`${row.firstName} ${row.lastName}`} size="sm" src={row.avatarUrl} /><div><p className="font-medium">{row.firstName} {row.lastName}</p><p className="text-xs text-gray-500">{row.email}</p></div></div> },
                  { key: 'role', header: 'Role', render: (_, row) => <Badge variant={row.role === 'SUPER_ADMIN' ? 'danger' : row.role === 'HEADMASTER' ? 'primary' : row.role === 'TEACHER' ? 'info' : 'success'}>{row.role}</Badge> },
                  { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'PENDING' ? 'warning' : 'danger'}>{row.status}</Badge> },
                  { key: 'school', header: 'School', render: (_, row) => row.school?.name || '-' },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (_, row) => (
                      <div className="flex items-center gap-2">
                        {row.status === 'PENDING' && <Button variant="ghost" size="sm" onClick={() => toast.success('Approve feature coming soon')}>Approve</Button>}
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    ),
                  },
                ]}
                data={usersData?.data || []}
                keyExtractor={(row) => row.id}
                emptyMessage="No users found"
              />
              {usersData && <Pagination currentPage={1} totalPages={usersData.meta.totalPages} onPageChange={() => {}} total={usersData.meta.total} limit={usersData.meta.limit} />}
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Email Notifications', description: 'Receive email updates for important events' },
                    { label: 'Push Notifications', description: 'Receive push notifications on mobile' },
                    { label: 'Attendance Alerts', description: 'Get notified when your child is marked absent' },
                    { label: 'Exam Results', description: 'Get notified when results are published' },
                    { label: 'Announcements', description: 'Receive school announcements' },
                    { label: 'Holiday Reminders', description: 'Get reminded about upcoming holidays' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleFormSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name" defaultValue={user?.firstName} {...register('firstName')} />
            <Input label="Last Name" defaultValue={user?.lastName} {...register('lastName')} />
          </div>
          <Input label="Phone" type="tel" defaultValue={user?.phone} {...register('phone')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setProfileModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={updateProfileMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Password">
        <form onSubmit={handleFormSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
          <Input label="Current Password" type="password" {...register('currentPassword')} />
          <Input label="New Password" type="password" {...register('newPassword')} />
          <Input label="Confirm New Password" type="password" {...register('confirmPassword')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={changePasswordMutation.isPending}>Change Password</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={yearModalOpen} onClose={() => { setYearModalOpen(false); setEditingYear(null); }} title={editingYear ? 'Edit Academic Year' : 'Create Academic Year'}>
        <form onSubmit={handleFormSubmit(onYearSubmit)} className="space-y-4">
          <Input label="Year Name (e.g., 2024-2025)" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Select label="Status" error={errors.status?.message} options={[{ value: 'UPCOMING', label: 'Upcoming' }, { value: 'CURRENT', label: 'Current' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'ARCHIVED', label: 'Archived' }]} {...register('status')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setYearModalOpen(false); setEditingYear(null); }}>Cancel</Button>
            <Button type="submit" loading={createYearMutation.isPending || updateYearMutation.isPending}>{editingYear ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function Pagination({ currentPage, totalPages, onPageChange, total, limit }: any) {
  return null;
}
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  Calendar,
  Download,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
});

type HolidayForm = z.infer<typeof holidaySchema>;

interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string | null;
  isRecurring: boolean;
}

export default function HolidaysPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const { data: holidaysData, isLoading } = useQuery({
    queryKey: ['holidays', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }) });
      const res = await api.get(`/holidays?${params}`);
      return res.data;
    },
  });

  const { data: upcomingHolidays } = useQuery({
    queryKey: ['upcoming-holidays'],
    queryFn: async () => { const res = await api.get('/holidays/upcoming', { params: { days: 30 } }); return res.data; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: HolidayForm) => { const res = await api.post('/holidays', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); queryClient.invalidateQueries({ queryKey: ['upcoming-holidays'] }); toast.success('Holiday created'); setModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to create holiday'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HolidayForm> }) => { const res = await api.patch(`/holidays/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); queryClient.invalidateQueries({ queryKey: ['upcoming-holidays'] }); toast.success('Holiday updated'); setModalOpen(false); setEditingHoliday(null); },
    onError: (error: any) => toast.error(error.message || 'Failed to update holiday'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/holidays/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); queryClient.invalidateQueries({ queryKey: ['upcoming-holidays'] }); toast.success('Holiday deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete holiday'),
  });

  const columns: Column<Holiday>[] = [
    { key: 'name', header: 'Holiday Name', accessor: 'name' },
    { key: 'dates', header: 'Dates', render: (_, row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}` },
    { key: 'description', header: 'Description', render: (_, row) => row.description || '-' },
    { key: 'isRecurring', header: 'Recurring', render: (_, row) => row.isRecurring ? 'Yes' : 'No' },
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

  const handleView = (holiday: Holiday) => { /* view detail */ };
  const handleEdit = (holiday: Holiday) => { setEditingHoliday(holiday); setModalOpen(true); };

  const openCreateModal = () => { setEditingHoliday(null); reset({ name: '', startDate: '', endDate: '', description: '' }); setModalOpen(true); };

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm<HolidayForm>({
    resolver: zodResolver(holidaySchema),
  });

  const onSubmit = (data: HolidayForm) => {
    if (editingHoliday) updateMutation.mutate({ id: editingHoliday.id, data });
    else createMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Holidays" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
        <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Add Holiday</Button>
      )
    }>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">Upcoming Holidays (30 days)</h2>
          </CardHeader>
          <CardContent>
            {upcomingHolidays?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming holidays</p>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays?.map((holiday: Holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-gray-500">{formatDate(holiday.startDate)} - {formatDate(holiday.endDate)}</p>
                    </div>
                    <Badge variant="primary">{holiday.isRecurring ? 'Recurring' : 'One-time'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick Stats</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Holidays</span>
                <span className="font-bold text-2xl">{holidaysData?.meta.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-bold text-xl text-primary-600">{upcomingHolidays?.filter((h: Holiday) => new Date(h.startDate).getMonth() === new Date().getMonth()).length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search holidays..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table columns={columns} data={holidaysData?.data || []} keyExtractor={(row) => row.id} loading={isLoading} emptyMessage="No holidays found" striped hoverable />
          {holidaysData && <Pagination currentPage={page} totalPages={holidaysData.meta.totalPages} onPageChange={setPage} total={holidaysData.meta.total} limit={holidaysData.meta.limit} />}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingHoliday(null); }} title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}>
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <Input label="Holiday Name" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End Date" type="date" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Input label="Description" {...register('description')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingHoliday(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingHoliday ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
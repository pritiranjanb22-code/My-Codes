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
  Bell,
  Users,
  GraduationCap,
  BookOpen,
  Download,
  Send,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  targetAudience: z.enum(['ALL_PARENTS', 'ALL_TEACHERS', 'ALL_STUDENTS', 'CLASS', 'SECTION']),
  targetClassId: z.string().optional(),
  targetSectionId: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  expiresAt: z.string().optional(),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  targetClassId: string | null;
  targetSectionId: string | null;
  attachmentUrl: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  author?: { firstName: string; lastName: string };
}

interface Class { id: string; name: string; }
interface Section { id: string; name: string; classId: string; }

export default function AnnouncementsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', page, limit, search, audienceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), ...(search && { search }), ...(audienceFilter && { targetAudience: audienceFilter }) });
      const res = await api.get(`/announcements?${params}`);
      return res.data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes-for-announcement'],
    queryFn: async () => { const res = await api.get('/classes'); return res.data.data; },
  });

  const { data: sections } = useQuery({
    queryKey: ['sections-for-announcement'],
    queryFn: async () => { const res = await api.get('/sections'); return res.data.data; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementForm) => { const res = await api.post('/announcements', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement created'); setModalOpen(false); },
    onError: (error: any) => toast.error(error.message || 'Failed to create announcement'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AnnouncementForm> }) => { const res = await api.patch(`/announcements/${id}`, data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement updated'); setModalOpen(false); setEditingAnnouncement(null); },
    onError: (error: any) => toast.error(error.message || 'Failed to update announcement'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/announcements/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement deleted'); },
    onError: (error: any) => toast.error(error.message || 'Failed to delete announcement'),
  });

  const columns: Column<Announcement>[] = [
    { key: 'title', header: 'Title', accessor: 'title' },
    { key: 'targetAudience', header: 'Audience', render: (_, row) => (
      <Badge variant={row.targetAudience === 'ALL_PARENTS' ? 'success' : row.targetAudience === 'ALL_TEACHERS' ? 'info' : 'primary'}>
        {row.targetAudience.replace('_', ' ')}
      </Badge>
    ) },
    { key: 'author', header: 'Author', render: (_, row) => row.author ? `${row.author.firstName} ${row.author.lastName}` : '-' },
    { key: 'publishedAt', header: 'Published', render: (_, row) => row.publishedAt ? formatDate(row.publishedAt) : 'Draft' },
    { key: 'expiresAt', header: 'Expires', render: (_, row) => row.expiresAt ? formatDate(row.expiresAt) : 'Never' },
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

  const handleView = (announcement: Announcement) => { /* view detail */ };
  const handleEdit = (announcement: Announcement) => { setEditingAnnouncement(announcement); setModalOpen(true); };

  const openCreateModal = () => { setEditingAnnouncement(null); reset({ title: '', content: '', targetAudience: 'ALL_PARENTS', targetClassId: '', targetSectionId: '', attachmentUrl: '', expiresAt: '' }); setModalOpen(true); };

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors }, setValue, watch } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
  });

  const onSubmit = (data: AnnouncementForm) => {
    if (editingAnnouncement) updateMutation.mutate({ id: editingAnnouncement.id, data });
    else createMutation.mutate(data);
  };

  const audience = watch('targetAudience');
  const showClassSelect = audience === 'CLASS';
  const showSectionSelect = audience === 'SECTION' || audience === 'CLASS';

  return (
    <DashboardLayout title="Announcements" action={
      hasRole(['HEADMASTER', 'SUPER_ADMIN']) && (
        <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Create Announcement</Button>
      )
    }>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Input placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
              <Select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} options={[{ value: '', label: 'All Audiences' }, { value: 'ALL_PARENTS', label: 'All Parents' }, { value: 'ALL_TEACHERS', label: 'All Teachers' }, { value: 'ALL_STUDENTS', label: 'All Students' }, { value: 'CLASS', label: 'Specific Class' }, { value: 'SECTION', label: 'Specific Section' }]} placeholder="Filter by audience" />
            </div>
            <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table columns={columns} data={announcementsData?.data || []} keyExtractor={(row) => row.id} loading={isLoading} emptyMessage="No announcements found" striped hoverable />
          {announcementsData && <Pagination currentPage={page} totalPages={announcementsData.meta.totalPages} onPageChange={setPage} total={announcementsData.meta.total} limit={announcementsData.meta.limit} />}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingAnnouncement(null); }} title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'} size="lg">
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <textarea label="Content" error={errors.content?.message} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" {...register('content')} />
          <Select label="Target Audience" error={errors.targetAudience?.message} options={[
            { value: 'ALL_PARENTS', label: 'All Parents' },
            { value: 'ALL_TEACHERS', label: 'All Teachers' },
            { value: 'ALL_STUDENTS', label: 'All Students' },
            { value: 'CLASS', label: 'Specific Class' },
            { value: 'SECTION', label: 'Specific Section' },
          ]} {...register('targetAudience')} onChange={(e) => { setValue('targetAudience', e.target.value); setValue('targetClassId', ''); setValue('targetSectionId', ''); }} />
          {showClassSelect && (
            <Select label="Target Class" error={errors.targetClassId?.message} options={[{ value: '', label: 'Select Class' }, ...(classes?.map((c: any) => ({ value: c.id, label: c.name })) || [])]} {...register('targetClassId')} onChange={(e) => { setValue('targetClassId', e.target.value); setValue('targetSectionId', ''); }} />
          )}
          {showSectionSelect && (
            <Select label="Target Section" error={errors.targetSectionId?.message} options={[{ value: '', label: 'Select Section' }, ...(showClassSelect && audience === 'CLASS' ? sections?.filter((s: any) => s.classId === watch('targetClassId')).map((s: any) => ({ value: s.id, label: s.name })) || [] : sections?.map((s: any) => ({ value: s.id, label: s.name })) || [])]} {...register('targetSectionId')} disabled={!watch('targetClassId') && audience === 'CLASS'} />
          )}
          <Input label="Attachment URL (optional)" type="url" placeholder="https://example.com/file.pdf" {...register('attachmentUrl')} />
          <Input label="Expires At (optional)" type="datetime-local" {...register('expiresAt')} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingAnnouncement(null); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingAnnouncement ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
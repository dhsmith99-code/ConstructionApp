import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Pencil, Trash2, Plus, Camera, ClipboardCheck,
  MapPin, Calendar, User, FileText, ShoppingCart, Palette, CalendarDays,
  TrendingUp, FolderOpen,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoUploader from '@/components/photos/PhotoUploader';
import PunchItemCard from '@/components/punch/PunchItemCard';
import PunchItemDialog from '@/components/punch/PunchItemDialog';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import EmptyState from '@/components/EmptyState';
import PlansTab from '@/components/plans/PlansTab';
import PurchaseOrdersTab from '@/components/purchase-orders/PurchaseOrdersTab';
import SelectionsTab from '@/components/selections/SelectionsTab';
import ScheduleTab from '@/components/schedule/ScheduleTab';
import SalesLeadTab from '@/components/sales/SalesLeadTab';
import JobFilesTab from '@/components/job-files/JobFilesTab';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-amber-100 text-amber-800',
  planning: 'bg-purple-100 text-purple-800',
};

const formatDate = (d) => {
  if (!d) return null;
  try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d; }
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [punchOpen, setPunchOpen] = useState(false);
  const [editingPunch, setEditingPunch] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.list().then((list) => list.find((p) => p.id === id)),
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['photos', id],
    queryFn: () => base44.entities.Photo.filter({ project_id: id }, '-created_date'),
  });

  const { data: punchItems = [] } = useQuery({
    queryKey: ['punch', id],
    queryFn: () => base44.entities.PunchItem.filter({ project_id: id }, '-updated_date'),
  });

  const refreshPhotos = () => qc.invalidateQueries({ queryKey: ['photos', id] });
  const refreshPunch = () => qc.invalidateQueries({ queryKey: ['punch', id] });
  const refreshProject = () => qc.invalidateQueries({ queryKey: ['project', id] });

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project? This does not delete its photos or punch items.')) return;
    await base44.entities.Project.delete(id);
    navigate('/projects');
  };

  const handleTogglePunch = async (item) => {
    const newStatus = item.status === 'completed' ? 'open' : 'completed';
    const patch = { status: newStatus };
    if (newStatus === 'completed') patch.completed_date = new Date().toISOString().split('T')[0];
    await base44.entities.PunchItem.update(item.id, patch);
    refreshPunch();
  };

  const handleDeletePunch = async (item) => {
    if (!confirm('Delete this punch item?')) return;
    await base44.entities.PunchItem.delete(item.id);
    refreshPunch();
  };

  const openPunch = punchItems.filter((i) => i.status !== 'completed');

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Back & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteProject} className="text-destructive border-destructive/30 hover:bg-destructive/5">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground flex-1">
            {project.name}
          </h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[project.status] || 'bg-muted text-muted-foreground'}`}>
            {project.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {project.client && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5" /> {project.client}
            </span>
          )}
          {project.address && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {project.address}
            </span>
          )}
          {project.budget && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Budget: {project.budget}
            </span>
          )}
          {project.created_date && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(project.created_date)}
            </span>
          )}
        </div>

        {project.notes && (
          <p className="mt-4 text-sm text-muted-foreground max-w-2xl bg-muted/50 rounded-xl p-4">
            {project.notes}
          </p>
        )}

        {/* Quick Stats */}
        <div className="flex gap-4 mt-5">
          <div className="flex items-center gap-1.5 text-sm">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{photos.length}</span>
            <span className="text-muted-foreground">photos</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{openPunch.length}</span>
            <span className="text-muted-foreground">open items</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales-lead">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="sales-lead"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Sales Lead</TabsTrigger>
          <TabsTrigger value="job-files"><FolderOpen className="w-3.5 h-3.5 mr-1.5" />Job Files</TabsTrigger>
          <TabsTrigger value="photos"><Camera className="w-3.5 h-3.5 mr-1.5" />Photos</TabsTrigger>
          <TabsTrigger value="punch"><ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />Punch List</TabsTrigger>
          <TabsTrigger value="plans"><FileText className="w-3.5 h-3.5 mr-1.5" />Plans</TabsTrigger>
          <TabsTrigger value="purchase-orders"><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Purchase Orders</TabsTrigger>
          <TabsTrigger value="selections"><Palette className="w-3.5 h-3.5 mr-1.5" />Selections</TabsTrigger>
          <TabsTrigger value="schedule"><CalendarDays className="w-3.5 h-3.5 mr-1.5" />Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="sales-lead">
          <SalesLeadTab project={project} onSaved={refreshProject} />
        </TabsContent>

        <TabsContent value="job-files">
          <JobFilesTab projectId={id} />
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setPhotoOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Photo
            </Button>
          </div>
          {photos.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No photos yet"
              description="Document site progress with photos."
              action={<Button size="sm" onClick={() => setPhotoOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Photo</Button>}
            />
          ) : (
            <PhotoGrid photos={photos} onDeleted={refreshPhotos} />
          )}
        </TabsContent>

        {/* Punch List Tab */}
        <TabsContent value="punch">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => { setEditingPunch(null); setPunchOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> New Item
            </Button>
          </div>
          {punchItems.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No punch items"
              description="Add items to track as you walk the site."
              action={<Button size="sm" onClick={() => setPunchOpen(true)}><Plus className="w-4 h-4 mr-1" />New Item</Button>}
            />
          ) : (
            <div className="space-y-3">
              {punchItems.map((item, i) => (
                <PunchItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  onToggle={handleTogglePunch}
                  onEdit={(it) => { setEditingPunch(it); setPunchOpen(true); }}
                  onDelete={handleDeletePunch}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans">
          <PlansTab projectId={id} />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersTab projectId={id} />
        </TabsContent>

        <TabsContent value="selections">
          <SelectionsTab projectId={id} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab projectId={id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PhotoUploader open={photoOpen} onOpenChange={setPhotoOpen} projectId={id} onUploaded={refreshPhotos} />
      <PunchItemDialog
        open={punchOpen}
        onOpenChange={setPunchOpen}
        item={editingPunch}
        projects={[project]}
        onSaved={refreshPunch}
      />
      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} onSaved={refreshProject} />
    </div>
  );
}

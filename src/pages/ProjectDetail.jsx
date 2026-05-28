import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Pencil, Trash2, Plus, Camera, ClipboardCheck,
  MapPin, Calendar, User, FileText, ShoppingCart, Palette, CalendarDays,
  TrendingUp, FolderOpen, HardHat, Star, ArrowRight, Sparkles,
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
import LeadRatingTab from '@/components/sales/LeadRatingTab';
import JobFilesTab from '@/components/job-files/JobFilesTab';
import RenderingsTab from '@/components/renderings/RenderingsTab';
import { useRole } from '@/lib/RoleContext';

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
  const { isManagement, isSales, isConstruction, canSeePhase } = useRole();

  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [punchOpen, setPunchOpen] = useState(false);
  const [editingPunch, setEditingPunch] = useState(null);
  const [promoting, setPromoting] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () =>
      base44.entities.Project.list().then(list => list.find(p => p.id === id)),
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

  // Management: promote job from sales → construction
  const handlePromoteToConstruction = async () => {
    if (!confirm(`Move "${project.name}" to Construction?\n\nThis will make the job visible to the construction team.`)) return;
    setPromoting(true);
    try {
      await base44.entities.Project.update(id, { phase: 'construction', status: 'active' });
      refreshProject();
    } finally {
      setPromoting(false);
    }
  };

  const openPunch = punchItems.filter(i => i.status !== 'completed');

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const phase = project.phase ?? 'sales';
  const isSalesPhase = phase === 'sales';
  const isConstructionPhase = phase === 'construction';

  // Redirect construction workers away from sales-phase jobs
  // (shouldn't happen since they're filtered on the projects list, but safety net)
  if (isConstruction && isSalesPhase) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">This project is not available.</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  // Determine which tabs to show based on phase and role
  const showSalesTabs = isSalesPhase && (isManagement || isSales);
  const showConstructionTabs = isConstructionPhase || isManagement;

  const defaultTab = isSalesPhase ? 'sales-lead' : 'photos';

  return (
    <div>
      {/* Back & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/projects"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          {(isManagement || isSales) && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          )}
          {isManagement && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteProject}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2">
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-foreground flex-1">
            {project.name}
          </h1>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`text-sm px-3 py-1 font-medium ${STATUS_COLORS[project.status] || 'bg-muted text-muted-foreground'}`}
            >
              {project.status}
            </span>
            {/* Phase badge */}
            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 border ${
                isConstructionPhase
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isConstructionPhase
                ? <><HardHat className="w-3 h-3" /> Construction</>
                : <><TrendingUp className="w-3 h-3" /> Sales</>}
            </span>
          </div>
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
          <p className="mt-4 text-sm text-muted-foreground max-w-2xl bg-muted/50 p-4">
            {project.notes}
          </p>
        )}

        {/* ── Management: Promote to Construction banner ── */}
        {isManagement && isSalesPhase && (
          <div className="mt-5 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200">
            <TrendingUp className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">This job is in the Sales phase</p>
              <p className="text-xs text-amber-700">
                Move it to Construction when the job is won to make it visible to the construction team.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handlePromoteToConstruction}
              disabled={promoting}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              <HardHat className="w-3.5 h-3.5 mr-1.5" />
              {promoting ? 'Moving…' : 'Move to Construction'}
            </Button>
          </div>
        )}

        {/* Quick Stats (construction phase) */}
        {isConstructionPhase && (
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
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">

          {/* Sales-phase tabs */}
          {showSalesTabs && (
            <>
              <TabsTrigger value="sales-lead">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />Sales Lead
              </TabsTrigger>
              <TabsTrigger value="lead-rating">
                <Star className="w-3.5 h-3.5 mr-1.5" />Lead Rating
              </TabsTrigger>
            </>
          )}

          {/* Job Files — visible in both phases */}
          <TabsTrigger value="job-files">
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />Job Files
          </TabsTrigger>

          {/* Construction-phase tabs */}
          {/* AI Renderings — available in both phases (useful for sales presentations too) */}
          <TabsTrigger value="renderings">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />Renderings
          </TabsTrigger>

          {showConstructionTabs && (
            <>
              <TabsTrigger value="photos">
                <Camera className="w-3.5 h-3.5 mr-1.5" />Photos
              </TabsTrigger>
              <TabsTrigger value="punch">
                <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />Punch List
              </TabsTrigger>
              <TabsTrigger value="plans">
                <FileText className="w-3.5 h-3.5 mr-1.5" />Plans
              </TabsTrigger>
              <TabsTrigger value="purchase-orders">
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Purchase Orders
              </TabsTrigger>
              <TabsTrigger value="selections">
                <Palette className="w-3.5 h-3.5 mr-1.5" />Selections
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />Schedule
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Sales Lead */}
        {showSalesTabs && (
          <>
            <TabsContent value="sales-lead">
              <SalesLeadTab project={project} onSaved={refreshProject} />
            </TabsContent>
            <TabsContent value="lead-rating">
              <LeadRatingTab project={project} onSaved={refreshProject} />
            </TabsContent>
          </>
        )}

        {/* Job Files */}
        <TabsContent value="job-files">
          <JobFilesTab projectId={id} />
        </TabsContent>

        {/* AI Renderings */}
        <TabsContent value="renderings">
          <RenderingsTab projectId={id} />
        </TabsContent>

        {/* Construction tabs */}
        {showConstructionTabs && (
          <>
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
                  action={
                    <Button size="sm" onClick={() => setPhotoOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />Add Photo
                    </Button>
                  }
                />
              ) : (
                <PhotoGrid photos={photos} onDeleted={refreshPhotos} />
              )}
            </TabsContent>

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
                  action={
                    <Button size="sm" onClick={() => setPunchOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />New Item
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {punchItems.map((item, i) => (
                    <PunchItemCard
                      key={item.id}
                      item={item}
                      index={i}
                      onToggle={handleTogglePunch}
                      onEdit={it => { setEditingPunch(it); setPunchOpen(true); }}
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
          </>
        )}
      </Tabs>

      {/* Dialogs */}
      <PhotoUploader
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        projectId={id}
        onUploaded={refreshPhotos}
      />
      <PunchItemDialog
        open={punchOpen}
        onOpenChange={setPunchOpen}
        item={editingPunch}
        projects={[project]}
        onSaved={refreshPunch}
      />
      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSaved={refreshProject}
      />
    </div>
  );
}

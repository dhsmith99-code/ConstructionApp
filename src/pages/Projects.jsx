import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';
import { useRole } from '@/lib/RoleContext';

export default function Projects() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();
  const { canSeePhase, isManagement, isSales } = useRole();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  // Filter to only phases visible for this role
  const visibleProjects = projects.filter(p => canSeePhase(p.phase));

  const refresh = () => qc.invalidateQueries({ queryKey: ['projects'] });

  const handleEdit = (project) => { setEditing(project); setOpen(true); };

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await base44.entities.Project.delete(project.id);
    refresh();
  };

  const phaseLabel = isManagement ? 'All Projects' : isSales ? 'Sales Pipeline' : 'Construction Jobs';

  return (
    <div>
      <PageHeader
        eyebrow={phaseLabel}
        title="Projects"
        description={
          isManagement
            ? 'All projects across sales and construction.'
            : isSales
            ? 'Leads and proposals in the sales pipeline.'
            : 'Active construction jobs assigned to your team.'
        }
        action={
          (isManagement || isSales) ? (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          ) : null
        }
      />

      {/* Phase summary for management */}
      {isManagement && projects.length > 0 && (
        <div className="flex gap-6 mb-6 text-sm">
          <span className="text-muted-foreground">
            Sales: <strong className="text-foreground">
              {projects.filter(p => (p.phase ?? 'sales') === 'sales').length}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Construction: <strong className="text-foreground">
              {projects.filter(p => p.phase === 'construction').length}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground">{projects.length}</strong>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse" />
          ))}
        </div>
      ) : visibleProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects"
          description={
            isSales
              ? 'Create your first sales lead to get started.'
              : isManagement
              ? 'Create your first project to get started.'
              : 'No construction jobs have been assigned to construction yet.'
          }
          action={
            (isManagement || isSales) ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              delay={i * 0.05}
              onEdit={isManagement || isSales ? handleEdit : null}
              onDelete={isManagement ? handleDelete : null}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={open}
        onOpenChange={setOpen}
        project={editing}
        onSaved={refresh}
      />
    </div>
  );
}

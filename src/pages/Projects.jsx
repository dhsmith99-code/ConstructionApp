import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import PageHeader from '@/components/PageHeader';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';

export default function Projects() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['projects'] });

  const handleEdit = (project) => {
    setEditing(project);
    setOpen(true);
  };

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await base44.entities.Project.delete(project.id);
    refresh();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Projects"
        description="All your construction projects in one place."
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              delay={i * 0.05}
              onEdit={handleEdit}
              onDelete={handleDelete}
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

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import PageHeader from '@/components/PageHeader';
import PhotoGrid from '@/components/photos/PhotoGrid';
import PhotoUploader from '@/components/photos/PhotoUploader';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Plus } from 'lucide-react';

export default function Photos() {
  const [open, setOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('all');
  const qc = useQueryClient();

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => base44.entities.Photo.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const filtered = useMemo(() => {
    if (projectFilter === 'all') return photos;
    return photos.filter((p) => p.project_id === projectFilter);
  }, [photos, projectFilter]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['photos'] });

  return (
    <div>
      <PageHeader
        eyebrow="Site"
        title="Photos"
        description="Document progress with site photos."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Photo
          </Button>
        }
      />

      {projects.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground shrink-0">Filter by project:</label>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-none bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Camera}
          title={projectFilter === 'all' ? 'No photos yet' : 'No photos for this project'}
          description="Add photos to document site progress."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Photo
            </Button>
          }
        />
      ) : (
        <PhotoGrid photos={filtered} onDeleted={refresh} />
      )}

      <PhotoUploader open={open} onOpenChange={setOpen} onUploaded={refresh} />
    </div>
  );
}

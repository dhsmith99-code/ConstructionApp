import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhotoGrid({ photos = [], onDeleted }) {
  const [lightbox, setLightbox] = useState(null);
  const qc = useQueryClient();

  const handleDelete = async (photo) => {
    if (!confirm('Delete this photo?')) return;
    await base44.entities.Photo.delete(photo.id);
    qc.invalidateQueries({ queryKey: ['photos'] });
    onDeleted?.();
  };

  if (!photos.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              src={photo.url}
              alt={photo.caption || 'Site photo'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => setLightbox(photo)}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={() => handleDelete(photo)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {photo.caption && (
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-xs line-clamp-1">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.caption || ''}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="absolute bottom-6 text-white/80 text-sm">{lightbox.caption}</p>
          )}
        </div>
      )}
    </>
  );
}

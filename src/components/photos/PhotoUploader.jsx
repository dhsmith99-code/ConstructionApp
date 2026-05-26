import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera } from 'lucide-react';

export default function PhotoUploader({ open, onOpenChange, projectId, onUploaded }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Photo.create({
        url: url.trim(),
        caption: caption.trim() || undefined,
        project_id: projectId || undefined,
      });
      setUrl('');
      setCaption('');
      onUploaded?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" /> Add Photo
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Photo URL *</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Caption</label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe this photo…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !url.trim()}>
              {saving ? 'Adding…' : 'Add Photo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

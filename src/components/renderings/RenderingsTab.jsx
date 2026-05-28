import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db as base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Sparkles, Trash2, Download, Loader2, ImageOff,
  Maximize2, X, FileText, Palette, ChevronDown, ChevronUp,
  CheckSquare, Square, Eye, RefreshCw,
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

// ─── PDF thumbnail renderer ───────────────────────────────────────────────────
function PdfThumbnail({ url, pageNum = 1, onTextExtracted }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        const page = await pdf.getPage(Math.min(pageNum, pdf.numPages));
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const task = page.render({ canvasContext: ctx, viewport });
        await task.promise;

        // Extract text for room labels / dimensions
        if (onTextExtracted) {
          const textContent = await page.getTextContent();
          const text = textContent.items.map(i => i.str).join(' ').trim();
          if (!cancelled) onTextExtracted(text);
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [url, pageNum]);

  if (!url) return null;

  return (
    <div className="relative border border-border bg-white overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-auto block" />
    </div>
  );
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPromptFromProject({ roomLabel, planDescription, planText, selections, style, lighting, angle, customNotes }) {
  const parts = [];

  // Opening line
  const room = roomLabel || 'interior room';
  parts.push(`photorealistic interior design rendering of a ${style ? style + ' style ' : ''}${room}`);

  // Materials from selections — most important part
  if (selections.length > 0) {
    const grouped = {};
    selections.forEach(s => {
      const cat = (s.category || 'Material').toLowerCase();
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push([s.item, s.notes].filter(Boolean).join(' — '));
    });

    // Map common category names to render-friendly descriptions
    const mappings = {
      flooring:      v => `${v} flooring`,
      floor:         v => `${v} flooring`,
      'wood floor':  v => `${v} flooring`,
      paint:         v => `walls painted ${v}`,
      'wall color':  v => `${v} walls`,
      walls:         v => `${v} walls`,
      ceiling:       v => `${v} ceiling`,
      cabinets:      v => `${v} cabinetry`,
      cabinetry:     v => `${v} cabinetry`,
      countertops:   v => `${v} countertops`,
      countertop:    v => `${v} countertops`,
      backsplash:    v => `${v} backsplash`,
      fixtures:      v => `${v} fixtures`,
      lighting:      v => `${v} lighting`,
      trim:          v => `${v} trim and millwork`,
      hardware:      v => `${v} hardware`,
      appliances:    v => `${v} appliances`,
      tile:          v => `${v} tile`,
      doors:         v => `${v} doors`,
      windows:       v => `${v} windows`,
    };

    Object.entries(grouped).forEach(([cat, values]) => {
      values.forEach(v => {
        const fn = Object.entries(mappings).find(([k]) => cat.includes(k))?.[1];
        parts.push(fn ? fn(v) : `${cat}: ${v}`);
      });
    });
  }

  // Plan description
  if (planDescription) parts.push(planDescription);

  // Extracted PDF text — add dimension clues if present
  if (planText) {
    const dimMatch = planText.match(/\d+['′][-\s]?\d*["″]?/g);
    if (dimMatch && dimMatch.length > 0) {
      parts.push(`room dimensions approximately ${dimMatch.slice(0, 4).join(' x ')}`);
    }
  }

  // Lighting / time of day
  if (lighting) parts.push(lighting);

  // Camera angle
  if (angle) parts.push(angle);

  // Custom notes
  if (customNotes?.trim()) parts.push(customNotes.trim());

  // Quality keywords
  parts.push(
    'professionally furnished and decorated',
    'architectural visualization, interior design magazine quality',
    '8k uhd, hyperrealistic, photorealistic, no people, no text'
  );

  return parts.join(', ');
}

function buildNegativePrompt() {
  return 'people, text, watermark, blurry, distorted, ugly, deformed, cartoon, sketch, low quality, oversaturated, window exterior view';
}

function buildImageUrl(prompt, seed) {
  const enc = encodeURIComponent(prompt);
  const neg = encodeURIComponent(buildNegativePrompt());
  return `https://image.pollinations.ai/prompt/${enc}?width=1024&height=768&nologo=true&seed=${seed}&negative=${neg}&model=flux`;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>
      <img src={src} alt="Rendering" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
    </div>
  );
}

// ─── Rendering card ───────────────────────────────────────────────────────────
function RenderingCard({ rendering, onDelete }) {
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(rendering.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rendering-${rendering.room_type?.replace(/\s+/g, '-').toLowerCase() ?? 'room'}-${rendering.seed}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(rendering.image_url, '_blank');
    }
  };

  return (
    <div className="border border-border bg-card overflow-hidden group">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {!loaded && !errored && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-xs">Loading rendering…</p>
          </div>
        )}
        {errored && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="w-6 h-6" />
            <p className="text-xs">Failed to load</p>
          </div>
        )}
        <img
          src={rendering.image_url}
          alt={rendering.room_type}
          className={cn('w-full h-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(true); }}
        />
        {loaded && !errored && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button onClick={() => setLightbox(true)} className="bg-white/90 p-2 hover:bg-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">{rendering.room_type || 'Room Rendering'}</p>
        {rendering.features && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{rendering.features}</p>}
        <div className="flex justify-end gap-1 mt-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(rendering)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {lightbox && <Lightbox src={rendering.image_url} onClose={() => setLightbox(false)} />}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const LIGHTING_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'bright natural daylight streaming through windows', label: 'Morning Light' },
  { value: 'warm afternoon golden hour sunlight', label: 'Afternoon' },
  { value: 'soft evening ambient lighting with warm lamps', label: 'Evening' },
  { value: 'overcast diffused natural light', label: 'Overcast' },
];

const ANGLE_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'wide angle perspective shot showing the entire room', label: 'Wide Room' },
  { value: 'from the doorway looking into the room', label: 'From Doorway' },
  { value: 'corner perspective showing two walls', label: 'Corner View' },
  { value: 'close-up detail shot of the featured elements', label: 'Detail' },
];

const STYLE_OPTIONS = [
  '', 'modern', 'contemporary', 'traditional', 'farmhouse',
  'industrial', 'scandinavian', 'coastal', 'craftsman', 'transitional',
];

export default function RenderingsTab({ projectId }) {
  const qc = useQueryClient();

  // Project data
  const { data: plans = [] } = useQuery({
    queryKey: ['plans', projectId],
    queryFn: () => base44.entities.Plan.filter({ project_id: projectId }),
  });

  const { data: selections = [] } = useQuery({
    queryKey: ['selections', projectId],
    queryFn: () => base44.entities.Selection.filter({ project_id: projectId }),
  });

  const { data: renderings = [] } = useQuery({
    queryKey: ['renderings', projectId],
    queryFn: () => base44.entities.Rendering.filter({ project_id: projectId }, '-created_date'),
  });

  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planPage, setPlanPage] = useState(1);
  const [planText, setPlanText] = useState('');
  const [roomLabel, setRoomLabel] = useState('');
  const [includedSelections, setIncludedSelections] = useState(new Set());
  const [style, setStyle] = useState('');
  const [lighting, setLighting] = useState('');
  const [angle, setAngle] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptOverride, setPromptOverride] = useState('');

  const [generating, setGenerating] = useState(false);

  // Auto-select all approved/pending selections on load
  useEffect(() => {
    const ids = new Set(
      selections.filter(s => s.status !== 'rejected').map(s => s.id)
    );
    setIncludedSelections(ids);
  }, [selections]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const activeSelections = selections.filter(s => includedSelections.has(s.id));

  // Extract unique room names from selections notes ("Room: X |...")
  const roomsFromSelections = [...new Set(
    selections
      .map(s => s.notes?.match(/^Room:\s*([^|]+)/)?.[1]?.trim())
      .filter(Boolean)
  )];

  // Common room presets always available as fallback
  const COMMON_ROOMS = ['Kitchen', 'Living Room', 'Master Bedroom', 'Primary Bath', 'Guest Bath', 'Dining Room', 'Office', 'Laundry Room'];
  // Merge: selections rooms first (project-specific), then any common rooms not already listed
  const roomOptions = [...new Set([...roomsFromSelections, ...COMMON_ROOMS])];

  const toggleSelection = (id) =>
    setIncludedSelections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const builtPrompt = buildPromptFromProject({
    roomLabel,
    planDescription: selectedPlan?.description,
    planText,
    selections: activeSelections,
    style,
    lighting,
    angle,
    customNotes,
  });

  const finalPrompt = promptOverride || builtPrompt;

  const handleGenerate = async () => {
    setGenerating(true);
    const seed = Math.floor(Math.random() * 9_999_999);
    const imageUrl = buildImageUrl(finalPrompt, seed);

    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      await base44.entities.Rendering.create({
        project_id: projectId,
        room_type: roomLabel || (selectedPlan ? selectedPlan.name : 'Room'),
        style,
        color_palette: '',
        features: activeSelections.map(s => `${s.category}: ${s.item}`).join(' | '),
        custom_notes: customNotes,
        image_url: imageUrl,
        seed,
        prompt: finalPrompt,
      });

      qc.invalidateQueries({ queryKey: ['renderings', projectId] });
    } catch (e) {
      alert('Generation failed or timed out. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (r) => {
    if (!confirm('Delete this rendering?')) return;
    await base44.entities.Rendering.delete(r.id);
    qc.invalidateQueries({ queryKey: ['renderings', projectId] });
  };

  const byCategory = selections.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const hasData = plans.length > 0 || selections.length > 0;

  return (
    <div className="space-y-6">

      {/* ── No data notice ── */}
      {!hasData && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <strong>Tip:</strong> Add floor plans in the Plans tab and material selections in the Selections tab — the AI will use them to create renderings specific to this project.
        </div>
      )}

      {/* ── Step 1: Room + Floor Plan ── */}
      <section className="border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm font-semibold">Room to Render</h3>
        </div>

        {/* Room picker */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Which room?
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {roomOptions.map(r => (
              <button
                key={r}
                onClick={() => setRoomLabel(r)}
                className={cn(
                  'text-xs px-3 py-1.5 border font-medium transition-colors',
                  roomLabel === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={roomLabel}
            onChange={e => setRoomLabel(e.target.value)}
            placeholder="Or type a custom room name…"
            className="w-full border border-input bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Floor plan selector */}
        {plans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Floor Plan Reference <span className="font-normal normal-case">(optional)</span>
                </label>
                <select
                  className="w-full border border-input bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  value={selectedPlanId}
                  onChange={e => { setSelectedPlanId(e.target.value); setPlanPage(1); setPlanText(''); }}
                >
                  <option value="">— No plan —</option>
                  {plans.filter(p => p.file_url).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {selectedPlan && planText && (
                <div className="p-3 bg-muted/50 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Extracted from plan
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{planText.slice(0, 200)}</p>
                </div>
              )}
            </div>
            {selectedPlan?.file_url && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Preview
                </label>
                <PdfThumbnail
                  url={selectedPlan.file_url}
                  pageNum={planPage}
                  onTextExtracted={setPlanText}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Step 2: Selections ── */}
      <section className="border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-sm font-semibold">
              Materials & Finishes
            </h3>
            {selections.length > 0 && (
              <span className="text-xs text-muted-foreground">
                — {includedSelections.size} of {selections.length} included
              </span>
            )}
          </div>
          {selections.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setIncludedSelections(new Set(selections.map(s => s.id)))}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                All
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                onClick={() => setIncludedSelections(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                None
              </button>
            </div>
          )}
        </div>

        {selections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No selections added yet. Add flooring, paint colors, cabinetry, countertops, and fixtures in the{' '}
            <strong>Selections</strong> tab to make renderings specific to this project.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
                <div className="space-y-1.5">
                  {items.map(sel => {
                    const included = includedSelections.has(sel.id);
                    return (
                      <label
                        key={sel.id}
                        className={cn(
                          'flex items-start gap-2.5 p-2.5 border cursor-pointer transition-colors',
                          included
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border bg-background opacity-60'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => toggleSelection(sel.id)}
                          className="mt-0.5 accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{sel.item}</p>
                          {sel.notes && <p className="text-xs text-muted-foreground">{sel.notes}</p>}
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 shrink-0',
                          sel.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          sel.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        )}>
                          {sel.status}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Step 3: Render settings ── */}
      <section className="border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm font-semibold">Render Settings</h3>
        </div>

        {/* Style */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Architectural Style
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={cn(
                  'text-xs px-3 py-1.5 border font-medium transition-colors capitalize',
                  style === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {s === '' ? 'Auto' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Lighting */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Lighting
          </label>
          <div className="flex flex-wrap gap-2">
            {LIGHTING_OPTIONS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setLighting(value)}
                className={cn(
                  'text-xs px-3 py-1.5 border font-medium transition-colors',
                  lighting === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Camera angle */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Camera Angle
          </label>
          <div className="flex flex-wrap gap-2">
            {ANGLE_OPTIONS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setAngle(value)}
                className={cn(
                  'text-xs px-3 py-1.5 border font-medium transition-colors',
                  angle === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            Additional Details
          </label>
          <textarea
            value={customNotes}
            onChange={e => setCustomNotes(e.target.value)}
            rows={2}
            placeholder="Any extra details: crown molding, wainscoting, specific window placement, furniture style…"
            className="w-full border border-input bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </section>

      {/* ── Prompt preview ── */}
      <section className="border border-border">
        <button
          onClick={() => setShowPrompt(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            Preview / Edit Prompt
          </span>
          {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showPrompt && (
          <div className="px-4 pb-4 space-y-2 border-t border-border">
            <p className="text-xs text-muted-foreground pt-3">
              Auto-built from your plans and selections. Edit to fine-tune before generating.
            </p>
            <textarea
              value={promptOverride || builtPrompt}
              onChange={e => setPromptOverride(e.target.value === builtPrompt ? '' : e.target.value)}
              rows={5}
              className="w-full border border-input bg-background text-xs px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {promptOverride && (
              <button
                onClick={() => setPromptOverride('')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-3 h-3" /> Reset to auto-generated
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Generate button ── */}
      <div className="flex items-center gap-4">
        <Button onClick={handleGenerate} disabled={generating} size="lg" className="gap-2">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating rendering…</>
            : <><Sparkles className="w-4 h-4" /> Generate Rendering</>}
        </Button>
        {generating && (
          <p className="text-sm text-muted-foreground">
            Building your room with {activeSelections.length} material{activeSelections.length !== 1 ? 's' : ''}
            {selectedPlan ? ` from ${selectedPlan.name}` : ''}… (10–30 sec)
          </p>
        )}
      </div>

      {/* ── Gallery ── */}
      {renderings.length > 0 && (
        <div>
          <h3 className="font-serif text-base font-semibold mb-4">
            Saved Renderings
            <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">
              ({renderings.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderings.map(r => (
              <RenderingCard key={r.id} rendering={r} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {renderings.length === 0 && !generating && (
        <div className="text-center py-12 border border-dashed border-border">
          <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No renderings yet</p>
          <p className="text-xs text-muted-foreground">
            Select a floor plan, check the materials you want included, and click Generate.
          </p>
        </div>
      )}
    </div>
  );
}

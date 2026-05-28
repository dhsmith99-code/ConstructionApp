import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  X, Eye, EyeOff, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Layers, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure PDF.js worker via Vite asset URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

const LAYER_COLORS = ['#1d4ed8', '#dc2626', '#16a34a', '#d97706', '#7c3aed'];

// ─── Single PDF layer canvas ─────────────────────────────────────────────────
function PdfCanvas({ id, url, pageNum, opacity, visible, isFirst, onPageCount }) {
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const taskRef = useRef(null);

  const renderPage = useCallback(async (pdf, page) => {
    // Cancel any in-flight render
    if (taskRef.current) {
      try { taskRef.current.cancel(); } catch {}
      taskRef.current = null;
    }
    try {
      const pdfPage = await pdf.getPage(page);
      const viewport = pdfPage.getViewport({ scale: 2 }); // high-DPI
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      // White background so multiply blend works correctly
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      taskRef.current = pdfPage.render({ canvasContext: ctx, viewport });
      await taskRef.current.promise;
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') console.error('PDF render:', e);
    }
  }, []);

  // Load document on URL change
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        onPageCount(id, pdf.numPages);
        await renderPage(pdf, pageNum);
      } catch (e) {
        console.error('PDF load:', e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render on page change
  useEffect(() => {
    if (pdfRef.current) renderPage(pdfRef.current, pageNum);
  }, [pageNum]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        // First layer stays in flow to set container size; rest are stacked absolutely
        position: isFirst ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        opacity: visible ? opacity : 0,
        // multiply blend makes white areas transparent, dark lines overlay perfectly
        mixBlendMode: isFirst ? 'normal' : 'multiply',
        pointerEvents: 'none',
        transition: 'opacity 0.15s',
      }}
    />
  );
}

// ─── Main overlay viewer ──────────────────────────────────────────────────────
export default function PlanOverlayViewer({ plans, onClose }) {
  const [layers, setLayers] = useState([]);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const viewportRef = useRef(null);

  // ── Layer management ────────────────────────────────────────────────────────
  const addLayer = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    setLayers(prev => [
      ...prev,
      {
        id: `L${Date.now()}`,
        plan,
        pageNum: 1,
        totalPages: null,
        opacity: 0.85,
        visible: true,
        color: LAYER_COLORS[prev.length % LAYER_COLORS.length],
      },
    ]);
  };

  const removeLayer = (id) =>
    setLayers(prev => prev.filter(l => l.id !== id));

  const updateLayer = (id, patch) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  // Called by PdfCanvas once the document is loaded
  const handlePageCount = useCallback((layerId, totalPages) => {
    setLayers(prev =>
      prev.map(l => l.id === layerId ? { ...l, totalPages } : l)
    );
  }, []);

  // ── Zoom ────────────────────────────────────────────────────────────────────
  const zoom = (delta) =>
    setScale(s => Math.min(6, Math.max(0.1, +(s + delta).toFixed(2))));

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    zoom(e.deltaY > 0 ? -0.1 : 0.1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Pan ─────────────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  }, []);

  const stopDrag = () => { isDragging.current = false; };

  const availablePlans = plans.filter(p => p.file_url);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col select-none">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <Layers className="w-5 h-5 text-primary shrink-0" />
        <span className="font-serif font-semibold text-lg">Plan Overlay</span>

        <div className="flex items-center gap-1 ml-6">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => zoom(-0.15)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm tabular-nums w-14 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => zoom(0.15)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 ml-1"
            title="Reset view"
            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas viewport ──────────────────────────────────────────────── */}
        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative bg-muted/30"
          style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          {layers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Layers className="w-10 h-10 opacity-20" />
              <p className="text-sm">Add plan layers from the panel on the right</p>
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
                transformOrigin: 'center center',
                boxShadow: '0 8px 48px rgba(0,0,0,0.25)',
                backgroundColor: '#ffffff',
                lineHeight: 0,
              }}
            >
              {layers.map((layer, i) => (
                <PdfCanvas
                  key={layer.id}
                  id={layer.id}
                  url={layer.plan.file_url}
                  pageNum={layer.pageNum}
                  opacity={layer.opacity}
                  visible={layer.visible}
                  isFirst={i === 0}
                  onPageCount={handlePageCount}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="w-72 border-l border-border flex flex-col bg-background shrink-0">

          {/* Add layer */}
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Add Layer
            </p>
            {availablePlans.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No plans with PDF links. Add plans with a direct .pdf URL.
              </p>
            ) : (
              <select
                className="w-full border border-input bg-background text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                onChange={(e) => {
                  if (e.target.value) {
                    addLayer(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a plan…</option>
                {availablePlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Layer list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {layers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-10">
                No layers yet.
              </p>
            )}

            {layers.map((layer, i) => (
              <div key={layer.id} className="border border-border bg-card p-3 space-y-2.5">

                {/* Name + controls */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 shrink-0"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    title={layer.plan.name}
                  >
                    {layer.plan.name}
                  </span>
                  <button
                    onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible
                      ? <Eye className="w-3.5 h-3.5" />
                      : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => removeLayer(layer.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove layer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page nav */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateLayer(layer.id, { pageNum: Math.max(1, layer.pageNum - 1) })}
                    disabled={layer.pageNum <= 1}
                    className="disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs flex-1 text-center text-muted-foreground">
                    {layer.totalPages
                      ? `Page ${layer.pageNum} / ${layer.totalPages}`
                      : 'Loading…'}
                  </span>
                  <button
                    onClick={() =>
                      updateLayer(layer.id, {
                        pageNum: Math.min(layer.totalPages ?? 1, layer.pageNum + 1),
                      })
                    }
                    disabled={!layer.totalPages || layer.pageNum >= layer.totalPages}
                    className="disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Opacity</span>
                    <span>{Math.round(layer.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={layer.opacity}
                    onChange={(e) =>
                      updateLayer(layer.id, { opacity: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 accent-primary cursor-pointer"
                  />
                </div>

                {i > 0 && (
                  <p className="text-[10px] text-muted-foreground italic leading-tight">
                    Blend mode: multiply — white areas show through
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Footer tips */}
          <div className="p-3 border-t border-border text-xs text-muted-foreground space-y-0.5">
            <p>Scroll to zoom · Drag canvas to pan</p>
            <p>Plans must use direct public PDF URLs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { Board, BoardElement, Connection, Viewport } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ASSET_INDEX } from '../../data/assetLibrary';
import { ASSET_DRAG_MIME } from '../Sidebar/AssetChip';
import { makeAssetElement, makeElement, makeStickyElement, makeTextElement, DEFAULT_STYLE } from '../../utils/elementFactory';
import { newId } from '../../utils/id';
import { normalizeRect, rectsIntersect } from '../../utils/geometry';
import ElementNode from './ElementNode';
import ConnectionsLayer from './ConnectionsLayer';
import TextEditOverlay from './TextEditOverlay';
import ZoomControls from './ZoomControls';
import StylePanel from './StylePanel';

const TRANSFORMABLE = new Set(['image', 'rectangle', 'ellipse', 'sticky', 'frame', 'text']);
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

interface DrawState {
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'freehand' | 'frame';
  x0: number;
  y0: number;
  points?: number[];
}

interface BoardCanvasProps {
  board: Board;
  stageRef: React.RefObject<Konva.Stage | null>;
  presentation?: boolean;
}

export default function BoardCanvas({ board, stageRef, presentation }: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const transformerRef = useRef<Konva.Transformer>(null);
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const draggedNodeStart = useRef<{ x: number; y: number } | null>(null);
  const drawStateRef = useRef<DrawState | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [size, setSize] = useState({ width: 800, height: 600 });
  const [draft, setDraft] = useState<BoardElement | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);

  const tool = useAppStore((s) => s.tool);
  const setTool = useAppStore((s) => s.setTool);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const setSelection = useAppStore((s) => s.setSelection);
  const toggleSelected = useAppStore((s) => s.toggleSelected);
  const addElement = useAppStore((s) => s.addElement);
  const addConnection = useAppStore((s) => s.addConnection);
  const beginChange = useAppStore((s) => s.beginChange);
  const patchElementLive = useAppStore((s) => s.patchElementLive);
  const patchElement = useAppStore((s) => s.patchElement);
  const setViewport = useAppStore((s) => s.setViewport);
  const deleteElements = useAppStore((s) => s.deleteElements);
  const deleteConnection = useAppStore((s) => s.deleteConnection);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const copySelection = useAppStore((s) => s.copySelection);
  const pasteClipboard = useAppStore((s) => s.pasteClipboard);
  const duplicateElements = useAppStore((s) => s.duplicateElements);

  const viewport = board.viewport;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const activeTag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.code === 'Space') setSpaceDown(true);
      if (mod && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && e.key.toLowerCase() === 'c') {
        copySelection();
      } else if (mod && e.key.toLowerCase() === 'v') {
        pasteClipboard();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedIds.length) duplicateElements(selectedIds);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length) deleteElements(selectedIds);
        if (selectedConnectionId) {
          deleteConnection(selectedConnectionId);
          setSelectedConnectionId(null);
        }
      } else if (e.key === 'Escape') {
        setSelection([]);
        setSelectedConnectionId(null);
        setTool('select');
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') setSpaceDown(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selectedIds, selectedConnectionId, undo, redo, copySelection, pasteClipboard, duplicateElements, deleteElements, deleteConnection, setSelection, setTool]);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const nodes = selectedIds
      .map((id) => nodeRefs.current.get(id))
      .filter((n): n is Konva.Group => !!n && TRANSFORMABLE.has((n.attrs.elementType as string) ?? ''));
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, board.elements]);

  function toWorld(screenX: number, screenY: number) {
    return { x: (screenX - viewport.x) / viewport.scale, y: (screenY - viewport.y) / viewport.scale };
  }

  function pointerWorldPos(stage: Konva.Stage) {
    const p = stage.getPointerPosition();
    if (!p) return { x: 0, y: 0 };
    return toWorld(p.x, p.y);
  }

  function registerRef(id: string, node: Konva.Group | null) {
    if (node) nodeRefs.current.set(id, node);
    else nodeRefs.current.delete(id);
  }

  function handleSelect(id: string, shift: boolean) {
    setSelectedConnectionId(null);
    if (shift) toggleSelected(id);
    else setSelection([id]);
  }

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current;
    if (!stage) return;
    const clickedOnEmpty = e.target === stage;
    const pos = pointerWorldPos(stage);

    if (tool === 'pan' || spaceDown) return; // stage handles dragging

    if (tool === 'select') {
      if (clickedOnEmpty) {
        setSelectedConnectionId(null);
        if (!e.evt.shiftKey) setSelection([]);
        marqueeStartRef.current = pos;
        setMarquee({ x: pos.x, y: pos.y, width: 0, height: 0 });
      }
      return;
    }

    if (tool === 'text') {
      const el = makeTextElement(pos, board.elements);
      addElement(el);
      beginChange();
      setEditingTextId(el.id);
      setTool('select');
      return;
    }

    if (tool === 'sticky') {
      const el = makeStickyElement(pos, board.elements);
      addElement(el);
      beginChange();
      setEditingTextId(el.id);
      setTool('select');
      return;
    }

    if (['rectangle', 'ellipse', 'line', 'arrow', 'doubleArrow', 'freehand', 'frame'].includes(tool)) {
      const type = tool === 'doubleArrow' ? 'arrow' : (tool as DrawState['type']);
      drawStateRef.current = { type, x0: pos.x, y0: pos.y, points: type === 'freehand' ? [0, 0] : undefined };
      setDraft(
        makeElement(
          type === 'frame' ? 'frame' : type,
          { x: pos.x, y: pos.y, width: 0, height: 0 },
          board.elements,
          type === 'line' || type === 'arrow' || type === 'freehand'
            ? { points: type === 'freehand' ? [0, 0] : [0, 0, 0, 0], style: { ...DEFAULT_STYLE, arrowStart: tool === 'doubleArrow' ? 'arrow' : 'none' } }
            : {},
        ),
      );
    }
  }

  function handleStageMouseMove() {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = pointerWorldPos(stage);

    if (marqueeStartRef.current) {
      const rect = normalizeRect(marqueeStartRef.current.x, marqueeStartRef.current.y, pos.x, pos.y);
      setMarquee(rect);
      const ids = board.elements.filter((el) => rectsIntersect(rect, el)).map((el) => el.id);
      setSelection(ids);
      return;
    }

    const ds = drawStateRef.current;
    if (!ds || !draft) return;

    if (ds.type === 'freehand') {
      const relX = pos.x - ds.x0;
      const relY = pos.y - ds.y0;
      ds.points = [...(ds.points ?? []), relX, relY];
      setDraft({ ...draft, points: ds.points });
    } else if (ds.type === 'line' || ds.type === 'arrow') {
      const relX = pos.x - ds.x0;
      const relY = pos.y - ds.y0;
      setDraft({
        ...draft,
        points: [0, 0, relX, relY],
        width: Math.abs(relX),
        height: Math.abs(relY),
      });
    } else {
      const rect = normalizeRect(ds.x0, ds.y0, pos.x, pos.y);
      setDraft({ ...draft, ...rect });
    }
  }

  function elementAtPoint(point: { x: number; y: number }): BoardElement | undefined {
    return [...board.elements].reverse().find((el) => rectsIntersect({ x: point.x, y: point.y, width: 1, height: 1 }, el));
  }

  function handleStageMouseUp() {
    if (marqueeStartRef.current) {
      marqueeStartRef.current = null;
      setMarquee(null);
      return;
    }

    const ds = drawStateRef.current;
    if (ds && draft) {
      drawStateRef.current = null;
      setDraft(null);

      if (ds.type === 'freehand') {
        const pts = ds.points ?? [];
        if (pts.length >= 4) {
          const xs = pts.filter((_, i) => i % 2 === 0);
          const ys = pts.filter((_, i) => i % 2 === 1);
          addElement({
            ...draft,
            points: pts,
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          });
        }
      } else if (ds.type === 'line' || ds.type === 'arrow') {
        const [, , dx, dy] = draft.points ?? [0, 0, 0, 0];
        const length = Math.hypot(dx, dy);
        if (length > 6) {
          if (ds.type === 'arrow') {
            const startWorld = { x: ds.x0, y: ds.y0 };
            const endWorld = { x: ds.x0 + dx, y: ds.y0 + dy };
            const sourceEl = elementAtPoint(startWorld);
            const targetEl = elementAtPoint(endWorld);
            if (sourceEl && targetEl && sourceEl.id !== targetEl.id) {
              addConnection({
                id: newId('conn'),
                sourceId: sourceEl.id,
                targetId: targetEl.id,
                type: 'straight',
                style: { ...draft.style },
                bidirectional: draft.style.arrowStart === 'arrow',
              });
              setTool('select');
              return;
            }
          }
          addElement(draft);
        }
      } else {
        const minSize = 6;
        if (draft.width < minSize && draft.height < minSize) {
          addElement({ ...draft, width: 160, height: 110, x: draft.x - 80, y: draft.y - 55 });
        } else {
          addElement(draft);
        }
      }
      setTool('select');
    }
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = { x: (pointer.x - viewport.x) / oldScale, y: (pointer.y - viewport.y) / oldScale };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.06;
      let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));
      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    } else {
      setViewport({ ...viewport, x: viewport.x - e.evt.deltaX, y: viewport.y - e.evt.deltaY });
    }
  }

  function zoomBy(factor: number) {
    const center = { x: size.width / 2, y: size.height / 2 };
    const oldScale = viewport.scale;
    const worldCenter = { x: (center.x - viewport.x) / oldScale, y: (center.y - viewport.y) / oldScale };
    const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldScale * factor));
    setViewport({
      scale: newScale,
      x: center.x - worldCenter.x * newScale,
      y: center.y - worldCenter.y * newScale,
    });
  }

  function handleFit() {
    if (board.elements.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 });
      return;
    }
    const minX = Math.min(...board.elements.map((e) => e.x));
    const minY = Math.min(...board.elements.map((e) => e.y));
    const maxX = Math.max(...board.elements.map((e) => e.x + e.width));
    const maxY = Math.max(...board.elements.map((e) => e.y + e.height));
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = Math.min((size.width - 120) / w, (size.height - 120) / h, 2);
    setViewport({
      scale,
      x: size.width / 2 - (minX + w / 2) * scale,
      y: size.height / 2 - (minY + h / 2) * scale,
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const assetId = e.dataTransfer.getData(ASSET_DRAG_MIME);
    if (!assetId) return;
    const asset = ASSET_INDEX[assetId];
    if (!asset || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);
    addElement(makeAssetElement(asset, world, board.elements));
  }

  function onElDragStart(id: string) {
    const ids = selectedIds.includes(id) ? selectedIds : [id];
    if (!selectedIds.includes(id)) setSelection([id]);
    beginChange();
    const map = new Map<string, { x: number; y: number }>();
    for (const elId of ids) {
      const el = board.elements.find((e) => e.id === elId);
      if (el) map.set(elId, { x: el.x, y: el.y });
    }
    dragStartPositions.current = map;
    const node = nodeRefs.current.get(id);
    draggedNodeStart.current = node ? { x: node.x(), y: node.y() } : null;
  }

  function onElDragMove(id: string, x: number, y: number) {
    if (!draggedNodeStart.current) return;
    const dx = x - draggedNodeStart.current.x;
    const dy = y - draggedNodeStart.current.y;
    dragStartPositions.current.forEach((start, elId) => {
      patchElementLive(elId, { x: start.x + dx, y: start.y + dy });
    });
  }

  function onElDragEnd() {
    dragStartPositions.current = new Map();
    draggedNodeStart.current = null;
  }

  function handleTransformEnd() {
    const nodes = transformerRef.current?.nodes() ?? [];
    for (const node of nodes) {
      const id = node.id();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      patchElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * scaleX),
        height: Math.max(10, node.height() * scaleY),
        rotation: node.rotation(),
      });
    }
  }

  const editingElement = useMemo(
    () => (editingTextId ? board.elements.find((e) => e.id === editingTextId) ?? null : null),
    [editingTextId, board.elements],
  );

  const selectedElements = board.elements.filter((e) => selectedIds.includes(e.id));
  const selectedConnection = board.connections.find((c) => c.id === selectedConnectionId) ?? null;
  const cursor = tool === 'pan' || spaceDown ? 'grab' : tool === 'select' ? 'default' : 'crosshair';

  return (
    <div
      className="canvas-area"
      ref={containerRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ cursor }}
    >
      <Stage
        ref={stageRef as React.Ref<Konva.Stage>}
        width={size.width}
        height={size.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={tool === 'pan' || spaceDown}
        onDragEnd={(e) => {
          if (tool === 'pan' || spaceDown) setViewport({ ...viewport, x: e.target.x(), y: e.target.y() });
        }}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          <ConnectionsLayer
            elements={board.elements}
            connections={board.connections}
            selectedId={selectedConnectionId}
            onSelect={(id) => {
              setSelectedConnectionId(id);
              if (id) setSelection([]);
            }}
          />
          {[...board.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => (
              <ElementNode
                key={el.id}
                el={el}
                isSelected={selectedIds.includes(el.id)}
                draggable={tool === 'select' && !el.locked}
                onSelect={handleSelect}
                onDragStart={onElDragStart}
                onDragMove={onElDragMove}
                onDragEnd={onElDragEnd}
                onDoubleClick={(id) => {
                  const el2 = board.elements.find((e) => e.id === id);
                  if (el2 && (el2.type === 'text' || el2.type === 'sticky')) {
                    setSelection([id]);
                    beginChange();
                    setEditingTextId(id);
                  }
                }}
                registerRef={(id, node) => {
                  registerRef(id, node);
                  if (node) node.setAttr('elementType', el.type);
                }}
              />
            ))}
          {draft && (
            <ElementNode
              el={draft}
              isSelected={false}
              draggable={false}
              onSelect={() => {}}
              onDragStart={() => {}}
              onDragMove={() => {}}
              onDragEnd={() => {}}
              onDoubleClick={() => {}}
              registerRef={() => {}}
            />
          )}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
            onTransformEnd={handleTransformEnd}
          />
          {marquee && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.width}
              height={marquee.height}
              fill="rgba(32,115,209,0.08)"
              stroke="#2073D1"
              dash={[4, 3]}
            />
          )}
        </Layer>
      </Stage>

      {editingElement && (
        <TextEditOverlay
          el={editingElement}
          viewport={viewport}
          onChange={(value) => patchElementLive(editingElement.id, { content: value })}
          onCommit={() => setEditingTextId(null)}
        />
      )}

      <ZoomControls scale={viewport.scale} onZoomIn={() => zoomBy(1.2)} onZoomOut={() => zoomBy(1 / 1.2)} onFit={handleFit} />
      {!presentation && <StylePanel selectedElements={selectedElements} selectedConnection={selectedConnection} />}
    </div>
  );
}

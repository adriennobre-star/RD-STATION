import { useRef } from 'react';
import {
  MousePointer2,
  Hand,
  Type,
  Minus,
  ArrowRight,
  ArrowLeftRight,
  Square,
  Circle,
  Pencil,
  ImagePlus,
  StickyNote,
  Frame,
} from 'lucide-react';
import { useAppStore, useActiveBoard } from '../../store/useAppStore';
import type { ToolName } from '../../store/useAppStore';
import { makeElement } from '../../utils/elementFactory';

const TOOLS: Array<{ id: ToolName; label: string; icon: React.ElementType }> = [
  { id: 'select', label: 'Seleção', icon: MousePointer2 },
  { id: 'pan', label: 'Mão / Pan', icon: Hand },
];

const DRAW_TOOLS: Array<{ id: ToolName; label: string; icon: React.ElementType }> = [
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'line', label: 'Linha', icon: Minus },
  { id: 'arrow', label: 'Seta', icon: ArrowRight },
  { id: 'doubleArrow', label: 'Seta dupla', icon: ArrowLeftRight },
  { id: 'rectangle', label: 'Retângulo', icon: Square },
  { id: 'ellipse', label: 'Círculo / Elipse', icon: Circle },
  { id: 'freehand', label: 'Desenho livre', icon: Pencil },
  { id: 'sticky', label: 'Nota / Sticky', icon: StickyNote },
  { id: 'frame', label: 'Moldura', icon: Frame },
];

export default function DrawToolbar() {
  const tool = useAppStore((s) => s.tool);
  const setTool = useAppStore((s) => s.setTool);
  const addElement = useAppStore((s) => s.addElement);
  const board = useActiveBoard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageFile(file: File) {
    if (!board) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxW = 260;
        const scale = Math.min(1, maxW / img.naturalWidth);
        const width = img.naturalWidth * scale;
        const height = img.naturalHeight * scale;
        const centerX = (board.viewport ? -board.viewport.x / board.viewport.scale : 0) + 400;
        const centerY = (board.viewport ? -board.viewport.y / board.viewport.scale : 0) + 300;
        addElement(
          makeElement(
            'image',
            { x: centerX - width / 2, y: centerY - height / 2, width, height },
            board.elements,
            { imageUrl: dataUrl, content: file.name, style: { fill: 'transparent' } },
          ),
        );
        setTool('select');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tool-btn${tool === id ? ' active' : ''}`}
            title={label}
            onClick={() => setTool(id)}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group">
        {DRAW_TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tool-btn${tool === id ? ' active' : ''}`}
            title={label}
            onClick={() => setTool(id)}
          >
            <Icon size={18} />
          </button>
        ))}
        <button
          className="tool-btn"
          title="Imagem (upload)"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

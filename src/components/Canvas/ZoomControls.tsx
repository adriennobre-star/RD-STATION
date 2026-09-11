import { Minus, Plus, Maximize } from 'lucide-react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export default function ZoomControls({ scale, onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className="canvas-floating-controls">
      <div className="zoom-controls">
        <button onClick={onZoomOut} title="Diminuir zoom">
          <Minus size={15} />
        </button>
        <span className="zoom-value">{Math.round(scale * 100)}%</span>
        <button onClick={onZoomIn} title="Aumentar zoom">
          <Plus size={15} />
        </button>
        <button onClick={onFit} title="Centralizar">
          <Maximize size={15} />
        </button>
      </div>
    </div>
  );
}

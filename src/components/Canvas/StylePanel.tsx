import { Copy, Trash2, BringToFront, SendToBack } from 'lucide-react';
import type { BoardElement, Connection } from '../../types';
import { useAppStore } from '../../store/useAppStore';

const STROKE_COLORS = ['#0B1F3A', '#1857A4', '#2073D1', '#4C93E0', '#4A5568', '#8A94A6', '#FF6B57', '#2E8B84'];
const FILL_COLORS = ['#E8F1FC', '#F4F6F9', '#FFFFFF', '#1857A4', '#2073D1', '#FFF3C4', '#D8DEE6', 'transparent'];

interface StylePanelProps {
  selectedElements: BoardElement[];
  selectedConnection: Connection | null;
}

export default function StylePanel({ selectedElements, selectedConnection }: StylePanelProps) {
  const patchElements = useAppStore((s) => s.patchElements);
  const deleteElements = useAppStore((s) => s.deleteElements);
  const duplicateElements = useAppStore((s) => s.duplicateElements);
  const bringToFront = useAppStore((s) => s.bringToFront);
  const sendToBack = useAppStore((s) => s.sendToBack);
  const updateConnection = useAppStore((s) => s.updateConnection);
  const deleteConnection = useAppStore((s) => s.deleteConnection);
  const setSelection = useAppStore((s) => s.setSelection);

  if (selectedConnection) {
    const conn = selectedConnection;
    return (
      <div className="style-panel">
        <div className="row-label">Conexão</div>
        <div className="swatches">
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch${conn.style.stroke === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => updateConnection(conn.id, { style: { ...conn.style, stroke: c } })}
            />
          ))}
        </div>
        <div className="row-label">Espessura</div>
        <input
          type="range"
          min={1}
          max={8}
          value={conn.style.strokeWidth ?? 2}
          onChange={(e) => updateConnection(conn.id, { style: { ...conn.style, strokeWidth: Number(e.target.value) } })}
        />
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!conn.bidirectional}
            onChange={(e) => updateConnection(conn.id, { bidirectional: e.target.checked })}
          />
          Bidirecional
        </label>
        <button className="btn light" onClick={() => deleteConnection(conn.id)}>
          <Trash2 size={14} /> Excluir conexão
        </button>
      </div>
    );
  }

  if (selectedElements.length === 0) return null;
  const first = selectedElements[0];
  const ids = selectedElements.map((e) => e.id);

  return (
    <div className="style-panel">
      <div className="row-label">Cor da borda</div>
      <div className="swatches">
        {STROKE_COLORS.map((c) => (
          <button
            key={c}
            className={`swatch${first.style.stroke === c ? ' selected' : ''}`}
            style={{ background: c }}
            onClick={() => patchElements(ids.map((id) => ({ id, patch: { style: { ...first.style, stroke: c } } })))}
          />
        ))}
      </div>
      <div className="row-label">Preenchimento</div>
      <div className="swatches">
        {FILL_COLORS.map((c) => (
          <button
            key={c}
            className={`swatch${first.style.fill === c ? ' selected' : ''}`}
            style={{ background: c === 'transparent' ? 'repeating-conic-gradient(#ddd 0 25%, white 0 50%) 50%/8px 8px' : c }}
            onClick={() => patchElements(ids.map((id) => ({ id, patch: { style: { ...first.style, fill: c } } })))}
          />
        ))}
      </div>
      <div className="row-label">Espessura</div>
      <input
        type="range"
        min={1}
        max={10}
        value={first.style.strokeWidth ?? 2}
        onChange={(e) =>
          patchElements(ids.map((id) => ({ id, patch: { style: { ...first.style, strokeWidth: Number(e.target.value) } } })))
        }
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="icon-btn" style={{ color: '#4A5568' }} title="Duplicar" onClick={() => duplicateElements(ids)}>
          <Copy size={16} />
        </button>
        <button className="icon-btn" style={{ color: '#4A5568' }} title="Trazer para frente" onClick={() => bringToFront(ids)}>
          <BringToFront size={16} />
        </button>
        <button className="icon-btn" style={{ color: '#4A5568' }} title="Enviar para trás" onClick={() => sendToBack(ids)}>
          <SendToBack size={16} />
        </button>
        <button
          className="icon-btn"
          style={{ color: '#FF6B57' }}
          title="Excluir"
          onClick={() => {
            deleteElements(ids);
            setSelection([]);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

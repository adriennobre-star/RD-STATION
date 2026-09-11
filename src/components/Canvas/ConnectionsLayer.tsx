import { Arrow, Group, Label, Tag, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { BoardElement, Connection } from '../../types';
import { getConnectionPoints } from '../../utils/geometry';

interface ConnectionsLayerProps {
  elements: BoardElement[];
  connections: Connection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ConnectionsLayer({ elements, connections, selectedId, onSelect }: ConnectionsLayerProps) {
  const byId = new Map(elements.map((e) => [e.id, e]));

  return (
    <>
      {connections.map((conn) => {
        const source = byId.get(conn.sourceId);
        const target = byId.get(conn.targetId);
        if (!source || !target) return null;
        const [x1, y1, x2, y2] = getConnectionPoints(source, target);
        const selected = selectedId === conn.id;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        return (
          <Group key={conn.id}>
            <Arrow
              points={[x1, y1, x2, y2]}
              stroke={selected ? '#FF6B57' : conn.style.stroke ?? '#1857A4'}
              fill={selected ? '#FF6B57' : conn.style.stroke ?? '#1857A4'}
              strokeWidth={(conn.style.strokeWidth ?? 2) + (selected ? 1 : 0)}
              dash={conn.style.dash}
              pointerAtBeginning={!!conn.bidirectional}
              pointerAtEnding
              hitStrokeWidth={18}
              lineCap="round"
              onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                onSelect(conn.id);
              }}
              onTap={() => onSelect(conn.id)}
            />
            {conn.label && (
              <Label x={midX} y={midY} offsetX={0} offsetY={0}>
                <Tag fill="white" stroke="#D8DEE6" cornerRadius={4} />
                <KonvaText text={conn.label} fontSize={11} padding={4} fill="#1A1D21" />
              </Label>
            )}
          </Group>
        );
      })}
    </>
  );
}

import { Group, Rect, Ellipse, Line, Arrow, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { BoardElement } from '../../types';
import { useHtmlImage } from '../../hooks/useHtmlImage';

interface ElementNodeProps {
  el: BoardElement;
  isSelected: boolean;
  draggable: boolean;
  onSelect: (id: string, shift: boolean) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onDoubleClick: (id: string) => void;
  registerRef: (id: string, node: Konva.Group | null) => void;
}

function arrowHeadProps(style: BoardElement['style']) {
  return {
    pointerAtBeginning: style.arrowStart === 'arrow',
    pointerAtEnding: style.arrowEnd !== 'none',
  };
}

export default function ElementNode({
  el,
  isSelected,
  draggable,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDoubleClick,
  registerRef,
}: ElementNodeProps) {
  const style = el.style;
  const commonGroupProps = {
    id: el.id,
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    draggable,
    opacity: style.opacity ?? 1,
    ref: (node: Konva.Group | null) => registerRef(el.id, node),
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onSelect(el.id, e.evt.shiftKey),
    onTap: () => onSelect(el.id, false),
    onDblClick: () => onDoubleClick(el.id),
    onDragStart: () => onDragStart(el.id),
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(el.id, e.target.x(), e.target.y()),
    onDragEnd: () => onDragEnd(el.id),
  };

  switch (el.type) {
    case 'rectangle':
      return (
        <Group {...commonGroupProps}>
          <Rect
            width={el.width}
            height={el.height}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            cornerRadius={style.cornerRadius ?? 4}
            dash={style.dash}
          />
        </Group>
      );

    case 'ellipse':
      return (
        <Group {...commonGroupProps}>
          <Ellipse
            x={el.width / 2}
            y={el.height / 2}
            radiusX={el.width / 2}
            radiusY={el.height / 2}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            dash={style.dash}
          />
        </Group>
      );

    case 'frame':
      return (
        <Group {...commonGroupProps}>
          <Rect
            width={el.width}
            height={el.height}
            fill="rgba(255,255,255,0.02)"
            stroke={style.stroke ?? '#8A94A6'}
            strokeWidth={1.5}
            dash={[6, 4]}
            cornerRadius={4}
          />
          <KonvaText
            text={el.content || 'Moldura'}
            y={-20}
            fontSize={12}
            fontStyle="600"
            fill="#8A94A6"
          />
        </Group>
      );

    case 'sticky':
      return (
        <Group {...commonGroupProps}>
          <Rect
            width={el.width}
            height={el.height}
            fill={style.fill ?? '#FFF3C4'}
            stroke={style.stroke ?? '#E9D580'}
            strokeWidth={1}
            cornerRadius={2}
            shadowColor="rgba(11,31,58,0.25)"
            shadowBlur={8}
            shadowOffset={{ x: 0, y: 3 }}
          />
          <KonvaText
            text={el.content}
            width={el.width}
            height={el.height}
            padding={12}
            fontSize={style.fontSize ?? 15}
            fill="#4A3F00"
            align={style.textAlign ?? 'left'}
            wrap="word"
          />
        </Group>
      );

    case 'text':
      return (
        <Group {...commonGroupProps}>
          <KonvaText
            text={el.content || ''}
            width={el.width}
            height={el.height}
            fontSize={style.fontSize ?? 18}
            fontFamily={style.fontFamily}
            fill={style.fill ?? '#1A1D21'}
            align={style.textAlign ?? 'left'}
            wrap="word"
          />
        </Group>
      );

    case 'image':
      return (
        <Group {...commonGroupProps}>
          {el.imageUrl ? (
            <ImageFill url={el.imageUrl} width={el.width} height={el.height} />
          ) : (
            <>
              <Rect width={el.width} height={el.height} fill={style.fill ?? '#1857A4'} cornerRadius={10} />
              <KonvaText
                text={el.content ?? ''}
                width={el.width}
                height={el.height}
                padding={10}
                fontSize={13}
                fontStyle="600"
                fill="#ffffff"
                align="center"
                verticalAlign="middle"
                wrap="word"
              />
            </>
          )}
        </Group>
      );

    case 'line':
      return (
        <Group {...commonGroupProps}>
          {isSelected && (
            <Rect width={el.width} height={el.height} stroke="#2073D1" dash={[4, 3]} strokeWidth={1} />
          )}
          <Line
            points={el.points ?? [0, 0, el.width, el.height]}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            dash={style.dash}
            hitStrokeWidth={16}
            lineCap="round"
          />
        </Group>
      );

    case 'arrow':
      return (
        <Group {...commonGroupProps}>
          {isSelected && (
            <Rect width={el.width} height={el.height} stroke="#2073D1" dash={[4, 3]} strokeWidth={1} />
          )}
          <Arrow
            points={el.points ?? [0, 0, el.width, el.height]}
            stroke={style.stroke}
            fill={style.stroke}
            strokeWidth={style.strokeWidth}
            dash={style.dash}
            hitStrokeWidth={16}
            lineCap="round"
            {...arrowHeadProps(style)}
          />
        </Group>
      );

    case 'freehand': {
      const xs = (el.points ?? []).filter((_, i) => i % 2 === 0);
      const ys = (el.points ?? []).filter((_, i) => i % 2 === 1);
      const minX = Math.min(0, ...xs);
      const minY = Math.min(0, ...ys);
      const maxX = Math.max(0, ...xs);
      const maxY = Math.max(0, ...ys);
      return (
        <Group {...commonGroupProps}>
          {isSelected && (
            <Rect
              x={minX}
              y={minY}
              width={maxX - minX}
              height={maxY - minY}
              stroke="#2073D1"
              dash={[4, 3]}
              strokeWidth={1}
            />
          )}
          <Line
            points={el.points ?? []}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            lineCap="round"
            lineJoin="round"
            tension={0.4}
            hitStrokeWidth={16}
          />
        </Group>
      );
    }

    default:
      return null;
  }
}

function ImageFill({ url, width, height }: { url: string; width: number; height: number }) {
  const img = useHtmlImage(url);
  if (!img) return <Rect width={width} height={height} fill="#E7EBF1" cornerRadius={6} />;
  return <KonvaImage image={img} width={width} height={height} cornerRadius={6} />;
}

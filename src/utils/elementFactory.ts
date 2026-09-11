import type { Asset, BoardElement, ElementStyle, ElementType } from '../types';
import { newId } from './id';

export const DEFAULT_STYLE: ElementStyle = {
  stroke: '#1857A4',
  fill: '#E8F1FC',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Inter, sans-serif',
  textAlign: 'left',
  arrowEnd: 'arrow',
  arrowStart: 'none',
  cornerRadius: 6,
};

let zCounter = 1;
export function nextZIndex(existing: BoardElement[]): number {
  const max = existing.reduce((m, e) => Math.max(m, e.zIndex), 0);
  zCounter = Math.max(zCounter, max) + 1;
  return zCounter;
}

export function makeElement(
  type: ElementType,
  bounds: { x: number; y: number; width: number; height: number },
  existing: BoardElement[],
  overrides: Partial<BoardElement> = {},
): BoardElement {
  return {
    id: newId('el'),
    type,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    content: '',
    style: { ...DEFAULT_STYLE, ...overrides.style },
    zIndex: nextZIndex(existing),
    ...overrides,
  };
}

export function makeAssetElement(
  asset: Asset,
  point: { x: number; y: number },
  existing: BoardElement[],
): BoardElement {
  const width = asset.type === 'screenshot' ? 220 : 120;
  const height = asset.type === 'screenshot' ? 140 : 120;
  return makeElement(
    'image',
    { x: point.x - width / 2, y: point.y - height / 2, width, height },
    existing,
    {
      assetId: asset.id,
      imageUrl: asset.kind === 'image' ? asset.imageUrl : undefined,
      content: asset.name,
      style: { fill: asset.color ?? '#1857A4' },
    },
  );
}

export function makeTextElement(point: { x: number; y: number }, existing: BoardElement[]): BoardElement {
  return makeElement('text', { x: point.x, y: point.y, width: 200, height: 32 }, existing, {
    content: '',
    style: { fontSize: 18, fill: '#1A1D21', textAlign: 'left' },
  });
}

export function makeStickyElement(point: { x: number; y: number }, existing: BoardElement[]): BoardElement {
  return makeElement(
    'sticky',
    { x: point.x - 90, y: point.y - 70, width: 180, height: 140 },
    existing,
    { content: '', style: { fill: '#FFF3C4', stroke: '#E9D580', fontSize: 15 } },
  );
}

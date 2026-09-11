import type { BoardElement } from '../types';

export function elementCenter(el: BoardElement): { x: number; y: number } {
  return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
}

/**
 * Point where the segment from the box center towards `toward` crosses the
 * box edge — used so connection arrows start/end at an element's border
 * instead of its center, and stay attached as the element moves.
 */
export function edgePoint(
  el: BoardElement,
  toward: { x: number; y: number },
): { x: number; y: number } {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const hw = Math.max(el.width / 2, 1);
  const hh = Math.max(el.height / 2, 1);
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function getConnectionPoints(
  source: BoardElement,
  target: BoardElement,
): [number, number, number, number] {
  const sourceCenter = elementCenter(source);
  const targetCenter = elementCenter(target);
  const start = edgePoint(source, targetCenter);
  const end = edgePoint(target, sourceCenter);
  return [start.x, start.y, end.x, end.y];
}

export function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

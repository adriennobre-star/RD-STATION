import { useLayoutEffect, useRef } from 'react';
import type { BoardElement, Viewport } from '../../types';

interface TextEditOverlayProps {
  el: BoardElement;
  viewport: Viewport;
  onChange: (value: string) => void;
  onCommit: () => void;
}

export default function TextEditOverlay({ el, viewport, onChange, onCommit }: TextEditOverlayProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Guards against a spurious blur landing in the same tick the editor was
  // opened from (e.g. the mouseup half of the click that created it).
  const justOpenedRef = useRef(true);

  useLayoutEffect(() => {
    justOpenedRef.current = true;
    ref.current?.focus();
    ref.current?.select();
    const timer = window.setTimeout(() => {
      justOpenedRef.current = false;
    }, 200);
    return () => window.clearTimeout(timer);
  }, [el.id]);

  const screenX = el.x * viewport.scale + viewport.x;
  const screenY = el.y * viewport.scale + viewport.y;
  const isSticky = el.type === 'sticky';

  return (
    <textarea
      ref={ref}
      className="text-edit-overlay"
      value={el.content ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        if (justOpenedRef.current) {
          e.target.focus();
          return;
        }
        onCommit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCommit();
        if (e.key === 'Enter' && !e.shiftKey && !isSticky) {
          e.preventDefault();
          onCommit();
        }
      }}
      style={{
        left: screenX,
        top: screenY,
        width: el.width * viewport.scale,
        height: el.height * viewport.scale,
        fontSize: (el.style.fontSize ?? 16) * viewport.scale,
        fontFamily: el.style.fontFamily,
        textAlign: el.style.textAlign ?? 'left',
        color: isSticky ? '#4A3F00' : el.style.fill,
        background: isSticky ? 'rgba(255,243,196,0.001)' : 'transparent',
        padding: isSticky ? 12 * viewport.scale : 0,
      }}
    />
  );
}

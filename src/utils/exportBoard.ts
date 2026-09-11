import type Konva from 'konva';
import type { Board } from '../types';

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'board';
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function exportBoardAsPng(stage: Konva.Stage | null, projectName: string) {
  if (!stage) return;
  const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
  download(dataUrl, `${slug(projectName)}.png`);
}

export function exportBoardAsJson(board: Board, projectName: string) {
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  download(url, `${slug(projectName)}.json`);
  URL.revokeObjectURL(url);
}

export function parseBoardJson(text: string): Board {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.elements) || !Array.isArray(parsed.connections)) {
    throw new Error('Arquivo JSON inválido para um board.');
  }
  return parsed as Board;
}

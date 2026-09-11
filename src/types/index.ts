export type ElementType =
  | 'image'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'sticky'
  | 'frame';

export type ArrowHead = 'none' | 'arrow' | 'dot';

export interface ElementStyle {
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  dash?: number[];
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  arrowStart?: ArrowHead;
  arrowEnd?: ArrowHead;
  cornerRadius?: number;
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  points?: number[];
  assetId?: string;
  imageUrl?: string;
  style: ElementStyle;
  zIndex: number;
  locked?: boolean;
}

export type ConnectionType = 'straight' | 'orthogonal' | 'curved';

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  style: ElementStyle;
  label?: string;
  bidirectional?: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Board {
  id: string;
  elements: BoardElement[];
  connections: Connection[];
  viewport: Viewport;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  board: Board;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  projects: Project[];
}

export type AssetType = 'logo' | 'icon' | 'screenshot' | 'image';

export interface Asset {
  id: string;
  solution: string;
  name: string;
  type: AssetType;
  imageUrl?: string;
  sourceUrl?: string;
  color?: string;
  kind: 'image' | 'placeholder';
}

export interface SolutionGroup {
  id: string;
  name: string;
  color: string;
  assets: Asset[];
}

export interface Workspace {
  id: string;
  name: string;
  folders: Folder[];
}

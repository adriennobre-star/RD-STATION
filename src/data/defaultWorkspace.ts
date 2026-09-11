import type { Board, Folder, Project, Workspace } from '../types';
import { newId } from '../utils/id';

export function createBoard(): Board {
  return {
    id: newId('board'),
    elements: [],
    connections: [],
    viewport: { x: 0, y: 0, scale: 1 },
    updatedAt: Date.now(),
  };
}

export function createProject(name: string): Project {
  const now = Date.now();
  return {
    id: newId('project'),
    name,
    createdAt: now,
    updatedAt: now,
    board: createBoard(),
  };
}

export function createFolder(name: string, projects: Project[] = []): Folder {
  return {
    id: newId('folder'),
    name,
    createdAt: Date.now(),
    projects,
  };
}

export function createDefaultWorkspace(): Workspace {
  return {
    id: newId('workspace'),
    name: 'BOARD DE ARQUITETURA',
    folders: [createFolder('Clientes', [createProject('Cliente A')])],
  };
}

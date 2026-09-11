import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Board,
  BoardElement,
  Connection,
  ElementStyle,
  Folder,
  Project,
  Viewport,
  Workspace,
} from '../types';
import { createDefaultWorkspace, createBoard, createFolder, createProject } from '../data/defaultWorkspace';
import { newId } from '../utils/id';
import { debounce, loadWorkspace, saveWorkspace } from '../utils/storage';

export type ToolName =
  | 'select'
  | 'pan'
  | 'text'
  | 'line'
  | 'arrow'
  | 'doubleArrow'
  | 'rectangle'
  | 'ellipse'
  | 'freehand'
  | 'sticky'
  | 'frame'
  | 'connect';

interface BoardSnapshot {
  elements: BoardElement[];
  connections: Connection[];
}

const HISTORY_LIMIT = 100;

interface AppState {
  workspace: Workspace;
  activeProjectId: string | null;
  selectedIds: string[];
  tool: ToolName;
  sidebarCollapsed: boolean;
  expandedGroups: Record<string, boolean>;
  presentationMode: boolean;
  clipboard: BoardElement[];
  connectFromId: string | null;
  lastStyle: ElementStyle;
  historyPast: BoardSnapshot[];
  historyFuture: BoardSnapshot[];
  historyProjectId: string | null;

  // navigation
  openProject: (projectId: string) => void;
  goToProjects: () => void;

  // folders / projects
  createFolder: (name: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  createProjectInFolder: (folderId: string, name: string) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  moveProject: (projectId: string, targetFolderId: string) => void;

  // ui
  setTool: (tool: ToolName) => void;
  toggleSidebar: () => void;
  toggleGroup: (id: string) => void;
  setPresentationMode: (v: boolean) => void;
  setSelection: (ids: string[]) => void;
  toggleSelected: (id: string) => void;

  // board mutation
  beginChange: () => void;
  addElement: (el: BoardElement) => void;
  addElements: (els: BoardElement[]) => void;
  patchElement: (id: string, patch: Partial<BoardElement>) => void;
  patchElementLive: (id: string, patch: Partial<BoardElement>) => void;
  patchElements: (patches: Array<{ id: string; patch: Partial<BoardElement> }>) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElements: (ids: string[]) => string[];
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;

  addConnection: (conn: Connection) => void;
  updateConnection: (id: string, patch: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  setConnectFrom: (id: string | null) => void;

  setViewport: (v: Viewport) => void;

  undo: () => void;
  redo: () => void;
  copySelection: () => void;
  pasteClipboard: (offset?: { x: number; y: number }) => void;

  importBoard: (board: Board) => void;

  getActiveProject: () => Project | null;
}

function findProject(workspace: Workspace, projectId: string): { folder: Folder; project: Project } | null {
  for (const folder of workspace.folders) {
    const project = folder.projects.find((p) => p.id === projectId);
    if (project) return { folder, project };
  }
  return null;
}

function cloneBoardState(board: Board): BoardSnapshot {
  return {
    elements: board.elements.map((e) => ({ ...e, style: { ...e.style } })),
    connections: board.connections.map((c) => ({ ...c, style: { ...c.style } })),
  };
}

const persistDebounced = debounce((workspace: Workspace) => saveWorkspace(workspace), 400);

export const useAppStore = create<AppState>()(
  immer((set, get) => {
    const initialWorkspace = loadWorkspace() ?? createDefaultWorkspace();
    const initialProjectId = initialWorkspace.folders[0]?.projects[0]?.id ?? null;

    function persist() {
      persistDebounced(get().workspace);
    }

    return {
      workspace: initialWorkspace,
      activeProjectId: initialProjectId,
      selectedIds: [],
      tool: 'select',
      sidebarCollapsed: false,
      expandedGroups: {},
      presentationMode: false,
      clipboard: [],
      connectFromId: null,
      lastStyle: {},
      historyPast: [],
      historyFuture: [],
      historyProjectId: initialProjectId,

      getActiveProject: () => {
        const { workspace, activeProjectId } = get();
        if (!activeProjectId) return null;
        return findProject(workspace, activeProjectId)?.project ?? null;
      },

      openProject: (projectId) =>
        set((state) => {
          state.activeProjectId = projectId;
          state.selectedIds = [];
          state.historyPast = [];
          state.historyFuture = [];
          state.historyProjectId = projectId;
          state.tool = 'select';
        }),

      goToProjects: () =>
        set((state) => {
          state.activeProjectId = null;
        }),

      createFolder: (name) =>
        set((state) => {
          state.workspace.folders.push(createFolder(name));
          persist();
        }),

      renameFolder: (id, name) =>
        set((state) => {
          const folder = state.workspace.folders.find((f) => f.id === id);
          if (folder) folder.name = name;
          persist();
        }),

      deleteFolder: (id) =>
        set((state) => {
          const idx = state.workspace.folders.findIndex((f) => f.id === id);
          if (idx === -1) return;
          const removedProjectIds = new Set(state.workspace.folders[idx].projects.map((p) => p.id));
          state.workspace.folders.splice(idx, 1);
          if (state.activeProjectId && removedProjectIds.has(state.activeProjectId)) {
            state.activeProjectId = null;
          }
          persist();
        }),

      createProjectInFolder: (folderId, name) =>
        set((state) => {
          const folder = state.workspace.folders.find((f) => f.id === folderId);
          if (!folder) return;
          const project = createProject(name);
          folder.projects.push(project);
          state.activeProjectId = project.id;
          state.historyPast = [];
          state.historyFuture = [];
          state.historyProjectId = project.id;
          persist();
        }),

      renameProject: (id, name) =>
        set((state) => {
          const found = findProject(state.workspace, id);
          if (found) {
            found.project.name = name;
            found.project.updatedAt = Date.now();
          }
          persist();
        }),

      duplicateProject: (id) =>
        set((state) => {
          const found = findProject(state.workspace, id);
          if (!found) return;
          const clone: Project = {
            ...found.project,
            id: newId('project'),
            name: `${found.project.name} (cópia)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            board: {
              ...found.project.board,
              id: newId('board'),
              elements: found.project.board.elements.map((e) => ({ ...e, style: { ...e.style } })),
              connections: found.project.board.connections.map((c) => ({ ...c, style: { ...c.style } })),
            },
          };
          found.folder.projects.push(clone);
          persist();
        }),

      deleteProject: (id) =>
        set((state) => {
          for (const folder of state.workspace.folders) {
            const idx = folder.projects.findIndex((p) => p.id === id);
            if (idx !== -1) {
              folder.projects.splice(idx, 1);
              break;
            }
          }
          if (state.activeProjectId === id) state.activeProjectId = null;
          persist();
        }),

      moveProject: (projectId, targetFolderId) =>
        set((state) => {
          let moving: Project | null = null;
          for (const folder of state.workspace.folders) {
            const idx = folder.projects.findIndex((p) => p.id === projectId);
            if (idx !== -1) {
              moving = folder.projects[idx];
              folder.projects.splice(idx, 1);
              break;
            }
          }
          const target = state.workspace.folders.find((f) => f.id === targetFolderId);
          if (moving && target) target.projects.push(moving);
          persist();
        }),

      setTool: (tool) =>
        set((state) => {
          state.tool = tool;
          state.connectFromId = null;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),

      toggleGroup: (id) =>
        set((state) => {
          state.expandedGroups[id] = !state.expandedGroups[id];
        }),

      setPresentationMode: (v) =>
        set((state) => {
          state.presentationMode = v;
          if (v) state.tool = 'pan';
        }),

      setSelection: (ids) =>
        set((state) => {
          state.selectedIds = ids;
        }),

      toggleSelected: (id) =>
        set((state) => {
          const idx = state.selectedIds.indexOf(id);
          if (idx === -1) state.selectedIds.push(id);
          else state.selectedIds.splice(idx, 1);
        }),

      beginChange: () =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          if (state.historyProjectId !== state.activeProjectId) {
            state.historyPast = [];
            state.historyFuture = [];
            state.historyProjectId = state.activeProjectId;
          }
          state.historyPast.push(cloneBoardState(project.board));
          if (state.historyPast.length > HISTORY_LIMIT) state.historyPast.shift();
          state.historyFuture = [];
        }),

      addElement: (el) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          project.board.elements.push(el);
          project.board.updatedAt = Date.now();
          state.selectedIds = [el.id];
          persist();
        });
      },

      addElements: (els) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          project.board.elements.push(...els);
          project.board.updatedAt = Date.now();
          state.selectedIds = els.map((e) => e.id);
          persist();
        });
      },

      patchElement: (id, patch) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          const el = project.board.elements.find((e) => e.id === id);
          if (el) Object.assign(el, patch);
          project.board.updatedAt = Date.now();
          persist();
        });
      },

      // no history push — used for continuous drag/resize updates
      patchElementLive: (id, patch) =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          const el = project.board.elements.find((e) => e.id === id);
          if (el) Object.assign(el, patch);
          project.board.updatedAt = Date.now();
          persist();
        }),

      patchElements: (patches) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          for (const { id, patch } of patches) {
            const el = project.board.elements.find((e) => e.id === id);
            if (el) Object.assign(el, patch);
          }
          project.board.updatedAt = Date.now();
          persist();
        });
      },

      deleteElements: (ids) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          const idSet = new Set(ids);
          project.board.elements = project.board.elements.filter((e) => !idSet.has(e.id));
          project.board.connections = project.board.connections.filter(
            (c) => !idSet.has(c.sourceId) && !idSet.has(c.targetId),
          );
          project.board.updatedAt = Date.now();
          state.selectedIds = state.selectedIds.filter((id) => !idSet.has(id));
          persist();
        });
      },

      duplicateElements: (ids) => {
        const idMap: Record<string, string> = {};
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return [];
          const toClone = project.board.elements.filter((e) => ids.includes(e.id));
          const clones = toClone.map((e) => {
            const id = newId('el');
            idMap[e.id] = id;
            return { ...e, id, x: e.x + 24, y: e.y + 24, style: { ...e.style } };
          });
          project.board.elements.push(...clones);
          state.selectedIds = clones.map((c) => c.id);
          project.board.updatedAt = Date.now();
          persist();
        });
        return Object.values(idMap);
      },

      bringToFront: (ids) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          const maxZ = Math.max(0, ...project.board.elements.map((e) => e.zIndex));
          let z = maxZ + 1;
          const idSet = new Set(ids);
          for (const el of project.board.elements) {
            if (idSet.has(el.id)) el.zIndex = z++;
          }
          persist();
        });
      },

      sendToBack: (ids) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          const minZ = Math.min(0, ...project.board.elements.map((e) => e.zIndex));
          let z = minZ - ids.length;
          const idSet = new Set(ids);
          for (const el of project.board.elements) {
            if (idSet.has(el.id)) el.zIndex = z++;
          }
          persist();
        });
      },

      addConnection: (conn) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          project.board.connections.push(conn);
          project.board.updatedAt = Date.now();
          persist();
        });
      },

      updateConnection: (id, patch) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          const conn = project.board.connections.find((c) => c.id === id);
          if (conn) Object.assign(conn, patch);
          persist();
        });
      },

      deleteConnection: (id) => {
        get().beginChange();
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          project.board.connections = project.board.connections.filter((c) => c.id !== id);
          persist();
        });
      },

      setConnectFrom: (id) =>
        set((state) => {
          state.connectFromId = id;
        }),

      setViewport: (v) =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          project.board.viewport = v;
          persist();
        }),

      undo: () =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project || state.historyPast.length === 0) return;
          const prev = state.historyPast.pop()!;
          state.historyFuture.push(cloneBoardState(project.board));
          project.board.elements = prev.elements;
          project.board.connections = prev.connections;
          state.selectedIds = [];
          persist();
        }),

      redo: () =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project || state.historyFuture.length === 0) return;
          const next = state.historyFuture.pop()!;
          state.historyPast.push(cloneBoardState(project.board));
          project.board.elements = next.elements;
          project.board.connections = next.connections;
          state.selectedIds = [];
          persist();
        }),

      copySelection: () =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          state.clipboard = project.board.elements
            .filter((e) => state.selectedIds.includes(e.id))
            .map((e) => ({ ...e, style: { ...e.style } }));
        }),

      pasteClipboard: (offset = { x: 24, y: 24 }) => {
        const clip = get().clipboard;
        if (clip.length === 0) return;
        const clones = clip.map((e) => ({
          ...e,
          id: newId('el'),
          x: e.x + offset.x,
          y: e.y + offset.y,
          style: { ...e.style },
        }));
        get().addElements(clones);
      },

      importBoard: (board) =>
        set((state) => {
          const project = state.activeProjectId ? findProject(state.workspace, state.activeProjectId)?.project : null;
          if (!project) return;
          project.board = board;
          state.selectedIds = [];
          state.historyPast = [];
          state.historyFuture = [];
          persist();
        }),
    };
  }),
);

export function useActiveBoard(): Board | null {
  const workspace = useAppStore((s) => s.workspace);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  if (!activeProjectId) return null;
  return findProject(workspace, activeProjectId)?.project.board ?? null;
}

export function useActiveProjectMeta(): Project | null {
  const workspace = useAppStore((s) => s.workspace);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  if (!activeProjectId) return null;
  return findProject(workspace, activeProjectId)?.project ?? null;
}

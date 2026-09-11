import { useState } from 'react';
import { FolderKanban, Download, Play, PanelLeftClose, PanelLeftOpen, Undo2, Redo2 } from 'lucide-react';
import { useAppStore, useActiveProjectMeta } from '../store/useAppStore';
import { exportBoardAsPng, exportBoardAsJson } from '../utils/exportBoard';

interface TopBarProps {
  onOpenProjects: () => void;
  onPresent: () => void;
  stageRef: React.RefObject<import('konva/lib/Stage').Stage | null>;
}

export default function TopBar({ onOpenProjects, onPresent, stageRef }: TopBarProps) {
  const project = useActiveProjectMeta();
  const renameProject = useAppStore((s) => s.renameProject);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndo = useAppStore((s) => s.historyPast.length > 0);
  const canRedo = useAppStore((s) => s.historyFuture.length > 0);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="mark">BA</span>
        <div>
          BOARD DE ARQUITETURA
          <span className="subtitle">Arquitetura de Soluções Digitais</span>
        </div>
      </div>

      <button className="icon-btn" onClick={toggleSidebar} title={sidebarCollapsed ? 'Mostrar soluções' : 'Ocultar soluções'}>
        {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
      </button>

      <div className="topbar-divider" />

      <div className="topbar-project">
        <button className="btn ghost-dark" onClick={onOpenProjects}>
          <FolderKanban size={15} /> Projetos
        </button>
        {project && (
          <>
            <span style={{ opacity: 0.4 }}>/</span>
            <input
              value={project.name}
              onChange={(e) => renameProject(project.id, e.target.value)}
              aria-label="Nome do projeto"
            />
            <span className="save-indicator">salvo automaticamente</span>
          </>
        )}
      </div>

      {project && (
        <div className="topbar-actions">
          <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">
            <Undo2 size={17} style={{ opacity: canUndo ? 1 : 0.4 }} />
          </button>
          <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Shift+Z)">
            <Redo2 size={17} style={{ opacity: canRedo ? 1 : 0.4 }} />
          </button>
          <div className="topbar-divider" />
          <div style={{ position: 'relative' }}>
            <button className="btn ghost-dark" onClick={() => setExportOpen((v) => !v)}>
              <Download size={15} /> Exportar
            </button>
            {exportOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'white',
                  color: '#1a1d21',
                  borderRadius: 10,
                  boxShadow: '0 12px 32px rgba(11,31,58,.18)',
                  border: '1px solid #e7ebf1',
                  padding: 6,
                  width: 160,
                  zIndex: 50,
                }}
              >
                {(['PNG', 'JSON'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    className="btn light"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 2, border: 'none' }}
                    onClick={() => {
                      setExportOpen(false);
                      if (fmt === 'PNG') exportBoardAsPng(stageRef.current, project.name);
                      else exportBoardAsJson(project.board, project.name);
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn primary" onClick={onPresent}>
            <Play size={15} /> Apresentar
          </button>
        </div>
      )}
    </div>
  );
}

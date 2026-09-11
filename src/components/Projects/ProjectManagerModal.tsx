import { useState } from 'react';
import { X, FolderPlus, FilePlus2, Copy, Trash2, Pencil } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ProjectManagerModalProps {
  onClose: () => void;
}

export default function ProjectManagerModal({ onClose }: ProjectManagerModalProps) {
  const workspace = useAppStore((s) => s.workspace);
  const createFolder = useAppStore((s) => s.createFolder);
  const renameFolder = useAppStore((s) => s.renameFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const createProjectInFolder = useAppStore((s) => s.createProjectInFolder);
  const renameProject = useAppStore((s) => s.renameProject);
  const duplicateProject = useAppStore((s) => s.duplicateProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const moveProject = useAppStore((s) => s.moveProject);
  const openProject = useAppStore((s) => s.openProject);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);

  function handleNewFolder() {
    const name = window.prompt('Nome da nova pasta', 'Nova pasta');
    if (name && name.trim()) createFolder(name.trim());
  }

  function handleNewProject(folderId: string) {
    const name = window.prompt('Nome do novo projeto', 'Novo projeto');
    if (name && name.trim()) {
      createProjectInFolder(folderId, name.trim());
      onClose();
    }
  }

  function handleOpen(projectId: string) {
    openProject(projectId);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Projetos</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn light" onClick={handleNewFolder}>
              <FolderPlus size={15} /> Nova pasta
            </button>
            <button className="icon-btn" style={{ color: '#4A5568' }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="modal-body">
          {workspace.folders.length === 0 && (
            <div className="empty-hint">Nenhuma pasta ainda. Crie uma pasta para organizar seus projetos.</div>
          )}
          {workspace.folders.map((folder) => (
            <div className="folder-block" key={folder.id}>
              <div className="folder-heading">
                <input
                  defaultValue={folder.name}
                  onBlur={(e) => e.target.value.trim() && renameFolder(folder.id, e.target.value.trim())}
                />
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button className="icon-btn small" style={{ color: '#4A5568' }} onClick={() => handleNewProject(folder.id)} title="Novo projeto nesta pasta">
                    <FilePlus2 size={15} />
                  </button>
                  <button
                    className="icon-btn small"
                    style={{ color: '#FF6B57' }}
                    title="Excluir pasta"
                    onClick={() => {
                      if (window.confirm(`Excluir a pasta "${folder.name}" e todos os projetos dentro dela?`)) {
                        deleteFolder(folder.id);
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>

              {folder.projects.length === 0 && <div className="empty-hint">Nenhum projeto nesta pasta.</div>}

              {folder.projects.map((project) => (
                <div className="project-row" key={project.id}>
                  {renamingProjectId === project.id ? (
                    <input
                      autoFocus
                      defaultValue={project.name}
                      className="name"
                      style={{ border: '1px solid #D8DEE6', borderRadius: 6, padding: '2px 6px' }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) renameProject(project.id, e.target.value.trim());
                        setRenamingProjectId(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    />
                  ) : (
                    <span className="name" onClick={() => handleOpen(project.id)}>
                      {project.name}
                    </span>
                  )}
                  <span className="meta">{project.board.elements.length} elementos</span>
                  {workspace.folders.length > 1 && (
                    <select
                      value={folder.id}
                      onChange={(e) => moveProject(project.id, e.target.value)}
                      style={{ fontSize: 11, border: '1px solid #D8DEE6', borderRadius: 6, padding: '3px 4px' }}
                      title="Mover para pasta"
                    >
                      {workspace.folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <span className="row-actions">
                    <button className="icon-btn small" style={{ color: '#4A5568' }} title="Renomear" onClick={() => setRenamingProjectId(project.id)}>
                      <Pencil size={14} />
                    </button>
                    <button className="icon-btn small" style={{ color: '#4A5568' }} title="Duplicar" onClick={() => duplicateProject(project.id)}>
                      <Copy size={14} />
                    </button>
                    <button
                      className="icon-btn small"
                      style={{ color: '#FF6B57' }}
                      title="Excluir"
                      onClick={() => {
                        if (window.confirm(`Excluir o projeto "${project.name}"?`)) deleteProject(project.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

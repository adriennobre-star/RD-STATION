import { useRef, useState } from 'react';
import type Konva from 'konva';
import { X } from 'lucide-react';
import TopBar from './components/TopBar';
import SolutionsSidebar from './components/Sidebar/SolutionsSidebar';
import BoardCanvas from './components/Canvas/BoardCanvas';
import DrawToolbar from './components/Toolbar/DrawToolbar';
import ProjectManagerModal from './components/Projects/ProjectManagerModal';
import Landing from './components/Landing';
import { useAppStore, useActiveBoard } from './store/useAppStore';

export default function App() {
  const board = useActiveBoard();
  const presentationMode = useAppStore((s) => s.presentationMode);
  const setPresentationMode = useAppStore((s) => s.setPresentationMode);
  const [projectsOpen, setProjectsOpen] = useState(!board);
  const stageRef = useRef<Konva.Stage | null>(null);

  return (
    <div className={`app-shell${presentationMode ? ' presentation' : ''}`}>
      {!presentationMode && (
        <TopBar onOpenProjects={() => setProjectsOpen(true)} onPresent={() => setPresentationMode(true)} stageRef={stageRef} />
      )}

      <div className="app-body">
        {!presentationMode && <SolutionsSidebar />}
        {board ? (
          <BoardCanvas board={board} stageRef={stageRef} presentation={presentationMode} />
        ) : (
          <Landing onOpenProjects={() => setProjectsOpen(true)} />
        )}
      </div>

      {!presentationMode && board && <DrawToolbar />}

      {presentationMode && (
        <button className="btn light presentation-exit" onClick={() => setPresentationMode(false)}>
          <X size={15} /> Sair da apresentação
        </button>
      )}

      {projectsOpen && <ProjectManagerModal onClose={() => setProjectsOpen(false)} />}
    </div>
  );
}

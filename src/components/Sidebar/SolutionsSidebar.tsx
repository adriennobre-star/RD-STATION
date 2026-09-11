import { SOLUTION_GROUPS } from '../../data/assetLibrary';
import { useAppStore } from '../../store/useAppStore';
import SolutionGroupItem from './SolutionGroupItem';

export default function SolutionsSidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Soluções</span>
      </div>
      <div className="sidebar-body">
        {SOLUTION_GROUPS.map((group) => (
          <SolutionGroupItem key={group.id} group={group} />
        ))}
      </div>
    </aside>
  );
}

import { ChevronRight } from 'lucide-react';
import type { SolutionGroup } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import AssetChip from './AssetChip';

export default function SolutionGroupItem({ group }: { group: SolutionGroup }) {
  const expanded = useAppStore((s) => !!s.expandedGroups[group.id]);
  const toggleGroup = useAppStore((s) => s.toggleGroup);

  return (
    <div className="solution-group">
      <button
        className={`solution-group-header${expanded ? ' open' : ''}`}
        onClick={() => toggleGroup(group.id)}
        aria-expanded={expanded}
      >
        <span className="solution-dot" style={{ background: group.color }} />
        {group.name}
        <span className="chevron">
          <ChevronRight size={15} />
        </span>
      </button>
      {expanded && (
        <div className="solution-assets">
          {group.assets.map((asset) => (
            <AssetChip key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

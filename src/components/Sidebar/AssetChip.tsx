import type { Asset } from '../../types';
import { Image as ImageIcon, MonitorSmartphone, Sparkle } from 'lucide-react';

const ICONS: Record<Asset['type'], React.ElementType> = {
  logo: Sparkle,
  screenshot: MonitorSmartphone,
  icon: ImageIcon,
  image: ImageIcon,
};

export const ASSET_DRAG_MIME = 'application/x-board-asset';

export default function AssetChip({ asset }: { asset: Asset }) {
  const Icon = ICONS[asset.type];
  return (
    <div
      className="asset-chip"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(ASSET_DRAG_MIME, asset.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      title={`Arraste para o canvas — ${asset.name}`}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 9,
          background: asset.kind === 'image' ? '#ffffff' : asset.color,
          border: asset.kind === 'image' ? '1px solid #E7EBF1' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: asset.kind === 'image' ? 7 : 0,
        }}
      >
        {asset.kind === 'image' && asset.imageUrl ? (
          <img src={asset.imageUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
        ) : (
          <Icon size={18} />
        )}
      </div>
      <span className="asset-chip-label">{asset.name.replace(`${asset.solution} — `, '')}</span>
    </div>
  );
}

import { FolderKanban } from 'lucide-react';

export default function Landing({ onOpenProjects }: { onOpenProjects: () => void }) {
  return (
    <div className="landing">
      <h1>Nenhum projeto aberto</h1>
      <p>
        Abra um projeto existente ou crie um novo para começar a desenhar a arquitetura digital do
        cliente — soluções, canais, integrações e fluxos, tudo em um board visual infinito.
      </p>
      <button className="btn primary" onClick={onOpenProjects}>
        <FolderKanban size={16} /> Abrir projetos
      </button>
    </div>
  );
}

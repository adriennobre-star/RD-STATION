import type { Asset, SolutionGroup } from '../types';

/**
 * Biblioteca de soluções.
 *
 * Nenhuma logo é inventada: como não foi possível validar, para cada marca,
 * um asset oficial com licença de uso e CORS estável para o canvas, cada
 * solução usa um "chip" tipográfico (nome + cor de marca aproximada) em vez
 * de um logotipo fabricado. O campo `kind` marca isso como `placeholder`;
 * quando um asset oficial (logo/screenshot) estiver disponível, basta
 * preencher `imageUrl`/`sourceUrl` e trocar `kind` para `image` aqui.
 */

interface SolutionDef {
  id: string;
  name: string;
  color: string;
  sourceUrl: string;
}

const SOLUTIONS: SolutionDef[] = [
  { id: 'rd-station', name: 'RD Station', color: '#1857A4', sourceUrl: 'https://www.rdstation.com' },
  { id: 'rd-marketing', name: 'RD Marketing', color: '#2073D1', sourceUrl: 'https://www.rdstation.com/marketing/' },
  { id: 'rd-crm', name: 'RD CRM', color: '#1B6FA8', sourceUrl: 'https://www.rdstation.com/crm/' },
  { id: 'rd-conversas', name: 'RD Conversas', color: '#3D62B0', sourceUrl: 'https://www.rdstation.com/conversas/' },
  { id: 'suri', name: 'SURI', color: '#2E8B84', sourceUrl: 'https://suri.chat' },
  { id: 'shopify', name: 'Shopify', color: '#4C7A4C', sourceUrl: 'https://www.shopify.com' },
  { id: 'lexos', name: 'Lexos', color: '#56606E', sourceUrl: '' },
  { id: 'isthmus', name: 'Isthmus', color: '#47586B', sourceUrl: '' },
  { id: 'omnik', name: 'Omnik', color: '#3E5266', sourceUrl: '' },
  { id: 'ipaas', name: 'iPaaS', color: '#6B5B95', sourceUrl: '' },
];

function buildAssets(def: SolutionDef): Asset[] {
  return [
    {
      id: `${def.id}-logo`,
      solution: def.name,
      name: `${def.name} — Logo`,
      type: 'logo',
      color: def.color,
      sourceUrl: def.sourceUrl,
      kind: 'placeholder',
    },
    {
      id: `${def.id}-interface`,
      solution: def.name,
      name: `${def.name} — Interface`,
      type: 'screenshot',
      color: def.color,
      sourceUrl: def.sourceUrl,
      kind: 'placeholder',
    },
    {
      id: `${def.id}-icon`,
      solution: def.name,
      name: `${def.name} — Ícone`,
      type: 'icon',
      color: def.color,
      sourceUrl: def.sourceUrl,
      kind: 'placeholder',
    },
  ];
}

export const SOLUTION_GROUPS: SolutionGroup[] = SOLUTIONS.map((def) => ({
  id: def.id,
  name: def.name,
  color: def.color,
  assets: buildAssets(def),
}));

export const ASSET_INDEX: Record<string, Asset> = SOLUTION_GROUPS.reduce(
  (acc, group) => {
    for (const asset of group.assets) acc[asset.id] = asset;
    return acc;
  },
  {} as Record<string, Asset>,
);

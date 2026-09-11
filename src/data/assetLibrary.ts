import type { Asset, SolutionGroup } from '../types';
// Sourced from simple-icons (CC0 1.0 Universal — public domain):
// https://github.com/simple-icons/simple-icons/blob/develop/icons/shopify.svg
import shopifyLogo from '../assets/logos/shopify-logo-colored.svg';
import shopifyIcon from '../assets/logos/shopify-icon.svg';

/**
 * Biblioteca de soluções.
 *
 * Este é um ambiente sandbox sem acesso geral à web (só a alguns domínios
 * liberados, entre eles o GitHub) — não há como "visitar" o site de cada
 * marca para baixar prints/logos oficiais diretamente. Onde a marca tem um
 * asset real disponível em uma biblioteca open-source hospedada no GitHub
 * (ex: simple-icons/gilbarbara-logos, ambas CC0/MIT), ele é usado — ver
 * `logoUrl`/`iconUrl` abaixo. Nenhuma logo é desenhada/inventada à mão: as
 * marcas sem asset real disponível por esse caminho continuam com um chip
 * tipográfico (nome + cor aproximada), marcado como `kind: 'placeholder'`,
 * até que alguém importe o arquivo oficial (ex: exportado do site da marca).
 */

interface SolutionDef {
  id: string;
  name: string;
  color: string;
  sourceUrl: string;
  logoUrl?: string;
  iconUrl?: string;
}

const SOLUTIONS: SolutionDef[] = [
  { id: 'rd-station', name: 'RD Station', color: '#1857A4', sourceUrl: 'https://www.rdstation.com' },
  { id: 'rd-marketing', name: 'RD Marketing', color: '#2073D1', sourceUrl: 'https://www.rdstation.com/marketing/' },
  { id: 'rd-crm', name: 'RD CRM', color: '#1B6FA8', sourceUrl: 'https://www.rdstation.com/crm/' },
  { id: 'rd-conversas', name: 'RD Conversas', color: '#3D62B0', sourceUrl: 'https://www.rdstation.com/conversas/' },
  { id: 'suri', name: 'SURI', color: '#2E8B84', sourceUrl: 'https://suri.chat' },
  {
    id: 'shopify',
    name: 'Shopify',
    color: '#95BF47',
    sourceUrl: 'https://www.shopify.com',
    logoUrl: shopifyLogo,
    iconUrl: shopifyIcon,
  },
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
      imageUrl: def.logoUrl,
      kind: def.logoUrl ? 'image' : 'placeholder',
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
      imageUrl: def.iconUrl,
      kind: def.iconUrl ? 'image' : 'placeholder',
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

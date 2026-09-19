// Real service categories carry a plain lowercase icon code seeded in the DB
// (wrench/zap/sparkles/...) — same codes web maps to lucide icons
// (see applications/frontend/web/web-user/src/routes/services.tsx). Mobile's design
// uses emoji tiles instead, so this maps the same real codes to emoji rather
// than inventing a parallel category taxonomy.
const CATEGORY_EMOJI: Record<string, string> = {
  wrench: '🔧',
  zap: '⚡',
  sparkles: '✨',
  hammer: '🔨',
  paintbrush: '🎨',
  tv: '📺',
  wind: '❄️',
  leaf: '🌿',
  bug: '🐛',
  truck: '📦',
  siren: '🚨',
  tool: '🛠️',
}

export function emojiForCategory(icon?: string | null): string {
  return CATEGORY_EMOJI[(icon ?? '').toLowerCase()] ?? '🔧'
}

export const COLOR_PALETTE = ['#7210FF', '#00B894', '#0984E3', '#E17055', '#FDCB6E', '#A29BFE', '#FF6B35', '#00CEC9', '#FF6FA5', '#6C5CE7']

export function colorForSeed(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]!
}

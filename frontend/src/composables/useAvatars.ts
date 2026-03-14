import kidI from '@/assets/drawings/kidI.png'
import kidII from '@/assets/drawings/kidII.png'
import kidIII from '@/assets/drawings/kidIII.png'
import kidIV from '@/assets/drawings/kidIV.png'
import kidV from '@/assets/drawings/kidV.png'
import kidVI from '@/assets/drawings/kidVI.png'
import kidVII from '@/assets/drawings/kidVII.png'
import kidVIII from '@/assets/drawings/kidVIII.png'

export interface AvatarInfo {
  id: number
  nome: string
  src: string
}

export const AVATARES: AvatarInfo[] = [
  { id: 1, nome: 'Criança I',    src: kidI },
  { id: 2, nome: 'Criança II',   src: kidII },
  { id: 3, nome: 'Criança III',  src: kidIII },
  { id: 4, nome: 'Criança IV',   src: kidIV },
  { id: 5, nome: 'Criança V',    src: kidV },
  { id: 6, nome: 'Criança VI',   src: kidVI },
  { id: 7, nome: 'Criança VII',  src: kidVII },
  { id: 8, nome: 'Criança VIII', src: kidVIII },
]

const avatarMap = new Map<number, string>(AVATARES.map(a => [a.id, a.src]))

export function getAvatarSrc(avatarId?: number | null): string | null {
  if (!avatarId) return null
  return avatarMap.get(avatarId) ?? null
}

// ── Avatar colors — deterministic per student ──────────────────
export const AVATAR_COLOR_STYLES = {
  yellow: { bg: '#FFCC02', text: '#856900', border: '#E8A800' },
  green:  { bg: '#3DC98A', text: '#fff',    border: '#2aa870' },
  blue:   { bg: '#4A90E2', text: '#fff',    border: '#2f72c8' },
  red:    { bg: '#F25C5C', text: '#fff',    border: '#d93c3c' },
} as const

export type AvatarColor = keyof typeof AVATAR_COLOR_STYLES

const COLOR_KEYS = Object.keys(AVATAR_COLOR_STYLES) as AvatarColor[]

/** Returns a consistent color for a given student seed (ID or name). */
export function getAvatarColor(seed: string): AvatarColor {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return COLOR_KEYS[hash % COLOR_KEYS.length]
}

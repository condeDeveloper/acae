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

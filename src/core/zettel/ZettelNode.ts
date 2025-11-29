import type { FileRef } from '../../types/interfaces'

export interface ZettelNode {
  id: string
  file?: FileRef
  children: ZettelNode[]
}

import type { ZettelNode } from '../../types/interfaces'
import type { ZettelId } from './ZettelId'

/**
 * Pure in-memory index for ZettelNodes.
 */
export class ZettelIndexer {
  private readonly index = new Map<string, ZettelNode>()

  add(node: ZettelNode): void {
    this.index.set(node.id.toString(), node)
  }

  remove(id: string | ZettelId): void {
    const key = typeof id === 'string' ? id : id.toString()
    this.index.delete(key)
  }

  get(id: string | ZettelId): ZettelNode | undefined {
    const key = typeof id === 'string' ? id : id.toString()
    return this.index.get(key)
  }

  getAll(): ZettelNode[] {
    return Array.from(this.index.values())
  }

  clear(): void {
    this.index.clear()
  }
}

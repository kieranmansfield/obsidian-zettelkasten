import type { ZettelNode } from '../../types/interfaces'

/**
 * Stateless refactor operations for ZettelNode.
 */
export class ZettelRefactor {
  /**
   * Returns a new node with a different id (immutable).
   */
  static renameNode(node: ZettelNode, newId: string): ZettelNode {
    return { ...node, id: newId }
  }

  /**
   * Returns a new node with reordered children (immutable).
   */
  static reorderChildren(node: ZettelNode, newOrder: ZettelNode[]): ZettelNode {
    return { ...node, children: newOrder }
  }
}

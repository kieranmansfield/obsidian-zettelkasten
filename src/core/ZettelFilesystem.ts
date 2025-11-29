import type { ZettelNode } from './zettel/ZettelNode'

/**
 * Pure, immutable reordering engine for arrays of ZettelNode.
 * Returns a new array with the item moved. No side-effects.
 */
export class ReorderEngine {
  reorder(list: readonly ZettelNode[], fromIndex: number, toIndex: number): ZettelNode[] {
    const len = list.length
    if (fromIndex < 0 || fromIndex >= len) return [...list]
    if (toIndex < 0) toIndex = 0
    if (toIndex >= len) toIndex = len - 1

    const copy = list.slice()
    const [item] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, item)
    return copy
  }
}

export default ReorderEngine

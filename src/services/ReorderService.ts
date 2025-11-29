import { ZettelNode } from '../core/zettel/ZettelNode'
import { ReorderEngine } from '../core/zettel/ReorderEngine'
import UndoManager from '../core/logger/UndoManager'
import { UndoAction } from '../../types/interfaces'

export class ReorderService {
  private engine = new ReorderEngine()

  constructor(private undoManager: UndoManager) {}

  /**
   * Reorder a list of nodes and record undo/redo
   * Returns the new reordered list
   */
  reorder(nodes: ZettelNode[], fromIndex: number, toIndex: number): ZettelNode[] {
    const oldNodes = [...nodes]
    const newNodes = this.engine.reorder(nodes, fromIndex, toIndex)

    // Add undo action
    const action: UndoAction = {
      description: `Reorder node from ${fromIndex} to ${toIndex}`,
      undo: async () => oldNodes,
      redo: async () => newNodes,
    }
    this.undoManager.add(action)

    return newNodes
  }

  canUndo(): boolean {
    return this.undoManager.canUndo()
  }

  canRedo(): boolean {
    return this.undoManager.canRedo()
  }

  undo(): Promise<boolean> {
    return this.undoManager.undo()
  }

  redo(): Promise<boolean> {
    return this.undoManager.redo()
  }
}

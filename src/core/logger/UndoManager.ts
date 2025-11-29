import { UndoAction } from '../../types/interfaces'

/**
 * Pure Undo/Redo Manager
 */
export class UndoManager {
  private undoStack: UndoAction[] = []
  private redoStack: UndoAction[] = []

  add(action: UndoAction) {
    this.undoStack.push(action)
    this.redoStack = []
  }

  async undo(): Promise<boolean> {
    const action = this.undoStack.pop()
    if (!action) return false
    await action.undo()
    this.redoStack.push(action)
    return true
  }

  async redo(): Promise<boolean> {
    const action = this.redoStack.pop()
    if (!action) return false
    await action.redo()
    this.undoStack.push(action)
    return true
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }
}

export default UndoManager

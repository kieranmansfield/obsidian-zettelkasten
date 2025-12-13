import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'

/**
 * Command: Next Child
 *
 * Opens the next child in the current parent's children list
 * (Same as Next Sibling)
 */
export const nextChildCommand: CommandFactory = (context) => {
  return {
    id: 'next-child',
    name: 'Next Child',
    icon: 'chevron-right',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to next child in parent (same as next sibling)',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      const activeFile = context.app.workspace.getActiveFile()
      if (!activeFile) {
        new Notice('No active file')
        return
      }

      if (!context.noteSequenceService) {
        new Notice('Note sequence service not available')
        return
      }

      const core = context.noteSequenceService.getCore()
      const currentId = core.extractZettelId(activeFile.basename)

      if (!currentId) {
        new Notice('Current file is not a zettel note')
        return
      }

      // Get parent to find siblings
      const parentResult = context.noteSequenceService.navigateToParent(activeFile)

      if (!parentResult.success || !parentResult.node) {
        new Notice('No parent zettel found')
        return
      }

      // Get all children of parent (siblings)
      const siblings = context.noteSequenceService
        .navigateToChildren(parentResult.node.file)
        .filter((r) => r.success && r.node)
        .map((r) => r.node!.file)
        .sort((a, b) => a.basename.localeCompare(b.basename))

      const currentIndex = siblings.findIndex((f) => f.path === activeFile.path)

      if (currentIndex === -1) {
        new Notice('Could not find current file in siblings')
        return
      }

      if (currentIndex === siblings.length - 1) {
        new Notice('Already at last child')
        return
      }

      const nextChild = siblings[currentIndex + 1]
      const leaf = context.app.workspace.getLeaf(false)
      await leaf.openFile(nextChild)
      new Notice(`Navigated to next child: ${nextChild.basename}`)
    },
  }
}

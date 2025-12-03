import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import ZettelId from '../core/zettelId.class'

/**
 * Command: Next Sibling
 *
 * Opens the next sibling zettel in the sequence
 */
export const nextSiblingCommand: CommandFactory = (context) => {
  return {
    id: 'next-sibling',
    name: 'Next Sibling',
    icon: 'arrow-right',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to next sibling zettel',
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
        new Notice('Note Sequence Service not available')
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
        // If no parent, this is a root zettel - find other root zettels
        const allRoots = context.noteSequenceService
          .getRootsInFolder(activeFile.parent?.path || '')
          .sort((a, b) => a.basename.localeCompare(b.basename))

        const currentIndex = allRoots.findIndex((f) => f.path === activeFile.path)
        if (currentIndex === -1 || currentIndex === allRoots.length - 1) {
          new Notice('Already at last sequence')
          return
        }

        const nextRoot = allRoots[currentIndex + 1]
        const leaf = context.app.workspace.getLeaf(false)
        await leaf.openFile(nextRoot)
        new Notice(`Navigated to next sequence: ${nextRoot.basename}`)
        return
      }

      // Get all siblings (children of parent)
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
        new Notice('Already at last sibling')
        return
      }

      const nextSibling = siblings[currentIndex + 1]
      const leaf = context.app.workspace.getLeaf(false)
      await leaf.openFile(nextSibling)
      new Notice(`Navigated to next sibling: ${nextSibling.basename}`)
    },
  }
}

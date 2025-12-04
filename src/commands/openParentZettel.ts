import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'

/**
 * Command: Open Parent Zettel / Up a Level
 *
 * Opens the parent zettel of the active note
 */
export const openParentZettelCommand: CommandFactory = (context) => {
  return {
    id: 'open-parent-zettel',
    name: 'Open Parent Zettel (Up a Level)',
    icon: 'arrow-up',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to parent zettel',
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

      const result = context.noteSequenceService.navigateToParent(activeFile)

      if (!result.success || !result.node) {
        new Notice(result.error || 'Failed to find parent zettel')
        return
      }

      // Open the parent file
      const leaf = context.app.workspace.getLeaf(false)
      await leaf.openFile(result.node.file)
      new Notice(`Navigated to parent: ${result.node.file.basename}`)
    },
  }
}

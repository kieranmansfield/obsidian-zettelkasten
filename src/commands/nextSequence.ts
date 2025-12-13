import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'

/**
 * Command: Next Sequence
 *
 * Opens the root note of the next note sequence
 */
export const nextSequenceCommand: CommandFactory = (context) => {
  return {
    id: 'next-sequence',
    name: 'Next Sequence',
    icon: 'skip-forward',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to next note sequence',
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

      // Find the root of the current sequence
      const allFiles = context.app.vault
        .getMarkdownFiles()
        .filter((f) => f.path.startsWith(activeFile.parent?.path || ''))

      const rootFile = core.findRootFile(activeFile, allFiles)

      if (!rootFile) {
        new Notice('Could not find root of current sequence')
        return
      }

      // Get all root zettels in the folder
      const allRoots = context.noteSequenceService
        .getRootsInFolder(activeFile.parent?.path || '')
        .sort((a, b) => a.basename.localeCompare(b.basename))

      const currentIndex = allRoots.findIndex((f) => f.path === rootFile.path)

      if (currentIndex === -1) {
        new Notice('Could not find current sequence')
        return
      }

      if (currentIndex === allRoots.length - 1) {
        // Wrap to first
        const firstRoot = allRoots[0]
        const leaf = context.app.workspace.getLeaf(false)
        await leaf.openFile(firstRoot)
        new Notice(`Navigated to first sequence: ${firstRoot.basename}`)
        return
      }

      const nextRoot = allRoots[currentIndex + 1]
      const leaf = context.app.workspace.getLeaf(false)
      await leaf.openFile(nextRoot)
      new Notice(`Navigated to next sequence: ${nextRoot.basename}`)
    },
  }
}

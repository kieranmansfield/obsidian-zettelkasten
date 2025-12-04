import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import ZettelId from '../core/zettelId.class'

/**
 * Command: Outdent Zettel
 *
 * Makes the active zettel a sibling of its parent
 */
export const outdentZettelCommand: CommandFactory = (context) => {
  return {
    id: 'outdent-zettel',
    name: 'Outdent Zettel',
    icon: 'outdent',

    metadata: {
      category: 'note-sequences',
      description: 'Make zettel a sibling of its parent',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      const activeFile = context.app.workspace.getActiveFile()
      if (!activeFile) {
        new Notice('No active file')
        return
      }

      if (!context.noteSequenceService || !context.fileService) {
        new Notice('Required services not available')
        return
      }

      const core = context.noteSequenceService.getCore()
      const currentIdString = core.extractZettelId(activeFile.basename)

      if (!currentIdString) {
        new Notice('Current file is not a zettel note')
        return
      }

      const currentId = ZettelId.parse(currentIdString)

      // Get parent
      const parentResult = context.noteSequenceService.navigateToParent(activeFile)

      if (!parentResult.success || !parentResult.node) {
        new Notice('Cannot outdent a root zettel')
        return
      }

      const parentFile = parentResult.node.file
      const parentIdString = core.extractZettelId(parentFile.basename)

      if (!parentIdString) {
        new Notice('Parent is not a valid zettel')
        return
      }

      const parentId = ZettelId.parse(parentIdString)

      // Get grandparent to find parent's siblings
      const grandparentResult = context.noteSequenceService.navigateToParent(parentFile)

      let parentSiblings
      if (!grandparentResult.success || !grandparentResult.node) {
        // Parent is a root - get all roots
        parentSiblings = context.noteSequenceService
          .getRootsInFolder(parentFile.parent?.path || '')
          .sort((a, b) => a.basename.localeCompare(b.basename))
      } else {
        // Parent has a parent - get siblings of parent
        parentSiblings = context.noteSequenceService
          .navigateToChildren(grandparentResult.node.file)
          .filter((r) => r.success && r.node)
          .map((r) => r.node!.file)
          .sort((a, b) => a.basename.localeCompare(b.basename))
      }

      // Find parent's position
      const parentIndex = parentSiblings.findIndex((f) => f.path === parentFile.path)

      if (parentIndex === -1) {
        new Notice('Could not find parent in siblings')
        return
      }

      // Generate new ID as sibling of parent (after parent)
      const newId = parentId.nextSibling()

      if (!newId) {
        new Notice('Error generating new ID')
        return
      }

      // Get title from frontmatter to preserve it
      const cache = context.app.metadataCache.getFileCache(activeFile)
      const title = cache?.frontmatter?.title || ''

      // Build new filename
      const newFilename = title ? `${newId.toString()} ${title}` : newId.toString()

      // Rename the file
      const result = await context.fileService.rename({
        file: activeFile,
        newName: newFilename,
      })

      if (result) {
        new Notice(`Outdented zettel to sibling of ${parentFile.basename}`)
      } else {
        new Notice('Failed to outdent zettel')
      }
    },
  }
}

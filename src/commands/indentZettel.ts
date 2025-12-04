import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import ZettelId from '../core/zettelId.class'

/**
 * Command: Indent Zettel
 *
 * Makes the active zettel a child of its previous sibling
 */
export const indentZettelCommand: CommandFactory = (context) => {
  return {
    id: 'indent-zettel',
    name: 'Indent Zettel',
    icon: 'indent',

    metadata: {
      category: 'note-sequences',
      description: 'Make zettel a child of previous sibling',
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

      // Get parent to find siblings
      const parentResult = context.noteSequenceService.navigateToParent(activeFile)

      let siblings
      if (!parentResult.success || !parentResult.node) {
        // Root level zettel - get all roots
        siblings = context.noteSequenceService
          .getRootsInFolder(activeFile.parent?.path || '')
          .sort((a, b) => a.basename.localeCompare(b.basename))
      } else {
        // Has parent - get children of parent (siblings)
        siblings = context.noteSequenceService
          .navigateToChildren(parentResult.node.file)
          .filter((r) => r.success && r.node)
          .map((r) => r.node!.file)
          .sort((a, b) => a.basename.localeCompare(b.basename))
      }

      const currentIndex = siblings.findIndex((f) => f.path === activeFile.path)

      if (currentIndex === -1) {
        new Notice('Could not find current file in siblings')
        return
      }

      if (currentIndex === 0) {
        new Notice('No previous sibling to indent under')
        return
      }

      // Get previous sibling
      const prevSibling = siblings[currentIndex - 1]
      const prevIdString = core.extractZettelId(prevSibling.basename)

      if (!prevIdString) {
        new Notice('Previous sibling is not a valid zettel')
        return
      }

      const prevId = ZettelId.parse(prevIdString)

      // Generate new ID as last child of previous sibling
      const existingChildren = core.findChildren(prevSibling, siblings, true)
      let newId: ZettelId

      if (existingChildren.length === 0) {
        // First child
        newId = prevId.nextChild()
      } else {
        // Find the last child and get next sibling of it
        const lastChild = existingChildren[existingChildren.length - 1]
        const lastChildIdString = core.extractZettelId(lastChild.basename)
        if (!lastChildIdString) {
          new Notice('Error finding last child')
          return
        }
        const lastChildId = ZettelId.parse(lastChildIdString)
        const nextSiblingId = lastChildId.nextSibling()
        if (!nextSiblingId) {
          new Notice('Error generating new ID')
          return
        }
        newId = nextSiblingId
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
        new Notice(`Indented zettel under ${prevSibling.basename}`)
      } else {
        new Notice('Failed to indent zettel')
      }
    },
  }
}

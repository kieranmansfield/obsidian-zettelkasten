import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import { activeZettel, moveUnder } from '../base/sequenceEdit'
import { compareZettelFiles, parentZettelId, parseZettelId } from '../base/zettelIdOrder'

/**
 * Command: Indent Zettel
 *
 * Moves the active zettel, with its descendants, under its previous sibling
 * (for a root: the previous root in its folder)
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
      const active = activeZettel(context)
      if (!active) return

      const parentId = parentZettelId(active.id)
      const siblings = context.app.vault
        .getMarkdownFiles()
        .filter((f) => {
          const id = parseZettelId(f.basename)?.id
          return (
            id && f.parent?.path === active.file.parent?.path && parentZettelId(id) === parentId
          )
        })
        .sort(compareZettelFiles)
      const prev = siblings[siblings.findIndex((f) => f.path === active.file.path) - 1]

      if (!prev) {
        new Notice('No previous sibling to indent under')
        return
      }

      await moveUnder(
        context,
        active.file,
        parseZettelId(prev.basename)!.id,
        `Indented under ${prev.basename}`
      )
    },
  }
}

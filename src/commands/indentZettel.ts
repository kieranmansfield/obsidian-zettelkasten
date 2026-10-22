import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import { activeZettel, moveUnder } from '../base/sequenceEdit'
import { parseZettelId } from '../base/zettelIdOrder'

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
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return

      const prev = context.noteSequenceService.adjacent(active.file, -1)
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

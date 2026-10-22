import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import { activeZettel, moveUnder } from '../base/sequenceEdit'
import { parentZettelId } from '../base/zettelIdOrder'

/**
 * Command: Outdent Zettel
 *
 * Moves the active zettel, with its descendants, up one level: to the end of its parent's siblings
 */
export const outdentZettelCommand: CommandFactory = (context) => {
  return {
    id: 'outdent-zettel',
    name: 'Outdent Zettel',
    icon: 'outdent',

    metadata: {
      category: 'note-sequences',
      description: 'Make zettel a sibling of its parent',
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return

      const parentId = parentZettelId(active.id)
      const grandparentId = parentId && parentZettelId(parentId)

      if (!grandparentId) {
        new Notice(
          parentId
            ? "Can't outdent a child of a root: roots have no siblings"
            : 'Cannot outdent a root zettel'
        )
        return
      }

      // ponytail: appends at the end of the parent's level; inserting right after the parent would renumber siblings
      await moveUnder(
        context,
        active.file,
        grandparentId,
        "Outdented to the end of its parent's level"
      )
    },
  }
}

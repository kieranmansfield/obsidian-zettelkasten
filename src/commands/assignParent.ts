import type { CommandFactory } from '../base/command'
import { pickZettelInFolder } from '../ui/ZettelSelectorModal'
import { activeZettel, moveUnder } from '../base/sequenceEdit'
import { parseZettelId } from '../base/zettelIdOrder'

/**
 * Command: Assign Parent
 *
 * Moves the active zettel, with its descendants, to the end of a chosen zettel's children
 */
export const assignParentCommand: CommandFactory = (context) => {
  return {
    id: 'assign-parent',
    name: 'Assign Parent',
    icon: 'link',

    metadata: {
      category: 'note-sequences',
      description: 'Assign a parent zettel to the active note',
    },

    execute: () => {
      const active = activeZettel(context)
      if (!active) return

      pickZettelInFolder(context.app, active.file, 'Select parent zettel...', (parent) =>
        moveUnder(
          context,
          active.file,
          parseZettelId(parent.basename)!.id,
          `Assigned ${parent.basename} as parent`
        )
      )
    },
  }
}

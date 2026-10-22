import type { CommandFactory } from '../base/command'
import { pickZettelInFolder } from '../ui/ZettelSelectorModal'
import { activeZettel, moveUnder } from '../base/sequenceEdit'

/**
 * Command: Assign Child
 *
 * Moves a chosen zettel, with its descendants, to the end of the active zettel's children
 */
export const assignChildCommand: CommandFactory = (context) => {
  return {
    id: 'assign-child',
    name: 'Assign Child',
    icon: 'link',

    metadata: {
      category: 'note-sequences',
      description: 'Assign a child zettel to the active note',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      const active = activeZettel(context)
      if (!active) return

      pickZettelInFolder(context.app, active.file, 'Select child zettel...', (child) =>
        moveUnder(context, child, active.id, `Assigned ${child.basename} as child`)
      )
    },
  }
}

import type { CommandFactory } from '../base/command'
import { activeZettel, openZettel } from '../base/sequenceEdit'
import { pickZettel } from '../ui/ZettelSelectorModal'

/**
 * Command: Open Child Zettel / Down a Level
 *
 * Opens the first child zettel of the active note (or shows a picker if multiple)
 */
export const openChildZettelCommand: CommandFactory = (context) => {
  return {
    id: 'open-child-zettel',
    name: 'Open Child Zettel (Down a Level)',
    icon: 'arrow-down',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to first child zettel',
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return

      const children = context.noteSequenceService.children(active.file)
      if (children.length <= 1) {
        await openZettel(
          context,
          children[0] ?? null,
          'Navigated to child',
          'No child zettels found'
        )
        return
      }
      pickZettel(context.app, children, 'Select child zettel...', (file) =>
        openZettel(context, file, 'Navigated to child', '')
      )
    },
  }
}

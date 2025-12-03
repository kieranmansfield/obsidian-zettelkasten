import type { CommandFactory } from '../base/command'
import { OpenZettelModal } from '../ui/OpenZettelModal'

/**
 * Command: Open Zettel Note
 *
 * Opens a fuzzy search modal to find and open zettel notes
 */
export const openZettelCommand: CommandFactory = (context) => {
  return {
    id: 'open-zettel',
    name: 'Open Zettel Note',
    icon: 'search',

    metadata: {
      category: 'navigation',
      description: 'Search and open zettel notes',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.settingsManager) {
        console.error('SettingsManager not available')
        return
      }

      new OpenZettelModal(context.app, context.settingsManager).open()
    },
  }
}

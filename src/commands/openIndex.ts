import type { CommandFactory } from '../base/command'
import { OpenIndexModal } from '../ui/OpenIndexModal'

/**
 * Command: Open Index Note
 *
 * Opens a fuzzy search modal to find and open index notes
 */
export const openIndexCommand: CommandFactory = (context) => {
  return {
    id: 'open-index',
    name: 'Open Index Note',
    icon: 'search',

    metadata: {
      category: 'navigation',
      description: 'Search and open index notes',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.settingsManager) {
        console.error('SettingsManager not available')
        return
      }

      new OpenIndexModal(context.app, context.settingsManager).open()
    },
  }
}

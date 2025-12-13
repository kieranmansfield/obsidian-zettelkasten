import type { CommandFactory } from '../base/command'
import { BoxPaletteModal } from '../ui/BoxPaletteModal'

/**
 * Command: Open Box Palette
 *
 * Opens a palette to select and navigate between boxes
 */
export const openBoxPaletteCommand: CommandFactory = (context) => {
  return {
    id: 'open-box-palette',
    name: 'Open Box Palette',
    icon: 'folder-tree',

    metadata: {
      category: 'box-management',
      description: 'Open palette to select and navigate between boxes',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      if (!context.boxManager || !context.settingsManager) {
        console.error('Required services not available')
        return
      }

      try {
        // Show modal with box list for selection and creation
        new BoxPaletteModal(context.app, context.boxManager, context.settingsManager).open()
      } catch (err) {
        console.error('Failed to open box palette:', err)
      }
    },
  }
}

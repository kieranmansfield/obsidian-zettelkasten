import type { CommandFactory } from '../base/command'
import { VIEW_TYPE_ZETTELKASTEN } from '../ui/ZettelkastenView'

/**
 * Command: Open Zettelkasten View
 *
 * Opens the Zettelkasten sidebar view showing note types (Inbox, Zettels, References, Index)
 */
export const openZettelkastenViewCommand: CommandFactory = (context) => {
  return {
    id: 'open-zettelkasten-view',
    name: 'Open Zettelkasten View',
    icon: 'square-library',

    metadata: {
      category: 'views',
      description: 'Open sidebar view showing different note types',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      void (async () => {
        const { workspace } = context.app

        // Check if view is already open
        const existing = workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)
        if (existing.length > 0) {
          // Focus existing view
          void workspace.revealLeaf(existing[0])
          return
        }

        // Open new view in right sidebar
        const leaf = workspace.getRightLeaf(false)
        if (leaf) {
          await leaf.setViewState({
            type: VIEW_TYPE_ZETTELKASTEN,
            active: true,
          })
          void workspace.revealLeaf(leaf)
        }
      })()
    },
  }
}

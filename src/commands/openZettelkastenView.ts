import { Platform } from 'obsidian'
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
          // On mobile, ensure the view is in the left sidebar
          // If it's in the wrong place, close it and reopen in the correct location
          if (Platform.isMobile) {
            const existingLeaf = existing[0]

            // Check if the existing leaf's parent is the left split
            const isInLeftSidebar = existingLeaf.getRoot() === workspace.leftSplit

            if (!isInLeftSidebar) {
              // Close the view in the wrong location
              existingLeaf.detach()

              // Open in the correct location (left sidebar)
              const leaf = workspace.getLeftLeaf(false)
              if (leaf) {
                await leaf.setViewState({
                  type: VIEW_TYPE_ZETTELKASTEN,
                  active: true,
                })
                void workspace.revealLeaf(leaf)
              }
              return
            }
          }

          // Focus existing view
          void workspace.revealLeaf(existing[0])
          return
        }

        // Open new view in left sidebar
        const leaf = workspace.getLeftLeaf(false)
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

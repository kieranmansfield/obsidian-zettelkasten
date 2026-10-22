import type { CommandFactory } from '../base/command'
import { revealZettelkastenSidebar } from '../ui/ZettelkastenSidebar'

/**
 * Command: Open Zettelkasten Sidebar
 *
 * Opens the Zettelkasten sidebar view showing note types (Inbox, Zettels, References, Index)
 */
export const openZettelkastenSidebarCommand: CommandFactory = (context) => {
  return {
    id: 'open-zettelkasten-view',
    name: 'Open Zettelkasten Sidebar',
    icon: 'square-library',

    metadata: {
      category: 'views',
      description: 'Open sidebar view showing different note types',
    },

    execute: () => revealZettelkastenSidebar(context.app.workspace),
  }
}

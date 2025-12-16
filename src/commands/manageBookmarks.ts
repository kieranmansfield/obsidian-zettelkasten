import { Notice } from 'obsidian'
import { BookmarkModal } from '../ui/BookmarkModal'
import type { CommandFactory } from '../base/command'
import type { Bookmark } from '../base/settings'
import type ZettelkastenPlugin from '../main'

/**
 * Add Bookmark Command
 *
 * Opens a modal to add a new bookmark (file, search, graph, or folder)
 */
export const addBookmarkCommand: CommandFactory = (context) => {
  return {
    id: 'add-bookmark',
    name: 'Add bookmark',
    icon: 'bookmark-plus',

    metadata: {
      category: 'bookmarks',
      description: 'Add a new bookmark (file, search, graph, or folder)',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      if (!context.app || !context.settingsManager || !context.plugin) {
        console.error('Required services not available')
        return
      }

      const zkPlugin = context.plugin as ZettelkastenPlugin
      const settings = context.settingsManager

      new BookmarkModal(context.app, zkPlugin, (bookmark: Bookmark) => {
        void (async () => {
          // Get current bookmarks
          const viewSettings = settings.getZettelkastenView()
          const bookmarks = [...viewSettings.bookmarks]

          // Add new bookmark
          bookmarks.push(bookmark)

          // Save updated bookmarks
          await settings.updateZettelkastenView({ bookmarks })

          new Notice(`Bookmark "${bookmark.title}" added`)

          // Refresh the view immediately if it's open
          const leaves = context.app.workspace.getLeavesOfType('zettelkasten-view')
          leaves.forEach((leaf) => {
            if (leaf.view && 'refreshImmediate' in leaf.view) {
              ;(leaf.view as { refreshImmediate: () => void }).refreshImmediate()
            }
          })
        })()
      }).open()
    },
  }
}

/**
 * Remove Bookmark Command
 *
 * Opens a suggester to select and remove a bookmark
 */
export const removeBookmarkCommand: CommandFactory = (context) => {
  return {
    id: 'remove-bookmark',
    name: 'Remove bookmark',
    icon: 'bookmark-minus',

    metadata: {
      category: 'bookmarks',
      description: 'Remove an existing bookmark',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.app || !context.settingsManager) {
        console.error('Required services not available')
        return
      }

      const settings = context.settingsManager
      const viewSettings = settings.getZettelkastenView()
      const bookmarks = viewSettings.bookmarks

      if (bookmarks.length === 0) {
        new Notice('No bookmarks to remove')
        return
      }

      // Create a quick picker to select bookmark to remove
      const bookmarkNames = bookmarks.map((b: Bookmark) => b.title)

      // Use Obsidian's suggester
      const selected = await new Promise<string | null>((resolve, reject) => {
        try {
          // Using internal API - suppress the error for this line
           
          ;(
            context.app.workspace as unknown as {
              suggester: (
                items: string[],
                values: string[],
                onSelect: (value: string) => void,
                onCancel: () => void
              ) => void
            }
          ).suggester(
            bookmarkNames,
            bookmarkNames,
            (selected: string) => {
              resolve(selected)
            },
            () => {
              resolve(null)
            }
          )
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      })

      if (!selected) {
        return
      }

      // Find and remove the bookmark
      const index = bookmarks.findIndex((b: Bookmark) => b.title === selected)
      if (index !== -1) {
        const removedBookmark = bookmarks[index]
        const updatedBookmarks = bookmarks.filter((_: Bookmark, i: number) => i !== index)

        // Save updated bookmarks
        await settings.updateZettelkastenView({ bookmarks: updatedBookmarks })

        new Notice(`Bookmark "${removedBookmark.title}" removed`)

        // Refresh the view immediately if it's open
        const leaves = context.app.workspace.getLeavesOfType('zettelkasten-view')
        leaves.forEach((leaf) => {
          if (leaf.view && 'refreshImmediate' in leaf.view) {
            ;(leaf.view as { refreshImmediate: () => void }).refreshImmediate()
          }
        })
      }
    },
  }
}

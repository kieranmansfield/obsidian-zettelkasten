import { FuzzySuggestModal, Notice, type App } from 'obsidian'
import { BookmarkModal } from '../ui/BookmarkModal'
import type { CommandFactory } from '../base/command'
import type { Bookmark } from '../base/settings'

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
    },

    execute: () => {
      const settings = context.settingsManager
      new BookmarkModal(context.app, (bookmark) => {
        void (async () => {
          const { bookmarks } = settings.get('zettelkastenSidebar')
          // Saving refreshes an open sidebar
          await settings.setPath('zettelkastenSidebar.bookmarks', [...bookmarks, bookmark])
          new Notice(`Bookmark "${bookmark.title}" added`)
        })()
      }).open()
    },
  }
}

class BookmarkPicker extends FuzzySuggestModal<Bookmark> {
  constructor(
    app: App,
    private bookmarks: Bookmark[],
    private onChoose: (bookmark: Bookmark) => void
  ) {
    super(app)
    this.setPlaceholder('Select bookmark to remove...')
  }

  getItems(): Bookmark[] {
    return this.bookmarks
  }

  getItemText(bookmark: Bookmark): string {
    return bookmark.title
  }

  onChooseItem(bookmark: Bookmark): void {
    this.onChoose(bookmark)
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
    },

    execute: () => {
      const settings = context.settingsManager
      const { bookmarks } = settings.get('zettelkastenSidebar')
      if (bookmarks.length === 0) {
        new Notice('No bookmarks to remove')
        return
      }

      new BookmarkPicker(context.app, bookmarks, (removed) => {
        void (async () => {
          // Saving refreshes an open sidebar
          await settings.setPath(
            'zettelkastenSidebar.bookmarks',
            bookmarks.filter((b) => b !== removed)
          )
          new Notice(`Bookmark "${removed.title}" removed`)
        })()
      }).open()
    },
  }
}

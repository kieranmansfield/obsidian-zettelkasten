import {
  ItemView,
  WorkspaceLeaf,
  TFile,
  TFolder,
  setIcon,
  Menu,
  MenuItem as ObsidianMenuItem,
  getAllTags,
} from 'obsidian'
import type ZettelkastenPlugin from '../main'
import { VIEW_TYPE_NOTE_SEQUENCES } from './NoteSequencesView'
import type { Bookmark } from 'src/base/settings'
import { ZettelDetectionMode } from 'src/base/settings'

export const VIEW_TYPE_ZETTELKASTEN = 'zettelkasten-view'

interface MenuItem {
  name: string
  icon: string
  folder: string
  dashboardNote?: string
  showFiles: boolean
  filterFunc?: (file: TFile) => boolean
  useFolderFilter: boolean // false for tag-based detection
}

/**
 * ZettelkastenView
 *
 * Sidebar view displaying folders for different note types
 * (Fleeting/Inbox, Zettels, Literature/References, Index, Note Sequences)
 */
export class ZettelkastenView extends ItemView {
  private plugin: ZettelkastenPlugin
  private collapsedSections: Set<string> = new Set()
  private refreshTimeout: NodeJS.Timeout | null = null

  constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
    super(leaf)
    this.plugin = plugin
    this.loadCollapsedSections()
    this.registerEvents()
  }

  private collapsedStorageKey: string = 'obsidian-zettelkasten.collapsedSections'

  private loadCollapsedSections(): void {
    try {
      const raw = window.localStorage.getItem(this.collapsedStorageKey)
      if (!raw) return
      const arr: unknown = JSON.parse(raw)
      if (Array.isArray(arr)) {
        arr.forEach((s: unknown) => {
          if (typeof s === 'string') {
            this.collapsedSections.add(s)
          }
        })
      }
    } catch (e) {
      console.error('Failed to load collapsed sections', e)
    }
  }

  private saveCollapsedSections(): void {
    try {
      window.localStorage.setItem(
        this.collapsedStorageKey,
        JSON.stringify(Array.from(this.collapsedSections))
      )
    } catch (e) {
      console.error('Failed to save collapsed sections', e)
    }
  }

  private registerEvents(): void {
    // Refresh panel when files are created, deleted, or modified
    this.registerEvent(this.app.vault.on('create', () => this.scheduleRefresh()))
    this.registerEvent(this.app.vault.on('delete', () => this.scheduleRefresh()))
    this.registerEvent(this.app.vault.on('rename', () => this.scheduleRefresh()))
    this.registerEvent(this.app.vault.on('modify', () => this.scheduleRefresh()))

    // Refresh when metadata changes (tags, frontmatter, etc.)
    this.registerEvent(this.app.metadataCache.on('changed', () => this.scheduleRefresh()))
    this.registerEvent(this.app.metadataCache.on('resolved', () => this.scheduleRefresh()))

    // Refresh when active file changes to update highlighting
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.scheduleRefresh()))

    // Refresh when layout changes
    this.registerEvent(this.app.workspace.on('layout-change', () => this.scheduleRefresh()))
  }

  private scheduleRefresh(): void {
    // Debounce refreshes to avoid excessive updates (reduced to 50ms for snappy updates)
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }
    this.refreshTimeout = setTimeout(() => {
      this.refresh()
      this.refreshTimeout = null
    }, 50)
  }

  /**
   * Immediately refresh the view without debouncing
   * Use this for critical operations that need instant feedback
   */
  public refreshImmediate(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
    this.refresh()
  }

  public refresh(): void {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    // Add specific class for scoping CSS and native file explorer structure
    container.addClass('zettelkasten-sidebar')
    container.addClass('nav-files-container')
    this.renderContent(container)
  }

  getViewType(): string {
    return VIEW_TYPE_ZETTELKASTEN
  }

  getDisplayText(): string {
    return 'Zettelkasten'
  }

  getIcon(): string {
    return 'square-library'
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    // Add specific class for scoping CSS and native file explorer structure
    container.addClass('zettelkasten-sidebar')
    container.addClass('nav-files-container')
    this.renderContent(container)
  }

  private renderContent(container: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()

    const fleetingSettings = settings.getFleeting()
    const zettelSettings = settings.getZettel()
    const literatureSettings = settings.getLiterature()
    const indexSettings = settings.getIndex()
    const viewSettings = settings.getZettelkastenView()

    const menuItems: MenuItem[] = []

    // Fleeting Notes (Inbox)
    if (viewSettings.showInbox && fleetingSettings.enabled) {
      const useTagDetection = fleetingSettings.detectionMode === ZettelDetectionMode.TAG
      menuItems.push({
        name: viewSettings.inboxName || 'Inbox',
        icon: 'inbox',
        folder: fleetingSettings.folder,
        dashboardNote: viewSettings.dashboardFleetingNote,
        showFiles: viewSettings.showInboxFiles,
        useFolderFilter: !useTagDetection,
        filterFunc: (file: TFile) => {
          // Check detection mode
          if (useTagDetection) {
            if (!this.hasTag(file, fleetingSettings.tag)) {
              return false
            }
          }
          // else folder-based - will be filtered by folder in getFilesForItem

          // Apply additional filter tag if specified
          if (viewSettings.inboxFilterTag) {
            return this.hasTag(file, viewSettings.inboxFilterTag)
          }

          return true
        },
      })
    }

    // Zettel Notes
    if (viewSettings.showZettels && zettelSettings.enabled) {
      const useTagDetection = zettelSettings.zettelDetectionMode === ZettelDetectionMode.TAG
      menuItems.push({
        name: viewSettings.zettelsName || 'Zettels',
        icon: 'gallery-vertical-end',
        folder: zettelSettings.defaultFolder || '',
        dashboardNote: viewSettings.dashboardZettelNote,
        showFiles: viewSettings.showZettelFiles,
        useFolderFilter: !useTagDetection,
        filterFunc: (file: TFile) => {
          // Check detection mode
          if (useTagDetection) {
            if (!this.hasTag(file, zettelSettings.zettelTag)) {
              return false
            }
          } else {
            // Folder-based: also check for ZettelId pattern
            const zettelIdPattern = /^\d{17}/
            if (!zettelIdPattern.test(file.basename)) {
              return false
            }
          }

          // Apply additional filter tag if specified
          if (viewSettings.zettelsFilterTag) {
            return this.hasTag(file, viewSettings.zettelsFilterTag)
          }

          return true
        },
      })
    }

    // Literature Notes
    // Support both old 'showReferences' and new 'showLiterature' for backward compatibility
    const showLiterature = viewSettings.showLiterature ?? viewSettings.showReferences ?? true
    const showLiteratureFiles =
      viewSettings.showLiteratureFiles ?? viewSettings.showReferenceFiles ?? true
    const literatureFilterTag =
      viewSettings.literatureFilterTag || viewSettings.referencesFilterTag || ''

    if (showLiterature && literatureSettings.enabled) {
      const useTagDetection = literatureSettings.detectionMode === ZettelDetectionMode.TAG
      menuItems.push({
        name: viewSettings.literatureName || 'Literature',
        icon: 'book-open',
        folder: literatureSettings.folder,
        dashboardNote: viewSettings.dashboardLiteratureNote,
        showFiles: showLiteratureFiles,
        useFolderFilter: !useTagDetection,
        filterFunc: (file: TFile) => {
          // Check detection mode
          if (useTagDetection) {
            if (!this.hasTag(file, literatureSettings.tag)) {
              return false
            }
          }
          // else folder-based - will be filtered by folder in getFilesForItem

          // Apply additional filter tag if specified
          if (literatureFilterTag) {
            return this.hasTag(file, literatureFilterTag)
          }

          return true
        },
      })
    }

    // Index Notes
    if (viewSettings.showIndex && indexSettings.enabled) {
      const useTagDetection = indexSettings.detectionMode === ZettelDetectionMode.TAG
      menuItems.push({
        name: viewSettings.indexName || 'Index',
        icon: 'list',
        folder: indexSettings.folder,
        dashboardNote: viewSettings.dashboardIndexNote,
        showFiles: viewSettings.showIndexFiles,
        useFolderFilter: !useTagDetection,
        filterFunc: (file: TFile) => {
          // Check detection mode
          if (useTagDetection) {
            if (!this.hasTag(file, indexSettings.tag)) {
              return false
            }
          }
          // else folder-based - will be filtered by folder in getFilesForItem

          // Apply additional filter tag if specified
          if (viewSettings.indexFilterTag) {
            return this.hasTag(file, viewSettings.indexFilterTag)
          }

          return true
        },
      })
    }

    // Projects
    const projectSettings = settings.getProjects()
    if (viewSettings.showProjects && projectSettings.enabled) {
      const useTagDetection = projectSettings.detectionMode === ZettelDetectionMode.TAG
      menuItems.push({
        name: viewSettings.projectsName || 'Projects',
        icon: 'folder-kanban',
        folder: projectSettings.folder,
        dashboardNote: viewSettings.dashboardProjectsNote,
        showFiles: viewSettings.showProjectFiles,
        useFolderFilter: !useTagDetection,
        filterFunc: (file: TFile) => {
          // Check detection mode
          if (useTagDetection) {
            if (!this.hasTag(file, projectSettings.tag)) {
              return false
            }
          }
          // else folder-based - will be filtered by folder in getFilesForItem

          // Apply additional filter tag if specified
          if (viewSettings.projectsFilterTag) {
            return this.hasTag(file, viewSettings.projectsFilterTag)
          }

          return true
        },
      })
    }

    menuItems.forEach((item) => {
      this.createMenuItem(container, item)
    })

    // Bookmarks section
    this.createBookmarksSection(container)

    // Note Sequences section
    const sequenceSettings = settings.getNoteSequences()
    if (sequenceSettings.enabled && sequenceSettings.showSequencesView) {
      this.createNoteSequencesSection(container)
    }
  }

  /**
   * Check if a file has a specific tag
   * Checks both inline tags and frontmatter tags
   */
  private hasTag(file: TFile, tag: string): boolean {
    const cache = this.app.metadataCache.getFileCache(file)
    if (!cache) {
      return false
    }

    // Get all tags (both inline and frontmatter)
    const fileTags = getAllTags(cache)
    if (!fileTags || fileTags.length === 0) {
      return false
    }

    // Normalize tag (add # if missing)
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`

    return fileTags.includes(normalizedTag)
  }

  private createMenuItem(container: HTMLElement, item: MenuItem): void {
    // Get files if enabled
    let files: TFile[] = []
    if (item.showFiles) {
      files = this.getFilesForItem(item)
    }

    // Check dashboard file
    let dashboardFile: TFile | null = null
    if (item.dashboardNote) {
      const file = this.app.vault.getAbstractFileByPath(item.dashboardNote)
      if (file instanceof TFile) {
        dashboardFile = file
      }
    }

    // Check if dashboard is active
    const activeFile = this.app.workspace.getActiveFile()
    const isDashboardActive = dashboardFile && activeFile?.path === dashboardFile.path

    // Check if collapsed
    const isCollapsed = this.collapsedSections.has(item.name)

    // Use native Obsidian classes to match file explorer
    const itemEl = container.createDiv({
      cls: `tree-item nav-folder${isCollapsed ? ' is-collapsed' : ''}`
    })

    // Header using native classes
    const headerEl = itemEl.createDiv({
      cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
    })
    headerEl.setAttribute('draggable', 'true')
    headerEl.setAttribute('data-path', item.folder)

    // Apply native inline styles for padding
    headerEl.style.marginInlineStart = '0px'
    headerEl.style.paddingInlineStart = '24px'

    if (isDashboardActive) {
      headerEl.addClass('is-active')
    }

    // Collapse icon using native classes
    const collapseIconEl = headerEl.createDiv({
      cls: `tree-item-icon collapse-icon${isCollapsed ? ' is-collapsed' : ''}`
    })
    // Only show chevron if there are files to display
    if (item.showFiles && files.length > 0) {
      setIcon(collapseIconEl, 'right-triangle')
    } else {
      // Keep the div for spacing but make it invisible
      collapseIconEl.addClass('zk-chevron-hidden')
    }

    // Custom section icon (added after collapse icon) - don't use tree-item-icon class
    const sectionIconEl = headerEl.createDiv({ cls: 'zk-section-icon' })
    setIcon(sectionIconEl, item.icon)

    // Item name using native classes
    const nameEl = headerEl.createDiv({
      cls: 'tree-item-inner nav-folder-title-content',
      text: item.name
    })

    // Content area for files (children)
    const contentEl = itemEl.createDiv({ cls: 'tree-item-children nav-folder-children' })
    if (isCollapsed) {
      contentEl.style.display = 'none'
    }

    // Toggle collapse function
    const toggleCollapse = () => {
      // Don't allow collapse if no files are shown
      if (!item.showFiles || files.length === 0) return

      const isCurrentlyCollapsed = this.collapsedSections.has(item.name)

      if (isCurrentlyCollapsed) {
        this.collapsedSections.delete(item.name)
        itemEl.removeClass('is-collapsed')
        collapseIconEl.removeClass('is-collapsed')
        contentEl.style.display = ''
      } else {
        this.collapsedSections.add(item.name)
        itemEl.addClass('is-collapsed')
        collapseIconEl.addClass('is-collapsed')
        contentEl.style.display = 'none'
      }
      this.saveCollapsedSections()
    }

    // Add click handler to collapse icon
    collapseIconEl.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleCollapse()
    })

    // Add click handler to header
    headerEl.addEventListener('click', (e) => {
      e.stopPropagation()

      // If clicking collapse icon or section icon, toggle collapse
      if (
        e.target === collapseIconEl ||
        collapseIconEl.contains(e.target as Node) ||
        e.target === sectionIconEl ||
        sectionIconEl.contains(e.target as Node)
      ) {
        toggleCollapse()
        return
      }

      // If there's a dashboard file, open it
      if (dashboardFile) {
        void this.app.workspace.getLeaf(false).openFile(dashboardFile)
      } else if (item.showFiles) {
        // If no dashboard but files are shown, toggle collapse
        toggleCollapse()
      }
    })

    // Display files (only if enabled)
    if (item.showFiles) {
      this.displayFiles(contentEl, files)
    }

    // Append the item to the container
    container.appendChild(itemEl)
  }

  private getFilesForItem(item: MenuItem): TFile[] {
    const allFiles = this.app.vault.getMarkdownFiles()

    let files: TFile[]

    // If using tag-based detection, search all files
    // If using folder-based detection, filter by folder
    if (!item.useFolderFilter) {
      // Tag-based: get all markdown files
      files = allFiles
    } else {
      // Folder-based: filter files in the folder
      if (!item.folder) {
        // If no folder (e.g., root), get all markdown files
        files = allFiles
      } else {
        // Filter files in the folder (recursively)
        files = allFiles.filter(
          (file) => file.path.startsWith(item.folder + '/') || file.parent?.path === item.folder
        )
      }
    }

    // Apply additional filter if provided
    if (item.filterFunc) {
      files = files.filter(item.filterFunc)
    }

    // Sort by modification time (most recent first)
    files.sort((a, b) => b.stat.mtime - a.stat.mtime)

    return files
  }

  private displayFiles(container: HTMLElement, files: TFile[]): void {
    if (files.length === 0) {
      // Don't display anything when there are no files
      return
    }

    const activeFile = this.app.workspace.getActiveFile()

    files.forEach((file) => {
      const fileEl = container.createDiv({ cls: 'tree-item nav-file' })

      // Inner container with native Obsidian classes
      const fileItemSelf = fileEl.createDiv({ cls: 'tree-item-self is-clickable nav-file-title' })

      // Apply native inline styles for padding (nested one level)
      fileItemSelf.style.marginInlineStart = '0px'
      fileItemSelf.style.paddingInlineStart = '36px' // 24px base + 12px indent

      // Set the data attributes that Obsidian's file explorer uses
      fileItemSelf.setAttribute('data-path', file.path)

      // Highlight if this is the active file
      if (activeFile && file.path === activeFile.path) {
        fileItemSelf.addClass('is-active')
      }

      // File title (from frontmatter or filename)
      const cache = this.app.metadataCache.getFileCache(file)
      const frontmatterTitle = cache?.frontmatter?.title as unknown
      const title =
        (typeof frontmatterTitle === 'string' ? frontmatterTitle : null) || file.basename

      // Inner content with proper nesting
      const fileInner = fileItemSelf.createDiv({ cls: 'tree-item-inner nav-file-title-content' })
      fileInner.setText(title)

      // Click handler to open file
      fileItemSelf.addEventListener('click', (e) => {
        e.stopPropagation()
        void this.app.workspace.getLeaf(false).openFile(file)
      })

      // Context menu with native feel
      fileItemSelf.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const menu = new Menu()

        menu.addItem((item: ObsidianMenuItem) => {
          item
            .setTitle('Open')
            .setIcon('file')
            .onClick(async () => {
              await this.app.workspace.getLeaf(false).openFile(file)
            })
        })

        menu.addItem((item: ObsidianMenuItem) => {
          item
            .setTitle('Open in new tab')
            .setIcon('lucide-file-plus')
            .onClick(async () => {
              await this.app.workspace.getLeaf('tab').openFile(file)
            })
        })

        menu.addItem((item: ObsidianMenuItem) => {
          item
            .setTitle('Open to the right')
            .setIcon('lucide-separator-vertical')
            .onClick(async () => {
              await this.app.workspace.getLeaf('split').openFile(file)
            })
        })

        menu.addSeparator()

        menu.addItem((item: ObsidianMenuItem) => {
          item
            .setTitle('Reveal in navigation')
            .setIcon('lucide-folder-open')
            .onClick(() => {
              // Reveal file in the main file explorer
              const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]
              if (fileExplorer) {
                const view = fileExplorer.view as { revealInFolder?: (file: TFile) => void }
                if (view && view.revealInFolder) {
                  view.revealInFolder(file)
                }
              }
            })
        })

        menu.showAtMouseEvent(e)
      })

      // Add drag support for native feel
      fileItemSelf.setAttribute('draggable', 'true')
      fileItemSelf.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', file.path)
        e.dataTransfer!.effectAllowed = 'move'
      })
    })
  }

  /**
   * Create Bookmarks section with saved bookmarks
   */
  private createBookmarksSection(container: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const viewSettings = settings.getZettelkastenView()
    const bookmarksName = viewSettings.bookmarksName || 'Bookmarks'

    // Check if collapsed
    const isCollapsed = this.collapsedSections.has(bookmarksName)

    // Use native Obsidian classes
    const itemEl = container.createDiv({
      cls: `tree-item nav-folder${isCollapsed ? ' is-collapsed' : ''}`
    })

    // Header using native classes
    const headerEl = itemEl.createDiv({
      cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
    })
    headerEl.setAttribute('draggable', 'true')

    // Apply native inline styles for padding
    headerEl.style.marginInlineStart = '0px'
    headerEl.style.paddingInlineStart = '24px'

    // Get bookmarks to check if there are any
    const bookmarks = viewSettings.bookmarks

    // Collapse icon using native classes
    const collapseIconEl = headerEl.createDiv({
      cls: `tree-item-icon collapse-icon${isCollapsed ? ' is-collapsed' : ''}`
    })
    // Only show chevron if there are bookmarks to display
    if (bookmarks.length > 0) {
      setIcon(collapseIconEl, 'right-triangle')
    } else {
      // Keep the div for spacing but make it invisible
      collapseIconEl.addClass('zk-chevron-hidden')
    }

    // Custom section icon for bookmarks - don't use tree-item-icon class
    const sectionIconEl = headerEl.createDiv({ cls: 'zk-section-icon' })
    setIcon(sectionIconEl, 'bookmark')

    // Item name using native classes
    headerEl.createDiv({
      cls: 'tree-item-inner nav-folder-title-content',
      text: bookmarksName
    })

    // Content area for bookmarks (children)
    const contentEl = itemEl.createDiv({ cls: 'tree-item-children nav-folder-children' })
    if (isCollapsed) {
      contentEl.style.display = 'none'
    }

    // Toggle collapse function
    const toggleCollapse = () => {
      // Don't allow collapse if no bookmarks
      if (bookmarks.length === 0) return

      const isCurrentlyCollapsed = this.collapsedSections.has(bookmarksName)

      if (isCurrentlyCollapsed) {
        this.collapsedSections.delete(bookmarksName)
        itemEl.removeClass('is-collapsed')
        collapseIconEl.removeClass('is-collapsed')
        contentEl.style.display = ''
      } else {
        this.collapsedSections.add(bookmarksName)
        itemEl.addClass('is-collapsed')
        collapseIconEl.addClass('is-collapsed')
        contentEl.style.display = 'none'
      }
      this.saveCollapsedSections()
    }

    // Add click handler to collapse icon
    collapseIconEl.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleCollapse()
    })

    // Add click handler to header
    headerEl.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleCollapse()
    })

    // Display bookmarks
    this.displayBookmarks(contentEl, bookmarks)
  }

  /**
   * Display bookmarks in the content area
   */
  private displayBookmarks(container: HTMLElement, bookmarks: Bookmark[]): void {
    if (bookmarks.length === 0) {
      const emptyEl = container.createDiv({
        cls: 'tree-item-self',
        text: 'No bookmarks yet',
      })
      emptyEl.style.marginInlineStart = '0px'
      emptyEl.style.paddingInlineStart = '36px'
      emptyEl.style.color = 'var(--text-faint)'
      emptyEl.style.fontStyle = 'italic'
      emptyEl.style.fontSize = '12px'
      return
    }

    bookmarks.forEach((bookmark) => {
      const bookmarkEl = container.createDiv({ cls: 'tree-item nav-file' })
      const bookmarkItemSelf = bookmarkEl.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title',
      })

      // Apply native inline styles for padding (nested one level)
      bookmarkItemSelf.style.marginInlineStart = '0px'
      bookmarkItemSelf.style.paddingInlineStart = '36px' // 24px base + 12px indent

      // Icon based on type
      let iconName = 'file'
      switch (bookmark.type) {
        case 'file':
          iconName = 'file-text'
          break
        case 'search':
          iconName = 'search'
          break
        case 'graph':
          iconName = 'git-branch-plus'
          break
        case 'folder':
          iconName = 'folder'
          break
      }

      const iconEl = bookmarkItemSelf.createDiv({ cls: 'tree-item-icon' })
      setIcon(iconEl, iconName)

      // Title
      const titleEl = bookmarkItemSelf.createDiv({ cls: 'tree-item-inner nav-file-title-content' })
      titleEl.setText(bookmark.title)

      // Click handler
      bookmarkItemSelf.addEventListener('click', (e) => {
        e.stopPropagation()
        void this.handleBookmarkClick(bookmark)
      })
    })
  }

  /**
   * Handle clicking on a bookmark
   */
  private async handleBookmarkClick(bookmark: Bookmark): Promise<void> {
    switch (bookmark.type) {
      case 'file':
        if (bookmark.path) {
          const file = this.app.vault.getAbstractFileByPath(bookmark.path)
          if (file instanceof TFile) {
            await this.app.workspace.getLeaf(false).openFile(file)
          }
        }
        break

      case 'search':
        if (bookmark.query) {
          // Open search view with the query
          const searchLeaf = this.app.workspace.getLeavesOfType('search')[0]
          if (searchLeaf) {
            void this.app.workspace.revealLeaf(searchLeaf)
             
            ;(searchLeaf.view as unknown as { setQuery: (query: string) => void }).setQuery(
              bookmark.query
            )
          }
        }
        break

      case 'graph':
        // Open graph view
        void this.app.workspace.getLeaf(false).setViewState({
          type: 'graph',
          active: true,
        })
        break

      case 'folder':
        if (bookmark.path) {
          const folder = this.app.vault.getAbstractFileByPath(bookmark.path)
          if (folder instanceof TFolder) {
            // Reveal folder in file explorer
            const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]
            if (fileExplorer && fileExplorer.view) {
               
              ;(
                fileExplorer.view as unknown as { revealInFolder: (folder: unknown) => void }
              ).revealInFolder(folder)
            }
          }
        }
        break
    }
  }

  /**
   * Create Note Sequences section - simple link to open view
   */
  private createNoteSequencesSection(container: HTMLElement): void {
    // Use native Obsidian classes to match other sections
    const itemEl = container.createDiv({ cls: 'tree-item nav-folder' })

    const headerEl = itemEl.createDiv({
      cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible'
    })
    headerEl.setAttribute('draggable', 'true')

    // Apply native inline styles for padding
    headerEl.style.marginInlineStart = '0px'
    headerEl.style.paddingInlineStart = '24px'

    // Empty collapse icon for alignment (no children to collapse, so hide it)
    const collapseIconEl = headerEl.createDiv({ cls: 'tree-item-icon collapse-icon zk-chevron-hidden' })

    // Custom section icon - don't use tree-item-icon class
    const sectionIconEl = headerEl.createDiv({ cls: 'zk-section-icon' })
    setIcon(sectionIconEl, 'layers')

    // Name
    const nameEl = headerEl.createDiv({
      cls: 'tree-item-inner nav-folder-title-content',
      text: 'Note Sequences'
    })

    // Click handler to open Note Sequences view
    headerEl.addEventListener('click', (e) => {
      e.stopPropagation()
      void this.app.workspace.getLeaf('tab').setViewState({
        type: VIEW_TYPE_NOTE_SEQUENCES,
        active: true,
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onClose(): Promise<void> {
    // Clear any pending refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }
}

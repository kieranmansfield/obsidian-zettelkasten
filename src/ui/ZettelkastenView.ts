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
import { NoteSequence, SequenceNode } from 'src/base/noteSequence'
import type { Bookmark } from 'src/base/settings'

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
    this.registerEvents()
    this.loadCollapsedSections()
  }

  private collapsedStorageKey: string = 'obsidian-zettelkasten.collapsedSections'

  private loadCollapsedSections(): void {
    try {
      const raw = window.localStorage.getItem(this.collapsedStorageKey)
      if (!raw) return
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        arr.forEach((s) => this.collapsedSections.add(s))
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
    // Refresh when metadata changes (tags, frontmatter, etc.)
    this.registerEvent(this.app.metadataCache.on('changed', () => this.scheduleRefresh()))
    // Refresh when active file changes to update highlighting
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.scheduleRefresh()))
  }

  private scheduleRefresh(): void {
    // Debounce refreshes to avoid excessive updates
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }
    this.refreshTimeout = setTimeout(() => {
      this.refresh()
      this.refreshTimeout = null
    }, 300)
  }

  public refresh(): void {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('zettelkasten-view')
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

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('zettelkasten-view')
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
      const useTagDetection = fleetingSettings.detectionMode === 'tag'
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
      const useTagDetection = zettelSettings.zettelDetectionMode === 'tag'
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
      const useTagDetection = literatureSettings.detectionMode === 'tag'
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
      const useTagDetection = indexSettings.detectionMode === 'tag'
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
      const useTagDetection = projectSettings.detectionMode === 'tag'
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
    // Menu item container
    const itemEl = container.createDiv({ cls: 'zk-menu-item' })

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

    // Header with icon, arrow, and title
    const headerEl = itemEl.createDiv({ cls: 'zk-menu-header' })
    if (isDashboardActive) {
      headerEl.addClass('is-active-dashboard')
    }

    // Collapse chevron (only show if file lists are enabled)
    const collapseIconEl = headerEl.createDiv({ cls: 'zk-collapse-icon' })
    if (item.showFiles) {
      const isCollapsed = this.collapsedSections.has(item.name)
      setIcon(collapseIconEl, isCollapsed ? 'chevron-right' : 'chevron-down')
    }

    // Item icon
    const iconEl = headerEl.createDiv({ cls: 'zk-menu-icon' })
    setIcon(iconEl, item.icon)

    // Item name
    headerEl.createDiv({ cls: 'zk-menu-name', text: item.name })

    // Content area for files
    const contentEl = itemEl.createDiv({ cls: 'zk-menu-content' })
    if (item.showFiles) {
      const isCollapsed = this.collapsedSections.has(item.name)
      if (isCollapsed) {
        contentEl.style.display = 'none'
      }
    } else {
      // Hide content area when file lists are disabled
      contentEl.style.display = 'none'
    }

    // Add click handler to header
    headerEl.addEventListener('click', async (e) => {
      e.stopPropagation()

      // If file lists are enabled and clicking on the collapse icon, toggle collapse
      if (
        item.showFiles &&
        (e.target === collapseIconEl || collapseIconEl.contains(e.target as Node))
      ) {
        const isCurrentlyCollapsed = this.collapsedSections.has(item.name)

        if (isCurrentlyCollapsed) {
          this.collapsedSections.delete(item.name)
          contentEl.style.display = 'block'
          setIcon(collapseIconEl, 'chevron-down')
        } else {
          this.collapsedSections.add(item.name)
          contentEl.style.display = 'none'
          setIcon(collapseIconEl, 'chevron-right')
        }
        this.saveCollapsedSections()
      } else if (
        !item.showFiles ||
        !(e.target === collapseIconEl || collapseIconEl.contains(e.target as Node))
      ) {
        // Open the dashboard file when not clicking collapse icon or when file lists are disabled
        if (dashboardFile) {
          await this.app.workspace.getLeaf(false).openFile(dashboardFile)
        }
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

    // Create a file list container using Obsidian's native classes
    const fileListContainer = container.createDiv({ cls: 'nav-files-container' })

    const activeFile = this.app.workspace.getActiveFile()

    files.forEach((file) => {
      const fileEl = fileListContainer.createDiv({ cls: 'tree-item nav-file' })

      // Inner container with native Obsidian classes
      const fileItemSelf = fileEl.createDiv({ cls: 'tree-item-self is-clickable nav-file-title' })

      // Set the data attributes that Obsidian's file explorer uses
      fileItemSelf.setAttribute('data-path', file.path)

      // Highlight if this is the active file
      if (activeFile && file.path === activeFile.path) {
        fileItemSelf.addClass('is-active')
      }

      // File title (from frontmatter or filename)
      const cache = this.app.metadataCache.getFileCache(file)
      const title = cache?.frontmatter?.title || file.basename

      // Inner content with proper nesting
      const fileInner = fileItemSelf.createDiv({ cls: 'tree-item-inner nav-file-title-content' })
      fileInner.setText(title)

      // Click handler to open file
      fileItemSelf.addEventListener('click', async (e) => {
        e.stopPropagation()
        await this.app.workspace.getLeaf(false).openFile(file)
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

    const itemEl = container.createDiv({ cls: 'zk-menu-item' })
    const headerEl = itemEl.createDiv({ cls: 'zk-menu-header' })

    // Collapse icon
    const collapseIconEl = headerEl.createDiv({ cls: 'zk-collapse-icon' })
    const isCollapsed = this.collapsedSections.has(bookmarksName)
    setIcon(collapseIconEl, isCollapsed ? 'chevron-right' : 'chevron-down')

    // Item icon
    const iconEl = headerEl.createDiv({ cls: 'zk-menu-icon' })
    setIcon(iconEl, 'bookmark')

    // Item name
    headerEl.createDiv({ cls: 'zk-menu-name', text: bookmarksName })

    // Content area (collapsible)
    const contentEl = itemEl.createDiv({ cls: 'zk-menu-content' })
    if (isCollapsed) {
      contentEl.style.display = 'none'
    }

    // Add click handler to header (toggle collapse)
    headerEl.addEventListener('click', async (e) => {
      e.stopPropagation()

      const isCurrentlyCollapsed = this.collapsedSections.has(bookmarksName)

      if (isCurrentlyCollapsed) {
        this.collapsedSections.delete(bookmarksName)
        contentEl.style.display = 'block'
        setIcon(collapseIconEl, 'chevron-down')
      } else {
        this.collapsedSections.add(bookmarksName)
        contentEl.style.display = 'none'
        setIcon(collapseIconEl, 'chevron-right')
      }
      this.saveCollapsedSections()
    })

    // Display bookmarks
    this.displayBookmarks(contentEl)
  }

  /**
   * Display bookmarks in the content area
   */
  private displayBookmarks(container: HTMLElement): void {
    const settings = this.plugin.getSettingsManager()
    const viewSettings = settings.getZettelkastenView()
    const bookmarks = viewSettings.bookmarks

    if (bookmarks.length === 0) {
      container.createDiv({
        cls: 'zk-no-files',
        text: 'No bookmarks yet',
      })
      return
    }

    // Create a file list container using Obsidian's native classes
    const bookmarkListContainer = container.createDiv({ cls: 'nav-files-container' })

    bookmarks.forEach((bookmark) => {
      const bookmarkEl = bookmarkListContainer.createDiv({ cls: 'tree-item nav-file' })
      const bookmarkItemSelf = bookmarkEl.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title',
      })

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
      bookmarkItemSelf.addEventListener('click', async (e) => {
        e.stopPropagation()
        await this.handleBookmarkClick(bookmark)
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
            this.app.workspace.revealLeaf(searchLeaf)
            // @ts-ignore - accessing internal API
            searchLeaf.view.setQuery(bookmark.query)
          }
        }
        break

      case 'graph':
        // Open graph view
        this.app.workspace.getLeaf(false).setViewState({
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
              // @ts-ignore - accessing internal API
              fileExplorer.view.revealInFolder(folder)
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
    const itemEl = container.createDiv({ cls: 'zk-menu-item' })
    const headerEl = itemEl.createDiv({ cls: 'zk-menu-header' })

    // Optional collapse icon (for alignment)
    headerEl.createDiv({ cls: 'zk-collapse-icon' })

    const iconEl = headerEl.createDiv({ cls: 'zk-menu-icon' })
    setIcon(iconEl, 'layers')

    const nameContainer = headerEl.createDiv({ cls: 'zk-menu-name-container' })
    nameContainer.createSpan({ cls: 'zk-menu-name', text: 'Note Sequences' })

    // Click handler for dashboard
    headerEl.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.app.workspace.getLeaf('tab').setViewState({
        type: VIEW_TYPE_NOTE_SEQUENCES,
        active: true,
      })
    })
    headerEl.style.cursor = 'pointer'
  }

  /**
   * Create a card for a root note without children
   */
  private createRootOnlyCard(container: HTMLElement, file: TFile): void {
    const card = container.createDiv({ cls: 'sequence-card' })

    // Card header
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Icon
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'file')

    // Title (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const cache = this.app.metadataCache.getFileCache(file)
    const title = cache?.frontmatter?.title || file.basename
    titleEl.setText(title)
    titleEl.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.app.workspace.getLeaf(false).openFile(file)
    })

    // Card body
    const body = card.createDiv({ cls: 'sequence-card-body' })
    body.createDiv({
      cls: 'sequence-card-empty',
      text: 'No children',
    })
  }

  /**
   * Create a card for a note sequence
   */
  private createSequenceCard(container: HTMLElement, sequence: NoteSequence): void {
    const card = container.createDiv({ cls: 'sequence-card' })

    // Card header with parent note
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Parent icon
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'layers')

    // Parent title (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const cache = this.app.metadataCache.getFileCache(sequence.root.file)
    const title = cache?.frontmatter?.title || sequence.root.file.basename
    titleEl.setText(title)
    titleEl.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.app.workspace.getLeaf(false).openFile(sequence.root.file)
    })

    // Action buttons container
    const actionsEl = headerContent.createDiv({ cls: 'sequence-card-actions' })

    // Open in new tab button
    const openBtn = actionsEl.createDiv({
      cls: 'sequence-card-action-btn',
      attr: { 'aria-label': 'Open sequence in new tab' },
    })
    setIcon(openBtn, 'external-link')
    openBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.app.workspace.getLeaf(true).openFile(sequence.root.file)
    })

    // Card body with children
    const body = card.createDiv({ cls: 'sequence-card-body' })

    if (sequence.allNodes.length === 0) {
      body.createDiv({
        cls: 'sequence-card-empty',
        text: 'No children',
      })
    } else {
      // Render all nodes (already flattened in allNodes)
      sequence.allNodes.forEach((node: SequenceNode) => {
        const item = body.createDiv({
          cls: 'sequence-child-item',
          attr: { style: `padding-left: ${12 + node.level * 20}px` },
        })

        // Child title
        const childTitleEl = item.createDiv({ cls: 'sequence-child-title' })
        const childCache = this.app.metadataCache.getFileCache(node.file)
        const childTitle = childCache?.frontmatter?.title || node.file.basename
        childTitleEl.setText(childTitle)

        // Click handler to open the file
        item.addEventListener('click', async (e) => {
          e.stopPropagation()
          await this.app.workspace.getLeaf(false).openFile(node.file)
        })
      })
    }
  }

  async onClose(): Promise<void> {
    // Clear any pending refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }
}

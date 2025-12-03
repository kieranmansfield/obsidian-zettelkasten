import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import type ZettelkastenPlugin from '../main'

export const VIEW_TYPE_ZETTELKASTEN = 'zettelkasten-view'

interface MenuItem {
  name: string
  icon: string
  folder: string
  filterFunc?: (file: TFile) => boolean
}

/**
 * ZettelkastenView
 *
 * Sidebar view displaying folders for different note types
 * (Fleeting/Inbox, Zettels, Literature/References, Index)
 */
export class ZettelkastenView extends ItemView {
  private plugin: ZettelkastenPlugin
  private collapsedSections: Set<string> = new Set()
  private refreshTimeout: NodeJS.Timeout | null = null

  constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
    super(leaf)
    this.plugin = plugin
    this.registerEvents()
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

    // Render dashboard notes first
    if (viewSettings.dashboardNotes && viewSettings.dashboardNotes.length > 0) {
      this.createDashboardSection(container, viewSettings.dashboardNotes)
    }

    const menuItems: MenuItem[] = []

    // Fleeting Notes (Inbox)
    if (viewSettings.showInbox && fleetingSettings.enabled) {
      const folder = viewSettings.inboxFilterFolder || fleetingSettings.folder
      menuItems.push({
        name: 'Inbox',
        icon: 'inbox',
        folder: folder,
        filterFunc: viewSettings.inboxFilterTag
          ? (file: TFile) => this.hasTag(file, viewSettings.inboxFilterTag)
          : undefined,
      })
    }

    // Zettel Notes
    if (viewSettings.showZettels && zettelSettings.enabled) {
      const folder = viewSettings.zettelsFilterFolder || zettelSettings.defaultFolder || ''
      menuItems.push({
        name: 'Zettels',
        icon: 'file-text',
        folder: folder,
        filterFunc: (file: TFile) => {
          // Filter to only show zettel notes (with ZettelId)
          const zettelIdPattern = /^\d{17}/
          const hasZettelId = zettelIdPattern.test(file.basename)

          // Apply tag filter if specified
          if (viewSettings.zettelsFilterTag) {
            return hasZettelId && this.hasTag(file, viewSettings.zettelsFilterTag)
          }

          return hasZettelId
        },
      })
    }

    // Literature Notes (References)
    if (viewSettings.showReferences && literatureSettings.enabled) {
      const folder = viewSettings.referencesFilterFolder || literatureSettings.folder
      menuItems.push({
        name: 'References',
        icon: 'book-open',
        folder: folder,
        filterFunc: viewSettings.referencesFilterTag
          ? (file: TFile) => this.hasTag(file, viewSettings.referencesFilterTag)
          : undefined,
      })
    }

    // Index Notes
    if (viewSettings.showIndex && indexSettings.enabled) {
      const folder = viewSettings.indexFilterFolder || indexSettings.folder
      menuItems.push({
        name: 'Index',
        icon: 'list',
        folder: folder,
        filterFunc: viewSettings.indexFilterTag
          ? (file: TFile) => this.hasTag(file, viewSettings.indexFilterTag)
          : undefined,
      })
    }

    menuItems.forEach((item) => {
      this.createMenuItem(container, item)
    })
  }

  /**
   * Create dashboard section with pinned notes
   */
  private createDashboardSection(container: HTMLElement, notePaths: string[]): void {
    const itemEl = container.createDiv({ cls: 'zk-menu-item' })

    // Header
    const headerEl = itemEl.createDiv({ cls: 'zk-menu-header' })
    const collapseIconEl = headerEl.createDiv({ cls: 'zk-collapse-icon' })
    const isCollapsed = this.collapsedSections.has('Dashboard')

    setIcon(collapseIconEl, isCollapsed ? 'chevron-right' : 'chevron-down')

    const iconEl = headerEl.createDiv({ cls: 'zk-menu-icon' })
    setIcon(iconEl, 'star')

    const nameContainer = headerEl.createDiv({ cls: 'zk-menu-name-container' })
    nameContainer.createSpan({ cls: 'zk-menu-name', text: 'Dashboard' })

    // Content area
    const contentEl = itemEl.createDiv({ cls: 'zk-menu-content' })
    if (isCollapsed) {
      contentEl.style.display = 'none'
    }

    // Add click handler
    headerEl.addEventListener('click', async (e) => {
      e.stopPropagation()
      const isCurrentlyCollapsed = this.collapsedSections.has('Dashboard')

      if (isCurrentlyCollapsed) {
        this.collapsedSections.delete('Dashboard')
        contentEl.style.display = 'block'
        setIcon(collapseIconEl, 'chevron-down')
      } else {
        this.collapsedSections.add('Dashboard')
        contentEl.style.display = 'none'
        setIcon(collapseIconEl, 'chevron-right')
      }
    })
    headerEl.style.cursor = 'pointer'

    // Display dashboard notes
    const dashboardFiles: TFile[] = []
    notePaths.forEach((path) => {
      const file = this.app.vault.getAbstractFileByPath(path)
      if (file instanceof TFile) {
        dashboardFiles.push(file)
      }
    })

    this.displayFiles(contentEl, dashboardFiles)
  }

  /**
   * Check if a file has a specific tag
   */
  private hasTag(file: TFile, tag: string): boolean {
    const cache = this.app.metadataCache.getFileCache(file)
    if (!cache || !cache.tags) {
      return false
    }

    // Normalize tag (add # if missing)
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`

    return cache.tags.some((t) => t.tag === normalizedTag)
  }

  private createMenuItem(container: HTMLElement, item: MenuItem): void {
    const itemEl = container.createDiv({ cls: 'zk-menu-item' })

    // Get files for this section first to determine if we show collapse icon
    const files = this.getFilesForItem(item)
    const hasFiles = files.length > 0

    // Header with icon and name
    const headerEl = itemEl.createDiv({ cls: 'zk-menu-header' })

    // Collapse icon (only show if there are files)
    const isCollapsed = this.collapsedSections.has(item.name)
    const collapseIconEl = headerEl.createDiv({ cls: 'zk-collapse-icon' })
    if (hasFiles) {
      setIcon(collapseIconEl, isCollapsed ? 'chevron-right' : 'chevron-down')
    }

    // Item icon
    const iconEl = headerEl.createDiv({ cls: 'zk-menu-icon' })
    setIcon(iconEl, item.icon)

    // Item name (no count)
    const nameContainer = headerEl.createDiv({ cls: 'zk-menu-name-container' })
    const nameEl = nameContainer.createSpan({ cls: 'zk-menu-name', text: item.name })

    // Content area (collapsible)
    const contentEl = itemEl.createDiv({ cls: 'zk-menu-content' })
    // Auto-collapse if no files, or respect user's collapse state if there are files
    if (!hasFiles || isCollapsed) {
      contentEl.style.display = 'none'
    }

    // Add click handler to header for collapse/expand (only if there are files)
    if (hasFiles) {
      headerEl.addEventListener('click', async (e) => {
        e.stopPropagation()

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
      })
      headerEl.style.cursor = 'pointer'
    } else {
      headerEl.style.cursor = 'default'
    }

    // Display files
    this.displayFiles(contentEl, files)
  }

  private getFilesForItem(item: MenuItem): TFile[] {
    const allFiles = this.app.vault.getMarkdownFiles()

    let files: TFile[]

    if (!item.folder) {
      // If no folder (e.g., root), get all markdown files
      files = allFiles
    } else {
      // Filter files in the folder
      files = allFiles.filter(
        (file) => file.path.startsWith(item.folder + '/') || file.parent?.path === item.folder
      )
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

      // Inner container
      const fileItemSelf = fileEl.createDiv({ cls: 'tree-item-self nav-file-title' })

      // Highlight if this is the active file with purple background
      if (activeFile && file.path === activeFile.path) {
        fileItemSelf.addClass('is-active')
        fileItemSelf.style.backgroundColor = 'var(--interactive-accent)'
        fileItemSelf.style.color = 'var(--text-on-accent)'
      }

      // File title (from frontmatter or filename)
      const cache = this.app.metadataCache.getFileCache(file)
      const title = cache?.frontmatter?.title || file.basename

      // Inner content
      const fileInner = fileItemSelf.createDiv({ cls: 'tree-item-inner nav-file-title-content' })
      fileInner.setText(title)

      // Click handler to open file
      fileItemSelf.addEventListener('click', async (e) => {
        e.stopPropagation()
        await this.app.workspace.getLeaf(false).openFile(file)
      })

      // Context menu
      fileItemSelf.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        const menu = new (require('obsidian') as any).Menu()

        menu.addItem((item: any) => {
          item
            .setTitle('Open in new tab')
            .setIcon('external-link')
            .onClick(async () => {
              await this.app.workspace.getLeaf('tab').openFile(file)
            })
        })

        menu.addItem((item: any) => {
          item
            .setTitle('Open in new pane')
            .setIcon('columns-2')
            .onClick(async () => {
              await this.app.workspace.getLeaf('split').openFile(file)
            })
        })

        menu.showAtMouseEvent(e)
      })
    })
  }

  async onClose(): Promise<void> {
    // Clear any pending refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }
}

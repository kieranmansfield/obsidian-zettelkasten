import {
  ItemView,
  WorkspaceLeaf,
  type Workspace,
  TFile,
  TFolder,
  setIcon,
  Menu,
  MenuItem as ObsidianMenuItem,
  Platform,
  debounce,
} from 'obsidian'
import type ZettelkastenPlugin from '../main'
import { openNoteSequencesView } from './NoteSequencesView'
import { onFileChanges } from './viewEvents'
import { sidebarAreas, type MenuItem } from './sidebarAreas'
import { getFileTitle, isInFolder, matchesFilter } from 'src/base/fileHelpers'
import type { Bookmark } from 'src/base/settings'

export const VIEW_TYPE_ZETTELKASTEN = 'zettelkasten-view'

/** Open or focus the sidebar in the left dock, first moving it there if mobile put it elsewhere */
export async function revealZettelkastenSidebar(workspace: Workspace): Promise<void> {
  for (const leaf of workspace.getLeavesOfType(VIEW_TYPE_ZETTELKASTEN)) {
    if (Platform.isMobile && leaf.getRoot() !== workspace.leftSplit) leaf.detach()
  }
  await workspace.ensureSideLeaf(VIEW_TYPE_ZETTELKASTEN, 'left', { active: true })
}

const BOOKMARK_ICONS: Record<Bookmark['type'], string> = {
  file: 'file-text',
  search: 'search',
  graph: 'git-branch-plus',
  folder: 'folder',
}

interface SectionOptions {
  name: string
  icon: string
  /** Has children to show or hide */
  collapsible: boolean
  /** Heading action; a collapsible section toggles when there is none */
  onOpen?: () => void
  path?: string
  active?: boolean
}

/**
 * ZettelkastenSidebar
 *
 * Sidebar view displaying folders for different note types
 * (Fleeting/Inbox, Zettels, Literature/References, Index, Note Sequences)
 */
export class ZettelkastenSidebar extends ItemView {
  private plugin: ZettelkastenPlugin
  private collapsedSections: Set<string> = new Set()
  private scheduleRefresh = debounce(() => this.refresh(), 150, true)

  constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
    super(leaf)
    this.plugin = plugin
    this.loadCollapsedSections()
    this.registerEvents()
  }

  private collapsedStorageKey: string = 'obsidian-zettelkasten.collapsedSections'

  /** Per-vault state; falls back once to the old key that every vault shared */
  private loadCollapsedSections(): void {
    try {
      const stored: unknown =
        this.app.loadLocalStorage(this.collapsedStorageKey) ??
        JSON.parse(window.localStorage.getItem(this.collapsedStorageKey) ?? 'null')
      if (!Array.isArray(stored)) return
      stored.forEach((s: unknown) => {
        if (typeof s === 'string') this.collapsedSections.add(s)
      })
    } catch (e) {
      console.error('Failed to load collapsed sections', e)
    }
  }

  private saveCollapsedSections(): void {
    this.app.saveLocalStorage(this.collapsedStorageKey, Array.from(this.collapsedSections))
  }

  private registerEvents(): void {
    // Refresh panel when files are created, deleted, renamed or modified
    onFileChanges(this, this.app.vault, this.scheduleRefresh)
    this.registerEvent(this.app.vault.on('modify', () => this.scheduleRefresh()))

    // Refresh when metadata changes (tags, frontmatter, etc.)
    this.registerEvent(this.app.metadataCache.on('changed', () => this.scheduleRefresh()))
    this.registerEvent(this.app.metadataCache.on('resolved', () => this.scheduleRefresh()))

    // Refresh when active file changes to update highlighting
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.scheduleRefresh()))

    // Refresh when layout changes
    this.registerEvent(this.app.workspace.on('layout-change', () => this.scheduleRefresh()))
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

  async onOpen(): Promise<void> {
    this.refresh()
  }

  private renderContent(container: HTMLElement): void {
    for (const item of sidebarAreas(this.app, this.plugin.getSettingsManager()))
      this.createMenuItem(container, item)

    this.createBookmarksSection(container)

    const sequenceSettings = this.plugin.getSettingsManager().get('noteSequences')
    if (sequenceSettings.enabled && sequenceSettings.showSequencesView) {
      this.renderSection(container, {
        name: 'Note Sequences',
        icon: 'layers',
        collapsible: false,
        onOpen: () => void openNoteSequencesView(this.app.workspace),
      })
    }
  }

  /**
   * A section heading in file-explorer style (chevron, icon, name; mobile puts the chevron last)
   * and its children container, collapsed state kept per section name
   */
  private renderSection(container: HTMLElement, section: SectionOptions): HTMLElement {
    const collapsed = section.collapsible && this.collapsedSections.has(section.name)
    const itemEl = container.createDiv({ cls: 'tree-item nav-folder' })
    const headerEl = itemEl.createDiv({
      cls: 'tree-item-self nav-folder-title is-clickable mod-collapsible zk-indent-section',
    })
    headerEl.setAttribute('draggable', 'true')
    if (section.path !== undefined) headerEl.setAttribute('data-path', section.path)
    headerEl.toggleClass('is-active', !!section.active)

    const chevronEl = createDiv({ cls: 'tree-item-icon collapse-icon' })
    if (section.collapsible) setIcon(chevronEl, 'right-triangle')
    else chevronEl.addClass('zk-chevron-hidden') // keeps the spacing
    const iconEl = createDiv({ cls: 'zk-section-icon' })
    setIcon(iconEl, section.icon)
    const nameEl = createDiv({
      cls: 'tree-item-inner nav-folder-title-content',
      text: section.name,
    })
    headerEl.append(
      ...(Platform.isMobile ? [iconEl, nameEl, chevronEl] : [chevronEl, iconEl, nameEl])
    )

    const contentEl = itemEl.createDiv({ cls: 'tree-item-children nav-folder-children' })
    const setCollapsed = (value: boolean) => {
      itemEl.toggleClass('is-collapsed', value)
      chevronEl.toggleClass('is-collapsed', value)
      contentEl.setCssProps({ display: value ? 'none' : '' })
    }
    setCollapsed(collapsed)

    const toggle = () => {
      if (!section.collapsible) return section.onOpen?.()
      const nowCollapsed = !this.collapsedSections.delete(section.name)
      if (nowCollapsed) this.collapsedSections.add(section.name)
      setCollapsed(nowCollapsed)
      this.saveCollapsedSections()
    }
    const open = section.onOpen ?? toggle
    const onClick = (action: () => void) => (e: MouseEvent) => {
      e.stopPropagation()
      action()
    }
    chevronEl.addEventListener('click', onClick(toggle))
    iconEl.addEventListener('click', onClick(toggle))
    nameEl.addEventListener('click', onClick(open))
    // Clicks on the heading's padding and gaps
    headerEl.addEventListener('click', (e) => {
      if (e.target === headerEl) onClick(open)(e)
    })
    return contentEl
  }

  private createMenuItem(container: HTMLElement, item: MenuItem): void {
    const files = item.showFiles ? this.getFilesForItem(item) : []
    const dashboard = item.dashboardNote ? this.app.vault.getFileByPath(item.dashboardNote) : null

    const contentEl = this.renderSection(container, {
      name: item.name,
      icon: item.icon,
      path: item.folder,
      active: !!dashboard && this.app.workspace.getActiveFile()?.path === dashboard.path,
      collapsible: files.length > 0,
      onOpen: dashboard
        ? () => void this.app.workspace.getLeaf(false).openFile(dashboard)
        : undefined,
    })
    this.displayFiles(contentEl, files)
  }

  /** The area's notes, most recently modified first */
  private getFilesForItem(item: MenuItem): TFile[] {
    return this.app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          (!item.inFolder || isInFolder(file.path, item.folder)) &&
          (item.matches?.(file) ?? true) &&
          (!item.filterTag || matchesFilter(this.app, file, item.filterTag))
      )
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
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
      fileItemSelf.addClass('zk-indent-item')

      // Set the data attributes that Obsidian's file explorer uses
      fileItemSelf.setAttribute('data-path', file.path)

      // Highlight if this is the active file
      if (activeFile && file.path === activeFile.path) {
        fileItemSelf.addClass('is-active')
      }

      fileItemSelf.createDiv({
        cls: 'tree-item-inner nav-file-title-content',
        text: getFileTitle(this.app, file),
      })

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
            .onClick(() => this.revealInExplorer(file))
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

  /** Saved bookmarks; with none, the heading adds the first one */
  private createBookmarksSection(container: HTMLElement): void {
    const view = this.plugin.getSettingsManager().get('zettelkastenSidebar')
    const { bookmarks } = view
    const contentEl = this.renderSection(container, {
      name: view.bookmarksName || 'Bookmarks',
      icon: 'bookmark',
      collapsible: bookmarks.length > 0,
      onOpen: bookmarks.length > 0 ? undefined : () => this.addBookmark(),
    })
    this.displayBookmarks(contentEl, bookmarks)
  }

  /** Run the add-bookmark command (opens its modal) */
  private addBookmark(): void {
    const { commands } = this.app as unknown as {
      commands: { executeCommandById: (id: string) => boolean }
    }
    commands.executeCommandById(`${this.plugin.manifest.id}:add-bookmark`)
  }

  /**
   * Display bookmarks in the content area
   */
  private displayBookmarks(container: HTMLElement, bookmarks: Bookmark[]): void {
    if (bookmarks.length === 0) {
      const emptyEl = container.createDiv({
        cls: 'tree-item-self',
        text: 'No bookmarks yet. Tap to add one.',
      })
      emptyEl.addClass('zk-empty')
      emptyEl.addEventListener('click', (e) => {
        e.stopPropagation()
        this.addBookmark()
      })
      return
    }

    bookmarks.forEach((bookmark) => {
      const bookmarkEl = container.createDiv({ cls: 'tree-item nav-file' })
      const bookmarkItemSelf = bookmarkEl.createDiv({
        cls: 'tree-item-self is-clickable nav-file-title',
      })

      // Apply native inline styles for padding (nested one level)
      bookmarkItemSelf.addClass('zk-indent-item')

      const iconEl = bookmarkItemSelf.createDiv({ cls: 'tree-item-icon' })
      setIcon(iconEl, BOOKMARK_ICONS[bookmark.type])

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

  /** Open a bookmark: a file in the current tab, a search in the search pane, the graph, or a folder in the file explorer */
  private async handleBookmarkClick(bookmark: Bookmark): Promise<void> {
    const { workspace } = this.app
    const target = bookmark.path ? this.app.vault.getAbstractFileByPath(bookmark.path) : null
    switch (bookmark.type) {
      case 'graph':
        return workspace.getLeaf(false).setViewState({ type: 'graph', active: true })
      case 'search':
        return this.openSearch(bookmark.query)
      case 'file':
        if (target instanceof TFile) await workspace.getLeaf(false).openFile(target)
        return
      case 'folder':
        if (target instanceof TFolder) this.revealInExplorer(target)
    }
  }

  private async openSearch(query: string | undefined): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType('search')[0]
    if (!query || !leaf) return
    await this.app.workspace.revealLeaf(leaf)
    ;(leaf.view as unknown as { setQuery: (query: string) => void }).setQuery(query)
  }

  private revealInExplorer(file: TFile | TFolder): void {
    const explorer = this.app.workspace.getLeavesOfType('file-explorer')[0]?.view as unknown as
      { revealInFolder?: (file: TFile | TFolder) => void } | undefined
    explorer?.revealInFolder?.(file)
  }

  async onClose(): Promise<void> {
    this.scheduleRefresh.cancel()
  }
}

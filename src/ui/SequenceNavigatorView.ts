import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import type { SequenceNode } from '../base/noteSequence'
import type NoteSequenceService from '../service/noteSequence.service'

export const VIEW_TYPE_SEQUENCE_NAVIGATOR = 'sequence-navigator-view'

/**
 * SequenceNavigatorView
 *
 * Sidebar view displaying the current note's sequence in a tree format.
 * Shows the full hierarchy from root to current note with all siblings and children.
 */
export class SequenceNavigatorView extends ItemView {
  private sequenceService: NoteSequenceService
  private currentFile: TFile | null = null
  private collapsedNodes: Set<string> = new Set()

  constructor(leaf: WorkspaceLeaf, sequenceService: NoteSequenceService) {
    super(leaf)
    this.sequenceService = sequenceService
    this.registerEvents()
  }

  private registerEvents(): void {
    // Refresh when active file changes
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.refresh()
      })
    )

    // Refresh when files are created, deleted, or renamed
    this.registerEvent(this.app.vault.on('create', () => this.refresh()))
    this.registerEvent(this.app.vault.on('delete', () => this.refresh()))
    this.registerEvent(this.app.vault.on('rename', () => this.refresh()))
  }

  public refresh(): void {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('sequence-navigator-view')
    this.renderContent(container)
  }

  getViewType(): string {
    return VIEW_TYPE_SEQUENCE_NAVIGATOR
  }

  getDisplayText(): string {
    return 'Note Sequence'
  }

  getIcon(): string {
    return 'layers'
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('sequence-navigator-view')
    this.renderContent(container)
  }

  private renderContent(container: HTMLElement): void {
    // Get current active file
    const activeFile = this.app.workspace.getActiveFile()

    if (!activeFile) {
      container.createDiv({
        cls: 'sequence-nav-empty',
        text: 'No active note',
      })
      return
    }

    this.currentFile = activeFile

    // Check if this file is a zettel
    const isZettel = this.sequenceService.getCore().isZettelNote(activeFile)
    if (!isZettel) {
      container.createDiv({
        cls: 'sequence-nav-empty',
        text: 'Not a zettel note',
      })
      return
    }

    // Get the sequence for this file
    const sequence = this.sequenceService.getSequenceForFile(activeFile)
    if (!sequence) {
      container.createDiv({
        cls: 'sequence-nav-empty',
        text: 'No sequence found',
      })
      return
    }

    // Render the tree
    this.renderTree(container, sequence.root)
  }

  private renderTree(container: HTMLElement, root: SequenceNode): void {
    // Create tree container using Obsidian's file explorer classes
    const treeContainer = container.createDiv({
      cls: 'nav-files-container',
    })

    this.renderNode(treeContainer, root, 0)
  }

  private renderNode(container: HTMLElement, node: SequenceNode, depth: number): void {
    const isActive = this.currentFile?.path === node.file.path
    const hasChildren = node.children.length > 0

    // Create tree item
    const treeItem = container.createDiv({
      cls: 'tree-item nav-file',
    })

    if (isActive) {
      treeItem.addClass('is-active')
    }

    // Create tree item self
    const treeItemSelf = treeItem.createDiv({
      cls: 'tree-item-self nav-file-title',
      attr: { style: `padding-left: ${depth * 20 + 4}px` },
    })

    // Collapse icon (if has children)
    if (hasChildren) {
      const collapseIcon = treeItemSelf.createDiv({
        cls: 'tree-item-icon collapse-icon nav-folder-collapse-indicator',
      })

      const isCollapsed = node.isCollapsed || this.collapsedNodes.has(node.zettelId)
      const iconName = isCollapsed ? 'chevron-right' : 'chevron-down'
      setIcon(collapseIcon, iconName)

      collapseIcon.addEventListener('click', (e) => {
        e.stopPropagation()
        this.toggleCollapse(node)
      })
    } else {
      // Empty space for alignment
      treeItemSelf.createDiv({
        cls: 'tree-item-icon',
        attr: { style: 'width: 16px;' },
      })
    }

    // File icon - only show for root (depth 0)
    if (depth === 0) {
      const fileIcon = treeItemSelf.createDiv({
        cls: 'tree-item-icon nav-file-title-icon',
      })
      setIcon(fileIcon, 'file')
    }

    // File title
    const cache = this.app.metadataCache.getFileCache(node.file)
    const title = cache?.frontmatter?.title || node.file.basename

    treeItemSelf.createDiv({
      cls: 'tree-item-inner nav-file-title-content',
      text: title,
    })

    // Click handler to open file
    treeItemSelf.addEventListener('mousedown', async (e) => {
      // Only handle left mouse button
      if (e.button === 0) {
        e.preventDefault()
        e.stopPropagation()
        await this.app.workspace.getLeaf(false).openFile(node.file)
      }
    })

    // Render children if not collapsed
    const isCollapsed = node.isCollapsed || this.collapsedNodes.has(node.zettelId)
    if (hasChildren && !isCollapsed) {
      const childrenContainer = treeItem.createDiv({
        cls: 'tree-item-children nav-folder-children',
      })

      node.children.forEach((child) => {
        this.renderNode(childrenContainer, child, depth + 1)
      })
    }
  }

  private toggleCollapse(node: SequenceNode): void {
    if (this.collapsedNodes.has(node.zettelId)) {
      this.collapsedNodes.delete(node.zettelId)
    } else {
      this.collapsedNodes.add(node.zettelId)
    }

    this.refresh()
  }

  async onClose(): Promise<void> {
    // Cleanup
  }
}

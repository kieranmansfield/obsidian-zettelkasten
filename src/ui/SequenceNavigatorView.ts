import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import type { SequenceNode } from '../base/noteSequence'
import type NoteSequenceService from '../service/noteSequence.service'
import { getFileTitle } from '../base/fileHelpers'
import { onFileChanges } from './viewEvents'

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

    onFileChanges(this, this.app.vault, () => this.refresh())
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
    return 'Sequence navigator'
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
    const isZettel = this.sequenceService.isZettel(activeFile)
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

    // Render the full tree including the root/parent
    this.renderNode(treeContainer, root, 0)
  }

  private renderNode(container: HTMLElement, node: SequenceNode, depth: number): void {
    const treeItem = container.createDiv({ cls: 'tree-item nav-file' })
    treeItem.toggleClass('is-active', this.currentFile?.path === node.file.path)
    const self = treeItem.createDiv({
      cls: 'tree-item-self nav-file-title',
      attr: { style: `padding-left: ${depth * 20 + 4}px` },
    })

    const hasChildren = node.children.length > 0
    const collapsed = this.collapsedNodes.has(node.zettelId)
    if (hasChildren) {
      const chevron = self.createDiv({
        cls: 'tree-item-icon collapse-icon nav-folder-collapse-indicator',
      })
      setIcon(chevron, collapsed ? 'chevron-right' : 'chevron-down')
      chevron.addEventListener('click', (e) => {
        e.stopPropagation()
        this.toggleCollapse(node)
      })
    } else {
      // Empty space for alignment
      self.createDiv({ cls: 'tree-item-icon', attr: { style: 'width: 16px;' } })
    }

    // File icon only on the root
    if (depth === 0) setIcon(self.createDiv({ cls: 'tree-item-icon nav-file-title-icon' }), 'file')

    self.createDiv({
      cls: 'tree-item-inner nav-file-title-content',
      text: getFileTitle(this.app, node.file),
    })

    // Left button opens the note
    self.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      void this.app.workspace.getLeaf(false).openFile(node.file)
    })

    if (hasChildren && !collapsed) {
      const children = treeItem.createDiv({ cls: 'tree-item-children nav-folder-children' })
      for (const child of node.children) this.renderNode(children, child, depth + 1)
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

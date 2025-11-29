import { ItemView, WorkspaceLeaf, TFile, setIcon } from 'obsidian'
import type ZettelkastenPlugin from '../main'

import { SequenceTreeNode } from '../types/interfaces'

export const VIEW_TYPE_SEQUENCE_NAVIGATOR = 'sequence-navigator-view'

export class SequenceNavigatorView extends ItemView {
  plugin: ZettelkastenPlugin
  private currentFile: TFile | null = null
  private collapsedNodes: Set<string> = new Set()

  constructor(leaf: WorkspaceLeaf, plugin: ZettelkastenPlugin) {
    super(leaf)
    this.plugin = plugin
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
    const zettelId = this.extractZettelId(activeFile.basename)
    if (!zettelId) {
      container.createDiv({
        cls: 'sequence-nav-empty',
        text: 'Not a zettel note',
      })
      return
    }

    // Find the root parent of this zettel
    const rootParent = this.findRootParent(activeFile, zettelId)
    if (!rootParent) {
      container.createDiv({
        cls: 'sequence-nav-empty',
        text: 'No sequence found',
      })
      return
    }

    // Build the full tree
    const tree = this.buildSequenceTree(rootParent)

    // Render the tree
    this.renderTree(container, tree)
  }

  private findRootParent(file: TFile, zettelId: string): TFile | null {
    const idWithoutPrefix = this.stripPrefix(zettelId)

    // If this is already a root (just timestamp), it's the parent
    if (/^\d+$/.test(idWithoutPrefix)) {
      return file
    }

    // Extract the timestamp part (root ID)
    const timestampMatch = idWithoutPrefix.match(/^(\d{13,})/)
    if (!timestampMatch) {
      return null
    }

    const rootTimestamp = timestampMatch[1]

    // Find the file with this root ID
    const zettelsFolder = this.plugin.settings.zettelsLocation
    if (!zettelsFolder) {
      return null
    }

    const allFiles = this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(zettelsFolder))

    // Look for the root file
    for (const f of allFiles) {
      const fId = this.extractZettelId(f.basename)
      if (!fId) continue

      const fIdWithoutPrefix = this.stripPrefix(fId)
      if (fIdWithoutPrefix === rootTimestamp) {
        return f
      }
    }

    return null
  }

  private buildSequenceTree(parentFile: TFile): SequenceTreeNode {
    const parentId = this.extractZettelId(parentFile.basename)
    if (!parentId) {
      return {
        file: parentFile,
        zettelId: '',
        level: 0,
        children: [],
        isCollapsed: false,
      }
    }

    const zettelsFolder = this.plugin.settings.zettelsLocation
    const allFiles = this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(zettelsFolder || ''))

    const tree: SequenceTreeNode = {
      file: parentFile,
      zettelId: parentId,
      level: 0,
      children: [],
      isCollapsed: this.collapsedNodes.has(parentId),
    }

    // Build children recursively
    this.buildChildren(tree, allFiles)

    return tree
  }

  private buildChildren(node: SequenceTreeNode, allFiles: TFile[]): void {
    const parentIdWithoutPrefix = this.stripPrefix(node.zettelId)

    // Find direct children
    const directChildren: SequenceTreeNode[] = []

    allFiles.forEach((file) => {
      const childId = this.extractZettelId(file.basename)
      if (!childId || childId === node.zettelId) return

      const childIdWithoutPrefix = this.stripPrefix(childId)

      // Check if this is a direct child
      if (childIdWithoutPrefix.startsWith(parentIdWithoutPrefix)) {
        const suffix = childIdWithoutPrefix.substring(parentIdWithoutPrefix.length)

        // Only direct children (one level down)
        if (this.isDirectChild(suffix)) {
          const childLevel = this.calculateLevel(childIdWithoutPrefix)
          const parentLevel = this.calculateLevel(parentIdWithoutPrefix)

          // Only add if child is exactly one level deeper than parent
          if (childLevel === parentLevel + 1) {
            const childNode: SequenceTreeNode = {
              file: file,
              zettelId: childId,
              level: childLevel,
              children: [],
              isCollapsed: this.collapsedNodes.has(childId),
            }

            // Recursively build this child's children
            this.buildChildren(childNode, allFiles)

            directChildren.push(childNode)
          }
        }
      }
    })

    // Sort children by ID
    directChildren.sort((a, b) => a.zettelId.localeCompare(b.zettelId))
    node.children = directChildren
  }

  private isDirectChild(suffix: string): boolean {
    if (!suffix) return false

    // Direct child has only ONE segment type (either all letters or all numbers)
    // Valid direct children:
    // - Single or multiple letters: "a", "b", "z", "aa", "ab", "az" (all siblings)
    // - Single or multiple numbers: "1", "2", "12", "123" (all siblings)
    // Invalid (grandchildren or further):
    // - Mixed: "a1", "1a", "a1b" (these have transitions between letter/number types)

    const hasLetters = /[a-z]/.test(suffix)
    const hasNumbers = /\d/.test(suffix)

    // If it has both letters and numbers, it's not a direct child
    if (hasLetters && hasNumbers) {
      return false
    }

    // If it's only letters or only numbers, it's a direct child
    return true
  }

  private calculateLevel(suffix: string): number {
    if (!suffix) return 1

    // Count transitions between letters and numbers
    let level = 1
    let lastWasLetter = /[a-z]/.test(suffix[0])

    for (let i = 1; i < suffix.length; i++) {
      const isLetter = /[a-z]/.test(suffix[i])
      if (isLetter !== lastWasLetter) {
        level++
        lastWasLetter = isLetter
      }
    }

    return level
  }

  private renderTree(container: HTMLElement, tree: SequenceTreeNode): void {
    // Create tree container using Obsidian's file explorer classes
    const treeContainer = container.createDiv({
      cls: 'nav-files-container',
    })

    this.renderNode(treeContainer, tree, 0)
  }

  private renderNode(container: HTMLElement, node: SequenceTreeNode, depth: number): void {
    const isActive = this.currentFile?.path === node.file.path
    const hasChildren = node.children.length > 0

    // Create tree item
    const treeItem = container.createDiv({
      cls: 'tree-item nav-file',
    })

    if (isActive) {
      treeItem.addClass('is-active')
    }

    // Create tree item self (not using is-clickable class as it causes double-click behavior)
    const treeItemSelf = treeItem.createDiv({
      cls: 'tree-item-self nav-file-title',
      attr: { style: `padding-left: ${depth * 20 + 4}px` },
    })

    // Collapse icon (if has children)
    if (hasChildren) {
      const collapseIcon = treeItemSelf.createDiv({
        cls: 'tree-item-icon collapse-icon nav-folder-collapse-indicator',
      })

      const iconName = node.isCollapsed ? 'chevron-right' : 'chevron-down'
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

    // Click handler to open file - use mousedown to prevent double-click behavior
    treeItemSelf.addEventListener('mousedown', async (e) => {
      // Only handle left mouse button
      if (e.button === 0) {
        e.preventDefault()
        e.stopPropagation()
        await this.app.workspace.getLeaf(false).openFile(node.file)
      }
    })

    // Render children if not collapsed
    if (hasChildren && !node.isCollapsed) {
      const childrenContainer = treeItem.createDiv({
        cls: 'tree-item-children nav-folder-children',
      })

      node.children.forEach((child) => {
        this.renderNode(childrenContainer, child, depth + 1)
      })
    }
  }

  private toggleCollapse(node: SequenceTreeNode): void {
    if (this.collapsedNodes.has(node.zettelId)) {
      this.collapsedNodes.delete(node.zettelId)
    } else {
      this.collapsedNodes.add(node.zettelId)
    }

    this.refresh()
  }

  private extractZettelId(filename: string): string | null {
    // Match timestamp pattern with optional prefix
    const withPrefixMatch = filename.match(/^([a-z]+\d{13,}(?:[a-z]+|\d+)*)/)
    if (withPrefixMatch) {
      return withPrefixMatch[1]
    }

    // Try without prefix
    const withoutPrefixMatch = filename.match(/^(\d{13,}(?:[a-z]+|\d+)*)/)
    return withoutPrefixMatch ? withoutPrefixMatch[1] : null
  }

  private stripPrefix(zettelId: string): string {
    const prefixMatch = zettelId.match(/^([a-z]+)/)
    if (prefixMatch) {
      return zettelId.substring(prefixMatch[1].length)
    }
    return zettelId
  }

  async onClose(): Promise<void> {
    // Cleanup
  }
}

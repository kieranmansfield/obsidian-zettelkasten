import type { TFile, Vault } from 'obsidian'
import type {
  SequenceNode,
  NoteSequence,
  SequenceMetadata,
  SequenceBuildOptions,
} from '../base/noteSequence'
import ZettelId from './zettelId.class'

/**
 * NoteSequence
 *
 * Core class for managing hierarchical note sequences.
 * Handles building sequence trees, navigation, and hierarchy analysis.
 */
export default class NoteSequenceCore {
  private vault: Vault

  constructor(vault: Vault) {
    this.vault = vault
  }

  /**
   * Extract zettel ID from a filename
   * Supports both with and without prefix
   */
  extractZettelId(filename: string): string | null {
    // Match timestamp pattern with optional prefix (17+ digits followed by optional segments)
    const withPrefixMatch = filename.match(/^([a-z]+)?(\d{17,}(?:[a-z]+|\d+)*)/)
    if (withPrefixMatch) {
      return withPrefixMatch[2] // Return without prefix
    }

    return null
  }

  /**
   * Check if a file is a zettel note
   */
  isZettelNote(file: TFile): boolean {
    return this.extractZettelId(file.basename) !== null
  }

  /**
   * Check if a zettel ID is a root (no hierarchy segments)
   */
  isRootZettel(zettelId: string): boolean {
    // Root IDs are just the timestamp (17 digits, no letters/numbers after)
    return /^\d{17}$/.test(zettelId)
  }

  /**
   * Get the root zettel ID from any zettel ID in the sequence
   */
  getRootId(zettelId: string): string {
    // Extract just the timestamp (first 17 digits)
    const match = zettelId.match(/^(\d{17})/)
    return match ? match[1] : zettelId
  }

  /**
   * Get the parent ID of a zettel
   * Returns null if this is already a root
   */
  getParentId(zettelId: string): string | null {
    if (this.isRootZettel(zettelId)) {
      return null
    }

    // Remove the last segment
    const match = zettelId.match(/^(.+?)([a-z]+|\d+)$/)
    if (match) {
      return match[1]
    }

    return null
  }

  /**
   * Calculate the hierarchical level of a zettel
   * Root = 0, direct children = 1, grandchildren = 2, etc.
   */
  calculateLevel(zettelId: string): number {
    const rootId = this.getRootId(zettelId)
    if (zettelId === rootId) {
      return 0
    }

    const suffix = zettelId.substring(rootId.length)
    if (!suffix) return 0

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

  /**
   * Check if childId is a direct child of parentId
   * Direct children have no intermediate levels
   */
  isDirectChild(parentId: string, childId: string): boolean {
    // Child must start with parent ID
    if (!childId.startsWith(parentId)) {
      return false
    }

    // Extract the suffix after parent ID
    const suffix = childId.substring(parentId.length)
    if (!suffix) return false

    // Direct child has only ONE segment type (all letters OR all numbers)
    const hasLetters = /[a-z]/.test(suffix)
    const hasNumbers = /\d/.test(suffix)

    // If it has both, it's a grandchild or further
    return !(hasLetters && hasNumbers)
  }

  /**
   * Find the root file for a given zettel file
   * Returns the file itself if it's already a root
   */
  findRootFile(file: TFile, allFiles: TFile[]): TFile | null {
    const zettelId = this.extractZettelId(file.basename)
    if (!zettelId) return null

    if (this.isRootZettel(zettelId)) {
      return file
    }

    const rootId = this.getRootId(zettelId)

    // Find the file with this root ID
    for (const f of allFiles) {
      const fId = this.extractZettelId(f.basename)
      if (fId === rootId) {
        return f
      }
    }

    return null
  }

  /**
   * Find all children of a given zettel
   */
  findChildren(parentFile: TFile, allFiles: TFile[], directOnly = true): TFile[] {
    const parentId = this.extractZettelId(parentFile.basename)
    if (!parentId) return []

    const children: TFile[] = []

    for (const file of allFiles) {
      const childId = this.extractZettelId(file.basename)
      if (!childId || childId === parentId) continue

      // Check if this is a child
      if (childId.startsWith(parentId)) {
        if (directOnly) {
          // Only include direct children
          if (this.isDirectChild(parentId, childId)) {
            children.push(file)
          }
        } else {
          // Include all descendants
          children.push(file)
        }
      }
    }

    // Sort by zettel ID
    children.sort((a, b) => {
      const aId = this.extractZettelId(a.basename) || ''
      const bId = this.extractZettelId(b.basename) || ''
      return aId.localeCompare(bId)
    })

    return children
  }

  /**
   * Build a complete sequence tree starting from a root file
   */
  buildSequence(rootFile: TFile, allFiles: TFile[], options?: SequenceBuildOptions): NoteSequence {
    const opts: SequenceBuildOptions = {
      includeRoot: true,
      maxDepth: -1,
      sortChildren: true,
      ...options,
    }

    const rootId = this.extractZettelId(rootFile.basename)
    if (!rootId) {
      throw new Error('Root file is not a valid zettel note')
    }

    // Build the root node
    const root: SequenceNode = {
      file: rootFile,
      zettelId: rootId,
      level: 0,
      children: [],
      isCollapsed: false,
    }

    // Recursively build children
    this.buildNodeChildren(root, allFiles, opts)

    // Collect all nodes
    const allNodes: SequenceNode[] = []
    if (opts.includeRoot) {
      allNodes.push(root)
    }
    this.collectAllNodes(root, allNodes)

    // Build metadata
    const metadata = this.buildMetadata(root, allNodes)

    return {
      root,
      metadata,
      allNodes,
    }
  }

  /**
   * Recursively build children for a node
   */
  private buildNodeChildren(
    node: SequenceNode,
    allFiles: TFile[],
    options: SequenceBuildOptions
  ): void {
    // Check max depth
    if (options.maxDepth !== undefined && options.maxDepth >= 0 && node.level >= options.maxDepth) {
      return
    }

    const directChildren = this.findChildren(node.file, allFiles, true)

    for (const childFile of directChildren) {
      const childId = this.extractZettelId(childFile.basename)
      if (!childId) continue

      const childNode: SequenceNode = {
        file: childFile,
        zettelId: childId,
        level: this.calculateLevel(childId),
        children: [],
        isCollapsed: false,
        parent: node,
      }

      // Apply filter if provided
      if (options.filter && !options.filter(childNode)) {
        continue
      }

      // Recursively build children
      this.buildNodeChildren(childNode, allFiles, options)

      node.children.push(childNode)
    }

    // Sort children if requested
    if (options.sortChildren) {
      node.children.sort((a, b) => a.zettelId.localeCompare(b.zettelId))
    }
  }

  /**
   * Collect all nodes into a flat list (depth-first)
   */
  private collectAllNodes(node: SequenceNode, result: SequenceNode[]): void {
    for (const child of node.children) {
      result.push(child)
      this.collectAllNodes(child, result)
    }
  }

  /**
   * Build metadata for a sequence
   */
  private buildMetadata(root: SequenceNode, allNodes: SequenceNode[]): SequenceMetadata {
    // Calculate max depth
    let maxDepth = 0
    for (const node of allNodes) {
      if (node.level > maxDepth) {
        maxDepth = node.level
      }
    }

    // Parse timestamp from root ID
    const timestamp = root.zettelId.slice(0, 17)
    const created = this.parseZettelTimestamp(timestamp)

    // Find most recent modification (use file mtime)
    let modified = created
    for (const node of [root, ...allNodes]) {
      if (node.file.stat.mtime > modified.getTime()) {
        modified = new Date(node.file.stat.mtime)
      }
    }

    return {
      totalNotes: allNodes.length + 1, // +1 for root
      maxDepth,
      created,
      modified,
    }
  }

  /**
   * Parse a zettel timestamp string into a Date
   */
  private parseZettelTimestamp(timestamp: string): Date {
    // Format: YYYYMMDDHHmmssSSS (17 digits)
    const year = parseInt(timestamp.slice(0, 4))
    const month = parseInt(timestamp.slice(4, 6)) - 1 // JS months are 0-indexed
    const day = parseInt(timestamp.slice(6, 8))
    const hour = parseInt(timestamp.slice(8, 10))
    const minute = parseInt(timestamp.slice(10, 12))
    const second = parseInt(timestamp.slice(12, 14))
    const millisecond = parseInt(timestamp.slice(14, 17))

    return new Date(year, month, day, hour, minute, second, millisecond)
  }

  /**
   * Find all root zettels in a set of files
   */
  findAllRoots(files: TFile[]): TFile[] {
    const roots: TFile[] = []

    for (const file of files) {
      const zettelId = this.extractZettelId(file.basename)
      if (zettelId && this.isRootZettel(zettelId)) {
        roots.push(file)
      }
    }

    // Sort by ID (most recent first)
    roots.sort((a, b) => {
      const aId = this.extractZettelId(a.basename) || ''
      const bId = this.extractZettelId(b.basename) || ''
      return bId.localeCompare(aId)
    })

    return roots
  }

  /**
   * Find all sequences with children in a set of files
   */
  findAllSequences(files: TFile[], options?: SequenceBuildOptions): NoteSequence[] {
    const roots = this.findAllRoots(files)
    const sequences: NoteSequence[] = []

    for (const root of roots) {
      const children = this.findChildren(root, files, false)
      // Only include if it has children
      if (children.length > 0) {
        const sequence = this.buildSequence(root, files, options)
        sequences.push(sequence)
      }
    }

    return sequences
  }
}

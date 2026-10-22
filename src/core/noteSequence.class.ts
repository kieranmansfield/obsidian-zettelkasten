import type { TFile, Vault } from 'obsidian'
import type {
  SequenceNode,
  NoteSequence,
  SequenceMetadata,
  SequenceBuildOptions,
} from '../base/noteSequence'
import {
  compareZettelFiles,
  isChildOf,
  isDescendantOf,
  parentZettelId,
  parseZettelId,
} from '../base/zettelIdOrder'

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
    return parseZettelId(filename)?.id ?? null
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
    return parseZettelId(zettelId)?.segments.length === 0
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
    return parentZettelId(zettelId)
  }

  /**
   * Calculate the hierarchical level of a zettel
   * Root = 0, direct children = 1, grandchildren = 2, etc.
   */
  calculateLevel(zettelId: string): number {
    return parseZettelId(zettelId)?.segments.length ?? 0
  }

  /**
   * Check if childId is a direct child of parentId
   * Direct children have no intermediate levels
   */
  isDirectChild(parentId: string, childId: string): boolean {
    return isChildOf(childId, parentId)
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
    const under = directOnly ? isChildOf : isDescendantOf
    return allFiles
      .filter((file) => {
        const id = this.extractZettelId(file.basename)
        return !!id && under(id, parentId)
      })
      .sort(compareZettelFiles)
  }

  /**
   * Build a complete sequence tree starting from a root file
   */
  buildSequence(rootFile: TFile, allFiles: TFile[], options?: SequenceBuildOptions): NoteSequence {
    const opts: SequenceBuildOptions = {
      includeRoot: true,
      maxDepth: -1,
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
    this.buildNodeChildren(root, this.indexByParent(allFiles), opts)

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
    byParent: Map<string, TFile[]>,
    options: SequenceBuildOptions
  ): void {
    // Check max depth
    if (options.maxDepth !== undefined && options.maxDepth >= 0 && node.level >= options.maxDepth) {
      return
    }

    // indexByParent lists are already in ID order, so children need no sort
    for (const childFile of byParent.get(node.zettelId) ?? []) {
      const childId = this.extractZettelId(childFile.basename)!
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
      this.buildNodeChildren(childNode, byParent, options)

      node.children.push(childNode)
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
      // Root plus descendants, whether or not allNodes includes the root
      totalNotes: 1 + allNodes.filter((n) => n !== root).length,
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

  /** Direct children per parent ID, each list in ID order; parses every file once */
  private indexByParent(files: TFile[]): Map<string, TFile[]> {
    const byParent = new Map<string, TFile[]>()
    for (const file of files) {
      const id = this.extractZettelId(file.basename)
      const parentId = id && parentZettelId(id)
      if (!parentId) continue
      const siblings = byParent.get(parentId)
      if (siblings) siblings.push(file)
      else byParent.set(parentId, [file])
    }
    for (const siblings of byParent.values()) siblings.sort(compareZettelFiles)
    return byParent
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

    // Most recent first
    roots.sort((a, b) => compareZettelFiles(b, a))

    return roots
  }

  /**
   * Find all sequences with children in a set of files
   */
  findAllSequences(files: TFile[], options?: SequenceBuildOptions): NoteSequence[] {
    const roots = this.findAllRoots(files)
    const byParent = this.indexByParent(files)
    const sequences: NoteSequence[] = []

    for (const root of roots) {
      // Only include if it has children
      if (byParent.has(this.extractZettelId(root.basename) ?? '')) {
        const sequence = this.buildSequence(root, files, options)
        sequences.push(sequence)
      }
    }

    return sequences
  }
}

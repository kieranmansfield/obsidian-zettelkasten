import type { TFile } from 'obsidian'

/**
 * Note Sequences Types and Interfaces
 *
 * Defines types for managing hierarchical note sequences in the Zettelkasten system.
 * Sequences represent parent-child relationships between zettels based on their IDs.
 */

/**
 * A node in a note sequence hierarchy
 */
export interface SequenceNode {
  /**
   * The file this node represents
   */
  file: TFile

  /**
   * The zettel ID of this note
   */
  zettelId: string

  /**
   * The hierarchical level (depth) of this node
   * Root = 0, direct children = 1, grandchildren = 2, etc.
   */
  level: number

  /**
   * Child nodes in the hierarchy
   */
  children: SequenceNode[]

  /**
   * Whether this node is collapsed in the UI
   * @default false
   */
  isCollapsed?: boolean

  /**
   * Parent node reference (for easier navigation)
   */
  parent?: SequenceNode
}

/**
 * Metadata about a note sequence
 */
export interface SequenceMetadata {
  /**
   * Total number of notes in the sequence
   */
  totalNotes: number

  /**
   * Maximum depth of the sequence tree
   */
  maxDepth: number

  /**
   * When the sequence was first created (based on root zettel timestamp)
   */
  created: Date

  /**
   * When the sequence was last modified (based on most recent child)
   */
  modified: Date
}

/**
 * Represents a complete note sequence
 */
export interface NoteSequence {
  /**
   * The root node of the sequence
   */
  root: SequenceNode

  /**
   * Metadata about this sequence
   */
  metadata: SequenceMetadata

  /**
   * Flattened list of all nodes in the sequence (for easy iteration)
   */
  allNodes: SequenceNode[]
}

/**
 * Options for building sequences
 */
export interface SequenceBuildOptions {
  /**
   * Whether to include the root node in allNodes
   * @default true
   */
  includeRoot?: boolean

  /**
   * Maximum depth to traverse (-1 for unlimited)
   * @default -1
   */
  maxDepth?: number

  /**
   * Whether to sort children by zettel ID
   * @default true
   */
  sortChildren?: boolean

  /**
   * Filter function for nodes
   */
  filter?: (node: SequenceNode) => boolean
}

/**
 * Options for reordering sequences
 */
export interface SequenceReorderOptions {
  /**
   * Whether to compact IDs after reordering
   * Compaction removes gaps: a, c, f ’ a, b, c
   * @default true
   */
  compactIds?: boolean

  /**
   * Whether to update frontmatter links
   * @default true
   */
  updateLinks?: boolean

  /**
   * Dry run - don't actually rename files
   * @default false
   */
  dryRun?: boolean
}

/**
 * Result of a reorder operation
 */
export interface SequenceReorderResult {
  /**
   * Whether the operation was successful
   */
  success: boolean

  /**
   * Map of old file path to new file path
   */
  renamedFiles: Map<string, string>

  /**
   * Any errors that occurred
   */
  errors: string[]

  /**
   * Number of files affected
   */
  filesAffected: number
}

/**
 * Navigation result when moving through sequences
 */
export interface SequenceNavigationResult {
  /**
   * The target node (if found)
   */
  node: SequenceNode | null

  /**
   * The sequence containing the target
   */
  sequence: NoteSequence | null

  /**
   * Whether navigation was successful
   */
  success: boolean

  /**
   * Error message if navigation failed
   */
  error?: string
}

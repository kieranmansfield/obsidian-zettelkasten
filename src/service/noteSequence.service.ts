import type { TFile, Vault, App } from 'obsidian'
import type {
  NoteSequence,
  SequenceNode,
  SequenceBuildOptions,
  SequenceReorderOptions,
  SequenceReorderResult,
  SequenceNavigationResult,
} from '../base/noteSequence'
import NoteSequenceCore from '../core/noteSequence.class'
import type FileService from './file.service'

/**
 * NoteSequenceService
 *
 * Service for managing note sequences in the vault.
 * Provides high-level operations for finding, building, and manipulating sequences.
 */
export default class NoteSequenceService {
  private core: NoteSequenceCore
  private vault: Vault
  private fileService: FileService
  private app: App

  constructor(app: App, fileService: FileService) {
    this.app = app
    this.vault = app.vault
    this.core = new NoteSequenceCore(this.vault)
    this.fileService = fileService
  }

  /**
   * Find all sequences in a specific folder
   */
  findSequencesInFolder(folderPath: string, options?: SequenceBuildOptions): NoteSequence[] {
    const files = this.vault.getMarkdownFiles().filter((file) => file.path.startsWith(folderPath))
    return this.core.findAllSequences(files, options)
  }

  /**
   * Find all sequences in the entire vault
   */
  findAllSequences(options?: SequenceBuildOptions): NoteSequence[] {
    const files = this.vault.getMarkdownFiles()
    return this.core.findAllSequences(files, options)
  }

  /**
   * Get the sequence for a specific file
   * Returns null if the file is not part of a sequence
   */
  getSequenceForFile(file: TFile, options?: SequenceBuildOptions): NoteSequence | null {
    const zettelId = this.core.extractZettelId(file.basename)
    if (!zettelId) return null

    // Find the root file
    const allFiles = this.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(file.parent?.path || ''))

    const rootFile = this.core.findRootFile(file, allFiles)
    if (!rootFile) return null

    return this.core.buildSequence(rootFile, allFiles, options)
  }

  /**
   * Navigate to parent node
   */
  navigateToParent(currentFile: TFile): SequenceNavigationResult {
    const zettelId = this.core.extractZettelId(currentFile.basename)
    if (!zettelId) {
      return {
        node: null,
        sequence: null,
        success: false,
        error: 'Current file is not a zettel note',
      }
    }

    const parentId = this.core.getParentId(zettelId)
    if (!parentId) {
      return {
        node: null,
        sequence: null,
        success: false,
        error: 'Current file is already a root zettel',
      }
    }

    // Find the parent file
    const allFiles = this.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(currentFile.parent?.path || ''))

    for (const file of allFiles) {
      const fileId = this.core.extractZettelId(file.basename)
      if (fileId === parentId) {
        const sequence = this.getSequenceForFile(file)
        const node: SequenceNode = {
          file,
          zettelId: fileId,
          level: this.core.calculateLevel(fileId),
          children: [],
        }

        return {
          node,
          sequence,
          success: true,
        }
      }
    }

    return {
      node: null,
      sequence: null,
      success: false,
      error: 'Parent file not found',
    }
  }

  /**
   * Navigate to children nodes
   */
  navigateToChildren(currentFile: TFile): SequenceNavigationResult[] {
    const zettelId = this.core.extractZettelId(currentFile.basename)
    if (!zettelId) {
      return [
        {
          node: null,
          sequence: null,
          success: false,
          error: 'Current file is not a zettel note',
        },
      ]
    }

    const allFiles = this.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(currentFile.parent?.path || ''))

    const children = this.core.findChildren(currentFile, allFiles, true)

    return children.map((childFile) => {
      const childId = this.core.extractZettelId(childFile.basename)
      if (!childId) {
        return {
          node: null,
          sequence: null,
          success: false,
          error: 'Child file is not a valid zettel',
        }
      }

      const sequence = this.getSequenceForFile(childFile)
      const node: SequenceNode = {
        file: childFile,
        zettelId: childId,
        level: this.core.calculateLevel(childId),
        children: [],
      }

      return {
        node,
        sequence,
        success: true,
      }
    })
  }

  /**
   * Reorder a sequence (complex operation involving file renames)
   * This is a placeholder for now - full implementation will be added later
   */
  reorderSequence(
    rootFile: TFile,
    newOrder: TFile[],
    indentLevels: Map<TFile, number>,
    options?: SequenceReorderOptions
  ): SequenceReorderResult {
    // TODO: Implement full reordering logic
    // This involves:
    // 1. Generating new IDs based on newOrder and indentLevels
    // 2. Renaming files in correct order to avoid conflicts
    // 3. Updating any internal links if needed
    // 4. Handling errors and rollback

    // Avoid unused variable warning - will be used when implemented
    void rootFile
    void newOrder
    void indentLevels
    void options

    return {
      success: false,
      renamedFiles: new Map(),
      errors: ['Reordering not yet implemented'],
      filesAffected: 0,
    }
  }

  /**
   * Check if a file is part of a sequence
   */
  isInSequence(file: TFile): boolean {
    const zettelId = this.core.extractZettelId(file.basename)
    if (!zettelId) return false

    // Check if there are any related files (parent or children)
    const allFiles = this.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(file.parent?.path || ''))

    // Check for parent
    const parentId = this.core.getParentId(zettelId)
    if (parentId) {
      return true // Has a parent, so it's in a sequence
    }

    // Check for children
    const children = this.core.findChildren(file, allFiles, false)
    return children.length > 0 // Has children, so it's a sequence root
  }

  /**
   * Get all root zettels in a folder
   */
  getRootsInFolder(folderPath: string): TFile[] {
    const files = this.vault.getMarkdownFiles().filter((file) => file.path.startsWith(folderPath))
    return this.core.findAllRoots(files)
  }

  /**
   * Export the core for advanced use cases
   */
  getCore(): NoteSequenceCore {
    return this.core
  }
}

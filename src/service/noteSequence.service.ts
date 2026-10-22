import type { App, TFile } from 'obsidian'
import {
  buildSequence,
  findChildren,
  findRootFile,
  findRoots,
  type NoteSequence,
} from '../base/noteSequence'
import { isInFolder } from '../base/fileHelpers'
import { compareZettelFiles, parentZettelId, parseZettelId } from '../base/zettelIdOrder'

const idOf = (file: TFile): string | null => parseZettelId(file.basename)?.id ?? null

/**
 * NoteSequenceService
 *
 * Answers sequence questions about a zettel: its parent, children, siblings, neighbours and
 * sequence. A zettel's sequence lives in its own folder (and below), so timestamped notes in
 * other areas such as the inbox never join it. Lists are in ID order, never string order.
 */
export default class NoteSequenceService {
  private app: App

  constructor(app: App) {
    this.app = app
  }

  /** Markdown files in `file`'s folder and below */
  private scope(file: TFile): TFile[] {
    const folder = file.parent?.path ?? ''
    return this.app.vault.getMarkdownFiles().filter((f) => isInFolder(f.path, folder))
  }

  isZettel(file: TFile): boolean {
    return idOf(file) !== null
  }

  /** The whole sequence `file` belongs to, or null if it is not a zettel or its root is missing */
  getSequenceForFile(file: TFile): NoteSequence | null {
    const files = this.scope(file)
    const root = findRootFile(file, files)
    return root ? buildSequence(root, files) : null
  }

  /** Sequences rooted at `roots` that have at least one child, in the order given */
  sequencesWithChildren(roots: TFile[]): NoteSequence[] {
    return roots
      .map((root) => this.getSequenceForFile(root))
      .filter((s): s is NoteSequence => !!s && s.root.children.length > 0)
  }

  /** Root zettels among `files`, most recent first */
  roots(files: TFile[]): TFile[] {
    return findRoots(files)
  }

  parent(file: TFile): TFile | null {
    const id = idOf(file)
    const parentId = id && parentZettelId(id)
    if (!parentId) return null
    return this.scope(file).find((f) => idOf(f) === parentId) ?? null
  }

  /** Direct children in ID order */
  children(file: TFile): TFile[] {
    return findChildren(file, this.scope(file))
  }

  /** `file` and its siblings in ID order; roots are siblings of the other roots in scope */
  siblings(file: TFile): TFile[] {
    const id = idOf(file)
    if (!id) return []
    const parentId = parentZettelId(id)
    return this.scope(file)
      .filter((f) => {
        const fid = idOf(f)
        return fid !== null && parentZettelId(fid) === parentId
      })
      .sort(compareZettelFiles)
  }

  /** The sibling `step` places away, or null past either end */
  adjacent(file: TFile, step: 1 | -1): TFile | null {
    const siblings = this.siblings(file)
    const i = siblings.findIndex((f) => f.path === file.path)
    return (i >= 0 && siblings[i + step]) || null
  }

  /** The root of the sequence `step` places away from `file`'s sequence, or null past either end */
  adjacentSequence(file: TFile, step: 1 | -1): TFile | null {
    const root = findRootFile(file, this.scope(file))
    return root && this.adjacent(root, step)
  }

  /** The first root in `file`'s scope */
  firstSequence(file: TFile): TFile | null {
    const root = findRootFile(file, this.scope(file))
    return (root && this.siblings(root)[0]) ?? null
  }
}

import type { TFile } from 'obsidian'
import { compareZettelFiles, isChildOf, parentZettelId, parseZettelId } from './zettelIdOrder'

/** A zettel in a sequence tree; the root is level 0 */
export interface SequenceNode {
  file: TFile
  zettelId: string
  level: number
  children: SequenceNode[]
}

/** A root zettel and its descendants; `allNodes` is the root, then the rest depth-first */
export interface NoteSequence {
  root: SequenceNode
  allNodes: SequenceNode[]
}

const idOf = (file: TFile): string | null => parseZettelId(file.basename)?.id ?? null

/** The root of `file`'s sequence: `file` itself for a root, else the file whose ID is its timestamp */
export function findRootFile(file: TFile, files: TFile[]): TFile | null {
  const id = idOf(file)
  if (!id) return null
  const rootId = parseZettelId(id)!.timestamp
  return rootId === id ? file : (files.find((f) => idOf(f) === rootId) ?? null)
}

/** Direct children of `parent` in ID order */
export function findChildren(parent: TFile, files: TFile[]): TFile[] {
  const parentId = idOf(parent)
  if (!parentId) return []
  return files
    .filter((file) => {
      const id = idOf(file)
      return !!id && isChildOf(id, parentId)
    })
    .sort(compareZettelFiles)
}

/** Root zettels among `files`, most recent first */
export function findRoots(files: TFile[]): TFile[] {
  return files
    .filter((file) => {
      const id = idOf(file)
      return !!id && !parentZettelId(id)
    })
    .sort((a, b) => compareZettelFiles(b, a))
}

/** The tree under `root`, children in ID order; parses every file once */
export function buildSequence(root: TFile, files: TFile[]): NoteSequence {
  const rootId = idOf(root)
  if (!rootId) throw new Error('Root file is not a valid zettel note')

  const byParent = new Map<string, TFile[]>()
  for (const file of files) {
    const id = idOf(file)
    const parentId = id && parentZettelId(id)
    if (parentId) byParent.set(parentId, [...(byParent.get(parentId) ?? []), file])
  }

  const allNodes: SequenceNode[] = []
  const build = (file: TFile, zettelId: string, level: number): SequenceNode => {
    const node: SequenceNode = { file, zettelId, level, children: [] }
    allNodes.push(node)
    for (const child of (byParent.get(zettelId) ?? []).sort(compareZettelFiles)) {
      node.children.push(build(child, idOf(child)!, level + 1))
    }
    return node
  }
  return { root: build(root, rootId, 0), allNodes }
}

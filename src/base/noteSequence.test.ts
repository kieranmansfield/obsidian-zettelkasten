import { describe, expect, it, vi } from 'vitest'
import type { App, TFile } from 'obsidian'
import { buildSequence, findChildren, findRootFile } from './noteSequence'
import NoteSequenceService from '../service/noteSequence.service'

// obsidian has no runtime code outside the app
vi.mock('obsidian', () => ({}))

const T = '20241021130500123'
const U = '20241022130500123'
const f = (basename: string, folder = 'slipbox') =>
  ({
    basename,
    path: `${folder}/${basename}.md`,
    extension: 'md',
    parent: { path: folder },
    stat: { mtime: 0 },
  }) as unknown as TFile
const service = (files: TFile[]) =>
  new NoteSequenceService({ vault: { getMarkdownFiles: () => files } } as unknown as App)
const names = (fs: Array<TFile | null>) => fs.map((x) => x?.basename.slice(17) ?? null)

describe('noteSequence', () => {
  it('finds direct children and the root', () => {
    const files = [T, `${T}a`, `${T}b`, `${T}a1`, `${T}a2`, `${T}a1a`].map((id) => f(id))
    expect(names(findChildren(files[0], files))).toEqual(['a', 'b'])
    expect(names(findChildren(files[1], files))).toEqual(['a1', 'a2'])
    expect(findRootFile(files[5], files)?.basename).toBe(T)
  })
})

describe('noteSequence natural order', () => {
  const a1to10 = Array.from({ length: 10 }, (_, i) => `a${i + 1}`)
  const files = [T, `${T}a`, `${T}b`, ...a1to10.map((s) => T + s)].map((id) => f(id))

  it('lists children by segment, not string', () => {
    expect(names(findChildren(files[1], files))).toEqual(a1to10)
    expect(findChildren(f(`${T}a1`), files)).toEqual([])
  })

  it('counts every note once', () => {
    const seq = buildSequence(files[0], files)
    expect(seq.allNodes).toHaveLength(13)
    expect(seq.allNodes.map((n) => n.level)).toEqual([0, 1, ...a1to10.map(() => 2), 1])
    expect(names(seq.root.children[0].children.map((n) => n.file))).toEqual(a1to10)
  })
})

describe('NoteSequenceService navigation', () => {
  const files = [T, `${T}a`, `${T}a9`, `${T}a10`, `${T}b`, U, `${U}a`].map((id) => f(id))
  const [root, a, a9, a10, b, u, ua] = files
  const s = service([...files, f(`${T}c`, 'inbox')])

  it('finds parent and children', () => {
    expect(s.parent(a10)).toBe(a)
    expect(s.parent(root)).toBeNull()
    expect(names(s.children(a))).toEqual(['a9', 'a10'])
  })

  it('steps through siblings in ID order, not string order', () => {
    expect(s.adjacent(a9, 1)).toBe(a10)
    expect(s.adjacent(a10, -1)).toBe(a9)
    expect(s.adjacent(a10, 1)).toBeNull()
    expect(s.adjacent(a, 1)).toBe(b)
  })

  it('treats roots in the same folder as siblings', () => {
    expect(s.adjacent(root, 1)).toBe(u)
    expect(s.adjacentSequence(a9, 1)).toBe(u)
    expect(s.adjacentSequence(ua, -1)).toBe(root)
    expect(s.adjacentSequence(ua, 1)).toBeNull()
    expect(s.firstSequence(ua)).toBe(root)
  })

  it('only returns sequences that have children', () => {
    expect(s.sequencesWithChildren([root, u]).map((q) => q.root.file)).toEqual([root, u])
    const lone = f('20241023130500123')
    expect(service([lone]).sequencesWithChildren([lone])).toEqual([])
  })
})

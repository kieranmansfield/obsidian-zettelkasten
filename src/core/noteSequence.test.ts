import { describe, expect, it } from 'vitest'
import type { TFile, Vault } from 'obsidian'
import NoteSequenceCore from './noteSequence.class'

const T = '20241021130500123'
const f = (basename: string) =>
  ({
    basename,
    path: `slip-box/${basename}.md`,
    extension: 'md',
    stat: { mtime: 0 },
  }) as unknown as TFile
const core = new NoteSequenceCore({} as Vault)

describe('NoteSequenceCore', () => {
  it('extracts the ID from a filename with a title', () => {
    expect(core.extractZettelId(`${T}a1 Writing is thinking`)).toBe(`${T}a1`)
    expect(core.extractZettelId(`${T}`)).toBe(T)
    expect(core.extractZettelId('Index')).toBeNull()
    expect(core.extractZettelId('202410211305 too short')).toBeNull()
  })

  it('computes level and parent', () => {
    expect(core.calculateLevel(T)).toBe(0)
    expect(core.calculateLevel(`${T}a`)).toBe(1)
    expect(core.calculateLevel(`${T}a10`)).toBe(2)
    expect(core.getParentId(`${T}a10`)).toBe(`${T}a`)
    expect(core.getParentId(`${T}a`)).toBe(T)
    expect(core.getParentId(T)).toBeNull()
  })

  it('finds direct children and the root', () => {
    const files = [T, `${T}a`, `${T}b`, `${T}a1`, `${T}a2`, `${T}a1a`].map(f)
    const names = (fs: TFile[]) => fs.map((x) => x.basename)
    expect(names(core.findChildren(files[0], files))).toEqual([`${T}a`, `${T}b`])
    expect(names(core.findChildren(files[1], files))).toEqual([`${T}a1`, `${T}a2`])
    expect(core.findRootFile(files[5], files)?.basename).toBe(T)
  })
})

import { describe, expect, it, vi } from 'vitest'
import type { TFile, Vault } from 'obsidian'
import NoteSequenceCore from '../core/noteSequence.class'
import ZettelId from '../core/zettelId.class'
import { firstFreeId, nextChildId } from './sequenceEdit'

vi.mock('obsidian', () => ({ Notice: class {} }))

const T = '20241021130500123'
const f = (basename: string) => ({ basename, path: `slipbox/${basename}.md` }) as unknown as TFile
const core = new NoteSequenceCore({} as Vault)
const next = (parent: string, ids: string[]) =>
  nextChildId(core, f(parent), ZettelId.parse(parent), [parent, ...ids].map(f))?.toString()

describe('nextChildId', () => {
  it('starts a first child', () => {
    expect(next(T, [])).toBe(`${T}a`)
    expect(next(`${T}a`, [])).toBe(`${T}a1`)
  })

  it('continues after existing children', () => {
    expect(next(T, [`${T}a`, `${T}b`])).toBe(`${T}c`)
    expect(next(`${T}a`, [`${T}a1`, `${T}a1a`])).toBe(`${T}a2`)
  })

  it('does not refill gaps', () => {
    expect(next(`${T}a`, [`${T}a1`, `${T}a3`])).toBe(`${T}a4`)
  })

  it('never returns a taken ID', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `${T}a${i + 1}`)
    expect(next(`${T}a`, ten)).toBe(`${T}a11`)
    const letters = [...'abcdefghijklmnopqrstuvwxyz'].map((c) => `${T}${c}`)
    expect(next(T, letters)).toBe(`${T}aa`)
  })
})

describe('firstFreeId', () => {
  it('steps past IDs in use', () => {
    const files = [`${T}b`, `${T}c`].map(f)
    expect(firstFreeId(core, ZettelId.parse(`${T}b`), files)?.toString()).toBe(`${T}d`)
    expect(firstFreeId(core, ZettelId.parse(`${T}e`), files)?.toString()).toBe(`${T}e`)
    expect(firstFreeId(core, null, files)).toBeNull()
  })
})

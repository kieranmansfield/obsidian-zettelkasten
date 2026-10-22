import { describe, expect, it } from 'vitest'
import {
  compareZettelFiles,
  compareZettelIds,
  generateTimeStampId,
  isChildOf,
  isDescendantOf,
  nextFreeChildId,
  ordinalToSegment,
  parentZettelId,
  parseZettelId,
  planMoveUnder,
  planSubtreeMove,
  segmentOrdinal,
} from './zettelIdOrder'

const T = '20241021130500123'
const ids = (...tails: string[]) => tails.map((t) => T + t)

describe('parseZettelId', () => {
  it('reads prefix, ID and segments', () => {
    expect(parseZettelId(`${T}a10b Title`)).toEqual({
      id: `${T}a10b`,
      timestamp: T,
      segments: ['a', '10', 'b'],
    })
    expect(parseZettelId(`zk${T}`)?.id).toBe(T)
    expect(parseZettelId('Index')).toBeNull()
  })

  it('reads a fresh timestamp as a root ID', () => {
    const id = generateTimeStampId()
    expect(id).toMatch(/^\d{17}$/)
    expect(parseZettelId(id)).toEqual({ id, timestamp: id, segments: [] })
  })
})

describe('segment ordinals', () => {
  it('round-trips letters in bijective base 26 and numbers by value', () => {
    expect(segmentOrdinal('a')).toBe(1)
    expect(segmentOrdinal('z')).toBe(26)
    expect(segmentOrdinal('aa')).toBe(27)
    expect(segmentOrdinal('10')).toBe(10)
    for (const n of [1, 26, 27, 52, 53, 702, 703]) {
      expect(segmentOrdinal(ordinalToSegment(n, 'letter'))).toBe(n)
    }
    expect(ordinalToSegment(28, 'letter')).toBe('ab')
    expect(ordinalToSegment(28, 'number')).toBe('28')
  })
})

describe('compareZettelIds', () => {
  it('orders naturally', () => {
    expect(compareZettelIds(`${T}a2`, `${T}a10`)).toBeLessThan(0)
    expect(compareZettelIds(`${T}z`, `${T}aa`)).toBeLessThan(0)
    expect(compareZettelIds(`${T}b`, `${T}aa`)).toBeLessThan(0)
    expect(compareZettelIds(`${T}a`, `${T}a1`)).toBeLessThan(0)
    expect(compareZettelIds(`${T}a`, `${T}a`)).toBe(0)
    expect(compareZettelIds('20241021130500122z', T)).toBeLessThan(0)
  })

  it('sorts files by ID, non-zettels last', () => {
    const files = [`${T}a10 x`, 'Index', `${T}a9 y`, `${T}a`].map((basename) => ({ basename }))
    expect(files.sort(compareZettelFiles).map((f) => f.basename)).toEqual([
      `${T}a`,
      `${T}a9 y`,
      `${T}a10 x`,
      'Index',
    ])
  })
})

describe('hierarchy', () => {
  it('uses segments, not string prefixes', () => {
    expect(isChildOf(`${T}a10`, `${T}a1`)).toBe(false)
    expect(isChildOf(`${T}a10`, `${T}a`)).toBe(true)
    expect(isChildOf(`${T}aa`, T)).toBe(true)
    expect(isChildOf(`${T}a1a`, `${T}a`)).toBe(false)
    expect(isDescendantOf(`${T}a1a`, `${T}a`)).toBe(true)
    expect(isDescendantOf(`${T}a`, `${T}a`)).toBe(false)
    expect(parentZettelId(`${T}a10`)).toBe(`${T}a`)
    expect(parentZettelId(T)).toBeNull()
  })
})

describe('nextFreeChildId', () => {
  it('appends after the highest child', () => {
    const a1to10 = Array.from({ length: 10 }, (_, i) => `${T}a${i + 1}`)
    expect(nextFreeChildId(`${T}a`, a1to10)).toBe(`${T}a11`)
    expect(nextFreeChildId(T, ids('a', 'b'))).toBe(`${T}c`)
    expect(
      nextFreeChildId(
        T,
        [...'abcdefghijklmnopqrstuvwxyz'].map((c) => T + c)
      )
    ).toBe(`${T}aa`)
    expect(nextFreeChildId(`${T}a`, [])).toBe(`${T}a1`)
    expect(nextFreeChildId(`${T}a`, ids('a1', 'a3'))).toBe(`${T}a4`)
    expect(nextFreeChildId(`${T}a`, ids('a1', 'a1a'))).toBe(`${T}a2`)
  })
})

describe('planSubtreeMove', () => {
  const vault = (...tails: string[]) => ids(...tails).map((id) => ({ path: `${id}.md`, id }))
  const a1to10 = Array.from({ length: 10 }, (_, i) => `a${i + 1}`)
  const pairs = (plan: ReturnType<typeof planSubtreeMove>) =>
    plan.renames.map((r) => `${r.oldId.slice(17)}>${r.newId.slice(17)}`)

  it('indents a subtree, switching segment kinds at the new depth', () => {
    const zettels = vault('a', ...a1to10, 'b', 'b1', 'b1a')
    const plan = planSubtreeMove(zettels, `${T}b`, nextFreeChildId(`${T}a`, ids(...a1to10)))
    expect(pairs(plan)).toEqual(['b>a11', 'b1>a11a', 'b1a>a11a1'])
    expect(plan.conflicts).toEqual([])
  })

  it('outdents a subtree to the end of the parent level', () => {
    const zettels = vault('a', ...a1to10, 'a1a', 'a1a1')
    const plan = planSubtreeMove(zettels, `${T}a1a`, nextFreeChildId(`${T}a`, ids(...a1to10)))
    expect(pairs(plan)).toEqual(['a1a>a11', 'a1a1>a11a'])
  })

  it('reports target IDs used outside the subtree', () => {
    const plan = planSubtreeMove(vault('b', 'b1', 'a11a'), `${T}b`, `${T}a11`)
    expect(plan.conflicts).toEqual([`${T}a11a`])
  })
})

describe('planMoveUnder', () => {
  const vault = (...tails: string[]) => ids(...tails).map((id) => ({ path: `${id}.md`, id }))

  it('rejects moving a zettel under its own subtree', () => {
    expect(planMoveUnder(vault('a', 'a1'), `${T}a`, `${T}a1`)).toHaveProperty('error')
    expect(planMoveUnder(vault('a'), `${T}a`, `${T}a`)).toHaveProperty('error')
  })

  it('appends the subtree as the last child of the new parent', () => {
    const plan = planMoveUnder(vault('a', 'a1', 'b', 'b1'), `${T}b`, `${T}a`)
    expect(plan).toMatchObject({
      renames: [
        { oldId: `${T}b`, newId: `${T}a2` },
        { oldId: `${T}b1`, newId: `${T}a2a` },
      ],
      conflicts: [],
    })
  })
})

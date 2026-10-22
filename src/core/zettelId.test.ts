import { describe, expect, it } from 'vitest'
import ZettelId from './zettelId.class'
import { generateTimeStampId } from '../base/zettelId'

const T = '20241021130500123'

describe('ZettelId', () => {
  it('generates a 17-digit timestamp', () => {
    expect(generateTimeStampId()).toMatch(/^\d{17}$/)
    expect(ZettelId.create().toString()).toMatch(/^\d{17}$/)
  })

  it('round-trips parse and toString', () => {
    for (const id of [T, `${T}a`, `${T}a1`, `${T}a10b2`, `${T}aa3`]) {
      expect(ZettelId.parse(id).toString()).toBe(id)
    }
    expect(ZettelId.parse(`${T}a10b2`).segments).toEqual(['a', '10', 'b', '2'])
  })

  it('alternates letters and numbers for children', () => {
    expect(ZettelId.parse(T).nextChild().toString()).toBe(`${T}a`)
    expect(ZettelId.parse(`${T}a`).nextChild().toString()).toBe(`${T}a1`)
    expect(ZettelId.parse(`${T}a1`).nextChild().toString()).toBe(`${T}a1a`)
  })

  it('increments siblings', () => {
    expect(ZettelId.parse(T).nextSibling()).toBeNull()
    expect(ZettelId.parse(`${T}a9`).nextSibling()?.toString()).toBe(`${T}a10`)
    expect(ZettelId.parse(`${T}z`).nextSibling()?.toString()).toBe(`${T}aa`)
    expect(ZettelId.parse(`${T}az`).nextSibling()?.toString()).toBe(`${T}ba`)
  })

  it('finds the parent', () => {
    expect(ZettelId.parse(`${T}a10`).parent()?.toString()).toBe(`${T}a`)
    expect(ZettelId.parse(T).parent()).toBeNull()
  })

  it('rejects non-alphanumeric segments', () => {
    expect(() => ZettelId.parse(`${T}a-1`)).toThrow()
  })
})

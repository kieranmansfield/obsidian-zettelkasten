/**
 * Immutable ZettelId based on segment patterns: letters/numbers alternating.
 * Examples: a1, a1b2, zk20250101010101
 */

export type SegmentType = 'letters' | 'numbers'
export interface Segment {
  type: SegmentType
  value: string
}

export class ZettelId {
  private readonly segments: readonly Segment[]

  constructor(raw: string | readonly Segment[]) {
    if (typeof raw === 'string') {
      this.segments = Object.freeze(ZettelId.parse(raw))
    } else {
      ZettelId.validateSegments(raw)
      this.segments = Object.freeze(raw.map((s) => ({ ...s })))
    }
  }

  static parse(raw: string): Segment[] {
    if (!raw) throw new Error('ZettelId.parse: empty input')

    const segments: Segment[] = []
    let i = 0
    let expectLetters = true

    while (i < raw.length) {
      const start = i
      if (expectLetters) {
        while (i < raw.length && /[a-z]/i.test(raw[i])) i++
        if (i === start) throw new Error(`Expected letters at pos ${i}`)
        segments.push({ type: 'letters', value: raw.slice(start, i) })
      } else {
        while (i < raw.length && /[0-9]/.test(raw[i])) i++
        if (i === start) throw new Error(`Expected numbers at pos ${i}`)
        segments.push({ type: 'numbers', value: raw.slice(start, i) })
      }
      expectLetters = !expectLetters
    }
    return segments
  }

  private static validateSegments(segs: readonly Segment[]) {
    if (!segs.length) throw new Error('segments must not be empty')
    let expectLetters = true
    for (const s of segs) {
      if (expectLetters && (s.type !== 'letters' || !/^[a-z]+$/i.test(s.value))) {
        throw new Error(`Invalid letters segment: ${JSON.stringify(s)}`)
      }
      if (!expectLetters && (s.type !== 'numbers' || !/^[0-9]+$/.test(s.value))) {
        throw new Error(`Invalid numbers segment: ${JSON.stringify(s)}`)
      }
      expectLetters = !expectLetters
    }
  }

  toString(): string {
    return this.segments.map((s) => s.value).join('')
  }

  getSegments(): readonly Segment[] {
    return this.segments
  }

  depth(): number {
    return this.segments.length
  }

  getParent(): ZettelId | null {
    if (this.segments.length <= 1) return null
    return new ZettelId(this.segments.slice(0, -1))
  }

  getNextChild(): ZettelId {
    const segs = this.segments.map((s) => ({ ...s }))
    const last = segs[segs.length - 1]
    if (last.type === 'letters') segs.push({ type: 'numbers', value: '1' })
    else segs.push({ type: 'letters', value: 'a' })
    return new ZettelId(segs)
  }

  static isValid(raw: string): boolean {
    try {
      ZettelId.parse(raw)
      return true
    } catch {
      return false
    }
  }
}

export default ZettelId

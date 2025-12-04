// import type { Segment } from '../base/zettelId'
import { Segment, deepSplitSegment, buildZettelId, generateTimeStampId } from '../base/zettelId'

export default class ZettelId {
  timestamp: string
  segments: Segment[]

  constructor(timestamp: string, segments: Segment[]) {
    this.timestamp = timestamp
    this.segments = segments
  }

  static create(segments: Segment[] = []): ZettelId {
    const ts = generateTimeStampId()
    return new ZettelId(ts, segments)
  }

  private static validateSegment(seg: string): void {
    if (!/^[a-zA-Z0-9]+$/.test(seg)) {
      throw new Error(`Invalid Segment "${seg}" myst be alphanumeric`)
    }
  }

  static parse(fullId: string): ZettelId {
    const ts = fullId.slice(0, 17)
    const tail = fullId.slice(17)
    const segments = deepSplitSegment(tail)
    segments.forEach((seg) => ZettelId.validateSegment(seg))
    return new ZettelId(ts, segments)
  }

  toString(): string {
    return buildZettelId(this.timestamp, this.segments)
  }

  parent(): ZettelId | null {
    if (this.segments.length === 0) return null
    const parentSegments = this.segments.slice(0, -1)
    return new ZettelId(this.timestamp, parentSegments)
  }

  compare(other: ZettelId): number {
    if (this.timestamp !== other.timestamp) {
      return this.timestamp < other.timestamp ? -1 : 1
    }
    const a = this.segments.join('')
    const b = other.segments.join('')
    if (a === b) return 0
    return a < b ? -1 : 1
  }

  addSegment(segment: string): ZettelId {
    return new ZettelId(this.timestamp, [...this.segments, segment])
  }

  nextChild(): ZettelId {
    const depth = this.segments.length
    const newSeg = this.nextSegmentforDepth(depth)
    return this.addSegment(newSeg)
  }

  nextSibling(): ZettelId | null {
    if (this.segments.length === 0) return null

    const newSegments = [...this.segments]
    newSegments[newSegments.length - 1] = this.incrementSegment(newSegments[newSegments.length - 1])

    return new ZettelId(this.timestamp, newSegments)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isZettelIdString(value: any): value is string {
    return typeof value === 'string' && value.length >= 17
  }

  nextSegmentforDepth(depth: number): string {
    const isLetter = depth % 2 === 0
    return isLetter ? 'a' : '1'
  }

  incrementSegment(seg: string): string {
    if (/^[0-9]+$/.test(seg)) {
      return String(Number(seg) + 1)
    } else {
      const letters = seg.split('')
      let i = letters.length - 1

      while (i >= 0) {
        if (letters[i] === 'z') {
          letters[i] = 'a'
          i--
        } else {
          letters[i] = String.fromCharCode(letters[i].charCodeAt(0) + 1)
          return letters.join('')
        }
      }

      return 'a' + letters.join('')
    }
  }
}

// Segments
export type NumberSegment = `${number}`
export type LetterSegment = `${string}`
export type Segment = NumberSegment | LetterSegment
export type SegmentType = 'number' | 'letter'

// Zettel ID
// export type ZettelId = Segment[]
export type ZettelId = {
  timestamp: string
  segments: Segment[]
}

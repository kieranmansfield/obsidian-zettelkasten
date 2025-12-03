import type { Segment } from './types'

export function deepSplitSegment(seg: string): Segment[] {
  if (!seg) return []

  const result: Segment[] = []
  let buffer = seg[0]
  let mode = /[0-9]/.test(buffer) ? 'number' : 'letter'

  for (let i = 1; i < seg.length; i++) {
    const isNum = /[0-9]/.test(seg[i])
    const nextMode = isNum ? 'number' : 'letter'

    if (nextMode === mode) {
      buffer += seg[i]
    } else {
      result.push(buffer)
      buffer = seg[i]
      mode = nextMode
    }
  }
  result.push(buffer)
  return result
}

export function buildZettelId(prefix: string, segments: Segment[]): string {
  return prefix + segments.join('')
}

export function generateTimeStampId(): string {
  const d = new Date()

  const YYYY = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')

  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  const SSS = String(d.getMilliseconds()).padStart(3, '0')

  return `${YYYY}${MM}${DD}${HH}${mm}${ss}${SSS}`
}

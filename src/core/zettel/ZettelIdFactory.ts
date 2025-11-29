import { ZettelId } from './ZettelId'

/**
 * Factory for generating unique ZettelIds.
 */
export class ZettelIdFactory {
  /**
   * Generates a unique ZettelId using timestamp (ISO, digits only).
   */
  static create(): ZettelId {
    const ts = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 17)
    return new ZettelId(ts)
  }
}

/**
 * Pure, append-only log for Zettel events.
 */
export class ZettelLogManager {
  private readonly logs: { timestamp: string; message: string }[] = []

  log(message: string): void {
    const ts = new Date().toISOString()
    this.logs.push({ timestamp: ts, message })
  }

  getLogs(): { timestamp: string; message: string }[] {
    return [...this.logs]
  }

  clear(): void {
    this.logs.length = 0
  }
}

export class IDGenerator {
  static generate(prefix: string = 'Z'): string {
    const rand = Math.random().toString(36).substring(2, 10)
    const timestamp = Date.now().toString(36)
    return `${prefix}-${timestamp}-${rand}`
  }
}

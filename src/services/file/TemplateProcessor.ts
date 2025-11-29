export class TemplateProcessor {
  static process(template: string, ctx: { title: string }) {
    const now = new Date()

    return template
      .replace(/{{title}}/g, ctx.title)
      .replace(/{{date}}/g, now.toISOString().split('T')[0])
      .replace(/{{time}}/g, now.toTimeString().split(' ')[0])
      .replace(/{{datetime}}/g, now.toISOString().replace('T', ' ').split('.')[0])
  }
}

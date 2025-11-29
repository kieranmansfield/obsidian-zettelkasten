import type { Plugin } from 'obsidian'

function loadAndRegister(modulePath: string, plugin: Plugin) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(modulePath)
    const cmd = mod?.default || Object.values(mod)[0]
    if (cmd && typeof cmd.register === 'function') {
      cmd.register(plugin)
    }
  } catch (err) {
    console.error(`Failed to load ${modulePath}`, err)
  }
}

export function registerAllCommands(plugin: Plugin) {
  const modules = [
    './CreateZettelCommand',
    './NavigateCommand',
    './InspectCommand',
    // other commands
  ]
  modules.forEach((m) => loadAndRegister(m, plugin))
}

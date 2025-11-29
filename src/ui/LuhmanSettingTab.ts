import { App, PluginSettingTab, Setting } from 'obsidian'

// Setting tab for NewZettel
export class LuhmanSettingTab extends PluginSettingTab {
  plugin: NewZettel

  constructor(app: App, plugin: NewZettel) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: 'New Zettel Settings' })

    new Setting(containerEl)
      .setName('Match Rule')
      .setDesc('How to match zettel IDs in filenames')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('strict', 'Strict')
          .addOption('separator', 'Separator')
          .addOption('fuzzy', 'Fuzzy')
          .setValue(this.plugin.settings.matchRule)
          .onChange(async (value) => {
            this.plugin.settings.matchRule = value as 'strict' | 'separator' | 'fuzzy'
            await this.plugin.saveSettings()
          })
      )

    new Setting(containerEl)
      .setName('Separator')
      .setDesc('Separator between ID and title')
      .addText((text) =>
        text.setValue(this.plugin.settings.separator).onChange(async (value) => {
          this.plugin.settings.separator = value
          await this.plugin.saveSettings()
        })
      )

    new Setting(containerEl)
      .setName('Add Title')
      .setDesc('Include title in filename')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.addTitle).onChange(async (value) => {
          this.plugin.settings.addTitle = value
          await this.plugin.saveSettings()
        })
      )

    new Setting(containerEl)
      .setName('Add Alias')
      .setDesc('Add title as frontmatter alias')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.addAlias).onChange(async (value) => {
          this.plugin.settings.addAlias = value
          await this.plugin.saveSettings()
        })
      )

    new Setting(containerEl)
      .setName('Template File')
      .setDesc('Path to template file')
      .addText((text) =>
        text.setValue(this.plugin.settings.templateFile).onChange(async (value) => {
          this.plugin.settings.templateFile = value
          await this.plugin.saveSettings()
        })
      )
  }
}

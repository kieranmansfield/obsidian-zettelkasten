import { Plugin } from "obsidian";
import { CommandManager } from "./src/commands/CommandManager";
import {
	ZettelkastenPluginSettings,
	DEFAULT_SETTINGS,
} from "./src/settings/PluginSettings";
import { ZettelkastenSettingTab } from "./src/settings/SettingsTab";

export default class ZettelkastenPlugin extends Plugin {
	settings: ZettelkastenPluginSettings;
	private commandManager: CommandManager;

	async onload() {
		await this.loadSettings();

		// Initialize and register commands
		this.commandManager = new CommandManager(this);
		this.commandManager.registerCommands();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ZettelkastenSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);

		// Ensure zettelIdSeparator has a value (fallback to default if empty)
		if (!this.settings.zettelIdSeparator) {
			this.settings.zettelIdSeparator = DEFAULT_SETTINGS.zettelIdSeparator;
		}

		console.log("Loaded settings:", JSON.stringify(this.settings, null, 2));
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Saved settings:", JSON.stringify(this.settings, null, 2));
	}
}

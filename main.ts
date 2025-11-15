import { Plugin } from "obsidian";
import { CommandManager } from "./src/commands/CommandManager";
import {
	ZettelkastenPluginSettings,
	DEFAULT_SETTINGS,
} from "./src/settings/PluginSettings";
import { ZettelkastenSettingTab } from "./src/settings/SettingsTab";

export default class ZettelkastenPlugin extends Plugin {
	settings: ZettelkastenPluginSettings;
	commandManager: CommandManager;

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
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Migration: Add enableIndividualCommands to existing boxes
		if (this.settings.boxes && this.settings.boxes.length > 0) {
			this.settings.boxes.forEach((box) => {
				if (!box.enableIndividualCommands) {
					box.enableIndividualCommands = {
						quickZettel: true, // Enabled by default
						openZettel: false,
						openParent: false,
						openChild: false,
						openSibling: false,
						navigator: false,
						reorderSequence: false,
						nextSequence: false,
						previousSequence: false,
						nextChild: false,
						previousChild: false,
						goUpLevel: false,
						goDownLevel: false,
						assignParent: false,
						assignChild: false,
						createNote: false,
						createChild: false,
						createSibling: false,
						indent: false,
						outdent: false,
						openFleeting: false,
						createFleeting: false,
						openMoc: false,
						createMoc: false,
						openIndex: false,
						createIndex: false,
					};
				} else if (
					box.enableIndividualCommands.quickZettel === undefined
				) {
					// Add quickZettel to existing enableIndividualCommands
					box.enableIndividualCommands.quickZettel = true;
				}
			});
			// Save migrated settings
			await this.saveSettings();
		}

		console.log("Loaded settings:", JSON.stringify(this.settings, null, 2));
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Saved settings:", JSON.stringify(this.settings, null, 2));
	}
}

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

		// Migration: Add enableIndividualCommands and useSeparatorFormat to existing boxes
		if (this.settings.boxes && this.settings.boxes.length > 0) {
			let needsSave = false;
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
					needsSave = true;
				} else if (
					box.enableIndividualCommands.quickZettel === undefined
				) {
					// Add quickZettel to existing enableIndividualCommands
					box.enableIndividualCommands.quickZettel = true;
					needsSave = true;
				}

				// Add useSeparatorFormat if missing
				if (box.useSeparatorFormat === undefined) {
					box.useSeparatorFormat = false;
					needsSave = true;
				}

				// Ensure zettelIdSeparator has a default value if empty/missing
				if (!box.zettelIdSeparator) {
					box.zettelIdSeparator = "⁝ ";
					needsSave = true;
				}

				// Add prefix settings to existing boxes if missing
				if (box.useZettelPrefix === undefined) {
					box.useZettelPrefix = false;
					needsSave = true;
				}
				if (!box.zettelPrefix) {
					box.zettelPrefix = "";
					needsSave = true;
				}
				if (box.useFleetingNotesPrefix === undefined) {
					box.useFleetingNotesPrefix = false;
					needsSave = true;
				}
				if (!box.fleetingNotesPrefix) {
					box.fleetingNotesPrefix = "";
					needsSave = true;
				}
				if (box.useMocsPrefix === undefined) {
					box.useMocsPrefix = false;
					needsSave = true;
				}
				if (!box.mocsPrefix) {
					box.mocsPrefix = "";
					needsSave = true;
				}
				if (box.useIndexesPrefix === undefined) {
					box.useIndexesPrefix = false;
					needsSave = true;
				}
				if (!box.indexesPrefix) {
					box.indexesPrefix = "";
					needsSave = true;
				}
			});

			// Save migrated settings
			if (needsSave) {
				await this.saveSettings();
			}
		}

		// Ensure global zettelIdSeparator has a value (fallback to default if empty)
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

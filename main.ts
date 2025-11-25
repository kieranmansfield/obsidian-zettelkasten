import { Plugin } from "obsidian";
import { ZettelkastenPluginSettings, DEFAULT_SETTINGS } from "./src/settings/PluginSettings";
import { ZettelkastenSettingTab } from "./src/settings/SettingsTab";
import { CommandManager } from "./src/commands/CommandManager";

export default class ZettelkastenPlugin extends Plugin {
	settings: ZettelkastenPluginSettings;
	commandManager: CommandManager;

	async onload() {
		await this.loadSettings();

		// Initialize command manager
		this.commandManager = new CommandManager(this);

		// Register all commands
		this.commandManager.registerCommands();

		// Add settings tab
		this.addSettingTab(new ZettelkastenSettingTab(this.app, this));
	}

	async loadSettings() {
		const loadedData = (await this.loadData()) as any;

		// Start with default settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS);

		// Merge loaded data
		if (loadedData) {
			this.settings = Object.assign(this.settings, loadedData);

			// Migrate old MOCs/Indexes if needed
			if (loadedData.enableMocs !== undefined && loadedData.enableIndexes === undefined) {
				// Old data had separate MOCs and Indexes
				this.settings.enableIndexes = loadedData.enableMocs || loadedData.enableIndexes;
				this.settings.indexMode = loadedData.enableMocs ? "moc" : "zettelkasten";

				// Use MOC settings if enabled, otherwise use index settings
				if (loadedData.enableMocs) {
					this.settings.indexesUseSeparateLocation = loadedData.mocsUseSeparateLocation;
					this.settings.indexesLocation = loadedData.mocsLocation || "";
					this.settings.indexesTemplatePath = loadedData.mocsTemplatePath || "";
					this.settings.indexesUseZettelId = loadedData.mocsUseZettelId;
					this.settings.indexesFilenameFormat = loadedData.mocsFilenameFormat || "{{title}} Index";
					this.settings.indexesTag = loadedData.mocsTag || "index";
					this.settings.useIndexesPrefix = loadedData.useMocsPrefix;
					this.settings.indexesPrefix = loadedData.mocsPrefix || "i";
				}

				await this.saveSettings();
			}

			// Migrate enableSequenceReorder to enableNoteSequence
			if (loadedData.enableSequenceReorder !== undefined && loadedData.enableNoteSequence === undefined) {
				this.settings.enableNoteSequence = loadedData.enableSequenceReorder;
				await this.saveSettings();
			}
		}

		console.log("Loaded settings:", JSON.stringify(this.settings, null, 2));
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Saved settings:", JSON.stringify(this.settings, null, 2));
	}
}

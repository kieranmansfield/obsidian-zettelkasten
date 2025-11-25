import { Plugin } from "obsidian";
import { CommandManager } from "./src/commands/CommandManager";
import {
	ZettelkastenPluginSettings,
	DEFAULT_SETTINGS,
	DEFAULT_BOX,
	Box,
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
		const loadedData = (await this.loadData()) as any;
		let needsSave = false;

		// Start with default settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS);

		// Migrate general settings
		if (loadedData) {
			if (loadedData.ignoredFolders) {
				this.settings.ignoredFolders = loadedData.ignoredFolders;
			}
			if (loadedData.newNoteLocation !== undefined) {
				this.settings.newNoteLocation = loadedData.newNoteLocation;
			}
		}

		// Migrate boxes or create from old global settings
		if (loadedData?.boxes && loadedData.boxes.length > 0) {
			// Boxes exist - migrate them
			this.settings.boxes = loadedData.boxes.map((box: any) =>
				this.migrateBox(box),
			);
		} else if (loadedData && loadedData.enableBoxes === false) {
			// Old system with boxes disabled - migrate global settings to a default box
			const migratedBox: Box = {
				...DEFAULT_BOX,
				id: "default",
				name: "Default Box",
				folderPath: loadedData.zettelsLocation || "",

				// Migrate zettel settings
				zettelIdFormat: loadedData.zettelIdFormat || DEFAULT_BOX.zettelIdFormat,
				useSeparatorFormat: loadedData.useSeparatorFormat ?? DEFAULT_BOX.useSeparatorFormat,
				zettelIdSeparator: loadedData.zettelIdSeparator || DEFAULT_BOX.zettelIdSeparator,
				zettelIdMatchingMode: loadedData.zettelIdMatchingMode || DEFAULT_BOX.zettelIdMatchingMode,
				noteTemplatePath: loadedData.noteTemplatePath || "",
				zettelTag: loadedData.zettelTag || DEFAULT_BOX.zettelTag,
				enableSequenceReorder: loadedData.enableSequenceReorder ?? DEFAULT_BOX.enableSequenceReorder,
				useZettelPrefix: loadedData.useZettelPrefix ?? DEFAULT_BOX.useZettelPrefix,
				zettelPrefix: loadedData.zettelPrefix || DEFAULT_BOX.zettelPrefix,

				// Migrate fleeting notes settings
				enableFleetingNotes: loadedData.enableFleetingNotes ?? DEFAULT_BOX.enableFleetingNotes,
				fleetingNotesUseSeparateLocation: loadedData.fleetingNotesUseSeparateLocation ?? DEFAULT_BOX.fleetingNotesUseSeparateLocation,
				fleetingNotesLocation: loadedData.fleetingNotesLocation || "",
				fleetingNotesTemplatePath: loadedData.fleetingNotesTemplatePath || "",
				fleetingNotesUseZettelId: loadedData.fleetingNotesUseZettelId ?? DEFAULT_BOX.fleetingNotesUseZettelId,
				fleetingNotesFilenameFormat: loadedData.fleetingNotesFilenameFormat || "",
				fleetingNotesTag: loadedData.fleetingNotesTag || DEFAULT_BOX.fleetingNotesTag,
				useFleetingNotesPrefix: loadedData.useFleetingNotesPrefix ?? DEFAULT_BOX.useFleetingNotesPrefix,
				fleetingNotesPrefix: loadedData.fleetingNotesPrefix || DEFAULT_BOX.fleetingNotesPrefix,

				// Migrate MOCs settings
				enableMocs: loadedData.enableMocs ?? DEFAULT_BOX.enableMocs,
				mocsUseSeparateLocation: loadedData.mocsUseSeparateLocation ?? DEFAULT_BOX.mocsUseSeparateLocation,
				mocsLocation: loadedData.mocsLocation || "",
				mocsTemplatePath: loadedData.mocsTemplatePath || "",
				mocsUseZettelId: loadedData.mocsUseZettelId ?? DEFAULT_BOX.mocsUseZettelId,
				mocsFilenameFormat: loadedData.mocsFilenameFormat || DEFAULT_BOX.mocsFilenameFormat,
				mocsTag: loadedData.mocsTag || DEFAULT_BOX.mocsTag,
				useMocsPrefix: loadedData.useMocsPrefix ?? DEFAULT_BOX.useMocsPrefix,
				mocsPrefix: loadedData.mocsPrefix || DEFAULT_BOX.mocsPrefix,

				// Migrate indexes settings
				enableIndexes: loadedData.enableIndexes ?? DEFAULT_BOX.enableIndexes,
				indexesUseSeparateLocation: loadedData.indexesUseSeparateLocation ?? DEFAULT_BOX.indexesUseSeparateLocation,
				indexesLocation: loadedData.indexesLocation || "",
				indexesTemplatePath: loadedData.indexesTemplatePath || "",
				indexesUseZettelId: loadedData.indexesUseZettelId ?? DEFAULT_BOX.indexesUseZettelId,
				indexesFilenameFormat: loadedData.indexesFilenameFormat || DEFAULT_BOX.indexesFilenameFormat,
				indexesTag: loadedData.indexesTag || DEFAULT_BOX.indexesTag,
				useIndexesPrefix: loadedData.useIndexesPrefix ?? DEFAULT_BOX.useIndexesPrefix,
				indexesPrefix: loadedData.indexesPrefix || DEFAULT_BOX.indexesPrefix,
			};
			this.settings.boxes = [migratedBox];
			needsSave = true;
		} else {
			// No settings file or empty - use defaults (already has default box)
			needsSave = true;
		}

		// Ensure at least one box exists
		if (this.settings.boxes.length === 0) {
			this.settings.boxes = [{ ...DEFAULT_BOX }];
			needsSave = true;
		}

		// Save if we migrated or added defaults
		if (needsSave) {
			await this.saveSettings();
		}

		console.log("Loaded settings:", JSON.stringify(this.settings, null, 2));
	}

	/**
	 * Migrates a box from old format to current format
	 */
	private migrateBox(box: any): Box {
		const migratedBox: Box = Object.assign({}, DEFAULT_BOX, box);

		// Ensure all required fields have defaults
		if (!migratedBox.enableIndividualCommands) {
			migratedBox.enableIndividualCommands = DEFAULT_BOX.enableIndividualCommands;
		}
		if (migratedBox.useSeparatorFormat === undefined) {
			migratedBox.useSeparatorFormat = false;
		}
		if (!migratedBox.zettelIdSeparator) {
			migratedBox.zettelIdSeparator = "⁝ ";
		}

		return migratedBox;
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Saved settings:", JSON.stringify(this.settings, null, 2));
	}
}

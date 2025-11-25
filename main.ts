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
		if (loadedData.enableBoxes !== undefined) {
			this.settings.enableBoxes = loadedData.enableBoxes;
		}
		// Migrate global settings if they exist
		if (loadedData.zettelsLocation !== undefined) {
			this.settings.zettelsLocation = loadedData.zettelsLocation;
		}
		if (loadedData.zettelIdFormat !== undefined) {
			this.settings.zettelIdFormat = loadedData.zettelIdFormat;
		}
		if (loadedData.useSeparatorFormat !== undefined) {
			this.settings.useSeparatorFormat = loadedData.useSeparatorFormat;
		}
		if (loadedData.zettelIdSeparator !== undefined) {
			this.settings.zettelIdSeparator = loadedData.zettelIdSeparator;
		}
		if (loadedData.zettelIdMatchingMode !== undefined) {
			this.settings.zettelIdMatchingMode = loadedData.zettelIdMatchingMode;
		}
		if (loadedData.noteTemplatePath !== undefined) {
			this.settings.noteTemplatePath = loadedData.noteTemplatePath;
		}
		if (loadedData.zettelTag !== undefined) {
			this.settings.zettelTag = loadedData.zettelTag;
		}
		if (loadedData.enableSequenceReorder !== undefined) {
			this.settings.enableSequenceReorder = loadedData.enableSequenceReorder;
		}
		if (loadedData.useZettelPrefix !== undefined) {
			this.settings.useZettelPrefix = loadedData.useZettelPrefix;
		}
		if (loadedData.zettelPrefix !== undefined) {
			this.settings.zettelPrefix = loadedData.zettelPrefix;
		}
		if (loadedData.enableFleetingNotes !== undefined) {
			this.settings.enableFleetingNotes = loadedData.enableFleetingNotes;
		}
		if (loadedData.fleetingNotesUseSeparateLocation !== undefined) {
			this.settings.fleetingNotesUseSeparateLocation = loadedData.fleetingNotesUseSeparateLocation;
		}
		if (loadedData.fleetingNotesLocation !== undefined) {
			this.settings.fleetingNotesLocation = loadedData.fleetingNotesLocation;
		}
		if (loadedData.fleetingNotesTemplatePath !== undefined) {
			this.settings.fleetingNotesTemplatePath = loadedData.fleetingNotesTemplatePath;
		}
		if (loadedData.fleetingNotesUseZettelId !== undefined) {
			this.settings.fleetingNotesUseZettelId = loadedData.fleetingNotesUseZettelId;
		}
		if (loadedData.fleetingNotesFilenameFormat !== undefined) {
			this.settings.fleetingNotesFilenameFormat = loadedData.fleetingNotesFilenameFormat;
		}
		if (loadedData.fleetingNotesTag !== undefined) {
			this.settings.fleetingNotesTag = loadedData.fleetingNotesTag;
		}
		if (loadedData.useFleetingNotesPrefix !== undefined) {
			this.settings.useFleetingNotesPrefix = loadedData.useFleetingNotesPrefix;
		}
		if (loadedData.fleetingNotesPrefix !== undefined) {
			this.settings.fleetingNotesPrefix = loadedData.fleetingNotesPrefix;
		}
		if (loadedData.enableMocs !== undefined) {
			this.settings.enableMocs = loadedData.enableMocs;
		}
		if (loadedData.mocsUseSeparateLocation !== undefined) {
			this.settings.mocsUseSeparateLocation = loadedData.mocsUseSeparateLocation;
		}
		if (loadedData.mocsLocation !== undefined) {
			this.settings.mocsLocation = loadedData.mocsLocation;
		}
		if (loadedData.mocsTemplatePath !== undefined) {
			this.settings.mocsTemplatePath = loadedData.mocsTemplatePath;
		}
		if (loadedData.mocsUseZettelId !== undefined) {
			this.settings.mocsUseZettelId = loadedData.mocsUseZettelId;
		}
		if (loadedData.mocsFilenameFormat !== undefined) {
			this.settings.mocsFilenameFormat = loadedData.mocsFilenameFormat;
		}
		if (loadedData.mocsTag !== undefined) {
			this.settings.mocsTag = loadedData.mocsTag;
		}
		if (loadedData.useMocsPrefix !== undefined) {
			this.settings.useMocsPrefix = loadedData.useMocsPrefix;
		}
		if (loadedData.mocsPrefix !== undefined) {
			this.settings.mocsPrefix = loadedData.mocsPrefix;
		}
		if (loadedData.enableIndexes !== undefined) {
			this.settings.enableIndexes = loadedData.enableIndexes;
		}
		if (loadedData.indexesUseSeparateLocation !== undefined) {
			this.settings.indexesUseSeparateLocation = loadedData.indexesUseSeparateLocation;
		}
		if (loadedData.indexesLocation !== undefined) {
			this.settings.indexesLocation = loadedData.indexesLocation;
		}
		if (loadedData.indexesTemplatePath !== undefined) {
			this.settings.indexesTemplatePath = loadedData.indexesTemplatePath;
		}
		if (loadedData.indexesUseZettelId !== undefined) {
			this.settings.indexesUseZettelId = loadedData.indexesUseZettelId;
		}
		if (loadedData.indexesFilenameFormat !== undefined) {
			this.settings.indexesFilenameFormat = loadedData.indexesFilenameFormat;
		}
		if (loadedData.indexesTag !== undefined) {
			this.settings.indexesTag = loadedData.indexesTag;
		}
		if (loadedData.useIndexesPrefix !== undefined) {
			this.settings.useIndexesPrefix = loadedData.useIndexesPrefix;
		}
		if (loadedData.indexesPrefix !== undefined) {
			this.settings.indexesPrefix = loadedData.indexesPrefix;
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

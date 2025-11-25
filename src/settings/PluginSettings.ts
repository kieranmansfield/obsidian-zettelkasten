// Zettel ID matching modes
export type ZettelIdMatchingMode = "strict" | "separator" | "fuzzy";

// Box configuration types
export type BoxType = "folder" | "tag";

export interface Box {
	id: string;
	name: string;
	type: BoxType;
	folderPath?: string; // Used when type is "folder"
	tagName?: string; // Used when type is "tag"

	// Box prefix (applies to all notes in this box)
	useBoxPrefix: boolean;
	boxPrefix: string;

	// Zettel settings
	zettelIdFormat: string;
	useSeparatorFormat: boolean;
	zettelIdSeparator: string;
	zettelIdMatchingMode: ZettelIdMatchingMode;
	noteTemplatePath: string;
	zettelTag: string;
	enableSequenceReorder: boolean;
	useZettelPrefix: boolean;
	zettelPrefix: string;

	// Fleeting notes settings
	enableFleetingNotes: boolean;
	fleetingNotesUseSeparateLocation: boolean;
	fleetingNotesLocation: string;
	fleetingNotesTemplatePath: string;
	fleetingNotesUseZettelId: boolean;
	fleetingNotesFilenameFormat: string;
	fleetingNotesTag: string;
	useFleetingNotesPrefix: boolean;
	fleetingNotesPrefix: string;

	// MOCs settings
	enableMocs: boolean;
	mocsUseSeparateLocation: boolean;
	mocsLocation: string;
	mocsTemplatePath: string;
	mocsUseZettelId: boolean;
	mocsFilenameFormat: string;
	mocsTag: string;
	useMocsPrefix: boolean;
	mocsPrefix: string;

	// Indexes settings
	enableIndexes: boolean;
	indexesUseSeparateLocation: boolean;
	indexesLocation: string;
	indexesTemplatePath: string;
	indexesUseZettelId: boolean;
	indexesFilenameFormat: string;
	indexesTag: string;
	useIndexesPrefix: boolean;
	indexesPrefix: string;

	// Individual command settings (opt-in to expose commands to main palette)
	enableIndividualCommands: {
		quickZettel: boolean;
		openZettel: boolean;
		openParent: boolean;
		openChild: boolean;
		openSibling: boolean;
		navigator: boolean;
		reorderSequence: boolean;
		nextSequence: boolean;
		previousSequence: boolean;
		nextChild: boolean;
		previousChild: boolean;
		goUpLevel: boolean;
		goDownLevel: boolean;
		assignParent: boolean;
		assignChild: boolean;
		moveToRoot: boolean;
		createNote: boolean;
		createChild: boolean;
		createSibling: boolean;
		indent: boolean;
		outdent: boolean;
		openFleeting: boolean;
		createFleeting: boolean;
		openMoc: boolean;
		createMoc: boolean;
		openIndex: boolean;
		createIndex: boolean;
		moveToCorrectLocation: boolean;
		batchMoveToCorrectLocation: boolean;
		tagAsCorrectType: boolean;
		batchTagAsCorrectType: boolean;
		fixFilenames: boolean;
		batchFixFilenames: boolean;
		fixMocFilename: boolean;
		batchFixMocFilenames: boolean;
		fixIndexFilename: boolean;
		batchFixIndexFilenames: boolean;
	};
}

// Plugin settings interface
export interface ZettelkastenPluginSettings {
	// General settings (truly global)
	ignoredFolders: string[];
	newNoteLocation: string;

	// Boxes feature toggle
	enableBoxes: boolean;

	// Boxes settings (used when enableBoxes is true)
	boxes: Box[];

	// Global settings (used when enableBoxes is false)
	// Zettel settings
	zettelsLocation: string;
	zettelIdFormat: string;
	useSeparatorFormat: boolean;
	zettelIdSeparator: string;
	zettelIdMatchingMode: ZettelIdMatchingMode;
	noteTemplatePath: string;
	zettelTag: string;
	enableSequenceReorder: boolean;
	useZettelPrefix: boolean;
	zettelPrefix: string;

	// Fleeting notes settings
	enableFleetingNotes: boolean;
	fleetingNotesUseSeparateLocation: boolean;
	fleetingNotesLocation: string;
	fleetingNotesTemplatePath: string;
	fleetingNotesUseZettelId: boolean;
	fleetingNotesFilenameFormat: string;
	fleetingNotesTag: string;
	useFleetingNotesPrefix: boolean;
	fleetingNotesPrefix: string;

	// MOCs settings
	enableMocs: boolean;
	mocsUseSeparateLocation: boolean;
	mocsLocation: string;
	mocsTemplatePath: string;
	mocsUseZettelId: boolean;
	mocsFilenameFormat: string;
	mocsTag: string;
	useMocsPrefix: boolean;
	mocsPrefix: string;

	// Indexes settings
	enableIndexes: boolean;
	indexesUseSeparateLocation: boolean;
	indexesLocation: string;
	indexesTemplatePath: string;
	indexesUseZettelId: boolean;
	indexesFilenameFormat: string;
	indexesTag: string;
	useIndexesPrefix: boolean;
	indexesPrefix: string;
}

// Default box configuration
export const DEFAULT_BOX: Box = {
	id: "default",
	name: "Default Box",
	type: "folder",
	folderPath: "",

	// Box prefix defaults
	useBoxPrefix: false,
	boxPrefix: "",

	// Zettel settings
	zettelIdFormat: "YYYYMMDDHHmmssSSS",
	useSeparatorFormat: false,
	zettelIdSeparator: "⁝ ",
	zettelIdMatchingMode: "separator",
	noteTemplatePath: "",
	zettelTag: "zettel",
	enableSequenceReorder: false,
	useZettelPrefix: false,
	zettelPrefix: "z",

	// Fleeting notes settings
	enableFleetingNotes: true,
	fleetingNotesUseSeparateLocation: false,
	fleetingNotesLocation: "",
	fleetingNotesTemplatePath: "",
	fleetingNotesUseZettelId: true,
	fleetingNotesFilenameFormat: "",
	fleetingNotesTag: "fleeting",
	useFleetingNotesPrefix: false,
	fleetingNotesPrefix: "f",

	// MOCs settings
	enableMocs: true,
	mocsUseSeparateLocation: false,
	mocsLocation: "",
	mocsTemplatePath: "",
	mocsUseZettelId: false,
	mocsFilenameFormat: "{{title}} MOC",
	mocsTag: "moc",
	useMocsPrefix: false,
	mocsPrefix: "m",

	// Indexes settings
	enableIndexes: true,
	indexesUseSeparateLocation: false,
	indexesLocation: "",
	indexesTemplatePath: "",
	indexesUseZettelId: false,
	indexesFilenameFormat: "{{title}} Index",
	indexesTag: "index",
	useIndexesPrefix: false,
	indexesPrefix: "i",

	// Command opt-in defaults (command palette is always shown)
	enableIndividualCommands: {
		quickZettel: true,
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
		moveToRoot: false,
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
		moveToCorrectLocation: false,
		batchMoveToCorrectLocation: false,
		tagAsCorrectType: false,
		batchTagAsCorrectType: false,
		fixFilenames: false,
		batchFixFilenames: false,
		fixMocFilename: false,
		batchFixMocFilenames: false,
		fixIndexFilename: false,
		batchFixIndexFilenames: false,
	},
};

// Default settings values
export const DEFAULT_SETTINGS: ZettelkastenPluginSettings = {
	ignoredFolders: ["templates", "scripts"],
	newNoteLocation: "",
	enableBoxes: false, // Default to global settings mode for backwards compatibility
	boxes: [{ ...DEFAULT_BOX }],

	// Global defaults (same as DEFAULT_BOX values)
	zettelsLocation: "",
	zettelIdFormat: "YYYYMMDDHHmmssSSS",
	useSeparatorFormat: false,
	zettelIdSeparator: "⁝ ",
	zettelIdMatchingMode: "separator",
	noteTemplatePath: "",
	zettelTag: "zettel",
	enableSequenceReorder: false,
	useZettelPrefix: false,
	zettelPrefix: "z",

	enableFleetingNotes: true,
	fleetingNotesUseSeparateLocation: false,
	fleetingNotesLocation: "",
	fleetingNotesTemplatePath: "",
	fleetingNotesUseZettelId: true,
	fleetingNotesFilenameFormat: "",
	fleetingNotesTag: "fleeting",
	useFleetingNotesPrefix: false,
	fleetingNotesPrefix: "f",

	enableMocs: true,
	mocsUseSeparateLocation: false,
	mocsLocation: "",
	mocsTemplatePath: "",
	mocsUseZettelId: false,
	mocsFilenameFormat: "{{title}} MOC",
	mocsTag: "moc",
	useMocsPrefix: false,
	mocsPrefix: "m",

	enableIndexes: true,
	indexesUseSeparateLocation: false,
	indexesLocation: "",
	indexesTemplatePath: "",
	indexesUseZettelId: false,
	indexesFilenameFormat: "{{title}} Index",
	indexesTag: "index",
	useIndexesPrefix: false,
	indexesPrefix: "i",
};

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
	zettelPrefix: string; // Prefix to distinguish zettels between boxes

	// Zettel settings
	zettelIdFormat: string;
	useSeparatorFormat: boolean;
	zettelIdSeparator: string;
	zettelIdMatchingMode: ZettelIdMatchingMode;
	noteTemplatePath: string;
	addTitleToFilename: boolean;
	zettelTag: string;
	enableSequenceReorder: boolean;

	// Fleeting notes settings
	enableFleetingNotes: boolean;
	fleetingNotesUseSeparateLocation: boolean;
	fleetingNotesLocation: string;
	fleetingNotesTemplatePath: string;
	fleetingNotesUseZettelId: boolean;
	fleetingNotesFilenameFormat: string;
	fleetingNotesTag: string;

	// MOCs settings
	enableMocs: boolean;
	mocsUseSeparateLocation: boolean;
	mocsLocation: string;
	mocsTemplatePath: string;
	mocsUseZettelId: boolean;
	mocsFilenameFormat: string;
	mocsTag: string;

	// Indexes settings
	enableIndexes: boolean;
	indexesUseSeparateLocation: boolean;
	indexesLocation: string;
	indexesTemplatePath: string;
	indexesUseZettelId: boolean;
	indexesFilenameFormat: string;
	indexesTag: string;

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
	};
}

// Plugin settings interface
export interface ZettelkastenPluginSettings {
	// General settings
	ignoredFolders: string[];
	newNoteLocation: string;
	enableBoxes: boolean;

	// Boxes settings
	boxes: Box[];

	// Zettel settings
	zettelsUseSeparateLocation: boolean;
	zettelsLocation: string;
	zettelIdFormat: string;
	useSeparatorFormat: boolean;
	zettelIdSeparator: string;
	zettelIdMatchingMode: ZettelIdMatchingMode;
	noteTemplatePath: string;
	addTitleToFilename: boolean;
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

// Default settings values
export const DEFAULT_SETTINGS: ZettelkastenPluginSettings = {
	ignoredFolders: ["templates", "scripts"],

	newNoteLocation: "",
	enableBoxes: false,
	boxes: [],
	zettelsUseSeparateLocation: false,
	zettelsLocation: "",
	zettelIdFormat: "YYYYMMDDHHmmssSSS",
	useSeparatorFormat: false,
	zettelIdSeparator: "⁝ ",
	zettelIdMatchingMode: "separator",
	noteTemplatePath: "",
	addTitleToFilename: true,
	zettelTag: "zettel",
	enableSequenceReorder: false,
	useZettelPrefix: false,
	zettelPrefix: "z",

	fleetingNotesLocation: "",
	fleetingNotesUseSeparateLocation: false,
	fleetingNotesTemplatePath: "",
	fleetingNotesUseZettelId: true,
	fleetingNotesFilenameFormat: "",
	fleetingNotesTag: "fleeting",
	enableFleetingNotes: true,
	useFleetingNotesPrefix: false,
	fleetingNotesPrefix: "f",

	mocsLocation: "",
	mocsUseSeparateLocation: false,
	mocsTemplatePath: "",
	mocsUseZettelId: false,
	mocsFilenameFormat: "{{title}} MOC",
	mocsTag: "moc",
	enableMocs: true,
	useMocsPrefix: false,
	mocsPrefix: "m",

	indexesLocation: "",
	indexesUseSeparateLocation: false,
	indexesTemplatePath: "",
	indexesUseZettelId: false,
	indexesFilenameFormat: "{{title}} Index",
	indexesTag: "index",
	enableIndexes: true,
	useIndexesPrefix: false,
	indexesPrefix: "i",
};

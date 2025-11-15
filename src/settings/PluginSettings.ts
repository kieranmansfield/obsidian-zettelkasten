// Zettel ID matching modes
export type ZettelIdMatchingMode = "strict" | "separator" | "fuzzy";

// Plugin settings interface
export interface ZettelkastenPluginSettings {
	// General settings
	ignoredFolders: string[];
	newNoteLocation: string;

	// Zettel settings
	zettelsUseSeparateLocation: boolean;
	zettelsLocation: string;
	zettelIdFormat: string;
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
}

// Default settings values
export const DEFAULT_SETTINGS: ZettelkastenPluginSettings = {
	ignoredFolders: ["templates", "scripts"],

	newNoteLocation: "",
	zettelsUseSeparateLocation: false,
	zettelsLocation: "",
	zettelIdFormat: "YYYYMMDDHHmmssSSS",
	zettelIdSeparator: " ",
	zettelIdMatchingMode: "separator",
	noteTemplatePath: "",
	addTitleToFilename: true,
	zettelTag: "zettel",
	enableSequenceReorder: false,

	fleetingNotesLocation: "",
	fleetingNotesUseSeparateLocation: false,
	fleetingNotesTemplatePath: "",
	fleetingNotesUseZettelId: true,
	fleetingNotesFilenameFormat: "",
	fleetingNotesTag: "fleeting",
	enableFleetingNotes: true,

	mocsLocation: "",
	mocsUseSeparateLocation: false,
	mocsTemplatePath: "",
	mocsUseZettelId: false,
	mocsFilenameFormat: "{{title}} MOC",
	mocsTag: "moc",
	enableMocs: true,

	indexesLocation: "",
	indexesUseSeparateLocation: false,
	indexesTemplatePath: "",
	indexesUseZettelId: false,
	indexesFilenameFormat: "{{title}} Index",
	indexesTag: "index",
	enableIndexes: true,
};

// Zettel ID matching modes
export type ZettelIdMatchingMode = "strict" | "separator" | "fuzzy";

// Index modes
export type IndexMode = "moc" | "zettelkasten";

// Plugin settings interface
export interface ZettelkastenPluginSettings {
	// General settings
	ignoredFolders: string[];
	newNoteLocation: string;
	zettelsLocation: string;

	// Zettel settings
	zettelIdFormat: string;
	useSeparatorFormat: boolean;
	zettelIdSeparator: string;
	zettelIdMatchingMode: ZettelIdMatchingMode;
	noteTemplatePath: string;
	zettelTag: string;
	useZettelPrefix: boolean;
	zettelPrefix: string;

	// Note Sequence settings
	enableNoteSequence: boolean;

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

	// Index settings (merged MOCs and Indexes)
	enableIndexes: boolean;
	indexMode: IndexMode; // "moc" or "zettelkasten"
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
	zettelsLocation: "",

	zettelIdFormat: "YYYYMMDDHHmmssSSS",
	useSeparatorFormat: false,
	zettelIdSeparator: "⁝ ",
	zettelIdMatchingMode: "separator",
	noteTemplatePath: "",
	zettelTag: "zettel",
	useZettelPrefix: false,
	zettelPrefix: "z",

	enableNoteSequence: false,

	enableFleetingNotes: true,
	fleetingNotesUseSeparateLocation: false,
	fleetingNotesLocation: "",
	fleetingNotesTemplatePath: "",
	fleetingNotesUseZettelId: true,
	fleetingNotesFilenameFormat: "",
	fleetingNotesTag: "fleeting",
	useFleetingNotesPrefix: false,
	fleetingNotesPrefix: "f",

	enableIndexes: true,
	indexMode: "moc",
	indexesUseSeparateLocation: false,
	indexesLocation: "",
	indexesTemplatePath: "",
	indexesUseZettelId: false,
	indexesFilenameFormat: "{{title}} Index",
	indexesTag: "index",
	useIndexesPrefix: false,
	indexesPrefix: "i",
};

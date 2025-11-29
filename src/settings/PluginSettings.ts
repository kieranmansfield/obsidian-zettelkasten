// Zettel ID matching modes
export type ZettelIdMatchingMode = "strict" | "separator" | "fuzzy";

// Structure note modes
export type StructureNoteMode = "moc" | "zettelkasten";

// Zettel detection modes
export type ZettelDetectionMode = "tag" | "folder";

// Inbox modes
export type InboxMode = "default" | "fleeting";

// Plugin settings interface
export interface ZettelkastenPluginSettings {
	// General settings
	ignoredFolders: string[];
	newNoteLocation: string;
	zettelsLocation: string;

	// Zettel settings
	zettelDetectionMode: ZettelDetectionMode;
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
	enableNoteSequencesView: boolean;
	enableSequenceNavigator: boolean;

	// Inbox settings
	enableInbox: boolean;
	inboxMode: InboxMode; // "default" or "fleeting"
	inboxLocation: string;

	// Default mode settings
	defaultInboxTemplatePath: string;

	// Fleeting Notes mode settings
	fleetingNotesUseSeparateLocation: boolean;
	fleetingNotesLocation: string;
	fleetingNotesTemplatePath: string;
	fleetingNotesUseZettelId: boolean;
	fleetingNotesFilenameFormat: string;
	fleetingNotesTag: string;
	useFleetingNotesPrefix: boolean;
	fleetingNotesPrefix: string;

	// Structure Notes settings (MOCs and ZK Indexes)
	enableStructureNotes: boolean;
	structureNoteMode: StructureNoteMode; // "moc" or "zettelkasten"
	structureNotesUseSeparateLocation: boolean;
	structureNotesLocation: string;
	mocTemplatePath: string; // Template for MOC mode
	zkIndexTemplatePath: string; // Template for ZK Index mode
	structureNotesUseZettelId: boolean;
	structureNotesFilenameFormat: string;
	structureNotesTag: string;
	useStructureNotesPrefix: boolean;
	structureNotesPrefix: string;

	// Reference settings
	enableReference: boolean;
	referenceLocation: string;

	// Projects settings
	enableProjects: boolean;
	projectsLocation: string;
	projectsTemplatePath: string;

	// Zettelkasten Panel settings
	enableZettelkastenPanel: boolean;
	panelShowFileLists: boolean;
	panelShowFileIcons: boolean;
	panelInboxName: string;
	panelZettelsName: string;
	panelReferencesName: string;
	panelProjectsName: string;
	panelBookmarksName: string;
	panelNoteSequenceName: string;
	panelWorkspacesName: string;
	panelShowNoteSequence: boolean;
	panelShowWorkspaces: boolean;
	panelInboxDashboard: string;
	panelInboxFilterTags: string[];
	panelZettelsDashboard: string;
	panelZettelsFilterTags: string[];
	panelReferencesDashboard: string;
	panelReferencesFilterTags: string[];
	panelProjectsDashboard: string;
	panelProjectsFilterTags: string[];
	panelBookmarks: Array<{
		type: "file" | "search" | "graph" | "folder";
		path?: string;
		title: string;
		query?: string;
	}>;
	panelTagMatchMode: "any" | "all";
}

// Default settings values
export const DEFAULT_SETTINGS: ZettelkastenPluginSettings = {
	ignoredFolders: ["templates", "scripts"],
	newNoteLocation: "",
	zettelsLocation: "",

	zettelDetectionMode: "folder",
	zettelIdFormat: "YYYYMMDDHHmmssSSS",
	useSeparatorFormat: false,
	zettelIdSeparator: "⁝ ",
	zettelIdMatchingMode: "separator",
	noteTemplatePath: "",
	zettelTag: "zettel",
	useZettelPrefix: false,
	zettelPrefix: "z",

	enableNoteSequence: false,
	enableNoteSequencesView: true,
	enableSequenceNavigator: true,

	enableInbox: true,
	inboxMode: "default",
	inboxLocation: "",

	defaultInboxTemplatePath: "",

	fleetingNotesUseSeparateLocation: false,
	fleetingNotesLocation: "",
	fleetingNotesTemplatePath: "",
	fleetingNotesUseZettelId: true,
	fleetingNotesFilenameFormat: "",
	fleetingNotesTag: "fleeting",
	useFleetingNotesPrefix: false,
	fleetingNotesPrefix: "f",

	enableStructureNotes: true,
	structureNoteMode: "moc",
	structureNotesUseSeparateLocation: false,
	structureNotesLocation: "",
	mocTemplatePath: "",
	zkIndexTemplatePath: "",
	structureNotesUseZettelId: false,
	structureNotesFilenameFormat: "{{title}} Index",
	structureNotesTag: "index",
	useStructureNotesPrefix: false,
	structureNotesPrefix: "i",

	enableReference: false,
	referenceLocation: "",

	enableProjects: false,
	projectsLocation: "",
	projectsTemplatePath: "",

	enableZettelkastenPanel: true,
	panelShowFileLists: true,
	panelShowFileIcons: true,
	panelInboxName: "Inbox",
	panelZettelsName: "Zettels",
	panelReferencesName: "References",
	panelProjectsName: "Projects",
	panelBookmarksName: "Bookmarks",
	panelNoteSequenceName: "Note Sequence",
	panelWorkspacesName: "Workspaces",
	panelShowNoteSequence: true,
	panelShowWorkspaces: false,
	panelInboxDashboard: "",
	panelInboxFilterTags: [],
	panelZettelsDashboard: "",
	panelZettelsFilterTags: [],
	panelReferencesDashboard: "",
	panelReferencesFilterTags: [],
	panelProjectsDashboard: "",
	panelProjectsFilterTags: [],
	panelBookmarks: [],
	panelTagMatchMode: "any",
};

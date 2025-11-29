import { MarkdownView, Notice, TFile, TFolder } from "obsidian";
import { FileCreator } from "../classes/fileCreator";
import { ZettelSuggester } from "../ui/ZettelSuggester";
import { CreateNoteWithSuggestModal } from "../ui/CreateNoteWithSuggestModal";
import { NavigatorModal, NavigationOption } from "../ui/NavigatorModal";
import { SequenceReorderModal } from "../ui/SequenceReorderModal";
import { FolderSuggestModal } from "../ui/FolderSuggestModal";
import type ZettelkastenPlugin from "../../main";

// Manages all plugin commands
export class CommandManager {
	constructor(private plugin: ZettelkastenPlugin) {}

	/**
	 * Registers all commands with the plugin
	 */
	registerCommands(): void {
		this.registerOpenZettelCommand();
		this.registerOpenParentZettelCommand();
		this.registerOpenChildZettelCommand();
		this.registerOpenSiblingZettelCommand();
		this.registerZettelkastenNavigatorCommand();
		this.registerReorderSequenceCommand();
		this.registerNextSequenceCommand();
		this.registerPreviousSequenceCommand();
		this.registerNextChildCommand();
		this.registerPreviousChildCommand();
		this.registerGoUpLevelCommand();
		this.registerGoDownLevelCommand();
		this.registerAssignParentCommand();
		this.registerAssignChildCommand();
		this.registerCreateNoteCommand();
		this.registerCreateChildZettelCommand();
		this.registerCreateSiblingZettelCommand();
		this.registerIndentZettelCommand();
		this.registerOutdentZettelCommand();
		this.registerOpenFleetingCommand();
		this.registerCreateFleetingNoteCommand();
		this.registerCreateProjectCommand();
		this.registerOpenIndexCommand();
		this.registerCreateIndexCommand();
		this.registerFixZettelFilenameCommand();
		this.registerBatchFixZettelFilenamesCommand();
		this.registerAddTitleToAliasesCommand();
		this.registerBookmarkActiveFileCommand();
		this.registerBookmarkCurrentSearchCommand();
		this.registerBookmarkGraphCommand();
		this.registerToggleSequenceNavigatorCommand();
	}

	/**
	 * Registers the "Open Zettel" command
	 */
	private registerOpenZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-zettel",
			name: "Open Zettel",
			icon: "folder-open",
			callback: async () => {
				const titles = await this.getNoteTitlesByTag(
					this.plugin.settings.zettelTag,
				);

				new ZettelSuggester(
					this.plugin.app,
					titles,
					this.currentlySelectedText(),
					(file: TFile) => {
						this.plugin.app.workspace.getLeaf().openFile(file);
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Open Parent Zettel" command
	 * Opens the parent zettel from the 'up' frontmatter property
	 */
	private registerOpenParentZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-parent-zettel",
			name: "Open Parent Zettel",
			icon: "arrow-up",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get the file's metadata cache
				const cache =
					this.plugin.app.metadataCache.getFileCache(activeFile);
				const upLink = cache?.frontmatter?.up;

				if (!upLink) {
					new Notice("No parent link found in frontmatter (up:).");
					return false;
				}

				// Extract the link target from [[link]] or just the text
				let parentLinkText = upLink;
				if (typeof upLink === "string") {
					// Remove [[ ]] if present
					const match = upLink.match(/\[\[([^\]]+)\]\]/);
					if (match) {
						parentLinkText = match[1];
					}
				}

				// Try to resolve the link
				const parentFile =
					this.plugin.app.metadataCache.getFirstLinkpathDest(
						parentLinkText,
						activeFile.path,
					);

				if (!parentFile) {
					new Notice(`Parent zettel not found: ${parentLinkText}`);
					return false;
				}

				// Open the parent file
				this.plugin.app.workspace.getLeaf().openFile(parentFile);
				return true;
			},
		});
	}

	/**
	 * Registers the "Open Child Zettel" command
	 * Shows a list of child zettels to open
	 */
	private registerOpenChildZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-child-zettel",
			name: "Open Child Zettel",
			icon: "arrow-down",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Extract current zettel ID from filename
				const currentId = this.extractZettelId(activeFile.basename);

				if (!currentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return false;
				}

				// Find all child zettels
				this.findChildZettels(currentId).then((children) => {
					if (children.length === 0) {
						new Notice("No child zettels found.");
						return;
					}

					// Create a map of titles to files
					const childrenMap = new Map<string, TFile>();
					children.forEach((file) => {
						const cache =
							this.plugin.app.metadataCache.getFileCache(file);
						const title =
							cache?.frontmatter?.title ||
							file.basename.replace(/^\d+[a-z0-9]*\s*/, "") ||
							file.basename;
						childrenMap.set(title, file);
					});

					// Show suggester
					new ZettelSuggester(
						this.plugin.app,
						childrenMap,
						"",
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Open Inbox Note" command
	 */
	private registerOpenFleetingCommand(): void {
		this.plugin.addCommand({
			id: "open-fleeting",
			name: "Open Inbox Note",
			icon: "file-text",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableInbox) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.getNoteTitlesByTag(
					this.plugin.settings.fleetingNotesTag,
				).then((titles) => {
					new ZettelSuggester(
						this.plugin.app,
						titles,
						this.currentlySelectedText(),
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
						true,
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Open Index" command
	 */
	private registerOpenIndexCommand(): void {
		this.plugin.addCommand({
			id: "open-index",
			name: "Open Index",
			icon: "list",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableStructureNotes) {
					return false;
				}

				if (checking) {
					return true;
				}

				this.getNoteTitlesByTag(
					this.plugin.settings.structureNotesTag,
				).then((titles) => {
					new ZettelSuggester(
						this.plugin.app,
						titles,
						this.currentlySelectedText(),
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Open Sibling Zettel" command
	 * Opens a suggester to navigate to a sibling zettel (same hierarchy level)
	 */
	private registerOpenSiblingZettelCommand(): void {
		this.plugin.addCommand({
			id: "open-sibling-zettel",
			name: "Open Sibling Zettel",
			icon: "arrow-left-right",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Extract current zettel ID
				const currentId = this.extractZettelId(activeFile.basename);

				if (!currentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return false;
				}

				this.findSiblingZettels(currentId).then((siblings) => {
					if (siblings.length === 0) {
						new Notice("No siblings found for this zettel.");
						return;
					}

					// Filter out the current file from siblings
					const otherSiblings = siblings.filter(
						(file) => file.path !== activeFile.path,
					);

					if (otherSiblings.length === 0) {
						new Notice("No other siblings found for this zettel.");
						return;
					}

					// Create a map of titles to files
					const titlesMap = new Map<string, TFile>();
					for (const sibling of otherSiblings) {
						const cache =
							this.plugin.app.metadataCache.getFileCache(sibling);
						const title =
							cache?.frontmatter?.title ||
							sibling.basename.replace(
								/^\d{13,}[a-z0-9]*\s*-?\s*/i,
								"",
							);
						titlesMap.set(title, sibling);
					}

					// Show suggester with siblings
					new ZettelSuggester(
						this.plugin.app,
						titlesMap,
						this.currentlySelectedText(),
						(file: TFile) => {
							this.plugin.app.workspace.getLeaf().openFile(file);
						},
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Quick Zettelkasten Navigator" command
	 * Provides directional navigation: up (parent), down (child), left (prev sibling), right (next sibling)
	 */
	private registerZettelkastenNavigatorCommand(): void {
		this.plugin.addCommand({
			id: "zettelkasten-navigator",
			name: "Quick Zettelkasten Navigator",
			icon: "compass",
			checkCallback: (checking: boolean) => {
				// Check if Note Sequences feature is enabled
				if (!this.plugin.settings.enableNoteSequence) {
					return false;
				}

				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file doesn't appear to be a zettel.");
					return false;
				}

				// Get current note title
				const cache =
					this.plugin.app.metadataCache.getFileCache(activeFile);
				const currentTitle =
					cache?.frontmatter?.title || activeFile.basename;

				// Build navigation options
				this.buildNavigationOptions(activeFile, currentId).then(
					(options) => {
						new NavigatorModal(
							this.plugin.app,
							currentTitle,
							options,
							(file: TFile) => {
								this.plugin.app.workspace
									.getLeaf()
									.openFile(file);
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Assign Parent" command
	 * Allows reassigning the parent of the currently open zettel
	 */
	private registerAssignParentCommand(): void {
		this.plugin.addCommand({
			id: "assign-parent",
			name: "Assign Parent",
			icon: "link",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get all zettels to choose from
				this.getNoteTitlesByTag(this.plugin.settings.zettelTag).then(
					(titles) => {
						// Filter out the current file from potential parents
						const filteredTitles = new Map<string, TFile>();
						for (const [title, file] of titles) {
							if (file.path !== activeFile.path) {
								filteredTitles.set(title, file);
							}
						}

						if (filteredTitles.size === 0) {
							new Notice(
								"No other zettels found to assign as parent.",
							);
							return;
						}

						new ZettelSuggester(
							this.plugin.app,
							filteredTitles,
							this.currentlySelectedText(),
							async (parentFile: TFile) => {
								try {
									// Extract parent ID from the selected parent file
									const parentId = this.extractZettelId(
										parentFile.basename,
									);

									if (!parentId) {
										new Notice(
											"Selected parent doesn't have a valid zettel ID.",
										);
										return;
									}

									// Get the folder where zettels are stored
									const folder = this.getNoteTypeFolder(
										false,
										this.plugin.settings.zettelsLocation,
									);

									// Generate new child ID based on parent
									const newChildId =
										await this.generateChildZettelId(
											parentId,
											folder,
											activeFile,
										);

									// Rename the file with the new child ID
									const newPath = `${folder.path}/${newChildId}.md`;
									await this.plugin.app.fileManager.renameFile(
										activeFile,
										newPath,
									);

									// Add parent link to the file
									await this.addParentLinkToFile(
										activeFile,
										parentFile,
									);

									new Notice(
										`Assigned parent and renamed to: ${newChildId}`,
									);

									// Keep the file open after rename
									await this.plugin.app.workspace
										.getLeaf()
										.openFile(activeFile);
								} catch (error) {
									new Notice(
										`Error assigning parent: ${error.message}`,
									);
								}
							},
						).open();
					},
				);
				return true;
			},
		});
	}

	/**
	 * Registers the "Assign Child" command
	 * Allows selecting an existing zettel to become a child of the currently open zettel
	 */
	private registerAssignChildCommand(): void {
		this.plugin.addCommand({
			id: "assign-child",
			name: "Assign Child",
			icon: "git-branch",
			checkCallback: (checking: boolean) => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Extract parent ID from current file
				const parentId = this.extractZettelId(activeFile.basename);

				if (!parentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return false;
				}

				// Get all zettels to choose from
				this.getNoteTitlesByTag(this.plugin.settings.zettelTag).then(
					(titles) => {
						// Filter out the current file from potential children
						const filteredTitles = new Map<string, TFile>();
						for (const [title, file] of titles) {
							if (file.path !== activeFile.path) {
								filteredTitles.set(title, file);
							}
						}

						if (filteredTitles.size === 0) {
							new Notice(
								"No other zettels found to assign as child.",
							);
							return;
						}

						new ZettelSuggester(
							this.plugin.app,
							filteredTitles,
							this.currentlySelectedText(),
							async (childFile: TFile) => {
								try {
									// Get the folder where zettels are stored
									const folder = this.getNoteTypeFolder(
										false,
										this.plugin.settings.zettelsLocation,
									);

									// Generate new child ID based on current file (parent)
									const newChildId =
										await this.generateChildZettelId(
											parentId,
											folder,
											childFile,
										);

									// Rename the selected file with the new child ID
									const newPath = `${folder.path}/${newChildId}.md`;
									await this.plugin.app.fileManager.renameFile(
										childFile,
										newPath,
									);

									// Add parent link to the renamed file
									await this.addParentLinkToFile(
										childFile,
										activeFile,
									);

									new Notice(
										`Assigned child and renamed to: ${newChildId}`,
									);
								} catch (error) {
									new Notice(
										`Error assigning child: ${error.message}`,
									);
								}
							},
						).open();
					},
				);

				return true;
			},
		});
	}

	/**
	 * Registers the "Create Zettel" command
	 */
	private registerCreateNoteCommand(): void {
		this.plugin.addCommand({
			id: "create-new-note",
			name: "Create Zettel",
			icon: "file-plus",
			callback: async () => {
				// Get existing zettel notes for autocomplete
				const notesMap = await this.getNoteTitlesByTag(
					this.plugin.settings.zettelTag,
				);

				new CreateNoteWithSuggestModal(
					this.plugin.app,
					notesMap,
					async (title: string) => {
						const folder = this.getNoteTypeFolder(
							false,
							this.plugin.settings.zettelsLocation,
						);
						const zettelId = await this.generateZettelId();
						const filename = zettelId;
						const path = `${folder.path}/${filename}.md`;

						const creator = new FileCreator(
							this.plugin.app,
							path,
							title,
							() => {
								new Notice(`Created zettel: ${filename}`);
							},
							this.plugin.settings.noteTemplatePath,
						);
						try {
							await creator.create();
						} catch (error) {
							new Notice(
								`Error creating zettel: ${error.message}`,
							);
						}
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Create Child Zettel" command
	 * Creates a new zettel as a child of the currently open zettel
	 */
	private registerCreateChildZettelCommand(): void {
		this.plugin.addCommand({
			id: "create-child-zettel",
			name: "Create Child Zettel",
			icon: "file-down",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file. Please open a zettel first.");
					return;
				}

				// Extract parent zettel ID from filename
				const parentId = this.extractZettelId(activeFile.basename);

				if (!parentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return;
				}

				// Get existing zettel notes with valid IDs for autocomplete
				const notesMap = await this.getValidZettels(
					this.plugin.settings.zettelTag,
				);

				new CreateNoteWithSuggestModal(
					this.plugin.app,
					notesMap,
					async (title: string, existingFile?: TFile) => {
						const folder = this.getNoteTypeFolder(
							false,
							this.plugin.settings.zettelsLocation,
						);

						// Generate child zettel ID
						const childId = await this.generateChildZettelId(
							parentId,
							folder,
						);

						if (existingFile) {
							// Rename existing file to be a child of current zettel
							try {
								const newPath = `${folder.path}/${childId}.md`;
								await this.plugin.app.fileManager.renameFile(
									existingFile,
									newPath,
								);

								// Add parent link to the renamed file
								await this.addParentLinkToFile(
									existingFile,
									activeFile,
								);

								new Notice(
									`Renamed to child zettel: ${childId}`,
								);

								// Open the renamed file
								await this.plugin.app.workspace
									.getLeaf()
									.openFile(existingFile);
							} catch (error) {
								new Notice(
									`Error renaming file: ${error.message}`,
								);
							}
						} else {
							// Create new child zettel
							const filename = childId;
							const path = `${folder.path}/${filename}.md`;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(
										`Created child zettel: ${filename}`,
									);
								},
								this.plugin.settings.noteTemplatePath,
							);

							try {
								const result = await creator.create();

								// Add link to parent in the new file
								if (result.success && result.file) {
									await this.addParentLinkToFile(
										result.file,
										activeFile,
									);
								}
							} catch (error) {
								new Notice(
									`Error creating child zettel: ${error.message}`,
								);
							}
						}
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Create Sibling Zettel" command
	 * Creates a new zettel at the same level as the current note
	 */
	private registerCreateSiblingZettelCommand(): void {
		this.plugin.addCommand({
			id: "create-sibling-zettel",
			name: "Create Sibling Zettel",
			icon: "file-plus",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file. Please open a zettel first.");
					return;
				}

				// Extract current zettel ID from filename
				const currentId = this.extractZettelId(activeFile.basename);

				if (!currentId) {
					new Notice(
						"Current file doesn't appear to be a zettel (no ID found in filename).",
					);
					return;
				}

				// Get parent ID to determine sibling level
				const parentId = this.getParentZettelId(currentId);

				// Get existing zettel notes with valid IDs for autocomplete
				const notesMap = await this.getValidZettels(
					this.plugin.settings.zettelTag,
				);

				new CreateNoteWithSuggestModal(
					this.plugin.app,
					notesMap,
					async (title: string, existingFile?: TFile) => {
						const folder = this.getNoteTypeFolder(
							false,
							this.plugin.settings.zettelsLocation,
						);

						let siblingId: string;

						// If at root level (no parent), create a new root-level zettel
						if (!parentId) {
							siblingId = await this.generateZettelId();
						} else {
							// Generate sibling zettel ID (child of parent)
							siblingId = await this.generateChildZettelId(
								parentId,
								folder,
							);
						}

						if (existingFile) {
							// Rename existing file to be a sibling
							try {
								const newPath = `${folder.path}/${siblingId}.md`;
								await this.plugin.app.fileManager.renameFile(
									existingFile,
									newPath,
								);

								// Add parent link if there's a parent
								if (parentId) {
									const parentFile =
										await this.findZettelById(parentId);
									if (parentFile) {
										await this.addParentLinkToFile(
											existingFile,
											parentFile,
										);
									}
								}

								new Notice(
									`Renamed to sibling zettel: ${siblingId}`,
								);

								// Open the renamed file
								await this.plugin.app.workspace
									.getLeaf()
									.openFile(existingFile);
							} catch (error) {
								new Notice(
									`Error renaming file: ${error.message}`,
								);
							}
						} else {
							// Create new sibling zettel
							const filename = siblingId;
							const path = `${folder.path}/${filename}.md`;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(
										`Created sibling zettel: ${filename}`,
									);
								},
								this.plugin.settings.noteTemplatePath,
							);

							try {
								const result = await creator.create();

								// Add link to parent in the new file (if there's a parent)
								if (result.success && result.file && parentId) {
									const parentFile =
										await this.findZettelById(parentId);
									if (parentFile) {
										await this.addParentLinkToFile(
											result.file,
											parentFile,
										);
									}
								}
							} catch (error) {
								new Notice(
									`Error creating sibling zettel: ${error.message}`,
								);
							}
						}
					},
				).open();
			},
		});
	}

	/**
	 * Registers the "Indent Zettel" command
	 * Makes current zettel a child of the previous sibling
	 */
	private registerIndentZettelCommand(): void {
		this.plugin.addCommand({
			id: "indent-zettel",
			name: "Indent Zettel",
			icon: "indent",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file.");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel.");
					return;
				}

				try {
					await this.indentZettel(activeFile, currentId);
				} catch (error) {
					new Notice(`Error indenting zettel: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Outdent Zettel" command
	 * Makes current zettel a sibling of its parent
	 */
	private registerOutdentZettelCommand(): void {
		this.plugin.addCommand({
			id: "outdent-zettel",
			name: "Outdent Zettel",
			icon: "outdent",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file.");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel.");
					return;
				}

				try {
					await this.outdentZettel(activeFile, currentId);
				} catch (error) {
					new Notice(`Error outdenting zettel: ${error.message}`);
				}
			},
		});
	}

	/**
	 * Registers the "Create Inbox Note" command
	 */
	private registerCreateFleetingNoteCommand(): void {
		this.plugin.addCommand({
			id: "create-fleeting-note",
			name: "Create Inbox Note",
			icon: "file-plus",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableInbox) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Determine folder and template based on inbox mode
				const inboxMode = this.plugin.settings.inboxMode;
				let folder: TFolder;
				let templatePath: string;

				if (inboxMode === "fleeting") {
					// Get existing fleeting notes for autocomplete
					this.getNoteTitlesByTag(
						this.plugin.settings.fleetingNotesTag,
					).then((notesMap) => {
						new CreateNoteWithSuggestModal(
							this.plugin.app,
							notesMap,
							async (title: string) => {
								folder = this.getNoteTypeFolder(
									this.plugin.settings
										.fleetingNotesUseSeparateLocation,
									this.plugin.settings.fleetingNotesLocation,
								);
								const filename =
									this.buildFleetingFilename(title);
								const path = `${folder.path}/${filename}.md`;
								templatePath =
									this.plugin.settings
										.fleetingNotesTemplatePath;

								const creator = new FileCreator(
									this.plugin.app,
									path,
									title,
									() => {
										new Notice(
											`Created inbox note: ${title}`,
										);
									},
									templatePath,
								);
								try {
									await creator.create();
								} catch (error) {
									new Notice(
										`Error creating inbox note: ${error.message}`,
									);
								}
							},
							true,
						).open();
					});
				} else {
					// Default mode - simple note creation
					new CreateNoteWithSuggestModal(
						this.plugin.app,
						new Map(),
						async (title: string) => {
							folder = this.getNoteTypeFolder(
								false,
								this.plugin.settings.inboxLocation,
							);
							const filename = title;
							const path = `${folder.path}/${filename}.md`;
							templatePath =
								this.plugin.settings.defaultInboxTemplatePath;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(`Created inbox note: ${title}`);
								},
								templatePath,
							);
							try {
								await creator.create();
							} catch (error) {
								new Notice(
									`Error creating inbox note: ${error.message}`,
								);
							}
						},
						true,
					).open();
				}

				return true;
			},
		});
	}

	/**
	 * Registers the "New Project" command
	 */
	private registerCreateProjectCommand(): void {
		this.plugin.addCommand({
			id: "create-project",
			name: "New Project",
			icon: "folder-kanban",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableProjects) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Simple note creation for projects
				new CreateNoteWithSuggestModal(
					this.plugin.app,
					new Map(),
					async (title: string) => {
						const folder = this.getNoteTypeFolder(
							false,
							this.plugin.settings.projectsLocation,
						);
						const filename = title;
						const path = `${folder.path}/${filename}.md`;
						const templatePath =
							this.plugin.settings.projectsTemplatePath;

						const creator = new FileCreator(
							this.plugin.app,
							path,
							title,
							() => {
								new Notice(`Created project: ${title}`);
							},
							templatePath,
						);
						try {
							await creator.create();
						} catch (error) {
							new Notice(
								`Error creating project: ${error.message}`,
							);
						}
					},
					true,
				).open();

				return true;
			},
		});
	}

	/**
	 * Registers the "Create Index" command
	 */
	private registerCreateIndexCommand(): void {
		this.plugin.addCommand({
			id: "create-index",
			name: "Create Index",
			icon: "file-plus",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableStructureNotes) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get existing indexes for autocomplete
				this.getNoteTitlesByTag(
					this.plugin.settings.structureNotesTag,
				).then((notesMap) => {
					new CreateNoteWithSuggestModal(
						this.plugin.app,
						notesMap,
						async (title: string) => {
							const folder = this.getNoteTypeFolder(
								this.plugin.settings
									.structureNotesUseSeparateLocation,
								this.plugin.settings.structureNotesLocation,
							);
							const filename = this.buildIndexFilename(title);
							const path = `${folder.path}/${filename}.md`;

							// Determine which template to use based on mode
							const templatePath =
								this.plugin.settings.structureNoteMode === "moc"
									? this.plugin.settings.mocTemplatePath
									: this.plugin.settings.zkIndexTemplatePath;

							const creator = new FileCreator(
								this.plugin.app,
								path,
								title,
								() => {
									new Notice(`Created index: ${title}`);
								},
								templatePath,
							);
							try {
								await creator.create();
							} catch (error) {
								new Notice(
									`Error creating index: ${error.message}`,
								);
							}
						},
					).open();
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Fix Zettel Filename" command
	 * Normalizes the active zettel's filename to match current settings
	 */
	private registerFixZettelFilenameCommand(): void {
		this.plugin.addCommand({
			id: "fix-zettel-filename",
			name: "Fix Zettel Filename",
			icon: "file-check",
			callback: async () => {
				try {
					const activeFile =
						this.plugin.app.workspace.getActiveFile();
					if (!activeFile) {
						new Notice("No active file.");
						return;
					}

					if (!this.isZettel(activeFile)) {
						new Notice("Active file is not a zettel.");
						return;
					}

					const fixed = await this.fixZettelFilename(activeFile);
					if (fixed) {
						new Notice("Zettel filename fixed.");
					} else {
						new Notice("Zettel filename is already correct.");
					}
				} catch (error) {
					new Notice(
						`Error fixing zettel filename: ${error.message}`,
					);
				}
			},
		});
	}

	/**
	 * Registers the "Batch Fix Zettel Filenames" command
	 * Normalizes all zettel filenames in a selected folder
	 */
	private registerBatchFixZettelFilenamesCommand(): void {
		this.plugin.addCommand({
			id: "batch-fix-zettel-filenames",
			name: "Batch Fix Zettel Filenames (Select Folder)",
			icon: "folder-check",
			callback: async () => {
				new FolderSuggestModal(this.plugin, async (folder: TFolder) => {
					try {
						const allFiles =
							this.plugin.app.vault.getMarkdownFiles();
						let fixedCount = 0;

						for (const file of allFiles) {
							// Check if file is within the selected folder
							if (!this.isFileInFolder(file, folder)) {
								continue;
							}

							// Check if file is a zettel
							if (!this.isZettel(file)) {
								continue;
							}

							const fixed = await this.fixZettelFilename(file);
							if (fixed) {
								fixedCount++;
							}
						}

						const folderDisplay =
							folder.path === "/" ? "root" : folder.path;
						if (fixedCount > 0) {
							new Notice(
								`Fixed ${fixedCount} zettel filename(s) in ${folderDisplay}.`,
							);
						} else {
							new Notice(
								`All zettel filenames in ${folderDisplay} are already correct.`,
							);
						}
					} catch (error) {
						new Notice(
							`Error fixing zettel filenames: ${error.message}`,
						);
					}
				}).open();
			},
		});
	}

	/**
	 * Fixes a single zettel file's filename to match the configured format
	 * Returns true if the file was renamed, false if already correct
	 */
	private async fixZettelFilename(file: TFile): Promise<boolean> {
		const basename = file.basename;

		// Extract the raw ID (might have wrong prefix or no prefix)
		let rawId = this.extractZettelId(basename);

		// If no ID found, generate one for this zettel
		if (!rawId) {
			const timestamp = await this.generateTimestampForFile(file);
			const prefix = this.plugin.settings.useZettelPrefix
				? this.plugin.settings.zettelPrefix
				: "";
			rawId = prefix + timestamp;
		}

		// Strip any existing prefix and get just the numeric part + hierarchy
		const idWithoutAnyPrefix = this.stripAllPrefixes(rawId);

		// Add the correct prefix if configured
		const desiredPrefix = this.plugin.settings.useZettelPrefix
			? this.plugin.settings.zettelPrefix
			: "";

		// Extract just the timestamp part (digits only)
		const timestampMatch = idWithoutAnyPrefix.match(/^(\d+)/);
		if (!timestampMatch) {
			console.warn(`Could not extract timestamp from ${basename}`);
			return false;
		}

		const timestamp = timestampMatch[1];
		const hierarchy = idWithoutAnyPrefix.substring(timestamp.length);

		// Normalize timestamp length to match format
		const formatLength = this.plugin.settings.zettelIdFormat.length;
		let normalizedTimestamp = timestamp;

		if (timestamp.length > formatLength) {
			normalizedTimestamp = timestamp.substring(0, formatLength);
		} else if (timestamp.length < formatLength) {
			normalizedTimestamp = timestamp.padEnd(formatLength, "0");
		}

		// Build the expected filename (just the ID, nothing else)
		const expectedFilename =
			desiredPrefix + normalizedTimestamp + hierarchy;

		// Check if filename needs fixing
		if (basename !== expectedFilename) {
			const folder = file.parent || this.plugin.app.vault.getRoot();
			const newPath = `${folder.path}/${expectedFilename}.md`;

			// Check if target path already exists
			const existing =
				this.plugin.app.vault.getAbstractFileByPath(newPath);
			if (existing && existing !== file) {
				console.warn(
					`Cannot fix ${basename}: ${expectedFilename}.md already exists`,
				);
				return false;
			}

			await this.plugin.app.fileManager.renameFile(file, newPath);
			return true;
		}

		return false;
	}

	/**
	 * Strips ALL letter prefixes from a zettel ID to get just the numeric part + hierarchy
	 */
	private stripAllPrefixes(zettelId: string): string {
		const match = zettelId.match(/^[a-z]+(\d{13,}(?:[a-z]+|\d+)*)/);
		if (match) {
			return match[1];
		}
		return zettelId;
	}

	/**
	 * Generates a timestamp for a file based on its creation time or current time
	 */
	private async generateTimestampForFile(file: TFile): Promise<string> {
		// Try to use file creation time
		const stat = await this.plugin.app.vault.adapter.stat(file.path);
		const creationTime = stat?.ctime || Date.now();

		// Format according to settings
		const format = this.plugin.settings.zettelIdFormat;
		const date = new Date(creationTime);

		let timestamp = "";

		// Parse format string (e.g., "YYYYMMDDHHmmssSSS")
		timestamp += date.getFullYear().toString(); // YYYY
		timestamp += (date.getMonth() + 1).toString().padStart(2, "0"); // MM
		timestamp += date.getDate().toString().padStart(2, "0"); // DD
		timestamp += date.getHours().toString().padStart(2, "0"); // HH
		timestamp += date.getMinutes().toString().padStart(2, "0"); // mm
		timestamp += date.getSeconds().toString().padStart(2, "0"); // ss

		// Add milliseconds if format requires them
		if (format.includes("SSS")) {
			timestamp += date.getMilliseconds().toString().padStart(3, "0"); // SSS
		}

		// Ensure timestamp matches format length
		if (timestamp.length > format.length) {
			timestamp = timestamp.substring(0, format.length);
		} else if (timestamp.length < format.length) {
			timestamp = timestamp.padEnd(format.length, "0");
		}

		return timestamp;
	}

	/**
	 * Helper method to check if a file is within a folder (including subfolders)
	 */
	private isFileInFolder(file: TFile, folder: TFolder): boolean {
		// Root folder contains everything
		if (folder.path === "/") {
			return true;
		}

		// Check if file path starts with folder path
		return (
			file.path.startsWith(folder.path + "/") ||
			file.parent?.path === folder.path
		);
	}

	/**
	 * Checks if a file is a zettel based on the configured detection mode
	 */
	private isZettel(file: TFile): boolean {
		if (this.plugin.settings.zettelDetectionMode === "tag") {
			// Tag-based: check if file has the zettel tag
			const cache = this.plugin.app.metadataCache.getFileCache(file);
			const tags =
				cache?.frontmatter?.tags ||
				cache?.tags?.map((t) => t.tag) ||
				[];
			const tagArray = Array.isArray(tags) ? tags : [tags];
			const zettelTag = this.plugin.settings.zettelTag.startsWith("#")
				? this.plugin.settings.zettelTag
				: `#${this.plugin.settings.zettelTag}`;
			return tagArray.some(
				(tag) =>
					tag === zettelTag || tag === this.plugin.settings.zettelTag,
			);
		} else {
			// Folder-based: check if file is in the zettels location
			const zettelsLocation = this.plugin.settings.zettelsLocation || "";
			if (!zettelsLocation) {
				// If no location specified, check if file has a zettel ID
				return this.extractZettelId(file.basename) !== null;
			}
			return (
				file.path.startsWith(zettelsLocation + "/") ||
				file.parent?.path === zettelsLocation
			);
		}
	}

	/**
	 * Gets the title from a file's frontmatter or basename (without zettel ID)
	 */
	private getTitleFromFile(file: TFile): string {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		if (cache?.frontmatter?.title) {
			return cache.frontmatter.title;
		}

		// Extract title from filename (remove zettel ID and separator)
		const id = this.extractZettelId(file.basename);
		if (id && this.plugin.settings.useSeparatorFormat) {
			const separator = this.plugin.settings.zettelIdSeparator;
			const parts = file.basename.split(separator);
			return parts.length > 1
				? parts.slice(1).join(separator).trim()
				: "";
		}

		// No separator, return basename without ID
		if (id) {
			return file.basename.substring(id.length).trim();
		}

		return file.basename;
	}

	/**
	 * Builds a zettel filename from ID and title
	 */
	private buildZettelFilename(id: string, title: string): string {
		const prefix = this.plugin.settings.useZettelPrefix
			? this.plugin.settings.zettelPrefix
			: "";
		const fullId = prefix + id;

		if (this.plugin.settings.useSeparatorFormat && title) {
			const separator = this.plugin.settings.zettelIdSeparator;
			return `${fullId}${separator}${title}`;
		}

		return title ? `${fullId} ${title}` : fullId;
	}

	/**
	 * Normalizes a zettel ID to match the current format settings
	 */
	private normalizeZettelId(file: TFile, currentId: string): string {
		// Determine current and desired prefix
		const desiredPrefix = this.plugin.settings.useZettelPrefix
			? this.plugin.settings.zettelPrefix
			: "";

		let idWithoutPrefix = currentId;

		// Remove any existing letter prefix from the ID
		const prefixMatch = currentId.match(/^([a-z]+)/);
		if (prefixMatch) {
			idWithoutPrefix = currentId.substring(prefixMatch[1].length);
		}

		// Extract just the timestamp part (digits only)
		const timestampMatch = idWithoutPrefix.match(/^(\d+)/);
		if (!timestampMatch) {
			return currentId; // Can't normalize, return as-is
		}

		const timestamp = timestampMatch[1];
		const hierarchy = idWithoutPrefix.substring(timestamp.length);

		// Normalize timestamp length to match format
		const formatLength = this.plugin.settings.zettelIdFormat.length;
		let normalizedTimestamp = timestamp;

		if (timestamp.length > formatLength) {
			normalizedTimestamp = timestamp.substring(0, formatLength);
		} else if (timestamp.length < formatLength) {
			normalizedTimestamp = timestamp.padEnd(formatLength, "0");
		}

		// Return with desired prefix (or no prefix if disabled)
		return desiredPrefix + normalizedTimestamp + hierarchy;
	}

	/**
	 * Extracts zettel ID from filename
	 * Looks for timestamp-based ID with optional hierarchy at the start of filename
	 */
	private extractZettelId(filename: string): string | null {
		// Match timestamp pattern with optional prefix
		// First try to match with any letter prefix: z20251114... or zk20251114...
		// Examples: z2025111321511, zk20251114154532123, 20251114154532123a, z20251114154532123a1
		const withPrefixMatch = filename.match(
			/^([a-z]+\d{13,}(?:[a-z]+|\d+)*)/,
		);
		if (withPrefixMatch) {
			return withPrefixMatch[1];
		}

		// Try without prefix - just timestamp and hierarchy
		const withoutPrefixMatch = filename.match(/^(\d{13,}(?:[a-z]+|\d+)*)/);
		return withoutPrefixMatch ? withoutPrefixMatch[1] : null;
	}

	/**
	 * Generates a child zettel ID based on parent ID
	 * Alternates between letters and numbers: 123 -> 123a -> 123a1 -> 123a1a -> 123a1a1
	 * If moving an existing file and there's a collision, uses file's creation date or generates new ID
	 */
	private async generateChildZettelId(
		parentId: string,
		folder: TFolder,
		movingFile?: TFile,
	): Promise<string> {
		// Use centralized method to find next available ID (checks for gaps)
		return await this.findNextAvailableChildId(parentId);
	}

	/**
	 * Determines if the next child should use a letter or number
	 * Alternates based on hierarchy depth
	 */
	private shouldUseLetterForChild(parentId: string): boolean {
		// Strip any prefix first
		const idWithoutPrefix = this.stripPrefix(parentId);

		// Remove the timestamp portion (first 13+ digits)
		const hierarchyPart = idWithoutPrefix.replace(/^\d{13,}/, "");

		if (!hierarchyPart) {
			// No hierarchy yet, first level should use letters
			return true;
		}

		// Check the last character to determine alternation
		// If last character is a digit, next level uses letters
		// If last character is a letter, next level uses digits
		const lastChar = hierarchyPart[hierarchyPart.length - 1];
		return /\d/.test(lastChar);
	}

	/**
	 * Strips any letter prefix from a zettel ID
	 * Example: "Z20241118123456789a" -> "20241118123456789a"
	 */
	private stripPrefix(zettelId: string): string {
		// Remove any leading letters (prefix)
		return zettelId.replace(/^[A-Za-z]+/, "");
	}

	/**
	 * Escapes special regex characters in a string
	 */
	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	/**
	 * Resolves a timestamp collision by trying creation date or generating new timestamp
	 * Preserves year, month, and day from original timestamp when possible
	 */
	private async resolveTimestampCollision(
		originalId: string,
		hierarchySuffix: string,
		folder: TFolder,
		movingFile?: TFile,
	): Promise<string> {
		const files = this.plugin.app.vault.getMarkdownFiles();

		// Extract timestamp from original ID
		const timestampMatch = originalId.match(/^(\d{13,})/);
		if (!timestampMatch) {
			return originalId;
		}

		const originalTimestamp = timestampMatch[1];

		// Try using file's creation date if available
		if (movingFile) {
			const creationTime = movingFile.stat.ctime;
			const creationDate = new Date(creationTime);
			const creationTimestamp = this.formatTimestamp(creationDate);
			const creationId = creationTimestamp + hierarchySuffix;

			// Check if this ID is available
			const creationPath = `${folder.path}/${creationId}.md`;
			const creationExists = files.some(
				(f) => f.path === creationPath && f !== movingFile,
			);

			if (!creationExists) {
				return creationId;
			}
		}

		// Extract year, month, day from original timestamp
		// Format: YYYYMMDDHHMMSS... (13+ digits)
		const year = originalTimestamp.substring(0, 4);
		const month = originalTimestamp.substring(4, 6);
		const day = originalTimestamp.substring(6, 8);

		// Generate new timestamp preserving date but with current time
		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const seconds = String(now.getSeconds()).padStart(2, "0");
		const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

		let newTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
		let newId = newTimestamp + hierarchySuffix;
		let newPath = `${folder.path}/${newId}.md`;

		// If still collision, increment milliseconds until we find available slot
		let attempts = 0;
		while (
			files.some((f) => f.path === newPath && f !== movingFile) &&
			attempts < 1000
		) {
			attempts++;
			const ms = (parseInt(milliseconds) + attempts) % 1000;
			newTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}${String(ms).padStart(3, "0")}`;
			newId = newTimestamp + hierarchySuffix;
			newPath = `${folder.path}/${newId}.md`;
		}

		return newId;
	}

	/**
	 * Formats a date as a timestamp string (YYYYMMDDHHMMSSmmm)
	 */
	private formatTimestamp(date: Date): string {
		const year = String(date.getFullYear());
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");
		const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

		return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
	}

	/**
	 * Indents a zettel by making it a child of its previous sibling
	 */
	private async indentZettel(file: TFile, currentId: string): Promise<void> {
		// Get parent ID and current suffix
		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			new Notice("Cannot indent: zettel has no parent.");
			return;
		}

		// Find previous sibling
		const previousSibling = await this.findPreviousSibling(currentId);
		if (!previousSibling) {
			new Notice("Cannot indent: no previous sibling found.");
			return;
		}

		const previousSiblingId = this.extractZettelId(
			previousSibling.basename,
		);
		if (!previousSiblingId) {
			return;
		}

		// Generate new child ID under previous sibling
		const folder = file.parent || this.plugin.app.vault.getRoot();
		let newId = await this.generateChildZettelId(
			previousSiblingId,
			folder,
			file,
		);

		// Check for filename collision
		const proposedPath = `${folder.path}/${newId}.md`;
		const collision = this.plugin.app.vault
			.getMarkdownFiles()
			.some((f) => f.path === proposedPath && f !== file);

		if (collision) {
			// Extract hierarchy suffix from newId
			const hierarchySuffix = newId.replace(/^\d{13,}/, "");
			newId = await this.resolveTimestampCollision(
				currentId,
				hierarchySuffix,
				folder,
				file,
			);
		}

		// Rename file
		const newPath = `${folder.path}/${newId}.md`;
		await this.plugin.app.fileManager.renameFile(file, newPath);

		// Update parent link in frontmatter
		await this.plugin.app.fileManager.processFrontMatter(
			file,
			(frontmatter) => {
				frontmatter.up = `[[${previousSibling.basename}]]`;
			},
		);

		new Notice(`Indented to ${newId}`);
	}

	/**
	 * Outdents a zettel by making it a sibling of its parent
	 */
	private async outdentZettel(file: TFile, currentId: string): Promise<void> {
		// Get parent ID
		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			new Notice("Cannot outdent: zettel is already at root level.");
			return;
		}

		// Get grandparent ID
		const grandparentId = this.getParentZettelId(parentId);
		if (!grandparentId) {
			new Notice("Cannot outdent: parent is at root level.");
			return;
		}

		// Find the parent file to get grandparent link
		const parentFile = await this.findZettelById(parentId);

		// Generate new sibling ID at parent's level
		const folder = file.parent || this.plugin.app.vault.getRoot();
		let newId = await this.generateChildZettelId(
			grandparentId,
			folder,
			file,
		);

		// Check for filename collision
		const proposedPath = `${folder.path}/${newId}.md`;
		const collision = this.plugin.app.vault
			.getMarkdownFiles()
			.some((f) => f.path === proposedPath && f !== file);

		if (collision) {
			// Extract hierarchy suffix from newId
			const hierarchySuffix = newId.replace(/^\d{13,}/, "");
			newId = await this.resolveTimestampCollision(
				currentId,
				hierarchySuffix,
				folder,
				file,
			);
		}

		// Rename file
		const newPath = `${folder.path}/${newId}.md`;
		await this.plugin.app.fileManager.renameFile(file, newPath);

		// Update parent link in frontmatter
		if (parentFile) {
			await this.plugin.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					const parentCache =
						this.plugin.app.metadataCache.getFileCache(parentFile);
					const grandparentLink = parentCache?.frontmatter?.up;
					if (grandparentLink) {
						frontmatter.up = grandparentLink;
					}
				},
			);
		}

		new Notice(`Outdented to ${newId}`);
	}

	/**
	 * Gets the parent zettel ID from a child ID
	 */
	private getParentZettelId(childId: string): string | null {
		// Remove the timestamp portion to get hierarchy
		const hierarchyPart = childId.replace(/^(\d{13,})/, "");

		if (!hierarchyPart) {
			// No hierarchy, this is a root zettel
			return null;
		}

		// Remove the last segment (letter or number)
		const parentHierarchy = hierarchyPart.replace(/[a-z]+$|[0-9]+$/, "");
		const timestamp = childId.match(/^(\d{13,})/)?.[1];

		return timestamp ? timestamp + parentHierarchy : null;
	}

	/**
	 * Finds the previous sibling zettel
	 */
	private async findPreviousSibling(
		currentId: string,
	): Promise<TFile | null> {
		const parentId = this.getParentZettelId(currentId);
		if (!parentId) {
			return null;
		}

		const files = this.plugin.app.vault.getMarkdownFiles();
		const siblings: Array<{ file: TFile; id: string; suffix: string }> = [];

		// Get the suffix type (letter or number) and value
		const currentSuffix = currentId.replace(parentId, "");
		const isLetter = /^[a-z]+$/.test(currentSuffix);

		for (const file of files) {
			const fileId = this.extractZettelId(file.basename);
			if (!fileId || fileId === currentId) continue;

			const fileParentId = this.getParentZettelId(fileId);
			if (fileParentId === parentId) {
				const suffix = fileId.replace(parentId, "");
				const suffixIsLetter = /^[a-z]+$/.test(suffix);

				// Only consider siblings of same type (letter or number)
				if (suffixIsLetter === isLetter) {
					siblings.push({ file, id: fileId, suffix });
				}
			}
		}

		// Sort siblings and find previous
		siblings.sort((a, b) => a.suffix.localeCompare(b.suffix));

		const currentIndex = siblings.findIndex((s) => s.id === currentId);
		if (currentIndex > 0) {
			return siblings[currentIndex - 1].file;
		}

		return null;
	}

	/**
	 * Finds a zettel file by its ID
	 */
	private async findZettelById(zettelId: string): Promise<TFile | null> {
		const files = this.plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			const fileId = this.extractZettelId(file.basename);
			if (fileId === zettelId) {
				return file;
			}
		}

		return null;
	}

	/**
	 * Finds all child zettels of a given parent ID
	 */
	private async findChildZettels(parentId: string): Promise<TFile[]> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const children: TFile[] = [];

		// Create regex pattern to match direct children
		// For parent "123", match "123a", "123b", etc. (letter)
		// For parent "123a", match "123a1", "123a2", etc. (number)
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);

		for (const file of files) {
			// Skip ignored files
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const fileId = this.extractZettelId(file.basename);
			if (!fileId || !fileId.startsWith(parentId)) {
				continue;
			}

			// Extract the part after the parent ID
			const suffix = fileId.substring(parentId.length);

			if (!suffix) {
				// This is the parent itself, not a child
				continue;
			}

			// Check if this is a direct child (not a grandchild or deeper)
			if (shouldUseLetter) {
				// Direct child should be a single letter only
				// Examples: "a", "b", "z" but not "ab", "a1", "a1a"
				if (/^[a-z]$/.test(suffix)) {
					children.push(file);
				}
			} else {
				// Direct child should be one or more digits only
				// Examples: "1", "2", "10" but not "1a", "12a", "1a1"
				if (/^\d+$/.test(suffix)) {
					children.push(file);
				}
			}
		}

		// Sort children by ID
		children.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return children;
	}

	/**
	 * Finds all sibling zettels (same hierarchy level) of a given zettel ID
	 */
	private async findSiblingZettels(zettelId: string): Promise<TFile[]> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const siblings: TFile[] = [];

		// Extract the hierarchy pattern from the current ID
		// For "123a", siblings are "123b", "123c", etc.
		// For "123a1", siblings are "123a2", "123a3", etc.

		// Get the base (timestamp + hierarchy up to parent level)
		const timestampMatch = zettelId.match(/^(\d{13,})/);
		if (!timestampMatch) {
			return siblings; // Not a valid zettel ID
		}

		const timestamp = timestampMatch[1];
		const hierarchyPart = zettelId.substring(timestamp.length);

		if (!hierarchyPart) {
			// Root level zettel - no siblings (each root has unique timestamp)
			return siblings;
		}

		// Determine the parent ID and what type of suffix siblings should have
		let parentId: string;
		let siblingPattern: RegExp;

		// Check if the last character is a letter or part of a number sequence
		const lastChar = hierarchyPart.charAt(hierarchyPart.length - 1);

		if (/[a-z]/.test(lastChar)) {
			// Last character is a letter, so siblings have letter suffixes
			parentId = timestamp + hierarchyPart.slice(0, -1);
			siblingPattern = new RegExp(
				`^${this.escapeRegex(parentId)}[a-z](?![a-z0-9])`,
			);
		} else {
			// Last part is a number sequence
			const numberMatch = hierarchyPart.match(/(\d+)$/);
			if (numberMatch) {
				parentId =
					timestamp + hierarchyPart.slice(0, -numberMatch[1].length);
				siblingPattern = new RegExp(
					`^${this.escapeRegex(parentId)}\\d+(?![a-z0-9])`,
				);
			} else {
				return siblings; // Invalid format
			}
		}

		// Find all files matching the sibling pattern
		for (const file of files) {
			const fileId = this.extractZettelId(file.basename);
			if (fileId && siblingPattern.test(fileId)) {
				siblings.push(file);
			}
		}

		// Sort siblings by ID
		siblings.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return siblings;
	}

	/**
	 * Builds navigation options for the navigator modal
	 * Returns up (parent), down (child), left (prev sibling), right (next sibling)
	 */
	private async buildNavigationOptions(
		activeFile: TFile,
		currentId: string,
	): Promise<NavigationOption[]> {
		const options: NavigationOption[] = [];

		// UP: Parent (based on zettel ID structure)
		let parentFile: TFile | null = null;
		let parentLabel = "No parent";
		const parentId = this.getParentZettelId(currentId);

		if (parentId) {
			// Find the file with this parent ID
			const allFiles = this.plugin.app.vault.getMarkdownFiles();
			for (const file of allFiles) {
				const fileId = this.extractZettelId(file.basename);
				if (fileId === parentId) {
					parentFile = file;
					const parentCache =
						this.plugin.app.metadataCache.getFileCache(parentFile);
					parentLabel =
						parentCache?.frontmatter?.title || parentFile.basename;
					break;
				}
			}
		}

		options.push({
			direction: "up",
			label: parentLabel,
			file: parentFile,
			disabled: !parentFile,
		});

		// DOWN: First child
		const children = await this.findChildZettels(currentId);
		const firstChild = children.length > 0 ? children[0] : null;
		let childLabel = "No children";
		if (firstChild) {
			const childCache =
				this.plugin.app.metadataCache.getFileCache(firstChild);
			childLabel = childCache?.frontmatter?.title || firstChild.basename;
		}

		options.push({
			direction: "down",
			label: childLabel,
			file: firstChild,
			disabled: !firstChild,
		});

		// LEFT & RIGHT: Previous and Next siblings
		const siblings = await this.findSiblingZettels(currentId);
		const currentIndex = siblings.findIndex(
			(file) => file.path === activeFile.path,
		);

		let prevSibling: TFile | null = null;
		let prevLabel = "No previous sibling";
		if (currentIndex > 0) {
			prevSibling = siblings[currentIndex - 1];
			const prevCache =
				this.plugin.app.metadataCache.getFileCache(prevSibling);
			prevLabel = prevCache?.frontmatter?.title || prevSibling.basename;
		}

		options.push({
			direction: "left",
			label: prevLabel,
			file: prevSibling,
			disabled: !prevSibling,
		});

		let nextSibling: TFile | null = null;
		let nextLabel = "No next sibling";
		if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
			nextSibling = siblings[currentIndex + 1];
			const nextCache =
				this.plugin.app.metadataCache.getFileCache(nextSibling);
			nextLabel = nextCache?.frontmatter?.title || nextSibling.basename;
		}

		options.push({
			direction: "right",
			label: nextLabel,
			file: nextSibling,
			disabled: !nextSibling,
		});

		// PREV/NEXT SEQUENCE: Previous and Next parent-level zettels
		const currentRootId = this.getRootZettelId(currentId);
		const parentZettels = this.getParentLevelZettelsInFolder(
			activeFile.parent,
		);

		let prevSequence: TFile | null = null;
		let prevSequenceLabel = "No previous sequence";
		let nextSequence: TFile | null = null;
		let nextSequenceLabel = "No next sequence";

		if (parentZettels.length > 0) {
			const currentSeqIndex = parentZettels.findIndex(
				(file) => this.extractZettelId(file.basename) === currentRootId,
			);

			if (currentSeqIndex !== -1) {
				// Previous sequence (wrap around)
				const prevIndex =
					(currentSeqIndex - 1 + parentZettels.length) %
					parentZettels.length;
				prevSequence = parentZettels[prevIndex];
				if (prevSequence) {
					const prevSeqCache =
						this.plugin.app.metadataCache.getFileCache(
							prevSequence,
						);
					prevSequenceLabel =
						prevSeqCache?.frontmatter?.title ||
						prevSequence.basename;
				}

				// Next sequence (wrap around)
				const nextIndex = (currentSeqIndex + 1) % parentZettels.length;
				nextSequence = parentZettels[nextIndex];
				if (nextSequence) {
					const nextSeqCache =
						this.plugin.app.metadataCache.getFileCache(
							nextSequence,
						);
					nextSequenceLabel =
						nextSeqCache?.frontmatter?.title ||
						nextSequence.basename;
				}
			}
		}

		options.push({
			direction: "prev-sequence",
			label: prevSequenceLabel,
			file: prevSequence,
			disabled: !prevSequence || prevSequence.path === activeFile.path,
		});

		options.push({
			direction: "next-sequence",
			label: nextSequenceLabel,
			file: nextSequence,
			disabled: !nextSequence || nextSequence.path === activeFile.path,
		});

		return options;
	}

	/**
	 * Adds a link to the parent zettel in the frontmatter of the child file
	 */
	private async addParentLinkToFile(
		childFile: TFile,
		parentFile: TFile,
	): Promise<void> {
		try {
			await this.plugin.app.fileManager.processFrontMatter(
				childFile,
				(frontmatter) => {
					frontmatter.up = `[[${parentFile.basename}]]`;
				},
			);
		} catch (error) {
			console.error("Error adding parent link:", error);
		}
	}

	/**
	 * Gets the target folder for new notes based on settings
	 */
	private getTargetFolder(location: string): TFolder {
		if (location && location.trim() !== "") {
			const folder =
				this.plugin.app.vault.getAbstractFileByPath(location);
			if (folder instanceof TFolder) {
				return folder;
			}
		}

		return this.plugin.app.vault.getRoot();
	}

	/**
	 * Gets the target folder for a specific note type, respecting separate location settings
	 */
	private getNoteTypeFolder(
		useSeparateLocation: boolean,
		separateLocation: string,
	): TFolder {
		// Priority: specific location -> newNoteLocation -> vault root
		let targetLocation = "";

		if (useSeparateLocation && separateLocation) {
			// Use the specific location if enabled and not empty
			targetLocation = separateLocation;
		} else if (this.plugin.settings.newNoteLocation) {
			// Fall back to general newNoteLocation if set
			targetLocation = this.plugin.settings.newNoteLocation;
		}
		// If both are empty, targetLocation stays "", which means vault root

		return this.getTargetFolder(targetLocation);
	}

	/**
	 * Centralized method to check if a zettel ID is available (not in use)
	 */
	private isZettelIdAvailable(
		zettelId: string,
		excludeFile?: TFile,
	): boolean {
		const files = this.plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (excludeFile && file === excludeFile) {
				continue;
			}

			const fileId = this.extractZettelId(file.basename);
			if (fileId === zettelId) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets all existing zettel IDs in the vault
	 */
	private getAllZettelIds(): Set<string> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const ids = new Set<string>();

		for (const file of files) {
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const id = this.extractZettelId(file.basename);
			if (id) {
				ids.add(id);
			}
		}

		return ids;
	}

	/**
	 * Finds the next available child ID, checking for gaps first
	 * This ensures we reuse deleted/moved child IDs before creating new ones
	 */
	private async findNextAvailableChildId(parentId: string): Promise<string> {
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);
		const allIds = this.getAllZettelIds();

		if (shouldUseLetter) {
			// Check for gaps in letter sequence (a-z)
			for (let charCode = 97; charCode <= 122; charCode++) {
				const letter = String.fromCharCode(charCode);
				const candidateId = `${parentId}${letter}`;

				if (!allIds.has(candidateId)) {
					return candidateId;
				}
			}

			// All letters used, this is unusual but return next after z
			new Notice(
				"Warning: All letter slots (a-z) used for this parent. Consider restructuring.",
			);
			return `${parentId}aa`; // Fallback to double letters
		} else {
			// Check for gaps in number sequence (1-999)
			for (let num = 1; num <= 999; num++) {
				const candidateId = `${parentId}${num}`;

				if (!allIds.has(candidateId)) {
					return candidateId;
				}
			}

			// All numbers 1-999 used
			new Notice(
				"Warning: All number slots (1-999) used for this parent. Consider restructuring.",
			);
			return `${parentId}${1000}`; // Fallback to 4-digit numbers
		}
	}

	/**
	 * Generates a zettel ID based on the format in settings
	 * Ensures the ID is unique by checking for collisions
	 */
	private async generateZettelId(): Promise<string> {
		const format = this.plugin.settings.zettelIdFormat || "YYYYMMDDHHmmss";
		let attempts = 0;
		const maxAttempts = 1000;

		while (attempts < maxAttempts) {
			const now = new Date();

			// Simple date format replacement (supports common patterns)
			let id = format;
			const year = now.getFullYear().toString();
			const month = (now.getMonth() + 1).toString().padStart(2, "0");
			const day = now.getDate().toString().padStart(2, "0");
			const hours = now.getHours().toString().padStart(2, "0");
			const minutes = now.getMinutes().toString().padStart(2, "0");
			const seconds = now.getSeconds().toString().padStart(2, "0");
			const milliseconds = now
				.getMilliseconds()
				.toString()
				.padStart(3, "0");

			// Replace date/time tokens
			id = id.replace(/YYYY/g, year);
			id = id.replace(/YY/g, year.slice(-2));
			id = id.replace(/MM/g, month);
			id = id.replace(/DD/g, day);
			id = id.replace(/HH/g, hours);
			id = id.replace(/mm/g, minutes);
			id = id.replace(/ss/g, seconds);
			id = id.replace(/SSS/g, milliseconds);

			// Check if this ID is available
			if (this.isZettelIdAvailable(id)) {
				return id;
			}

			// ID collision - wait 1ms and try again
			attempts++;
			// Add a small delay to ensure timestamp changes
			await new Promise((resolve) => setTimeout(resolve, 1));
		}

		// Fallback: append a random suffix if we somehow still have collisions
		new Notice(
			"Warning: Could not generate unique timestamp. Adding random suffix.",
		);
		const baseId = await this.generateZettelId();
		return `${baseId}-${Math.random().toString(36).substring(7)}`;
	}

	/**
	 * Builds filename based on settings (with or without title)
	 */
	private buildFilename(title: string): string {
		const addTitleToFilename = false;

		if (addTitleToFilename) {
			return `${title}`;
		}

		return title;
	}

	/**
	 * Builds fleeting note filename based on settings
	 */
	private buildFleetingFilename(title: string): string {
		const { fleetingNotesUseZettelId, fleetingNotesFilenameFormat } =
			this.plugin.settings;

		if (fleetingNotesUseZettelId) {
			// Use simple timestamp (no collision checking needed for fleeting notes)
			return this.generateSimpleTimestamp();
		}

		// Use custom format if specified
		if (fleetingNotesFilenameFormat && fleetingNotesFilenameFormat.trim()) {
			return fleetingNotesFilenameFormat.replace("{{title}}", title);
		}

		// Default to just title
		return title;
	}

	/**
	 * Generates a simple timestamp without collision checking
	 * Used for fleeting notes which don't need the robust zettel ID system
	 */
	private generateSimpleTimestamp(): string {
		const format = this.plugin.settings.zettelIdFormat || "YYYYMMDDHHmmss";
		const now = new Date();

		// Simple date format replacement (supports common patterns)
		let id = format;
		const year = now.getFullYear().toString();
		const month = (now.getMonth() + 1).toString().padStart(2, "0");
		const day = now.getDate().toString().padStart(2, "0");
		const hours = now.getHours().toString().padStart(2, "0");
		const minutes = now.getMinutes().toString().padStart(2, "0");
		const seconds = now.getSeconds().toString().padStart(2, "0");
		const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

		// Replace date/time tokens
		id = id.replace(/YYYY/g, year);
		id = id.replace(/YY/g, year.slice(-2));
		id = id.replace(/MM/g, month);
		id = id.replace(/DD/g, day);
		id = id.replace(/HH/g, hours);
		id = id.replace(/mm/g, minutes);
		id = id.replace(/ss/g, seconds);
		id = id.replace(/SSS/g, milliseconds);

		return id;
	}

	/**
	 * Builds Index filename based on settings
	 */
	private buildIndexFilename(title: string): string {
		const { structureNotesUseZettelId, structureNotesFilenameFormat } =
			this.plugin.settings;

		if (structureNotesUseZettelId) {
			// Use zettel ID format
			return title;
		}

		// Use custom format if specified
		if (
			structureNotesFilenameFormat &&
			structureNotesFilenameFormat.trim()
		) {
			return structureNotesFilenameFormat.replace("{{title}}", title);
		}

		// Default to just title
		return title;
	}

	/**
	 * Gets all note titles filtered by tag
	 */
	private async getNoteTitlesByTag(tag: string): Promise<Map<string, TFile>> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const titles = new Map<string, TFile>();

		for (const file of files) {
			// Skip ignored folders
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const cache = this.plugin.app.metadataCache.getFileCache(file);

			// Check if file has the specified tag
			const tags = cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
			const frontmatterTags = cache?.frontmatter?.tags || [];

			// Combine both tag sources
			const allTags = [
				...tags,
				...(Array.isArray(frontmatterTags)
					? frontmatterTags
					: [frontmatterTags].filter(Boolean)),
			].map((t) => String(t).replace("#", ""));

			if (!allTags.includes(tag)) {
				continue;
			}

			// Get title from frontmatter or filename
			const frontmatterTitle = cache?.frontmatter?.title;

			if (frontmatterTitle) {
				titles.set(frontmatterTitle, file);
			} else {
				titles.set(file.basename, file);
			}
		}

		return titles;
	}

	/**
	 * Gets all note titles filtered by tag AND having valid zettel IDs
	 */
	private async getValidZettels(tag: string): Promise<Map<string, TFile>> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const titles = new Map<string, TFile>();

		for (const file of files) {
			// Skip ignored folders
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			// Check if file has a valid zettel ID in filename
			const zettelId = this.extractZettelId(file.basename);
			if (!zettelId) {
				continue;
			}

			const cache = this.plugin.app.metadataCache.getFileCache(file);

			// Check if file has the specified tag
			const tags = cache?.tags?.map((t) => t.tag.replace("#", "")) || [];
			const frontmatterTags = cache?.frontmatter?.tags || [];

			// Combine both tag sources
			const allTags = [
				...tags,
				...(Array.isArray(frontmatterTags)
					? frontmatterTags
					: [frontmatterTags].filter(Boolean)),
			].map((t) => String(t).replace("#", ""));

			if (!allTags.includes(tag)) {
				continue;
			}

			// Get title from frontmatter or filename
			const frontmatterTitle = cache?.frontmatter?.title;

			if (frontmatterTitle) {
				titles.set(frontmatterTitle, file);
			} else {
				titles.set(file.basename, file);
			}
		}

		return titles;
	}

	/**
	 * Gets all note titles from vault, optionally filtered by folder
	 */
	private async getNoteTitlesFromFolder(
		folderPath?: string,
	): Promise<Map<string, TFile>> {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const titles = new Map<string, TFile>();

		for (const file of files) {
			// Skip ignored folders
			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			// Filter by folder if specified
			if (folderPath && folderPath.trim() !== "") {
				const normalizedFolderPath = folderPath.endsWith("/")
					? folderPath.slice(0, -1)
					: folderPath;
				const fileFolder = file.parent?.path || "";

				if (!fileFolder.startsWith(normalizedFolderPath)) {
					continue;
				}
			}

			const cache = this.plugin.app.metadataCache.getFileCache(file);
			const frontmatterTitle = cache?.frontmatter?.title;

			if (frontmatterTitle) {
				titles.set(frontmatterTitle, file);
			} else {
				titles.set(file.basename, file);
			}
		}

		return titles;
	}

	/**
	 * Gets all note titles from vault
	 */
	private async getAllNoteTitles(): Promise<Map<string, TFile>> {
		return this.getNoteTitlesFromFolder();
	}

	/**
	 * Gets currently selected text in active editor
	 */
	private currentlySelectedText(): string | undefined {
		const view =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			return undefined;
		}
		return view.editor.getSelection();
	}

	/**
	 * Checks if a file should be ignored based on ignored folders setting
	 */
	private shouldIgnoreFile(file: TFile): boolean {
		const ignoredFolders = this.plugin.settings.ignoredFolders;

		if (!ignoredFolders || ignoredFolders.length === 0) {
			return false;
		}

		const filePath = file.path.toLowerCase();

		return ignoredFolders.some((folder) => {
			const normalizedFolder = folder.toLowerCase().trim();
			if (!normalizedFolder) return false;

			// Check if file path starts with ignored folder path
			return (
				filePath.startsWith(normalizedFolder + "/") ||
				filePath.startsWith("/" + normalizedFolder + "/") ||
				filePath === normalizedFolder
			);
		});
	}

	/**
	 * Registers the "Reorder Sequence" command
	 * Opens a modal to reorder child zettels of the current zettel
	 * If current zettel is a child, shows the parent's full sequence
	 */
	private registerReorderSequenceCommand(): void {
		this.plugin.addCommand({
			id: "reorder-sequence",
			name: "Reorder Sequence (Alpha)",
			icon: "list-ordered",
			checkCallback: (checking: boolean) => {
				// Check if the feature is enabled
				if (!this.plugin.settings.enableNoteSequence) {
					return false;
				}

				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					return false;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Determine which parent to use for the sequence
				let parentId = currentId;
				let parentFile = activeFile;

				// Check if current note is a child (has a parent)
				const parentIdCandidate = this.getParentZettelId(currentId);
				if (parentIdCandidate) {
					// This is a child note - find the parent file
					const files = this.plugin.app.vault.getMarkdownFiles();
					for (const file of files) {
						const fileId = this.extractZettelId(file.basename);
						if (fileId === parentIdCandidate) {
							parentId = parentIdCandidate;
							parentFile = file;
							break;
						}
					}
				}

				// Get all child zettels of the parent
				const childNotes = this.getChildZettels(parentId);

				if (childNotes.length === 0) {
					new Notice("No child notes to reorder");
					return true;
				}

				// Open reorder modal
				new SequenceReorderModal(
					this.plugin.app,
					parentFile,
					childNotes,
					async (
						reorderedNotes: TFile[],
						promoted: TFile[],
						indentLevels: Map<TFile, number>,
						compactRequested: boolean,
					) => {
						try {
							await this.handleSequenceReorder(
								parentFile,
								parentId,
								reorderedNotes,
								promoted,
								indentLevels,
								compactRequested,
							);
						} catch (error) {
							new Notice(
								`Error reordering sequence: ${error.message}`,
							);
						}
					},
				).open();

				return true;
			},
		});
	}

	/**
	 * Gets the root zettel ID (without any suffix)
	 * Example: "20251114154532123a1" → "20251114154532123"
	 */
	private getRootZettelId(zettelId: string): string {
		// Extract just the numeric timestamp (13+ digits)
		const match = zettelId.match(/^(\d{13,})/);
		return match ? match[1] : zettelId;
	}

	/**
	 * Gets all child zettels of a given parent ID (synchronous version)
	 */
	private getChildZettels(parentId: string): TFile[] {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const children: TFile[] = [];

		// Create regex pattern to match direct children
		const shouldUseLetter = this.shouldUseLetterForChild(parentId);

		let childPattern: RegExp;
		if (shouldUseLetter) {
			// Match one or more letters (to include aa, ab, etc.) but no numbers after
			childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}[a-z]+(?![0-9])`,
			);
		} else {
			childPattern = new RegExp(
				`^${this.escapeRegex(parentId)}\\d+(?![a-z])`,
			);
		}

		for (const file of files) {
			if (this.shouldIgnoreFile(file)) {
				continue;
			}
			const fileId = this.extractZettelId(file.basename);
			if (fileId && childPattern.test(fileId)) {
				children.push(file);
			}
		}

		// Sort children by ID
		children.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return children;
	}

	/**
	 * Gets all descendants of a given zettel ID recursively
	 */
	private getAllDescendants(zettelId: string): TFile[] {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const descendants: TFile[] = [];

		for (const file of files) {
			if (this.shouldIgnoreFile(file)) {
				continue;
			}
			const fileId = this.extractZettelId(file.basename);
			if (!fileId) {
				continue;
			}

			// Check if this file's ID starts with the parent ID and has additional suffixes
			if (fileId.startsWith(zettelId) && fileId.length > zettelId.length) {
				descendants.push(file);
			}
		}

		return descendants;
	}

	/**
	 * Handles the reordering of a sequence based on modal results
	 */
	/**
	 * Handles sequence reordering with automatic ID compaction.
	 * IDs are always compacted to sequential values (a,b,c... or 1,2,3...) to fill gaps.
	 */
	private async handleSequenceReorder(
		parentFile: TFile,
		parentId: string,
		reorderedNotes: TFile[],
		promoted: TFile[],
		indentLevels: Map<TFile, number>,
		compactRequested: boolean = true, // Always compact by default
	): Promise<void> {
		const folder = parentFile.parent || this.plugin.app.vault.getRoot();

		// Note: ID compaction happens automatically as part of the reordering process.
		// The letterMap and numberMap ensure sequential assignment (a,b,c... or 1,2,3...)
		// regardless of the compactRequested flag, maintaining note sequence integrity.

		// Handle promoted notes first (notes that became siblings of parent)
		const tempPromotedPrefix = `_temp_promoted_${Date.now()}_`;
		const promotedTempNames = new Map<TFile, string>();

		// First, move promoted notes to temp names to avoid collisions
		for (let i = 0; i < promoted.length; i++) {
			const promotedFile = promoted[i];
			const tempPath = `${folder.path}/${tempPromotedPrefix}${i}.md`;
			await this.plugin.app.fileManager.renameFile(
				promotedFile,
				tempPath,
			);
			promotedTempNames.set(promotedFile, `${tempPromotedPrefix}${i}`);
		}

		// Then rename to final promoted names
		for (const promotedFile of promoted) {
			const grandparentId = this.getParentZettelId(parentId);
			if (grandparentId) {
				const newId = await this.generateChildZettelId(
					grandparentId,
					folder,
					promotedFile,
				);
				const newPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(
					promotedFile,
					newPath,
				);
			} else {
				// No grandparent - promote to root level (new sequence)
				const newId = await this.generateZettelId();
				const newPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(
					promotedFile,
					newPath,
				);
			}
		}

		// Three-pass rename to avoid collisions
		// Pass 1: Calculate all new IDs first (for direct children and all descendants)
		const newIds = new Map<TFile, string>();
		const letterMap = new Map<string, string>(); // Track letter assignments per parent
		const numberMap = new Map<string, number>(); // Track number assignments per parent

		// Calculate new IDs for direct children (notes in the modal)
		for (let i = 0; i < reorderedNotes.length; i++) {
			const file = reorderedNotes[i];
			const level = indentLevels.get(file) || 1;

			// Determine the actual parent for this note based on indent level
			let actualParentId = parentId;

			if (level > 1) {
				// Find the previous note with level = current level - 1
				for (let j = i - 1; j >= 0; j--) {
					const prevFile = reorderedNotes[j];
					const prevLevel = indentLevels.get(prevFile) || 1;

					if (prevLevel === level - 1) {
						// Use the new ID that we already calculated for the previous file
						actualParentId = newIds.get(prevFile) || parentId;
						break;
					}
				}
			}

			// Generate new ID based on actual parent
			const shouldUseLetter =
				this.shouldUseLetterForChild(actualParentId);
			let newId: string;

			if (shouldUseLetter) {
				// Get next available letter for this parent
				const currentLetter = letterMap.get(actualParentId) || "a";
				newId = actualParentId + currentLetter;
				// Move to next letter, handling sequences beyond 'z'
				letterMap.set(
					actualParentId,
					this.getNextLetter(currentLetter),
				);
			} else {
				// Get next available number for this parent
				const currentNum = numberMap.get(actualParentId) || 1;
				newId = actualParentId + currentNum;
				numberMap.set(actualParentId, currentNum + 1);
			}

			newIds.set(file, newId);
		}

		// Now calculate new IDs for all descendants of renamed notes
		const allFilesToRename: TFile[] = [];
		for (const file of reorderedNotes) {
			const oldId = this.extractZettelId(file.basename);
			const newId = newIds.get(file);

			if (oldId && newId && oldId !== newId) {
				// This note is being renamed, so we need to rename all its descendants too
				allFilesToRename.push(file);

				const descendants = this.getAllDescendants(oldId);
				for (const descendant of descendants) {
					const descendantId = this.extractZettelId(descendant.basename);
					if (descendantId) {
						// Replace the old parent ID prefix with the new one
						const descendantNewId = descendantId.replace(oldId, newId);
						newIds.set(descendant, descendantNewId);
						allFilesToRename.push(descendant);
					}
				}
			} else {
				// Note is not being renamed, but still include it in the list
				allFilesToRename.push(file);
			}
		}

		// Check if we need to rename the parent too
		const parentCurrentId = this.extractZettelId(parentFile.basename);
		if (parentCurrentId && parentCurrentId !== parentId) {
			// Parent has been renamed (it was in the child list and got a new ID)
			allFilesToRename.push(parentFile);
		}

		// Pass 2: Rename all files (direct children + descendants) to temporary names
		const tempPrefix = `_temp_reorder_${Date.now()}_`;
		for (let i = 0; i < allFilesToRename.length; i++) {
			const file = allFilesToRename[i];
			const tempPath = `${folder.path}/${tempPrefix}${i}.md`;
			await this.plugin.app.fileManager.renameFile(file, tempPath);
		}

		// Pass 3: Rename from temp names to final names (direct children + descendants)
		for (const file of allFilesToRename) {
			const newId = newIds.get(file);
			if (newId) {
				const finalPath = `${folder.path}/${newId}.md`;
				await this.plugin.app.fileManager.renameFile(file, finalPath);
			}
		}
	}

	/**
	 * Gets the next letter in sequence, handling beyond 'z' by using double letters (aa, ab, ac...)
	 * Examples: a → b, z → aa, aa → ab, az → ba, zz → aaa
	 */
	private getNextLetter(current: string): string {
		// Convert string to array of character codes
		const chars = current.split("");

		// Start from the rightmost character
		for (let i = chars.length - 1; i >= 0; i--) {
			if (chars[i] === "z") {
				// If it's 'z', change to 'a' and continue to next position
				chars[i] = "a";
				if (i === 0) {
					// We've rolled over all positions, add another 'a' at the start
					return "a" + chars.join("");
				}
			} else {
				// Increment this character and we're done
				chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
				return chars.join("");
			}
		}

		// Fallback (shouldn't reach here)
		return "a";
	}

	/**
	 * Gets all parent-level zettels in a specific folder
	 * Parent-level means IDs with no suffix (just the timestamp)
	 */
	private getParentLevelZettelsInFolder(folder: TFolder | null): TFile[] {
		if (!folder) {
			return [];
		}

		const allFiles = this.plugin.app.vault.getMarkdownFiles();
		const parentZettels: TFile[] = [];

		for (const file of allFiles) {
			// Check if file is in the same folder
			if (file.parent?.path !== folder.path) {
				continue;
			}

			if (this.shouldIgnoreFile(file)) {
				continue;
			}

			const id = this.extractZettelId(file.basename);
			if (!id) {
				continue;
			}

			// Check if this is a parent-level zettel (ID is just numbers, no suffix)
			if (/^\d+$/.test(id)) {
				parentZettels.push(file);
			}
		}

		// Sort by ID (chronological order)
		parentZettels.sort((a, b) => {
			const idA = this.extractZettelId(a.basename) || "";
			const idB = this.extractZettelId(b.basename) || "";
			return idA.localeCompare(idB);
		});

		return parentZettels;
	}

	/**
	 * Registers the "Next Sequence" command
	 * Opens the next parent-level zettel in the current folder
	 */
	private registerNextSequenceCommand(): void {
		this.plugin.addCommand({
			id: "next-sequence",
			name: "Go to Next Sequence",
			icon: "chevron-right",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Get the root ID (parent-level, no suffix)
				const currentRootId = this.getRootZettelId(currentId);

				// Find all parent-level zettels in the same folder
				const parentZettels = this.getParentLevelZettelsInFolder(
					activeFile.parent,
				);

				if (parentZettels.length === 0) {
					new Notice("No sequences found in this folder");
					return;
				}

				// Find current sequence index
				const currentIndex = parentZettels.findIndex(
					(file) =>
						this.extractZettelId(file.basename) === currentRootId,
				);

				if (currentIndex === -1) {
					new Notice("Could not find current sequence");
					return;
				}

				// Get next sequence (wrap around to first if at end)
				const nextIndex = (currentIndex + 1) % parentZettels.length;
				const nextFile = parentZettels[nextIndex];

				if (nextFile) {
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(nextFile);
				}
			},
		});
	}

	/**
	 * Registers the "Previous Sequence" command
	 * Opens the previous parent-level zettel in the current folder
	 */
	private registerPreviousSequenceCommand(): void {
		this.plugin.addCommand({
			id: "previous-sequence",
			name: "Go to Previous Sequence",
			icon: "chevron-left",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Get the root ID (parent-level, no suffix)
				const currentRootId = this.getRootZettelId(currentId);

				// Find all parent-level zettels in the same folder
				const parentZettels = this.getParentLevelZettelsInFolder(
					activeFile.parent,
				);

				if (parentZettels.length === 0) {
					new Notice("No sequences found in this folder");
					return;
				}

				// Find current sequence index
				const currentIndex = parentZettels.findIndex(
					(file) =>
						this.extractZettelId(file.basename) === currentRootId,
				);

				if (currentIndex === -1) {
					new Notice("Could not find current sequence");
					return;
				}

				// Get previous sequence (wrap around to last if at start)
				const prevIndex =
					(currentIndex - 1 + parentZettels.length) %
					parentZettels.length;
				const prevFile = parentZettels[prevIndex];

				if (prevFile) {
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(prevFile);
				}
			},
		});
	}

	/**
	 * Registers the "Next Child" command
	 * Opens the next sibling zettel, or first child if at a parent level
	 */
	private registerNextChildCommand(): void {
		this.plugin.addCommand({
			id: "next-child",
			name: "Go to Next Child",
			icon: "arrow-down-right",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Check if current note has a parent (is a child itself)
				const parentId = this.getParentZettelId(currentId);

				if (parentId) {
					// We're at a child level, navigate to next sibling
					console.log("Next Child - Has parent, finding siblings");
					const siblings = await this.findChildZettels(parentId);
					console.log(
						"Next Child - Found siblings:",
						siblings.length,
					);
					siblings.forEach((s) =>
						console.log("  - Sibling:", s.basename),
					);

					if (siblings.length === 0) {
						new Notice("No sibling zettels found");
						return;
					}

					// Find current position
					const currentIndex = siblings.findIndex(
						(file) => file.path === activeFile.path,
					);
					console.log(
						"Next Child - Current index in siblings:",
						currentIndex,
					);

					if (currentIndex === -1) {
						new Notice("Could not find current zettel in siblings");
						return;
					}

					// Get next sibling (wrap around to first if at end)
					const nextIndex = (currentIndex + 1) % siblings.length;
					console.log(
						"Next Child - Next index:",
						nextIndex,
						"File:",
						siblings[nextIndex].basename,
					);
					const nextFile = siblings[nextIndex];

					if (nextFile) {
						await this.plugin.app.workspace
							.getLeaf()
							.openFile(nextFile);
					}
				} else {
					// We're at parent level, navigate to first child
					console.log("Next Child - No parent, finding children");
					const children = await this.findChildZettels(currentId);
					console.log(
						"Next Child - Found children:",
						children.length,
					);
					children.forEach((c) =>
						console.log("  - Child:", c.basename),
					);

					if (children.length === 0) {
						new Notice("No child zettels found");
						return;
					}

					// Open first child
					console.log(
						"Next Child - Opening first child:",
						children[0].basename,
					);
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(children[0]);
				}
			},
		});
	}

	/**
	 * Registers the "Previous Child" command
	 * Opens the previous sibling zettel
	 */
	private registerPreviousChildCommand(): void {
		this.plugin.addCommand({
			id: "previous-child",
			name: "Go to Previous Child",
			icon: "arrow-up-left",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				console.log("Next Child - Current ID:", currentId);
				console.log(
					"Next Child - Current filename:",
					activeFile.basename,
				);

				// Get parent ID
				const parentId = this.getParentZettelId(currentId);
				console.log("Next Child - Parent ID:", parentId);
				if (!parentId) {
					new Notice(
						"This zettel has no parent - cannot navigate to previous sibling",
					);
					return;
				}

				// Find all children of the parent (siblings)
				const siblings = await this.findChildZettels(parentId);

				if (siblings.length === 0) {
					new Notice("No sibling zettels found");
					return;
				}

				// Find current position
				const currentIndex = siblings.findIndex(
					(file) => file.path === activeFile.path,
				);

				if (currentIndex === -1) {
					new Notice("Could not find current zettel in siblings");
					return;
				}

				// Get previous sibling (wrap around to last if at start)
				const prevIndex =
					(currentIndex - 1 + siblings.length) % siblings.length;
				const prevFile = siblings[prevIndex];

				if (prevFile) {
					await this.plugin.app.workspace
						.getLeaf()
						.openFile(prevFile);
				}
			},
		});
	}

	/**
	 * Registers the "Go Up a Level" command
	 * Navigates from a child zettel to its parent
	 */
	private registerGoUpLevelCommand(): void {
		this.plugin.addCommand({
			id: "go-up-level",
			name: "Go Up a Level",
			icon: "arrow-up",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Get parent ID
				const parentId = this.getParentZettelId(currentId);
				if (!parentId) {
					new Notice(
						"This zettel has no parent - already at root level",
					);
					return;
				}

				// Find the parent file
				const files = this.plugin.app.vault.getMarkdownFiles();
				const parentFile = files.find((file) => {
					const fileId = this.extractZettelId(file.basename);
					return fileId === parentId;
				});

				if (!parentFile) {
					new Notice(`Parent zettel not found: ${parentId}`);
					return;
				}

				// Open parent file
				await this.plugin.app.workspace.getLeaf().openFile(parentFile);
			},
		});
	}

	/**
	 * Registers the "Go Down a Level" command
	 * Navigates from a parent zettel to its first child
	 */
	private registerGoDownLevelCommand(): void {
		this.plugin.addCommand({
			id: "go-down-level",
			name: "Go Down a Level",
			icon: "arrow-down",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();

				if (!activeFile) {
					new Notice("No active file");
					return;
				}

				const currentId = this.extractZettelId(activeFile.basename);
				if (!currentId) {
					new Notice("Current file is not a zettel");
					return;
				}

				// Find children
				const children = await this.findChildZettels(currentId);

				if (children.length === 0) {
					new Notice("No child zettels found");
					return;
				}

				// Open first child
				await this.plugin.app.workspace.getLeaf().openFile(children[0]);
			},
		});
	}

	/**
	 * Registers the "Add Title to Aliases" command
	 */
	private registerAddTitleToAliasesCommand(): void {
		this.plugin.addCommand({
			id: "add-title-to-aliases",
			name: "Add Title to Aliases",
			icon: "tag",
			callback: async () => {
				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice("No active file.");
					return;
				}

				const added = await this.addTitleToAliases(activeFile);
				if (added) {
					new Notice("Title added to aliases.");
				} else {
					new Notice("Title already in aliases.");
				}
			},
		});
	}

	/**
	 * Adds the note's title to its aliases array if not already present
	 */
	private async addTitleToAliases(file: TFile): Promise<boolean> {
		const content = await this.plugin.app.vault.read(file);
		const cache = this.plugin.app.metadataCache.getFileCache(file);

		// Get the title from frontmatter
		const title = cache?.frontmatter?.title;
		if (!title) {
			new Notice("No title found in frontmatter.");
			return false;
		}

		// Get existing aliases
		let aliases: string[] = [];
		if (cache?.frontmatter?.aliases) {
			if (Array.isArray(cache.frontmatter.aliases)) {
				aliases = cache.frontmatter.aliases;
			} else {
				aliases = [cache.frontmatter.aliases];
			}
		}

		// Check if title is already in aliases
		if (aliases.includes(title)) {
			return false;
		}

		// Add title to aliases
		aliases.push(title);

		// Update the frontmatter
		await this.updateFrontmatterAliases(file, content, aliases);
		return true;
	}

	/**
	 * Updates the aliases in the frontmatter
	 */
	private async updateFrontmatterAliases(
		file: TFile,
		content: string,
		aliases: string[],
	): Promise<void> {
		const lines = content.split("\n");
		let inFrontmatter = false;
		let frontmatterStart = -1;
		let frontmatterEnd = -1;
		let aliasesLineStart = -1;
		let aliasesLineEnd = -1;

		// Find frontmatter boundaries
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim() === "---") {
				if (frontmatterStart === -1) {
					frontmatterStart = i;
					inFrontmatter = true;
				} else if (inFrontmatter) {
					frontmatterEnd = i;
					break;
				}
			}
		}

		// Find existing aliases in frontmatter
		if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
			for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
				const line = lines[i].trim();
				if (line.startsWith("aliases:") || line.startsWith("alias:")) {
					aliasesLineStart = i;
					// Check if it's a single-line or multi-line array
					if (line.includes("[") && line.includes("]")) {
						// Single-line array
						aliasesLineEnd = i;
					} else {
						// Multi-line array - find the end
						for (let j = i + 1; j < frontmatterEnd; j++) {
							if (
								!lines[j].trim().startsWith("-") &&
								lines[j].trim() !== ""
							) {
								aliasesLineEnd = j - 1;
								break;
							}
						}
						if (aliasesLineEnd === -1) {
							aliasesLineEnd = frontmatterEnd - 1;
						}
					}
					break;
				}
			}
		}

		// Build new aliases string
		const aliasesYaml = aliases
			.map((alias) => `  - ${JSON.stringify(alias)}`)
			.join("\n");
		const newAliasesLines = [`aliases:`, ...aliasesYaml.split("\n")];

		// Update or add aliases
		if (aliasesLineStart !== -1) {
			// Replace existing aliases
			lines.splice(
				aliasesLineStart,
				aliasesLineEnd - aliasesLineStart + 1,
				...newAliasesLines,
			);
		} else if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
			// Add aliases to existing frontmatter
			lines.splice(frontmatterEnd, 0, ...newAliasesLines);
		} else {
			// Create new frontmatter with aliases
			const newFrontmatter = ["---", ...newAliasesLines, "---", ""];
			lines.splice(0, 0, ...newFrontmatter);
		}

		const newContent = lines.join("\n");
		await this.plugin.app.vault.modify(file, newContent);
	}

	/**
	 * Registers the "Bookmark Active File" command
	 */
	private registerBookmarkActiveFileCommand(): void {
		this.plugin.addCommand({
			id: "bookmark-active-file",
			name: "Bookmark active file",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableZettelkastenPanel) {
					return false;
				}

				if (checking) {
					return true;
				}

				const activeFile = this.plugin.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice("No active file to bookmark");
					return true;
				}

				// Check if already bookmarked
				const existingBookmark =
					this.plugin.settings.panelBookmarks.find(
						(b) => b.path === activeFile.path,
					);

				if (existingBookmark) {
					new Notice("File is already bookmarked");
					return;
				}

				// Get the file title from frontmatter or use basename
				const cache =
					this.plugin.app.metadataCache.getFileCache(activeFile);
				const title = cache?.frontmatter?.title || activeFile.basename;

				// Add bookmark
				this.plugin.settings.panelBookmarks.push({
					type: "file",
					path: activeFile.path,
					title: title,
				});

				// Save settings asynchronously
				this.plugin.saveSettings().then(() => {
					new Notice(`Bookmarked: ${title}`);
				});

				return true;
			},
		});
	}

	private registerBookmarkCurrentSearchCommand(): void {
		this.plugin.addCommand({
			id: "bookmark-current-search",
			name: "Bookmark current search",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableZettelkastenPanel) {
					return false;
				}

				if (checking) {
					return true;
				}

				// Get the search leaf
				const searchLeaves =
					this.plugin.app.workspace.getLeavesOfType("search");
				if (searchLeaves.length === 0) {
					new Notice("No active search view");
					return true;
				}

				const searchLeaf = searchLeaves[0];
				// @ts-ignore - accessing internal API
				const query = searchLeaf.view?.getQuery?.() || "";

				if (!query) {
					new Notice("No search query found");
					return;
				}

				// Check if already bookmarked
				const existingBookmark =
					this.plugin.settings.panelBookmarks.find(
						(b) => b.type === "search" && b.query === query,
					);

				if (existingBookmark) {
					new Notice("Search is already bookmarked");
					return;
				}

				// Add bookmark with query as title (user can edit in settings)
				this.plugin.settings.panelBookmarks.push({
					type: "search",
					query: query,
					title: query,
				});

				// Save settings asynchronously
				this.plugin.saveSettings().then(() => {
					new Notice(`Bookmarked search: ${query}`);
				});

				return true;
			},
		});
	}

	private registerBookmarkGraphCommand(): void {
		this.plugin.addCommand({
			id: "bookmark-graph",
			name: "Bookmark this graph",
			checkCallback: (checking: boolean) => {
				if (!this.plugin.settings.enableZettelkastenPanel) {
					return false;
				}

				// Only show command when graph view is active
				const graphLeaves =
					this.plugin.app.workspace.getLeavesOfType("graph");
				const localGraphLeaves =
					this.plugin.app.workspace.getLeavesOfType("localgraph");
				const hasGraphView =
					graphLeaves.length > 0 || localGraphLeaves.length > 0;

				if (checking) {
					return hasGraphView;
				}

				if (!hasGraphView) {
					new Notice("No active graph view");
					return false;
				}

				// Check if graph is already bookmarked
				const existingBookmark =
					this.plugin.settings.panelBookmarks.find(
						(b) => b.type === "graph",
					);

				if (existingBookmark) {
					new Notice("Graph is already bookmarked");
					return false;
				}

				// Determine graph type and title
				let title = "Graph View";
				if (localGraphLeaves.length > 0) {
					// Local graph - try to get the file context
					const activeFile =
						this.plugin.app.workspace.getActiveFile();
					if (activeFile) {
						title = `Local Graph: ${activeFile.basename}`;
					} else {
						title = "Local Graph";
					}
				}

				// Add bookmark
				this.plugin.settings.panelBookmarks.push({
					type: "graph",
					title: title,
				});

				// Save settings asynchronously
				this.plugin.saveSettings().then(() => {
					new Notice(`Bookmarked: ${title}`);
				});

				return true;
			},
		});
	}

	/**
	 * Registers the "Toggle Sequence Navigator" command
	 */
	private registerToggleSequenceNavigatorCommand(): void {
		this.plugin.addCommand({
			id: "toggle-sequence-navigator",
			name: "Toggle Note Sequence Navigator",
			icon: "list-tree",
			callback: async () => {
				const { workspace } = this.plugin.app;
				const leaves = workspace.getLeavesOfType(
					"sequence-navigator-view",
				);

				if (leaves.length > 0) {
					// Close the view
					leaves.forEach((leaf) => leaf.detach());
					new Notice("Sequence Navigator closed");
				} else {
					// Open the view
					await this.plugin.activateSequenceNavigator();
					new Notice("Sequence Navigator opened");
				}
			},
		});
	}
}

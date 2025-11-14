import { App, TFile, WorkspaceLeaf } from "obsidian";

// Configuration options for file creation
export interface FileCreatorOptions {
	// Path where the file will be created
	readonly path: string;
	// Title of the note (used as content header)
	readonly title: string;
	// Optional template file path
	readonly templatePath?: string;
	// Whether to open the file after creation
	readonly shouldOpen?: boolean;
	// Optional callback executed after successful creation
	readonly onSuccess?: () => void;
	// Optional callback executed on error
	readonly onError?: (error: Error) => void;
}

// Result of file creation operation
export interface FileCreationResult {
	readonly success: boolean;
	readonly file: TFile | null;
	readonly error?: Error;
}

// Handles creation of markdown files in Obsidian vault
export class FileCreator {
	private readonly app: App;
	private readonly options: FileCreatorOptions & {
		shouldOpen: boolean;
		onSuccess: () => void;
		onError: (error: Error) => void;
	};

	constructor(
		app: App,
		path: string,
		title: string,
		onSuccess: () => void = () => {},
		templatePath?: string,
	) {
		this.app = app;
		this.options = {
			path,
			title,
			templatePath,
			shouldOpen: true,
			onSuccess,
			onError: () => {},
		};
	}

	// Static factory method with explicit options
	static withOptions(app: App, options: FileCreatorOptions): FileCreator {
		const instance = Object.create(FileCreator.prototype);
		instance.app = app;
		instance.options = {
			shouldOpen: true,
			onSuccess: () => {},
			onError: () => {},
			...options,
		};
		return instance;
	}

	// Creates the file and optionally opens it
	async create(): Promise<FileCreationResult> {
		try {
			const file = await this.createFile();

			if (this.options.shouldOpen) {
				await this.openFile(file);
			}

			this.options.onSuccess();

			return {
				success: true,
				file,
			};
		} catch (error) {
			const err =
				error instanceof Error ? error : new Error(String(error));
			this.options.onError(err);

			return {
				success: false,
				file: null,
				error: err,
			};
		}
	}

	// Creates the file with formatted content
	private async createFile(): Promise<TFile> {
		const content = await this.buildFileContent();
		return await this.app.vault.create(this.options.path, content);
	}

	// Builds the file content with title and backlink
	private async buildFileContent(): Promise<string> {
		// If template is specified, use it
		if (this.options.templatePath) {
			const templateContent = await this.readTemplate();
			if (templateContent) {
				return this.processTemplate(templateContent);
			}
		}

		// Fallback to basic title
		const titleContent = this.formatTitle();
		const parts: string[] = [];

		if (titleContent) {
			parts.push(titleContent);
		}

		return parts.join("\n\n");
	}

	// Reads the template file content
	private async readTemplate(): Promise<string | null> {
		if (!this.options.templatePath) {
			return null;
		}

		try {
			const file = this.app.vault.getAbstractFileByPath(
				this.options.templatePath,
			);
			if (file instanceof TFile) {
				return await this.app.vault.read(file);
			}
		} catch (error) {
			console.error(
				`Failed to read template: ${this.options.templatePath}`,
				error,
			);
		}

		return null;
	}

	// Processes template content, replacing placeholders
	private processTemplate(template: string): string {
		const now = new Date();

		// Replace common placeholders
		let content = template;
		content = content.replace(/{{title}}/g, this.options.title);
		content = content.replace(/{{date}}/g, now.toISOString().split("T")[0]);
		content = content.replace(
			/{{time}}/g,
			now.toTimeString().split(" ")[0],
		);
		content = content.replace(
			/{{datetime}}/g,
			now.toISOString().replace("T", " ").split(".")[0],
		);

		return content;
	}

	// Formats the title, trimming leading whitespace
	private formatTitle(): string {
		return this.options.title?.trim() || "";
	}

	// Opens the file in the active leaf
	private async openFile(file: TFile): Promise<void> {
		const leaf = this.getActiveLeaf();

		if (!leaf) {
			throw new Error("No active workspace leaf available");
		}

		await leaf.openFile(file);
	}

	// Gets the active workspace leaf
	private getActiveLeaf(): WorkspaceLeaf | null {
		return this.app.workspace.getLeaf();
	}
}

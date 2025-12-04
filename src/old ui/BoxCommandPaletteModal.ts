import { App, FuzzySuggestModal } from "obsidian";

export interface BoxCommand {
	id: string;
	name: string;
	icon?: string;
	callback: () => void;
}

export class BoxCommandPaletteModal extends FuzzySuggestModal<BoxCommand> {
	private commands: BoxCommand[];
	private boxName: string;

	constructor(app: App, boxName: string, commands: BoxCommand[]) {
		super(app);
		this.boxName = boxName;
		this.commands = commands;
		this.setPlaceholder(`${boxName}: Type to search commands...`);
	}

	getItems(): BoxCommand[] {
		return this.commands;
	}

	getItemText(command: BoxCommand): string {
		return command.name;
	}

	onChooseItem(command: BoxCommand, evt: MouseEvent | KeyboardEvent): void {
		command.callback();
	}
}

import { Interaction } from 'discord.js';

interface ICommandOptions {
    name: string;
    description: string;
}

export abstract class Command {
    public id: number;
    public options: ICommandOptions;
    constructor(id: number, options: ICommandOptions) {
        this.id = id;
        this.options = options;
    }

    abstract execute(interaction: Interaction): Promise<void>;
}

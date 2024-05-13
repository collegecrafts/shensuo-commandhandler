import { Plugin } from '@shensuo/core';
import { Client, Collection } from 'discord.js';
import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Command } from './command.js';

interface ICommandHandlerOptions {
    directory: string;
    variants?: ICommandHandlerVairants;
}

interface ICommandHandlerVairants {
    subdirectories?: boolean;
    fileTypes?: string[];
}

export class CommandHandler extends Plugin {
    #directory: string;
    #variants?: ICommandHandlerVairants;

    public commands: Collection<number, Command>;

    constructor(id: number, options: ICommandHandlerOptions) {
        super({ id });

        this.#directory = options.directory;
        this.#variants = options.variants;
        this.commands = new Collection();
    }

    override async handler(client: Client): Promise<void> {
        const files = await this.#getFiles(this.#directory, this.#variants?.subdirectories);

        for (const file of files) {
            if (!this.#variants?.fileTypes?.includes(file.split('.')[1]!))
                throw Error('You have an unsupported file type in your commands folder');

            const filepath = resolve(this.#directory, file);

            const importedCommand = new (require(filepath))();

            if (!(importedCommand instanceof Command))
                throw new Error(`${file} class doesn't extend the Command Class`);

            this.commands.set(importedCommand.id, importedCommand);
        }

        this.#interactionCreate(client);
    }

    async checkAndUpdateCommands() {
        // This will be used for uploading the commands in this.commands to discord!
    }

    async #interactionCreate(client: Client) {
        // This will handle the interaction create event!

        while (!client.isReady());
    }

    async #getFiles(directory: string, subdirectories?: boolean): Promise<string[]> {
        if (subdirectories) {
            const dirents: Dirent[] = await readdir(directory, { withFileTypes: true });
            const names: string[] = [];

            for (const dirent of dirents) {
                if (dirent.isDirectory()) {
                    const subnames = await this.#getFiles(
                        join(directory, dirent.name),
                        subdirectories
                    );

                    names.push(...subnames.map((subname) => join(dirent.name, subname)));
                } else if (dirent.isFile()) names.push(dirent.name);
            }
            
            return names;
        } else {
            return await readdir(directory);
        }
    }
}

declare module 'discord.js' {
    export interface ClientEvents {
        commandsLoaded: [commands: number];
    }
}

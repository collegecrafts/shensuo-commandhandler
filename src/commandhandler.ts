import { Plugin } from '@shensuo/core';
import { Client, Collection, Interaction, REST, Routes } from 'discord.js';
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

    constructor(name: string, options: ICommandHandlerOptions) {
        super({ name });

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

            const importedCommand = new (await import(filepath)).default();

            if (!(importedCommand instanceof Command))
                throw new Error(`${file} class doesn't extend the Command Class`);

            this.commands.set(importedCommand.id, importedCommand);
        }

        this.#interactionCreate(client);
    }

    async checkAndUpdateCommands(client: Client, guildId?: string) {
        new REST()
            .setToken(client.token!)
            .put(
                guildId
                    ? Routes.applicationGuildCommands(client.user?.id!, guildId)
                    : Routes.applicationCommands(client.user?.id!),
                {
                    body: this.commands.map((c) => c.toJSON()),
                }
            );
    }

    async #interactionCreate(client: Client) {
        client.on('interactionCreate', async (interaction: Interaction) => {
            if (interaction.isChatInputCommand()) {
                const command = this.commands.find(
                    (c) => c.options.name === interaction.commandName
                );

                if (!command) return;

                await command.execute(interaction);
            }
        });
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

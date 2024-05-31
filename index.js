const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const { token, defaultGuildId, additionalGuildIds, openaiApiKey } = require('./config.json');

// Importuj komendy slash
const cdCommand = require('./commands/cd');
const clearcdCommand = require('./commands/clearcd');
const robloxCommand = require('./commands/roblox');
const verifyCommand = require('./commands/verify');
const whoisCommand = require('./commands/whois');
const checkCommand = require('./commands/check');
const dodajCommand = require('./commands/dodaj');
const usunCommand = require('./commands/usun');
const stanCommand = require('./commands/stan');
const wezwijCommand = require('./commands/wezwij');
const klubdodajCommand = require('./commands/klub-dodaj');
const wzmienCommand = require('./commands/wzmien');
const klubusunCommand = require('./commands/klub-usun');
const xpCommand = require('./commands/xp');

// Stwórz nową instancję klienta
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const targetChannelId = '1245862175885627493'; // ID kanału, na którym bot będzie odpowiadał
const openaiApiUrl = 'https://api.openai.com/v1/completions'; // URL API OpenAI

// Funkcja do generowania odpowiedzi za pomocą OpenAI API
async function generateResponse(prompt) {
    try {
        const response = await axios.post(openaiApiUrl, {
            model: 'text-davinci-003', // Użyj odpowiedniego modelu OpenAI, np. 'text-davinci-003'
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.9,
            n: 1,
            stop: null,
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Błąd podczas generowania odpowiedzi:', error);
        return "Przepraszam, wystąpił błąd podczas generowania odpowiedzi.";
    }
}

// Przypisz komendy do klienta
client.commands = new Map([
  [cdCommand.data.name, cdCommand],
  [clearcdCommand.data.name, clearcdCommand],
  [robloxCommand.data.name, robloxCommand],
  [verifyCommand.data.name, verifyCommand],
  [whoisCommand.data.name, whoisCommand],
  [checkCommand.data.name, checkCommand],
  [dodajCommand.data.name, dodajCommand],
  [usunCommand.data.name, usunCommand],
  [stanCommand.data.name, stanCommand],
  [wezwijCommand.data.name, wezwijCommand],
  [klubdodajCommand.data.name, klubdodajCommand],
  [wzmienCommand.data.name, wzmienCommand],
  [klubusunCommand.data.name, klubusunCommand],
  [xpCommand.data.name, xpCommand],
]);

// Gdy klient jest gotowy, wykonaj ten kod (tylko raz).
client.once('ready', async () => {
    console.log(`Gotowy! Zalogowano jako ${client.user.tag}`);

    // Rejestruj komendy slash na serwerach
    registerSlashCommands().catch(error => {
        console.error('Błąd podczas rejestracji komend slash:', error);
    });
});

// Funkcja do rejestracji komend slash
async function registerSlashCommands() {
    const commands = Array.from(client.commands.values()).map(command => command.data?.toJSON() || {});
    try {
        const defaultGuild = await client.guilds.fetch(defaultGuildId);
        await defaultGuild.commands.set(commands);
        console.log('Zarejestrowano komendy slash na domyślnym serwerze!');

        // Rejestruj komendy na dodatkowych serwerach
        for (const guildId of additionalGuildIds) {
            const guild = await client.guilds.fetch(guildId);
            await guild.commands.set(commands);
            console.log(`Zarejestrowano komendy slash na serwerze o ID ${guildId}!`);
        }
    } catch (error) {
        console.error('Błąd podczas rejestracji komend slash:', error);
    }
}

// Nasłuchuj interakcje użytkowników
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Błąd podczas wykonywania komendy slash:', error);
        await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', ephemeral: true });
    }
});

// Nasłuchuj wiadomości użytkowników
client.on('messageCreate', async message => {
    // Ignoruj wiadomości z innych kanałów, botów lub własne wiadomości
    if (message.channel.id !== targetChannelId || message.author.bot) return;

    const prompt = message.content;
    const response = await generateResponse(prompt);
    await message.reply(response);
});

// Zaloguj się do Discorda za pomocą tokenu twojego klienta
client.login(token);

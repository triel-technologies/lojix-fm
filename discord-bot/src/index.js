import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const API = process.env.API_URL || 'http://backend:3001';

const commands = [
  new SlashCommandBuilder().setName('radio').setDescription('LoJix FM player links'),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Currently playing track'),
  new SlashCommandBuilder().setName('listeners').setDescription('Live listener count'),
  new SlashCommandBuilder().setName('history').setDescription('Recent track history'),
  new SlashCommandBuilder().setName('live').setDescription('Live stream status'),
];

client.on('ready', async () => {
  console.log(`LoJix FM Bot ready as ${client.user?.tag}`);
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(c => c.toJSON()) });
    console.log('Slash commands registered');
  } catch (e) {
    console.error('Failed to register commands', e);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'nowplaying') {
      const np = await (await fetch(`${API}/api/now-playing`)).json();
      const embed = new EmbedBuilder()
        .setTitle('🎵 Now Playing on LoJix FM')
        .setDescription(`**${np.artist}** — ${np.title}`)
        .setThumbnail(np.albumArt || null)
        .addFields(
          { name: 'Album', value: np.album || '—', inline: true },
          { name: 'Source', value: (np.source || '').toUpperCase(), inline: true },
          { name: 'Listeners', value: `${np.listeners}`, inline: true },
        )
        .setColor(np.live ? 0xff0000 : 0x00ffff)
        .setFooter({ text: 'LoJix FM — Autonomous AI Radio' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Stream 128K').setURL(`https://${process.env.DOMAIN}/live`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setLabel('Stream HQ').setURL(`https://${process.env.DOMAIN}/hq`).setStyle(ButtonStyle.Link),
        new ButtonBuilder().setLabel('Open Radio').setURL(`https://${process.env.DOMAIN}`).setStyle(ButtonStyle.Link),
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.commandName === 'history') {
      const history = await (await fetch(`${API}/api/history?limit=10`)).json();
      const lines = history.map((h, i) => `${i + 1}. **${h.artist}** — ${h.title}`);
      const embed = new EmbedBuilder().setTitle('📻 LoJix FM — Recent Tracks').setDescription(lines.join('\n')).setColor(0x00ffff);
      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'radio') {
      const embed = new EmbedBuilder()
        .setTitle('📡 LoJix FM — Stream Links')
        .addFields(
          { name: '64K Mobile', value: `https://${process.env.DOMAIN}/mobile`, inline: false },
          { name: '128K Standard', value: `https://${process.env.DOMAIN}/live`, inline: false },
          { name: '320K HQ', value: `https://${process.env.DOMAIN}/hq`, inline: false },
        )
        .setColor(0x00ffff);
      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'listeners') {
      const { listeners } = await (await fetch(`${API}/api/listeners`)).json();
      await interaction.reply(`📻 **${listeners}** listeners live on LoJix FM`);
    }
  } catch (e) {
    console.error('Interaction handler error', e);
    try { await interaction.reply({ content: 'Error handling command', ephemeral: true }); } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);

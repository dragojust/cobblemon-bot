const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require("discord.js");

const fs = require("fs");
const starters = require("./starters");

// 🤖 Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log("🟢 BOT CONNECTÉ :", client.user.tag);
  
});

// 💾 data (choix joueurs)
let data = {};

if (fs.existsSync("./data.json")) {
  data = JSON.parse(fs.readFileSync("./data.json"));
}

function save() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// 🎒 Embed du message
function createEmbed() {
  return new EmbedBuilder()
    .setTitle("🎒 CHOIX DES STARTERS COBBLEMON 🎒")
    .setDescription(
      starters.map(p => `🔥 ${p} : ${data[p] || "En attente..."}`).join("\n")
    );
}

// 🔘 Bouton
function createButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("choose")
      .setLabel("📋 Choisir mon Pokémon")
      .setStyle(ButtonStyle.Primary)
  );
}

let mainMessage;

// 🚀 Commande de lancement
client.on("messageCreate", async (message) => {
  if (message.content === "!start") {

    mainMessage = await message.channel.send({
      embeds: [createEmbed()],
      components: [createButton()]
    });

  }
});

// ⚡ Interactions (bouton + modal)
client.on(Events.InteractionCreate, async (interaction) => {

  // 🔘 CLICK BOUTON
  if (interaction.isButton() && interaction.customId === "choose") {

    const modal = new ModalBuilder()
      .setCustomId("pokemon_modal")
      .setTitle("Choix du Pokémon");

    const pokemonInput = new TextInputBuilder()
      .setCustomId("pokemon")
      .setLabel("Nom du Pokémon (exact)")
      .setStyle(TextInputStyle.Short);

    const pseudoInput = new TextInputBuilder()
      .setCustomId("pseudo")
      .setLabel("Ton pseudo")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(pokemonInput),
      new ActionRowBuilder().addComponents(pseudoInput)
    );

    return interaction.showModal(modal);
  }

  // 🪟 MODAL SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "pokemon_modal") {

    const pokemon = interaction.fields.getTextInputValue("pokemon");
    const pseudo = interaction.fields.getTextInputValue("pseudo");

    // vérifier si starter existe
    const valid = starters.find(p => p.toLowerCase() === pokemon.toLowerCase());

    if (!valid) {
      return interaction.reply({
        content: "❌ Ce Pokémon n'est pas un starter valide",
        ephemeral: true
      });
    }

    // déjà pris ?
    if (data[valid]) {
      return interaction.reply({
        content: "❌ Ce starter est déjà pris",
        ephemeral: true
      });
    }

    // sauvegarde
    data[valid] = pseudo;
    save();

    // update message
    await mainMessage.edit({
      embeds: [createEmbed()],
      components: [createButton()]
    });

    return interaction.reply({
      content: `✔️ Tu as choisi ${valid}`,
      ephemeral: true
    });
  }
});

// 🔑 login bot
require("dotenv").config();
client.login(process.env.TOKEN);
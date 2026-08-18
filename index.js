const {
  Client,
  GatewayIntentBits,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once(Events.ClientReady, (client) => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const button = new ButtonBuilder()
      .setCustomId(`register_${member.id}`)
      .setLabel("فتح التسجيل")
      .setStyle(ButtonStyle.Primary);

    await member.send({
      content: "مرحباً! اضغط على الزر لإكمال التسجيل.",
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  } catch (error) {
    console.error("DM error:", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (!interaction.customId.startsWith("register_")) return;

    const memberId = interaction.customId.replace("register_", "");

    if (memberId !== interaction.user.id) return;

    const modal = new ModalBuilder()
      .setCustomId("registration_modal")
      .setTitle("تسجيل العضو");

    const gameName = new TextInputBuilder()
      .setCustomId("game_name")
      .setLabel("اسمك في اللعبة")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(32);

    const gangName = new TextInputBuilder()
      .setCustomId("gang_name")
      .setLabel("اسم العصابة")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    modal.addComponents(
      new ActionRowBuilder().addComponents(gameName),
      new ActionRowBuilder().addComponents(gangName)
    );

    await interaction.showModal(modal);
    return;
  }

  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "registration_modal") return;

  const gameName = interaction.fields
    .getTextInputValue("game_name")
    .trim();

  const gangName = interaction.fields
    .getTextInputValue("gang_name")
    .trim();

  const member = await interaction.guild.members.fetch(
    interaction.user.id
  );

  const botMember = interaction.guild.members.me;

  if (
    !botMember.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    ) ||
    !botMember.permissions.has(
      PermissionsBitField.Flags.ManageNicknames
    )
  ) {
    return interaction.reply({
      content:
        "البوت يحتاج صلاحيات Manage Roles و Manage Nicknames.",
      ephemeral: true
    });
  }

  try {
    let role = interaction.guild.roles.cache.find(
      (r) =>
        r.name.toLowerCase() === gangName.toLowerCase()
    );

    if (!role) {
      role = await interaction.guild.roles.create({
        name: gangName,
        reason: "Automatic gang role creation"
      });
    }

    await member.roles.add(role);

    if (member.manageable) {
      await member.setNickname(gameName);
    }

    await interaction.reply({
      content:
        `تم تسجيلك بنجاح!\n` +
        `اسم اللعبة: ${gameName}\n` +
        `العصابة: ${gangName}`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (!interaction.replied) {
      await interaction.reply({
        content:
          "حدث خطأ. تأكد من صلاحيات البوت وترتيب الرولات.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

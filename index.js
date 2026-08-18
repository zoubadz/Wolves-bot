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

// ⚠️ ضع هنا آيدي القناة المخصصة للتسجيل في سيرفرك
const REGISTRATION_CHANNEL_ID = "1539226008937439274";

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
});

// عند انضمام عضو جديد: يرسل البوت الرسالة في قناة التسجيل
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channel = member.guild.channels.cache.get(REGISTRATION_CHANNEL_ID);
    if (!channel) return console.error("لم يتم العثور على قناة التسجيل.");

    const button = new ButtonBuilder()
      .setCustomId("open_register_modal")
      .setLabel("فتح التسجيل")
      .setStyle(ButtonStyle.Primary);

    await channel.send({
      content: `مرحباً بك ${member}! اضغط على الزر للبدء في عملية التسجيل:`,
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  } catch (error) {
    console.error("خطأ أثناء إرسال رسالة الترحيب:", error);
  }
});

// التعامل مع الضغط على الزر والـ Modal
client.on(Events.InteractionCreate, async (interaction) => {
  
  // 1. عند الضغط على زر التسجيل
  if (interaction.isButton()) {
    if (interaction.customId !== "open_register_modal") return;

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

  // 2. عند إرسال بيانات الـ Modal
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "registration_modal") return;

  const gameName = interaction.fields.getTextInputValue("game_name").trim();
  const gangName = interaction.fields.getTextInputValue("gang_name").trim();

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const botMember = interaction.guild.members.me;

  // التحقق من الصلاحيات
  if (
    !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
    !botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)
  ) {
    return interaction.reply({
      content: "البوت يحتاج صلاحيات Manage Roles و Manage Nicknames.",
      ephemeral: true
    });
  }

  try {
    // البحث عن رول العصابة أو إنشائه
    let role = interaction.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === gangName.toLowerCase()
    );

    if (!role) {
      role = await interaction.guild.roles.create({
        name: gangName,
        reason: "Automatic gang role creation"
      });
    }

    // إعطاء الرول
    await member.roles.add(role);

    // تغيير الاسم
    if (member.manageable) {
      await member.setNickname(gameName);
    }

    // الرد التأكيدي (يظهر للمستخدم فقط Ephemeral)
    await interaction.reply({
      content:
        `تم تسجيلك بنجاح!\n` +
        `اسم اللعبة: **${gameName}**\n` +
        `العصابة: **${gangName}**`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (!interaction.replied) {
      await interaction.reply({
        content: "حدث خطأ. تأكد من صلاحيات البوت وترتيب الرولات (يجب أن يكون رول البوت أعلى من رول العضو والرول المراد إعطاؤه).",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

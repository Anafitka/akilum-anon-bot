const { Bot, InputFile, InlineKeyboard } = require("grammy");
const {
  getOrCreateUser,
  getUser,
  findUser,
  setUserPersonality,
  getUserPersonality,
  setUserLanguage,
  getUserLanguage,
  setUserPremium,
  isUserPremium,
  saveQuestion,
  getQuestion,
  setQuestionReply,
  getGlobalStats,
  linkMessageToQuestion,
  getQuestionByMessage,
  setLatestQuestion,
  getLatestQuestion,
  getUserQuestions,
  addStarsToUser,
  saveQuestionReaction,
} = require("./db");
const {
  PERSONALITIES,
  STAR_TIERS,
  UI_TEXTS,
  getPersonality,
  getTier,
} = require("./i18n");
const {
  THEMES,
  generateQuestionCard,
  generatePromoCard,
} = require("./card_generator");
require("dotenv").config();

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("ОШИБКА: BOT_TOKEN не указан!");
  process.exit(1);
}

const bot = new Bot(token);
const botUsername = process.env.BOT_USERNAME || "akilum_anon_bot";
const OWNER_ID = Number(process.env.OWNER_ID) || 8513097259;

// Глобальный перехват ошибок для стабильной 24/7 работы
bot.catch((err) => {
  console.error("Telegram bot error:", err.message);
});

// Состояния пользователей в памяти (userId -> { mode, targetId, targetName, qId })
const userStates = new Map();
const lastMsgTimes = new Map();

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getShareUrl(userId) {
  const link = `https://t.me/${botUsername}?start=anon_${userId}`;
  const text = encodeURIComponent(
    "Задай мне вопрос или признайся в чём-то анонимно 🤫"
  );
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
}

// Чистая клавиатура без уродливых реакций-стикеров
function createAnswerKeyboard(q, lang = "ru") {
  const label = {
    ru: "💬 Написать ещё",
    en: "💬 Ask another question",
    ja: "💬 もう一度質問する",
  }[lang] || "💬 Написать ещё";

  return new InlineKeyboard().text(label, `action:askagain_${q.targetId}`);
}

const RANDOM_QUESTIONS = [
  "В кого ты тайно влюблен(а) прямо сейчас? 👀",
  "Твой самый кринжовый момент в жизни? 💀",
  "Что обо мне думают твои друзья? 🤫",
  "Если бы мы пошли гулять, куда бы позвал(а)? ✨",
  "Оцени меня от 1 до 10 честно 🔥",
  "Какой твой самый главный секрет? 🤐",
  "Честно: я тебе нравлюсь? 😉",
  "Какой самый безумный поступок ты делал(а)? 🚀",
  "Ты веришь в любовь с первого взгляда? 💔",
  "Какая твоя самая странная привычка? 😂",
  "Что бы ты изменил(а) во мне? 💭",
  "Кто тебе сейчас нравится? 🤫",
  "С кем бы ты хотел(а) застрять в лифте? 🙈",
  "Самое милое воспоминание обо мне? 🥹",
];

// Установка описания и команд бота в Telegram API
async function initBotProfile() {
  try {
    await bot.api.setMyCommands([
      { command: "app", description: "⚡ Открыть Mini App" },
      { command: "start", description: "Моя ссылка и кабинет" },
      { command: "personality", description: "🎭 Характер Лам" },
      { command: "premium", description: "👑 Akilum Premium ⭐" },
      { command: "lang", description: "🌐 Выбрать язык / Language" },
      { command: "story", description: "📸 Картинка для Сторис" },
      { command: "stats", description: "📊 Статистика и Звёзды ⭐" },
    ]);
    await bot.api.setMyDescription(
      "AKILUM — анонимные вопросы и признания для Instagram и Telegram Stories.\n\n" +
      "⚡ Выбирай характер Лам, получай честные секреты и делись вирусными карточками!"
    );
    await bot.api.setMyShortDescription(
      "Анонимные вопросы и секреты для твоих Stories 🤫⚡"
    );
    // Компактная кнопка Mini App (версия v=6 для мгновенного обновления кэша)
    await bot.api.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "⚡ App",
        web_app: { url: "https://akilum-anon-bot.onrender.com?v=6" }
      }
    });
    console.log("✓ Профиль и компактная кнопка Mini App (v=6) настроены");
  } catch (e) {
    console.warn("Предупреждение профиля:", e.message);
  }
}

// 1. Команда /start
bot.command("start", async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name || "Пользователь";
  const username = ctx.from.username || "";
  getOrCreateUser(userId, name, username);

  const payload = ctx.match ? ctx.match.trim() : "";

  // Если переход из Mini App для создания сторис
  if (payload.startsWith("card_")) {
    const raw = payload.replace("card_", "");
    let qId = raw;
    let theme = "lum";
    const knownThemes = ["lum", "gold", "obsidian", "sakura"];
    for (const t of knownThemes) {
      if (raw.endsWith("_" + t)) {
        theme = t;
        qId = raw.slice(0, -(t.length + 1));
        break;
      }
    }
    const q = getQuestion(qId);
    if (q) {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
      try {
        const u = getUser(userId) || { name: ctx.from.first_name };
        const pngBuffer = generateQuestionCard(q.text, u.name, theme, q.isSuper);
        await ctx.replyWithPhoto(new InputFile(pngBuffer, `story_${qId}.png`), {
          caption: "Готово! Сохрани картинку, выложи в Сторис и напиши свой ответ 🔥",
        });
      } catch (err) {
        console.error("Ошибка создания карточки:", err.message);
        await ctx.reply("Не удалось создать карточку.");
      }
    } else {
      await ctx.reply("Вопрос не найден.");
    }
    return;
  }

  // Если переход из Mini App по теме Сторис
  if (payload.startsWith("story")) {
    let theme = "lum";
    let prompt = "";
    if (payload.startsWith("story_")) {
      const rest = payload.replace("story_", "");
      const knownThemes = ["lum", "gold", "obsidian", "sakura"];
      for (const t of knownThemes) {
        if (rest === t || rest.startsWith(t + "_")) {
          theme = t;
          if (rest.startsWith(t + "_")) {
            prompt = decodeURIComponent(rest.replace(t + "_", ""));
          }
          break;
        }
      }
    }
    await sendPromoCard(ctx, theme, prompt);
    return;
  }

  // Если переход из Mini App для оплаты доната/премиума (donate_15, donate_50, donate_150, donate_500)
  if (payload.startsWith("donate_")) {
    const stars = Number(payload.replace("donate_", "")) || 50;
    const tier = STAR_TIERS[stars] || STAR_TIERS[50];
    const invoicePayload = JSON.stringify({ type: "donate", tier: tier.id, stars });
    try {
      await ctx.api.sendInvoice(
        ctx.chat.id,
        tier.name.ru,
        tier.desc.ru,
        invoicePayload,
        "",
        "XTR",
        [{ label: tier.name.ru, amount: stars }]
      );
    } catch (e) {
      console.error("Ошибка счета Stars:", e.message);
      await ctx.reply("Не удалось создать счет для оплаты.");
    }
    return;
  }

  // Если переход для оплаты Супер-вопроса со Звёздами (Telegram Stars)
  if (payload.startsWith("super_")) {
    const rest = payload.replace("super_", "");
    const firstUnderscore = rest.indexOf("_");
    if (firstUnderscore !== -1) {
      const targetId = Number(rest.slice(0, firstUnderscore));
      const text = decodeURIComponent(rest.slice(firstUnderscore + 1));
      const targetUser = getUser(targetId) || { name: "пользователя" };

      const invoicePayload = JSON.stringify({ t: targetId, q: text });
      try {
        await ctx.api.sendInvoice(
          ctx.chat.id,
          "👑 Супер-вопрос с донатом",
          `Анонимный вопрос для ${targetUser.name} + донат 50 ⭐ Telegram Stars!`,
          invoicePayload,
          "", // Валюта Stars не требует токена провайдера
          "XTR",
          [{ label: "Супер-вопрос 50 ⭐", amount: 50 }]
        );
      } catch (e) {
        console.error("Ошибка счета Stars:", e.message);
        await ctx.reply("Не удалось создать счет для оплаты.");
      }
      return;
    }
  }

  // Если переход из Mini App для ответа на вопрос
  if (payload.startsWith("reply_")) {
    const qId = payload.replace("reply_", "");
    const q = getQuestion(qId);
    if (q) {
      userStates.set(userId, {
        mode: "reply",
        qId: qId,
      });
      await ctx.reply(
        `Напиши ответ на вопрос:\n` +
        `<blockquote>${escapeHtml(q.text)}</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text("❌ Отмена", "action:cancel"),
        }
      );
    } else {
      await ctx.reply("Вопрос не найден.");
    }
    return;
  }

  // Если переход по ссылке вида /start anon_123456
  if (payload.startsWith("anon_")) {
    const targetIdStr = payload.replace("anon_", "");
    const targetId = Number(targetIdStr);
    const isSelf = targetId === userId;
    const targetUser = isSelf
      ? { name: "себя (тест)" }
      : getUser(targetId) || { name: "пользователя" };

    userStates.set(userId, {
      mode: "ask",
      targetId: targetId,
      targetName: targetUser.name,
    });

    const kb = new InlineKeyboard()
      .text("🎲 Случайный вопрос", `action:rand_${targetId}`)
      .text("👑 Супер-вопрос 50 ⭐", `action:pre_super_${targetId}`)
      .row()
      .text("❌ Отмена", "action:cancel");

    const header = isSelf
      ? `👀 <b>Тестовый режим:</b> ты открыл свою собственную ссылку.\n\nНапиши сообщение, чтобы проверить, как оно приходит:`
      : `Напиши анонимный вопрос для <b>${escapeHtml(targetUser.name)}</b>:\n<i>(это 100% анонимно 🤫)</i>`;

    await ctx.reply(header, {
      parse_mode: "HTML",
      reply_markup: kb,
    });
    return;
  }

  // Обычный старт: показываем личный кабинет и персональную ссылку
  userStates.delete(userId);
  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;
  const currentPers = getUserPersonality(userId);
  const currentLang = getUserLanguage(userId);
  const pers = getPersonality(currentPers);
  const greetingText = pers.greeting[currentLang] || pers.greeting.ru;

  if (userId === OWNER_ID || payload === "menu") {
    const kb = new InlineKeyboard()
      .webApp("⚡ Открыть Akilum Mini App", "https://akilum-anon-bot.onrender.com?v=6")
      .row()
      .url("🔗 Поделиться", getShareUrl(userId))
      .row()
      .text("🎭 Характер Лам", "action:open_personality")
      .text("👑 Premium ⭐", "action:open_premium")
      .row()
      .text("📸 Картинка для Сторис", "action:promo_card")
      .text("📊 Статистика", "action:my_stats");

    await ctx.reply(
      `✨ <i>«${escapeHtml(greetingText)}»</i>\n\n` +
      `Твоя персональная ссылка для вопросов:\n` +
      `👉 <code>${myLink}</code>\n\n` +
      `Прикрепи её в <b>Instagram / Telegram Stories</b> или открой <b>Mini App</b> внизу 👇`,
      { parse_mode: "HTML", reply_markup: kb }
    );
    return;
  }

  // Если зашёл сторонний пользователь (нашёл бота в поиске)
  userStates.set(userId, {
    mode: "ask",
    targetId: OWNER_ID,
    targetName: "тебя",
  });

  const strangerKb = new InlineKeyboard()
    .webApp("⚡ Открыть в приложении", "https://akilum-anon-bot.onrender.com?v=6")
    .row()
    .text("🎲 Случайный вопрос", `action:rand_${OWNER_ID}`)
    .text("🔗 Создать свою ссылку", "action:my_own_link")
    .row()
    .text("🎭 Характер Лам", "action:open_personality")
    .text("👑 Premium ⭐", "action:open_premium");

  await ctx.reply(
    `✨ <i>«${escapeHtml(greetingText)}»</i>\n\n` +
    `Напиши анонимный вопрос:\n` +
    `<i>(это 100% анонимно 🤫)</i>\n\n` +
    `👇 Отправь сообщение прямо сюда в чат:`,
    { parse_mode: "HTML", reply_markup: strangerKb }
  );
});

// 2. Команда /app (Открыть Mini App)
bot.command("app", async (ctx) => {
  const kb = new InlineKeyboard().webApp(
    "⚡ Открыть Akilum Mini App",
    "https://akilum-anon-bot.onrender.com?v=6"
  );
  await ctx.reply(
    "✨ <b>Akilum Mini App</b>\n\n" +
    "Твой личный кабинет, выбор тем для Сторис и входящие вопросы 👇",
    { parse_mode: "HTML", reply_markup: kb }
  );
});

// Команда /story
bot.command("story", async (ctx) => {
  await sendPromoCard(ctx);
});

// Команда /stats
bot.command("stats", async (ctx) => {
  await sendStats(ctx);
});

// Команда /personality — выбор характера Лам
bot.command("personality", async (ctx) => {
  const userId = ctx.from.id;
  getOrCreateUser(userId, ctx.from.first_name, ctx.from.username || "");
  const current = getUserPersonality(userId);

  const kb = new InlineKeyboard()
    .text(`⚡ Дерзкая${current === "tsundere" ? " ✓" : ""}`, "action:personality_tsundere")
    .text(`❤️ Милая${current === "kawaii" ? " ✓" : ""}`, "action:personality_kawaii")
    .row()
    .text(`🛸 Пришелец${current === "alien" ? " ✓" : ""}`, "action:personality_alien")
    .text(`😉 Флирт${current === "flirty" ? " ✓" : ""}`, "action:personality_flirty");

  await ctx.reply(
    `🎭 <b>Характер Лам</b>\n\n` +
    `<b>⚡ Дерзкая (Цундэрэ)</b> — «Бака, Дарлинг! Не думай что я ради тебя!\"\n` +
    `<b>❤️ Милая (Каваии)</b> — «Дарлинг~! Я так скучала по тебе~»\n` +
    `<b>🛸 Пришелец (Они)</b> — «Землянин! Мой корабль перехватил сигнал 🛸»\n` +
    `<b>😉 Флирт (Искры)</b> — «Чувствуешь электричество между нами? 😉»\n\n` +
    `Текущий: <b>${getPersonality(current).name.ru}</b>`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

// Команда /lang — выбор языка
bot.command("lang", async (ctx) => {
  const userId = ctx.from.id;
  getOrCreateUser(userId, ctx.from.first_name, ctx.from.username || "");
  const current = getUserLanguage(userId);

  const kb = new InlineKeyboard()
    .text(`🇷🇺 Русский${current === "ru" ? " ✓" : ""}`, "action:lang_ru")
    .text(`🇬🇧 English${current === "en" ? " ✓" : ""}`, "action:lang_en")
    .text(`🇯🇵 日本語${current === "ja" ? " ✓" : ""}`, "action:lang_ja");

  await ctx.reply(
    `🌐 <b>Language / Язык / 言語</b>\n\n` +
    `Select your preferred language for Akilum:\n` +
    `Выбери язык интерфейса:`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

// Команда /premium — витрина Premium и донат тиры
bot.command("premium", async (ctx) => {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name, ctx.from.username || "");
  const isPrem = isUserPremium(userId);

  const premiumBanner = isPrem
    ? `✅ <b>У тебя уже есть Akilum Premium!</b> 👑\n\n`
    : `👑 <b>Akilum Premium</b> — раскрой все возможности!\n\n`;

  const features = [
    "⚡ <b>Эксклюзивные скины Сторис</b> — Gold VIP, Obsidian Stealth, Sakura",
    "🌌 <b>Статус «Звёздный» в профиле</b> — заметный VIP-значок",
    "🎭 <b>Все характеры Лам</b> — Цундэрэ, Каваии, Пришелец, Флирт",
    "🌐 <b>Мультиязычность</b> — RU, EN, 日本語",
    "⚡ <b>Приоритет доставки</b> — твои вопросы первыми в очереди",
    "💎 <b>Золотая рамка VIP</b> на всех входящих вопросах",
  ].join("\n");

  const kb = new InlineKeyboard()
    .text("⚡ 15 ⭐ Искры Лам", "action:donate_15")
    .row()
    .text("⚡ 50 ⭐ Разряд Молнии", "action:donate_50")
    .row()
    .text("👑 150 ⭐ Супернова VIP 🔥 ХИТ", "action:donate_150")
    .row()
    .text("🌌 500 ⭐ Галактический Спонсор 💎", "action:donate_500");

  await ctx.reply(
    premiumBanner + features + "\n\n" +
    `<i>Выбери уровень поддержки — все Звёзды идут напрямую создателю Lam Bot ⭐</i>`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

async function sendPromoCard(ctx, theme = "lum", customPrompt = "") {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name);

  await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
  try {
    const pngBuffer = generatePromoCard(user.name, botUsername, theme, customPrompt);
    const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

    await ctx.replyWithPhoto(new InputFile(pngBuffer, `story_${theme}.png`), {
      caption:
        `Выложи эту картинку в Stories и прикрепи стикер-ссылку:\n` +
        `<code>${myLink}</code>`,
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().url(
        "🔗 Поделиться ссылкой",
        getShareUrl(userId)
      ),
    });
  } catch (err) {
    console.error("Ошибка промо-карточки:", err.message);
    await ctx.reply("Не удалось создать карточку.");
  }
}

async function sendStats(ctx) {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name);
  const global = getGlobalStats();

  await ctx.reply(
    `📊 <b>Твоя статистика:</b>\n` +
    `• Получено вопросов: <b>${user.questionsReceived || 0}</b>\n` +
    `• Отправлено ответов: <b>${user.repliesSent || 0}</b>\n` +
    `• Заработано Звёзд: <b>⭐ ${user.starsReceived || 0}</b>\n\n` +
    `🌐 Всего в AKILUM: <b>${global.totalUsers}</b> пользователей`,
    { parse_mode: "HTML" }
  );
}

// 4. Обработка текстовых сообщений
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = userStates.get(userId);

  // === 1. НАЙТИ СВАЙП-ОТВЕТ (Telegram Native Swipe To Reply) ===
  if (ctx.message.reply_to_message) {
    const replyToMsg = ctx.message.reply_to_message;
    const linked = getQuestionByMessage(replyToMsg.message_id, ctx.chat.id);

    if (linked) {
      if (linked.type === "question") {
        // Получатель свайпнул вопрос и написал ответ
        const q = getQuestion(linked.qId);
        if (q) {
          setQuestionReply(q.id, text);
          await ctx.reply(`✓ <b>Ответ отправлен анониму!</b> 💌`, { parse_mode: "HTML" });

          const askAgainKb = createAnswerKeyboard(q);

          try {
            const sentAnswer = await bot.api.sendMessage(
              q.senderId,
              `💬 <b>Ответ на твой анонимный вопрос:</b>\n\n` +
              `Вопрос:\n` +
              `<blockquote>${escapeHtml(q.text)}</blockquote>\n\n` +
              `Ответ:\n` +
              `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
              `<i>💡 Свайпни это сообщение вправо, чтобы ответить ещё!</i>`,
              { parse_mode: "HTML", reply_markup: askAgainKb }
            );
            linkMessageToQuestion(sentAnswer.message_id, q.senderId, q.id, "answer");
          } catch (e) {
            console.warn("Не удалось доставить ответ:", e.message);
          }
          return;
        }
      } else if (linked.type === "answer") {
        // Автор свайпнул ответ и написал продолжение
        const q = getQuestion(linked.qId);
        if (q) {
          const newQ = saveQuestion(q.targetId, userId, text);
          await ctx.reply(`✓ <b>Сообщение отправлено анонимно!</b> 💌`, { parse_mode: "HTML" });

          const recipientKb = new InlineKeyboard()
            .text("📸 Создать сторис", `action:card_${newQ.id}`)
            .row()
            .text("💬 Ответить", `action:reply_${newQ.id}`);

          try {
            const sentMsg = await bot.api.sendMessage(
              q.targetId,
              `💌 <b>Продолжение анонимного диалога:</b>\n\n` +
              `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
              `<i>💡 Свайпни вправо («Ответить»), чтобы написать ответ:</i>`,
              { parse_mode: "HTML", reply_markup: recipientKb }
            );
            linkMessageToQuestion(sentMsg.message_id, q.targetId, newQ.id, "question");
            setLatestQuestion(q.targetId, newQ.id);
          } catch (e) {
            console.warn("Ошибка доставки продолжения:", e.message);
          }
          return;
        }
      }
    }

    // Резервный умный поиск: если свайпнули любое сообщение бота
    if (replyToMsg.from?.is_bot) {
      const latestQ = getLatestQuestion(userId);
      if (latestQ && (Date.now() - latestQ.createdAt < 24 * 60 * 60 * 1000) && latestQ.targetId === userId) {
        setQuestionReply(latestQ.id, text);
        await ctx.reply(`✓ <b>Ответ отправлен анониму!</b> 💌`, { parse_mode: "HTML" });

        const askAgainKb = createAnswerKeyboard(latestQ);

        try {
          const sentAnswer = await bot.api.sendMessage(
            latestQ.senderId,
            `💬 <b>Ответ на твой анонимный вопрос:</b>\n\n` +
            `Вопрос:\n` +
            `<blockquote>${escapeHtml(latestQ.text)}</blockquote>\n\n` +
            `Ответ:\n` +
            `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
            `<i>💡 Свайпни это сообщение вправо, чтобы ответить ещё!</i>`,
            { parse_mode: "HTML", reply_markup: askAgainKb }
          );
          linkMessageToQuestion(sentAnswer.message_id, latestQ.senderId, latestQ.id, "answer");
        } catch (e) {
          console.warn("Не удалось доставить ответ:", e.message);
        }
        return;
      }
    }
  }

  // Режим отправки Супер-вопроса со Звёздами (Telegram Stars ⭐)
  if (state && state.mode === "ask_super") {
    const targetId = state.targetId;
    const targetUser = getUser(targetId) || { name: "пользователя" };
    userStates.delete(userId);

    if (text.length < 2) {
      await ctx.reply("Слишком короткое сообщение.");
      return;
    }

    const invoicePayload = JSON.stringify({ t: targetId, q: text });
    try {
      await ctx.api.sendInvoice(
        ctx.chat.id,
        "👑 Супер-вопрос с донатом",
        `Анонимный вопрос для ${targetUser.name} + донат 50 ⭐ Telegram Stars!`,
        invoicePayload,
        "",
        "XTR",
        [{ label: "Супер-вопрос 50 ⭐", amount: 50 }]
      );
    } catch (e) {
      console.error("Ошибка счета Stars:", e.message);
      await ctx.reply("Не удалось создать счет для оплаты.");
    }
    return;
  }

  // Режим отправки анонимного вопроса (по кнопке или ссылке)
  if (state && state.mode === "ask") {
    const lastTime = lastMsgTimes.get(userId) || 0;
    if (Date.now() - lastTime < 2000) {
      await ctx.reply("Подожди 2 секунды перед следующим сообщением.");
      return;
    }
    lastMsgTimes.set(userId, Date.now());

    if (text.length < 2) {
      await ctx.reply("Слишком короткое сообщение.");
      return;
    }

    const q = saveQuestion(state.targetId, userId, text);
    userStates.delete(userId);

    // Подтверждение автору
    await ctx.reply(
      `✓ <b>Вопрос отправлен анонимно!</b> 💌`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().url(
          "🔗 Моя ссылка для вопросов",
          `https://t.me/${botUsername}?start=menu`
        ),
      }
    );

    // Доставка получателю
    const recipientKb = new InlineKeyboard()
      .text("📸 Создать сторис", `action:card_${q.id}`)
      .row()
      .text("💬 Ответить", `action:reply_${q.id}`);

    try {
      const sentMsg = await bot.api.sendMessage(
        state.targetId,
        `💌 <b>Новый анонимный вопрос:</b>\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
        `<i>💡 Свайпни вправо («Ответить»), чтобы написать ответ:</i>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
      linkMessageToQuestion(sentMsg.message_id, state.targetId, q.id, "question");
      setLatestQuestion(state.targetId, q.id);
    } catch (sendErr) {
      console.warn("Не удалось доставить вопрос:", sendErr.message);
    }
    return;
  }

  // Режим ответа анониму (по кнопке)
  if (state && state.mode === "reply") {
    const q = getQuestion(state.qId);
    userStates.delete(userId);

    if (!q) {
      await ctx.reply("Вопрос не найден.");
      return;
    }

    setQuestionReply(q.id, text);
    await ctx.reply(`✓ <b>Ответ отправлен!</b>`, { parse_mode: "HTML" });

    // Доставка автору
    const askAgainKb = createAnswerKeyboard(q);

    try {
      const sentAnswer = await bot.api.sendMessage(
        q.senderId,
        `💬 <b>Ответ на твой анонимный вопрос:</b>\n\n` +
        `Вопрос:\n` +
        `<blockquote>${escapeHtml(q.text)}</blockquote>\n\n` +
        `Ответ:\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
        `<i>💡 Свайпни это сообщение вправо, чтобы ответить ещё!</i>`,
        { parse_mode: "HTML", reply_markup: askAgainKb }
      );
      linkMessageToQuestion(sentAnswer.message_id, q.senderId, q.id, "answer");
    } catch (e) {
      console.warn("Не удалось доставить ответ:", e.message);
    }
    return;
  }

  // Если написали текст просто так (из поиска)
  if (userId !== OWNER_ID) {
    const q = saveQuestion(OWNER_ID, userId, text);
    await ctx.reply(
      `✓ <b>Вопрос отправлен анонимно!</b> 💌`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().url(
          "🔗 Моя ссылка для вопросов",
          `https://t.me/${botUsername}?start=menu`
        ),
      }
    );

    // Доставка владельцу
    const recipientKb = new InlineKeyboard()
      .text("📸 Создать сторис", `action:card_${q.id}`)
      .row()
      .text("💬 Ответить", `action:reply_${q.id}`);

    try {
      const sentMsg = await bot.api.sendMessage(
        OWNER_ID,
        `💌 <b>Новый анонимный вопрос из поиска Telegram:</b>\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
        `<i>💡 Свайпни вправо («Ответить»), чтобы написать ответ:</i>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
      linkMessageToQuestion(sentMsg.message_id, OWNER_ID, q.id, "question");
      setLatestQuestion(OWNER_ID, q.id);
    } catch (e) {
      console.warn("Ошибка доставки владельцу:", e.message);
    }
    return;
  }

  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;
  await ctx.reply(
    `Твоя ссылка для вопросов:\n👉 <code>${myLink}</code>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url("🔗 Поделиться", getShareUrl(userId))
        .row()
        .text("📸 Картинка для Сторис", "action:promo_card"),
    }
  );
});

// 5. Обработка Callback кнопок
bot.callbackQuery(/^action:(.+)$/, async (ctx) => {
  const action = ctx.match[1];
  const userId = ctx.from.id;

  if (action === "cancel") {
    userStates.delete(userId);
    await ctx.answerCallbackQuery({ text: "Отменено" });
    await ctx.reply("Отменено.", {
      reply_markup: new InlineKeyboard().url(
        "🔗 Моя ссылка",
        `https://t.me/${botUsername}?start=menu`
      ),
    });
    return;
  }

  if (action === "open_personality") {
    await ctx.answerCallbackQuery();
    const current = getUserPersonality(userId);
    const kb = new InlineKeyboard()
      .text(`⚡ Дерзкая${current === "tsundere" ? " ✓" : ""}`, "action:personality_tsundere")
      .text(`❤️ Милая${current === "kawaii" ? " ✓" : ""}`, "action:personality_kawaii")
      .row()
      .text(`🛸 Пришелец${current === "alien" ? " ✓" : ""}`, "action:personality_alien")
      .text(`😉 Флирт${current === "flirty" ? " ✓" : ""}`, "action:personality_flirty");

    await ctx.reply(
      `🎭 <b>Характер Лам</b>\n\n` +
      `<b>⚡ Дерзкая (Цундэрэ)</b> — «Бака, Дарлинг! Не думай что я ради тебя!»\n` +
      `<b>❤️ Милая (Каваии)</b> — «Дарлинг~! Я так скучала по тебе~»\n` +
      `<b>🛸 Пришелец (Они)</b> — «Землянин! Мой корабль перехватил сигнал 🛸»\n` +
      `<b>😉 Флирт (Искры)</b> — «Чувствуешь электричество между нами? 😉»\n\n` +
      `Текущий: <b>${getPersonality(current).name.ru}</b>`,
      { parse_mode: "HTML", reply_markup: kb }
    );
    return;
  }

  if (action === "open_premium") {
    await ctx.answerCallbackQuery();
    const isPrem = isUserPremium(userId);
    const premiumBanner = isPrem
      ? `✅ <b>У тебя уже есть Akilum Premium!</b> 👑\n\n`
      : `👑 <b>Akilum Premium</b> — раскрой все возможности!\n\n`;

    const features = [
      "⚡ <b>Эксклюзивные скины Сторис</b> — Gold VIP, Obsidian Stealth, Sakura",
      "🌌 <b>Статус «Звёздный» в профиле</b> — заметный VIP-значок",
      "🎭 <b>Все характеры Лам</b> — Цундэрэ, Каваии, Пришелец, Флирт",
      "🌐 <b>Мультиязычность</b> — RU, EN, 日本語",
      "⚡ <b>Приоритет доставки</b> — твои вопросы первыми в очереди",
      "💎 <b>Золотая рамка VIP</b> на всех входящих вопросах",
    ].join("\n");

    const kb = new InlineKeyboard()
      .text("⚡ 15 ⭐ Искры Лам", "action:donate_15")
      .row()
      .text("⚡ 50 ⭐ Разряд Молнии", "action:donate_50")
      .row()
      .text("👑 150 ⭐ Супернова VIP 🔥 ХИТ", "action:donate_150")
      .row()
      .text("🌌 500 ⭐ Галактический Спонсор 💎", "action:donate_500");

    await ctx.reply(
      premiumBanner + features + "\n\n" +
      `<i>Выбери уровень поддержки — все Звёзды идут напрямую создателю Lam Bot ⭐</i>`,
      { parse_mode: "HTML", reply_markup: kb }
    );
    return;
  }

  if (action === "my_own_link") {
    userStates.delete(userId);
    await ctx.answerCallbackQuery();
    const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;
    const kb = new InlineKeyboard()
      .url("🔗 Поделиться", getShareUrl(userId))
      .row()
      .text("📸 Картинка для Сторис", "action:promo_card")
      .text("📊 Статистика", "action:my_stats");

    await ctx.reply(
      `Твоя персональная ссылка для вопросов:\n` +
      `👉 <code>${myLink}</code>\n\n` +
      `Прикрепи её в <b>Instagram / Telegram Stories</b>. Вопросы будут приходить сюда 🤫`,
      { parse_mode: "HTML", reply_markup: kb }
    );
    return;
  }

  if (action === "promo_card") {
    await ctx.answerCallbackQuery();
    await sendPromoCard(ctx);
    return;
  }

  if (action === "my_stats") {
    await ctx.answerCallbackQuery();
    await sendStats(ctx);
    return;
  }

  // Случайный вопрос (рандомайзер)
  if (action.startsWith("rand_") || action.startsWith("nextrand_")) {
    await ctx.answerCallbackQuery();
    const targetId = Number(action.replace(/^(rand_|nextrand_)/, ""));
    const targetUser = getUser(targetId) || { name: "пользователя" };
    const randQ = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];

    const kb = new InlineKeyboard()
      .text("🚀 Отправить этот вопрос", `action:sendrand_${targetId}_${encodeURIComponent(randQ)}`)
      .row()
      .text("🎲 Другой вопрос", `action:nextrand_${targetId}`)
      .text("✏️ Написать свой", `action:custom_${targetId}`);

    await ctx.reply(
      `Случайный вопрос для <b>${escapeHtml(targetUser.name)}</b>:\n\n` +
      `«<b>${escapeHtml(randQ)}</b>»`,
      { parse_mode: "HTML", reply_markup: kb }
    );
    return;
  }

  // Отправка выбранного случайного вопроса в 1 клик!
  if (action.startsWith("sendrand_")) {
    await ctx.answerCallbackQuery({ text: "Отправляю..." });
    const parts = action.split("_");
    const targetId = Number(parts[1]);
    const text = decodeURIComponent(parts.slice(2).join("_"));

    const q = saveQuestion(targetId, userId, text);
    userStates.delete(userId);

    await ctx.reply(`✓ <b>Вопрос отправлен анонимно!</b> 💌`, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().url(
        "🔗 Моя ссылка для вопросов",
        `https://t.me/${botUsername}?start=menu`
      ),
    });

    // Доставка получателю
    const recipientKb = new InlineKeyboard()
      .text("📸 Создать сторис", `action:card_${q.id}`)
      .row()
      .text("💬 Ответить", `action:reply_${q.id}`);

    try {
      const sentMsg = await bot.api.sendMessage(
        targetId,
        `💌 <b>Новый анонимный вопрос:</b>\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
        `<i>💡 Свайпни вправо («Ответить»), чтобы написать ответ:</i>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
      linkMessageToQuestion(sentMsg.message_id, targetId, q.id, "question");
      setLatestQuestion(targetId, q.id);
    } catch (e) {
      console.warn("Ошибка доставки:", e.message);
    }
    return;
  }

  // Вернуться к вводу своего вопроса
  if (action.startsWith("custom_")) {
    await ctx.answerCallbackQuery();
    const targetId = Number(action.replace("custom_", ""));
    const targetUser = getUser(targetId) || { name: "пользователя" };

    userStates.set(userId, {
      mode: "ask",
      targetId: targetId,
      targetName: targetUser.name,
    });

    await ctx.reply(
      `Напиши свой анонимный вопрос для <b>${escapeHtml(targetUser.name)}</b> в этот чат:`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("❌ Отмена", "action:cancel"),
      }
    );
    return;
  }

  // Генерация карточки с вопросом для Сторис
  if (action.startsWith("card_")) {
    const qId = action.replace("card_", "");
    const q = getQuestion(qId);
    await ctx.answerCallbackQuery({ text: "Создаю карточку..." });

    if (!q) {
      await ctx.reply("Вопрос не найден.");
      return;
    }

    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
    try {
      const user = getUser(userId) || { name: ctx.from.first_name };
      const pngBuffer = generateQuestionCard(q.text, user.name, q.theme || "lum", q.isSuper);

      await ctx.replyWithPhoto(new InputFile(pngBuffer, `story_${qId}.png`), {
        caption:
          `Готово! Сохрани картинку, выложи в Сторис и напиши свой ответ 🔥`,
        reply_to_message_id: ctx.callbackQuery.message?.message_id,
      });
    } catch (err) {
      console.error("Ошибка карточки:", err.message);
      await ctx.reply("Не удалось создать карточку.");
    }
    return;
  }

  // Выбор характера Лам
  if (action.startsWith("personality_")) {
    const personality = action.replace("personality_", "");
    const result = setUserPersonality(userId, personality);
    const p = getPersonality(result);
    await ctx.answerCallbackQuery({ text: `${p.avatarBadge} Характер выбран!` });
    await ctx.reply(
      `✅ <b>Характер Лам изменён!</b>\n\n` +
      `Теперь активен: <b>${p.name.ru}</b>\n\n` +
      `<i>${p.description.ru}</i>`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Выбор языка
  if (action.startsWith("lang_")) {
    const lang = action.replace("lang_", "");
    const result = setUserLanguage(userId, lang);
    const labels = { ru: "🇷🇺 Русский", en: "🇬🇧 English", ja: "🇯🇵 日本語" };
    await ctx.answerCallbackQuery({ text: `${labels[result] || "RU"} выбран!` });
    await ctx.reply(
      `✅ Language set to <b>${labels[result] || "Russian"}</b>`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Донат тиры
  if (action.startsWith("donate_")) {
    const stars = Number(action.replace("donate_", ""));
    const tier = STAR_TIERS[stars];
    if (!tier) {
      await ctx.answerCallbackQuery({ text: "Неизвестный уровень" });
      return;
    }
    await ctx.answerCallbackQuery();

    const invoicePayload = JSON.stringify({ type: "donate", tier: tier.id, stars });
    try {
      await ctx.api.sendInvoice(
        ctx.chat.id,
        tier.name.ru,
        tier.desc.ru,
        invoicePayload,
        "",
        "XTR",
        [{ label: tier.name.ru, amount: stars }]
      );
    } catch (e) {
      console.error("Ошибка счета Stars:", e.message);
      await ctx.reply("Не удалось создать счет для оплаты. Попробуй ещё раз.");
    }
    return;
  }

  // Реакция на ответ (legacy — оставляем для совместимости, но не показываем в новых сообщениях)
  if (action.startsWith("react_")) {
    await ctx.answerCallbackQuery({ text: "👍" });
    return;
  }

  // Запуск Супер-вопроса со Звёздами
  if (action.startsWith("pre_super_")) {
    const targetId = Number(action.replace("pre_super_", ""));
    const targetUser = getUser(targetId) || { name: "пользователя" };
    await ctx.answerCallbackQuery();

    userStates.set(userId, {
      mode: "ask_super",
      targetId: targetId,
      targetName: targetUser.name,
    });

    await ctx.reply(
      `👑 <b>Режим Супер-вопроса со Звёздами (Telegram Stars ⭐)</b>\n\n` +
      `Напиши анонимный вопрос для <b>${escapeHtml(targetUser.name)}</b>.\n\n` +
      `После отправки текста откроется оплата 50 ⭐, которые будут начислены автору в качестве доната, а твой вопрос получит золотую VIP-рамку! 🔥`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("❌ Отмена", "action:cancel"),
      }
    );
    return;
  }

  // Ответ анониму
  if (action.startsWith("reply_")) {
    const qId = action.replace("reply_", "");
    const q = getQuestion(qId);
    await ctx.answerCallbackQuery();

    if (!q) {
      await ctx.reply("Вопрос не найден.");
      return;
    }

    userStates.set(userId, {
      mode: "reply",
      qId: qId,
    });

    await ctx.reply(
      `Напиши ответ на вопрос:\n` +
      `<blockquote>${escapeHtml(q.text)}</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("❌ Отмена", "action:cancel"),
      }
    );
    return;
  }

  // Написать ещё анонимно
  if (action.startsWith("askagain_")) {
    const targetId = Number(action.replace("askagain_", ""));
    const targetUser = getUser(targetId) || { name: "пользователю" };
    await ctx.answerCallbackQuery();

    userStates.set(userId, {
      mode: "ask",
      targetId: targetId,
      targetName: targetUser.name,
    });

    await ctx.reply(
      `Напиши следующее сообщение для <b>${escapeHtml(targetUser.name)}</b>:`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text("🎲 Случайный вопрос", `action:rand_${targetId}`)
          .text("❌ Отмена", "action:cancel"),
      }
    );
    return;
  }
});

// 6. Платежи через Telegram Stars (XTR)
bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;
  const payloadRaw = payment.invoice_payload;
  try {
    const pdata = JSON.parse(payloadRaw);
    const stars = payment.total_amount;

    // === Донат (поддержка бота) ===
    if (pdata.type === "donate") {
      addStarsToUser(OWNER_ID, stars);
      setUserPremium(ctx.from.id, true, pdata.tier || "stars_50");

      const tier = STAR_TIERS[stars] || STAR_TIERS[50];
      const premiumMsg = stars >= 150
        ? `🎉 <b>Akilum Premium активирован!</b> Теперь ты получаешь VIP-статус, все скины Сторис и эксклюзивные привилегии!\n\n`
        : ``;

      await ctx.reply(
        `✨ <b>Спасибо за поддержку!</b> 💫\n\n` +
        premiumMsg +
        `${tier.name.ru} — <b>${stars} ⭐ Telegram Stars</b>\n` +
        `<i>${tier.desc.ru}</i>\n\n` +
        `Ты легенда Akilum! ⚡`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // === Супер-вопрос (старый формат { t, q }) ===
    const targetId = Number(pdata.t) || OWNER_ID;
    const text = String(pdata.q || "").trim();

    if (!text) return;

    const q = saveQuestion(targetId, ctx.from.id, text, {
      isSuper: true,
      stars: stars,
      theme: "gold",
    });
    addStarsToUser(targetId, stars);

    // Определяем характер получателя для красивого уведомления
    const receiverPersonality = getUserPersonality(targetId);
    const receiverLang = getUserLanguage(targetId);
    const personality = getPersonality(receiverPersonality);

    await ctx.reply(
      `✨ <b>Супер-вопрос успешно отправлен!</b> 💌\n\n` +
      `Донат <b>${stars} ⭐</b> начислен автору. Твой вопрос подсвечен золотой VIP-рамкой!`,
      { parse_mode: "HTML" }
    );

    const recipientKb = new InlineKeyboard()
      .text("📸 Создать сторис (VIP)", `action:card_${q.id}`)
      .row()
      .text("💬 Ответить", `action:reply_${q.id}`);

    const header = personality.superQuestionHeader[receiverLang] || personality.superQuestionHeader.ru;
    const hint = personality.swipeHint[receiverLang] || personality.swipeHint.ru;

    const sentMsg = await bot.api.sendMessage(
      targetId,
      `${header}\n\n` +
      `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
      `💰 <i>Тебе начислен донат <b>${stars} Звёзд Telegram</b> от анонима!</i>\n\n` +
      hint,
      { parse_mode: "HTML", reply_markup: recipientKb }
    );
    linkMessageToQuestion(sentMsg.message_id, targetId, q.id, "question");
    setLatestQuestion(targetId, q.id);
  } catch (err) {
    console.error("Ошибка обработки оплаты Stars:", err.message);
  }
});

// Встроенный HTTP сервер для Mini App и Render.com
const http = require("http");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. Статика: аватарка
  if (url.pathname === "/avatar.png") {
    const avatarPath = path.join(__dirname, "public", "avatar.png");
    if (fs.existsSync(avatarPath)) {
      res.writeHead(200, { "Content-Type": "image/png" });
      return fs.createReadStream(avatarPath).pipe(res);
    }
  }

  // 2. API: получить пользователя и вопросы
  if (url.pathname === "/api/user") {
    const qUserId = Number(url.searchParams.get("id"));
    const u = getUser(qUserId);
    const questions = getUserQuestions(qUserId);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, user: u, questions }));
  }

  // 3. API: отправить вопрос из веб-приложения
  if (url.pathname === "/api/send" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const text = String(data.text || "").trim();
        const senderId = Number(data.senderId) || 0;

        // === Поддержка выбора получателя: по ID или @username ===
        let targetId = OWNER_ID;
        if (data.targetQuery) {
          // Ищем пользователя по @username или числовому ID
          const found = findUser(String(data.targetQuery).trim());
          if (found) {
            targetId = Number(found.id);
          } else if (/^\d+$/.test(String(data.targetQuery).trim())) {
            targetId = Number(data.targetQuery);
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "user_not_found" }));
          }
        } else if (data.targetId) {
          targetId = Number(data.targetId);
        }

        if (text.length >= 2 && text.length <= 800) {
          // Определяем характер и язык получателя
          const receiverPersonality = getUserPersonality(targetId);
          const receiverLang = getUserLanguage(targetId);
          const personality = getPersonality(receiverPersonality);

          const q = saveQuestion(targetId, senderId, text);
          const recipientKb = new InlineKeyboard()
            .text("📸 Создать сторис", `action:card_${q.id}`)
            .row()
            .text("💬 Ответить", `action:reply_${q.id}`);

          const header = personality.newQuestionHeader[receiverLang] || personality.newQuestionHeader.ru;
          const hint = personality.swipeHint[receiverLang] || personality.swipeHint.ru;

          try {
            const sentMsg = await bot.api.sendMessage(
              targetId,
              `${header}\n\n` +
              `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
              hint,
              { parse_mode: "HTML", reply_markup: recipientKb }
            );
            linkMessageToQuestion(sentMsg.message_id, targetId, q.id, "question");
            setLatestQuestion(targetId, q.id);
          } catch (e) {
            console.warn("API send message error:", e.message);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ ok: true, questionId: q.id }));
        }
      } catch (err) {
        console.error("API send error:", err.message);
      }
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: false }));
    });
    return;
  }

  // 3b. API: поиск пользователя по @username для Mini App
  if (url.pathname === "/api/finduser") {
    const query = url.searchParams.get("q") || "";
    const found = findUser(query.trim());
    res.writeHead(200, { "Content-Type": "application/json" });
    if (found) {
      return res.end(JSON.stringify({ ok: true, user: { id: found.id, name: found.name, username: found.username } }));
    }
    return res.end(JSON.stringify({ ok: false }));
  }

  // 3c. API: сохранение языка из Mini App
  if (url.pathname === "/api/setlang") {
    const uId = Number(url.searchParams.get("userId"));
    const lang = url.searchParams.get("lang") || "ru";
    if (uId) setUserLanguage(uId, lang);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, lang }));
  }

  // 3d. API: сохранение характера Лам из Mini App
  if (url.pathname === "/api/setpersonality") {
    const uId = Number(url.searchParams.get("userId"));
    const pers = url.searchParams.get("personality") || "tsundere";
    if (uId) setUserPersonality(uId, pers);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, personality: pers }));
  }

  // 3e. API: создание официальной ссылки оплаты Telegram Stars (для tg.openInvoice прямо внутри Mini App)
  if (url.pathname === "/api/create-invoice" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const stars = Number(data.stars) || 50;
        const userId = Number(data.userId) || OWNER_ID;
        const text = String(data.text || "").trim();
        const targetId = Number(data.targetId) || OWNER_ID;
        const tier = STAR_TIERS[stars] || STAR_TIERS[50];

        let title = tier.name.ru;
        let desc = tier.desc.ru;
        let payloadObj = { type: "donate", tier: tier.id, stars };

        if (text && data.type === "super") {
          const targetUser = getUser(targetId) || { name: "пользователя" };
          title = `👑 VIP Супер-вопрос (${stars} ⭐)`;
          desc = `Анонимный VIP-вопрос для ${targetUser.name} с золотой рамкой!`;
          payloadObj = { t: targetId, q: text, stars };
        }

        const invoiceLink = await bot.api.createInvoiceLink(
          title,
          desc,
          JSON.stringify(payloadObj),
          "",
          "XTR",
          [{ label: `${title}`, amount: stars }]
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, invoiceLink }));
      } catch (e) {
        console.error("Create invoice link error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // 3f. API: быстрый ответ на вопрос прямо из Mini App (без закрытия приложения)
  if (url.pathname === "/api/reply" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const qId = String(data.questionId || "");
        const replyText = String(data.replyText || "").trim();
        const q = getQuestion(qId);

        if (q && replyText.length >= 1) {
          setQuestionReply(q.id, replyText);
          const askAgainKb = createAnswerKeyboard(q);
          try {
            const sentAnswer = await bot.api.sendMessage(
              q.senderId,
              `💬 <b>Ответ на твой анонимный вопрос:</b>\n\n` +
              `Вопрос:\n` +
              `<blockquote>${escapeHtml(q.text)}</blockquote>\n\n` +
              `Ответ:\n` +
              `<blockquote>${escapeHtml(replyText)}</blockquote>\n\n` +
              `<i>💡 Свайпни это сообщение вправо, чтобы ответить ещё!</i>`,
              { parse_mode: "HTML", reply_markup: askAgainKb }
            );
            linkMessageToQuestion(sentAnswer.message_id, q.senderId, q.id, "answer");
          } catch (e) {
            console.warn("Ошибка доставки ответа из Mini App:", e.message);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ ok: true }));
        }
      } catch (e) {
        console.error("API reply error:", e.message);
      }
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: false }));
    });
    return;
  }

  // 3g. API: мгновенная отправка карточки Сторис в чат с ботом (без вылета из Mini App)
  if (url.pathname === "/api/story-card" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const userId = Number(data.userId) || OWNER_ID;
        const theme = String(data.theme || "lum");
        const qId = data.questionId ? String(data.questionId) : null;
        const prompt = String(data.prompt || "");
        const user = getOrCreateUser(userId);
        const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

        if (qId) {
          const q = getQuestion(qId);
          if (q) {
            const pngBuffer = generateQuestionCard(q.text, user.name, theme, q.isSuper);
            await bot.api.sendPhoto(userId, new InputFile(pngBuffer, `story_${qId}.png`), {
              caption: `📸 <b>Готовая карточка с вопросом для Сторис!</b>\n\nСохрани картинку, выложи в Сторис и прикрепи свою ссылку:\n<code>${myLink}</code>`,
              parse_mode: "HTML",
            });
          }
        } else {
          const pngBuffer = generatePromoCard(user.name, botUsername, theme, prompt);
          await bot.api.sendPhoto(userId, new InputFile(pngBuffer, `story_${theme}.png`), {
            caption: `📸 <b>Готовая картинка для твоих Сторис!</b>\n\nВыложи её и прикрепи стикер-ссылку:\n<code>${myLink}</code>`,
            parse_mode: "HTML",
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error("API story card error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  // 4. Главная страница (Mini App)
  const indexPath = path.join(__dirname, "public", "index.html");
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("AKILUM • Анонимные вопросы работают 24/7!");
});

server.listen(port, () => {
  console.log(`✓ HTTP сервер Mini App запущен на порту ${port}`);
});

// Запуск
async function main() {
  await initBotProfile();
  bot.start();
  console.log(`🚀 [AKILUM] NGL-style bot @${botUsername} успешно запущен.`);
}

main().catch(console.error);

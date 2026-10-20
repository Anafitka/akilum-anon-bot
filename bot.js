const { Bot, InputFile, InlineKeyboard } = require("grammy");
const {
  getOrCreateUser,
  getUser,
  saveQuestion,
  getQuestion,
  setQuestionReply,
  getGlobalStats,
} = require("./db");
const {
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
      { command: "start", description: "Моя ссылка" },
      { command: "story", description: "Картинка для Сторис" },
      { command: "stats", description: "Статистика" },
    ]);
    await bot.api.setMyDescription(
      "AKILUM — анонимные вопросы для Instagram и Telegram Stories.\n\n" +
      "Получай честные признания и вопросы от друзей, сохраняя 100% анонимность."
    );
    await bot.api.setMyShortDescription(
      "Анонимные вопросы и признания для твоих Stories 🤫"
    );
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

  // Обычный старт: если зашёл владелец бота — показываем его кабинет
  userStates.delete(userId);
  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

  if (userId === OWNER_ID) {
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

  // Если зашёл сторонний пользователь (нашёл бота в поиске)
  userStates.set(userId, {
    mode: "ask",
    targetId: OWNER_ID,
    targetName: "тебя",
  });

  const strangerKb = new InlineKeyboard()
    .text("🎲 Случайный вопрос", `action:rand_${OWNER_ID}`)
    .row()
    .text("🔗 Создать свою ссылку", "action:my_own_link");

  await ctx.reply(
    `Напиши анонимный вопрос:\n` +
    `<i>(это 100% анонимно 🤫)</i>\n\n` +
    `👇 Отправь сообщение прямо сюда в чат:`,
    { parse_mode: "HTML", reply_markup: strangerKb }
  );
});

// 2. Команда /story
bot.command("story", async (ctx) => {
  await sendPromoCard(ctx);
});

// 3. Команда /stats
bot.command("stats", async (ctx) => {
  await sendStats(ctx);
});

async function sendPromoCard(ctx) {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name);

  await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
  try {
    const pngBuffer = generatePromoCard(user.name, botUsername);
    const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

    await ctx.replyWithPhoto(new InputFile(pngBuffer, "story.png"), {
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
    `• Отправлено ответов: <b>${user.repliesSent || 0}</b>\n\n` +
    `🌐 Всего в AKILUM: <b>${global.totalUsers}</b> пользователей`,
    { parse_mode: "HTML" }
  );
}

// 4. Обработка текстовых сообщений
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = userStates.get(userId);

  // Режим отправки анонимного вопроса
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
      await bot.api.sendMessage(
        state.targetId,
        `💌 <b>Новый анонимный вопрос:</b>\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
    } catch (sendErr) {
      console.warn("Не удалось доставить вопрос:", sendErr.message);
    }
    return;
  }

  // Режим ответа анониму
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
    const askAgainKb = new InlineKeyboard().text(
      "💬 Написать ещё",
      `action:askagain_${q.targetId}`
    );

    try {
      await bot.api.sendMessage(
        q.senderId,
        `💬 <b>Ответ на твой анонимный вопрос:</b>\n\n` +
        `Вопрос:\n` +
        `<blockquote>${escapeHtml(q.text)}</blockquote>\n\n` +
        `Ответ:\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>`,
        { parse_mode: "HTML", reply_markup: askAgainKb }
      );
    } catch (e) {
      console.warn("Не удалось доставить ответ:", e.message);
    }
    return;
  }

  // Если написали текст просто так
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
      await bot.api.sendMessage(
        OWNER_ID,
        `💌 <b>Новый анонимный вопрос из поиска Telegram:</b>\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
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
      await bot.api.sendMessage(
        targetId,
        `💌 <b>Новый анонимный вопрос:</b>\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
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
      const pngBuffer = generateQuestionCard(q.text, user.name);

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

// Встроенный HTTP health-сервер для Render.com / Railway
const http = require("http");
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("AKILUM • Анонимные вопросы работают 24/7!");
}).listen(port, () => {
  console.log(`✓ HTTP сервер для Render запущен на порту ${port}`);
});

// Запуск
async function main() {
  await initBotProfile();
  bot.start();
  console.log(`🚀 [AKILUM] NGL-style bot @${botUsername} успешно запущен.`);
}

main().catch(console.error);

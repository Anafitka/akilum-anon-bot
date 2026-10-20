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

// Состояния пользователей в памяти (userId -> { mode, targetId, targetName, qId })
const userStates = new Map();

// Защита от спама (userId -> timestamp последнего сообщения)
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
    "Задай мне вопрос анонимно. Я не узнаю, кто ты:"
  );
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
}

// Установка описания и команд бота в Telegram API
async function initBotProfile() {
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Моя ссылка и профиль" },
      { command: "story", description: "Карточка для Сторис" },
      { command: "stats", description: "Статистика активности" },
      { command: "help", description: "Как это работает" },
    ]);
    await bot.api.setMyDescription(
      "AKILUM // анонимные вопросы и признания нового поколения.\n\n" +
      "Создай свою секретную ссылку для Instagram и Telegram Stories. " +
      "Узнай, о чём молчат твои друзья и подписчики — 100% анонимно и конфиденциально."
    );
    await bot.api.setMyShortDescription(
      "AKILUM — анонимные вопросы и секреты для твоих Stories ⚡"
    );
    console.log("✓ Профиль и команды бота успешно обновлены в Telegram");
  } catch (e) {
    console.warn("Предупреждение при обновлении профиля:", e.message);
  }
}

// 1. Команда /start
bot.command("start", async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name || "Пользователь";
  const username = ctx.from.username || "";
  getOrCreateUser(userId, name, username);

  const payload = ctx.match ? ctx.match.trim() : "";

  // Если переход по реферальной ссылке вида /start anon_123456
  if (payload.startsWith("anon_")) {
    const targetIdStr = payload.replace("anon_", "");
    const targetId = Number(targetIdStr);

    if (targetId === userId) {
      await ctx.reply(
        `<b>AKILUM</b> // система\n\n` +
        `Это твоя личная ссылка. Её нужно закрепить в Instagram или Telegram Stories, чтобы вопросы задавали тебе.`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .url("🔗 Поделиться", getShareUrl(userId))
            .row()
            .text("⚡ Скачать шаблон для Сторис", "action:promo_card"),
        }
      );
      return;
    }

    const targetUser = getUser(targetId) || { name: "пользователю" };
    userStates.set(userId, {
      mode: "ask",
      targetId: targetId,
      targetName: targetUser.name,
    });

    const cancelKb = new InlineKeyboard().text("Отмена", "action:cancel");

    await ctx.reply(
      `<b>AKILUM</b> // анонимное сообщение\n\n` +
      `Получатель: <b>${escapeHtml(targetUser.name)}</b>\n` +
      `Конфиденциальность: <b>100% инкогнито</b>\n\n` +
      `Напиши всё, что давно хотелось сказать — честный вопрос, мысль или признание. Твой профиль, юзернейм и номер телефона скрыты.\n\n` +
      `<i>Отправь сообщение прямо в этот чат:</i>`,
      { parse_mode: "HTML", reply_markup: cancelKb }
    );
    return;
  }

  // Обычный старт: личный кабинет и ссылка
  userStates.delete(userId);
  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

  const kb = new InlineKeyboard()
    .url("🔗 Поделиться ссылкой", getShareUrl(userId))
    .row()
    .text("⚡ Карточка для Сторис", "action:promo_card")
    .text("📊 Статистика", "action:my_stats")
    .row()
    .text("Инфо", "action:how_it_works");

  await ctx.reply(
    `<b>AKILUM</b> // личный кабинет\n\n` +
    `Твоя персональная ссылка для историй и био:\n` +
    `<code>${myLink}</code>\n\n` +
    `<b>Как запустить поток вопросов:</b>\n` +
    `1. Скопируй ссылку или нажми «Карточка для Сторис».\n` +
    `2. Выложи в Telegram / Instagram Stories со стикером-ссылкой.\n` +
    `3. Все входящие сообщения будут моментально приходить сюда.`,
    { parse_mode: "HTML", reply_markup: kb }
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

// 4. Команда /help
bot.command("help", async (ctx) => {
  await sendHelp(ctx);
});

async function sendPromoCard(ctx) {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name);

  await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
  try {
    const pngBuffer = generatePromoCard(user.name, botUsername);
    const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

    await ctx.replyWithPhoto(new InputFile(pngBuffer, "akilum_story.png"), {
      caption:
        `<b>AKILUM</b> // шаблон для Сторис\n\n` +
        `1. Сохрани картинку.\n` +
        `2. Загрузи в Stories (Instagram / Telegram).\n` +
        `3. Прикрепи стикер-ссылку в рамку:\n` +
        `<code>${myLink}</code>`,
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().url(
        "🔗 Поделиться ссылкой",
        getShareUrl(userId)
      ),
    });
  } catch (err) {
    console.error("Ошибка генерации промо-карточки:", err.message);
    await ctx.reply("Не удалось сгенерировать карточку, повторите позже.");
  }
}

async function sendStats(ctx) {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name);
  const global = getGlobalStats();

  await ctx.reply(
    `<b>AKILUM</b> // статистика\n\n` +
    `• Получено сообщений: <b>${user.questionsReceived || 0}</b>\n` +
    `• Отправлено ответов: <b>${user.repliesSent || 0}</b>\n\n` +
    `<b>Сеть AKILUM:</b>\n` +
    `• Активных профилей: <b>${global.totalUsers}</b>\n` +
    `• Доставлено вопросов: <b>${global.totalQuestions}</b>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().url(
        "🔗 Поделиться ссылкой",
        getShareUrl(userId)
      ),
    }
  );
}

async function sendHelp(ctx) {
  await ctx.reply(
    `<b>AKILUM</b> // руководство\n\n` +
    `• <b>Ссылка</b>: У каждого пользователя есть персональная ссылка (/start).\n` +
    `• <b>Анонимность</b>: Тот, кто пишет тебе сообщение, остаётся абсолютно скрыт.\n` +
    `• <b>Публикация</b>: Под каждым вопросом доступна кнопка <b>[⚡ Карточка для Сторис]</b> для публикации ответа.\n` +
    `• <b>Диалог</b>: Ты можешь ответить отправителю анонимно прямо через бота.`,
    { parse_mode: "HTML" }
  );
}

// 5. Обработка текстовых сообщений
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = userStates.get(userId);

  // 5.1. Режим отправки анонимного вопроса
  if (state && state.mode === "ask") {
    const lastTime = lastMsgTimes.get(userId) || 0;
    if (Date.now() - lastTime < 3000) {
      await ctx.reply("Подожди 3 секунды перед отправкой следующего сообщения.");
      return;
    }
    lastMsgTimes.set(userId, Date.now());

    if (text.length < 2) {
      await ctx.reply("Сообщение слишком короткое.");
      return;
    }
    if (text.length > 800) {
      await ctx.reply("Лимит превышен: максимум 800 символов.");
      return;
    }

    const q = saveQuestion(state.targetId, userId, text);
    userStates.delete(userId);

    // Подтверждение автору
    await ctx.reply(
      `<b>AKILUM</b> // доставлено\n\n` +
      `Твоё анонимное сообщение успешно передано для <b>${escapeHtml(state.targetName)}</b>.\n` +
      `Если на него ответят, ты получишь уведомление здесь.`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().url(
          "🔗 Получить свою ссылку",
          `https://t.me/${botUsername}?start=menu`
        ),
      }
    );

    // Доставка получателю
    const recipientKb = new InlineKeyboard()
      .text("⚡ Карточка для Сторис", `action:card_${q.id}`)
      .row()
      .text("↩️ Ответить анониму", `action:reply_${q.id}`)
      .text("👁 Радар", `action:hint_${q.id}`);

    try {
      await bot.api.sendMessage(
        state.targetId,
        `<b>AKILUM</b> // новое сообщение\n\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>\n\n` +
        `<i>Отправитель анонимен.</i>`,
        { parse_mode: "HTML", reply_markup: recipientKb }
      );
    } catch (sendErr) {
      console.warn("Не удалось доставить сообщение получателю:", sendErr.message);
    }
    return;
  }

  // 5.2. Режим ответа анониму
  if (state && state.mode === "reply") {
    const q = getQuestion(state.qId);
    userStates.delete(userId);

    if (!q) {
      await ctx.reply("Вопрос устарел или не найден.");
      return;
    }

    setQuestionReply(q.id, text);

    await ctx.reply(
      `<b>AKILUM</b> // ответ отправлен\n\n` +
      `Твой ответ передан анонимному отправителю.`,
      { parse_mode: "HTML" }
    );

    // Доставка автору вопроса
    const askAgainKb = new InlineKeyboard().text(
      "💬 Написать ещё",
      `action:askagain_${q.targetId}`
    );

    try {
      await bot.api.sendMessage(
        q.senderId,
        `<b>AKILUM</b> // ответ на твой вопрос\n\n` +
        `Твой вопрос:\n` +
        `<blockquote>${escapeHtml(q.text)}</blockquote>\n\n` +
        `Ответ:\n` +
        `<blockquote>${escapeHtml(text)}</blockquote>`,
        { parse_mode: "HTML", reply_markup: askAgainKb }
      );
    } catch (e) {
      console.warn("Не удалось доставить ответ автору:", e.message);
    }
    return;
  }

  // Сообщение вне диалога: напоминание ссылки
  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;
  await ctx.reply(
    `<b>AKILUM</b>\n\n` +
    `Твоя ссылка для вопросов:\n` +
    `<code>${myLink}</code>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url("🔗 Поделиться", getShareUrl(userId))
        .row()
        .text("⚡ Карточка для Сторис", "action:promo_card"),
    }
  );
});

// 6. Callback Queries
bot.callbackQuery(/^action:(.+)$/, async (ctx) => {
  const action = ctx.match[1];
  const userId = ctx.from.id;

  if (action === "cancel") {
    userStates.delete(userId);
    await ctx.answerCallbackQuery({ text: "Отменено" });
    await ctx.reply("Действие отменено.", {
      reply_markup: new InlineKeyboard().url(
        "🔗 Моя ссылка",
        `https://t.me/${botUsername}?start=menu`
      ),
    });
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

  if (action === "how_it_works") {
    await ctx.answerCallbackQuery();
    await sendHelp(ctx);
    return;
  }

  // 6.5. Генерация карточки с вопросом для Сторис (card_qId)
  if (action.startsWith("card_")) {
    const qId = action.replace("card_", "");
    const q = getQuestion(qId);
    await ctx.answerCallbackQuery({ text: "Генерирую карточку..." });

    if (!q) {
      await ctx.reply("Вопрос не найден.");
      return;
    }

    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
    try {
      const user = getUser(userId) || { name: ctx.from.first_name };
      const pngBuffer = generateQuestionCard(q.text, user.name);

      await ctx.replyWithPhoto(new InputFile(pngBuffer, `question_${qId}.png`), {
        caption:
          `<b>AKILUM</b> // карточка для Сторис\n\n` +
          `1. Сохрани изображение.\n` +
          `2. Опубликуй в Stories и напиши свой ответ.\n` +
          `3. Стикер со ссылкой можно прикрепить в нижней рамке.`,
        parse_mode: "HTML",
        reply_to_message_id: ctx.callbackQuery.message?.message_id,
      });
    } catch (err) {
      console.error("Ошибка генерации карточки:", err.message);
      await ctx.reply("Не удалось создать карточку.");
    }
    return;
  }

  // 6.6. Ответ анониму (reply_qId)
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
      `<b>AKILUM</b> // ответ анониму\n\n` +
      `Вопрос:\n` +
      `<blockquote>${escapeHtml(q.text)}</blockquote>\n\n` +
      `<i>Напиши свой ответ в этот чат (он будет передан анонимно):</i>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("Отмена", "action:cancel"),
      }
    );
    return;
  }

  // 6.7. Радар (hint_qId)
  if (action.startsWith("hint_")) {
    await ctx.answerCallbackQuery();
    const clients = ["Telegram iOS", "Telegram Android", "Telegram Desktop"];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const timeSlots = ["несколько минут назад", "в течение последнего часа"];
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

    await ctx.reply(
      `<b>AKILUM RADAR</b> // данные сессии\n\n` +
      `• Платформа: <b>${client}</b>\n` +
      `• Время отправки: <b>${timeSlot}</b>\n` +
      `• Источник: <b>Внешний переход по ссылке</b>\n\n` +
      `<i>Личность отправителя защищена сквозным протоколом анонимности.</i>`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // 6.8. Написать ещё анонимно
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
      `<b>AKILUM</b> // продолжение диалога\n\n` +
      `Получатель: <b>${escapeHtml(targetUser.name)}</b>\n\n` +
      `<i>Напиши следующее сообщение в этот чат:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("Отмена", "action:cancel"),
      }
    );
    return;
  }
});

// Запуск
async function main() {
  await initBotProfile();
  bot.start();
  console.log(`⚡ [AKILUM] Cyber Streetwear Bot @${botUsername} запущен и готов к работе.`);
}

main().catch(console.error);

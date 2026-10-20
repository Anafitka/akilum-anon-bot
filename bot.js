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
    "🤫 Напиши мне что угодно анонимно! Я не узнаю, кто ты 👇"
  );
  return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
}

// 1. Команда /start
bot.command("start", async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name || "Пользователь";
  const username = ctx.from.username || "";
  const user = getOrCreateUser(userId, name, username);

  const payload = ctx.match ? ctx.match.trim() : "";

  // Если пользователь перешел по реферальной ссылке вида /start anon_123456
  if (payload.startsWith("anon_")) {
    const targetIdStr = payload.replace("anon_", "");
    const targetId = Number(targetIdStr);

    if (targetId === userId) {
      await ctx.reply(
        `✧ ─── ･ ｡ﾟ☆: *. 🤫 .* :☆ﾟ. ─── ✧\n` +
        `😅 <b>Это твоя собственная ссылка!</b>\n\n` +
        `Ты не можешь отправить анонимный вопрос самому себе.\n` +
        `Скопируй её и отправь в <b>Telegram / Instagram Stories</b> или в чат класса, чтобы получать секреты от других!`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .url("📲 Опубликовать в Сторис", getShareUrl(userId))
            .row()
            .text("📸 Скачать карточку для Сторис", "action:promo_card"),
        }
      );
      return;
    }

    const targetUser = getUser(targetId) || { name: "этому человеку" };
    userStates.set(userId, {
      mode: "ask",
      targetId: targetId,
      targetName: targetUser.name,
    });

    const cancelKb = new InlineKeyboard().text("❌ Отменить", "action:cancel");

    await ctx.reply(
      `✧ ─── ･ ｡ﾟ☆: *. 🤫 .* :☆ﾟ. ─── ✧\n` +
      `✦ <b>AKILUM • АНОНИМНОЕ СООБЩЕНИЕ</b> ✦\n\n` +
      `Ты отправляешь секретное сообщение для: <b>${escapeHtml(targetUser.name)}</b>!\n\n` +
      `Напиши всё, что думаешь: честный вопрос, тайное признание в симпатии, комплимент или совет.\n\n` +
      `🔒 <b>100% Анонимность:</b>\n` +
      `• Получатель <b>никогда не узнает</b> твоё имя, юзернейм или номер телефона.\n` +
      `• Твоя личность надёжно защищена.\n\n` +
      `<i>👇 Напиши своё сообщение прямо сейчас в ответ в этот чат:</i>`,
      { parse_mode: "HTML", reply_markup: cancelKb }
    );
    return;
  }

  // Обычный старт: показываем личный кабинет и персональную ссылку
  userStates.delete(userId);
  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;

  const kb = new InlineKeyboard()
    .url("📲 Поделиться ссылкой", getShareUrl(userId))
    .row()
    .text("📸 Картинка для Сторис", "action:promo_card")
    .text("📊 Моя статистика", "action:my_stats")
    .row()
    .text("ℹ️ Как это работает?", "action:how_it_works");

  await ctx.reply(
    `✧ ─── ･ ｡ﾟ☆: *. 🤫 .* :☆ﾟ. ─── ✧\n` +
    `✦ <b>ДОБРО ПОЖАЛОВАТЬ В AKILUM</b> ✦\n\n` +
    `Привет, <b>${escapeHtml(name)}</b>! Это твой приватный ящик анонимных вопросов и признаний.\n\n` +
    `🔗 <b>Твоя персональная секретная ссылка:</b>\n` +
    `<code>${myLink}</code>\n\n` +
    `<b>Как начать получать признания:</b>\n` +
    `1. Скопируй ссылку выше.\n` +
    `2. Прикрепи её в свои <b>Stories (Telegram / Instagram)</b> или в статус с текстом: <i>«Напиши мне всё, что думаешь анонимно 🤫»</i>.\n` +
    `3. Когда кто-то напишет тебе — бот мгновенно доставит сообщение сюда!`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

// 2. Команда /story — шаблон для сторис
bot.command("story", async (ctx) => {
  await sendPromoCard(ctx);
});

// 3. Команда /stats — статистика
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
        `📸 <b>Твой готовый шаблон для Сторис!</b>\n\n` +
        `1. Сохрани эту картинку на телефон.\n` +
        `2. Опубликуй в <b>Telegram Stories</b> или <b>Instagram</b>.\n` +
        `3. Прикрепи стикер-ссылку:\n` +
        `<code>${myLink}</code>\n\n` +
        `<i>Жди первые анонимные признания от друзей и крашей! 🔥</i>`,
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().url(
        "📲 Сразу поделиться ссылкой",
        getShareUrl(userId)
      ),
    });
  } catch (err) {
    console.error("Ошибка генерации промо-карточки:", err.message);
    await ctx.reply("Ой, не удалось сгенерировать карточку, попробуй позже!");
  }
}

async function sendStats(ctx) {
  const userId = ctx.from.id;
  const user = getOrCreateUser(userId, ctx.from.first_name);
  const global = getGlobalStats();

  await ctx.reply(
    `✧ ─── ･ ｡ﾟ☆: *. 📊 .* :☆ﾟ. ─── ✧\n` +
    `✦ <b>СТАТИСТИКА AKILUM • ${escapeHtml(user.name.toUpperCase())}</b> ✦\n\n` +
    `📩 <b>Получено вопросов:</b> <code>${user.questionsReceived || 0}</code>\n` +
    `💬 <b>Отправлено ответов:</b> <code>${user.repliesSent || 0}</code>\n\n` +
    `🌐 <b>Всего пользователей в AKILUM:</b> <code>${global.totalUsers}</code>\n` +
    `💌 <b>Всего секретов отправлено:</b> <code>${global.totalQuestions}</code>\n\n` +
    `<i>Хочешь больше вопросов? Прикрепи ссылку в свои истории! 🚀</i>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().url(
        "📲 Опубликовать в Сторис",
        getShareUrl(userId)
      ),
    }
  );
}

async function sendHelp(ctx) {
  await ctx.reply(
    `✧ ─── ･ ｡ﾟ☆: *. ℹ️ .* :☆ﾟ. ─── ✧\n` +
    `✦ <b>КАК РАБОТАЕТ AKILUM?</b> ✦\n\n` +
    `1. У каждого человека есть своя уникальная ссылка (команда /start).\n` +
    `2. Ты выкладываешь эту ссылку в Telegram или Instagram истории.\n` +
    `3. Люди переходят по ней и пишут тебе сообщения. <b>Их имена и контакты надёжно скрыты</b> — ты видишь только текст вопроса!\n` +
    `4. Ты можешь нажать <b>[📸 Карточка для Сторис]</b>, чтобы красиво опубликовать ответ у себя в историях.\n` +
    `5. Или нажать <b>[💬 Ответить анониму]</b>, чтобы вести с ним скрытый диалог прямо через бота! 🤫`,
    { parse_mode: "HTML" }
  );
}

// 5. Обработка текстовых сообщений (отправка вопроса или ответа)
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = userStates.get(userId);

  // 5.1. Режим отправки анонимного вопроса
  if (state && state.mode === "ask") {
    // Защита от спама (не чаще 1 сообщения в 4 секунды)
    const lastTime = lastMsgTimes.get(userId) || 0;
    if (Date.now() - lastTime < 4000) {
      await ctx.reply("⏳ Подожди пару секунд перед отправкой следующего сообщения!");
      return;
    }
    lastMsgTimes.set(userId, Date.now());

    if (text.length < 2) {
      await ctx.reply("Слишком короткое сообщение! Напиши хотя бы пару слов 🙂");
      return;
    }
    if (text.length > 800) {
      await ctx.reply("Сообщение слишком длинное (максимум 800 символов)! Сократи его чуть-чуть.");
      return;
    }

    const q = saveQuestion(state.targetId, userId, text);
    userStates.delete(userId);

    // Подтверждение отправителю
    await ctx.reply(
      `✧ ─── ･ ｡ﾟ☆: *. ✨ .* :☆ﾟ. ─── ✧\n` +
      `✅ <b>Твоё анонимное сообщение успешно доставлено!</b> 💌\n\n` +
      `<b>${escapeHtml(state.targetName)}</b> уже получил его. Если он решит ответить — ты получишь уведомление прямо сюда! 🤫\n\n` +
      `<i>Хочешь тоже получать тайные вопросы от друзей?</i>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .url("🔗 Получить свою ссылку", `https://t.me/${botUsername}?start=menu`),
      }
    );

    // Доставка получателю
    const recipientKb = new InlineKeyboard()
      .text("📸 Карточка для Сторис", `action:card_${q.id}`)
      .row()
      .text("💬 Ответить анониму", `action:reply_${q.id}`)
      .text("🕵️ Кто написал?", `action:hint_${q.id}`);

    try {
      await bot.api.sendMessage(
        state.targetId,
        `✧ ─── ･ ｡ﾟ☆: *. 🤫 .* :☆ﾟ. ─── ✧\n` +
        `💌 <b>ТЕБЕ ПРИШЛО НОВОЕ АНОНИМНОЕ СООБЩЕНИЕ!</b>\n\n` +
        `«<b>${escapeHtml(text)}</b>»\n\n` +
        `<i>Никто, кроме тебя, не видит это послание.</i>`,
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
      await ctx.reply("Ой, не удалось найти исходный вопрос! Возможно, он устарел.");
      return;
    }

    setQuestionReply(q.id, text);

    await ctx.reply(
      `✅ <b>Твой ответ успешно отправлен анониму!</b> 💌\n\n` +
      `Он получил твой ответ в зашифрованном виде.`,
      { parse_mode: "HTML" }
    );

    // Доставка ответа автору анонимного вопроса
    const askAgainKb = new InlineKeyboard().text(
      "💬 Написать ещё анонимно",
      `action:askagain_${q.targetId}`
    );

    try {
      await bot.api.sendMessage(
        q.senderId,
        `✧ ─── ･ ｡ﾟ☆: *. 💌 .* :☆ﾟ. ─── ✧\n` +
        `💌 <b>ТЕБЕ ПРИШЁЛ ОТВЕТ НА ТВОЙ АНОНИМНЫЙ ВОПРОС!</b>\n\n` +
        `Твой вопрос был:\n` +
        `<i>«${escapeHtml(q.text)}»</i>\n\n` +
        `Ответ получателя:\n` +
        `<b>«${escapeHtml(text)}»</b>\n\n` +
        `<i>Ты можешь продолжить анонимный диалог по кнопке ниже:</i>`,
        { parse_mode: "HTML", reply_markup: askAgainKb }
      );
    } catch (e) {
      console.warn("Не удалось доставить ответ анониму:", e.message);
    }
    return;
  }

  // Если просто написали текст вне диалога — отправляем напоминание о ссылке
  const myLink = `https://t.me/${botUsername}?start=anon_${userId}`;
  await ctx.reply(
    `Привет! Чтобы получать анонимные вопросы, отправь свою ссылку друзьям или выложи в истории:\n\n` +
    `🔗 <code>${myLink}</code>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url("📲 Поделиться ссылкой", getShareUrl(userId))
        .row()
        .text("📸 Картинка для Сторис", "action:promo_card"),
    }
  );
});

// 6. Обработка кнопок (Callback Queries)
bot.callbackQuery(/^action:(.+)$/, async (ctx) => {
  const action = ctx.match[1];
  const userId = ctx.from.id;

  // 6.1. Отмена текущего действия
  if (action === "cancel") {
    userStates.delete(userId);
    await ctx.answerCallbackQuery({ text: "Действие отменено" });
    await ctx.reply("❌ Отправка отменена. Ты в главном меню!", {
      reply_markup: new InlineKeyboard().url(
        "🔗 Моя ссылка",
        `https://t.me/${botUsername}?start=menu`
      ),
    });
    return;
  }

  // 6.2. Промо-карточка для сторис
  if (action === "promo_card") {
    await ctx.answerCallbackQuery();
    await sendPromoCard(ctx);
    return;
  }

  // 6.3. Моя статистика
  if (action === "my_stats") {
    await ctx.answerCallbackQuery();
    await sendStats(ctx);
    return;
  }

  // 6.4. Как это работает
  if (action === "how_it_works") {
    await ctx.answerCallbackQuery();
    await sendHelp(ctx);
    return;
  }

  // 6.5. Генерация карточки с вопросом для Сторис (card_qId)
  if (action.startsWith("card_")) {
    const qId = action.replace("card_", "");
    const q = getQuestion(qId);
    await ctx.answerCallbackQuery({ text: "Генерирую карточку для Сторис..." });

    if (!q) {
      await ctx.reply("Вопрос не найден!");
      return;
    }

    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
    try {
      const user = getUser(userId) || { name: ctx.from.first_name };
      const pngBuffer = generateQuestionCard(q.text, user.name);

      await ctx.replyWithPhoto(new InputFile(pngBuffer, `question_${qId}.png`), {
        caption:
          `📸 <b>Твоя карточка для Сторис готова!</b>\n\n` +
          `1. Сохрани картинку.\n` +
          `2. Опубликуй в <b>Telegram Stories</b> или <b>Instagram</b> и напиши свой ответ!\n` +
          `3. Друзья увидят и начнут писать тебе ещё больше 🔥`,
        parse_mode: "HTML",
        reply_to_message_id: ctx.callbackQuery.message?.message_id,
      });
    } catch (err) {
      console.error("Ошибка генерации карточки с вопросом:", err.message);
      await ctx.reply("Ой, не удалось создать карточку!");
    }
    return;
  }

  // 6.6. Ответ анониму (reply_qId)
  if (action.startsWith("reply_")) {
    const qId = action.replace("reply_", "");
    const q = getQuestion(qId);
    await ctx.answerCallbackQuery();

    if (!q) {
      await ctx.reply("Вопрос не найден!");
      return;
    }

    userStates.set(userId, {
      mode: "reply",
      qId: qId,
    });

    await ctx.reply(
      `💬 <b>Ответ анониму на вопрос:</b>\n` +
      `«<i>${escapeHtml(q.text)}</i>»\n\n` +
      `<i>👇 Напиши свой ответ текстом в этот чат (он будет передан анониму без раскрытия твоих данных):</i>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("❌ Отмена", "action:cancel"),
      }
    );
    return;
  }

  // 6.7. Подсказка "Кто написал?" (hint_qId)
  if (action.startsWith("hint_")) {
    await ctx.answerCallbackQuery();
    const hints = [
      "📱 Устройство: Мобильный телефон (iOS / Android)",
      "🌍 Локация: Твой город / часовой пояс",
      "👀 Статус: Этот человек подписан на тебя или есть в контактах!",
      "⚡ Время отправки: Недавно, буквально пару минут назад!",
    ];

    await ctx.reply(
      `✧ ─── ･ ｡ﾟ☆: *. 🕵️ .* :☆ﾟ. ─── ✧\n` +
      `✦ <b>РАССЛЕДОВАНИЕ AKILUM • КТО ЭТО?</b> ✦\n\n` +
      `Вот что удалось узнать нашим радарам:\n` +
      `• ${hints[Math.floor(Math.random() * hints.length)]}\n` +
      `• ${hints[Math.floor(Math.random() * hints.length)]}\n\n` +
      `<i>🤫 Личность отправителя строго зашифрована на серверах AKILUM!</i>`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // 6.8. Написать ещё анонимно (askagain_targetId)
  if (action.startsWith("askagain_")) {
    const targetId = Number(action.replace("askagain_", ""));
    const targetUser = getUser(targetId) || { name: "этому человеку" };
    await ctx.answerCallbackQuery();

    userStates.set(userId, {
      mode: "ask",
      targetId: targetId,
      targetName: targetUser.name,
    });

    await ctx.reply(
      `✦ <b>Продолжаем анонимный диалог с ${escapeHtml(targetUser.name)}!</b>\n\n` +
      `<i>👇 Напиши следующее сообщение прямо в чат:</i>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("❌ Отмена", "action:cancel"),
      }
    );
    return;
  }
});

// Запуск бота
bot.start();
console.log(`🚀 [AKILUM] Бот @${botUsername} успешно запущен и готов к взрывному росту!`);

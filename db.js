const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "database.json");

let data = {
  users: {},
  questions: {},
  stats: {
    totalQuestions: 0,
    totalReplies: 0,
  },
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      data = JSON.parse(raw);
    }
  } catch (e) {
    console.error("[DB] Ошибка чтения базы:", e.message);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[DB] Ошибка записи базы:", e.message);
  }
}

loadDatabase();

function getOrCreateUser(userId, name = "Пользователь", username = "") {
  const idStr = String(userId);
  if (!data.users[idStr]) {
    data.users[idStr] = {
      id: Number(userId),
      name,
      username: username ? (username.startsWith("@") ? username : `@${username}`) : "",
      personality: "tsundere", // tsundere, kawaii, alien, flirty
      language: "ru",          // ru, en, ja
      isPremium: false,
      premiumTier: null,
      questionsReceived: 0,
      repliesSent: 0,
      starsReceived: 0,
      createdAt: new Date().toISOString(),
    };
    saveDatabase();
  } else {
    // Обновляем имя и юзернейм если сменились
    let updated = false;
    if (name && data.users[idStr].name !== name) {
      data.users[idStr].name = name;
      updated = true;
    }
    if (username) {
      const cleanUname = username.startsWith("@") ? username : `@${username}`;
      if (data.users[idStr].username !== cleanUname) {
        data.users[idStr].username = cleanUname;
        updated = true;
      }
    }
    if (!data.users[idStr].personality) {
      data.users[idStr].personality = "tsundere";
      updated = true;
    }
    if (!data.users[idStr].language) {
      data.users[idStr].language = "ru";
      updated = true;
    }
    if (updated) saveDatabase();
  }
  return data.users[idStr];
}

function getUser(userId) {
  return data.users[String(userId)] || null;
}

function findUser(query) {
  if (!query) return null;
  const qStr = String(query).trim();
  
  // 1. Поиск по чистому ID
  if (/^\d+$/.test(qStr)) {
    const byId = data.users[qStr];
    if (byId) return byId;
  }
  
  // 2. Поиск по юзернейму (с @ или без)
  const cleanUname = qStr.replace(/^@/, "").toLowerCase();
  for (const id of Object.keys(data.users || {})) {
    const u = data.users[id];
    if (u.username) {
      const dbUname = u.username.replace(/^@/, "").toLowerCase();
      if (dbUname === cleanUname) return u;
    }
  }

  // 3. Поиск по точному имени (case-insensitive)
  for (const id of Object.keys(data.users || {})) {
    const u = data.users[id];
    if (u.name && u.name.toLowerCase() === qStr.toLowerCase()) return u;
  }

  return null;
}

function setUserPersonality(userId, personality) {
  const allowed = ["tsundere", "kawaii", "alien", "flirty"];
  const p = allowed.includes(personality) ? personality : "tsundere";
  const u = getOrCreateUser(userId);
  u.personality = p;
  saveDatabase();
  return p;
}

function getUserPersonality(userId) {
  const u = getUser(userId);
  return (u && u.personality) || "tsundere";
}

function setUserLanguage(userId, lang) {
  const allowed = ["ru", "en", "ja"];
  const l = allowed.includes(lang) ? lang : "ru";
  const u = getOrCreateUser(userId);
  u.language = l;
  saveDatabase();
  return l;
}

function getUserLanguage(userId) {
  const u = getUser(userId);
  return (u && u.language) || "ru";
}

function setUserPremium(userId, isPremium = true, tier = "stars_150") {
  const u = getOrCreateUser(userId);
  u.isPremium = !!isPremium;
  u.premiumTier = tier;
  u.premiumActivatedAt = Date.now();
  saveDatabase();
  return u;
}

function isUserPremium(userId) {
  const u = getUser(userId);
  return !!(u && (u.isPremium || (u.starsReceived && u.starsReceived >= 50)));
}

function saveQuestion(targetId, senderId, text, options = {}) {
  const qId = "q_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  data.questions[qId] = {
    id: qId,
    targetId: Number(targetId),
    senderId: Number(senderId),
    text: text.trim(),
    createdAt: Date.now(),
    replyText: null,
    isSuper: !!options.isSuper,
    stars: Number(options.stars) || 0,
    theme: options.theme || "lum",
    reaction: null,
  };

  const target = getOrCreateUser(targetId);
  target.questionsReceived = (target.questionsReceived || 0) + 1;
  if (options.stars) {
    target.starsReceived = (target.starsReceived || 0) + Number(options.stars);
    target.superQuestionsReceived = (target.superQuestionsReceived || 0) + 1;
  }
  data.stats.totalQuestions = (data.stats.totalQuestions || 0) + 1;

  saveDatabase();
  return data.questions[qId];
}

function addStarsToUser(userId, amount) {
  const u = getOrCreateUser(userId);
  u.starsReceived = (u.starsReceived || 0) + Number(amount);
  saveDatabase();
  return u;
}

function saveQuestionReaction(qId, reaction) {
  const q = data.questions[qId];
  if (!q) return null;
  q.reaction = reaction;
  saveDatabase();
  return q;
}

function getQuestion(qId) {
  return data.questions[qId] || null;
}

function setQuestionReply(qId, replyText) {
  const q = data.questions[qId];
  if (!q) return null;
  q.replyText = replyText;
  q.repliedAt = Date.now();

  const target = getOrCreateUser(q.targetId);
  target.repliesSent = (target.repliesSent || 0) + 1;
  data.stats.totalReplies = (data.stats.totalReplies || 0) + 1;

  saveDatabase();
  return q;
}

function getGlobalStats() {
  return {
    totalUsers: Object.keys(data.users).length,
    totalQuestions: data.stats.totalQuestions || 0,
    totalReplies: data.stats.totalReplies || 0,
  };
}

// Привязка message_id к вопросу для мгновенного ответа свайпом
function linkMessageToQuestion(messageId, chatId, qId, type) {
  if (!data.messageMap) data.messageMap = {};
  const key = `${chatId}_${messageId}`;
  data.messageMap[key] = { qId, type, time: Date.now() };
  saveDatabase();
}

function getQuestionByMessage(messageId, chatId) {
  if (!data.messageMap) return null;
  const key = `${chatId}_${messageId}`;
  return data.messageMap[key] || null;
}

function setLatestQuestion(userId, qId) {
  if (!data.latestQuestions) data.latestQuestions = {};
  data.latestQuestions[String(userId)] = { qId, time: Date.now() };
  saveDatabase();
}

function getLatestQuestion(userId) {
  if (!data.latestQuestions) return null;
  const item = data.latestQuestions[String(userId)];
  if (!item) return null;
  if (Date.now() - item.time < 24 * 60 * 60 * 1000) {
    return data.questions[item.qId] || null;
  }
  return null;
}

function getUserQuestions(userId) {
  const result = [];
  const targetIdNum = Number(userId);
  for (const qId of Object.keys(data.questions || {})) {
    const q = data.questions[qId];
    if (q.targetId === targetIdNum) {
      result.push(q);
    }
  }
  return result.sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
}

module.exports = {
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
};

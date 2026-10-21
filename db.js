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
      id: userId,
      name,
      username: username ? `@${username}` : "",
      questionsReceived: 0,
      repliesSent: 0,
      createdAt: new Date().toISOString(),
    };
    saveDatabase();
  } else {
    // Обновляем имя если сменилось
    if (name && data.users[idStr].name !== name) {
      data.users[idStr].name = name;
      data.users[idStr].username = username ? `@${username}` : data.users[idStr].username;
      saveDatabase();
    }
  }
  return data.users[idStr];
}

function getUser(userId) {
  return data.users[String(userId)] || null;
}

function saveQuestion(targetId, senderId, text) {
  const qId = "q_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  data.questions[qId] = {
    id: qId,
    targetId: Number(targetId),
    senderId: Number(senderId),
    text: text.trim(),
    createdAt: Date.now(),
    replyText: null,
  };

  const target = getOrCreateUser(targetId);
  target.questionsReceived = (target.questionsReceived || 0) + 1;
  data.stats.totalQuestions = (data.stats.totalQuestions || 0) + 1;

  saveDatabase();
  return data.questions[qId];
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
  saveQuestion,
  getQuestion,
  setQuestionReply,
  getGlobalStats,
  linkMessageToQuestion,
  getQuestionByMessage,
  setLatestQuestion,
  getLatestQuestion,
  getUserQuestions,
};

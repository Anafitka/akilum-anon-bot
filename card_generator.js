const { Resvg } = require("@resvg/resvg-js");

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text, maxCharsPerLine = 22) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

const THEMES = {
  lum: {
    bgGrad: `<stop offset="0%" stop-color="#00F5D4"/><stop offset="45%" stop-color="#00C896"/><stop offset="100%" stop-color="#FFD600"/>`,
    cardBg: "#ffffff",
    cardBorder: "#ffffff",
    textColor: "#111827",
    badgeBg: "#f3f4f6",
    badgeText: "#4b5563",
    badgeLabel: "⚡ анонимно",
    watermarkText: "#9ca3af",
    accentColor: "#00C896",
  },
  gold: {
    bgGrad: `<stop offset="0%" stop-color="#FFE259"/><stop offset="50%" stop-color="#FFA751"/><stop offset="100%" stop-color="#FF5722"/>`,
    cardBg: "#121118",
    cardBorder: "#FFD700",
    textColor: "#ffffff",
    badgeBg: "rgba(255, 215, 0, 0.22)",
    badgeText: "#FFD700",
    badgeLabel: "👑 СУПЕР-ВОПРОС",
    watermarkText: "#e5c058",
    accentColor: "#FFD700",
  },
  obsidian: {
    bgGrad: `<stop offset="0%" stop-color="#050608"/><stop offset="50%" stop-color="#141824"/><stop offset="100%" stop-color="#08090d"/>`,
    cardBg: "#11141c",
    cardBorder: "rgba(255, 255, 255, 0.16)",
    textColor: "#ffffff",
    badgeBg: "rgba(255, 255, 255, 0.08)",
    badgeText: "#9aa3b2",
    badgeLabel: "🖤 stealth",
    watermarkText: "#5f687a",
    accentColor: "#ffffff",
  },
  sakura: {
    bgGrad: `<stop offset="0%" stop-color="#FF2A85"/><stop offset="50%" stop-color="#8A2387"/><stop offset="100%" stop-color="#00F0FF"/>`,
    cardBg: "#ffffff",
    cardBorder: "#ffffff",
    textColor: "#111827",
    badgeBg: "#fdf2f8",
    badgeText: "#db2777",
    badgeLabel: "🌸 секрет",
    watermarkText: "#9ca3af",
    accentColor: "#db2777",
  },
};

/**
 * 1. Карточка с вопросом для Сторис (1080x1920)
 */
function generateQuestionCard(questionText, recipientName = "", themeKey = "lum", isSuper = false) {
  const lines = wrapText(questionText, 22).slice(0, 6);
  const lineHeight = 66;
  const startY = 870 - ((lines.length - 1) * lineHeight) / 2;

  const tspanLines = lines
    .map(
      (line, i) =>
        `<tspan x="540" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("\n");

  const effectiveThemeKey = isSuper ? "gold" : (THEMES[themeKey] ? themeKey : "lum");
  const th = THEMES[effectiveThemeKey];

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      ${th.bgGrad}
    </linearGradient>

    <!-- Мягкая реалистичная тень как в iOS/Figma -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.25"/>
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Фон -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>

  <!-- Верхняя плашка приложения -->
  <g transform="translate(540, 240)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
      AKILUM
    </text>
  </g>

  <!-- Главная карточка с вопросом -->
  <g filter="url(#softShadow)">
    <rect x="80" y="520" width="920" height="640" rx="48" fill="${th.cardBg}" stroke="${th.cardBorder}" stroke-width="${isSuper ? 4 : 2}"/>
  </g>

  <!-- Бейдж сверху карточки -->
  <g transform="translate(540, 590)">
    <rect x="-160" y="0" width="320" height="52" rx="26" fill="${th.badgeBg}"/>
    <text x="0" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="${th.badgeText}" text-anchor="middle">
      ${escapeXml(th.badgeLabel)}
    </text>
  </g>

  <!-- Текст вопроса -->
  <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="${th.textColor}" text-anchor="middle">
    ${tspanLines}
  </text>

  <!-- Нижний водяной знак на карточке -->
  <text x="540" y="1110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="${th.watermarkText}" text-anchor="middle" letter-spacing="1">
    t.me/akilum_anon_bot
  </text>

  <!-- Блок под наклейку-ссылку Instagram / Telegram Stories -->
  <g transform="translate(140, 1420)">
    <rect width="800" height="130" rx="65" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <text x="400" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="#ffffff" text-anchor="middle">
      🔗 ОТВЕТ В СТОРИС
    </text>
    <text x="400" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.85)" text-anchor="middle">
      жми сюда, чтобы тоже задать вопрос
    </text>
  </g>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 },
  });
  return resvg.render().asPng();
}

/**
 * 2. Промо-карточка для выкладывания в Сторис, чтобы собирать вопросы
 */
function generatePromoCard(name = "мне", botUsername = "akilum_anon_bot", themeKey = "lum", customPrompt = "") {
  const th = THEMES[themeKey] || THEMES.lum;
  const promptText = customPrompt && customPrompt.trim().length > 3
    ? customPrompt.trim()
    : "Напиши мне всё,\nо чём молчишь...";

  const promptLines = promptText.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 3);
  const promptSvg = promptLines.map((l, idx) => 
    `<text x="0" y="${idx * 70}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="50" font-weight="900" fill="${th.textColor}" text-anchor="middle">${escapeXml(l)}</text>`
  ).join("\n");
  const subTextY = promptLines.length * 70 + 70;

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      ${th.bgGrad}
    </linearGradient>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.25"/>
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGradient)"/>

  <!-- Логотип -->
  <g transform="translate(540, 240)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
      AKILUM
    </text>
  </g>

  <!-- Карточка призыва к действию (NGL Look) -->
  <g filter="url(#softShadow)">
    <rect x="80" y="520" width="920" height="640" rx="48" fill="${th.cardBg}" stroke="${th.cardBorder}" stroke-width="2"/>
  </g>

  <!-- Бейдж -->
  <g transform="translate(540, 590)">
    <rect x="-180" y="0" width="360" height="52" rx="26" fill="${th.badgeBg}"/>
    <text x="0" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="${th.badgeText}" text-anchor="middle">
      🎲 ask me anything
    </text>
  </g>

  <!-- Крупный заголовок -->
  <g transform="translate(540, 750)">
    ${promptSvg}
    <text x="0" y="${subTextY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="26" font-weight="800" fill="${th.accentColor}" text-anchor="middle">
      🔒 100% анонимно • Я не узнаю, кто ты
    </text>
  </g>

  <!-- Водяной знак -->
  <text x="540" y="1110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="${th.watermarkText}" text-anchor="middle" letter-spacing="1">
    t.me/${escapeXml(botUsername)}
  </text>

  <!-- Место под наклейку-ссылку в Instagram / Telegram Stories -->
  <g transform="translate(140, 1420)">
    <rect width="800" height="130" rx="65" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <text x="400" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="#ffffff" text-anchor="middle">
      👆 ПРИКРЕПИ СТИКЕР СЮДА
    </text>
    <text x="400" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.85)" text-anchor="middle">
      ссылка в боте @${escapeXml(botUsername)}
    </text>
  </g>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 },
  });
  return resvg.render().asPng();
}

module.exports = {
  THEMES,
  generateQuestionCard,
  generatePromoCard,
};

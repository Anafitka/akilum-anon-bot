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

/**
 * 1. Карточка с вопросом для Сторис (1080x1920)
 * Точная эстетика вирусного NGL (Instagram / Telegram Stories)
 */
function generateQuestionCard(questionText, recipientName = "", theme = "sunset") {
  const lines = wrapText(questionText, 22).slice(0, 6);
  const lineHeight = 66;
  const startY = 870 - ((lines.length - 1) * lineHeight) / 2;

  const tspanLines = lines
    .map(
      (line, i) =>
        `<tspan x="540" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("\n");

  // Цветовые схемы
  const isDark = theme === "dark";
  const bgGrad = isDark
    ? `<stop offset="0%" stop-color="#0a0914"/><stop offset="50%" stop-color="#141126"/><stop offset="100%" stop-color="#0b0a15"/>`
    : `<stop offset="0%" stop-color="#FF385C"/><stop offset="50%" stop-color="#FF5A36"/><stop offset="100%" stop-color="#FFA033"/>`;

  const cardBg = isDark ? "#171524" : "#ffffff";
  const cardBorder = isDark ? "#28233d" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#111827";
  const badgeBg = isDark ? "#231f38" : "#f3f4f6";
  const badgeText = isDark ? "#a79fc2" : "#6b7280";
  const watermarkText = isDark ? "#6a6482" : "#9ca3af";
  const stickerBoxBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)";
  const stickerBoxBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)";
  const stickerBoxText = isDark ? "#ffffff" : "#ffffff";

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      ${bgGrad}
    </linearGradient>

    <!-- Мягкая реалистичная тень как в iOS/Figma -->
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.22"/>
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Сочный градиентный фон -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>

  <!-- Верхняя плашка приложения -->
  <g transform="translate(540, 240)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">
      AKILUM
    </text>
  </g>

  <!-- Главная карточка с вопросом (NGL Style) -->
  <g filter="url(#softShadow)">
    <rect x="80" y="520" width="920" height="640" rx="48" fill="${cardBg}" stroke="${cardBorder}" stroke-width="2"/>
  </g>

  <!-- Бейдж сверху карточки -->
  <g transform="translate(540, 590)">
    <rect x="-140" y="0" width="280" height="48" rx="24" fill="${badgeBg}"/>
    <text x="0" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="${badgeText}" text-anchor="middle">
      🤫 анонимно
    </text>
  </g>

  <!-- Текст вопроса -->
  <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="${textColor}" text-anchor="middle">
    ${tspanLines}
  </text>

  <!-- Нижний водяной знак на карточке -->
  <text x="540" y="1110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="${watermarkText}" text-anchor="middle" letter-spacing="1">
    t.me/akilum_anon_bot
  </text>

  <!-- Блок под наклейку-ссылку Instagram / Telegram Stories -->
  <g transform="translate(140, 1420)">
    <rect width="800" height="130" rx="65" fill="${stickerBoxBg}" stroke="${stickerBoxBorder}" stroke-width="2"/>
    <text x="400" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="${stickerBoxText}" text-anchor="middle">
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
function generatePromoCard(name = "мне", botUsername = "akilum_anon_bot", theme = "sunset") {
  const isDark = theme === "dark";
  const bgGrad = isDark
    ? `<stop offset="0%" stop-color="#0a0914"/><stop offset="50%" stop-color="#141126"/><stop offset="100%" stop-color="#0b0a15"/>`
    : `<stop offset="0%" stop-color="#FF385C"/><stop offset="50%" stop-color="#FF5A36"/><stop offset="100%" stop-color="#FFA033"/>`;

  const cardBg = isDark ? "#171524" : "#ffffff";
  const cardBorder = isDark ? "#28233d" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#111827";
  const badgeBg = isDark ? "#231f38" : "#f3f4f6";
  const badgeText = isDark ? "#a79fc2" : "#6b7280";
  const stickerBoxBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)";
  const stickerBoxBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)";

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      ${bgGrad}
    </linearGradient>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.22"/>
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
    <rect x="80" y="520" width="920" height="620" rx="48" fill="${cardBg}" stroke="${cardBorder}" stroke-width="2"/>
  </g>

  <!-- Бейдж -->
  <g transform="translate(540, 590)">
    <rect x="-160" y="0" width="320" height="48" rx="24" fill="${badgeBg}"/>
    <text x="0" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="${badgeText}" text-anchor="middle">
      🎲 спроси меня о чём угодно
    </text>
  </g>

  <!-- Крупный заголовок -->
  <g transform="translate(540, 770)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="900" fill="${textColor}" text-anchor="middle">
      Напиши мне всё,
    </text>
    <text x="0" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="900" fill="${textColor}" text-anchor="middle">
      о чём молчишь
    </text>
    <text x="0" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#ec4899" text-anchor="middle">
      🔒 100% анонимно • Я не узнаю, кто ты
    </text>
  </g>

  <!-- Водяной знак -->
  <text x="540" y="1080" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="${badgeText}" text-anchor="middle" letter-spacing="1">
    t.me/${escapeXml(botUsername)}
  </text>

  <!-- Место под наклейку-ссылку в Instagram / Telegram Stories -->
  <g transform="translate(140, 1420)">
    <rect width="800" height="130" rx="65" fill="${stickerBoxBg}" stroke="${stickerBoxBorder}" stroke-width="2"/>
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
  generateQuestionCard,
  generatePromoCard,
};

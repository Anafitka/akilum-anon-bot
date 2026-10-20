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

function wrapText(text, maxCharsPerLine = 24) {
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
 * 1. Карточка с вопросом для публикации ответа в Сторис (1080x1920)
 */
function generateQuestionCard(questionText, recipientName = "Друг") {
  const lines = wrapText(questionText, 22).slice(0, 7);
  const lineHeight = 62;
  const startY = 820 - ((lines.length - 1) * lineHeight) / 2;

  const tspanLines = lines
    .map(
      (line, i) =>
        `<tspan x="540" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("\n");

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a14"/>
      <stop offset="45%" stop-color="#140f2b"/>
      <stop offset="100%" stop-color="#070913"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#a855f7" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>

  <!-- Ambient Glow Orbs -->
  <circle cx="200" cy="400" r="350" fill="#a855f7" opacity="0.18" filter="blur(80px)"/>
  <circle cx="880" cy="1400" r="400" fill="#ec4899" opacity="0.15" filter="blur(90px)"/>

  <!-- Top Badge -->
  <g transform="translate(390, 220)">
    <rect width="300" height="56" rx="28" fill="#1e1b4b" stroke="url(#accentGrad)" stroke-width="2"/>
    <text x="150" y="36" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="20" font-weight="bold" fill="#f43f5e" text-anchor="middle" letter-spacing="3">
      ✦ AKILUM ✦
    </text>
  </g>

  <!-- Header Prompt -->
  <text x="540" y="390" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">
    Анонимный вопрос для тебя:
  </text>
  <text x="540" y="445" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="26" fill="#94a3b8" text-anchor="middle">
    ответь на него прямо в своих историях 👇
  </text>

  <!-- Central Question Card -->
  <g filter="url(#cardShadow)">
    <rect x="90" y="550" width="900" height="580" rx="48" fill="url(#cardGrad)"/>
    <rect x="90" y="550" width="900" height="580" rx="48" fill="none" stroke="#e2e8f0" stroke-width="2"/>
  </g>

  <!-- Card Top Tab / Badge -->
  <g transform="translate(140, 600)">
    <rect width="210" height="42" rx="21" fill="#f1f5f9"/>
    <text x="105" y="27" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="20" font-weight="600" fill="#64748b" text-anchor="middle">
      🤫 анонимно
    </text>
  </g>

  <!-- Question Content -->
  <text font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="44" font-weight="800" fill="#0f172a" text-anchor="middle">
    ${tspanLines}
  </text>

  <!-- Card Watermark Bottom -->
  <text x="540" y="1070" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="20" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="1">
    отправлено через @akilum_anon_bot
  </text>

  <!-- Footer Link Card for Stories CTA -->
  <g transform="translate(140, 1500)">
    <rect width="800" height="130" rx="36" fill="#131127" stroke="url(#accentGrad)" stroke-width="2"/>
    <text x="400" y="55" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">
      Хочешь тоже получать секреты?
    </text>
    <text x="400" y="98" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="24" font-weight="600" fill="#c084fc" text-anchor="middle">
      👉 Заходи в бота: @akilum_anon_bot
    </text>
  </g>

  <!-- Bottom Copyright / Subtle Tag -->
  <text x="540" y="1780" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="22" font-weight="500" fill="#64748b" text-anchor="middle">
    100% анонимность • Telegram Stories
  </text>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 },
  });
  return resvg.render().asPng();
}

/**
 * 2. Шаблон для публикации своей ссылки в Сторис (1080x1920)
 */
function generatePromoCard(name = "Друг", botUsername = "akilum_anon_bot") {
  const safeName = escapeXml(name);

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a14"/>
      <stop offset="45%" stop-color="#140f2b"/>
      <stop offset="100%" stop-color="#070913"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#a855f7" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <circle cx="200" cy="400" r="350" fill="#a855f7" opacity="0.2" filter="blur(80px)"/>
  <circle cx="880" cy="1400" r="400" fill="#ec4899" opacity="0.18" filter="blur(90px)"/>

  <!-- Top Badge -->
  <g transform="translate(390, 260)">
    <rect width="300" height="56" rx="28" fill="#1e1b4b" stroke="url(#accentGrad)" stroke-width="2"/>
    <text x="150" y="36" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="20" font-weight="bold" fill="#f43f5e" text-anchor="middle" letter-spacing="3">
      ✦ AKILUM ✦
    </text>
  </g>

  <!-- Big Central Floating Card -->
  <g filter="url(#cardShadow)">
    <rect x="90" y="600" width="900" height="520" rx="48" fill="url(#cardGrad)"/>
    <rect x="90" y="600" width="900" height="520" rx="48" fill="none" stroke="#e2e8f0" stroke-width="2"/>
  </g>

  <!-- Tab badge -->
  <g transform="translate(140, 650)">
    <rect width="260" height="46" rx="23" fill="#f1f5f9"/>
    <text x="130" y="30" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="20" font-weight="bold" fill="#64748b" text-anchor="middle">
      🤫 СЕКРЕТНЫЙ ЧАТ
    </text>
  </g>

  <!-- Call to action text -->
  <text x="540" y="800" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="48" font-weight="900" fill="#0f172a" text-anchor="middle">
    Напиши мне всё,
  </text>
  <text x="540" y="865" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="48" font-weight="900" fill="#0f172a" text-anchor="middle">
    о чём ты молчишь...
  </text>
  <text x="540" y="940" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="28" font-weight="600" fill="#a855f7" text-anchor="middle">
    100% анонимно ✦ Я не узнаю, кто ты
  </text>

  <!-- Bottom CTA in stories -->
  <text x="540" y="1450" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="38" font-weight="800" fill="#ffffff" text-anchor="middle">
    👆 Прикрепи сюда стикер-ссылку!
  </text>
  <text x="540" y="1510" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="26" font-weight="500" fill="#94a3b8" text-anchor="middle">
    Ссылка в шапке профиля или в боте @${escapeXml(botUsername)}
  </text>
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

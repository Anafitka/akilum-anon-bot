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
 * 1. Карточка с вопросом для Сторис (1080x1920)
 * Стиль: Cyber Streetwear / Matte Obsidian & Neon Lime
 */
function generateQuestionCard(questionText, recipientName = "") {
  const lines = wrapText(questionText, 20).slice(0, 6);
  const lineHeight = 68;
  const startY = 820 - ((lines.length - 1) * lineHeight) / 2;

  const tspanLines = lines
    .map(
      (line, i) =>
        `<tspan x="540" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("\n");

  const randId = Math.floor(1000 + Math.random() * 9000);

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#08080a"/>
      <stop offset="50%" stop-color="#0c0d11"/>
      <stop offset="100%" stop-color="#050507"/>
    </linearGradient>

    <!-- Card Gradient -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#15171e"/>
      <stop offset="100%" stop-color="#0f1015"/>
    </linearGradient>

    <!-- Lime Accent Gradient -->
    <linearGradient id="limeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ccff00"/>
      <stop offset="100%" stop-color="#70ff00"/>
    </linearGradient>

    <!-- Tech Grid Pattern -->
    <pattern id="techGrid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#161822" stroke-width="1" stroke-opacity="0.6"/>
      <circle cx="60" cy="60" r="1" fill="#252a3a"/>
    </pattern>

    <!-- Subtle Card Glow -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="30" flood-color="#000000" flood-opacity="0.9"/>
      <feDropShadow dx="0" dy="4" stdDeviation="15" flood-color="#ccff00" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Deep Black Matte Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>

  <!-- Tech Blueprint Grid -->
  <rect width="100%" height="100%" fill="url(#techGrid)"/>

  <!-- Ambient Cyber Glows -->
  <circle cx="540" cy="850" r="450" fill="#ccff00" opacity="0.04"/>
  <circle cx="200" cy="200" r="250" fill="#00e5ff" opacity="0.03"/>

  <!-- Corner Blueprint Crosshairs -->
  <g stroke="#3a3f55" stroke-width="2">
    <!-- Top Left -->
    <line x1="60" y1="90" x2="100" y2="90"/>
    <line x1="80" y1="70" x2="80" y2="110"/>
    <!-- Top Right -->
    <line x1="980" y1="90" x2="1020" y2="90"/>
    <line x1="1000" y1="70" x2="1000" y2="110"/>
    <!-- Bottom Left -->
    <line x1="60" y1="1830" x2="100" y2="1830"/>
    <line x1="80" y1="1810" x2="80" y2="1850"/>
    <!-- Bottom Right -->
    <line x1="980" y1="1830" x2="1020" y2="1830"/>
    <line x1="1000" y1="1810" x2="1000" y2="1850"/>
  </g>

  <!-- Header Branding -->
  <g transform="translate(0, 160)">
    <!-- Brand Name -->
    <text x="540" y="50" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="8">
      AKILUM
    </text>
    
    <!-- Live Secure Status Pill -->
    <g transform="translate(390, 75)">
      <rect width="300" height="34" rx="17" fill="#13151c" stroke="#252936" stroke-width="1.5"/>
      <circle cx="28" cy="17" r="5" fill="#ccff00"/>
      <text x="160" y="23" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="#a0a8c0" text-anchor="middle" letter-spacing="3">
        ENCRYPTED // ANON
      </text>
    </g>
  </g>

  <!-- Main Question Card Container -->
  <g filter="url(#neonGlow)">
    <!-- Card Body -->
    <rect x="80" y="440" width="920" height="740" rx="32" fill="url(#cardBg)" stroke="#272b38" stroke-width="2"/>
    <!-- Top Accent Line -->
    <path d="M 120 440 L 960 440" stroke="url(#limeGrad)" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Card Header Row inside card -->
  <g transform="translate(130, 500)">
    <!-- Mode Tag -->
    <rect width="180" height="38" rx="8" fill="#1c1f2a" stroke="#2e3344" stroke-width="1"/>
    <text x="90" y="25" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#ccff00" text-anchor="middle" letter-spacing="2">
      // ВОПРОС
    </text>

    <!-- Security ID on right -->
    <text x="820" y="25" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#586078" text-anchor="end" letter-spacing="1">
      ID #${randId}
    </text>
  </g>

  <!-- Divider inside card -->
  <line x1="130" y1="565" x2="950" y2="565" stroke="#1f2330" stroke-width="1.5"/>

  <!-- Question Text -->
  <text font-family="Segoe UI, Inter, Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff" text-anchor="middle">
    ${tspanLines}
  </text>

  <!-- Card Bottom Action Bar -->
  <g transform="translate(130, 1070)">
    <line x1="0" y1="0" x2="820" y2="0" stroke="#1f2330" stroke-width="1.5"/>
    <text x="0" y="42" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#6d7692" letter-spacing="1">
      ОТВЕТЬ ПРЯМО В ИСТОРИИ
    </text>
    <text x="820" y="42" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="16" font-weight="800" fill="#ccff00" text-anchor="end" letter-spacing="2">
      AKILUM.BOT ➔
    </text>
  </g>

  <!-- Link Sticker Target Zone (Insta/TG Stories) -->
  <g transform="translate(140, 1340)">
    <!-- Dashed Target Box for Story Link Sticker -->
    <rect width="800" height="150" rx="24" fill="#0f1117" stroke="#ccff00" stroke-width="2" stroke-dasharray="10 8"/>
    <circle cx="50" cy="75" r="18" fill="#1b2014"/>
    <text x="50" y="82" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="#ccff00" text-anchor="middle">🔗</text>
    
    <text x="400" y="62" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">
      ПРИКРЕПИ СТИКЕР-ССЫЛКУ СЮДА
    </text>
    <text x="400" y="105" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#8892b0" text-anchor="middle">
      чтобы зрители могли задать тебе вопрос
    </text>
  </g>

  <!-- Bottom Tech Footer -->
  <g transform="translate(540, 1720)">
    <text x="0" y="0" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#464e66" text-anchor="middle" letter-spacing="5">
      ZERO TRACE • 100% ANONYMOUS SYSTEM
    </text>
    <text x="0" y="32" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="14" font-weight="600" fill="#303546" text-anchor="middle" letter-spacing="2">
      t.me/akilum_anon_bot
    </text>
  </g>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 },
  });
  return resvg.render().asPng();
}

/**
 * 2. Промо-карточка для Сторис с призывом задавать вопросы
 * Стиль: Cyber Streetwear / Bold Typography
 */
function generatePromoCard(name = "Друг", botUsername = "akilum_anon_bot") {
  const safeName = escapeXml(name.toUpperCase());

  const svg = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#08080a"/>
      <stop offset="50%" stop-color="#0c0d11"/>
      <stop offset="100%" stop-color="#050507"/>
    </linearGradient>

    <linearGradient id="limeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ccff00"/>
      <stop offset="100%" stop-color="#70ff00"/>
    </linearGradient>

    <pattern id="techGrid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#161822" stroke-width="1" stroke-opacity="0.6"/>
      <circle cx="60" cy="60" r="1" fill="#252a3a"/>
    </pattern>

    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="#000000" flood-opacity="0.95"/>
      <feDropShadow dx="0" dy="0" stdDeviation="25" flood-color="#ccff00" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect width="100%" height="100%" fill="url(#techGrid)"/>

  <!-- Ambient Light -->
  <circle cx="540" cy="750" r="400" fill="#ccff00" opacity="0.05"/>

  <!-- Corner Crosshairs -->
  <g stroke="#3a3f55" stroke-width="2">
    <line x1="60" y1="90" x2="100" y2="90"/>
    <line x1="80" y1="70" x2="80" y2="110"/>
    <line x1="980" y1="90" x2="1020" y2="90"/>
    <line x1="1000" y1="70" x2="1000" y2="110"/>
    <line x1="60" y1="1830" x2="100" y2="1830"/>
    <line x1="80" y1="1810" x2="80" y2="1850"/>
    <line x1="980" y1="1830" x2="1020" y2="1830"/>
    <line x1="1000" y1="1810" x2="1000" y2="1850"/>
  </g>

  <!-- Top Brand Tag -->
  <g transform="translate(0, 180)">
    <text x="540" y="40" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="8">
      AKILUM
    </text>
    <text x="540" y="80" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#6d7692" text-anchor="middle" letter-spacing="4">
      CONFESSIONS PROTOCOL
    </text>
  </g>

  <!-- Big Central Streetwear Card -->
  <g filter="url(#neonGlow)">
    <rect x="80" y="440" width="920" height="720" rx="32" fill="#12141b" stroke="#2b3040" stroke-width="2"/>
    <path d="M 120 440 L 960 440" stroke="url(#limeGrad)" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Badge inside card -->
  <g transform="translate(140, 510)">
    <rect width="220" height="40" rx="8" fill="#1b2014" stroke="#ccff00" stroke-width="1.5"/>
    <circle cx="24" cy="20" r="5" fill="#ccff00"/>
    <text x="125" y="27" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#ccff00" text-anchor="middle" letter-spacing="2">
      // ОТКРЫТЫЙ СЛОТ
    </text>
  </g>

  <!-- Huge Punchy Headline -->
  <g transform="translate(540, 680)">
    <text x="0" y="0" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      НАПИШИ МНЕ
    </text>
    <text x="0" y="80" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="64" font-weight="900" fill="#ccff00" text-anchor="middle" letter-spacing="1">
      ВСЁ, ЧТО ХОТЕЛ.
    </text>
    <text x="0" y="170" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#8892b0" text-anchor="middle" letter-spacing="2">
      Я НИКОГДА НЕ УЗНАЮ, КТО ТЫ.
    </text>
    <text x="0" y="220" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#4d5570" text-anchor="middle" letter-spacing="4">
      100% АНОНИМНО // ZERO TRACE
    </text>
  </g>

  <!-- Card bottom meta -->
  <g transform="translate(140, 1050)">
    <line x1="0" y1="0" x2="800" y2="0" stroke="#1f2330" stroke-width="1.5"/>
    <text x="0" y="45" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#586078" letter-spacing="2">
      ДЛЯ: ${safeName}
    </text>
    <text x="800" y="45" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="16" font-weight="800" fill="#ccff00" text-anchor="end" letter-spacing="2">
      STATUS: ONLINE
    </text>
  </g>

  <!-- Target Slot for Story Sticker -->
  <g transform="translate(140, 1340)">
    <rect width="800" height="150" rx="24" fill="#0f1117" stroke="#ccff00" stroke-width="2" stroke-dasharray="10 8"/>
    <circle cx="50" cy="75" r="18" fill="#1b2014"/>
    <text x="50" y="82" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="18" font-weight="900" fill="#ccff00" text-anchor="middle">🔗</text>
    
    <text x="400" y="62" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">
      ВСТАВЬ СТИКЕР СО ССЫЛКОЙ СЮДА
    </text>
    <text x="400" y="105" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#8892b0" text-anchor="middle">
      ссылка в боте @${escapeXml(botUsername)}
    </text>
  </g>

  <!-- Footer -->
  <g transform="translate(540, 1720)">
    <text x="0" y="0" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#464e66" text-anchor="middle" letter-spacing="5">
      AKILUM NETWORK • NO LOGS • SECURE
    </text>
    <text x="0" y="32" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="14" font-weight="600" fill="#303546" text-anchor="middle" letter-spacing="2">
      t.me/${escapeXml(botUsername)}
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

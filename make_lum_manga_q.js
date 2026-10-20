const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");

const imgPath = "C:/Users/oljob/.gemini/antigravity/brain/f7a33318-76a5-40e6-9ed1-b24e122d85ba/.user_uploaded/media_1792522434573_3ec5d4de.png";
const base64Img = fs.readFileSync(imgPath).toString("base64");

// Вариант 2: Чистый аниме-арт без лишних рамок, крупный яркий неоновый стикер-вопрос "?" прямо над Лам
const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F9CE82"/>
      <stop offset="50%" stop-color="#F2B75A"/>
      <stop offset="100%" stop-color="#EAA649"/>
    </linearGradient>

    <!-- Сочный неоновый градиент для знака вопроса -->
    <linearGradient id="qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF3366"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>

    <filter id="glowShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
      <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="#FF3366" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Фон кадра -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>

  <!-- Кадр с Лам -->
  <g transform="translate(62, 105)">
    <image href="data:image/png;base64,${base64Img}" x="0" y="0" width="900" height="1009" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Яркий аниме-знак вопроса '?' с белой обводкой и свечением ровно там, куда Лам смотрит -->
  <g transform="translate(230, 240)" filter="url(#glowShadow)">
    <!-- Белый стикер-контур -->
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Impact', sans-serif" font-size="240" font-weight="900" fill="#ffffff" stroke="#ffffff" stroke-width="28" stroke-linejoin="round" text-anchor="middle">
      ?
    </text>
    <!-- Сам знак вопроса -->
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Impact', sans-serif" font-size="240" font-weight="900" fill="url(#qGrad)" text-anchor="middle">
      ?
    </text>

    <!-- Аниме-искорки (электричество Лам) -->
    <path d="M -90 -120 L -60 -70 L -75 -65 L -45 -15 L -65 -25 L -55 10" fill="none" stroke="#FFDF00" stroke-width="6" stroke-linecap="round"/>
    <circle cx="85" cy="-80" r="10" fill="#ffffff"/>
    <circle cx="110" cy="-60" r="6" fill="#FFDF00"/>
  </g>
</svg>
`;

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } });
const png = resvg.render().asPng();
fs.writeFileSync("avatar_lum_neon_q.png", png);
console.log("Created avatar_lum_neon_q.png, bytes:", png.length);

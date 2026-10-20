const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");

const imgPath = "C:/Users/oljob/.gemini/antigravity/brain/f7a33318-76a5-40e6-9ed1-b24e122d85ba/.user_uploaded/media_1792522434573_3ec5d4de.png";
const base64Img = fs.readFileSync(imgPath).toString("base64");

// 1. Композиция: оригинальный кадр с Лам + стилизованный аниме-знак вопроса
const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Теплый фон под цвет оригинального кадра -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7C475"/>
      <stop offset="100%" stop-color="#EAA649"/>
    </linearGradient>

    <!-- Тень знака вопроса -->
    <filter id="qShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Фон -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>

  <!-- Оригинальный кадр с Лам -->
  <!-- Масштабируем и размещаем в нижней части круга -->
  <g transform="translate(60, 110)">
    <image href="data:image/png;base64,${base64Img}" x="0" y="0" width="900" height="1009" preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Аниме-бабл / знак вопроса в точке, куда смотрит Лам (вверху слева) -->
  <g transform="translate(240, 190)" filter="url(#qShadow)">
    <!-- Белое облачко мыслей / вопроса -->
    <circle cx="0" cy="0" r="115" fill="#ffffff" stroke="#1e1e1e" stroke-width="8"/>
    <!-- Хвостик облачка -->
    <circle cx="45" cy="110" r="24" fill="#ffffff" stroke="#1e1e1e" stroke-width="6"/>
    <circle cx="75" cy="155" r="14" fill="#ffffff" stroke="#1e1e1e" stroke-width="5"/>
    
    <!-- Текст знака вопроса в стиле манги/аниме -->
    <text x="0" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif" font-size="130" font-weight="900" fill="#FF385C" text-anchor="middle">
      ?
    </text>
  </g>

  <!-- Небольшие аниме-искорки вокруг вопроса -->
  <g fill="#ffffff" opacity="0.9">
    <path d="M 110 90 Q 110 110 90 110 Q 110 110 110 130 Q 110 110 130 110 Q 110 110 110 90 Z"/>
    <path d="M 380 95 Q 380 110 365 110 Q 380 110 380 125 Q 380 110 395 110 Q 380 110 380 95 Z"/>
  </g>
</svg>
`;

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } });
const png = resvg.render().asPng();
fs.writeFileSync("avatar_lum_bubble.png", png);
console.log("Created avatar_lum_bubble.png, bytes:", png.length);

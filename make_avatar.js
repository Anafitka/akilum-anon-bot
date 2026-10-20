const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");

// 1. Векторный ультра-чистый логотип (Apple/NGL aesthetic)
const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2E63"/>
      <stop offset="50%" stop-color="#FF5733"/>
      <stop offset="100%" stop-color="#FF8E2B"/>
    </linearGradient>

    <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>

    <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#000000" flood-opacity="0.22"/>
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Сочный градиентный фон -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>

  <!-- Внутреннее мягкое свечение -->
  <circle cx="512" cy="360" r="380" fill="#ffffff" opacity="0.15"/>

  <!-- Центральная парящая белая плашка с мягкими углами -->
  <g filter="url(#iconShadow)">
    <rect x="222" y="222" width="580" height="580" rx="150" fill="url(#whiteGrad)"/>
  </g>

  <!-- Крупная стильная буква A градиентного цвета внутри -->
  <text x="512" y="625" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="390" font-weight="900" fill="url(#bgGrad)" text-anchor="middle">
    A
  </text>

  <!-- Маленькая иконка-искра сверху -->
  <circle cx="690" cy="330" r="32" fill="#FF2E63"/>
  <text x="690" y="342" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">✦</text>
</svg>
`;

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } });
const png = resvg.render().asPng();
fs.writeFileSync("avatar_vector.png", png);
console.log("Vector avatar created successfully! Bytes:", png.length);

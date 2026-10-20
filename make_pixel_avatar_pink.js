const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");

const imgPath = "C:/Users/oljob/.gemini/antigravity/brain/f7a33318-76a5-40e6-9ed1-b24e122d85ba/.user_uploaded/media_1792522828336_e81efa66.png";
const base64Img = fs.readFileSync(imgPath).toString("base64");

const pattern = [
  [0, 1, 1, 1, 1, 1, 1, 0, 0],
  [1, 1, 4, 4, 2, 2, 1, 1, 0],
  [1, 4, 2, 1, 1, 2, 3, 1, 0],
  [1, 2, 1, 0, 0, 1, 2, 1, 0],
  [0, 1, 1, 0, 0, 1, 3, 1, 0],
  [0, 0, 0, 0, 1, 1, 2, 1, 0],
  [0, 0, 0, 1, 1, 2, 3, 1, 0],
  [0, 0, 0, 1, 2, 2, 1, 0, 0],
  [0, 0, 0, 1, 2, 3, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 4, 2, 1, 0, 0],
  [0, 0, 0, 1, 2, 3, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0],
];

// Розовая палитра под глаза и румянец Лам
const colorsPink = {
  1: "#191942", // Тёмно-синяя обводка
  2: "#FF4D79", // Неоново-розовый
  3: "#C71F52", // Тёмно-малиновая тень
  4: "#FFE6EC", // Светло-розовый блик
};

const pSize = 14;
const startX = 680;
const startY = 160;

let rects = "";
for (let r = 0; r < pattern.length; r++) {
  for (let c = 0; c < pattern[r].length; c++) {
    const val = pattern[r][c];
    if (val && colorsPink[val]) {
      const x = startX + c * pSize;
      const y = startY + r * pSize;
      rects += `<rect x="${x}" y="${y}" width="${pSize}" height="${pSize}" fill="${colorsPink[val]}"/>\n`;
    }
  }
}

const sparkPattern = [
  [0, 1, 0],
  [1, 4, 1],
  [0, 1, 0],
];
const sparkX = startX + 140;
const sparkY = startY + 20;
for (let r = 0; r < sparkPattern.length; r++) {
  for (let c = 0; c < sparkPattern[r].length; c++) {
    const val = sparkPattern[r][c];
    if (val && colorsPink[val]) {
      rects += `<rect x="${sparkX + c * pSize}" y="${sparkY + r * pSize}" width="${pSize}" height="${pSize}" fill="${colorsPink[val]}"/>\n`;
    }
  }
}

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect width="1024" height="1024" fill="#F1ECFD"/>

  <g transform="translate(60, 60)">
    <image href="data:image/png;base64,${base64Img}" x="0" y="0" width="904" height="904" preserveAspectRatio="xMidYMid meet" style="image-rendering: pixelated;"/>
  </g>

  <g shape-rendering="crispEdges">
    ${rects}
  </g>
</svg>
`;

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } });
const png = resvg.render().asPng();
fs.writeFileSync("avatar_pixel_pink.png", png);
console.log("Pixel pink avatar generated successfully! Size:", png.length);

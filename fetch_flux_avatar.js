const https = require("https");
const fs = require("fs");

const prompt = encodeURIComponent(
  "app icon for viral social questions app AKILUM, cute 3d glossy smooth letter A and small dice, warm vibrant sunset gradient background, soft rounded edges, apple app store award winner, studio lighting, clean 3d render"
);
const url =
  "https://image.pollinations.ai/prompt/" +
  prompt +
  "?width=1024&height=1024&nologo=true&seed=" +
  Math.floor(Math.random() * 100000) +
  "&model=flux";

console.log("Fetching from Pollinations...");
const file = fs.createWriteStream("avatar_3d.png");

https.get(url, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, (res2) => {
      res2.pipe(file);
      file.on("finish", () => console.log("avatar_3d.png saved!"));
    });
  } else {
    res.pipe(file);
    file.on("finish", () => console.log("avatar_3d.png saved directly!"));
  }
}).on("error", (e) => console.error(e));

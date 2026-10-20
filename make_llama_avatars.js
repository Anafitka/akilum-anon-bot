const https = require("https");
const fs = require("fs");

const prompt = encodeURIComponent(
  "cute fluffy 3d llama mascot wearing trendy black sunglasses, shhh secret gesture with hoof near mouth, vibrant warm sunset coral pink and orange gradient background, pixar 3d animation style, soft lighting, detailed fluffy wool, ultra cute face, centered circle crop ready, behance dribbble trending"
);

const url =
  "https://image.pollinations.ai/prompt/" +
  prompt +
  "?width=1024&height=1024&nologo=true&seed=" +
  Math.floor(Math.random() * 100000) +
  "&model=flux";

console.log("Fetching cute llama avatar...");
const file = fs.createWriteStream("avatar_llama.png");

https.get(url, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, (res2) => {
      res2.pipe(file);
      file.on("finish", () => console.log("Saved avatar_llama.png via redirect!"));
    });
  } else {
    res.pipe(file);
    file.on("finish", () => console.log("Saved avatar_llama.png directly!"));
  }
}).on("error", (e) => console.error(e));

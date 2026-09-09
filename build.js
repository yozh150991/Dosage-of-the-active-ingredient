/* Збирає самодостатній index.html: src/index.html + calc-core.js в один файл.
   Навіщо: ядро винесено окремо заради тестів, але сторінка має відкриватися
   будь-де — з диска, з превʼю, з флешки — а не тільки з вебсервера, де
   поруч лежить другий файл. Запуск: npm run build */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const template = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const core = fs.readFileSync(path.join(root, "calc-core.js"), "utf8");

if (!template.includes("<!--CORE-->")) {
  console.error("У src/index.html немає маркера <!--CORE-->. Збірка неможлива.");
  process.exit(1);
}

const banner =
  "<!-- Згенеровано npm run build. Не редагуйте цей файл руками:\n" +
  "     розмітка живе в src/index.html, розрахунок — у calc-core.js. -->\n";

const inlined = "<script>\n" + core.trimEnd() + "\n</script>";
const out = banner + template.replace("<!--CORE-->", inlined);

fs.writeFileSync(path.join(root, "index.html"), out);
console.log("index.html зібрано: " + Math.round(out.length / 1024) + " КБ, один файл, нуль запитів.");

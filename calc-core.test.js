"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DRUGS,
  GROUPS,
  FORM_LABEL,
  LIMITS,
  FORBIDDEN,
  sanitizeNumber,
  COMBINED,
  MAX_UNITS,
  computeDose,
  buildWarnings,
  checkGates,
  isBlocked,
  nextDoseTime
} = require("../calc-core.js");

const codes = (input, dose) => buildWarnings(input, dose).map((w) => w.code);
const warn = (input) => codes(input, computeDose(input));

/* Усі ваги від 2 до 60 кг з кроком 100 г — сітка для інваріантів */
const WEIGHTS = [];
for (let w = 2; w <= 60.0001; w = Math.round((w + 0.1) * 10) / 10) WEIGHTS.push(w);

/* Кожна комбінація препарат × форма × пресет */
const PRESETS = [];
for (const drug of Object.keys(DRUGS)) {
  for (const form of Object.keys(DRUGS[drug].forms)) {
    for (const item of DRUGS[drug].forms[form]) {
      PRESETS.push({ drug, form, concMg: item.mg, concMl: item.ml || null, label: item.label });
    }
  }
}

/* ─────────────── довідник ─────────────── */

test("довідник препаратів заповнений коректно", () => {
  const groupKeys = GROUPS.map(([k]) => k);
  for (const [id, drug] of Object.entries(DRUGS)) {
    assert.ok(drug.perKg.min < drug.perKg.max, id + ": мінімум має бути менший за максимум");
    assert.ok(drug.perKg.typical >= drug.perKg.min && drug.perKg.typical <= drug.perKg.max,
      id + ": розрахункова точка поза діапазоном");
    assert.ok(drug.maxSingleMg > 0 && drug.maxDailyMg > drug.maxSingleMg, id + ": стелі неузгоджені");
    assert.ok(drug.perKg.typical * drug.maxDoses >= drug.dailyPerKg,
      id + ": максимум прийомів не дозволяє вибрати добову межу");

    for (const [form, list] of Object.entries(drug.forms)) {
      assert.ok(FORM_LABEL[form], id + ": невідома форма " + form);
      if (!list.length) continue;
      for (const item of list) {
        assert.ok(item.mg > 0, id + "/" + form + ": порожнє дозування");
        assert.ok(item.label && item.label.length > 3, id + "/" + form + ": пресет без підпису");
        assert.ok(groupKeys.includes(item.group), id + "/" + form + ": невідомий ринок " + item.group);
        if (form === "syrup") assert.ok(item.ml > 0, id + ": сироп без об'єму");
        else assert.equal(item.ml, undefined, id + "/" + form + ": зайвий об'єм у твердій формі");
      }
    }
  }
});

test("у довіднику 42 пресети — регресія на випадкове видалення", () => {
  assert.equal(PRESETS.length, 42);
});

/* ─────────────── еталонні розрахунки ─────────────── */

test("парацетамол 12 кг, сироп 120 мг/5 мл", () => {
  const d = computeDose({ drug: "paracetamol", form: "syrup", weightKg: 12, concMg: 120, concMl: 5 });
  assert.equal(d.amount, 7.5);
  assert.equal(d.actualMg, 180);
  assert.equal(d.mgPerKg, 15);
  assert.equal(d.dosesPerDay, 4);
  assert.equal(d.dailyLimitMg, 720);
  assert.deepEqual(d.flags, []);
});

test("ібупрофен 12 кг, суспензія 100 мг/5 мл", () => {
  const d = computeDose({ drug: "ibuprofen", form: "syrup", weightKg: 12, concMg: 100, concMl: 5 });
  assert.equal(d.amount, 6);
  assert.equal(d.actualMg, 120);
  assert.equal(d.dosesPerDay, 3);
  assert.equal(d.dailyLimitMg, 360);
});

test("той самий ібупрофен у формі форте дає вдвічі менший об'єм", () => {
  const a = computeDose({ drug: "ibuprofen", form: "syrup", weightKg: 20, concMg: 100, concMl: 5 });
  const b = computeDose({ drug: "ibuprofen", form: "syrup", weightKg: 20, concMg: 200, concMl: 5 });
  assert.equal(a.actualMg, b.actualMg);
  assert.equal(a.amount, b.amount * 2);
});

test("свічка 150 мг для 10 кг — одна штука", () => {
  const d = computeDose({ drug: "paracetamol", form: "supp", weightKg: 10, concMg: 150 });
  assert.equal(d.amount, 1);
  assert.equal(d.actualMg, 150);
  assert.deepEqual(d.flags, []);
});

/* ─────────────── головний інваріант: округлення тільки вниз ─────────────── */

test("жодна доза не перевищує верхню межу діапазону", () => {
  const bad = [];
  for (const p of PRESETS) {
    for (const weightKg of WEIGHTS) {
      const d = computeDose(Object.assign({ weightKg }, p));
      if (!d.ok) { bad.push([p.label, weightKg, "розрахунок не пройшов"]); continue; }
      const unsuitable = d.flags.includes("supp_too_large") || d.flags.includes("tab_too_large") || d.flags.includes("sachet_too_large") || d.flags.includes("chew_too_large");
      if (d.actualMg > d.maxMg + 1e-9 && !unsuitable) {
        bad.push([p.label, weightKg, d.actualMg + " мг > " + d.maxMg + " мг"]);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("разова доза ніколи не перевищує дорослу стелю", () => {
  for (const p of PRESETS) {
    for (const weightKg of [40, 55, 70, 90, 120]) {
      const d = computeDose(Object.assign({ weightKg }, p));
      const ceiling = DRUGS[p.drug].maxSingleMg;
      const unsuitable = d.flags.includes("supp_too_large") || d.flags.includes("tab_too_large") || d.flags.includes("sachet_too_large") || d.flags.includes("chew_too_large");
      if (!unsuitable) {
        assert.ok(d.actualMg <= ceiling + 1e-9,
          p.label + " при " + weightKg + " кг: " + d.actualMg + " мг > " + ceiling + " мг");
      }
    }
  }
});

test("добова сума не перевищує межу мг/кг", () => {
  for (const p of PRESETS) {
    for (const weightKg of WEIGHTS) {
      const d = computeDose(Object.assign({ weightKg }, p));
      const unsuitable = d.flags.includes("supp_too_large") || d.flags.includes("tab_too_large") || d.flags.includes("sachet_too_large") || d.flags.includes("chew_too_large");
      if (unsuitable) continue;
      assert.ok(d.dosesPerDay * d.actualMg <= d.dailyLimitMg + 1e-9,
        p.label + " при " + weightKg + " кг: добова сума " + d.dosesPerDay * d.actualMg + " > " + d.dailyLimitMg);
      assert.ok(d.dosesPerDay <= DRUGS[p.drug].maxDoses);
    }
  }
});

test("невідповідна форма завжди супроводжується червоним попередженням або блокуванням", () => {
  let seen = 0;
  for (const p of PRESETS) {
    for (const weightKg of WEIGHTS) {
      const input = Object.assign({ weightKg, ageMonths: 36 }, p);
      const d = computeDose(input);
      if (!d.flags.includes("supp_too_large") && !d.flags.includes("tab_too_large") && !d.flags.includes("sachet_too_large") && !d.flags.includes("chew_too_large")) continue;
      seen++;
      const stop = buildWarnings(input, d).filter((w) => w.level === "danger" || w.level === "block");
      assert.ok(stop.length > 0, p.label + " при " + weightKg + " кг: доза завелика, а реакції немає");
    }
  }
  assert.ok(seen > 0, "жодного випадку невідповідної форми не знайдено — сітка тестів звузилася");
});

/* ─────────────── межі та помилки вводу ─────────────── */

test("некоректний ввід не дає числа замість дози", () => {
  const base = { drug: "paracetamol", form: "syrup", concMg: 120, concMl: 5 };
  assert.equal(computeDose(Object.assign({ weightKg: NaN }, base)).error, "weight");
  assert.equal(computeDose(Object.assign({ weightKg: 0 }, base)).error, "weight");
  assert.equal(computeDose(Object.assign({ weightKg: 1.9 }, base)).error, "weight");
  assert.equal(computeDose(Object.assign({ weightKg: 121 }, base)).error, "weight");
  assert.equal(computeDose({ drug: "paracetamol", form: "syrup", weightKg: 10, concMg: 0, concMl: 5 }).error, "concentration");
  assert.equal(computeDose({ drug: "paracetamol", form: "syrup", weightKg: 10, concMg: 120, concMl: 0 }).error, "concentration");
  assert.equal(computeDose({ drug: "аспірин", form: "syrup", weightKg: 10, concMg: 120, concMl: 5 }).error, "drug");
});

test("об'єм ніколи не падає нижче мінімального кроку шприца", () => {
  for (const p of PRESETS.filter((x) => x.form === "syrup")) {
    const d = computeDose(Object.assign({ weightKg: 2 }, p));
    assert.ok(d.amount >= 0.25, p.label + ": " + d.amount + " мл — менше за поділку шприца");
  }
});

/* ─────────────── попередження ─────────────── */

test("вік до 3 місяців — блокування для обох препаратів", () => {
  for (const drug of ["paracetamol", "ibuprofen"]) {
    const input = { drug, form: "syrup", weightKg: 5, ageMonths: 2, concMg: 120, concMl: 5 };
    const list = buildWarnings(input, computeDose(input));
    const w = list.find((x) => x.code === "age_under_3m");
    assert.ok(w, drug + ": немає гейту за віком");
    assert.equal(w.level, "block");
    assert.ok(isBlocked(list), drug + ": гарячка до 3 місяців має блокувати показ дози");
    assert.equal(list.length, 1, "при блокуванні решта порад лише відволікає");
  }
});

test("ібупрофен у 4 місяці — жовте попередження, у 8 місяців — вже ні", () => {
  const base = { drug: "ibuprofen", form: "syrup", weightKg: 7, concMg: 100, concMl: 5 };
  assert.ok(warn(Object.assign({ ageMonths: 4 }, base)).includes("ibu_under_6m"));
  assert.ok(!warn(Object.assign({ ageMonths: 8 }, base)).includes("ibu_under_6m"));
});

test("вік не вказано — вікових попереджень немає, але розрахунок працює", () => {
  const input = { drug: "paracetamol", form: "syrup", weightKg: 5, ageMonths: null, concMg: 120, concMl: 5 };
  const c = warn(input);
  assert.ok(!c.includes("age_under_3m"));
  assert.ok(!c.includes("tab_under_6y"));
  assert.ok(computeDose(input).ok);
});

test("вага нижче мінімальної для препарату — блокування", () => {
  assert.ok(warn({ drug: "ibuprofen", form: "syrup", weightKg: 4.5, ageMonths: 4, concMg: 100, concMl: 5 })
    .includes("ibu_weight_below_5"));
  assert.ok(warn({ drug: "paracetamol", form: "syrup", weightKg: 3.5, ageMonths: 4, concMg: 120, concMl: 5 })
    .includes("par_weight_below_4"));
  assert.ok(!warn({ drug: "ibuprofen", form: "syrup", weightKg: 6, ageMonths: 6, concMg: 100, concMl: 5 })
    .includes("ibu_weight_below_5"));
});

test("концентрації, які легко сплутати, підсвічуються", () => {
  const at = (concMg, concMl) =>
    warn({ drug: "paracetamol", form: "syrup", weightKg: 12, ageMonths: 24, concMg, concMl });
  assert.ok(at(120, 5).every((c) => c !== "conc_forte" && c !== "conc_drops"), "24 мг/мл — звичайний сироп");
  assert.ok(at(200, 5).includes("conc_forte"), "40 мг/мл — форте");
  assert.ok(at(100, 1).includes("conc_drops"), "100 мг/мл — краплі");
  assert.ok(!at(100, 1).includes("conc_forte"), "краплі не повинні дублюватися як форте");
});

test("таблетки дитині до 6 років — блокування, а не порада", () => {
  const under = buildWarnings({ drug: "paracetamol", form: "tab", weightKg: 16, ageMonths: 48, concMg: 200 }, null);
  assert.ok(isBlocked(under));
  assert.ok(under.some((w) => w.code === "tab_age"));
  assert.ok(!warn({ drug: "paracetamol", form: "tab", weightKg: 25, ageMonths: 96, concMg: 200 })
    .includes("tab_age"));
});

test("завелика свічка і замала свічка розрізняються", () => {
  assert.ok(warn({ drug: "paracetamol", form: "supp", weightKg: 5, ageMonths: 4, concMg: 300 })
    .includes("supp_too_large"));
  assert.ok(warn({ drug: "paracetamol", form: "supp", weightKg: 25, ageMonths: 84, concMg: 80 })
    .includes("supp_below_min"));
});

test("нагадування про приховані жарознижувальні є всюди, де доза показується", () => {
  for (const p of PRESETS) {
    const input = Object.assign({ weightKg: 15, ageMonths: 48 }, p);
    const notes = buildWarnings(input, computeDose(input));
    if (isBlocked(notes)) continue;
    assert.ok(notes.some((w) => w.code === "hidden_paracetamol"), p.label);
  }
});

test("протипоказання ібупрофену показуються лише для ібупрофену", () => {
  assert.ok(warn({ drug: "ibuprofen", form: "syrup", weightKg: 15, ageMonths: 48, concMg: 100, concMl: 5 })
    .includes("ibu_contraindications"));
  assert.ok(!warn({ drug: "paracetamol", form: "syrup", weightKg: 15, ageMonths: 48, concMg: 120, concMl: 5 })
    .includes("ibu_contraindications"));
});

/* ─────────────── наступний прийом ─────────────── */

test("наступна доза парацетамолу — через 6 годин", () => {
  const now = new Date("2026-09-09T12:00:00");
  const last = new Date("2026-09-09T09:00:00");
  const r = nextDoseTime("paracetamol", last, 1, now, null);
  assert.equal(r.at.getHours(), 15);
  assert.equal(r.ready, false);
  assert.equal(r.dosesLeft, 3);
  assert.equal(r.limitReached, false);
});

test("ібупрофен має інтервал 8 годин і 3 дози на добу", () => {
  const now = new Date("2026-09-09T20:00:00");
  const r = nextDoseTime("ibuprofen", new Date("2026-09-09T11:00:00"), 3, now, null);
  assert.equal(r.at.getHours(), 19);
  assert.equal(r.ready, true);
  assert.equal(r.dosesLeft, 0);
  assert.equal(r.limitReached, true, "ліміт вичерпано має перекривати 'можна вже'");
});

test("порожній або зіпсований час не ламає розрахунок", () => {
  const now = new Date("2026-09-09T12:00:00");
  assert.equal(nextDoseTime("невідомий", new Date(), 0, now, null), null);
  const noDoses = nextDoseTime("paracetamol", null, 0, now, null);
  assert.equal(noDoses.ready, true, "нічого не давали — можна одразу");
  assert.equal(noDoses.reason, "none");
  assert.equal(nextDoseTime("paracetamol", new Date("не час"), 0, now, null).ready, true);
});

test("крос-правило: інший препарат не раніше ніж через 3 години", () => {
  const now = new Date("2026-09-09T15:00:00");
  const r = nextDoseTime("ibuprofen", null, 0, now, new Date("2026-09-09T14:20:00"));
  assert.equal(r.ready, false, "парацетамол дали 40 хвилин тому");
  assert.equal(r.reason, "cross");
  assert.equal(r.at.getHours(), 17);
  assert.equal(r.at.getMinutes(), 20);
});

test("крос-правило не скорочує власний інтервал препарату", () => {
  const now = new Date("2026-09-09T15:00:00");
  const r = nextDoseTime("paracetamol", new Date("2026-09-09T14:00:00"), 1, now, new Date("2026-09-09T09:00:00"));
  assert.equal(r.reason, "same", "власні 6 годин довші за 3 години крос-правила");
  assert.equal(r.at.getHours(), 20);
});

test("причина очікування розрізняє власний інтервал і чужий препарат", () => {
  const now = new Date("2026-09-09T15:00:00");
  const cross = nextDoseTime("ibuprofen", null, 0, now, new Date("2026-09-09T14:00:00"));
  assert.equal(cross.reason, "cross", "інакше інтерфейс скаже «зачекайте» і «ще не давали» водночас");
  assert.ok(cross.waitMs > 0);
});

test("неподільні форми не множаться понад межу інструкції", () => {
  for (const p of PRESETS.filter((x) => ["supp", "sachet", "chew"].includes(x.form))) {
    for (const weightKg of WEIGHTS) {
      const d = computeDose(Object.assign({ weightKg }, p));
      assert.ok(d.amount <= MAX_UNITS[p.form],
        p.label + " при " + weightKg + " кг: " + d.amount + " штук за раз");
      assert.ok(Number.isInteger(d.amount), p.label + ": ця форма не ділиться");
    }
  }
});

test("замалий номінал свічки при великій вазі — попередження, а не стос свічок", () => {
  const d = computeDose({ drug: "paracetamol", form: "supp", weightKg: 25, concMg: 80 });
  assert.equal(d.amount, 2);
  assert.ok(d.flags.includes("supp_below_min"));
});

/* ─────────────── зібраний файл ─────────────── */

test("index.html самодостатній: ядро вбудоване, зовнішніх скриптів немає", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const core = fs.readFileSync(path.join(__dirname, "..", "calc-core.js"), "utf8").trimEnd();

  assert.ok(html.includes(core), "index.html відстав від calc-core.js — запустіть npm run build");
  assert.ok(!/<script[^>]+src=/.test(html), "у зібраному файлі не має бути зовнішніх скриптів");
  assert.ok(!html.includes("<!--CORE-->"), "маркер збірки залишився в результаті");
});

/* ─────────────── вікові та вагові гейти ─────────────── */

test("гарячка до 3 місяців блокує обидва препарати в будь-якій формі", () => {
  for (const p of PRESETS) {
    const notes = checkGates(Object.assign({ weightKg: 5, ageMonths: 2 }, p));
    assert.ok(isBlocked(notes), p.label + ": немає блокування у 2 місяці");
  }
});

test("ібупрофен: 3 місяці — можна з попередженням, 2 місяці — ні", () => {
  const at = (ageMonths) =>
    checkGates({ drug: "ibuprofen", form: "syrup", weightKg: 6, ageMonths, concMg: 100, concMl: 5 });
  assert.ok(isBlocked(at(2)));
  assert.ok(!isBlocked(at(3)), "європейські інструкції дозволяють з 3 місяців");
  assert.ok(at(3).some((w) => w.code === "ibu_under_6m" && w.level === "warn"),
    "розбіжність з AAP/FDA має бути показана батькові");
  assert.ok(!at(7).some((w) => w.code === "ibu_under_6m"));
});

test("ібупрофен: пороги маси різні для суспензії та свічок", () => {
  const susp = (weightKg) =>
    checkGates({ drug: "ibuprofen", form: "syrup", weightKg, ageMonths: 5, concMg: 100, concMl: 5 });
  const supp = (weightKg) =>
    checkGates({ drug: "ibuprofen", form: "supp", weightKg, ageMonths: 5, concMg: 60 });
  assert.ok(isBlocked(susp(4.9)), "суспензія — мінімум 5 кг");
  assert.ok(!isBlocked(susp(5.1)));
  assert.ok(isBlocked(supp(5.5)), "свічки — мінімум 6 кг");
  assert.ok(!isBlocked(supp(6.5)));
});

test("таблетки: кожен номінал має власний віковий і ваговий поріг", () => {
  const gate = (drug, concMg, ageMonths, weightKg) =>
    checkGates({ drug, form: "tab", weightKg, ageMonths, concMg });

  assert.ok(isBlocked(gate("paracetamol", 500, 60, 20)), "500 мг у 5 років — ні");
  assert.ok(!isBlocked(gate("paracetamol", 500, 84, 25)), "500 мг у 7 років — так");

  assert.ok(isBlocked(gate("ibuprofen", 200, 84, 18)), "200 мг при 18 кг — ні (потрібно 20)");
  assert.ok(!isBlocked(gate("ibuprofen", 200, 84, 22)));

  assert.ok(isBlocked(gate("ibuprofen", 400, 120, 45)), "400 мг у 10 років — ні (потрібно 12)");
  assert.ok(isBlocked(gate("ibuprofen", 400, 156, 35)), "400 мг при 35 кг — ні (потрібно 40)");
  assert.ok(!isBlocked(gate("ibuprofen", 400, 156, 45)));
});

test("вік не вказано: таблетки просять уточнити вік, рідкі форми — ні", () => {
  const tab = checkGates({ drug: "paracetamol", form: "tab", weightKg: 25, ageMonths: null, concMg: 500 });
  assert.ok(tab.some((w) => w.code === "tab_age_unknown"));
  assert.ok(!isBlocked(tab), "невідомий вік не привід блокувати — це привід спитати");

  const syrup = checkGates({ drug: "paracetamol", form: "syrup", weightKg: 15, ageMonths: null, concMg: 120, concMl: 5 });
  assert.ok(syrup.some((w) => w.code === "age_unknown" && w.level === "info"));
});

test("номінал свічки звіряється з ваговим діапазоном інструкції", () => {
  const gate = (concMg, weightKg) =>
    checkGates({ drug: "paracetamol", form: "supp", weightKg, ageMonths: 24, concMg }).map((w) => w.code);
  assert.ok(gate(300, 9).includes("supp_nominal_low"), "300 мг — від 15 кг");
  assert.ok(gate(80, 18).includes("supp_nominal_high"), "80 мг — до 10 кг");
  assert.ok(!gate(150, 12).includes("supp_nominal_low"), "150 мг при 12 кг — у межах");
});

test("концентрований сироп 250 мг/5 мл позначається як форма для школярів", () => {
  const c = warn({ drug: "paracetamol", form: "syrup", weightKg: 14, ageMonths: 36, concMg: 250, concMl: 5 });
  assert.ok(c.includes("conc_school_age"));
  assert.ok(!warn({ drug: "paracetamol", form: "syrup", weightKg: 25, ageMonths: 96, concMg: 250, concMl: 5 })
    .includes("conc_school_age"));
});

test("розбіжність UA/PL по формі 200 мг/5 мл показується батькові", () => {
  const c = warn({ drug: "ibuprofen", form: "syrup", weightKg: 6, ageMonths: 4, concMg: 200, concMl: 5 });
  assert.ok(c.includes("ibu_forte_age"));
});

test("при блокуванні не показуються ні доза, ні побічні поради", () => {
  const input = { drug: "ibuprofen", form: "supp", weightKg: 5, ageMonths: 4, concMg: 60 };
  const notes = buildWarnings(input, computeDose(input));
  assert.ok(isBlocked(notes));
  assert.ok(!notes.some((w) => w.code === "hidden_paracetamol"),
    "коли препарат давати не можна, загальні поради лише розмивають головне");
  assert.ok(!notes.some((w) => w.code === "duration_limit"));
});

test("обмеження тривалості нагадується при кожному дозволеному розрахунку", () => {
  const c = warn({ drug: "paracetamol", form: "syrup", weightKg: 15, ageMonths: 36, concMg: 120, concMl: 5 });
  assert.ok(c.includes("duration_limit"));
});

test("список заборонених дітям препаратів заповнений і має пороги", () => {
  assert.ok(FORBIDDEN.length >= 3);
  for (const f of FORBIDDEN) {
    assert.ok(f.name && f.rule && f.why, "неповний запис: " + JSON.stringify(f));
  }
  const names = FORBIDDEN.map((f) => f.name).join(" ");
  assert.match(names, /аспірин/i);
  assert.match(names, /Німесулід/i);
  assert.match(names, /Метамізол/i);
});

test("межі з протоколів не зникли з таблиці LIMITS", () => {
  assert.equal(LIMITS.doctorOnlyAgeMonths, 3);
  assert.equal(LIMITS.ibuprofen.minAgeMonths, 3);
  assert.equal(LIMITS.ibuprofen.cautionAgeMonths, 6);
  assert.equal(LIMITS.ibuprofen.minWeightKg, 5);
  assert.equal(LIMITS.ibuprofen.suppMinWeightKg, 6);
  assert.equal(LIMITS.paracetamol.minWeightKg, 4);
  assert.equal(LIMITS.paracetamol.tabMinAgeMonths, 72);
  assert.equal(LIMITS.ibuprofen.tab[400].minAgeMonths, 144);
});

test("Apap dla dzieci Forte розпізнається як посилена концентрація", () => {
  const c = warn({ drug: "paracetamol", form: "syrup", weightKg: 9, ageMonths: 8, concMg: 200, concMl: 5 });
  assert.ok(c.includes("conc_forte"), "40 мг/мл має підсвічуватися як форте");
  const d = computeDose({ drug: "paracetamol", form: "syrup", weightKg: 9, concMg: 200, concMl: 5 });
  assert.equal(d.amount, 3.25, "шприц має поділки по 0,25 мл");
  assert.equal(d.actualMg, 130, "3,5 мл дали б 140 мг — понад стелю 135, тому крок вниз");
  assert.ok(d.actualMg <= d.maxMg);
});

test("доросла таблетка 500 мг: блок до 6 років, попередження про розбіжність UA/PL до 12", () => {
  const at = (ageMonths) =>
    checkGates({ drug: "paracetamol", form: "tab", weightKg: 30, ageMonths, concMg: 500 });
  assert.ok(isBlocked(at(60)), "до 6 років — блок");
  assert.ok(at(96).some((w) => w.code === "par_tab_500_age"), "6-12 років — попередження");
  assert.ok(!isBlocked(at(96)), "українська інструкція дозволяє з 6 років");
  assert.ok(!at(156).some((w) => w.code === "par_tab_500_age"), "після 12 років розбіжності немає");
});

test("список комбінованих препаратів заповнений", () => {
  assert.ok(COMBINED.length >= 4);
  for (const c of COMBINED) assert.ok(c.name && c.what && c.rule, JSON.stringify(c));
  assert.match(COMBINED.map((c) => c.name).join(" "), /Apap Extra/);
  assert.match(COMBINED.map((c) => c.what).join(" "), /кофеїн/);
});

test("саше: вік з інструкції важливіший за арифметику", () => {
  const at = (concMg, ageMonths) =>
    checkGates({ drug: "paracetamol", form: "sachet", weightKg: 20, ageMonths, concMg });
  assert.ok(isBlocked(at(250, 36)), "250 мг — від 4 років");
  assert.ok(!isBlocked(at(250, 60)));
  assert.ok(isBlocked(at(500, 96)), "500 мг — від 11 років");
  assert.ok(!isBlocked(at(500, 144)));
  assert.ok(at(250, null).some((w) => w.code === "sachet_age_unknown"));
});

test("саше дозволені раніше за таблетки — гранули не треба ковтати", () => {
  const age = 60; // 5 років
  const tab = checkGates({ drug: "paracetamol", form: "tab", weightKg: 18, ageMonths: age, concMg: 250 });
  const sachet = checkGates({ drug: "paracetamol", form: "sachet", weightKg: 18, ageMonths: age, concMg: 250 });
  assert.ok(isBlocked(tab), "таблетка у 5 років — ні");
  assert.ok(!isBlocked(sachet), "саше у 5 років — так");
});

test("саше рахується цілими одиницями", () => {
  const d = computeDose({ drug: "paracetamol", form: "sachet", weightKg: 20, concMg: 250 });
  assert.equal(d.unit, "sachet");
  assert.equal(d.amount, 1);
  assert.equal(d.actualMg, 250);
});

test("ібупрофен не має форми саше — порожній список не ламає довідник", () => {
  assert.deepEqual(DRUGS.ibuprofen.forms.sachet, []);
  assert.ok(DRUGS.paracetamol.forms.sachet.length > 0);
});

test("жувальні капсули відтворюють таблицю з інструкції Nurofen Junior", () => {
  const at = (weightKg) => computeDose({ drug: "ibuprofen", form: "chew", weightKg, concMg: 100 });
  assert.equal(at(25).amount, 2, "20-29 кг — 2 капсули");
  assert.equal(at(25).actualMg, 200);
  assert.equal(at(35).amount, 3, "30-40 кг — 3 капсули");
  assert.equal(at(35).actualMg, 300);
  assert.equal(at(25).dosesPerDay, 3, "тричі на добу");
});

test("жувальні капсули мають власне вікове й вагове вікно", () => {
  const gate = (ageMonths, weightKg) =>
    checkGates({ drug: "ibuprofen", form: "chew", weightKg, ageMonths, concMg: 100 });
  assert.ok(isBlocked(gate(60, 18)), "5 років і 18 кг — ні");
  assert.ok(isBlocked(gate(96, 18)), "вік підходить, вага ні");
  assert.ok(!isBlocked(gate(96, 25)), "8 років і 25 кг — так");
  assert.ok(gate(156, 45).some((w) => w.code === "chew_weight_high"), "понад 40 кг — доросле дозування");
});

test("парацетамол не має жувальних капсул, ібупрофен не має саше", () => {
  assert.deepEqual(DRUGS.paracetamol.forms.chew, []);
  assert.deepEqual(DRUGS.ibuprofen.forms.sachet, []);
  assert.ok(DRUGS.ibuprofen.forms.chew.length > 0);
  assert.ok(DRUGS.paracetamol.forms.sachet.length > 0);
});

test("кожна неподільна форма має власну межу кількості", () => {
  assert.equal(MAX_UNITS.supp, 2);
  assert.equal(MAX_UNITS.sachet, 2);
  assert.ok(MAX_UNITS.chew >= 3, "інструкція допускає 3 капсули на прийом");
});

/* ─────────────── тексти ─────────────── */

const I18N = require("../i18n.js");

test("кожен код попередження має текст обома мовами", () => {
  const codes = new Set();
  for (const p of PRESETS) {
    for (const weightKg of [3, 5, 9, 15, 25, 45]) {
      for (const ageMonths of [null, 2, 4, 10, 36, 60, 96, 156]) {
        const inp = Object.assign({ weightKg, ageMonths }, p);
        buildWarnings(inp, computeDose(inp)).forEach((n) => codes.add(n.code));
      }
    }
  }
  assert.ok(codes.size > 15, "сітка має покривати більшість кодів, знайдено " + codes.size);
  for (const code of codes) {
    assert.ok(I18N.NOTES[code], "немає тексту для коду " + code);
    assert.ok(I18N.NOTES[code].uk && I18N.NOTES[code].en, code + ": бракує однієї з мов");
  }
});

test("підстановки в текстах справді підставляються", () => {
  const note = { level: "block", code: "tab_age", vars: { mg: 500, years: 6 } };
  const uk = I18N.noteText(note, "uk");
  const en = I18N.noteText(note, "en");
  assert.match(uk, /500/);
  assert.match(uk, /6/);
  assert.match(en, /500/);
  assert.ok(uk !== en, "мови мають відрізнятися");
  assert.ok(!uk.includes("undefined") && !en.includes("undefined"));
});

test("немає осиротілих текстів і немає кодів без тексту", () => {
  const src = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "calc-core.js"), "utf8");
  const used = new Set();
  const re = /push\(\s*"(?:block|danger|warn|info)"\s*,\s*"([a-z0-9_]+)"/g;
  let m;
  while ((m = re.exec(src))) used.add(m[1]);

  const written = new Set(Object.keys(I18N.NOTES));
  const orphans = [...written].filter((c) => !used.has(c));
  const missing = [...used].filter((c) => !written.has(c));
  assert.deepEqual(orphans, [], "тексти без відповідного коду в ядрі");
  assert.deepEqual(missing, [], "коди в ядрі без тексту");
});

test("інтерфейс перекладено повністю — обидві мови мають однакові ключі", () => {
  const keys = (o, prefix = "") => Object.keys(o).flatMap((k) => {
    const v = o[k];
    return v && typeof v === "object" && !Array.isArray(v) && typeof v !== "function"
      ? keys(v, prefix + k + ".")
      : [prefix + k];
  });
  assert.deepEqual(keys(I18N.UI.uk).sort(), keys(I18N.UI.en).sort());
});

test("сторінка не тягне шрифти ззовні", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(html), "лишилося посилання на Google Fonts — офлайн зламається");
  assert.match(html, /@font-face/, "шрифти мають бути підключені локально");

  const needed = [
    "archivo-latin-wght-normal.woff2",
    "archivo-latin-ext-wght-normal.woff2",
    "manrope-cyrillic-wght-normal.woff2",
    "manrope-cyrillic-ext-wght-normal.woff2"
  ];
  const sw = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
  for (const f of needed) {
    assert.ok(fs.existsSync(path.join(__dirname, "..", "fonts", f)), "немає файлу шрифту " + f);
    assert.ok(html.includes(f), "шрифт " + f + " не підключений у CSS");
    assert.ok(sw.includes(f), "шрифт " + f + " не кешується service worker'ом");
  }
});

test("кирилицю покриває шрифт, у якому вона є", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  /* саме @font-face, а не тег preload вище — той теж містить це ім'я файлу */
  const cyrBlock = html.slice(html.indexOf("src:url(fonts/manrope-cyrillic-wght-normal.woff2)"));
  const range = cyrBlock.slice(0, 400).match(/unicode-range:([^;]+);/);
  assert.ok(range, "у кириличного @font-face немає unicode-range");
  assert.match(range[1], /U\+0400-045F/, "діапазон має покривати основну кирилицю");
  assert.ok(range[1].includes("U+0490-0491"), "українські Ґ і ґ мають бути в діапазоні");
});

/* ─────────────── очищення вводу ─────────────── */

const W = { decimal: true, maxLength: 5 };
const A = { decimal: false, maxLength: 3 };

test("від'ємні значення не проходять", () => {
  assert.equal(sanitizeNumber("-5", W), "");
  assert.equal(sanitizeNumber("-12.5", W), "");
  assert.equal(sanitizeNumber("7-", W), "7", "мінус у кінці просто обрізає рядок");
  assert.equal(sanitizeNumber("-2", A), "");
});

test("значення, що починається з нуля, не приймається", () => {
  assert.equal(sanitizeNumber("0", W), "");
  assert.equal(sanitizeNumber("00", W), "");
  assert.equal(sanitizeNumber("0.5", W), "");
  assert.equal(sanitizeNumber("0,5", W), "");
  assert.equal(sanitizeNumber(".5", W), "", "без цілої частини теж ні");
  assert.equal(sanitizeNumber("05", W), "5", "провідний нуль просто прибирається");
  assert.equal(sanitizeNumber("007", W), "7");
});

test("на першому недопустимому символі рядок обрізається, а не склеюється", () => {
  assert.equal(sanitizeNumber("12.5.7", W), "12.5", "інакше вийшло б 12.57 — число, якого не вводили");
  assert.equal(sanitizeNumber("1e5", W), "1", "інакше вийшло б 15");
  assert.equal(sanitizeNumber("1E5", W), "1");
  assert.equal(sanitizeNumber("12abc", W), "12");
  assert.equal(sanitizeNumber("12,5", A), "12", "у полі віку роздільник обриває рядок");
});

test("кома і крапка рівноправні, назовні завжди крапка", () => {
  assert.equal(sanitizeNumber("12,5", W), "12.5");
  assert.equal(sanitizeNumber("12.5", W), "12.5");
  assert.equal(sanitizeNumber("12.", W), "12.", "проміжний стан набору не ламається");
});

test("пробіли й нецифрові символи не створюють чисел з нізвідки", () => {
  assert.equal(sanitizeNumber("  8 ", W), "8");
  assert.equal(sanitizeNumber("١٢", W), "", "арабо-індійські цифри не приймаємо");
  assert.equal(sanitizeNumber("", W), "");
  assert.equal(sanitizeNumber(null, W), "");
  assert.equal(sanitizeNumber(undefined, W), "");
});

test("довжина обмежена, щоб поле не переповнювалось", () => {
  assert.equal(sanitizeNumber("1234567", W), "12345");
  assert.equal(sanitizeNumber("9999", A), "999");
});

test("очищений ввід завжди або порожній, або коректне додатне число", () => {
  const inputs = ["-5", "0", "0.5", "05", "12,5", "1e5", "abc", "  ", "12.5.7", "999999", ".", ",", "-", "+3"];
  for (const raw of inputs) {
    const v = sanitizeNumber(raw, W);
    if (v === "" || v.endsWith(".")) continue;
    const n = Number(v);
    assert.ok(isFinite(n), raw + " → " + v + " не число");
    assert.ok(n > 0, raw + " → " + v + " не додатне");
    assert.ok(!/^0/.test(v), raw + " → " + v + " починається з нуля");
  }
});

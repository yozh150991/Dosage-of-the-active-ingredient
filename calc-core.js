/* Ядро розрахунку. Жодного DOM — щоб ті самі функції працювали
   і в браузері, і в node під час тестів.
   Медичні числа міняються ТІЛЬКИ тут і одночасно в PROJECT_CONTEXT.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Doza = api;
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

const DRUGS = {
  paracetamol: {
    label: "Парацетамол",
    perKg: { min: 10, max: 15, typical: 15 },
    maxSingleMg: 1000,
    dailyPerKg: 60,
    maxDailyMg: 4000,
    interval: "кожні 4–6 годин",
    intervalHours: 6,
    maxDoses: 4,
    minWeight: 4,
    minAgeMonths: 3,
    forms: {
      syrup: [
        { mg: 120, ml: 5, group: "ua", label: "120 мг / 5 мл — Панадол Бебі, Парацетамол Бебі, Дофалган, Піарон" },
        { mg: 150, ml: 5, group: "ua", label: "150 мг / 5 мл — Ефералган сироп 3%" },
        { mg: 250, ml: 5, group: "ua", label: "250 мг / 5 мл — Парацетамол сироп для дітей від 6 років" },
        { mg: 120, ml: 5, group: "pl", label: "120 мг / 5 мл — Panadol dla dzieci, Paracetamol Aflofarm" },
        { mg: 200, ml: 5, group: "pl", label: "200 мг / 5 мл (40 мг/мл) — Apap dla dzieci Forte" },
        { mg: 100, ml: 1, group: "pl", label: "100 мг / 1 мл — Pedicetamol krople (обережно, це краплі)" },
        { mg: 120, ml: 5, group: "eu", label: "120 мг / 5 мл — Calpol Infant (UK), Doliprane 2,4% (FR)" },
        { mg: 250, ml: 5, group: "eu", label: "250 мг / 5 мл — Calpol Six Plus (UK), від 6 років" },
        { mg: 200, ml: 5, group: "eu", label: "200 мг / 5 мл — ben-u-ron Saft, Mexalen (DE, AT)" }
      ],
      supp: [
        { mg: 80, group: "ua", label: "80 мг — Ефералган, Парацетамол Монфарм" },
        { mg: 100, group: "ua", label: "100 мг — Парацетамол супозиторії" },
        { mg: 150, group: "ua", label: "150 мг — Ефералган" },
        { mg: 300, group: "ua", label: "300 мг — Ефералган" },
        { mg: 80, group: "pl", label: "80 мг — Efferalgan czopki" },
        { mg: 150, group: "pl", label: "150 мг — Efferalgan czopki" },
        { mg: 250, group: "pl", label: "250 мг — Paracetamol czopki" },
        { mg: 75, group: "eu", label: "75 мг — ben-u-ron, від 3 кг" },
        { mg: 125, group: "eu", label: "125 мг — ben-u-ron" },
        { mg: 250, group: "eu", label: "250 мг — ben-u-ron, 2–8 років" },
        { mg: 500, group: "eu", label: "500 мг — від 12 років" }
      ],
      tab: [
        { mg: 200, group: "ua", label: "200 мг — Парацетамол дитячий" },
        { mg: 325, group: "ua", label: "325 мг" },
        { mg: 500, group: "ua", label: "500 мг — доросла таблетка" },
        { mg: 500, group: "pl", label: "500 мг — Apap (від 12 років)" }
      ],
      chew: [],
      sachet: [
        { mg: 250, group: "pl", label: "250 мг — Apap Junior, гранули на язик (від 4 років)" },
        { mg: 250, group: "eu", label: "250 мг — ben-u-ron direkt (4–11 років)" },
        { mg: 500, group: "eu", label: "500 мг — ben-u-ron direkt (від 11 років)" }
      ]
    }
  },
  ibuprofen: {
    label: "Ібупрофен",
    perKg: { min: 5, max: 10, typical: 10 },
    maxSingleMg: 400,
    dailyPerKg: 30,
    maxDailyMg: 1200,
    interval: "кожні 6–8 годин",
    intervalHours: 8,
    maxDoses: 3,
    minWeight: 5,
    minAgeMonths: 3,
    forms: {
      syrup: [
        { mg: 100, ml: 5, group: "ua", label: "100 мг / 5 мл — Нурофєн, Ібуфен, Ібупрофен Бебі, Ібунорм Бебі, Бофен, Імет 2%" },
        { mg: 200, ml: 5, group: "ua", label: "200 мг / 5 мл — Нурофєн для дітей форте" },
        { mg: 100, ml: 5, group: "pl", label: "100 мг / 5 мл — Nurofen dla dzieci, Ibufen D, Ibum" },
        { mg: 200, ml: 5, group: "pl", label: "200 мг / 5 мл — Nurofen Forte, Ibufen Forte, Ibum Forte" },
        { mg: 100, ml: 5, group: "eu", label: "100 мг / 5 мл — Calprofen (UK), Nurofen Junior 2% (DE)" },
        { mg: 200, ml: 5, group: "eu", label: "200 мг / 5 мл — Nureflex, Nurofen Junior 4%" },
        { mg: 40, ml: 1, group: "eu", label: "40 мг / 1 мл — краплі, Advil enfant (FR)" }
      ],
      supp: [
        { mg: 60, group: "ua", label: "60 мг — Нурофєн для дітей, від 6 кг" },
        { mg: 60, group: "pl", label: "60 мг — Nurofen dla dzieci czopki" },
        { mg: 125, group: "pl", label: "125 мг — Nurofen dla dzieci czopki, від 12,5 кг" },
        { mg: 125, group: "eu", label: "125 мг — Nurofen Junior Zäpfchen" }
      ],
      sachet: [],
      chew: [
        { mg: 100, group: "pl", label: "100 мг — Nurofen dla dzieci Junior (7-12 років, 20-40 кг)" }
      ],
      tab: [
        { mg: 200, group: "ua", label: "200 мг — Нурофєн, від 20 кг" },
        { mg: 400, group: "ua", label: "400 мг — Нурофєн форте, від 12 років" }
      ]
    }
  }
};

const GROUPS = [
  ["ua", "Україна"],
  ["pl", "Польща"],
  ["eu", "Німеччина, Австрія, Велика Британія, Франція"]
];

const FORM_LABEL = { syrup: "Сироп або суспензія", supp: "Свічки", tab: "Таблетки", sachet: "Саше або гранули", chew: "Жувальні капсули" };

/* Порогові концентрації, за якими легко сплутати флакони, мг/мл */
const CONC_FORTE = 40;
const CONC_DROPS = 80;

/* ── Вікові та вагові межі за інструкціями й протоколами ──
   Джерела: NICE NG143; AAP (Pediatrics 2011;127(3):580-587); SmPC/ChPL ЄС;
   інструкції МОЗ України (Панадол Бебі UA/2562/02/01, Нурофєн UA/8233/01/01),
   ChPL Nurofen dla dzieci (PL), ben-u-ron (DE); Ziesenitz, Paediatr Drugs 2017.
   Детальний розбір і розбіжності — розділ 5 PROJECT_CONTEXT.md.
   Скрізь, де джерела розходяться, взято консервативнішу межу. */
const LIMITS = {
  /* Гарячка в цьому віці — завжди огляд лікаря, а не самолікування (NICE, Medscape) */
  doctorOnlyAgeMonths: 3,

  paracetamol: {
    minWeightKg: 4,               // Ефералган: від 4 кг
    tabMinAgeMonths: 72,          // тверді форми — від 6 років (інструкції UA)
    tab500PlMinAgeMonths: 144,    // Apap 500 мг (PL) — від 12 років
    /* саше/гранули не треба ковтати цілими, тому поріг нижчий за таблетки */
    sachet: {
      250: { minAgeMonths: 48 },  // Apap Junior, ben-u-ron direkt
      500: { minAgeMonths: 132 }  // ben-u-ron direkt — від 11 років
    },
    concSchoolAgeMgPerMl: 50,     // 250 мг/5 мл — форма для дітей від 6 років
    /* номінал свічки → допустима вага, кг */
    supp: {
      75:  { min: 3,  max: 5 },
      80:  { min: 5,  max: 10 },
      100: { min: 6,  max: 12 },
      125: { min: 7,  max: 15 },
      150: { min: 10, max: 20 },
      250: { min: 13, max: 30 },
      300: { min: 15, max: 30 },
      500: { min: 30, max: null }
    }
  },

  ibuprofen: {
    minAgeMonths: 3,              // SmPC/ChPL ЄС та інструкції UA
    cautionAgeMonths: 6,          // AAP і FDA рекомендують з 6 місяців
    minWeightKg: 5,               // суспензія
    suppMinWeightKg: 6,           // супозиторії 60 мг
    forteMinAgeMonths: 6,         // 200 мг/5 мл: UA — від 6 міс., PL — від 3 міс.
    forteMinWeightKg: 8,
    supp: {
      60:  { min: 6,    max: 12.5 },
      125: { min: 12.5, max: 20 }
    },
    /* жувальні капсули: ковтати цілими не треба, але доза фіксована */
    chew: {
      100: { minAgeMonths: 84, minWeightKg: 20, maxWeightKg: 40 }
    },
    /* номінал таблетки → мінімальні вік і вага */
    tab: {
      100: { minAgeMonths: 72,  minWeightKg: 20 },
      200: { minAgeMonths: 72,  minWeightKg: 20 },
      400: { minAgeMonths: 144, minWeightKg: 40 }
    }
  }
};

/* Комбіновані препарати під тим самим брендом: парацетамол там є,
   але калькулятор їх не рахує — доза рахується лише для монопрепаратів. */
const COMBINED = [
  { name: "Apap Extra", what: "парацетамол 500 мг + кофеїн 65 мг", rule: "від 12 років" },
  { name: "Apap Noc", what: "парацетамол + дифенгідрамін (снодійний компонент)", rule: "від 12 років" },
  { name: "Apap Przeziębienie, Apap Zatoki", what: "парацетамол + судинозвужувальний компонент", rule: "від 12 років" },
  { name: "Порошки від застуди (Theraflu, Coldrex тощо)", what: "парацетамол у повній дорослій дозі", rule: "не для малих дітей" }
];

/* Препарати, які дітям не можна взагалі — калькулятор їх не рахує,
   але батько має про це прочитати (розділ «Джерела»). */
const FORBIDDEN = [
  { name: "Ацетилсаліцилова кислота (аспірин)", rule: "до 16 років", why: "синдром Рея — гостре ураження печінки й мозку" },
  { name: "Німесулід", rule: "до 12 років", why: "гепатотоксичність; заборонено наказом МОЗ №596 та EMA" },
  { name: "Метамізол (анальгін)", rule: "до 1 року заборонений, далі лише за призначенням лікаря", why: "ризик агранулоцитозу" }
];

/* Максимум неподільних одиниць на один прийом.
   Свічок і саше — дві; жувальних капсул інструкція допускає до трьох
   (Nurofen Junior: 30-40 кг = 3 капсули), тому тут межа вища. */
const MAX_UNITS = { supp: 2, sachet: 2, chew: 4 };
const MAX_SUPPOSITORIES = MAX_UNITS.supp;

/* Разова доза.
   Повертає { ok, error } або { ok:true, amount, unit, actualMg, ... , flags }.
   flags — машинні коди проблем форми випуску, тексти живуть у buildWarnings. */
function computeDose(input) {
  const drug = DRUGS[input.drug];
  const form = input.form;
  const weight = Number(input.weightKg);
  const concMg = Number(input.concMg);
  const concMl = form === "syrup" ? Number(input.concMl) : null;

  if (!drug) return { ok: false, error: "drug" };
  if (!FORM_LABEL[form]) return { ok: false, error: "form" };
  if (!isFinite(weight) || weight < 2 || weight > 120) return { ok: false, error: "weight" };
  if (!isFinite(concMg) || concMg <= 0) return { ok: false, error: "concentration" };
  if (form === "syrup" && (!isFinite(concMl) || concMl <= 0)) return { ok: false, error: "concentration" };

  const minMg = drug.perKg.min * weight;
  const maxMg = Math.min(drug.perKg.max * weight, drug.maxSingleMg);
  const targetMg = Math.min(drug.perKg.typical * weight, drug.maxSingleMg);
  const dailyLimitMg = Math.min(drug.dailyPerKg * weight, drug.maxDailyMg);

  const flags = [];
  let amount, unit, actualMg;

  if (form === "syrup") {
    const mgPerMl = concMg / concMl;
    const step = targetMg / mgPerMl >= 5 ? 0.5 : 0.25;
    let ml = Math.round(targetMg / mgPerMl / step) * step;
    while (ml * mgPerMl > maxMg && ml > step) ml -= step;
    if (ml < step) ml = step;
    amount = Number(ml.toFixed(2));
    unit = "ml";
    actualMg = amount * mgPerMl;
    if (amount > 20) flags.push("volume_large");
    if (mgPerMl >= CONC_DROPS) flags.push("conc_drops");
    else if (mgPerMl >= CONC_FORTE) flags.push("conc_forte");
  } else if (form === "supp" || form === "sachet" || form === "chew") {
    /* Більше двох свічок за раз не вводять: якщо арифметика вимагає більше,
       номінал просто замалий для цієї ваги. Знайдено тестом на 25 кг × 80 мг,
       де розрахунок пропонував 4 свічки. */
    const wanted = Math.round(targetMg / concMg);
    let n = Math.max(1, Math.min(MAX_UNITS[form], wanted));
    while (n * concMg > maxMg && n > 1) n--;
    amount = n;
    unit = form;
    actualMg = n * concMg;
    if (actualMg > maxMg) flags.push(form + "_too_large");
    else if (actualMg < minMg) flags.push(form + "_below_min");
  } else {
    const step = 0.5;
    let n = Math.max(step, Math.round(targetMg / concMg / step) * step);
    while (n * concMg > maxMg && n > step) n -= step;
    amount = n;
    unit = "tab";
    actualMg = n * concMg;
    if (actualMg > maxMg) flags.push("tab_too_large");
  }

  const dosesPerDay = Math.max(1, Math.min(drug.maxDoses, Math.floor(dailyLimitMg / actualMg)));

  return {
    ok: true,
    amount: amount,
    unit: unit,
    actualMg: actualMg,
    mgPerKg: actualMg / weight,
    minMg: minMg,
    maxMg: maxMg,
    dailyLimitMg: dailyLimitMg,
    dosesPerDay: dosesPerDay,
    flags: flags
  };
}

/* Гейти допуску: чи можна цьому препарату в цій формі бути в руках цієї дитини.
   Залежать тільки від вводу, не від арифметики дози — тому викликаються ДО неї.
   level "block" означає, що доза не показується взагалі. */
function checkGates(input) {
  const out = [];
  const push = (level, code, text) => out.push({ level: level, code: code, text: text });

  const drugId = input.drug;
  const drug = DRUGS[drugId];
  if (!drug) return out;
  const lim = LIMITS[drugId];
  const form = input.form;
  const weight = Number(input.weightKg);
  const conc = Number(input.concMg);
  const concMl = Number(input.concMl);
  const months =
    input.ageMonths === null || input.ageMonths === undefined || input.ageMonths === ""
      ? null
      : Number(input.ageMonths);
  const knownAge = months !== null && isFinite(months);
  const knownWeight = isFinite(weight) && weight > 0;

  /* 1. Гарячка в перші три місяці — це завжди лікар */
  if (knownAge && months < LIMITS.doctorOnlyAgeMonths) {
    push("block", "age_under_3m",
      "<strong>Дитині менше 3 місяців.</strong> Гарячка в цьому віці — привід звернутися по медичну допомогу сьогодні, а не давати жарознижувальне вдома. Дозу для немовляти (зокрема ректальні форми від 3 кг) призначає лікар.");
    return out;
  }

  /* 2. Ібупрофен: нижня межа і зона обережності */
  if (drugId === "ibuprofen") {
    if (knownAge && months < lim.minAgeMonths) {
      push("block", "ibu_under_3m",
        "Ібупрофен не застосовують у дітей до 3 місяців. У цьому віці препаратом вибору є парацетамол, і призначає його лікар.");
    } else if (knownAge && months < lim.cautionAgeMonths) {
      push("warn", "ibu_under_6m",
        "Європейські інструкції дозволяють ібупрофен з 3 місяців, американські (AAP, FDA) — лише з 6. Якщо симптоми тримаються довше <strong>24 годин</strong> або після трьох доз — до лікаря негайно.");
    }
    if (knownWeight && weight < lim.minWeightKg) {
      push("block", "ibu_weight_below_5",
        "Ібупрофен не застосовують при масі тіла менше 5 кг.");
    } else if (form === "supp" && knownWeight && weight < lim.suppMinWeightKg) {
      push("block", "ibu_supp_weight_below_6",
        "Супозиторії ібупрофену протипоказані при масі менше 6 кг. Оберіть суспензію або парацетамол.");
    }
    if (form === "syrup" && isFinite(conc) && isFinite(concMl) && conc / concMl >= CONC_FORTE) {
      if (knownAge && months < lim.forteMinAgeMonths) {
        push("warn", "ibu_forte_age",
          "Українська інструкція на форму 200 мг/5 мл — від 6 місяців і 8 кг, польська на ту саму концентрацію — від 3 місяців. Розбіжність реальна: якщо є звичайна суспензія 100 мг/5 мл, у цьому віці візьміть її.");
      } else if (knownWeight && weight < lim.forteMinWeightKg) {
        push("warn", "ibu_forte_weight",
          "Форма 200 мг/5 мл розрахована на масу від 8 кг. Для меншої дитини точніше відміряти звичайну суспензію 100 мг/5 мл.");
      }
    }
  }

  /* 3. Парацетамол: нижня межа за масою */
  if (drugId === "paracetamol" && knownWeight && weight < lim.minWeightKg) {
    push("block", "par_weight_below_4",
      "Маса менше 4 кг — доза розраховується за призначенням лікаря, з поправкою на вік від зачаття.");
  }

  /* 4. Тверді таблетки: аспірація важливіша за арифметику */
  if (form === "tab") {
    const tabRule = (lim.tab && lim.tab[conc]) || null;
    const minAge = tabRule ? tabRule.minAgeMonths : LIMITS.paracetamol.tabMinAgeMonths;
    if (knownAge && months < minAge) {
      push("block", "tab_age",
        "Таблетку " + conc + " мг не дають дітям до " + Math.round(minAge / 12) + " років: ризик поперхнутися, а поділена таблетка дозується неточно. Оберіть суспензію або свічки.");
    } else if (!knownAge) {
      push("warn", "tab_age_unknown",
        "Вкажіть вік: тверді таблетки не дають дітям до 6 років, а номінали 200 і 400 мг мають власні вікові межі.");
    }
    if (drugId === "paracetamol" && conc >= 500 && knownAge &&
        months >= LIMITS.paracetamol.tabMinAgeMonths &&
        months < LIMITS.paracetamol.tab500PlMinAgeMonths) {
      push("warn", "par_tab_500_age",
        "Польський Apap 500 мг — від 12 років, українська інструкція на парацетамол 500 мг дозволяє з 6 років по половині таблетки. Якщо є сироп або свічки, у цьому віці вони точніші за поділену таблетку.");
    }
    if (tabRule && knownWeight && weight < tabRule.minWeightKg) {
      push("block", "tab_weight",
        "Таблетка " + conc + " мг розрахована на масу від " + tabRule.minWeightKg + " кг.");
    }
  }

  /* 4а. Саше з гранулами: ковтати не треба, тому поріг нижчий за таблетки,
     але номінал усе одно фіксований і має власний вік за інструкцією */
  if (form === "sachet" && isFinite(conc)) {
    const rule = lim.sachet && lim.sachet[conc];
    const minAge = rule ? rule.minAgeMonths : 48;
    if (knownAge && months < minAge) {
      push("block", "sachet_age",
        "Саше " + conc + " мг за інструкцією призначене дітям від " + Math.round(minAge / 12) + " років. Доза в ньому фіксована й не ділиться — для меншої дитини потрібна рідка форма або свічки.");
    } else if (!knownAge) {
      push("warn", "sachet_age_unknown",
        "Вкажіть вік: саше має фіксовану дозу й власну вікову межу (250 мг — від 4 років, 500 мг — від 11).");
    }
  }

  /* 4б. Жувальні капсули: власне вікове і вагове вікно за інструкцією */
  if (form === "chew" && isFinite(conc)) {
    const rule = lim.chew && lim.chew[conc];
    if (rule) {
      if (knownAge && months < rule.minAgeMonths) {
        push("block", "chew_age",
          "Жувальні капсули " + conc + " мг призначені дітям від " + Math.round(rule.minAgeMonths / 12) + " років. Молодшій дитині потрібна суспензія.");
      }
      if (knownWeight && weight < rule.minWeightKg) {
        push("block", "chew_weight",
          "Жувальні капсули розраховані на масу від " + rule.minWeightKg + " кг.");
      } else if (rule.maxWeightKg && knownWeight && weight > rule.maxWeightKg) {
        push("warn", "chew_weight_high",
          "Ця форма розрахована на масу до " + rule.maxWeightKg + " кг. Для більшої дитини діють дорослі дозування.");
      }
    }
  }

  /* 5. Свічки: номінал прив'язаний до ваги в самій інструкції */
  if (form === "supp" && isFinite(conc) && knownWeight) {
    const range = lim.supp && lim.supp[conc];
    if (range) {
      if (weight < range.min) {
        push("warn", "supp_nominal_low",
          "Свічка " + conc + " мг за інструкцією призначена для маси від " + range.min + " кг. Для " + weight + " кг візьміть менший номінал.");
      } else if (range.max && weight > range.max) {
        push("warn", "supp_nominal_high",
          "Свічка " + conc + " мг розрахована на масу до " + range.max + " кг. Для більшої дитини зручніший інший номінал або рідка форма.");
      }
    }
  }

  /* 6. Концентрований сироп парацетамолу — форма для школярів */
  if (drugId === "paracetamol" && form === "syrup" && isFinite(conc) && isFinite(concMl) &&
      conc / concMl >= lim.concSchoolAgeMgPerMl && knownAge && months < lim.tabMinAgeMonths) {
    push("warn", "conc_school_age",
      "Концентрація 250 мг/5 мл — це форма для дітей від 6 років. Доза порахована правильно, але для меншої дитини точніше відміряти сироп 120 або 150 мг/5 мл.");
  }

  /* 7. Вік не вказано — вікові перевірки не виконані */
  if (!knownAge && form !== "tab") {
    push("info", "age_unknown",
      "Вік не вказано, тому вікові обмеження не перевірені. Доза рахується тільки за вагою.");
  }

  return out;
}

function isBlocked(notes) {
  return notes.some(function (n) { return n.level === "block"; });
}

function buildWarnings(input, dose) {
  const drug = DRUGS[input.drug];
  const weight = Number(input.weightKg);
  const flags = (dose && dose.flags) || [];
  const out = checkGates(input);
  const push = (level, code, text) => out.push({ level: level, code: code, text: text });

  /* Якщо препарат у цьому віці чи формі взагалі не можна — далі не міркуємо */
  if (isBlocked(out)) return out;

  if (flags.indexOf("supp_too_large") > -1) {
    push("danger", "supp_too_large", "Свічка " + input.concMg + " мг завелика для ваги " + weight + " кг. Візьміть меншу — свічки не можна різати, діюча речовина в них розподілена нерівномірно.");
  }
  if (flags.indexOf("supp_below_min") > -1) {
    push("warn", "supp_below_min", "Ця свічка дає менше за мінімальну ефективну дозу. Ефект може бути слабким — підберіть свічку більшого номіналу.");
  }
  if (flags.indexOf("sachet_too_large") > -1) {
    push("danger", "sachet_too_large", "Саше " + input.concMg + " мг завелике для ваги " + weight + " кг. Гранули не діляться — потрібна рідка форма.");
  }
  if (flags.indexOf("sachet_below_min") > -1) {
    push("warn", "sachet_below_min", "Це саше дає менше за мінімальну ефективну дозу для такої ваги.");
  }
  if (flags.indexOf("chew_too_large") > -1) {
    push("danger", "chew_too_large", "Навіть одна капсула " + input.concMg + " мг перевищує дозу для цієї ваги.");
  }
  if (flags.indexOf("chew_below_min") > -1) {
    push("warn", "chew_below_min", "Стільки капсул дає менше за мінімальну ефективну дозу.");
  }
  if (flags.indexOf("tab_too_large") > -1) {
    push("danger", "tab_too_large", "Навіть половина таблетки " + input.concMg + " мг перевищує дозу для цієї ваги. Потрібна рідка форма або свічки.");
  }
  if (flags.indexOf("volume_large") > -1) {
    push("warn", "volume_large", "Об'єм понад 20 мл — перевірте, чи правильно вказана концентрація на упаковці.");
  }
  if (flags.indexOf("conc_drops") > -1) {
    push("warn", "conc_drops", "<strong>" + Math.round(input.concMg / input.concMl) + " мг в одному мілілітрі — це краплі, а не сироп.</strong> Концентрація вчетверо вища за звичайну суспензію. Ще раз звірте цифру на флаконі.");
  }
  if (flags.indexOf("conc_forte") > -1) {
    push("warn", "conc_forte", "Це посилена форма («форте»). Вона вдвічі концентрованіша за звичайну — переконайтеся, що у вас у руках саме той флакон.");
  }

  if (input.drug === "ibuprofen") {
    push("info", "ibu_contraindications", "Ібупрофен не дають при зневодненні, багаторазовому блюванні чи проносі, вітряній віспі, хворобах нирок і при астмі з непереносимістю НПЗЗ. Давати після їжі.");
  }

  if (isFinite(weight) && weight > 40) {
    push("info", "adult_ceiling", "За такої ваги діють дорослі стелі: разова доза не більша за " + drug.maxSingleMg + " мг, добова — за " + drug.maxDailyMg + " мг.");
  }

  push("info", "duration_limit", "Без огляду лікаря жарознижувальне дають не довше <strong>3 днів</strong> поспіль. Для дитини 3–6 місяців межа інша: якщо температура тримається понад <strong>24 години</strong>, до лікаря треба звернутися одразу.");

  push("info", "hidden_paracetamol", "Перевірте, чи немає парацетамолу або ібупрофену в інших ліках, які дитина вже приймає — комбіновані порошки від застуди часто їх містять. Два жарознижувальні одночасно не дають.");

  return out;
}

/* Найраніший час наступної дози. now і lastTaken — Date. */
function nextDoseTime(drugId, lastTaken, dosesTaken, now) {
  const drug = DRUGS[drugId];
  if (!drug || !(lastTaken instanceof Date) || isNaN(lastTaken)) return null;
  const taken = Math.max(0, Number(dosesTaken) || 0);
  const next = new Date(lastTaken.getTime() + drug.intervalHours * 3600000);
  return {
    at: next,
    ready: next <= now,
    dosesLeft: Math.max(0, drug.maxDoses - taken),
    limitReached: drug.maxDoses - taken <= 0
  };
}

return {
  DRUGS: DRUGS,
  GROUPS: GROUPS,
  LIMITS: LIMITS,
  FORBIDDEN: FORBIDDEN,
  COMBINED: COMBINED,
  checkGates: checkGates,
  isBlocked: isBlocked,
  FORM_LABEL: FORM_LABEL,
  CONC_FORTE: CONC_FORTE,
  CONC_DROPS: CONC_DROPS,
  MAX_SUPPOSITORIES: MAX_SUPPOSITORIES,
  MAX_UNITS: MAX_UNITS,
  computeDose: computeDose,
  buildWarnings: buildWarnings,
  nextDoseTime: nextDoseTime
};
});

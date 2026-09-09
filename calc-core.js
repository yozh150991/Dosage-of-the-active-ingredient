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
        { mg: 120, ml: 5, group: "ua", label: "120 мг / 5 мл — Панадол Бебі, Парацетамол Бебі, Дофалган" },
        { mg: 150, ml: 5, group: "ua", label: "150 мг / 5 мл — Ефералган сироп 3%" },
        { mg: 250, ml: 5, group: "ua", label: "250 мг / 5 мл — Парацетамол сироп для дітей від 6 років" },
        { mg: 120, ml: 5, group: "pl", label: "120 мг / 5 мл — Panadol dla dzieci, Paracetamol Aflofarm" },
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
        { mg: 250, group: "eu", label: "250 мг — ben-u-ron direkt, саше 4–11 років" },
        { mg: 500, group: "eu", label: "500 мг — саше, від 11 років" }
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
        { mg: 100, ml: 5, group: "ua", label: "100 мг / 5 мл — Нурофєн для дітей, Ібупрофен Бебі" },
        { mg: 200, ml: 5, group: "ua", label: "200 мг / 5 мл — Нурофєн для дітей форте" },
        { mg: 100, ml: 5, group: "pl", label: "100 мг / 5 мл — Nurofen dla dzieci, Ibufen D" },
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
      tab: [
        { mg: 100, group: "ua", label: "100 мг — жувальні або в оболонці" },
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

const FORM_LABEL = { syrup: "Сироп або суспензія", supp: "Свічки", tab: "Таблетки" };

/* Порогові концентрації, за якими легко сплутати флакони, мг/мл */
const CONC_FORTE = 40;
const CONC_DROPS = 80;

/* Максимум свічок на один прийом */
const MAX_SUPPOSITORIES = 2;

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
  } else if (form === "supp") {
    /* Більше двох свічок за раз не вводять: якщо арифметика вимагає більше,
       номінал просто замалий для цієї ваги. Знайдено тестом на 25 кг × 80 мг,
       де розрахунок пропонував 4 свічки. */
    const wanted = Math.round(targetMg / concMg);
    let n = Math.max(1, Math.min(MAX_SUPPOSITORIES, wanted));
    while (n * concMg > maxMg && n > 1) n--;
    amount = n;
    unit = "supp";
    actualMg = n * concMg;
    if (actualMg > maxMg) flags.push("supp_too_large");
    else if (actualMg < minMg) flags.push("supp_below_min");
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

/* Попередження. code — для тестів, text — для людини. */
function buildWarnings(input, dose) {
  const drug = DRUGS[input.drug];
  const weight = Number(input.weightKg);
  const months = input.ageMonths === null || input.ageMonths === undefined || input.ageMonths === ""
    ? null
    : Number(input.ageMonths);
  const flags = (dose && dose.flags) || [];
  const out = [];
  const push = (level, code, text) => out.push({ level: level, code: code, text: text });

  if (months !== null && isFinite(months) && months < 3) {
    push("danger", "age_under_3m", "<strong>Дитині менше 3 місяців.</strong> Жарознижувальне в цьому віці дають лише за призначенням лікаря, а сама гарячка — привід звернутися по допомогу сьогодні, а не чекати.");
  } else if (input.drug === "ibuprofen" && months !== null && isFinite(months) && months < 6) {
    push("warn", "ibu_under_6m", "До 6 місяців ібупрофен дають після консультації з лікарем. Парацетамол у цьому віці — звичніший вибір.");
  }

  if (isFinite(weight) && weight < drug.minWeight) {
    push("danger", "weight_below_min", "Вага менша за " + drug.minWeight + " кг — дозу має призначати лікар.");
  }

  if (input.form === "tab" && months !== null && isFinite(months) && months < 72) {
    push("warn", "tab_under_6y", "Таблетки дітям до 6 років зазвичай не дають: ризик вдавитися, а половинка ділиться неточно. Рідка форма або свічки надійніші.");
  }

  if (flags.indexOf("supp_too_large") > -1) {
    push("danger", "supp_too_large", "Свічка " + input.concMg + " мг завелика для ваги " + weight + " кг. Візьміть меншу — свічки не можна різати, діюча речовина в них розподілена нерівномірно.");
  }
  if (flags.indexOf("supp_below_min") > -1) {
    push("warn", "supp_below_min", "Ця свічка дає менше за мінімальну ефективну дозу. Ефект може бути слабким — підберіть свічку більшого номіналу.");
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
  FORM_LABEL: FORM_LABEL,
  CONC_FORTE: CONC_FORTE,
  CONC_DROPS: CONC_DROPS,
  MAX_SUPPOSITORIES: MAX_SUPPOSITORIES,
  computeDose: computeDose,
  buildWarnings: buildWarnings,
  nextDoseTime: nextDoseTime
};
});

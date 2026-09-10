/* Усі тексти застосунку. Ядро (calc-core.js) оперує лише кодами —
   тут вони перетворюються на речення потрібною мовою.
   Додаючи попередження в ядро, додайте його код сюди в обидві мови:
   тест "кожен код має текст обома мовами" не дасть про це забути. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DozaI18n = api;
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

/* Інтерфейс */
const UI = {
  uk: {
    wordmark: ["доза", "дитині"],
    dark: "Темна тема",
    kicker: "Разова доза за вагою",
    h1: "Скільки жарознижувального дати дитині",
    sub: "Парацетамол та ібупрофен. Рахуємо у вашому браузері — дані нікуди не надсилаються.",
    tabs: { dose: "Доза", next: "Коли далі", src: "Джерела" },

    weightLabel: "Вага дитини",
    required: "обов'язково",
    kg: "кг",
    ageLabel: "Вік",
    years: "років",
    months: "місяців",
    ageNote: "Вік не змінює дозу — за ним перевіряємо вікові обмеження препарату.",
    drugLabel: "Препарат",
    paracetamol: "Парацетамол",
    ibuprofen: "Ібупрофен",
    formLabel: "Форма випуску",
    forms: { syrup: "Сироп", supp: "Свічки", tab: "Таблетки", sachet: "Саше", chew: "Жувальні" },
    strengthLabel: {
      syrup: "Концентрація сиропу — вказана на упаковці",
      supp: "Дозування свічки",
      tab: "Дозування таблетки",
      sachet: "Дозування саше",
      chew: "Дозування капсули"
    },
    clear: "Очистити все",
    attention: "Зверніть увагу",

    resultKicker: "Разова доза",
    emptyResult: "Введіть вагу — покажемо разову дозу і коли можна наступну.",
    blockedTitle: "Дозу не показуємо",
    blockedSub: "У цьому віці або в цій формі препарат давати не можна.",
    logDose: "Записати прийом",
    units: { ml: "мл", supp: ["свічка", "свічки"], tab: ["табл.", "табл."], sachet: ["саше", "саше"], chew: ["капсула", "капсули"] },

    rows: {
      syringes: "Шприців по 5 мл",
      whole: "Округлено до цілих",
      interval: "Наступна доза",
      maxDoses: "Прийомів на добу",
      maxDaily: "Максимум за добу",
      range: "Дозволений діапазон"
    },
    intervalText: { paracetamol: "не раніше ніж через 4 год", ibuprofen: "не раніше ніж через 6 год" },

    howTitle: "Як дати",
    how: [
      "Зважте дитину — доза рахується від ваги, не від віку.",
      "Відміряйте шприцом або мірною ложкою з упаковки, не столовою.",
      "Запишіть час, щоб не дати наступну дозу зарано."
    ],

    posterTitle: "Не рахуйте дозу — потрібен лікар",
    poster: [
      "Дитині менше 3 місяців і температура 38 °C і вище.",
      "Висип, який не бліднішає, якщо натиснути склянкою.",
      "Судоми, млява дитина, яку важко розбудити, безперервний плач.",
      "Утруднене дихання, зневоднення або температура понад 3 доби."
    ],

    ready: "можна давати",
    waiting: "зачекайте",
    now: "Зараз",
    lastAt: (t) => "Останній прийом о " + t,
    noneYet: "Ще не давали сьогодні",
    nextAt: (last, next) => "Останній прийом о " + last + " · Наступний прийом о " + next,
    crossAt: (other, t) => "3 год після того, як дали " + other + " — можна о " + t,
    perDay: (n, max, mg, maxMg) => "За добу: " + n + "/" + max + " · " + mg + " з " + maxMg + " мг",
    altTitle: "Про чергування",
    alt: [
      "Чергують тоді, коли один препарат не тримає температуру, і бажано за порадою лікаря. Двох одночасно не дають.",
      "Між різними препаратами — щонайменше 3 години. Між дозами того самого — повний інтервал."
    ],
    logTitle: "Журнал прийомів",
    undo: "Скасувати останній",
    logEmpty: "Поки що жодного запису. Запишіть прийом на вкладці «Доза».",

    srcCards: [
      { t: "Дозування", b: "Парацетамол 10–15 мг/кг на прийом, ібупрофен 5–10 мг/кг. Рахуємо за верхньою межею, округлюємо тільки вниз." },
      { t: "Інтервали", b: "Парацетамол не частіше ніж кожні 4–6 годин, до 4 разів на добу. Ібупрофен кожні 6–8 годин, до 3 разів." },
      { t: "Межі", b: "Парацетамол максимум 60 мг/кг і 4 г на добу. Ібупрофен 30 мг/кг і 1200 мг. Разова доза не більша за 1000 і 400 мг відповідно." },
      { t: "Джерела", b: "BNF for Children, NICE NG143, WHO Pocket Book, інструкції виробників з Держреєстру України та Rejestr Produktów Leczniczych." }
    ],
    forbiddenTitle: "Ці ліки дітям не дають",
    combinedTitle: "Комбіновані препарати калькулятор не рахує",
    combinedSub: "Під одним брендом продають кілька різних ліків. Рахуйте дозу лише для чистого парацетамолу чи ібупрофену.",
    thDrug: "Препарат", thRule: "Обмеження", thWhy: "Чому", thWhat: "Що всередині",
    disclaimer: "Це довідковий інструмент для батьків. Він не замінює огляд лікаря і не ставить діагноз. Остаточне рішення про ліки для вашої дитини ухвалює лікар. Усі дані лишаються у вашому браузері."
  },

  en: {
    wordmark: ["dose", "for kids"],
    dark: "Dark mode",
    kicker: "Single dose by weight",
    h1: "How much fever medicine to give your child",
    sub: "Paracetamol and ibuprofen. Calculated in your browser — nothing is sent anywhere.",
    tabs: { dose: "Dose", next: "What next", src: "Sources" },

    weightLabel: "Child's weight",
    required: "required",
    kg: "kg",
    ageLabel: "Age",
    years: "years",
    months: "months",
    ageNote: "Age doesn't change the dose — it's used to check the medicine's age limits.",
    drugLabel: "Medicine",
    paracetamol: "Paracetamol",
    ibuprofen: "Ibuprofen",
    formLabel: "Form",
    forms: { syrup: "Syrup", supp: "Suppository", tab: "Tablets", sachet: "Sachet", chew: "Chewable" },
    strengthLabel: {
      syrup: "Syrup strength — printed on the bottle",
      supp: "Suppository strength",
      tab: "Tablet strength",
      sachet: "Sachet strength",
      chew: "Capsule strength"
    },
    clear: "Clear all",
    attention: "Please note",

    resultKicker: "Single dose",
    emptyResult: "Enter the weight — we'll show the dose and when the next one is allowed.",
    blockedTitle: "No dose shown",
    blockedSub: "This medicine must not be given at this age or in this form.",
    logDose: "Log this dose",
    units: { ml: "ml", supp: ["suppository", "suppositories"], tab: ["tab.", "tab."], sachet: ["sachet", "sachets"], chew: ["capsule", "capsules"] },

    rows: {
      syringes: "5 ml syringes",
      whole: "Rounded to whole units",
      interval: "Next dose",
      maxDoses: "Doses per day",
      maxDaily: "Max per day",
      range: "Allowed range"
    },
    intervalText: { paracetamol: "no sooner than 4 h", ibuprofen: "no sooner than 6 h" },

    howTitle: "How to give it",
    how: [
      "Weigh the child — the dose follows weight, not age.",
      "Measure with the syringe or spoon from the box, not a kitchen spoon.",
      "Note the time so the next dose isn't given too early."
    ],

    posterTitle: "Don't calculate — call a doctor",
    poster: [
      "Under 3 months old with a temperature of 38 °C or above.",
      "A rash that doesn't fade when pressed with a glass.",
      "Seizures, a floppy child who is hard to wake, constant crying.",
      "Laboured breathing, dehydration, or fever lasting over 3 days."
    ],

    ready: "can be given",
    waiting: "please wait",
    now: "Now",
    lastAt: (t) => "Last dose at " + t,
    noneYet: "None given yet today",
    nextAt: (last, next) => "Last dose at " + last + " · Next dose at " + next,
    crossAt: (other, t) => "3 h after " + other + " — allowed at " + t,
    perDay: (n, max, mg, maxMg) => "Today: " + n + "/" + max + " · " + mg + " of " + maxMg + " mg",
    altTitle: "About alternating",
    alt: [
      "Alternate only when one medicine isn't controlling the fever, ideally on medical advice. Never give both at once.",
      "At least 3 hours between different medicines. A full interval between doses of the same one."
    ],
    logTitle: "Dose log",
    undo: "Undo last",
    logEmpty: "No entries yet. Log a dose on the \u201cDose\u201d tab.",

    srcCards: [
      { t: "Dosing", b: "Paracetamol 10–15 mg/kg per dose, ibuprofen 5–10 mg/kg. We calculate at the upper end and only ever round down." },
      { t: "Intervals", b: "Paracetamol no more often than every 4–6 hours, up to 4 times a day. Ibuprofen every 6–8 hours, up to 3 times." },
      { t: "Limits", b: "Paracetamol max 60 mg/kg and 4 g per day. Ibuprofen 30 mg/kg and 1200 mg. Single doses capped at 1000 and 400 mg." },
      { t: "Sources", b: "BNF for Children, NICE NG143, WHO Pocket Book, and manufacturer leaflets from the Ukrainian and Polish medicine registers." }
    ],
    forbiddenTitle: "Never give these to children",
    combinedTitle: "Combination medicines aren't calculated here",
    combinedSub: "One brand often covers several different medicines. Only calculate doses for plain paracetamol or ibuprofen.",
    thDrug: "Medicine", thRule: "Limit", thWhy: "Why", thWhat: "What's inside",
    disclaimer: "This is a reference tool for parents. It does not replace a medical examination and does not diagnose. Decisions about your child's medicine are made by a doctor. All data stays in your browser."
  }
};

/* Повідомлення калькулятора. Ключ — код із ядра. */
const NOTES = {
  age_under_3m: {
    uk: () => "<b>Дитині менше 3 місяців.</b> Гарячка в цьому віці — привід звернутися по медичну допомогу сьогодні, а не давати жарознижувальне вдома. Дозу для немовляти призначає лікар.",
    en: () => "<b>The child is under 3 months old.</b> Fever at this age needs medical attention today, not a home dose. A doctor prescribes for infants."
  },
  ibu_under_6m: {
    uk: () => "Європейські інструкції дозволяють ібупрофен з 3 місяців, американські (AAP, FDA) — лише з 6. Якщо симптоми тримаються довше <b>24 годин</b> або після трьох доз — до лікаря негайно.",
    en: () => "European leaflets allow ibuprofen from 3 months; AAP and FDA say 6. If symptoms last over <b>24 hours</b> or persist after three doses, see a doctor promptly."
  },
  ibu_weight_below_5: {
    uk: (v) => "Ібупрофен не застосовують при масі тіла менше " + v.kg + " кг.",
    en: (v) => "Ibuprofen is not used below " + v.kg + " kg of body weight."
  },
  ibu_supp_weight_below_6: {
    uk: (v) => "Супозиторії ібупрофену протипоказані при масі менше " + v.kg + " кг. Оберіть суспензію або парацетамол.",
    en: (v) => "Ibuprofen suppositories are contraindicated below " + v.kg + " kg. Use the suspension or paracetamol instead."
  },
  ibu_forte_age: {
    uk: () => "Українська інструкція на форму 200 мг/5 мл — від 6 місяців і 8 кг, польська на ту саму концентрацію — від 3 місяців. Якщо є звичайна суспензія 100 мг/5 мл, у цьому віці візьміть її.",
    en: () => "The Ukrainian leaflet puts 200 mg/5 ml at 6 months and 8 kg; the Polish one allows 3 months for the same strength. If you have the 100 mg/5 ml suspension, use that."
  },
  ibu_forte_weight: {
    uk: (v) => "Форма 200 мг/5 мл розрахована на масу від " + v.kg + " кг. Для меншої дитини точніше відміряти звичайну суспензію 100 мг/5 мл.",
    en: (v) => "The 200 mg/5 ml strength is intended from " + v.kg + " kg. Below that, the 100 mg/5 ml suspension measures more accurately."
  },
  par_weight_below_4: {
    uk: (v) => "Маса менше " + v.kg + " кг — дозу розраховує лікар, з поправкою на вік від зачаття.",
    en: (v) => "Below " + v.kg + " kg the dose is set by a doctor, adjusted for post-conceptual age."
  },
  tab_age: {
    uk: (v) => "Таблетку " + v.mg + " мг не дають дітям до " + v.years + " років: ризик поперхнутися, а поділена таблетка дозується неточно. Оберіть суспензію або свічки.",
    en: (v) => "A " + v.mg + " mg tablet is not given under " + v.years + ": choking risk, and a split tablet doses inaccurately. Use suspension or suppositories."
  },
  tab_age_unknown: {
    uk: () => "Вкажіть вік: тверді таблетки не дають дітям до 6 років, а номінали 200 і 400 мг мають власні вікові межі.",
    en: () => "Enter the age: tablets aren't given under 6, and the 200 and 400 mg strengths have their own limits."
  },
  tab_weight: {
    uk: (v) => "Таблетка " + v.mg + " мг розрахована на масу від " + v.kg + " кг.",
    en: (v) => "The " + v.mg + " mg tablet is intended from " + v.kg + " kg."
  },
  par_tab_500_age: {
    uk: () => "Польський Apap 500 мг — від 12 років, українська інструкція дозволяє з 6 років по половині таблетки. Якщо є сироп або свічки, вони точніші за поділену таблетку.",
    en: () => "Polish Apap 500 mg starts at 12; the Ukrainian leaflet allows half a tablet from 6. Syrup or suppositories dose more precisely than a split tablet."
  },
  sachet_age: {
    uk: (v) => "Саше " + v.mg + " мг за інструкцією призначене дітям від " + v.years + " років. Доза в ньому фіксована й не ділиться — для меншої дитини потрібна рідка форма або свічки.",
    en: (v) => "The " + v.mg + " mg sachet is licensed from " + v.years + " years. Its dose is fixed and can't be split — younger children need a liquid or suppository."
  },
  sachet_age_unknown: {
    uk: () => "Вкажіть вік: саше має фіксовану дозу й власну вікову межу (250 мг — від 4 років, 500 мг — від 11).",
    en: () => "Enter the age: sachets have a fixed dose and their own limits (250 mg from 4 years, 500 mg from 11)."
  },
  chew_age: {
    uk: (v) => "Жувальні капсули " + v.mg + " мг призначені дітям від " + v.years + " років. Молодшій дитині потрібна суспензія.",
    en: (v) => "Chewable " + v.mg + " mg capsules are licensed from " + v.years + " years. Younger children need the suspension."
  },
  chew_weight: {
    uk: (v) => "Жувальні капсули розраховані на масу від " + v.kg + " кг.",
    en: (v) => "Chewable capsules are intended from " + v.kg + " kg."
  },
  chew_weight_high: {
    uk: (v) => "Ця форма розрахована на масу до " + v.kg + " кг. Для більшої дитини діють дорослі дозування.",
    en: (v) => "This form is intended up to " + v.kg + " kg. Above that, adult dosing applies."
  },
  supp_nominal_low: {
    uk: (v) => "Свічка " + v.mg + " мг за інструкцією призначена для маси від " + v.kg + " кг. Для " + v.weight + " кг візьміть менший номінал.",
    en: (v) => "The " + v.mg + " mg suppository is intended from " + v.kg + " kg. At " + v.weight + " kg use a smaller one."
  },
  supp_nominal_high: {
    uk: (v) => "Свічка " + v.mg + " мг розрахована на масу до " + v.kg + " кг. Для більшої дитини зручніший інший номінал або рідка форма.",
    en: (v) => "The " + v.mg + " mg suppository is intended up to " + v.kg + " kg. A larger strength or a liquid suits a bigger child."
  },
  conc_school_age: {
    uk: () => "Концентрація 250 мг/5 мл — це форма для дітей від 6 років. Доза порахована правильно, але для меншої дитини точніше відміряти сироп 120 або 150 мг/5 мл.",
    en: () => "250 mg/5 ml is the school-age strength. The dose is right, but 120 or 150 mg/5 ml measures more precisely for a younger child."
  },
  age_unknown: {
    uk: () => "Вік не вказано, тому вікові обмеження не перевірені. Доза рахується тільки за вагою.",
    en: () => "No age given, so age limits weren't checked. The dose is based on weight alone."
  },
  supp_too_large: {
    uk: (v) => "Свічка " + v.mg + " мг завелика для ваги " + v.weight + " кг. Візьміть меншу — свічки не можна різати, діюча речовина в них розподілена нерівномірно.",
    en: (v) => "A " + v.mg + " mg suppository is too large for " + v.weight + " kg. Use a smaller one — suppositories must not be cut, the drug isn't evenly distributed."
  },
  supp_below_min: {
    uk: () => "Ця свічка дає менше за мінімальну ефективну дозу. Ефект може бути слабким — підберіть свічку більшого номіналу.",
    en: () => "This suppository gives less than the minimum effective dose. Consider a larger strength."
  },
  sachet_too_large: {
    uk: (v) => "Саше " + v.mg + " мг завелике для ваги " + v.weight + " кг. Гранули не діляться — потрібна рідка форма.",
    en: (v) => "A " + v.mg + " mg sachet is too large for " + v.weight + " kg. Granules can't be split — use a liquid."
  },
  sachet_below_min: {
    uk: () => "Це саше дає менше за мінімальну ефективну дозу для такої ваги.",
    en: () => "This sachet gives less than the minimum effective dose for this weight."
  },
  chew_too_large: {
    uk: (v) => "Навіть одна капсула " + v.mg + " мг перевищує дозу для цієї ваги.",
    en: (v) => "Even a single " + v.mg + " mg capsule exceeds the dose for this weight."
  },
  chew_below_min: {
    uk: () => "Стільки капсул дає менше за мінімальну ефективну дозу.",
    en: () => "This number of capsules is below the minimum effective dose."
  },
  tab_too_large: {
    uk: (v) => "Навіть половина таблетки " + v.mg + " мг перевищує дозу для цієї ваги. Потрібна рідка форма або свічки.",
    en: (v) => "Even half a " + v.mg + " mg tablet exceeds the dose for this weight. Use a liquid or suppositories."
  },
  volume_large: {
    uk: () => "Об'єм понад 20 мл — перевірте, чи правильно вказана концентрація на упаковці.",
    en: () => "Over 20 ml in one dose — double-check the strength printed on the box."
  },
  conc_drops: {
    uk: (v) => "<b>" + v.mgPerMl + " мг в одному мілілітрі — це краплі, а не сироп.</b> Концентрація вчетверо вища за звичайну суспензію. Ще раз звірте цифру на флаконі.",
    en: (v) => "<b>" + v.mgPerMl + " mg per millilitre means drops, not syrup.</b> That's four times the usual suspension. Check the bottle again."
  },
  conc_forte: {
    uk: () => "Це посилена форма («форте»). Вона вдвічі концентрованіша за звичайну — переконайтеся, що у вас у руках саме той флакон.",
    en: () => "This is the \u201cforte\u201d strength — twice as concentrated as the standard one. Make sure it's the bottle in your hand."
  },
  ibu_contraindications: {
    uk: () => "Ібупрофен не дають при зневодненні, багаторазовому блюванні чи проносі, вітряній віспі, хворобах нирок і при астмі з непереносимістю НПЗЗ. Давати після їжі.",
    en: () => "Avoid ibuprofen with dehydration, repeated vomiting or diarrhoea, chickenpox, kidney disease, or NSAID-sensitive asthma. Give it after food."
  },
  adult_ceiling: {
    uk: (v) => "За такої ваги діють дорослі стелі: разова доза не більша за " + v.single + " мг, добова — за " + v.daily + " мг.",
    en: (v) => "At this weight adult ceilings apply: no more than " + v.single + " mg per dose and " + v.daily + " mg per day."
  },
  duration_limit: {
    uk: () => "Без огляду лікаря жарознижувальне дають не довше <b>3 днів</b> поспіль. Для дитини 3–6 місяців межа інша: якщо температура тримається понад <b>24 години</b>, до лікаря треба звернутися одразу.",
    en: () => "Without a doctor's review, don't give fever medicine for more than <b>3 days</b> in a row. For a 3–6 month old the limit is <b>24 hours</b>."
  },
  hidden_paracetamol: {
    uk: () => "Перевірте, чи немає парацетамолу або ібупрофену в інших ліках, які дитина вже приймає — комбіновані порошки від застуди часто їх містять. Два жарознижувальні одночасно не дають.",
    en: () => "Check whether other medicines already contain paracetamol or ibuprofen — cold and flu sachets often do. Never give two fever medicines at once."
  }
};

function noteText(note, lang) {
  const entry = NOTES[note.code];
  if (!entry) return note.code;
  const fn = entry[lang] || entry.uk;
  return fn(note.vars || {});
}

return { UI: UI, NOTES: NOTES, noteText: noteText };
});

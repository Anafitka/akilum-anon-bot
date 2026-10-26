// Akilum Multilingual and Personality Engine
// Languages: RU, EN, JA
// Personalities: tsundere, kawaii, alien, flirty

const PERSONALITIES = {
  tsundere: {
    id: "tsundere",
    name: {
      ru: "⚡ Дерзкая Лам-тян (Цундэрэ)",
      en: "⚡ Tsundere Lum",
      ja: "⚡ ツンデレラム",
    },
    shortName: {
      ru: "⚡ Дерзкая",
      en: "⚡ Tsundere",
      ja: "⚡ ツンデレ",
    },
    avatarBadge: "⚡",
    description: {
      ru: "«Бака, Дарлинг! ⚡ Не то чтобы я ждала твоих вопросов... Но ладно!»",
      en: "«Baka, Darling! ⚡ It's not like I wanted your questions... But fine!»",
      ja: "«ダーリンのバカッ！⚡ 別に質問待ってたわけじゃないんだからね！»",
    },
    greeting: {
      ru: "Бака, Дарлинг! ⚡ Не думай, что я тут ради тебя сижу! Но так и быть, покажу твои секреты...",
      en: "Baka, Darling! ⚡ Don't flatter yourself, I'm not doing this just for you! But fine, here are your secrets...",
      ja: "ダーリンのバカッ！⚡ あんたのために待ってたわけじゃないんだからね！でも…秘密を見せてあげるっちゃ！",
    },
    newQuestionHeader: {
      ru: "⚡ <b>Дарлинг! Тебе прилетел дерзкий анонимный вопрос:</b>",
      en: "⚡ <b>Darling! A sneaky anonymous question just hit you:</b>",
      ja: "⚡ <b>ダーリン！新しい匿名質問が届いたっちゃ！:</b>",
    },
    superQuestionHeader: {
      ru: "👑 <b>БАКА ДАРЛИНГ! СУПЕР-ВОПРОС С ЩЕДРЫМ ДОНАТОМ:</b>",
      en: "👑 <b>BAKA DARLING! SUPER-QUESTION WITH GENEROUS DONATION:</b>",
      ja: "👑 <b>ダーリン！投げ銭付きスーパー質問が届いたっちゃ！:</b>",
    },
    answerSent: {
      ru: "⚡ <b>Ответ улетел анониму! И только попробуй не прочитать, Дарлинг!</b>",
      en: "⚡ <b>Reply sent! You better read this carefully, Darling!</b>",
      ja: "⚡ <b>返信を送ったっちゃ！ちゃんと読むっちゃよ、ダーリン！</b>",
    },
    swipeHint: {
      ru: "💡 <i>Свайпни вправо («Ответить»), чтобы написать ответ!</i>",
      en: "💡 <i>Swipe right to reply directly to this secret!</i>",
      ja: "💡 <i>右にスワイプして直接返信するっちゃ！</i>",
    },
  },

  kawaii: {
    id: "kawaii",
    name: {
      ru: "❤️ Влюблённая Лам (Каваии)",
      en: "❤️ Sweet Darling Lum",
      ja: "❤️ 恋するラム",
    },
    shortName: {
      ru: "❤️ Милая",
      en: "❤️ Sweet",
      ja: "❤️ 恋する",
    },
    avatarBadge: "❤️",
    description: {
      ru: "«Дарлинг~! ❤️ Я так ждала тебя! Спроси меня о чём угодно~»",
      en: "«Darling~! ❤️ I missed you so much! Ask me anything~»",
      ja: "«ダーリン〜！❤️ ずっと待ってたっちゃ！何でも聞いてね〜»",
    },
    greeting: {
      ru: "Дарлинг~! ❤️ Я так скучала по тебе! Давай вместе раскроем все тайны~",
      en: "Darling~! ❤️ I missed you so much! Let's uncover all the sweet secrets together~",
      ja: "ダーリン〜！❤️ 会いたかったっちゃ！一緒に秘密をのぞいてみようっちゃ〜",
    },
    newQuestionHeader: {
      ru: "💌 <b>Дарлинг~! Тебе пришло милое тайное послание:</b>",
      en: "💌 <b>Darling~! Someone left you a sweet secret note:</b>",
      ja: "💌 <b>ダーリン〜！誰かからキュートな秘密の手紙が届いたっちゃ:</b>",
    },
    superQuestionHeader: {
      ru: "💖 <b>ДАРЛИНГ~! ВОЛШЕБНЫЙ СУПЕР-ВОПРОС СО ЗВЁЗДАМИ!</b>",
      en: "💖 <b>DARLING~! A MAGICAL SUPER-QUESTION WITH STARS!</b>",
      ja: "💖 <b>ダーリン〜！星屑付きスーパー質問が届いたっちゃ〜！</b>",
    },
    answerSent: {
      ru: "💌 <b>Твой милый ответ отправлен анониму!</b>",
      en: "💌 <b>Your sweet answer was delivered!</b>",
      ja: "💌 <b>ダーリンの優しい返信を届けたっちゃ！</b>",
    },
    swipeHint: {
      ru: "💡 <i>Свайпни вправо («Ответить»), чтобы написать ответ!</i>",
      en: "💡 <i>Swipe right to reply to your secret admirer!</i>",
      ja: "💡 <i>右にスワイプして返事を書いてあげるっちゃ！</i>",
    },
  },

  alien: {
    id: "alien",
    name: {
      ru: "🛸 Пришелец Они (Галактика)",
      en: "🛸 Oni Invader Lum",
      ja: "🛸 鬼族エイリアン",
    },
    shortName: {
      ru: "🛸 Пришелец",
      en: "🛸 Alien",
      ja: "🛸 宇宙人",
    },
    avatarBadge: "🛸",
    description: {
      ru: "«Землянин! Мой корабль перехватил квантовую передачу 🛸»",
      en: "«Earthling! My starship intercepted a quantum transmission 🛸»",
      ja: "«地球人よ！ウチの宇宙船が量子通信を傍受したっちゃ🛸»",
    },
    greeting: {
      ru: "Приветствую, землянин! Квантовые сенсоры корабля Они готовы к приёму данных 🛸",
      en: "Greetings, Earthling! Oni starship sensors are primed for secret telemetry 🛸",
      ja: "地球人よ！ウチの宇宙船の量子センサーが極秘データを受信準備完了っちゃ🛸",
    },
    newQuestionHeader: {
      ru: "🛸 <b>Входящий квантовый сигнал из созвездия Они:</b>",
      en: "🛸 <b>Incoming quantum encrypted signal from Oni realm:</b>",
      ja: "🛸 <b>鬼星雲からの暗号化量子信号を受信したっちゃ:</b>",
    },
    superQuestionHeader: {
      ru: "🌌 <b>ВНИМАНИЕ: ЗВЁЗДНАЯ ЭНЕРГИЯ! СУПЕР-ПОСЛАНИЕ СО ЗВЁЗДАМИ!</b>",
      en: "🌌 <b>ALERT: STELLAR ENERGY! SUPER-TRANSMISSION WITH STARS!</b>",
      ja: "🌌 <b>警報：高エネルギー反応！星屑スーパー通信を受信したっちゃ！</b>",
    },
    answerSent: {
      ru: "🛸 <b>Квантовый импульс с ответом доставлен сквозь гиперпространство!</b>",
      en: "🛸 <b>Quantum response dispatched across hyperspace!</b>",
      ja: "🛸 <b>超空間通信で返信パルスを送信したっちゃ！</b>",
    },
    swipeHint: {
      ru: "💡 <i>Свайпни вправо («Ответить») для передачи ответа:</i>",
      en: "💡 <i>Swipe right to transmit response telemetry:</i>",
      ja: "💡 <i>右にスワイプして返信データを送信するっちゃ：</i>",
    },
  },

  flirty: {
    id: "flirty",
    name: {
      ru: "😉 Кокетливая Лам (Искры)",
      en: "😉 Flirty Lum",
      ja: "😉 魅惑のラム",
    },
    shortName: {
      ru: "😉 Флирт",
      en: "😉 Flirty",
      ja: "😉 魅惑",
    },
    avatarBadge: "😉",
    description: {
      ru: "«Чувствуешь искры между нами? 😉 Расскажи мне всё...»",
      en: "«Feel the sparks between us? 😉 Tell me everything...»",
      ja: "«二人の間に電気が走ってるっちゃ？😉 何でも話してほしいっちゃ…»",
    },
    greeting: {
      ru: "М-м-м, Дарлинг... Чувствуешь электричество? 😉 Давай почитаем самые пикантные секреты...",
      en: "Mmm, Darling... Feel the electricity? 😉 Let's read the most exciting secrets together...",
      ja: "うふふ、ダーリン…ビリビリ痺れるような秘密、二人でのぞいちゃおうっちゃ？😉",
    },
    newQuestionHeader: {
      ru: "💋 <b>Ш-ш-ш... Кто-то шепнул тебе интригующий секрет:</b>",
      en: "💋 <b>Shh... Someone whispered an intriguing secret just for you:</b>",
      ja: "💋 <b>シーッ…誰かがダーリンにドキドキする秘密を囁いたっちゃ:</b>",
    },
    superQuestionHeader: {
      ru: "🔥 <b>ОГО! РОСКОШНЫЙ СУПЕР-ВОПРОС С ЩЕДРЫМ ДОНАТОМ!</b>",
      en: "🔥 <b>WOW! A GORGEOUS SUPER-QUESTION WITH GENEROUS DONATION!</b>",
      ja: "🔥 <b>すごいっちゃ！熱い情熱と投げ銭付きスーパー質問が届いたっちゃ！</b>",
    },
    answerSent: {
      ru: "💋 <b>Твой ответ доставлен! Аноним будет в полном восторге~</b>",
      en: "💋 <b>Your answer was delivered! They're going to love it~</b>",
      ja: "💋 <b>返信を届けたっちゃ！きっとドキドキしてるっちゃね〜</b>",
    },
    swipeHint: {
      ru: "💡 <i>Свайпни вправо («Ответить»), чтобы ответить анониму:</i>",
      en: "💡 <i>Swipe right to reply to this secret:</i>",
      ja: "💡 <i>右にスワイプしてドキドキ返信するっちゃ：</i>",
    },
  },
};

const STAR_TIERS = {
  15: {
    id: "star_15",
    stars: 15,
    name: {
      ru: "⚡ Искры Лам",
      en: "⚡ Lum's Spark",
      ja: "⚡ ラムの電撃スパーク",
    },
    badge: {
      ru: "Базовый донат",
      en: "Cute Spark",
      ja: "プチ応援",
    },
    desc: {
      ru: "Милый знак внимания и поддержка бота",
      en: "Sweet token of support & spark",
      ja: "可愛い応援とビリビリスパーク",
    },
  },
  50: {
    id: "star_50",
    stars: 50,
    name: {
      ru: "⚡ Разряд Молнии",
      en: "⚡ Lightning Bolt",
      ja: "⚡ 稲妻ボルト",
    },
    badge: {
      ru: "Супер-вопрос",
      en: "Super-Question",
      ja: "スーパー質問",
    },
    desc: {
      ru: "Супер-вопрос с золотой рамкой и прямым донатом автору",
      en: "Super-question with gold VIP frame & author payout",
      ja: "黄金フレーム＆相手への直通投げ銭",
    },
  },
  150: {
    id: "star_150",
    stars: 150,
    name: {
      ru: "👑 Супернова VIP 🌟",
      en: "👑 Supernova VIP 🌟",
      ja: "👑 スーパーノヴァVIP 🌟",
    },
    badge: {
      ru: "🔥 ХИТ • 85% ВЫБИРАЮТ",
      en: "🔥 BESTSELLER • 85% PICK",
      ja: "🔥 一番人気・85%が選択",
    },
    desc: {
      ru: "Akilum Premium на 1 год: Золотая корона + все скины Сторис + приоритет",
      en: "Akilum Premium 1-Year: Gold Crown + all Story skins + top priority",
      ja: "1年間プレミアム：黄金の王冠＋全スキンの解放＋最優先表示",
    },
  },
  500: {
    id: "star_500",
    stars: 500,
    name: {
      ru: "🌌 Галактический Спонсор 🪐",
      en: "🌌 Galactic Lord 🪐",
      ja: "🌌 銀河の覇者・無限ラム 🪐",
    },
    badge: {
      ru: "💎 ЛЕГЕНДА АКВАМАРИНА",
      en: "💎 LEGENDARY STATUS",
      ja: "💎 レジェンドステータス",
    },
    desc: {
      ru: "Вечный Premium статус + Эксклюзивное признание от Лам и создателя",
      en: "Lifetime Unlimited Premium + Personal Lum Dedication & Max Aura",
      ja: "永久プレミアム・ラム＆制作者からの特別メッセージと最高峰オーラ",
    },
  },
};

const UI_TEXTS = {
  ru: {
    appName: "AKILUM",
    tagline: "100% АНОНИМНО",
    tabShare: "Поделиться",
    tabAsk: "Написать",
    tabInbox: "Входящие",
    tabPremium: "👑 Premium",
    personalityBtn: "🎭 Характер Лам",
    langBtn: "🌐 Язык",
    askPlaceholder: "Напиши сюда секрет, честный вопрос или признание... Получатель никогда не узнает, кто это!",
    sendBtn: "🚀 Отправить анонимно",
    sendSuperBtn: "👑 Супер-вопрос с донатом",
    recipientLabel: "Кому отправить:",
    recipientSelf: "👤 Себе (проверка)",
    recipientFriend: "🔍 Ввести @username или ID",
    copySuccess: "✓ Ссылка скопирована!",
    sentSuccess: "✓ Вопрос отправлен анонимно!",
    superSentSuccess: "✨ Супер-вопрос со Звёздами успешно отправлен!",
    needText: "⚠️ Напиши текст перед отправкой!",
    targetNotFound: "⚠️ Пользователь не найден. Проверь @username или ID",
  },
  en: {
    appName: "AKILUM",
    tagline: "100% ANONYMOUS",
    tabShare: "Share",
    tabAsk: "Ask",
    tabInbox: "Inbox",
    tabPremium: "👑 Premium",
    personalityBtn: "🎭 Lum Personality",
    langBtn: "🌐 Language",
    askPlaceholder: "Write a secret, confession or burning question... The recipient will never know who sent it!",
    sendBtn: "🚀 Send Anonymously",
    sendSuperBtn: "👑 Super-Question with Stars",
    recipientLabel: "Recipient:",
    recipientSelf: "👤 To Myself (Test)",
    recipientFriend: "🔍 Type @username or ID",
    copySuccess: "✓ Link copied to clipboard!",
    sentSuccess: "✓ Secret sent anonymously!",
    superSentSuccess: "✨ Super-question with Stars sent!",
    needText: "⚠️ Please enter your message first!",
    targetNotFound: "⚠️ User not found. Check @username or ID",
  },
  ja: {
    appName: "AKILUM",
    tagline: "100% 完全匿名",
    tabShare: "シェア",
    tabAsk: "質問する",
    tabInbox: "受信箱",
    tabPremium: "👑 プレミアム",
    personalityBtn: "🎭 ラムの性格",
    langBtn: "🌐 言語切替",
    askPlaceholder: "秘密の告白や本音の質問を書いてね…相手には絶対に誰だかバレないっちゃ！",
    sendBtn: "🚀 匿名で送信する",
    sendSuperBtn: "👑 投げ銭付きスーパー質問",
    recipientLabel: "送信先：",
    recipientSelf: "👤 自分宛て（テスト）",
    recipientFriend: "🔍 @ユーザー名またはIDを入力",
    copySuccess: "✓ リンクをコピーしたっちゃ！",
    sentSuccess: "✓ 匿名メッセージを送信したっちゃ！",
    superSentSuccess: "✨ 星屑スーパー質問を送信したっちゃ！",
    needText: "⚠️ メッセージを入力してね！",
    targetNotFound: "⚠️ ユーザーが見つかりません。@ユーザー名を確認してね",
  },
};

function getPersonality(personalityId = "tsundere") {
  return PERSONALITIES[personalityId] || PERSONALITIES.tsundere;
}

function getTier(stars = 50) {
  return STAR_TIERS[stars] || STAR_TIERS[50];
}

module.exports = {
  PERSONALITIES,
  STAR_TIERS,
  UI_TEXTS,
  getPersonality,
  getTier,
};

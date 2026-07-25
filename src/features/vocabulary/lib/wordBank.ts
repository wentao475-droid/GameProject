import type { WordEntry, WordPack } from "@/features/vocabulary/types/words";

export const DEFAULT_WORD_PACK_ID = "gaokao-advanced";

export const WORDS = [
  {
    id: "allocate",
    word: "allocate",
    meaning: "分配；拨出",
    partOfSpeech: "v.",
    example: "The committee will allocate more funding to rural libraries.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "derive",
    word: "derive",
    meaning: "得到；推导出；源于",
    partOfSpeech: "v.",
    example: "Many scientific terms derive from Latin and Greek roots.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "subtle",
    word: "subtle",
    meaning: "微妙的；不易察觉的",
    partOfSpeech: "adj.",
    example: "Readers should notice the subtle change in the narrator's tone.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "vigorous",
    word: "vigorous",
    meaning: "有力的；充满活力的",
    partOfSpeech: "adj.",
    example: "Regular exercise supports a vigorous and balanced lifestyle.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "consecutive",
    word: "consecutive",
    meaning: "连续的；连贯的",
    partOfSpeech: "adj.",
    example: "She won the speech contest for three consecutive years.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "inevitable",
    word: "inevitable",
    meaning: "不可避免的；必然发生的",
    partOfSpeech: "adj.",
    example: "Some mistakes are inevitable when people try new methods.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "induce",
    word: "induce",
    meaning: "导致；劝诱；引起",
    partOfSpeech: "v.",
    example: "Lack of sleep may induce poor concentration in class.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "reluctant",
    word: "reluctant",
    meaning: "不情愿的；勉强的",
    partOfSpeech: "adj.",
    example: "He was reluctant to speak before checking all the facts.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "coherent",
    word: "coherent",
    meaning: "连贯的；条理清晰的",
    partOfSpeech: "adj.",
    example: "A coherent argument often makes an essay more persuasive.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "integral",
    word: "integral",
    meaning: "必需的；构成整体所必需的",
    partOfSpeech: "adj.",
    example: "Reading widely is an integral part of language learning.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "scarce",
    word: "scarce",
    meaning: "稀缺的；不足的",
    partOfSpeech: "adj.",
    example: "Fresh water can become scarce during long dry seasons.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "authentic",
    word: "authentic",
    meaning: "真实的；可靠的；地道的",
    partOfSpeech: "adj.",
    example: "Authentic materials help learners understand natural English.",
    difficultyBand: "gaokao-plus",
    packId: "gaokao-advanced",
  },
  {
    id: "sustain",
    word: "sustain",
    meaning: "维持；支撑；遭受",
    partOfSpeech: "v.",
    example: "Healthy habits sustain both energy and confidence.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "undergo",
    word: "undergo",
    meaning: "经历；经受",
    partOfSpeech: "v.",
    example: "The old stadium will undergo a major safety inspection.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "emerge",
    word: "emerge",
    meaning: "出现；显现；浮现",
    partOfSpeech: "v.",
    example: "New problems may emerge when the market changes quickly.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "impose",
    word: "impose",
    meaning: "强加；施加；征收",
    partOfSpeech: "v.",
    example: "The school should not impose unnecessary pressure on beginners.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "foundation",
    word: "foundation",
    meaning: "基础；根基；基金会",
    partOfSpeech: "n.",
    example: "A solid vocabulary foundation improves reading speed.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "capacity",
    word: "capacity",
    meaning: "能力；容量；容纳量",
    partOfSpeech: "n.",
    example: "Practice expands your capacity to process long sentences.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "guarantee",
    word: "guarantee",
    meaning: "保证；担保",
    partOfSpeech: "v./n.",
    example: "No short course can guarantee instant fluency.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "conventional",
    word: "conventional",
    meaning: "传统的；惯常的",
    partOfSpeech: "adj.",
    example: "The article compares conventional farming with newer methods.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "initiative",
    word: "initiative",
    meaning: "主动性；倡议；新方案",
    partOfSpeech: "n.",
    example: "Students who show initiative often progress more steadily.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "acknowledge",
    word: "acknowledge",
    meaning: "承认；确认收到；致谢",
    partOfSpeech: "v.",
    example: "Good researchers acknowledge both evidence and limits.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "diminish",
    word: "diminish",
    meaning: "减少；削弱；贬低",
    partOfSpeech: "v.",
    example: "Regular review prevents newly learned words from diminishing.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
  {
    id: "register",
    word: "register",
    meaning: "登记；注册；表达；记录",
    partOfSpeech: "v.",
    example: "Please register your answer before the timer reaches zero.",
    difficultyBand: "cet4",
    packId: "cet4-bridge",
  },
] as const satisfies readonly WordEntry[];

function getWordIdsForPack(packId: string): string[] {
  return WORDS.filter((entry) => entry.packId === packId).map((entry) => entry.id);
}

export const WORD_PACKS = [
  {
    id: "gaokao-advanced",
    title: "高中进阶核心词",
    description: "覆盖高考阅读、概要写作和议论文中常见的进阶词汇。",
    difficultyLabel: "高考进阶",
    wordIds: getWordIdsForPack("gaokao-advanced"),
  },
  {
    id: "cet4-bridge",
    title: "四级衔接起步词",
    description: "从高中英语平滑过渡到 CET4 阅读与写作的核心表达。",
    difficultyLabel: "CET4 衔接",
    wordIds: getWordIdsForPack("cet4-bridge"),
  },
] as const satisfies readonly WordPack[];

export const WORDS_BY_ID = Object.fromEntries(
  WORDS.map((entry) => [entry.id, entry]),
) as Record<string, WordEntry>;

export const WORD_PACKS_BY_ID = Object.fromEntries(
  WORD_PACKS.map((pack) => [pack.id, pack]),
) as Record<string, WordPack>;

export function getWordEntry(wordId: string): WordEntry | undefined {
  return WORDS_BY_ID[wordId];
}

export function getWordPack(packId: string): WordPack {
  return WORD_PACKS_BY_ID[packId] ?? WORD_PACKS_BY_ID[DEFAULT_WORD_PACK_ID];
}

export function getWordsByPack(packId: string): WordEntry[] {
  return getWordPack(packId).wordIds
    .map((wordId) => WORDS_BY_ID[wordId])
    .filter((entry): entry is WordEntry => entry !== undefined);
}

import type { WordEntry, WordPack } from "@/features/vocabulary/types/words";

export const DEFAULT_WORD_PACK_ID = "hanzi-starter";

export const WORDS = [
  {
    id: "ma",
    word: "妈",
    meaning: "妈妈的妈，表示家里照顾你的人。",
    pronunciation: "ma",
    example: "例词：妈妈",
    parts: ["女", "马"],
    familyHint: "女字旁的字，常和人物身份有关。",
    packId: "hanzi-starter",
  },
  {
    id: "hao",
    word: "好",
    meaning: "表示美好、喜欢、不错。",
    pronunciation: "hao",
    example: "例词：好看",
    parts: ["女", "子"],
    familyHint: "可以认识“女”和“子”组合成新字。",
    packId: "hanzi-starter",
  },
  {
    id: "ming",
    word: "明",
    meaning: "亮亮的，也可以表示明白。",
    pronunciation: "ming",
    example: "例词：明亮",
    parts: ["日", "月"],
    familyHint: "日和月经常帮助孩子理解“亮”。",
    packId: "hanzi-starter",
  },
  {
    id: "xiu",
    word: "休",
    meaning: "表示休息、停下来。",
    pronunciation: "xiu",
    example: "例词：休息",
    parts: ["亻", "木"],
    familyHint: "单人旁常和人有关。",
    packId: "hanzi-starter",
  },
  {
    id: "he",
    word: "河",
    meaning: "有水流动的大路。",
    pronunciation: "he",
    example: "例词：小河",
    parts: ["氵", "可"],
    familyHint: "三点水的字常和水有关。",
    packId: "hanzi-starter",
  },
  {
    id: "pai",
    word: "拍",
    meaning: "用手去打一下、拍一下。",
    pronunciation: "pai",
    example: "例词：拍手",
    parts: ["扌", "白"],
    familyHint: "提手旁的字常和手的动作有关。",
    packId: "hanzi-starter",
  },
  {
    id: "wen",
    word: "问",
    meaning: "开口向别人请教。",
    pronunciation: "wen",
    example: "例词：问好",
    parts: ["门", "口"],
    familyHint: "口字旁常和说话、嘴巴有关。",
    packId: "hanzi-starter",
  },
  {
    id: "miao",
    word: "苗",
    meaning: "刚长出来的小小植物。",
    pronunciation: "miao",
    example: "例词：树苗",
    parts: ["艹", "田"],
    familyHint: "草字头常和植物有关。",
    packId: "hanzi-starter",
  },
  {
    id: "deng",
    word: "灯",
    meaning: "会发亮，能把房间照亮。",
    pronunciation: "deng",
    example: "例词：电灯",
    parts: ["火", "丁"],
    familyHint: "火字旁常和火光、热有关。",
    packId: "hanzi-starter",
  },
  {
    id: "bao",
    word: "抱",
    meaning: "伸出手把东西圈住。",
    pronunciation: "bao",
    example: "例词：抱抱",
    parts: ["扌", "包"],
    familyHint: "提手旁提示这是手的动作。",
    packId: "hanzi-starter",
  },
  {
    id: "qing",
    word: "清",
    meaning: "干净，也可以表示水很透亮。",
    pronunciation: "qing",
    example: "例词：清水",
    parts: ["氵", "青"],
    familyHint: "三点水会提醒孩子它和水有关。",
    packId: "hanzi-starter",
  },
  {
    id: "chui",
    word: "吹",
    meaning: "把气从嘴里送出去。",
    pronunciation: "chui",
    example: "例词：吹气",
    parts: ["口", "欠"],
    familyHint: "口字旁会提醒孩子这个字和嘴巴动作有关。",
    packId: "hanzi-starter",
  },
] as const satisfies readonly WordEntry[];

function getWordIdsForPack(packId: string): string[] {
  return WORDS.filter((entry) => entry.packId === packId).map((entry) => entry.id);
}

export const WORD_PACKS = [
  {
    id: "hanzi-starter",
    title: "偏旁启蒙字包",
    description: "围绕高频偏旁和生活常见字，让孩子在消除中认识汉字结构。",
    ageLabel: "4-8 岁识字启蒙",
    wordIds: getWordIdsForPack("hanzi-starter"),
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

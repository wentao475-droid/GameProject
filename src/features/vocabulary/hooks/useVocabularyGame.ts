"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { resolveTurn } from "@/features/star-pop/lib/resolveTurn";
import type { Block, Board, Position, TurnResult } from "@/features/star-pop/types/game";
import {
  createVocabularyBoard,
  VOCABULARY_BOARD_COLS,
  VOCABULARY_BOARD_ROWS,
} from "@/features/vocabulary/lib/createVocabularyBoard";
import {
  getCurrentTargetBonus,
  getCurrentTargetWordId,
  getFormedWords,
  getFormedTargetWordIds,
} from "@/features/vocabulary/lib/vocabularyGame";
import type { WordEntry } from "@/features/vocabulary/types/words";

export type VocabularyGameConfig = {
  sessionId: number;
  targetWords: WordEntry[];
  boardWords: WordEntry[];
};

export type VocabularyGameCompletion = {
  sessionId: number;
  score: number;
  removedBlockCount: number;
  formedCountsByWordId: Record<string, number>;
};

type TurnFeedback = {
  kind: "invalid" | "valid";
  label: string;
  scoreDelta: number;
  id: number;
  anchor: {
    row: number;
    col: number;
  };
};

type FocusedWordCard = {
  wordId: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  familyHint: string;
  isCurrentTarget: boolean;
};

function createEmptyBoard(): Board {
  return Array.from({ length: VOCABULARY_BOARD_ROWS }, () =>
    Array.from({ length: VOCABULARY_BOARD_COLS }, () => null),
  );
}

function getRemainingBlockCount(board: Board) {
  return board.flat().filter(Boolean).length;
}

function getGroupAnchor(group: Position[]) {
  if (group.length === 0) {
    return {
      row: VOCABULARY_BOARD_ROWS / 2 - 0.5,
      col: VOCABULARY_BOARD_COLS / 2 - 0.5,
    };
  }

  const total = group.reduce(
    (accumulator, position) => ({
      row: accumulator.row + position.row,
      col: accumulator.col + position.col,
    }),
    { row: 0, col: 0 },
  );

  return {
    row: total.row / group.length,
    col: total.col / group.length,
  };
}

const ANIMATION_DURATION_MS = 280;
const INVALID_FEEDBACK_DURATION_MS = 380;

export function useVocabularyGame() {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [status, setStatus] = useState<"ready" | "animating" | "game-over">("ready");
  const [selectedGroup, setSelectedGroup] = useState<Position[]>([]);
  const [invalidCellId, setInvalidCellId] = useState<string | null>(null);
  const [turnFeedback, setTurnFeedback] = useState<TurnFeedback | null>(null);
  const [score, setScore] = useState(0);
  const [removedBlockCount, setRemovedBlockCount] = useState(0);
  const [formedCountsByWordId, setFormedCountsByWordId] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [targetWords, setTargetWords] = useState<WordEntry[]>([]);
  const [boardWords, setBoardWords] = useState<WordEntry[]>([]);
  const [completion, setCompletion] = useState<VocabularyGameCompletion | null>(null);
  const [focusedWordCard, setFocusedWordCard] = useState<FocusedWordCard | null>(null);
  const [recentFormedWordCards, setRecentFormedWordCards] = useState<FocusedWordCard[]>([]);

  const remainingBlocks = useMemo(() => getRemainingBlockCount(board), [board]);
  const currentTargetWordId = useMemo(
    () => getCurrentTargetWordId(targetWords, formedCountsByWordId),
    [formedCountsByWordId, targetWords],
  );

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
  }, [status]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setStatus("ready");
    setSelectedGroup([]);
    setInvalidCellId(null);
    setTurnFeedback(null);
    setScore(0);
    setRemovedBlockCount(0);
    setFormedCountsByWordId({});
    setSessionId(null);
    setTargetWords([]);
    setBoardWords([]);
    setCompletion(null);
    setFocusedWordCard(null);
    setRecentFormedWordCards([]);
  }, []);

  const startGame = useCallback((config: VocabularyGameConfig) => {
    setBoard(
      createVocabularyBoard({
        targetWords: config.targetWords,
        fillerWords: config.boardWords,
      }),
    );
    setStatus("ready");
    setSelectedGroup([]);
    setInvalidCellId(null);
    setTurnFeedback(null);
    setScore(0);
    setRemovedBlockCount(0);
    setFormedCountsByWordId({});
    setSessionId(config.sessionId);
    setTargetWords(config.targetWords);
    setBoardWords(config.boardWords);
    setCompletion(null);
    setFocusedWordCard(null);
    setRecentFormedWordCards([]);
  }, []);

  const clearCompletion = useCallback(() => {
    setCompletion(null);
  }, []);

  const clearPreview = useCallback(() => {
    if (status !== "ready") {
      return;
    }

    setSelectedGroup([]);
    setFocusedWordCard(null);
  }, [status]);

  const buildFocusedCard = useCallback(
    (block: Block | null) => {
      if (
        !block?.wordId ||
        !block.fullLabel ||
        !block.meaning ||
        !block.pronunciation ||
        !block.example ||
        !block.familyHint
      ) {
        return null;
      }

      return {
        wordId: block.wordId,
        word: block.fullLabel,
        meaning: block.meaning,
        pronunciation: block.pronunciation,
        example: block.example,
        familyHint: block.familyHint,
        isCurrentTarget: currentTargetWordId === block.wordId,
      };
    },
    [currentTargetWordId],
  );

  const handleBlockHover = useCallback(
    (position: Position) => {
      if (status !== "ready") {
        return;
      }

      const hoveredBlock = board[position.row]?.[position.col];
      if (!hoveredBlock) {
        setSelectedGroup([]);
        setFocusedWordCard(null);
        return;
      }

      const group = findConnectedGroup(board, position);
      setSelectedGroup(group.length >= 2 ? group : []);
      setFocusedWordCard(buildFocusedCard(hoveredBlock));
    },
    [board, buildFocusedCard, status],
  );

  const handleBlockClick = useCallback(
    (position: Position) => {
      if (status !== "ready") {
        return;
      }

      const clickedBlock = board[position.row]?.[position.col];
      if (!clickedBlock) {
        return;
      }

      const result = resolveTurn(board, position);

      if (result.kind === "invalid") {
        setSelectedGroup(result.group);
        setFocusedWordCard(buildFocusedCard(clickedBlock));
        setInvalidCellId(clickedBlock.id);
        setTurnFeedback({
          kind: "invalid",
          label: "至少连接 2 块",
          scoreDelta: 0,
          id: Date.now(),
          anchor: {
            row: position.row,
            col: position.col,
          },
        });
        window.setTimeout(() => {
          setInvalidCellId((current) => (current === clickedBlock.id ? null : current));
          setTurnFeedback((current) => (current?.kind === "invalid" ? null : current));
        }, INVALID_FEEDBACK_DURATION_MS);
        return;
      }

      const removedBlocks = result.removedGroup
        .map((cell) => board[cell.row]?.[cell.col] ?? null)
        .filter((block): block is Block => block !== null);
      const formedTargetWordIds = getFormedTargetWordIds(
        removedBlocks.map((block) => block.label ?? "").filter(Boolean),
        targetWords,
      );
      const formedWords = getFormedWords(
        removedBlocks.map((block) => block.label ?? "").filter(Boolean),
        boardWords,
      );
      const nextFormedCountsByWordId = { ...formedCountsByWordId };

      formedTargetWordIds.forEach((wordId) => {
        nextFormedCountsByWordId[wordId] = 1;
      });

      const currentTargetBonus = getCurrentTargetBonus(currentTargetWordId, nextFormedCountsByWordId);
      const formedBonus = formedTargetWordIds.length * 120;
      const nextScore = score + result.scoreDelta + currentTargetBonus + formedBonus;
      const nextRemovedBlockCount = removedBlockCount + result.removedGroup.length;

      setStatus(result.isGameOver ? "game-over" : "animating");
      setSelectedGroup(result.removedGroup);
      setBoard(result.board);
      setScore(nextScore);
      setRemovedBlockCount(nextRemovedBlockCount);
      setFormedCountsByWordId(nextFormedCountsByWordId);
      setFocusedWordCard(buildFocusedCard(clickedBlock));
      setRecentFormedWordCards(
        formedWords.map((word) => ({
          wordId: word.id,
          word: word.word,
          meaning: word.meaning,
          pronunciation: word.pronunciation,
          example: word.example,
          familyHint: word.familyHint,
          isCurrentTarget: targetWords.some((targetWord) => targetWord.id === word.id),
        })),
      );
      setTurnFeedback({
        kind: "valid",
        label:
          formedWords.length > 0
            ? `拼出 ${formedWords.map((word) => word.word).join("、")}`
            : `消除 ${result.removedGroup.length} 块`,
        scoreDelta: result.scoreDelta + currentTargetBonus + formedBonus,
        id: Date.now(),
        anchor: getGroupAnchor(result.removedGroup),
      });

      window.setTimeout(() => {
        setSelectedGroup([]);
        setStatus(result.isGameOver ? "game-over" : "ready");
        setTurnFeedback(null);
        if (result.isGameOver && sessionId !== null) {
          setCompletion({
            sessionId,
            score: nextScore,
            removedBlockCount: nextRemovedBlockCount,
            formedCountsByWordId: nextFormedCountsByWordId,
          });
        }
      }, ANIMATION_DURATION_MS);
    },
    [
      board,
      buildFocusedCard,
      currentTargetWordId,
      boardWords,
      formedCountsByWordId,
      removedBlockCount,
      score,
      sessionId,
      status,
      targetWords,
    ],
  );

  return {
    board,
    status,
    score,
    remainingBlocks,
    removedBlockCount,
    formedCountsByWordId,
    currentTargetWordId,
    selectedGroup,
    invalidCellId,
    turnFeedback,
    completion,
    focusedWordCard,
    recentFormedWordCards,
    isAnimating: status === "animating",
    previewCount: selectedGroup.length,
    startGame,
    resetGame,
    clearCompletion,
    handleBlockHover,
    handleBlockClick,
    clearPreview,
  };
}

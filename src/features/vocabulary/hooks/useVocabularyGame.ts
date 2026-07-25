"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { getRemainingBlockCount } from "@/features/star-pop/lib/getRemainingBlockCount";
import { markRemovingGroup } from "@/features/star-pop/lib/markRemovingGroup";
import { resetBoardAnimations } from "@/features/star-pop/lib/boardUtils";
import { resolveTurn } from "@/features/star-pop/lib/resolveTurn";
import type { Board, GameStatus, Position } from "@/features/star-pop/types/game";
import { createVocabularyBoard } from "@/features/vocabulary/lib/createVocabularyBoard";
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
  collectedCountsByWordId: Record<string, number>;
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

function createEmptyBoard(): Board {
  return Array.from({ length: GAME_CONFIG.rows }, () =>
    Array.from({ length: GAME_CONFIG.cols }, () => null),
  );
}

function getGroupAnchor(group: Position[]) {
  if (group.length === 0) {
    return { row: 4.5, col: 4.5 };
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

export function useVocabularyGame(options?: {
  animationEnabled?: boolean;
  vibrationEnabled?: boolean;
}) {
  const animationEnabled = options?.animationEnabled ?? true;
  const vibrationEnabled = options?.vibrationEnabled ?? true;
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [status, setStatus] = useState<GameStatus>("ready");
  const [selectedGroup, setSelectedGroup] = useState<Position[]>([]);
  const [invalidCellId, setInvalidCellId] = useState<string | null>(null);
  const [turnFeedback, setTurnFeedback] = useState<TurnFeedback | null>(null);
  const [score, setScore] = useState(0);
  const [removedBlockCount, setRemovedBlockCount] = useState(0);
  const [collectedCountsByWordId, setCollectedCountsByWordId] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [targetWordIds, setTargetWordIds] = useState<string[]>([]);
  const [completion, setCompletion] = useState<VocabularyGameCompletion | null>(null);
  const timersRef = useRef<number[]>([]);
  const feedbackIdRef = useRef(0);

  const remainingBlocks = useMemo(() => getRemainingBlockCount(board), [board]);
  const targetWordIdSet = useMemo(() => new Set(targetWordIds), [targetWordIds]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const schedule = useCallback((callback: () => void, timeout: number) => {
    const timer = window.setTimeout(callback, timeout);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const vibrate = useCallback(
    (duration: number) => {
      if (!vibrationEnabled || typeof navigator === "undefined" || !navigator.vibrate) {
        return;
      }

      navigator.vibrate(duration);
    },
    [vibrationEnabled],
  );

  const resetGame = useCallback(() => {
    clearTimers();
    setBoard(createEmptyBoard());
    setStatus("ready");
    setSelectedGroup([]);
    setInvalidCellId(null);
    setTurnFeedback(null);
    setScore(0);
    setRemovedBlockCount(0);
    setCollectedCountsByWordId({});
    setSessionId(null);
    setTargetWordIds([]);
    setCompletion(null);
  }, [clearTimers]);

  const startGame = useCallback(
    (config: VocabularyGameConfig) => {
      clearTimers();
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
      setCollectedCountsByWordId({});
      setSessionId(config.sessionId);
      setTargetWordIds(config.targetWords.map((word) => word.id));
      setCompletion(null);
    },
    [clearTimers],
  );

  const clearCompletion = useCallback(() => {
    setCompletion(null);
  }, []);

  const clearPreview = useCallback(() => {
    if (status !== "ready") {
      return;
    }

    setSelectedGroup([]);
  }, [status]);

  const handleBlockHover = useCallback(
    (position: Position) => {
      if (status !== "ready") {
        return;
      }

      const hoveredBlock = board[position.row]?.[position.col];
      if (!hoveredBlock) {
        setSelectedGroup([]);
        return;
      }

      setSelectedGroup(findConnectedGroup(board, position));
    },
    [board, status],
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
        clearTimers();
        setSelectedGroup(result.group);
        setInvalidCellId(clickedBlock.id);
        feedbackIdRef.current += 1;
        const feedbackId = feedbackIdRef.current;
        setTurnFeedback({
          kind: "invalid",
          label: "至少连接 2 块",
          scoreDelta: 0,
          id: feedbackId,
          anchor: {
            row: position.row,
            col: position.col,
          },
        });
        vibrate(10);
        schedule(() => {
          setInvalidCellId((current) => (current === clickedBlock.id ? null : current));
          setSelectedGroup((current) =>
            current.length === 1 &&
            current[0]?.row === position.row &&
            current[0]?.col === position.col
              ? []
              : current,
          );
        }, animationEnabled ? GAME_CONFIG.invalidPulseMs : 0);
        schedule(() => {
          setTurnFeedback((current) => (current?.id === feedbackId ? null : current));
        }, GAME_CONFIG.turnFeedbackMs);
        return;
      }

      clearTimers();
      setStatus("animating");
      vibrate(18);

      const collectedDeltaByWordId = result.removedGroup.reduce<Record<string, number>>((accumulator, cell) => {
        const wordId = board[cell.row]?.[cell.col]?.wordId;

        if (!wordId || !targetWordIdSet.has(wordId)) {
          return accumulator;
        }

        return {
          ...accumulator,
          [wordId]: (accumulator[wordId] ?? 0) + 1,
        };
      }, {});
      const nextCollectedCounts = { ...collectedCountsByWordId };

      Object.entries(collectedDeltaByWordId).forEach(([wordId, collectedCount]) => {
        nextCollectedCounts[wordId] = (nextCollectedCounts[wordId] ?? 0) + collectedCount;
      });

      const nextScore = score + result.scoreDelta;
      const nextRemovedBlockCount = removedBlockCount + result.removedGroup.length;

      feedbackIdRef.current += 1;
      const feedbackId = feedbackIdRef.current;
      setTurnFeedback({
        kind: "valid",
        label: `${result.removedGroup.length} 连消`,
        scoreDelta: result.scoreDelta,
        id: feedbackId,
        anchor: getGroupAnchor(result.removedGroup),
      });
      setSelectedGroup(result.removedGroup);
      setBoard(animationEnabled ? markRemovingGroup(board, result.removedGroup) : result.board);

      schedule(() => {
        setTurnFeedback((current) => (current?.id === feedbackId ? null : current));
      }, GAME_CONFIG.turnFeedbackMs);

      schedule(() => {
        setBoard(result.board);
        setScore(nextScore);
        setRemovedBlockCount(nextRemovedBlockCount);
        setCollectedCountsByWordId(nextCollectedCounts);
        setSelectedGroup([]);

        schedule(() => {
          const settledBoard = resetBoardAnimations(result.board);
          setBoard(settledBoard);

          if (!result.isGameOver) {
            setStatus("ready");
            return;
          }

          setStatus("game-over");
          if (sessionId !== null) {
            setCompletion({
              sessionId,
              score: nextScore,
              removedBlockCount: nextRemovedBlockCount,
              collectedCountsByWordId: nextCollectedCounts,
            });
          }
        }, animationEnabled ? GAME_CONFIG.settleAnimationMs : 0);
      }, animationEnabled ? GAME_CONFIG.removeAnimationMs : 0);
    },
    [
      animationEnabled,
      board,
      clearTimers,
      collectedCountsByWordId,
      removedBlockCount,
      schedule,
      score,
      sessionId,
      status,
      targetWordIdSet,
      vibrate,
    ],
  );

  return {
    board,
    status,
    score,
    remainingBlocks,
    removedBlockCount,
    collectedCountsByWordId,
    selectedGroup,
    invalidCellId,
    turnFeedback,
    completion,
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

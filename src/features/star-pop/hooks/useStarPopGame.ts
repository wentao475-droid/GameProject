"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAME_CONFIG } from "@/features/star-pop/config/gameConfig";
import { createBoard } from "@/features/star-pop/lib/createBoard";
import { createSeededRandom } from "@/features/star-pop/lib/dailyChallenge";
import { findConnectedGroup } from "@/features/star-pop/lib/findConnectedGroup";
import { getGameMode } from "@/features/star-pop/lib/gameModes";
import { getRemainingBlockCount } from "@/features/star-pop/lib/getRemainingBlockCount";
import { markRemovingGroup } from "@/features/star-pop/lib/markRemovingGroup";
import { resetBoardAnimations } from "@/features/star-pop/lib/boardUtils";
import { resolveTurn } from "@/features/star-pop/lib/resolveTurn";
import type { Board, GameStatus, Position } from "@/features/star-pop/types/game";
import type { GameSessionConfig } from "@/features/star-pop/types/modes";

type UseStarPopGameOptions = {
  animationEnabled?: boolean;
  vibrationEnabled?: boolean;
  onInvalidMove?: () => void;
  onValidMove?: (groupSize: number) => void;
  onAutoClear?: () => void;
};

const DEFAULT_SESSION_CONFIG: GameSessionConfig = {
  modeId: "classic",
  boardSeed: null,
  dailyChallenge: null,
};

function createSessionBoard(sessionConfig: GameSessionConfig) {
  if (sessionConfig.boardSeed === null) {
    return createBoard();
  }

  return createBoard(createSeededRandom(sessionConfig.boardSeed));
}

function createEmptyBoard(): Board {
  return Array.from({ length: GAME_CONFIG.rows }, () =>
    Array.from({ length: GAME_CONFIG.cols }, () => null),
  );
}

function getOccupiedPositions(board: Board): Position[] {
  return board.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) => (cell ? [{ row: rowIndex, col: colIndex }] : [])),
  );
}

type TurnFeedback = {
  kind: "invalid" | "valid" | "auto-clear";
  label: string;
  scoreDelta: number;
  id: number;
  anchor: {
    row: number;
    col: number;
  };
};

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

export function useStarPopGame(options: UseStarPopGameOptions = {}) {
  const animationEnabled = options.animationEnabled ?? true;
  const vibrationEnabled = options.vibrationEnabled ?? true;
  const onInvalidMove = options.onInvalidMove;
  const onValidMove = options.onValidMove;
  const onAutoClear = options.onAutoClear;
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [sessionConfig, setSessionConfig] = useState<GameSessionConfig>(
    DEFAULT_SESSION_CONFIG,
  );
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [selectedGroup, setSelectedGroup] = useState<Position[]>([]);
  const [lastMoveSize, setLastMoveSize] = useState(0);
  const [invalidCellId, setInvalidCellId] = useState<string | null>(null);
  const [isAutoClearing, setIsAutoClearing] = useState(false);
  const [autoClearedBlocks, setAutoClearedBlocks] = useState(0);
  const [finalRemainingBlocks, setFinalRemainingBlocks] = useState(0);
  const [movesUsed, setMovesUsed] = useState(0);
  const [movesLeft, setMovesLeft] = useState<number | null>(
    getGameMode(DEFAULT_SESSION_CONFIG.modeId).moveLimit,
  );
  const [turnFeedback, setTurnFeedback] = useState<TurnFeedback | null>(null);
  const timersRef = useRef<number[]>([]);
  const feedbackIdRef = useRef(0);
  const currentMode = useMemo(
    () => getGameMode(sessionConfig.modeId),
    [sessionConfig.modeId],
  );

  const remainingBlocks = useMemo(
    () => getRemainingBlockCount(board),
    [board],
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    setBoard(createSessionBoard(DEFAULT_SESSION_CONFIG));
  }, []);

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

  const restartGame = useCallback((nextSessionConfig?: Partial<GameSessionConfig>) => {
    clearTimers();
    const resolvedSessionConfig: GameSessionConfig = {
      ...sessionConfig,
      ...nextSessionConfig,
      dailyChallenge:
        nextSessionConfig && "dailyChallenge" in nextSessionConfig
          ? nextSessionConfig.dailyChallenge ?? null
          : sessionConfig.dailyChallenge,
      boardSeed:
        nextSessionConfig && "boardSeed" in nextSessionConfig
          ? nextSessionConfig.boardSeed ?? null
          : sessionConfig.boardSeed,
    };
    const mode = getGameMode(resolvedSessionConfig.modeId);
    setSessionConfig(resolvedSessionConfig);
    setBoard(createSessionBoard(resolvedSessionConfig));
    setScore(0);
    setStatus("ready");
    setSelectedGroup([]);
    setLastMoveSize(0);
    setInvalidCellId(null);
    setIsAutoClearing(false);
    setAutoClearedBlocks(0);
    setFinalRemainingBlocks(0);
    setMovesUsed(0);
    setMovesLeft(mode.moveLimit);
    setTurnFeedback(null);
  }, [clearTimers, sessionConfig]);

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
        setLastMoveSize(result.group.length);
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
        onInvalidMove?.();
        schedule(
          () => {
            setInvalidCellId((current) =>
              current === clickedBlock.id ? null : current,
            );
            setSelectedGroup((current) =>
              current.length === 1 &&
              current[0]?.row === position.row &&
              current[0]?.col === position.col
                ? []
                : current,
            );
          },
          animationEnabled ? GAME_CONFIG.invalidPulseMs : 0,
        );
        schedule(
          () => {
            setTurnFeedback((current) =>
              current?.id === feedbackId ? null : current,
            );
          },
          GAME_CONFIG.turnFeedbackMs,
        );
        return;
      }

      clearTimers();
      setStatus("animating");
      vibrate(18);
      onValidMove?.(result.removedGroup.length);
      setIsAutoClearing(false);
      setAutoClearedBlocks(0);
      setFinalRemainingBlocks(0);
      const nextMovesUsed = movesUsed + 1;
      const nextMovesLeft =
        currentMode.moveLimit === null ? null : Math.max(currentMode.moveLimit - nextMovesUsed, 0);
      setMovesUsed(nextMovesUsed);
      setMovesLeft(nextMovesLeft);
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
      setLastMoveSize(result.removedGroup.length);
      setBoard(
        animationEnabled ? markRemovingGroup(board, result.removedGroup) : result.board,
      );
      schedule(
        () => {
          setTurnFeedback((current) =>
            current?.id === feedbackId ? null : current,
          );
        },
        GAME_CONFIG.turnFeedbackMs,
      );

      schedule(() => {
        setBoard(result.board);
        setScore((currentScore) => currentScore + result.scoreDelta);
        setSelectedGroup([]);

        schedule(() => {
          const settledBoard = resetBoardAnimations(result.board);
          setBoard(settledBoard);

          const reachedMoveLimit = nextMovesLeft !== null && nextMovesLeft === 0;

          if (!result.isGameOver && !reachedMoveLimit) {
            setStatus("ready");
            return;
          }

          if (result.remainingBlocks === 0) {
            setFinalRemainingBlocks(0);
            setStatus("game-over");
            return;
          }

          const remainingGroup = getOccupiedPositions(settledBoard);
          setIsAutoClearing(true);
          setAutoClearedBlocks(remainingGroup.length);
          setFinalRemainingBlocks(remainingGroup.length);
          feedbackIdRef.current += 1;
          setTurnFeedback({
            kind: "auto-clear",
            label: "残局清盘",
            scoreDelta: 0,
            id: feedbackIdRef.current,
            anchor: getGroupAnchor(remainingGroup),
          });
          onAutoClear?.();
          setSelectedGroup(remainingGroup);
          setBoard(
            animationEnabled
              ? markRemovingGroup(settledBoard, remainingGroup)
              : createEmptyBoard(),
          );

          schedule(() => {
            setBoard(createEmptyBoard());
            setSelectedGroup([]);
            setIsAutoClearing(false);
            setStatus("game-over");
          }, animationEnabled ? GAME_CONFIG.finalClearAnimationMs : 0);
        }, animationEnabled ? GAME_CONFIG.settleAnimationMs : 0);
      }, animationEnabled ? GAME_CONFIG.removeAnimationMs : 0);
    },
    [
      animationEnabled,
      board,
      clearTimers,
      currentMode.moveLimit,
      movesUsed,
      onAutoClear,
      onInvalidMove,
      onValidMove,
      schedule,
      status,
      vibrate,
    ],
  );

  return {
    board,
    modeId: sessionConfig.modeId,
    dailyChallenge: sessionConfig.dailyChallenge,
    movesUsed,
    movesLeft,
    score,
    status,
    remainingBlocks,
    finalRemainingBlocks,
    selectedGroup,
    lastMoveSize,
    invalidCellId,
    isAutoClearing,
    autoClearedBlocks,
    turnFeedback,
    isAnimating: status === "animating",
    previewCount: selectedGroup.length,
    handleBlockHover,
    handleBlockClick,
    clearPreview,
    restartGame,
  };
}

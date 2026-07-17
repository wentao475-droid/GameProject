export type BlockColor = "coral" | "sky" | "mint" | "sun" | "violet";

export type BlockState = "idle" | "removing" | "falling";

export type Block = {
  id: string;
  row: number;
  col: number;
  color: BlockColor;
  state: BlockState;
  dropDistance: number;
  shiftDistance: number;
};

export type BoardCell = Block | null;
export type Board = BoardCell[][];

export type Position = {
  row: number;
  col: number;
};

export type GameStatus = "ready" | "animating" | "game-over";

export type TurnResult =
  | {
      kind: "invalid";
      group: Position[];
      clicked: Position;
    }
  | {
      kind: "removed";
      board: Board;
      removedGroup: Position[];
      scoreDelta: number;
      remainingBlocks: number;
      hasAvailableMove: boolean;
      isGameOver: boolean;
    };

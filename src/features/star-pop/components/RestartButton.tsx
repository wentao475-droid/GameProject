type RestartButtonProps = {
  onRestart: () => void;
  label?: string;
};

export function RestartButton({
  onRestart,
  label = "重新开始",
}: RestartButtonProps) {
  return (
    <button type="button" onClick={onRestart}>
      {label}
    </button>
  );
}

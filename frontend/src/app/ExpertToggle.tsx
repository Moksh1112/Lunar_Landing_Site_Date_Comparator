import { useStore } from "../store";

export function ExpertToggle() {
  const expert = useStore((s) => s.expert);
  const setExpert = useStore((s) => s.setExpert);
  return (
    <div className="segmented" role="group" aria-label="Detail level">
      <button type="button" aria-pressed={!expert} onClick={() => setExpert(false)}>
        Simple
      </button>
      <button type="button" aria-pressed={expert} onClick={() => setExpert(true)}>
        Expert
      </button>
    </div>
  );
}

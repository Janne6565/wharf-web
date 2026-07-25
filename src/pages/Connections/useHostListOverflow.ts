import { useLayoutEffect, useRef, useState } from "react";

// Watches the capped host list for actual overflow, so the hint under the card
// can say "scroll for more" only when there really is more. Measured from the
// DOM rather than guessed from a row count, because row height varies with tags
// and wrapped targets.
export function useHostListOverflow(rowCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  // rowCount is a deliberate trigger, not a value the effect reads: the list
  // must be re-measured whenever its contents change (filtering, unlocking).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure trigger
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      setOverflowing(false);
      return;
    }
    // A 1px tolerance keeps sub-pixel rounding from claiming a scrollbar that
    // is not there.
    const measure = () => setOverflowing(node.scrollHeight > node.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [rowCount]);

  return { listRef: ref, listOverflowing: overflowing };
}

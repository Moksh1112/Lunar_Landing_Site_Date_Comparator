/**
 * Synchronous single-flight gate. React state such as `mutation.isPending` is stale between two clicks
 * delivered in the same frame, so it cannot stop a double submission on its own.
 */
export function createSingleFlight() {
  let busy = false;
  return {
    /** True if the caller may start; false while a previous run has not finished. */
    start: (): boolean => {
      if (busy) return false;
      busy = true;
      return true;
    },
    end: (): void => {
      busy = false;
    },
    get busy() {
      return busy;
    },
  };
}

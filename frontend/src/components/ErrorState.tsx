import type { ApiError } from "../api/errors";
import styles from "./states.module.css";

type Props = { error: ApiError; onRetry?: () => void };

export function ErrorState({ error, onRetry }: Props) {
  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>{error.message}</p>
      <p className={styles.code}>
        Error code: <code>{error.code}</code>
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

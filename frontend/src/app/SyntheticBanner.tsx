import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { USE_MOCK, getHealth } from "../api/client";
import styles from "./AppShell.module.css";

export const HEALTH_QUERY_KEY = ["health"] as const;

// Local until hooks.ts (S1.3) provides the shared useHealth.
export function useHealthQuery() {
  return useQuery({ queryKey: HEALTH_QUERY_KEY, queryFn: getHealth });
}

const VARIANTS = ["ok", "empty", "error"] as const;

function VariantSelector() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const raw = params.get("mock") ?? "ok";
  const custom = !VARIANTS.includes(raw as (typeof VARIANTS)[number]);
  return (
    <label className={`${styles.variant} no-print`}>
      Mock variant{" "}
      <select
        value={custom ? "custom" : raw}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "ok") next.delete("mock");
          else next.set("mock", e.target.value);
          setParams(next);
          void queryClient.invalidateQueries();
        }}
      >
        {VARIANTS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
        {custom && <option value="custom">custom ({raw})</option>}
      </select>
    </label>
  );
}

export function SyntheticBanner() {
  const health = useHealthQuery();
  const backendMock = health.data?.mock === true;
  if (!USE_MOCK && !backendMock) return null;
  return (
    <div className={styles.banner} role="status">
      <strong>SYNTHETIC DATA</strong>
      <span>
        {USE_MOCK
          ? " - mock transport, fixtures only, not a real result"
          : " - backend is serving mock data, not a real result"}
      </span>
      {USE_MOCK && <VariantSelector />}
    </div>
  );
}

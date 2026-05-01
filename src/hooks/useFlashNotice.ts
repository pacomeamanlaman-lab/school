"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FlashVariant = "success" | "error" | "info";

export type FlashPayload = { message: string; variant: FlashVariant } | null;

/**
 * Notification inline (style identique à la page Établissement) avec disparition auto.
 */
export function useFlashNotice(defaultDurationMs = 5000) {
  const [notice, setNotice] = useState<FlashPayload>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback(
    (message: string, variant: FlashVariant = "success", durationMs = defaultDurationMs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setNotice({ message, variant });
      timerRef.current = setTimeout(() => setNotice(null), durationMs);
    },
    [defaultDurationMs]
  );

  const clearNotice = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotice(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { notice, flash, clearNotice };
}

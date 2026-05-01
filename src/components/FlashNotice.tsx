"use client";

import type { FlashPayload } from "@/hooks/useFlashNotice";

const variantClass: Record<NonNullable<FlashPayload>["variant"], string> = {
  success: "border-success/30 bg-success/5 text-success",
  error: "border-danger/30 bg-danger/5 text-danger",
  info: "border-info/30 bg-info/5 text-info",
};

export default function FlashNotice({ payload }: { payload: FlashPayload }) {
  if (!payload) return null;
  return (
    <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${variantClass[payload.variant]}`}>
      {payload.message}
    </div>
  );
}

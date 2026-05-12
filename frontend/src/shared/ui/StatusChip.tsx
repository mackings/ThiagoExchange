"use client";

import Chip from "@mui/material/Chip";
import type { Trade } from "@/shared/api";

export function StatusChip({ status }: { status: Trade["status"] }) {
  const color =
    status === "paid" ? "success" : status === "confirmed" ? "info" : status === "cancelled" ? "default" : "warning";

  return <Chip size="small" color={color} label={status.toUpperCase()} sx={{ fontWeight: 900, alignSelf: "flex-start" }} />;
}

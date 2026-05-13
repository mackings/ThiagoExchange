"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { TradeChat } from "@/features/trades/TradeChat";
import type { Session } from "@/features/auth/AuthDialog";
import type { Trade } from "@/shared/api";
import { api } from "@/shared/api";
import { readSession } from "@/shared/session";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function TradingGroundPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    if (saved?.token && params.id) loadTrade(saved.token);
  }, [params.id]);

  async function loadTrade(token = session?.token) {
    if (!token || !params.id) return;
    try {
      const payload = await api<Trade>(`/trades/${params.id}`, {}, token);
      setTrade(payload);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <PageFrame title="Trading ground">
      <Stack spacing={1.5}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session && <Alert severity="info">Sign in from home to open the trading ground.</Alert>}
        {session && !trade && !error && <Alert severity="info">Loading trade...</Alert>}
        {trade && (
          <TradeChat
            trade={trade}
            token={session?.token}
            onTrade={setTrade}
            onRefresh={() => loadTrade()}
            onError={setError}
          />
        )}
      </Stack>
    </PageFrame>
  );
}

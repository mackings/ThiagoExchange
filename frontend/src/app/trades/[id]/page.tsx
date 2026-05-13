"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    if (saved?.token && params.id) {
      loadTrade(saved.token);
    } else {
      setLoading(false);
    }
  }, [params.id]);

  async function loadTrade(token = session?.token) {
    if (!token || !params.id) return;
    setLoading(true);
    try {
      const payload = await api<Trade>(`/trades/${params.id}`, {}, token);
      setTrade(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame title="Trading ground">
      <Stack spacing={1.5}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session && <Alert severity="info">Sign in from home to open the trading ground.</Alert>}
        {session && loading && !trade && <TradingGroundSkeleton />}
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

function TradingGroundSkeleton() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={132} sx={{ borderRadius: { xs: 4, md: 5 } }} />
      <Skeleton variant="rounded" height={54} sx={{ borderRadius: 4 }} />
      <Box sx={{ minHeight: { xs: "50vh", md: "56vh" } }}>
        <Stack spacing={1.2}>
          <Skeleton variant="rounded" width="68%" height={72} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rounded" width="76%" height={88} sx={{ borderRadius: 4, alignSelf: "flex-end" }} />
          <Skeleton variant="rounded" width="58%" height={72} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rounded" width="72%" height={80} sx={{ borderRadius: 4, alignSelf: "flex-end" }} />
        </Stack>
      </Box>
      <Skeleton variant="rounded" height={72} sx={{ borderRadius: 5 }} />
    </Stack>
  );
}

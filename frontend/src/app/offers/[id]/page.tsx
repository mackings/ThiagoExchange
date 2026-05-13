"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { TradeView } from "@/features/trades/TradeView";
import type { Session } from "@/features/auth/AuthDialog";
import type { Rate, Trade } from "@/shared/api";
import { api } from "@/shared/api";
import { readSession } from "@/shared/session";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function OfferDetailsPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState("");
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    loadRates();
    if (saved?.token) loadTrades(saved.token);
  }, []);

  async function loadRates() {
    setLoadingRates(true);
    try {
      const payload = await api<Rate[]>("/rates");
      setRates(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRates(false);
    }
  }

  async function loadTrades(token: string) {
    try {
      const payload = await api<Trade[]>("/trades", {}, token);
      setTrades(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const selectedRate = rates.find((rate) => rate.id === params.id) || null;

  return (
    <PageFrame title="Offer details">
      <Stack spacing={1.5}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {loadingRates && <OfferSkeleton />}
        {!loadingRates && !selectedRate && !error && <Alert severity="info">This offer is no longer available.</Alert>}
        {selectedRate && (
          <TradeView
            rates={rates}
            trades={trades}
            token={session?.token}
            selectedRate={selectedRate}
            onSelectedRate={() => undefined}
            onBackToOffers={() => {
              window.location.href = "/";
            }}
            onRequireAuth={() => {
              window.location.href = "/";
            }}
            onCreated={(trade) => {
              window.location.href = `/trades/${trade.id}`;
            }}
            onError={setError}
          />
        )}
      </Stack>
    </PageFrame>
  );
}

function OfferSkeleton() {
  return (
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" width={140} height={38} sx={{ borderRadius: 999 }} />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={5}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={36} width={160} sx={{ borderRadius: 999 }} />
            <Skeleton variant="text" height={58} width="70%" />
            <Skeleton variant="rounded" height={128} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" height={38} width="85%" sx={{ borderRadius: 999 }} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={7}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={58} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={86} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" height={48} sx={{ borderRadius: 999 }} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

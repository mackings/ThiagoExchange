"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Alert from "@mui/material/Alert";
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

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    loadRates();
    if (saved?.token) loadTrades(saved.token);
  }, []);

  async function loadRates() {
    try {
      const payload = await api<Rate[]>("/rates");
      setRates(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
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
        {!selectedRate && !error && <Alert severity="info">Loading offer...</Alert>}
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

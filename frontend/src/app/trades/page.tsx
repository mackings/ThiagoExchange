"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Session } from "@/features/auth/AuthDialog";
import type { Trade } from "@/shared/api";
import { api, money, usd } from "@/shared/api";
import { readSession } from "@/shared/session";
import { StatusChip } from "@/shared/ui/StatusChip";
import { PageFrame } from "@/shared/ui/PageFrame";

export default function ActiveTradesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    if (saved?.token) loadTrades(saved.token);
  }, []);

  async function loadTrades(token: string) {
    try {
      const payload = await api<Trade[]>("/trades", {}, token);
      setTrades(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const activeTrades = trades.filter((trade) => trade.status === "pending" || trade.status === "confirmed");

  return (
    <PageFrame title="Active trades">
      <Stack spacing={1.5}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session && <Alert severity="info">Sign in from home to view active trades.</Alert>}
        {session && !activeTrades.length && <Alert severity="info">No active trades right now.</Alert>}
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {activeTrades.map((trade) => (
            <Grid item xs={12} md={6} key={trade.id}>
              <Card variant="outlined" sx={{ borderRadius: { xs: 4, md: 5 }, borderColor: "rgba(87,87,246,0.14)" }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                  <Stack spacing={1.4}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                      <Box>
                        <Typography sx={{ fontWeight: 1000, fontSize: { xs: 20, md: 26 }, letterSpacing: "-0.035em" }}>
                          {trade.coin} {usd(trade.amountUsd)}
                        </Typography>
                        <Typography color="text.secondary">{trade.network}</Typography>
                      </Box>
                      <StatusChip status={trade.status} />
                    </Stack>
                    <Box sx={{ p: 1.4, borderRadius: 3, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.10)" }}>
                      <Typography variant="caption" sx={{ color: "#66708a", fontWeight: 900 }}>EXPECTED PAYOUT</Typography>
                      <Typography sx={{ fontWeight: 1000 }}>{money(trade.expectedNgn)}</Typography>
                    </Box>
                    <Button variant="contained" href={`/trades/${trade.id}`} sx={{ bgcolor: "#5757f6" }}>
                      Open Trading Ground
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </PageFrame>
  );
}

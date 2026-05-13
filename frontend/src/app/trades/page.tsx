"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Session } from "@/features/auth/AuthDialog";
import type { Trade } from "@/shared/api";
import { api, money, usd } from "@/shared/api";
import { readSession } from "@/shared/session";
import { StatusChip } from "@/shared/ui/StatusChip";
import { PageFrame } from "@/shared/ui/PageFrame";
import { TradeTimer } from "@/shared/ui/TradeTimer";

export default function ActiveTradesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = readSession();
    setSession(saved);
    if (saved?.token) {
      loadTrades(saved.token);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadTrades(token: string) {
    setLoading(true);
    try {
      const payload = await api<Trade[]>("/trades", {}, token);
      setTrades(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const activeTrades = trades.filter((trade) => trade.status === "pending" || trade.status === "confirmed");

  return (
    <PageFrame title="Active trades">
      <Stack spacing={1.5}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {!session && <Alert severity="info">Sign in from home to view active trades.</Alert>}
        {loading && <ActiveTradesSkeleton />}
        {session && !loading && !activeTrades.length && <Alert severity="info">No active trades right now.</Alert>}
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {activeTrades.map((trade) => (
            <Grid item xs={12} md={6} key={trade.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: { xs: 3, md: 4 },
                  borderColor: "rgba(8,19,59,0.10)",
                  bgcolor: "#fff",
                  boxShadow: "0 16px 42px rgba(8,19,59,0.08)"
                }}
              >
                <Box sx={{ height: 5, bgcolor: trade.status === "pending" ? "#d49416" : "#0f7a62" }} />
                <CardContent sx={{ p: { xs: 1.6, md: 2.5 } }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                      <Box>
                        <Typography sx={{ fontWeight: 1000, fontSize: { xs: 20, md: 26 }, letterSpacing: "-0.035em" }}>
                          {trade.coin} {usd(trade.amountUsd)}
                        </Typography>
                        <Typography color="text.secondary">{trade.network} secured desk trade</Typography>
                      </Box>
                      <StatusChip status={trade.status} />
                    </Stack>
                    <Grid container spacing={1}>
                      {[
                        ["Payout", money(trade.expectedNgn)],
                        ["Rate", `${money(trade.rateNgn)} / $1`],
                        ["Proof", trade.transactionHash ? "Submitted" : "Waiting"],
                        ["Chat", `${trade.messages?.length || 0} messages`]
                      ].map(([label, value]) => (
                        <Grid item xs={6} key={label}>
                          <Box sx={{ p: 1.25, minHeight: 70, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid rgba(8,19,59,0.08)" }}>
                            <Typography variant="caption" sx={{ color: "#66708a", fontWeight: 900 }}>{label}</Typography>
                            <Typography sx={{ fontWeight: 1000, fontSize: { xs: 13.5, md: 15 }, wordBreak: "break-word" }}>{value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    {trade.status === "pending" ? <TradeTimer trade={trade} onExpired={() => session?.token && loadTrades(session.token)} /> : <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 999 }} />}
                    <Button variant="contained" href={`/trades/${trade.id}`} sx={{ bgcolor: "#08133b", borderRadius: 999, "&:hover": { bgcolor: "#050b24" } }}>
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

function ActiveTradesSkeleton() {
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {[0, 1, 2, 3].map((item) => (
        <Grid item xs={12} md={6} key={item}>
          <Card variant="outlined" sx={{ borderRadius: { xs: 4, md: 5 }, borderColor: "rgba(87,87,246,0.10)" }}>
            <CardContent sx={{ p: { xs: 1.6, md: 2.5 } }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Skeleton variant="text" width={170} height={34} />
                    <Skeleton variant="text" width={140} />
                  </Box>
                  <Skeleton variant="rounded" width={86} height={28} sx={{ borderRadius: 999 }} />
                </Stack>
                <Grid container spacing={1}>
                  {[0, 1, 2, 3].map((box) => (
                    <Grid item xs={6} key={box}>
                      <Skeleton variant="rounded" height={68} sx={{ borderRadius: 3 }} />
                    </Grid>
                  ))}
                </Grid>
                <Skeleton variant="rounded" height={42} sx={{ borderRadius: 999 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

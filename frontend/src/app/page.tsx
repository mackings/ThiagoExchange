"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PaidIcon from "@mui/icons-material/Paid";
import SecurityIcon from "@mui/icons-material/Security";
import TimerIcon from "@mui/icons-material/Timer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WalletIcon from "@mui/icons-material/Wallet";
import { AuthDialog, AuthMode, Session } from "@/features/auth/AuthDialog";
import { RateNotifier } from "@/features/notifications/RateNotifier";
import { HistoryView } from "@/features/trades/HistoryView";
import { TradeChat } from "@/features/trades/TradeChat";
import { TradeView } from "@/features/trades/TradeView";
import { API_HEALTH_URL, Rate, Trade, api, money, usd } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { TradeTimer } from "@/shared/ui/TradeTimer";

const sessionKey = "thiago.session";
const keepAliveIntervalMs = 14 * 60 * 1000;

export default function Home() {
  return <ExchangeApp />;
}

function ExchangeApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = session?.token;
  const user = session?.user;
  const safeRates = Array.isArray(rates) ? rates : [];
  const safeTrades = Array.isArray(trades) ? trades : [];
  const activeTrade = useMemo(() => safeTrades.find((trade) => trade.status === "pending") || null, [safeTrades]);

  
  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      setSession(JSON.parse(saved));
    } else {
      setAuthOpen(true);
    }
    loadRates();
  }, []);

  useEffect(() => {
    if (token) loadTrades(token);
  }, [token]);

  useEffect(() => {
    async function keepAlive() {
      try {
        await Promise.allSettled([
          fetch(API_HEALTH_URL, { cache: "no-store" }),
          fetch("/", { cache: "no-store" })
        ]);
        console.log("[keepalive] frontend and API pinged");
      } catch (err) {
        console.log("[keepalive] ping failed", err);
      }
    }

    const id = window.setInterval(keepAlive, keepAliveIntervalMs);
    return () => window.clearInterval(id);
  }, []);

  async function loadRates() {
    try {
      const payload = await api<Rate[]>("/rates");
      setRates(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function loadTrades(authToken = token) {
    if (!authToken) return;
    try {
      const payload = await api<Trade[]>("/trades", {}, authToken);
      setTrades(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function saveSession(next: Session) {
    localStorage.setItem(sessionKey, JSON.stringify(next));
    setSession(next);
    setAuthOpen(false);
  }

  function logout() {
    localStorage.removeItem(sessionKey);
    setSession(null);
    setTrades([]);
    setAuthMode("login");
    setAuthOpen(true);
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "transparent", px: { xs: 0.75, md: 2 }, py: { xs: 0.75, md: 2 } }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "transparent", color: "text.primary", boxShadow: "none" }}>
        <Toolbar
          sx={{
            gap: { xs: 1, md: 2 },
            mx: { xs: 0, md: 2 },
            mt: { xs: 0, md: 1 },
            px: { xs: 1.4, md: 3 },
            py: { xs: 0.8, md: 1.6 },
            minHeight: { xs: 64, md: 92 },
            borderRadius: { xs: 3.5, md: 999 },
            bgcolor: "rgba(255,255,255,0.84)",
            border: "1px solid rgba(87,87,246,0.14)",
            boxShadow: "0 14px 38px rgba(8,19,59,0.08)"
          }}
        >
          <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={150} height={40} priority />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, p: 0.5, borderRadius: 999, bgcolor: "#f3f4ff" }}>
            {["Trade", "History"].map((item, index) => (
              <Button
                key={item}
                onClick={() => setActiveTab(index)}
                sx={{
                  px: 2.3,
                  color: activeTab === index ? "#08133b" : "#60708c",
                  bgcolor: activeTab === index ? "#fff" : "transparent",
                  boxShadow: activeTab === index ? "0 8px 20px rgba(8,19,59,0.06)" : "none",
                  "&:hover": { bgcolor: "#fff" }
                }}
              >
                {item}
              </Button>
            ))}
          </Stack>
          {user ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontWeight: 900 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
              <Tooltip title="Sign out">
                <IconButton onClick={logout} color="primary" aria-label="sign out"><LogoutIcon /></IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Button startIcon={<LoginIcon />} variant="contained" onClick={() => setAuthOpen(true)}>Sign in</Button>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          color: "#08133b",
          pt: { xs: 2.4, md: 7 },
          pb: { xs: 3, md: 8 },
          position: "relative",
          overflow: "hidden",
          background: "transparent"
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 2.4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={{ xs: 1.6, md: 2.4 }}>
                <Chip size="small" sx={{ alignSelf: "flex-start", bgcolor: "rgba(87,87,246,0.10)", color: "#2331a6", fontWeight: 900, letterSpacing: { xs: 1.4, md: 3 } }} icon={<SecurityIcon />} label="VERIFIED P2P CRYPTO DESK" />
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 1000,
                    maxWidth: 820,
                    fontSize: { xs: 29, sm: 46, md: 78 },
                    lineHeight: { xs: 1, md: 0.94 },
                    letterSpacing: { xs: "-0.035em", md: "-0.055em" },
                    background: "linear-gradient(115deg, #2764ff 0%, #6657f6 45%, #d84bbf 92%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Sell coins when the payout feels right.
                </Typography>
                <Typography sx={{ color: "#53627c", maxWidth: 690, fontSize: { xs: 13.5, md: 18 }, lineHeight: { xs: 1.5, md: 1.65 } }}>
                  Choose a live desk offer, accept the terms, release coin, upload proof, and chat with Thiago Desk until payment is complete.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button size="large" variant="contained" startIcon={<PaidIcon />} onClick={() => (user ? setActiveTab(0) : setAuthOpen(true))} sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 1.15, md: 1.4 }, bgcolor: "#5757f6", boxShadow: "0 10px 24px rgba(87,87,246,0.22)" }}>Open live offer</Button>
                  <Button size="large" variant="outlined" startIcon={<TrendingUpIcon />} sx={{ px: { xs: 2.5, md: 3.5 }, py: { xs: 1.15, md: 1.4 }, color: "#08133b", borderColor: "rgba(87,87,246,0.22)", bgcolor: "rgba(255,255,255,0.55)" }} onClick={() => setActiveTab(0)}>Browse rates</Button>
                </Stack>
                <RateNotifier rates={safeRates} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ bgcolor: "#fff", color: "text.primary", border: "1px solid rgba(87,87,246,0.14)", borderRadius: { xs: 4, md: 6 }, boxShadow: "0 18px 48px rgba(8,19,59,0.09)" }}>
                <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                  <Stack spacing={{ xs: 1.7, md: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip size="small" label="LIVE TRADE STATUS" sx={{ letterSpacing: 2.2, fontWeight: 1000, color: "#2331a6", bgcolor: "#f0efff" }} />
                      <TimerIcon sx={{ color: "#5757f6" }} />
                    </Stack>
                    {activeTrade ? (
                      <>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-0.04em", fontSize: { xs: 24, md: 34 } }}>
                              {activeTrade.coin} {usd(activeTrade.amountUsd)}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                              Expected payout {money(activeTrade.expectedNgn)}
                            </Typography>
                          </Box>
                          <StatusChip status={activeTrade.status} />
                        </Stack>
                        <TradeTimer trade={activeTrade} onExpired={() => loadTrades()} />
                        <Grid container spacing={1.2}>
                          {[
                            ["Network", activeTrade.network],
                            ["Rate", `${money(activeTrade.rateNgn)} / $1`],
                            ["Proof", activeTrade.transactionHash ? "Submitted" : "Pending"],
                            ["Chat", `${activeTrade.messages?.length || 0} messages`]
                          ].map(([label, value]) => (
                            <Grid item xs={6} key={label}>
                              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.10)" }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
                                <Typography sx={{ fontWeight: 1000, wordBreak: "break-word" }}>{value}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        <Button variant="contained" onClick={() => setActiveTab(0)} sx={{ bgcolor: "#5757f6" }}>
                          Continue Chat
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-0.04em", fontSize: { xs: 26, md: 34 } }}>No open trade</Typography>
                        <Typography color="text.secondary">Choose an offer to start a 30-minute secured chat.</Typography>
                        <Button variant="outlined" onClick={() => setActiveTab(0)} sx={{ alignSelf: "flex-start" }}>
                          Choose Offer
                        </Button>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: { xs: 0, md: -2 }, pb: { xs: 3, md: 6 } }}>
        <Paper sx={{ borderRadius: { xs: 4, md: 6 }, overflow: "hidden", bgcolor: "#fff", border: "1px solid rgba(87,87,246,0.14)", boxShadow: "0 16px 46px rgba(8,19,59,0.08)" }}>
          <Box sx={{ px: { xs: 0.8, md: 2 }, pt: { xs: 0.8, md: 1.5 }, borderBottom: "1px solid rgba(87,87,246,0.12)" }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 52, md: 68 },
              "& .MuiTabs-flexContainer": { gap: { xs: 0.6, md: 1 } },
              "& .MuiTabs-indicator": {
                display: "none"
              },
              "& .MuiTabs-indicatorSpan": {
                width: "70%",
                bgcolor: "#08133b"
              },
              "& .MuiTab-root": {
                minHeight: { xs: 46, md: 58 },
                px: { xs: 1.4, md: 3 },
                borderRadius: 999,
                fontWeight: 900,
                fontSize: { xs: 13, sm: 16 },
                color: "#66708a",
                border: "1px solid transparent",
                transition: "background-color .18s ease, color .18s ease, border-color .18s ease"
              },
              "& .Mui-selected": {
                color: "#08133b",
                bgcolor: "#f0efff",
                borderColor: "rgba(87,87,246,0.12)"
              }
            }}
          >
            <Tab
              icon={<WalletIcon />}
              iconPosition="start"
              label="Active Trade"
            />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
          </Tabs>
          </Box>

          <Box sx={{ p: { xs: 1.25, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
            {activeTab === 0 && activeTrade && token ? (
              <TradeChat
                trade={activeTrade}
                token={token}
                onTrade={(updated) => setTrades((items) => (Array.isArray(items) ? items : []).map((item) => item.id === updated.id ? updated : item))}
                onRefresh={() => loadTrades()}
                onError={setError}
              />
            ) : activeTab === 0 && (
              <TradeView rates={safeRates} trades={safeTrades} token={token} onRequireAuth={() => setAuthOpen(true)} onCreated={(trade) => { setTrades((items) => [trade, ...(Array.isArray(items) ? items : [])]); setSuccess("Trade opened. Chat thread started."); setActiveTab(0); window.setTimeout(() => loadTrades(), 250); }} onError={setError} />
            )}
            {activeTab === 1 && <HistoryView trades={safeTrades} token={token} onRefresh={() => loadTrades()} onError={setError} />}
          </Box>
        </Paper>
      </Container>

      <AuthDialog open={authOpen} mode={authMode} onMode={setAuthMode} onClose={() => user && setAuthOpen(false)} onSession={saveSession} onError={setError} />
    </Box>
  );
}

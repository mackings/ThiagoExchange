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
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HistoryIcon from "@mui/icons-material/History";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import SecurityIcon from "@mui/icons-material/Security";
import TimerIcon from "@mui/icons-material/Timer";
import WalletIcon from "@mui/icons-material/Wallet";
import { AuthDialog, AuthMode, Session } from "@/features/auth/AuthDialog";
import { ProfileView } from "@/features/profile/ProfileView";
import { HistoryView } from "@/features/trades/HistoryView";
import { TradeChat } from "@/features/trades/TradeChat";
import { TradeView } from "@/features/trades/TradeView";
import { API_HEALTH_URL, Rate, Trade, api, money, usd } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { TradeTimer } from "@/shared/ui/TradeTimer";

const sessionKey = "thiago.session";
const keepAliveIntervalMs = 14 * 60 * 1000;
type TradeScreen = "offers" | "trade";

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
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [tradeScreen, setTradeScreen] = useState<TradeScreen>("offers");
  const [activeTradeSeen, setActiveTradeSeen] = useState("");

  const token = session?.token;
  const user = session?.user;
  const safeRates = Array.isArray(rates) ? rates : [];
  const safeTrades = Array.isArray(trades) ? trades : [];
  const activeTrade = useMemo(() => safeTrades.find((trade) => trade.status === "pending" || trade.status === "confirmed") || null, [safeTrades]);

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
    if (!activeTrade || activeTrade.id === activeTradeSeen) return;
    setActiveTradeSeen(activeTrade.id);
    playActiveTradeSound();
  }, [activeTrade, activeTradeSeen]);

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

  function updateUser(nextUser: Session["user"]) {
    if (!session) return;
    const next = { ...session, user: nextUser };
    localStorage.setItem(sessionKey, JSON.stringify(next));
    setSession(next);
  }

  function logout() {
    localStorage.removeItem(sessionKey);
    setSession(null);
    setTrades([]);
    setAuthMode("login");
    setAuthOpen(true);
    setActiveTab(0);
    setTradeScreen("offers");
    setSelectedRate(null);
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
            {["Offers", "History", "Profile"].map((item, index) => (
              <Button
                key={item}
                onClick={() => {
                  setActiveTab(index);
                  if (index !== 0) setSelectedRate(null);
                }}
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
                    background: "linear-gradient(115deg, #0f7a62 0%, #5757f6 48%, #d84bbf 92%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Sell coins when the payout feels right.
                </Typography>
                <Typography sx={{ color: "#53627c", maxWidth: 690, fontSize: { xs: 13.5, md: 18 }, lineHeight: { xs: 1.5, md: 1.65 } }}>
                  Choose a live desk offer, accept the terms, release coin, upload proof, and chat with Thiago Desk until payment is complete.
                </Typography>
                <MarketSlider rates={safeRates} />
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
                        <Button variant="contained" onClick={() => { setActiveTab(0); setTradeScreen("trade"); }} sx={{ bgcolor: "#5757f6" }}>
                          Continue Chat
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-0.04em", fontSize: { xs: 26, md: 34 } }}>No open trade</Typography>
                        <Typography color="text.secondary">Choose an offer to start a 30-minute secured chat.</Typography>
                        <Button variant="outlined" onClick={() => { setActiveTab(0); setTradeScreen("offers"); }} sx={{ alignSelf: "flex-start" }}>
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
            onChange={(_, value) => {
              setActiveTab(value);
              if (value !== 0) setSelectedRate(null);
            }}
            variant="fullWidth"
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 52, md: 68 },
              "& .MuiTabs-flexContainer": { gap: { xs: 1.2, md: 2 }, justifyContent: "space-between" },
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
              label="Offers"
            />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
            <Tab icon={<AccountCircleIcon />} iconPosition="start" label="Profile" />
          </Tabs>
          </Box>

          <Box sx={{ p: { xs: 1.25, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
            {activeTab === 0 && tradeScreen === "trade" && activeTrade && token ? (
              <TradeChat
                trade={activeTrade}
                token={token}
                onTrade={(updated) => setTrades((items) => (Array.isArray(items) ? items : []).map((item) => item.id === updated.id ? updated : item))}
                onRefresh={() => loadTrades()}
                onError={setError}
              />
            ) : activeTab === 0 && (
              <TradeView
                rates={safeRates}
                trades={safeTrades}
                token={token}
                selectedRate={selectedRate}
                onSelectedRate={setSelectedRate}
                onRequireAuth={() => setAuthOpen(true)}
                onCreated={(trade) => {
                  setTrades((items) => [trade, ...(Array.isArray(items) ? items : [])]);
                  setSuccess("Trade opened. Trading ground started.");
                  setActiveTab(0);
                  setTradeScreen("trade");
                  setSelectedRate(null);
                  window.setTimeout(() => loadTrades(), 250);
                }}
                onError={setError}
              />
            )}
            {activeTab === 1 && <HistoryView trades={safeTrades} token={token} onRefresh={() => loadTrades()} onError={setError} />}
            {activeTab === 2 && (
              <ProfileView
                user={user}
                token={token}
                rates={safeRates}
                onUser={updateUser}
                onLogout={logout}
                onError={setError}
                onSuccess={setSuccess}
              />
            )}
          </Box>
        </Paper>
      </Container>

      {activeTrade && (
        <Button
          variant="contained"
          onClick={() => {
            setActiveTab(0);
            setTradeScreen("trade");
            setSelectedRate(null);
          }}
          sx={{
            position: "fixed",
            right: { xs: 14, md: 28 },
            bottom: { xs: 18, md: 28 },
            zIndex: 20,
            borderRadius: 999,
            px: 2,
            py: 1.2,
            bgcolor: "#08133b",
            boxShadow: "0 16px 42px rgba(8,19,59,0.28)",
            "&::before": {
              content: '""',
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "#19d27c",
              mr: 1,
              boxShadow: "0 0 0 6px rgba(25,210,124,0.18)"
            }
          }}
          endIcon={<ArrowForwardIcon />}
        >
          Active trade
        </Button>
      )}

      <AuthDialog open={authOpen} mode={authMode} onMode={setAuthMode} onClose={() => user && setAuthOpen(false)} onSession={saveSession} onError={setError} />
    </Box>
  );
}

function MarketSlider({ rates }: { rates: Rate[] }) {
  const featured = rates.filter((rate) => ["BTC", "ETH", "USDT"].includes(rate.coin.toUpperCase()));
  const items = (featured.length ? featured : rates).slice(0, 6);
  const logos = ["Binance", "Coinbase", "Kraken", "OKX"];

  return (
    <Box
      sx={{
        overflow: "hidden",
        borderRadius: { xs: 4, md: 5 },
        border: "1px solid rgba(87,87,246,0.14)",
        bgcolor: "rgba(255,255,255,0.68)",
        boxShadow: "0 12px 32px rgba(8,19,59,0.06)"
      }}
    >
      <Stack
        direction="row"
        spacing={1.2}
        sx={{
          width: "max-content",
          p: 1,
          animation: "marketSlide 28s linear infinite",
          "@keyframes marketSlide": {
            "0%": { transform: "translateX(0)" },
            "100%": { transform: "translateX(-50%)" }
          }
        }}
      >
        {[...items, ...items].map((rate, index) => (
          <Box
            key={`${rate.id}-${index}`}
            sx={{
              minWidth: { xs: 178, md: 220 },
              p: 1.4,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid rgba(87,87,246,0.10)"
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#08133b", color: "#8fffb5", fontWeight: 1000 }}>
                {rate.coin.slice(0, 1)}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 1000, fontSize: 14 }}>{rate.coin} desk rate</Typography>
                <Typography sx={{ fontWeight: 1000, color: "#5757f6" }}>{money(rate.buyRateNgn)} / $1</Typography>
              </Box>
            </Stack>
          </Box>
        ))}
        {logos.map((name) => (
          <Box
            key={name}
            sx={{
              minWidth: 132,
              p: 1.4,
              borderRadius: 3,
              bgcolor: "#08133b",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.16)"
            }}
          >
            <Typography sx={{ fontWeight: 1000, fontSize: 14 }}>{name}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.66)", fontSize: 12 }}>market signal</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function playActiveTradeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Browsers can block sound until the user has interacted with the page.
  }
}

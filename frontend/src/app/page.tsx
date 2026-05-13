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
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HistoryIcon from "@mui/icons-material/History";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import SecurityIcon from "@mui/icons-material/Security";
import TimerIcon from "@mui/icons-material/Timer";
import WalletIcon from "@mui/icons-material/Wallet";
import { AuthDialog, AuthMode, Session } from "@/features/auth/AuthDialog";
import { HistoryView } from "@/features/trades/HistoryView";
import { TradeView } from "@/features/trades/TradeView";
import { API_HEALTH_URL, Rate, Trade, api, money, usd } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { TradeTimer } from "@/shared/ui/TradeTimer";
import { CoinIcon, CoinPairIcons } from "@/shared/ui/CoinIcon";

const sessionKey = "thiago.session";
const keepAliveIntervalMs = 14 * 60 * 1000;
type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
};

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
  const [activeTradeSeen, setActiveTradeSeen] = useState("");
  const [ratesLoading, setRatesLoading] = useState(true);

  const token = session?.token;
  const user = session?.user;
  const safeRates = Array.isArray(rates) ? rates : [];
  const safeTrades = Array.isArray(trades) ? trades : [];
  const activeTrades = useMemo(() => safeTrades.filter((trade) => trade.status === "pending" || trade.status === "confirmed"), [safeTrades]);
  const activeTrade = activeTrades[0] || null;

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
    const newestActiveId = activeTrades[0]?.id || "";
    if (!newestActiveId || newestActiveId === activeTradeSeen) return;
    setActiveTradeSeen(newestActiveId);
    playActiveTradeSound();
  }, [activeTrades, activeTradeSeen]);

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
    setRatesLoading(true);
    try {
      const payload = await api<Rate[]>("/rates");
      setRates(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRatesLoading(false);
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
    setActiveTab(0);
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
            minHeight: { xs: 64, md: 92 }
          }}
        >
          <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={150} height={40} priority />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, p: 0.5, borderRadius: 999, bgcolor: "#f3f4ff" }}>
            {["Offers", "History"].map((item, index) => (
              <Button
                key={item}
                onClick={() => {
                  setActiveTab(index);
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
              <Tooltip title="Profile">
                <IconButton href="/profile" aria-label="open profile" sx={{ p: 0 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontWeight: 900 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                </IconButton>
              </Tooltip>
              <Tooltip title="Sign out">
                <IconButton onClick={logout} color="primary" aria-label="sign out"><LogoutIcon /></IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Button startIcon={<LoginIcon />} variant="contained" onClick={() => setAuthOpen(true)} sx={{ borderRadius: 999 }}>Sign in</Button>
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
              <Card
                sx={{
                  color: "#08204a",
                  border: "1px solid rgba(37,99,235,0.16)",
                  borderRadius: { xs: 3, md: 4 },
                  boxShadow: "0 22px 58px rgba(37,99,235,0.14)",
                  background: "#f8fbff",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": activeTrade
                    ? {
                        content: "\"\"",
                        position: "absolute",
                        inset: "0 auto 0 0",
                        width: 6,
                        bgcolor: activeTrade.status === "confirmed" ? "#0ea5e9" : "#2563eb"
                      }
                    : undefined
                }}
              >
                <CardContent sx={{ p: { xs: 1.6, md: 2.6 } }}>
                  <Stack spacing={{ xs: 1.25, md: 1.8 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip
                        size="small"
                        label="LIVE TRADE STATUS"
                        sx={{
                          height: 30,
                          letterSpacing: 1.5,
                          fontWeight: 1000,
                          fontSize: { xs: 11, md: 12 },
                          color: activeTrade ? "#0f3e99" : "#53627c",
                          bgcolor: activeTrade ? "#eff6ff" : "#f8fafc",
                          border: "1px solid rgba(37,99,235,0.14)"
                        }}
                      />
                      <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: activeTrade ? "#1d4ed8" : "#eff6ff", boxShadow: activeTrade ? "0 8px 18px rgba(37,99,235,0.24)" : "none" }}>
                        <TimerIcon sx={{ color: activeTrade ? "#fff" : "#2563eb", fontSize: 21 }} />
                      </Box>
                    </Stack>
                    {activeTrade ? (
                      <>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                          <Stack direction="row" spacing={1.1} alignItems="center">
                            <CoinIcon coin={activeTrade.coin} size={42} />
                            <Box>
                            <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-0.035em", fontSize: { xs: 22, md: 30 }, lineHeight: 1.05 }}>
                              {usd(activeTrade.amountUsd)}
                            </Typography>
                            <Typography sx={{ mt: 0.35, color: "#64708a", fontSize: { xs: 14, md: 16 } }}>
                              Expected payout {money(activeTrade.expectedNgn)}
                            </Typography>
                            </Box>
                          </Stack>
                          <StatusChip status={activeTrade.status} />
                        </Stack>
                        <TradeTimer trade={activeTrade} onExpired={() => loadTrades()} />
                        <Grid container spacing={1}>
                          {[
                            ["Network", activeTrade.network],
                            ["Rate", `${money(activeTrade.rateNgn)} / $1`],
                            ["Proof", activeTrade.transactionHash ? "Submitted" : "Pending"],
                            ["Chat", `${activeTrade.messages?.length || 0} messages`]
                          ].map(([label, value]) => (
                            <Grid item xs={6} key={label}>
                              <Box sx={{ p: { xs: 1.05, md: 1.25 }, minHeight: { xs: 66, md: 76 }, borderRadius: 2, bgcolor: "#fff", border: "1px solid rgba(37,99,235,0.12)" }}>
                                <Typography variant="caption" sx={{ color: "#64708a", fontWeight: 800, fontSize: { xs: 11, md: 12 } }}>{label}</Typography>
                                <Typography sx={{ fontWeight: 1000, wordBreak: "break-word", fontSize: { xs: 14, md: 16 }, lineHeight: 1.25 }}>{value}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                        <Button variant="contained" href={`/trades/${activeTrade.id}`} sx={{ minHeight: { xs: 42, md: 46 }, bgcolor: "#1d4ed8", color: "#fff", borderRadius: 999, "&:hover": { bgcolor: "#1e40af" } }}>
                          Continue Chat
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography variant="h4" sx={{ color: "#08133b", fontWeight: 1000, letterSpacing: "-0.04em", fontSize: { xs: 26, md: 34 } }}>No open trade</Typography>
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
              onChange={(_, value) => {
                setActiveTab(value);
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
              <Tab icon={<WalletIcon />} iconPosition="start" label="Offers" />
              <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
            </Tabs>
          </Box>

          <Box sx={{ p: { xs: 1.25, md: 3 } }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
            {activeTab === 0 && ratesLoading && !safeRates.length && <OffersSkeleton />}
            {activeTab === 0 && (!ratesLoading || safeRates.length > 0) && (
              <TradeView
                rates={safeRates}
                trades={safeTrades}
                token={token}
                selectedRate={null}
                onSelectedRate={() => undefined}
                onViewOffer={(rate) => {
                  window.location.href = `/offers/${rate.id}`;
                }}
                onRequireAuth={() => setAuthOpen(true)}
                onCreated={(trade) => {
                  setTrades((items) => [trade, ...(Array.isArray(items) ? items : [])]);
                  setSuccess("Trade opened. Trading ground started.");
                  window.location.href = `/trades/${trade.id}`;
                  window.setTimeout(() => loadTrades(), 250);
                }}
                onError={setError}
              />
            )}
            {activeTab === 1 && <HistoryView trades={safeTrades} token={token} onRefresh={() => loadTrades()} onError={setError} />}
          </Box>
        </Paper>
      </Container>

      {activeTrade && (
        <Button
          variant="contained"
          onClick={() => {
            if (activeTrades.length === 1) {
              window.location.href = `/trades/${activeTrades[0].id}`;
              return;
            }
            window.location.href = "/trades";
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
          {activeTrades.length > 1 ? `${activeTrades.length} active trades` : "Active trade"}
        </Button>
      )}

      <AuthDialog open={authOpen} mode={authMode} onMode={setAuthMode} onClose={() => user && setAuthOpen(false)} onSession={saveSession} onError={setError} />
    </Box>
  );
}

function MarketSlider({ rates }: { rates: Rate[] }) {
  const [tickers, setTickers] = useState<BinanceTicker[]>([]);
  const [marketError, setMarketError] = useState("");
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

  useEffect(() => {
    let mounted = true;
    async function loadMarket() {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`, { cache: "no-store" });
        if (!res.ok) throw new Error("market unavailable");
        const payload = (await res.json()) as BinanceTicker[];
        if (mounted) {
          setTickers(Array.isArray(payload) ? payload : []);
          setMarketError("");
        }
      } catch {
        if (mounted) setMarketError("Live market data is refreshing.");
      }
    }
    loadMarket();
    const id = window.setInterval(loadMarket, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const fallbackRates = rates.filter((rate) => ["BTC", "ETH", "USDT"].includes(rate.coin.toUpperCase())).slice(0, 3);
  const liveItems = tickers.map((ticker) => ({
    key: ticker.symbol,
    coin: ticker.symbol.replace("USDT", ""),
    price: `$${Number(ticker.lastPrice).toLocaleString("en-US", { maximumFractionDigits: Number(ticker.lastPrice) > 100 ? 2 : 4 })}`,
    change: `${Number(ticker.priceChangePercent) >= 0 ? "+" : ""}${Number(ticker.priceChangePercent).toFixed(2)}%`,
    positive: Number(ticker.priceChangePercent) >= 0,
    source: "Binance"
  }));
  const items = liveItems.length
    ? liveItems
    : fallbackRates.map((rate) => ({
        key: rate.id,
        coin: rate.coin,
        price: `${money(rate.buyRateNgn)} / $1`,
        change: "Desk",
        positive: true,
        source: "Thiago"
      }));

  return (
    <Box sx={{ overflow: "hidden", width: "100%", maxHeight: { xs: 82, md: 92 } }}>
      <Stack
        direction="row"
        spacing={0.8}
        sx={{
          width: "max-content",
          p: 0.45,
          animation: "marketSlide 28s linear infinite",
          "@keyframes marketSlide": {
            "0%": { transform: "translateX(0)" },
            "100%": { transform: "translateX(-50%)" }
          }
        }}
      >
        {[...items, ...items].map((item, index) => (
          <Box
            key={`${item.key}-${index}`}
            sx={{
              minWidth: { xs: 152, md: 188 },
              p: { xs: 0.8, md: 1 },
              borderRadius: 2.5,
              bgcolor: "#fff",
              border: "1px solid rgba(87,87,246,0.10)",
              boxShadow: "0 10px 24px rgba(8,19,59,0.05)"
            }}
          >
            <Stack direction="row" spacing={0.8} alignItems="center">
              <CoinPairIcons base={item.coin} size={30} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 1000, fontSize: { xs: 12.5, md: 13.5 }, lineHeight: 1.15, whiteSpace: "nowrap" }}>Live pair</Typography>
                <Stack direction="row" spacing={0.6} alignItems="baseline">
                  <Typography sx={{ fontWeight: 1000, color: "#5757f6", fontSize: { xs: 13, md: 15 }, lineHeight: 1.2, whiteSpace: "nowrap" }}>{item.price}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: 10.5, md: 11.5 }, color: item.positive ? "#0f7a40" : "#b42318", whiteSpace: "nowrap" }}>{item.change}</Typography>
                </Stack>
                <Typography sx={{ color: "#66708a", fontSize: { xs: 9.5, md: 10.5 }, lineHeight: 1.2 }}>{item.source} live rate</Typography>
              </Box>
            </Stack>
          </Box>
        ))}
        {["Binance", "Coinbase", "OKX"].map((name) => (
          <Box
            key={name}
            sx={{
              minWidth: { xs: 104, md: 120 },
              p: { xs: 0.8, md: 1 },
              borderRadius: 2.5,
              bgcolor: "#08133b",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.16)"
            }}
          >
            <Typography sx={{ fontWeight: 1000, fontSize: { xs: 12.5, md: 13.5 }, lineHeight: 1.2 }}>{name}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.66)", fontSize: { xs: 9.5, md: 10.5 }, lineHeight: 1.25 }}>{marketError || "exchange signal"}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function OffersSkeleton() {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Box>
        <Skeleton variant="text" width={160} height={38} />
        <Skeleton variant="text" width="70%" />
      </Box>
      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item}>
            <Card variant="outlined" sx={{ borderRadius: { xs: 4, md: 5 }, borderColor: "rgba(87,87,246,0.10)" }}>
              <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                <Stack spacing={{ xs: 1.6, md: 2.2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.4} alignItems="center">
                      <Skeleton variant="circular" width={42} height={42} />
                      <Box>
                        <Skeleton variant="text" width={120} height={28} />
                        <Skeleton variant="text" width={90} />
                      </Box>
                    </Stack>
                    <Skeleton variant="rounded" width={96} height={28} sx={{ borderRadius: 999 }} />
                  </Stack>
                  <Skeleton variant="rounded" height={94} sx={{ borderRadius: 4 }} />
                  <Skeleton variant="rounded" height={36} width="82%" sx={{ borderRadius: 999 }} />
                  <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
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

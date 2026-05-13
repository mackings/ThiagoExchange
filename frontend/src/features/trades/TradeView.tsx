"use client";

import { useMemo, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BoltIcon from "@mui/icons-material/Bolt";
import GppGoodIcon from "@mui/icons-material/GppGood";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShieldIcon from "@mui/icons-material/Shield";
import type { Rate, Trade } from "@/shared/api";
import { api, money, usd } from "@/shared/api";

export function TradeView({
  rates,
  trades = [],
  token,
  selectedRate,
  onSelectedRate,
  onViewOffer,
  onBackToOffers,
  onRequireAuth,
  onCreated,
  onError
}: {
  rates: Rate[];
  trades?: Trade[];
  token?: string;
  selectedRate: Rate | null;
  onSelectedRate: (rate: Rate | null) => void;
  onViewOffer?: (rate: Rate) => void;
  onBackToOffers?: () => void;
  onRequireAuth: () => void;
  onCreated: (trade: Trade) => void;
  onError: (message: string) => void;
}) {
  const [amountUsd, setAmountUsd] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const selected = selectedRate;
  const expected = selected ? Number(amountUsd || 0) * selected.buyRateNgn : 0;
  const amount = Number(amountUsd || 0);
  const belowMinimum = Boolean(selected && amount > 0 && amount < selected.minAmountUsd);
  const sortedRates = useMemo(() => [...rates].sort((a, b) => a.coin.localeCompare(b.coin)), [rates]);

  function successfulCount(rate: Rate) {
    return trades.filter((trade) => trade.coin === rate.coin && trade.network === rate.network && trade.status === "paid").length;
  }

  function responseTime(rate: Rate) {
    if (rate.coin === "USDT") return "Under 1 min";
    return "Under 5 mins";
  }

  function viewOffer(rate: Rate) {
    if (onViewOffer) {
      onViewOffer(rate);
      return;
    }
    onSelectedRate(rate);
    setAmountUsd(String(rate.minAmountUsd));
    setAccepted(false);
    setLocalError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!token) {
      onRequireAuth();
      return;
    }
    if (!selected || !accepted) return;
    if (!amount || amount < selected.minAmountUsd) {
      setLocalError(`Minimum trade amount for ${selected.coin} is ${usd(selected.minAmountUsd)}.`);
      return;
    }
    setSubmitting(true);
    setLocalError("");
    try {
      const trade = await api<Trade>(
        "/trades",
        {
          method: "POST",
          body: JSON.stringify({
            rateId: selected.id,
            amountUsd: Number(amountUsd),
            paymentBank: "",
            accountName: "",
            accountNumber: ""
          })
        },
        token
      );
      onSelectedRate(null);
      setAccepted(false);
      setAmountUsd("");
      onCreated(trade);
    } catch (err) {
      const message = (err as Error).message;
      setLocalError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (selected) {
    return (
      <Stack spacing={{ xs: 1.5, md: 2.5 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => (onBackToOffers ? onBackToOffers() : onSelectedRate(null))} sx={{ alignSelf: "flex-start", color: "#08133b" }}>
          Back to offers
        </Button>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, md: 3 },
            borderRadius: { xs: 4, md: 6 },
            borderColor: "rgba(87,87,246,0.14)",
            background: "linear-gradient(140deg, rgba(255,255,255,0.98), rgba(250,255,250,0.94))"
          }}
        >
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item xs={12} md={5}>
              <Stack spacing={1.5}>
                <Chip size="small" icon={<ShieldIcon />} label="TRADING GROUND" sx={{ alignSelf: "flex-start", bgcolor: "#f0efff", color: "#3035bf", fontWeight: 1000, letterSpacing: 1.6 }} />
                <Box>
                  <Typography sx={{ fontWeight: 1000, fontSize: { xs: 28, md: 42 }, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    Sell {selected.coin}
                  </Typography>
                  <Typography color="text.secondary">{selected.network} offer from Thiago Desk</Typography>
                </Box>
                <Box sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 4, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.12)" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>DESK RATE</Typography>
                  <Typography sx={{ fontWeight: 1000, fontSize: { xs: 30, md: 40 }, letterSpacing: "-0.03em" }}>{money(selected.buyRateNgn)}</Typography>
                  <Typography color="text.secondary">per $1, minimum {usd(selected.minAmountUsd)}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" icon={<GppGoodIcon />} label="30 min escrow window" />
                  <Chip size="small" icon={<BoltIcon />} label={`${responseTime(selected)} response`} />
                  <Chip size="small" icon={<ReceiptLongIcon />} label={`${successfulCount(selected)} completed`} />
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                <TextField
                  label="Amount in USD"
                  value={amountUsd}
                  onChange={(event) => setAmountUsd(event.target.value)}
                  type="number"
                  fullWidth
                  error={belowMinimum}
                  helperText={`Minimum: ${usd(selected.minAmountUsd)}`}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
                <Box sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 4, bgcolor: "#fbfcff", border: "1px solid rgba(87,87,246,0.12)" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Expected payout</Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: { xs: 20, md: 26 } }}>{money(expected)}</Typography>
                  </Stack>
                </Box>
                {localError && <Alert severity="error">{localError}</Alert>}
                <Box sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 4, border: "1px solid rgba(87,87,246,0.12)" }}>
                  <Stack spacing={0.8}>
                    <Typography sx={{ fontWeight: 900 }}>Offer terms</Typography>
                    <Typography variant="body2" color="text.secondary">Release coin to the wallet shown in chat only.</Typography>
                    <Typography variant="body2" color="text.secondary">Upload proof/screenshot if available.</Typography>
                    <Typography variant="body2" color="text.secondary">Send bank name, account number, and account name in chat after release.</Typography>
                    <Typography variant="body2" color="text.secondary">Payment is made after desk confirmation.</Typography>
                  </Stack>
                </Box>
                <FormControlLabel
                  control={<Checkbox checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />}
                  label="I accept the trade terms"
                />
                <Button
                  variant="contained"
                  fullWidth
                  disableElevation
                  disabled={submitting || !accepted || !amount || belowMinimum}
                  onClick={submit}
                  sx={{
                    py: 1.35,
                    bgcolor: "#08133b",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#101b4a", boxShadow: "none" },
                    "&.Mui-disabled": {
                      bgcolor: "#5757f6",
                      color: "#fff",
                      opacity: 0.85
                    }
                  }}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {submitting ? "Opening trade..." : "Open Trading Ground"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 1000, mb: 0.8, letterSpacing: "-0.035em", fontSize: { xs: 22, md: 30 } }}>
          Offers
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: { xs: 13.5, md: 16 } }}>
          Pick a desk offer, review the terms, then continue to the trading ground.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {sortedRates.map((rate) => (
          <Grid item xs={12} md={6} lg={4} key={rate.id}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderRadius: { xs: 4, md: 5 },
                borderColor: "rgba(87,87,246,0.14)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,255,0.96))",
                boxShadow: "0 12px 34px rgba(8,19,59,0.06)",
                transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "#9d9cff",
                  boxShadow: "0 18px 46px rgba(87,87,246,0.12)"
                }
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                <Stack spacing={{ xs: 1.6, md: 2.2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1.4} alignItems="center">
                      <Avatar sx={{ bgcolor: "#f0efff", color: "#5757f6", fontWeight: 1000, width: { xs: 38, md: 48 }, height: { xs: 38, md: 48 } }}>
                        {rate.coin.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 1000, fontSize: { xs: 16, md: 20 } }}>
                          Sell {rate.coin}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rate.network}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack spacing={0.8} alignItems="flex-end">
                      <Chip size="small" icon={<BoltIcon />} label={responseTime(rate)} sx={{ bgcolor: "#f0efff", color: "#3035bf", fontWeight: 900 }} />
                      <Chip size="small" label={`${successfulCount(rate)} successful`} sx={{ bgcolor: "#eafff2", color: "#0f7a40", fontWeight: 1000 }} />
                    </Stack>
                  </Stack>

                  <Box sx={{ p: { xs: 1.35, md: 2 }, borderRadius: { xs: 3, md: 4 }, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.12)" }}>
                    <Typography variant="body2" color="text.secondary">
                      Desk rate
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: 0, fontSize: { xs: 24, md: 32 } }}>
                      {money(rate.buyRateNgn)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per $1, minimum {usd(rate.minAmountUsd)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" icon={<GppGoodIcon />} label="30 min escrow window" />
                    <Chip size="small" icon={<ReceiptLongIcon />} label={`${responseTime(rate)} response`} />
                  </Stack>

                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => viewOffer(rate)}
                    sx={{ py: 1.25, bgcolor: "#5757f6", boxShadow: "0 8px 20px rgba(87,87,246,0.18)" }}
                  >
                    View Offer
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

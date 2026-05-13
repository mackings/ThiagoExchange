"use client";

import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import GppGoodIcon from "@mui/icons-material/GppGood";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import type { Rate, Trade } from "@/shared/api";
import { api, money, usd } from "@/shared/api";

export function TradeView({
  rates,
  trades = [],
  token,
  onRequireAuth,
  onCreated,
  onError
}: {
  rates: Rate[];
  trades?: Trade[];
  token?: string;
  onRequireAuth: () => void;
  onCreated: (trade: Trade) => void;
  onError: (message: string) => void;
}) {
  const [selected, setSelected] = useState<Rate | null>(null);
  const [amountUsd, setAmountUsd] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const expected = selected ? Number(amountUsd || 0) * selected.buyRateNgn : 0;
  const amount = Number(amountUsd || 0);
  const belowMinimum = Boolean(selected && amount > 0 && amount < selected.minAmountUsd);

  function successfulCount(rate: Rate) {
    return trades.filter((trade) => trade.coin === rate.coin && trade.network === rate.network && trade.status === "paid").length;
  }

  function responseTime(rate: Rate) {
    if (rate.coin === "USDT") return "Under 1 min";
    return "Under 5 mins";
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
      setSelected(null);
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

  return (
    <>
      <Stack spacing={{ xs: 2, md: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 1000, mb: 0.8, letterSpacing: "-0.04em", fontSize: { xs: 26, md: 34 } }}>
            Choose a live offer
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: 14.5, md: 17 } }}>
            Pick a desk offer, review the terms, then continue to the secured trade chat.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
          {rates.map((rate) => (
            <Grid item xs={12} md={6} lg={4} key={rate.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: { xs: 4, md: 5 },
                  borderColor: "rgba(87,87,246,0.14)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,255,0.96))",
                  boxShadow: "0 12px 34px rgba(8,19,59,0.06)",
                  transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "#9d9cff",
                    boxShadow: "0 18px 46px rgba(87,87,246,0.12)"
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={{ xs: 1.6, md: 2.2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={1.4} alignItems="center">
                        <Avatar sx={{ bgcolor: "#f0efff", color: "#5757f6", fontWeight: 1000, width: { xs: 44, md: 50 }, height: { xs: 44, md: 50 } }}>
                          {rate.coin.slice(0, 1)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 1000 }}>
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

                    <Box sx={{ p: { xs: 1.6, md: 2.2 }, borderRadius: { xs: 3, md: 4 }, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.12)" }}>
                      <Typography variant="body2" color="text.secondary">
                        Desk rate
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: 0, fontSize: { xs: 28, md: 34 } }}>
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
                      onClick={() => {
                        setSelected(rate);
                        setAmountUsd(String(rate.minAmountUsd));
                        setAccepted(false);
                        setLocalError("");
                      }}
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

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: { xs: 4, md: 6 }, m: { xs: 1.5, md: 4 }, boxShadow: "0 18px 56px rgba(8,19,59,0.18)" } }}>
        <DialogTitle sx={{ px: { xs: 2.2, md: 4 }, pt: { xs: 2.2, md: 4 }, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontWeight: 1000, fontSize: { xs: 26, md: 34 }, letterSpacing: "-0.04em" }}>Offer Terms</Typography>
            <IconButton
              aria-label="Close offer terms"
              onClick={() => setSelected(null)}
              sx={{ bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.12)", "&:hover": { bgcolor: "#f0efff" } }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.2, md: 4 } }}>
          <Stack spacing={{ xs: 1.6, md: 2.2 }} sx={{ pt: 1 }}>
            <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: { xs: 4, md: 5 }, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.10)" }}>
              <Typography sx={{ fontWeight: 1000 }}>
                Sell {selected?.coin} at {selected ? money(selected.buyRateNgn) : ""}
              </Typography>
              <Typography color="text.secondary">
                Send only through {selected?.network}. Trade expires after 30 minutes if coin is not confirmed.
              </Typography>
            </Box>
            <TextField
              label="Amount in USD"
              value={amountUsd}
              onChange={(event) => setAmountUsd(event.target.value)}
              type="number"
              fullWidth
              error={belowMinimum}
              helperText={selected ? `Minimum: ${usd(selected.minAmountUsd)}` : ""}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            {localError && <Alert severity="error">{localError}</Alert>}
            <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: { xs: 4, md: 5 }, border: "1px solid rgba(87,87,246,0.12)" }}>
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>Terms</Typography>
                <Typography variant="body2" color="text.secondary">Release coin to the wallet shown in chat only.</Typography>
                <Typography variant="body2" color="text.secondary">Upload proof/screenshot if available.</Typography>
                <Typography variant="body2" color="text.secondary">Send bank name, account number, and account name in chat after release.</Typography>
                <Typography variant="body2" color="text.secondary">Payment is made after desk confirmation.</Typography>
              </Stack>
            </Box>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Expected payout</Typography>
              <Typography sx={{ fontWeight: 1000 }}>{money(expected)}</Typography>
            </Stack>
            <FormControlLabel
              control={<Checkbox checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />}
              label="I accept the trade terms"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.2, md: 4 }, pb: { xs: 2.2, md: 4 } }}>
          <Button
            variant="contained"
            fullWidth
            disableElevation
            disabled={submitting || !accepted || !amount || belowMinimum}
            onClick={submit}
            sx={{ py: 1.35, bgcolor: "#08133b", boxShadow: "none", "&:hover": { bgcolor: "#101b4a", boxShadow: "none" } }}
          >
            {submitting ? "Opening..." : "Open Trade Chat"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

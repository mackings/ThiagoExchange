"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BoltIcon from "@mui/icons-material/Bolt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { Rate, Trade } from "@/shared/api";
import { money, usd } from "@/shared/api";

export function RatesView({ rates, trades = [] }: { rates: Rate[]; trades?: Trade[] }) {
  function successfulCount(rate: Rate) {
    return trades.filter((trade) => trade.coin === rate.coin && trade.network === rate.network && trade.status === "paid").length;
  }

  return (
    <Grid container spacing={2.5}>
      {rates.map((rate) => (
        <Grid item xs={12} sm={6} lg={4} key={rate.id}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 5,
              borderColor: "rgba(87,87,246,0.13)",
              background: "linear-gradient(180deg, #ffffff 0%, #fbfbff 100%)",
              transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
              boxShadow: "0 10px 28px rgba(8,19,59,0.045)",
              "&:hover": {
                transform: "translateY(-3px)",
                borderColor: "rgba(87,87,246,0.30)",
                boxShadow: "0 16px 40px rgba(8,19,59,0.09)"
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.2}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: "#08133b", color: "#8fffb5", fontWeight: 1000, width: 58, height: 58, fontSize: 26 }}>
                    {rate.coin.slice(0, 1)}
                  </Avatar>
                  <div>
                    <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: "-0.04em" }}>
                      {rate.coin}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rate.network}
                    </Typography>
                  </div>
                  </Stack>
                  <Stack spacing={0.8} alignItems="flex-end">
                    <Chip size="small" icon={<BoltIcon />} label="Live" sx={{ bgcolor: "#f0efff", color: "#3035bf", fontWeight: 1000 }} />
                    <Chip
                      size="small"
                      label={`${successfulCount(rate)} successful`}
                      sx={{ bgcolor: "#eafff2", color: "#0f7a40", fontWeight: 1000 }}
                    />
                  </Stack>
                </Stack>

                <Box sx={{ p: 2, borderRadius: 4, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.10)" }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 18, color: "#5757f6" }} />
                    <Typography variant="caption" sx={{ color: "#66708a", fontWeight: 900, letterSpacing: 1.2 }}>
                      ADMIN BUY RATE
                    </Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-0.04em" }}>
                    {money(rate.buyRateNgn)} <Typography component="span" sx={{ fontWeight: 900, color: "#66708a" }}>/ $1</Typography>
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(87,87,246,0.12)" }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">We buy at</Typography>
                  <Typography sx={{ fontWeight: 1000 }}>{money(rate.buyRateNgn)} / $1</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Minimum</Typography>
                  <Chip label={usd(rate.minAmountUsd)} sx={{ bgcolor: "#fff", border: "1px solid rgba(87,87,246,0.14)", fontWeight: 1000 }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

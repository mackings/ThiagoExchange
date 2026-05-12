"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ForumIcon from "@mui/icons-material/Forum";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WalletIcon from "@mui/icons-material/Wallet";
import type { Trade } from "@/shared/api";
import { money, usd } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { TradeTimer } from "@/shared/ui/TradeTimer";
import { TradeChat } from "./TradeChat";

export function HistoryView({
  trades,
  token,
  onRefresh,
  onError
}: {
  trades: Trade[];
  token?: string;
  onRefresh: () => void;
  onError: (message: string) => void;
}) {
  const [expandedTradeId, setExpandedTradeId] = useState("");
  const items = Array.isArray(trades) ? trades : [];

  if (!token) {
    return (
      <Alert severity="info" sx={{ borderRadius: 4 }}>
        Sign in to view your trade history.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box>
          <Chip
            size="small"
            icon={<HistoryIcon />}
            label="TRADE HISTORY"
            sx={{ mb: 1, bgcolor: "#f0efff", color: "#3035bf", fontWeight: 1000, letterSpacing: 1.8 }}
          />
          <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: "-0.04em" }}>
            Recent activity
          </Typography>
          <Typography color="text.secondary">Track chats, payouts, proofs, and completed receipts.</Typography>
        </Box>
        <Chip
          label={`${items.length} total trade${items.length === 1 ? "" : "s"}`}
          sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: "#fbfcff", border: "1px solid rgba(87,87,246,0.14)", fontWeight: 1000 }}
        />
      </Stack>

      {items.length === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 5, borderColor: "rgba(87,87,246,0.14)", bgcolor: "#fbfcff" }}>
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <Avatar sx={{ mx: "auto", mb: 2, width: 64, height: 64, bgcolor: "#f0efff", color: "#5757f6" }}>
              <ReceiptLongIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: "-0.03em" }}>
              No trades yet
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Your opened trades, chat threads, proofs, and receipts will show here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {items.map((trade) =>
        expandedTradeId === trade.id ? (
          <TradeChat
            key={trade.id}
            trade={trade}
            token={token}
            compact
            onTrade={() => onRefresh()}
            onRefresh={onRefresh}
            onError={onError}
          />
        ) : (
          <Card
            key={trade.id}
            variant="outlined"
            sx={{
              borderRadius: 5,
              borderColor: "rgba(87,87,246,0.14)",
              background: "linear-gradient(180deg, #ffffff 0%, #fbfbff 100%)",
              boxShadow: "0 10px 28px rgba(8,19,59,0.045)",
              transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "rgba(87,87,246,0.30)",
                boxShadow: "0 16px 40px rgba(8,19,59,0.09)"
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Grid container spacing={2.2} alignItems="center">
                <Grid item xs={12} lg={4}>
                  <Stack direction="row" spacing={1.6} alignItems="center">
                    <Avatar sx={{ bgcolor: "#08133b", color: "#8fffb5", width: 58, height: 58, fontWeight: 1000, fontSize: 26 }}>
                      {trade.coin.slice(0, 1)}
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: "-0.04em" }}>
                          {trade.coin} {usd(trade.amountUsd)}
                        </Typography>
                        <StatusChip status={trade.status} />
                      </Stack>
                      <Typography color="text.secondary">{trade.network}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                  <Box sx={{ p: 1.6, borderRadius: 4, bgcolor: "#f8f8ff", border: "1px solid rgba(87,87,246,0.10)" }}>
                    <Typography variant="caption" sx={{ color: "#66708a", fontWeight: 900, letterSpacing: 1 }}>
                      EXPECTED PAYOUT
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 1000 }}>
                      {money(trade.expectedNgn)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WalletIcon sx={{ fontSize: 18, color: "#5757f6" }} />
                      <Typography variant="body2" color="text.secondary">
                        Wallet
                      </Typography>
                      <Tooltip title="Copy wallet">
                        <IconButton size="small" onClick={() => navigator.clipboard.writeText(trade.walletAddress)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography sx={{ wordBreak: "break-all", fontWeight: 800, color: "#08133b" }}>
                      {trade.walletAddress}
                    </Typography>
                  </Stack>
                </Grid>

                <Grid item xs={12} lg={2}>
                  <Stack spacing={1.2} alignItems={{ xs: "stretch", lg: "flex-end" }}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", lg: "flex-end" }} flexWrap="wrap" useFlexGap>
                      <Chip icon={<ForumIcon />} label={`${trade.messages?.length || 0} chats`} sx={{ bgcolor: "#f0efff", color: "#3035bf", fontWeight: 900 }} />
                      <Chip label={trade.transactionHash ? "Proof sent" : "Proof pending"} sx={{ bgcolor: trade.transactionHash ? "#eafff2" : "#fff6e5", color: trade.transactionHash ? "#0f7a40" : "#9a5b00", fontWeight: 900 }} />
                    </Stack>
                    {trade.status === "pending" && <TradeTimer trade={trade} onExpired={onRefresh} />}
                    <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => setExpandedTradeId(trade.id)} sx={{ bgcolor: "#5757f6" }}>
                      Open Chat
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )
      )}
    </Stack>
  );
}

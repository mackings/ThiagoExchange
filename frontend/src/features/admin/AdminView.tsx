"use client";

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ForumIcon from "@mui/icons-material/Forum";
import PaymentsIcon from "@mui/icons-material/Payments";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import type { GiftCardOrder, Rate, Trade } from "@/shared/api";
import { api, money, usd } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { CoinIcon } from "@/shared/ui/CoinIcon";
import { TradeChat } from "@/features/trades/TradeChat";

export function AdminView({ token, rates, onRates, onError, onSuccess }: { token: string; rates: Rate[]; onRates: (rates: Rate[]) => void; onError: (message: string) => void; onSuccess: (message: string) => void }) {
  const [adminTrades, setAdminTrades] = useState<Trade[]>([]);
  const [giftCardOrders, setGiftCardOrders] = useState<GiftCardOrder[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    loadAdminTrades();
    loadGiftCardOrders();
  }, []);

  async function loadAdminTrades() {
    try {
      const payload = await api<Trade[]>("/admin/trades", {}, token);
      setAdminTrades(Array.isArray(payload) ? payload : []);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function loadGiftCardOrders() {
    try {
      const payload = await api<GiftCardOrder[]>("/admin/giftcards/orders", {}, token);
      setGiftCardOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function updateRate(rate: Rate, key: keyof Rate, value: string) {
    const next = { ...rate, [key]: key === "walletAddress" ? value : Number(value) };
    try {
      onRates(await api<Rate[]>(`/admin/rates/${rate.id}`, { method: "PUT", body: JSON.stringify({ buyRateNgn: next.buyRateNgn, walletAddress: next.walletAddress, minAmountUsd: next.minAmountUsd, active: next.active }) }, token));
      onSuccess("Rate updated.");
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function setStatus(trade: Trade, status: Trade["status"]) {
    try {
      await api<Trade>(`/admin/trades/${trade.id}/status`, { method: "PATCH", body: JSON.stringify({ status, receiptNote: status === "paid" ? "Payment completed by Thiago Exchange." : "" }) }, token);
      onSuccess(status === "paid" ? "Receipt email sent." : "Trade updated.");
      loadAdminTrades();
    } catch (err) {
      onError((err as Error).message);
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={5}>
        <Typography variant="h6" sx={{ fontWeight: 1000, mb: 2 }}>Manage Rates</Typography>
        <Stack spacing={2}>
          {rates.map((rate) => (
            <Card key={rate.id} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CoinIcon coin={rate.coin} size={32} />
                    <Typography sx={{ fontWeight: 1000 }}>{rate.network}</Typography>
                  </Stack>
                  <TextField size="small" label="Buy rate NGN" type="number" defaultValue={rate.buyRateNgn} onBlur={(event) => updateRate(rate, "buyRateNgn", event.target.value)} />
                  <TextField size="small" label="Minimum USD" type="number" defaultValue={rate.minAmountUsd} onBlur={(event) => updateRate(rate, "minAmountUsd", event.target.value)} />
                  <TextField size="small" label="Wallet address" defaultValue={rate.walletAddress} onBlur={(event) => updateRate(rate, "walletAddress", event.target.value)} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Grid>
      <Grid item xs={12} lg={7}>
        <Typography variant="h6" sx={{ fontWeight: 1000, mb: 2 }}>Gift Card Queue</Typography>
        <List disablePadding sx={{ mb: 3 }}>
          {giftCardOrders.length === 0 && (
            <ListItem sx={{ bgcolor: "#fff", mb: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)" }}>
              <ListItemText primary="No gift card submissions yet." />
            </ListItem>
          )}
          {giftCardOrders.map((order) => (
            <ListItem key={order.id} sx={{ bgcolor: "#fff", mb: 1.5, borderRadius: 2, border: "1px solid rgba(37,99,235,0.12)", alignItems: "flex-start" }}>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <CardGiftcardIcon sx={{ color: "#1d4ed8" }} />
                    <Typography sx={{ fontWeight: 1000 }}>{order.userName} - {order.categoryName || order.giftcardName}</Typography>
                  </Stack>
                }
                secondary={`${usd(order.amount)} | ${order.providerReference || "No Prestmit reference"} | ${order.providerMessage || order.providerStatus || "Pending"}`}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button size="small" variant="outlined" onClick={() => navigator.clipboard?.writeText(order.providerReference || order.id)}>Copy ref</Button>
              </Stack>
            </ListItem>
          ))}
        </List>

        <Typography variant="h6" sx={{ fontWeight: 1000, mb: 2 }}>Verify Trades</Typography>
        {selectedTrade && (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <TradeChat
              trade={selectedTrade}
              token={token}
              compact
              viewerRole="admin"
              onTrade={(updated) => {
                setSelectedTrade(updated);
                setAdminTrades((items) => items.map((item) => item.id === updated.id ? updated : item));
              }}
              onRefresh={loadAdminTrades}
              onError={onError}
            />
            <Button variant="text" onClick={() => setSelectedTrade(null)} sx={{ alignSelf: "flex-start" }}>Close chat</Button>
          </Stack>
        )}
        <List disablePadding>
          {adminTrades.map((trade) => (
            <ListItem key={trade.id} sx={{ bgcolor: "#fff", mb: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", alignItems: "flex-start" }}>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <CoinIcon coin={trade.coin} size={28} />
                    <Typography sx={{ fontWeight: 1000 }}>{trade.userName} - {usd(trade.amountUsd)}</Typography>
                  </Stack>
                }
                secondary={`${trade.transactionHash || "No hash yet"} | ${money(trade.expectedNgn)}`}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <StatusChip status={trade.status} />
                <Button size="small" variant="outlined" startIcon={<ForumIcon />} onClick={() => setSelectedTrade(trade)}>Chat</Button>
                <Button size="small" variant="outlined" startIcon={<PriceCheckIcon />} onClick={() => setStatus(trade, "confirmed")}>Confirm</Button>
                <Button size="small" variant="contained" startIcon={<PaymentsIcon />} onClick={() => setStatus(trade, "paid")}>Paid</Button>
              </Stack>
            </ListItem>
          ))}
        </List>
      </Grid>
    </Grid>
  );
}

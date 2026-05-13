"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CancelIcon from "@mui/icons-material/Cancel";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SendIcon from "@mui/icons-material/Send";
import TagIcon from "@mui/icons-material/Tag";
import VerifiedIcon from "@mui/icons-material/Verified";
import WalletIcon from "@mui/icons-material/Wallet";
import type { Trade } from "@/shared/api";
import { api, money, usd, wsUrl } from "@/shared/api";
import { StatusChip } from "@/shared/ui/StatusChip";
import { TradeTimer } from "@/shared/ui/TradeTimer";

export function TradeChat({
  trade,
  token,
  onTrade,
  onRefresh,
  onError,
  compact = false
}: {
  trade: Trade;
  token?: string;
  onTrade: (trade: Trade) => void;
  onRefresh: () => void;
  onError: (message: string) => void;
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState(trade.transactionHash || "");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onTradeRef = useRef(onTrade);
  const onErrorRef = useRef(onError);
  const messages = useMemo(() => (Array.isArray(trade.messages) ? trade.messages : []), [trade.messages]);
  const hasReleasedCoin = Boolean(trade.transactionHash);

  useEffect(() => {
    onTradeRef.current = onTrade;
    onErrorRef.current = onError;
  }, [onTrade, onError]);

  useEffect(() => {
    if (!token) return;
    const socket = new WebSocket(wsUrl(`/trades/${trade.id}/ws`, token));
    socketRef.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => {
      setConnected(false);
      if (socketRef.current === socket) socketRef.current = null;
    };
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "trade" && payload.trade) {
          onTradeRef.current(payload.trade);
        }
        if (payload.type === "error" && payload.error) {
          onErrorRef.current(payload.error);
        }
      } catch {
        onErrorRef.current("Could not read chat update.");
      }
    };
    return () => socket.close();
  }, [trade.id, token]);

  function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric"
    }).format(new Date(value));
  }

  async function postMessage() {
    if (!token || !message.trim()) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "message", body: message, attachmentUrl }));
      setMessage("");
      setAttachmentUrl("");
      setAttachmentName("");
      return;
    }
    try {
      const updated = await api<Trade>(
        `/trades/${trade.id}/messages`,
        { method: "POST", body: JSON.stringify({ body: message, attachmentUrl }) },
        token
      );
      setMessage("");
      setAttachmentUrl("");
      setAttachmentName("");
      onTrade(updated);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  function attachFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(String(reader.result || ""));
      setAttachmentName(file.name);
      if (!message.trim()) {
        setMessage("Proof screenshot attached.");
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveHash() {
    if (!token || !hash.trim()) return;
    try {
      const updated = await api<Trade>(
        `/trades/${trade.id}/hash`,
        { method: "PATCH", body: JSON.stringify({ transactionHash: hash }) },
        token
      );
      onTrade(updated);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function cancelTrade() {
    if (!token) return;
    try {
      const updated = await api<Trade>(`/trades/${trade.id}/cancel`, { method: "PATCH" }, token);
      onTrade(updated);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  return (
    <Stack
      spacing={{ xs: 1.5, md: 2 }}
      sx={{
        minHeight: compact ? "auto" : { xs: "calc(100vh - 156px)", md: "calc(100vh - 190px)" }
      }}
    >
      <Box
        sx={{
          p: { xs: 1.6, md: 2.6 },
          color: "#fff",
          borderRadius: { xs: 4, md: 5 },
          background: "linear-gradient(135deg, #08133b 0%, #2634a5 58%, #0f7a62 100%)",
          boxShadow: "0 18px 48px rgba(8,19,59,0.16)"
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: "#5757f6", color: "#fff", fontWeight: 1000, width: { xs: 42, md: 52 }, height: { xs: 42, md: 52 } }}>
                {trade.coin.slice(0, 1)}
              </Avatar>
              <Box>
                <Typography variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 1000, fontSize: { xs: 16, md: compact ? 16 : 20 } }}>
                  {trade.coin} trade thread
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  {usd(trade.amountUsd)} on {trade.network}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip status={trade.status} />
              <Chip size="small" icon={<VerifiedIcon />} label="Thiago Desk" sx={{ bgcolor: "#f0efff", color: "#3035bf", fontWeight: 900 }} />
              <Chip size="small" label={connected ? "Live" : "Reconnecting"} sx={{ bgcolor: connected ? "#eafff2" : "#fff6e5", color: connected ? "#0f7a40" : "#9a5b00", fontWeight: 1000 }} />
              <Chip size="small" label={money(trade.expectedNgn)} sx={{ bgcolor: "#08133b", color: "#fff", fontWeight: 1000 }} />
              {hasReleasedCoin && <Chip size="small" label="Coin released" sx={{ bgcolor: "#eafff2", color: "#0f7a40", fontWeight: 1000 }} />}
            </Stack>
          </Stack>
          {trade.status === "pending" && (
            <Box sx={{ minWidth: { xs: "100%", sm: 180 } }}>
              <TradeTimer trade={trade} onExpired={onRefresh} />
            </Box>
          )}
        </Stack>
      </Box>

      <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ flex: 1, minHeight: 0 }}>
        <Alert severity="info" icon={<WalletIcon />} sx={{ borderRadius: 4, bgcolor: "#f7f8ff", color: "#08133b", border: "1px solid rgba(87,87,246,0.12)" }}>
          Send coin to <strong>{trade.walletAddress}</strong>
          <Tooltip title="Copy wallet">
            <IconButton size="small" onClick={() => navigator.clipboard.writeText(trade.walletAddress)} sx={{ ml: 0.5 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Alert>

        <Stack
          spacing={1.2}
          sx={{
            flex: 1,
            minHeight: compact ? 320 : { xs: "50vh", md: "56vh" },
            maxHeight: compact ? 320 : "none",
            overflowY: "auto",
            pr: 0.5,
            p: { xs: 0.2, md: 1 },
            background: "linear-gradient(180deg, rgba(247,248,255,0.64), rgba(255,255,255,0.28))",
            borderRadius: { xs: 4, md: 5 }
          }}
        >
          {messages.map((item) => {
            const mine = item.sender === "user";
            return (
              <Stack key={item.id} direction="row" justifyContent={mine ? "flex-end" : "flex-start"}>
                <Box
                  sx={{
                    maxWidth: { xs: "90%", md: "74%" },
                    px: { xs: 1.35, md: 1.8 },
                    py: { xs: 1, md: 1.35 },
                    borderRadius: mine ? "24px 24px 6px 24px" : "24px 24px 24px 6px",
                    bgcolor: mine ? "#5757f6" : item.sender === "admin" ? "#08133b" : "#fff",
                    color: mine || item.sender === "admin" ? "#fff" : "text.primary",
                    border: mine || item.sender === "admin" ? 0 : "1px solid rgba(87,87,246,0.12)",
                    boxShadow: "0 8px 22px rgba(8,19,59,0.06)"
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 1000, opacity: 0.72 }}>
                      {item.sender === "system" ? "Thiago Bot" : item.sender === "admin" ? "Thiago Desk" : "You"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.55, whiteSpace: "nowrap" }}>
                      {formatMessageTime(item.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ whiteSpace: "pre-wrap", fontSize: { xs: 13.5, md: 16 } }}>{item.body}</Typography>
                  {item.attachmentUrl && (
                    <Box
                      component="img"
                      src={item.attachmentUrl}
                      alt="Trade attachment"
                      sx={{ mt: 1, display: "block", maxWidth: "100%", borderRadius: 2, border: "1px solid rgba(255,255,255,0.22)" }}
                    />
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Divider sx={{ borderColor: "rgba(87,87,246,0.12)" }} />

        {trade.status === "pending" || trade.status === "confirmed" ? (
          <Stack spacing={1.5}>
            {!hasReleasedCoin && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  size="small"
                  label="Transaction hash"
                  value={hash}
                  onChange={(event) => setHash(event.target.value)}
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><TagIcon fontSize="small" /></InputAdornment> }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "#fff" } }}
                />
                <Button variant="outlined" onClick={saveHash} sx={{ minWidth: 190, borderColor: "rgba(87,87,246,0.28)" }}>
                  I Have Released Coin
                </Button>
              </Stack>
            )}
            {attachmentName && (
              <Chip
                icon={<AttachFileIcon />}
                label={attachmentName}
                onDelete={() => {
                  setAttachmentName("");
                  setAttachmentUrl("");
                }}
                sx={{ alignSelf: "flex-start" }}
              />
            )}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ p: 1, borderRadius: 5, bgcolor: "rgba(255,255,255,0.86)", border: "1px solid rgba(87,87,246,0.12)", boxShadow: "0 12px 34px rgba(8,19,59,0.08)" }}>
              <TextField
                label="Type account details or message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                placeholder="Bank: Access Bank, Account: 0123456789, Name: ..."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4, bgcolor: "#fff" } }}
              />
              <Button component="label" variant="outlined" startIcon={<AttachFileIcon />} sx={{ minWidth: 132, borderColor: "rgba(87,87,246,0.28)" }}>
                Attach
                <input hidden type="file" accept="image/*" onChange={(event) => attachFile(event.target.files?.[0])} />
              </Button>
              <Button variant="contained" endIcon={<SendIcon />} onClick={postMessage} sx={{ minWidth: 132, bgcolor: "#5757f6" }}>
                Send
              </Button>
              {trade.status === "pending" && (
                <Button color="error" variant="text" startIcon={<CancelIcon />} onClick={cancelTrade}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        ) : (
          <Alert severity={trade.status === "paid" ? "success" : "warning"}>{trade.receiptNote || `This trade is ${trade.status}.`}</Alert>
        )}
      </Stack>
    </Stack>
  );
}

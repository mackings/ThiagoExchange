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
          color: "#08133b",
          borderRadius: { xs: 3, md: 4 },
          bgcolor: "#fff",
          border: "1px solid rgba(8,19,59,0.10)",
          boxShadow: "0 18px 48px rgba(8,19,59,0.10)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: "\"\"",
            position: "absolute",
            inset: "0 auto 0 0",
            width: 6,
            bgcolor: trade.status === "confirmed" ? "#0f7a62" : trade.status === "pending" ? "#d49416" : "#64708a"
          }
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: "#08133b", color: "#fff", fontWeight: 1000, width: { xs: 42, md: 52 }, height: { xs: 42, md: 52 }, boxShadow: "0 10px 24px rgba(8,19,59,0.16)" }}>
                {trade.coin.slice(0, 1)}
              </Avatar>
              <Box>
                <Typography variant={compact ? "subtitle1" : "h6"} sx={{ fontWeight: 1000, fontSize: { xs: 16, md: compact ? 16 : 20 } }}>
                  {trade.coin} trade thread
                </Typography>
                <Typography variant="body2" sx={{ color: "#64708a" }}>
                  {usd(trade.amountUsd)} on {trade.network}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip status={trade.status} />
              <Chip size="small" icon={<VerifiedIcon />} label="Thiago Desk" sx={{ bgcolor: "#f0efff", color: "#3035bf", fontWeight: 900 }} />
              <Chip size="small" label={connected ? "Live" : "Reconnecting"} sx={{ bgcolor: connected ? "#eafff2" : "#fff6e5", color: connected ? "#0f7a40" : "#9a5b00", fontWeight: 1000 }} />
              <Chip size="small" label={money(trade.expectedNgn)} sx={{ bgcolor: "#f8fafc", color: "#08133b", border: "1px solid rgba(8,19,59,0.08)", fontWeight: 1000 }} />
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
            p: { xs: 1, md: 1.4 },
            bgcolor: "#eef3f0",
            border: "1px solid rgba(8,19,59,0.08)",
            borderRadius: { xs: 3, md: 4 }
          }}
        >
          {messages.map((item) => {
            const isUser = item.sender === "user";
            const isAdmin = item.sender === "admin";
            const isSystem = item.sender === "system";
            return (
              <Stack key={item.id} direction="row" justifyContent={isSystem ? "center" : isUser ? "flex-end" : "flex-start"}>
                <Box
                  sx={{
                    maxWidth: isSystem ? { xs: "92%", md: "68%" } : { xs: "88%", md: "72%" },
                    px: isSystem ? { xs: 1.2, md: 1.5 } : { xs: 1.35, md: 1.7 },
                    py: isSystem ? 0.8 : { xs: 1, md: 1.2 },
                    borderRadius: isSystem ? 999 : isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    bgcolor: isSystem ? "rgba(255,255,255,0.72)" : isUser ? "#dcf8c6" : isAdmin ? "#fff" : "#f8fafc",
                    color: "#08133b",
                    border: isAdmin ? "1px solid rgba(8,19,59,0.08)" : isSystem ? "1px solid rgba(8,19,59,0.06)" : 0,
                    boxShadow: isSystem ? "none" : "0 6px 18px rgba(8,19,59,0.08)",
                    position: "relative",
                    "&::after": isSystem
                      ? undefined
                      : {
                          content: "\"\"",
                          position: "absolute",
                          bottom: 0,
                          width: 10,
                          height: 10,
                          bgcolor: isUser ? "#dcf8c6" : "#fff",
                          right: isUser ? -3 : "auto",
                          left: isUser ? "auto" : -3,
                          clipPath: isUser ? "polygon(0 0, 100% 100%, 0 100%)" : "polygon(100% 0, 100% 100%, 0 100%)"
                        }
                  }}
                >
                  <Stack direction="row" justifyContent={isSystem ? "center" : "space-between"} spacing={2} alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 1000, color: isUser ? "#0f7a40" : isAdmin ? "#3035bf" : "#64708a" }}>
                      {isSystem ? "Thiago Bot" : isAdmin ? "Thiago Desk" : "You"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#64708a", whiteSpace: "nowrap" }}>
                      {formatMessageTime(item.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ mt: isSystem ? 0.2 : 0.4, whiteSpace: "pre-wrap", fontSize: { xs: 13.5, md: 15.5 }, lineHeight: 1.5 }}>{item.body}</Typography>
                  {item.attachmentUrl && (
                    <Box
                      component="img"
                      src={item.attachmentUrl}
                      alt="Trade attachment"
                      sx={{ mt: 1, display: "block", maxWidth: "100%", borderRadius: 2, border: "1px solid rgba(8,19,59,0.10)" }}
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

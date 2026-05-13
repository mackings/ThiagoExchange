"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 0.75, md: 2 }, py: { xs: 0.75, md: 2 } }}>
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 1.5, md: 2.5 }}>
          <Paper
            sx={{
              px: { xs: 1.4, md: 3 },
              py: { xs: 0.8, md: 1.6 },
              borderRadius: { xs: 3.5, md: 999 },
              bgcolor: "rgba(255,255,255,0.84)",
              border: "1px solid rgba(87,87,246,0.14)",
              boxShadow: "0 14px 38px rgba(8,19,59,0.08)"
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Button href="/" startIcon={<ArrowBackIcon />} sx={{ color: "#08133b", minWidth: "auto" }}>
                Back
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={142} height={38} priority />
            </Stack>
          </Paper>

          <Stack spacing={{ xs: 1.5, md: 2.5 }} sx={{ py: { xs: 1, md: 2 } }}>
            <Typography sx={{ fontWeight: 1000, fontSize: { xs: 24, md: 38 }, letterSpacing: "-0.035em", color: "#08133b" }}>
              {title}
            </Typography>
            <Box>{children}</Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

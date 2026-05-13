"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 0.75, md: 2 }, py: { xs: 0.75, md: 2 } }}>
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 1.5, md: 2.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.2}
            sx={{
              px: { xs: 1.4, md: 3 },
              py: { xs: 0.8, md: 1.6 },
              minHeight: { xs: 64, md: 92 }
            }}
          >
            <Button href="/" startIcon={<ArrowBackIcon />} sx={{ color: "#08133b", minWidth: "auto" }}>
              Back
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Image src="/thiago-logo.svg" alt="Thiago Exchange" width={142} height={38} priority />
          </Stack>

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

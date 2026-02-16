import React from "react";
import { Box, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";

type BreadcrumbTrailProps = {
  items: Array<string | null | undefined>;
};

export default function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  const validItems = items.filter(
    (item): item is string => Boolean(item && item.trim()),
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0.3,
        mt: 0.5,
      }}
    >
      {validItems.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          {index > 0 ? (
            <ChevronRight sx={{ fontSize: 14, color: "#1976d2", mx: 0.1 }} />
          ) : null}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "12px" }}
          >
            {item}
          </Typography>
        </React.Fragment>
      ))}
    </Box>
  );
}

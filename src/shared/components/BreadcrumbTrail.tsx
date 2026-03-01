import React from "react";
import { Box, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";

type BreadcrumbTrailProps = {
  items: Array<string | null | undefined>;
};

export default function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  const validItems = items.filter((item): item is string =>
    Boolean(item && item.trim()),
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
      {validItems.map((item, index) => {
        const isLast = index === validItems.length - 1;

        return (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && (
              <ChevronRight
                sx={{
                  fontSize: 14,
                  color: "text.disabled",
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{
                fontSize: "12px",
                fontWeight: isLast ? 600 : 400,
                color: isLast ? "primary.main" : "text.secondary",
                letterSpacing: isLast ? "0.01em" : "normal",
              }}
            >
              {item}
            </Typography>
          </React.Fragment>
        );
      })}
    </Box>
  );
}
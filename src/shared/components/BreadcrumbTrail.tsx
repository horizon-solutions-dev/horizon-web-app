import React from "react";
import { Box, Typography } from "@mui/material";
// PlayArrow se aproxima mais do estilo de "ponteiro" preenchido da imagem
import { LabelImportant } from "@mui/icons-material";

type BreadcrumbTrailProps = {
  items: Array<string | null | undefined>;
};

export default function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  const validItems = items.filter((item): item is string =>
    Boolean(item && item.trim()),
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
      {validItems.map((item, index) => {
        const isLast = index === validItems.length - 1;

        return (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && (
              <LabelImportant
                sx={{
                  fontSize: '12px',
                  color: "#F28C28",
                  flexShrink: 0,
                  mx: -0.5 
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{
                fontSize: "12px",
                fontWeight: isLast ? 800 : 400,
                color: isLast ? "primary.main" : "#454D54", 
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

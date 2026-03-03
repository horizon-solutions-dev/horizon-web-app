import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Fade,
  Popper,
  ButtonBase,
  Divider,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import "flag-icons/css/flag-icons.min.css";

// ─── Language definitions ─────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)", short: "PT", flagClass: "fi fi-br" },
  { code: "en-US", label: "English (US)", short: "EN", flagClass: "fi fi-us" },
];

// ─── Keyframes ────────────────────────────────────────────────────────────────

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
`;

// ─── Styled components ────────────────────────────────────────────────────────

const TriggerBtn = styled(ButtonBase)<{ open?: number }>(({ open }) => ({
  display: "flex",
  alignItems: "center",
  gap: 7,
  height: 36,
  padding: "0 10px",
  borderRadius: 8,
  border: open
    ? "1.5px solid rgba(99,179,237,0.55)"
    : "1.5px solid rgba(255,255,255,0.11)",
  background: open ? "rgba(99,179,237,0.08)" : "rgba(255,255,255,0.04)",
  backdropFilter: "blur(10px)",
  boxShadow: open
    ? "0 0 0 3px rgba(99,179,237,0.12)"
    : "0 1px 4px rgba(0,0,0,0.25)",
  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
  "&:hover": {
    background: "rgba(99,179,237,0.08)",
    border: "1.5px solid rgba(99,179,237,0.4)",
    boxShadow: "0 0 0 3px rgba(99,179,237,0.10)",
  },
}));

const DropdownPaper = styled(Paper)(() => ({
  marginTop: 6,
  padding: "5px 0",
  borderRadius: 10,
  background: "rgba(14, 22, 40, 0.97)",
  border: "1.5px solid rgba(99,179,237,0.18)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  minWidth: 200,
  animation: `${slideDown} 0.18s cubic-bezier(0.4,0,0.2,1)`,
  overflow: "hidden",
}));

const OptionBtn = styled(ButtonBase)<{ selected?: number }>(({ selected }) => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 14px",
  transition: "background 0.15s",
  background: selected ? "rgba(99,179,237,0.10)" : "transparent",
  "&:hover": {
    background: "rgba(99,179,237,0.08)",
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

interface LanguageSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  i18n: any;
}

export default function LanguageSelector({ i18n }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === i18n?.language) ?? LANGUAGES[0];

  const handleSelect = (code: string) => {
    i18n?.changeLanguage(code);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        anchorRef.current?.contains(e.target as Node) ||
        paperRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <Box sx={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <TriggerBtn
        ref={anchorRef}
        open={open ? 1 : 0}
        onClick={() => setOpen((v) => !v)}
        disableRipple
      >
        {/* Flag using flag-icons */}
        <Box
          sx={{
            borderRadius: "3px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            lineHeight: 0,
            fontSize: "1.1rem",
          }}
        >
          <span className={current.flagClass} style={{ borderRadius: 3 }} />
        </Box>

        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1,
          }}
        >
          {current.short}
        </Typography>

        <KeyboardArrowDownRoundedIcon
          sx={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </TriggerBtn>

      {/* Dropdown */}
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        style={{ zIndex: 1400 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={160}>
            <DropdownPaper ref={paperRef} elevation={0}>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 0.5 }} />

              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === current.code;
                return (
                  <OptionBtn
                    key={lang.code}
                    selected={isSelected ? 1 : 0}
                    onClick={() => handleSelect(lang.code)}
                    disableRipple
                  >
                    {/* Flag */}
                    <Box
                      sx={{
                        borderRadius: "3px",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                        flexShrink: 0,
                        lineHeight: 0,
                        fontSize: "1.1rem",
                      }}
                    >
                      <span className={lang.flagClass} style={{ borderRadius: 3 }} />
                    </Box>

                    {/* Language name */}
                    <Typography
                      sx={{
                        flex: 1,
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.82rem",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected
                          ? "rgba(255,255,255,0.95)"
                          : "rgba(255,255,255,0.6)",
                        transition: "color 0.15s",
                        textAlign: "left",
                      }}
                    >
                      {lang.label}
                    </Typography>

                    {/* Check icon when selected */}
                    {isSelected && (
                      <CheckRoundedIcon sx={{ fontSize: 15, color: "#63b3ed" }} />
                    )}
                  </OptionBtn>
                );
              })}
            </DropdownPaper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}
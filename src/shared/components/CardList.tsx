import React, { Fragment } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Grid,
  Pagination,
  PaginationItem,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Search,
  Tune,
  ArrowBack,
  ArrowForward,
  Close,
} from "@mui/icons-material";

export interface CardListItem {
  id: string;
  title: string;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  imageUrl?: string;
  onImageClick?: () => void;
  actions?: React.ReactNode;
  accentColor?: string;
  toolTip?: string;
}

interface CardListProps {
  title: string;
  headerIcon?: React.ReactNode;
  breadcrumb?: string;
  onClose?: () => void;
  closeLabel?: string;
  items: CardListItem[];
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onAddClick?: () => void;
  addLabel?: string;
  showTitle?: boolean;
  showAddButton?: boolean;
  showFilters?: boolean;
  addButtonPlacement?: "header" | "toolbar";
  emptyImageLabel?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
  cardMaxHeight?: number | string;
  imageWidth?: number;
  haveImage?: boolean;
  imageHeight?: number;
  actionsMarginTop?: number;
  variant?: "default" | "condominiumSelection";
}

export default function CardList({
  title,
  headerIcon,
  breadcrumb,
  onClose,
  closeLabel = "Fechar",
  items,
  searchPlaceholder = "Buscar...",
  onSearchChange,
  onAddClick,
  showAddButton = true,
  page = 1,
  totalPages = 1,
  onPageChange,
  showPagination = true,
  showTitle = true,
  showFilters = true,
  addButtonPlacement = "header",
  emptyImageLabel = "Sem imagem",
  cardMaxHeight = 195,
  imageWidth = 120,
  imageHeight = 80,
  actionsMarginTop = 1,
  haveImage = true,
  variant = "default",
}: CardListProps) {
  const isCondominiumSelection = variant === "condominiumSelection";
  const resolvedCardMaxHeight = isCondominiumSelection ? "none" : cardMaxHeight;
  const resolvedImageWidth = isCondominiumSelection ? 134 : imageWidth;
  const resolvedImageHeight = isCondominiumSelection ? 96 : imageHeight;
  const resolvedActionsMarginTop = isCondominiumSelection
    ? 2.25
    : actionsMarginTop;

  return (
    <Fragment>
      {showTitle ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {headerIcon ? (
              <Box
                sx={{ color: "#1976d2", display: "flex", alignItems: "center" }}
              >
                {headerIcon}
              </Box>
            ) : null}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {breadcrumb ? (
                <Typography
                  variant="caption"
                  sx={{ color: "#d32f2f", fontWeight: 600 }}
                >
                  {breadcrumb}
                </Typography>
              ) : null}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {onClose ? (
              <Button
                color="error"
                startIcon={<Close />}
                onClick={onClose}
                variant="text"
                sx={{ fontWeight: 600 }}
              >
                {closeLabel}
              </Button>
            ) : null}
            {onAddClick && addButtonPlacement === "header" ? (
              <IconButton
                onClick={onAddClick}
                sx={{
                  width: 40,
                  height: 40,
                  background:
                    "linear-gradient(135deg, #7f5bff 0%, #6c63ff 100%)",
                  color: "#fff",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #6c63ff 0%, #5a52e6 100%)",
                  },
                }}
              >
                <Add />
              </IconButton>
            ) : null}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              height: 46,
            },
          }}
        />
        {showFilters && (
          <Tooltip title="Clique aqui para Abrir a janela de Configurações">
            <IconButton
              sx={{
                width: 40,
                height: 40,
                border: "2px solid #e0e0e0",
                borderRadius: 2,
                color: "#666",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#1976d2",
                  color: "#1976d2",
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                },
              }}
            >
              <Tune />
            </IconButton>
          </Tooltip>
        )}
        {showAddButton && onAddClick && addButtonPlacement === "toolbar" && (
          <Tooltip title="Clique aqui para Criar um novo Item">
            <IconButton
              onClick={onAddClick}
              sx={{
                width: 40,
                height: 40,
                border: "2px solid #e0e0e0",
                borderRadius: 2,
                color: "#666",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#d32f2f",
                  color: "#d32f2f",
                  backgroundColor: "rgba(211, 47, 47, 0.04)",
                },
              }}
            >
              <Add />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Grid container spacing={2}>
        {items.length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                borderRadius: 2,
                border: "1px dashed #d0d7de",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Nenhum item encontrado.
            </Box>
          </Grid>
        ) : (
          items.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Paper
                elevation={0}
                sx={{
                  p: isCondominiumSelection ? 2.25 : 2,
                  borderRadius: isCondominiumSelection ? 2 : 3,
                  background: item.accentColor || "#f6f7fb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  minHeight: isCondominiumSelection ? 172 : undefined,
                  maxHeight: resolvedCardMaxHeight,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: isCondominiumSelection ? 1.75 : "12px",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, minWidth: 0 }}
                      noWrap
                    >
                      {item.title}
                    </Typography>
                    {item.badge ? (
                      typeof item.badge === "string" ? (
                        <Chip
                          label={item.badge}
                          size="small"
                          sx={{ fontWeight: 600, flexShrink: 0, backgroundColor: '#f6f7fb' }}
                        />
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                          {item.badge}
                        </Box>
                      )
                    ) : null}
                  </Box>
                  {item.subtitle ? (
                    typeof item.subtitle === "string" ? (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.subtitle}
                      </Typography>
                    ) : (
                      <Box>{item.subtitle}</Box>
                    )
                  ) : null}
                  {item.meta ? (
                    typeof item.meta === "string" ? (
                      <Typography variant="caption" color="text.secondary">
                        {item.meta}
                      </Typography>
                    ) : (
                      <Box>{item.meta}</Box>
                    )
                  ) : null}
                  {item.actions ? (
                    <Box sx={{ mt: resolvedActionsMarginTop }}>
                      {item.actions}
                    </Box>
                  ) : null}
                </Box>
                {
                  haveImage && (
                <Box
                  role={item.onImageClick ? "button" : undefined}
                  tabIndex={item.onImageClick ? 0 : undefined}
                  sx={{
                    width: resolvedImageWidth,
                    height: resolvedImageHeight,
                    borderRadius: 2,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: item.onImageClick ? "pointer" : "default",
                  }}
                  onClick={item.onImageClick}
                  onKeyDown={(event) => {
                    if (item.onImageClick && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      item.onImageClick();
                    }
                  }}
                >
                  {item.imageUrl ? (
                    <Tooltip title={item?.toolTip} placement="top">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Tooltip>
                  ) : (
                                        <Tooltip title={item?.toolTip} placement="top">

                    <Typography variant="caption" color="text.secondary">
                      {emptyImageLabel}
                    </Typography>
                    </Tooltip>
                  )}
                </Box>
                  )
                }
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {showPagination ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            page={page}
            count={Math.max(1, totalPages)}
            onChange={(_, value) => onPageChange?.(value)}
            shape="rounded"
            showFirstButton={false}
            showLastButton={false}
            renderItem={(item) => (
              <PaginationItem
                components={{ previous: ArrowBack, next: ArrowForward }}
                {...item}
              />
            )}
          />
        </Box>
      ) : null}
    </Fragment>
  );
}

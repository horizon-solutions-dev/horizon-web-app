import React, { Fragment } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Grid,
  Pagination,
  PaginationItem,
  InputAdornment,
} from '@mui/material';
import { Add, Search, Tune, ArrowBack, ArrowForward, Close } from '@mui/icons-material';

export interface CardListItem {
  id: string;
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  imageUrl?: string;
  actions?: React.ReactNode;
  accentColor?: string;
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
  showFilters?: boolean;
  filtersLabel?: string;
  addButtonPlacement?: 'header' | 'toolbar';
  emptyImageLabel?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
}

export default function CardList({
  title,
  headerIcon,
  breadcrumb,
  onClose,
  closeLabel = 'Fechar',
  items,
  searchPlaceholder = 'Buscar...',
  onSearchChange,
  onAddClick,
  page = 1,
  totalPages = 1,
  onPageChange,
  showPagination = true,
  showTitle = true,
  showFilters = true,
  filtersLabel = 'Filtros',
  addButtonPlacement = 'header',
  emptyImageLabel = 'Sem imagem',
}: CardListProps) {
  return (
    <Fragment>
      {showTitle ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {headerIcon ? (
              <Box sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                {headerIcon}
              </Box>
            ) : null}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {breadcrumb ? (
                <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                  {breadcrumb}
                </Typography>
              ) : null}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            {onAddClick && addButtonPlacement === 'header' ? (
              <IconButton
                onClick={onAddClick}
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #7f5bff 0%, #6c63ff 100%)',
                  color: '#fff',
                  '&:hover': { background: 'linear-gradient(135deg, #6c63ff 0%, #5a52e6 100%)' },
                }}
              >
                <Add />
              </IconButton>
            ) : null}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#fff',
            },
          }}
        />
        {showFilters && (
          <IconButton
            sx={{
              width: 40,
              height: 40,
              border: '2px solid #e0e0e0',
              borderRadius: 2,
              color: '#666',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#1976d2',
                color: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
          >
            <Tune />
          </IconButton>
        )}
        {onAddClick && addButtonPlacement === 'toolbar' && (
          <IconButton
            onClick={onAddClick}
            sx={{
              width: 40,
              height: 40,
              border: '2px solid #e0e0e0',
              borderRadius: 2,
              color: '#666',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#d32f2f',
                color: '#d32f2f',
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
              },
            }}
          >
            <Add />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={2}>
        {items.length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px dashed #d0d7de',
                textAlign: 'center',
                color: 'text.secondary',
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
                  p: 2,
                  borderRadius: 3,
                  background: item.accentColor || '#f6f7fb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                    {item.title}
                  </Typography>
                  {item.subtitle ? (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.subtitle}
                    </Typography>
                  ) : null}
                  {item.meta ? (
                    <Typography variant="caption" color="text.secondary">
                      {item.meta}
                    </Typography>
                  ) : null}
                  {item.actions ? <Box sx={{ mt: 1 }}>{item.actions}</Box> : null}
                </Box>
                <Box
                  sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {emptyImageLabel}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))
        )}
      </Grid>

      {showPagination ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
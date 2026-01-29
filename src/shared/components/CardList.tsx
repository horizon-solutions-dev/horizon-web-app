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
} from '@mui/material';
import { Add, Search, Tune, ArrowBack, ArrowForward } from '@mui/icons-material';
import Falback from '../../assets/falback.jpg'
export interface CardListItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  imageUrl?: string;
  actions?: React.ReactNode;
  accentColor?: string;
}

interface CardListProps {
  title: string;
  items: CardListItem[];
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onAddClick?: () => void;
  addLabel?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
}

export default function CardList({
  title,
  items,
  searchPlaceholder = 'Buscar...',
  onSearchChange,
  onAddClick,
  page = 1,
  totalPages = 1,
  onPageChange,
  showPagination = true,
}: CardListProps) {
  return (
    <Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {onAddClick ? (
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

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange?.(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>
        <Button variant="outlined" startIcon={<Tune />}>
          Filtros
        </Button>
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
                      <img
                        src={Falback}
                        alt="Imagem padrão"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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

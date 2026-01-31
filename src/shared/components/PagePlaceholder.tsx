import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from '@mui/material';

interface PagePlaceholderProps {
  title: string;
  subtitle?: string;
  actions?: { label: string; variant?: 'contained' | 'outlined' }[];
  table?: {
    columns: string[];
    rows: Array<Array<string | number>>;
  };
}

export default function PagePlaceholder({
  title,
  subtitle,
  actions = [],
  table,
}: PagePlaceholderProps) {
  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {actions.length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {actions.map((action) => (
                  <Button key={action.label} variant={action.variant || 'outlined'}>
                    {action.label}
                  </Button>
                ))}
              </Stack>
            ) : null}
          </Box>

          {table ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {table.columns.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {table.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={table.columns.length}>Sem dados para exibir.</TableCell>
                  </TableRow>
                ) : (
                  table.rows.map((row, index) => (
                    <TableRow key={`${title}-${index}`}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={`${title}-${index}-${cellIndex}`}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ p: 2, borderRadius: 2, background: '#fafafa', border: '1px dashed #d0d7de' }}>
              <Typography variant="body2" color="text.secondary">
                Conteudo em desenvolvimento.
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

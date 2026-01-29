import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { profileService, type Profile } from '../../services/profileService';

const Perfis: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfiles();
      setProfiles(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar perfis.';
      setError(message);
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Perfis
          </Typography>

          <Button variant="outlined" onClick={loadProfiles} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Carregar perfis'}
          </Button>

          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Codigo</TableCell>
                <TableCell>Nome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>Nenhum perfil carregado.</TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.profileId}>
                    <TableCell>{profile.profileId}</TableCell>
                    <TableCell>{profile.code}</TableCell>
                    <TableCell>{profile.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Perfis;

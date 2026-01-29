import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  InputAdornment,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Download,
  Delete,
  Edit,
  Visibility,
  Description
} from '@mui/icons-material';
import BoletoForm from './BoletoForm';
import BoletoViewer from './BoletoViewer';
import { BoletoCard } from './BoletoCard';
import './Boletos.scss';

interface Boleto {
  id: number;
  numero: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pago' | 'pendente' | 'vencido';
  imagem: string | null;
  dataEmissao: string;
  beneficiario: string;
  pagador: string;
}

const Boletos: React.FC = () => {
  const [boletos, setBoletos] = useState<Boleto[]>([
    {
      id: 1,
      numero: '23793381260000500001234567890123456789012',
      descricao: 'Condomínio - Janeiro/2026',
      valor: 500.00,
      vencimento: '2026-01-20',
      status: 'pendente',
      imagem: null,
      dataEmissao: '2026-01-05',
      beneficiario: 'Condomínio Horizonte',
      pagador: 'João Silva'
    },
    {
      id: 2,
      numero: '23793381260000350001234567890123456789013',
      descricao: 'Água - Janeiro/2026',
      valor: 350.00,
      vencimento: '2026-01-15',
      status: 'pago',
      imagem: null,
      dataEmissao: '2026-01-01',
      beneficiario: 'Companhia de Águas',
      pagador: 'João Silva'
    },
    {
      id: 3,
      numero: '23793381260000250001234567890123456789014',
      descricao: 'Luz - Dezembro/2025',
      valor: 250.00,
      vencimento: '2025-12-20',
      status: 'vencido',
      imagem: null,
      dataEmissao: '2025-12-05',
      beneficiario: 'Companhia de Energia',
      pagador: 'João Silva'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [openForm, setOpenForm] = useState(false);
  const [openViewer, setOpenViewer] = useState(false);
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBoleto, setMenuBoleto] = useState<Boleto | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleOpenForm = (boleto?: Boleto) => {
    setSelectedBoleto(boleto || null);
    setOpenForm(true);
    handleCloseMenu();
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedBoleto(null);
  };

  const handleOpenViewer = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setOpenViewer(true);
    handleCloseMenu();
  };

  const handleCloseViewer = () => {
    setOpenViewer(false);
    setSelectedBoleto(null);
  };

  const handleSaveBoleto = (boleto: Omit<Boleto, 'id'>) => {
    if (selectedBoleto) {
      setBoletos(boletos.map(b => b.id === selectedBoleto.id ? { ...boleto, id: selectedBoleto.id } : b));
      setSnackbar({ open: true, message: 'Boleto atualizado com sucesso!', severity: 'success' });
    } else {
      const newId = Math.max(...boletos.map(b => b.id), 0) + 1;
      setBoletos([...boletos, { ...boleto, id: newId }]);
      setSnackbar({ open: true, message: 'Boleto criado com sucesso!', severity: 'success' });
    }
    handleCloseForm();
  };

  const handleDeleteBoleto = (boleto: Boleto) => {
    if (window.confirm(`Deseja realmente excluir o boleto ${boleto.numero}?`)) {
      setBoletos(boletos.filter(b => b.id !== boleto.id));
      setSnackbar({ open: true, message: 'Boleto excluído com sucesso!', severity: 'success' });
      handleCloseMenu();
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, boleto: Boleto) => {
    setAnchorEl(event.currentTarget);
    setMenuBoleto(boleto);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuBoleto(null);
  };

  const handleDownload = (boleto: Boleto) => {
    if (boleto.imagem) {
      const link = document.createElement('a');
      link.href = boleto.imagem;
      link.download = `boleto_${boleto.numero}.png`;
      link.click();
      setSnackbar({ open: true, message: 'Download iniciado!', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Este boleto não possui imagem!', severity: 'error' });
    }
    handleCloseMenu();
  };

  const filteredBoletos = boletos.filter(boleto => {
    const matchesSearch = boleto.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.beneficiario.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'todos' || boleto.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'success';
      case 'pendente': return 'warning';
      case 'vencido': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="boletos-container">
      <Container maxWidth="xl">
        <Paper elevation={3} className="boletos-card">
          <Box className="boletos-header">
            <Description className="header-icon" />
            <Typography variant="h4" className="header-title">
              Gerenciamento de Boletos
            </Typography>
            <Typography variant="subtitle1" className="header-subtitle">
              Visualize, gerencie e faça download dos seus boletos
            </Typography>
          </Box>

          <Box className="boletos-content">
            <Box className="toolbar">
              <TextField
                placeholder="Buscar boleto..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />

              <Box className="toolbar-actions">
                <TextField
                  select
                  size="small"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterList />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="pago">Pagos</MenuItem>
                  <MenuItem value="pendente">Pendentes</MenuItem>
                  <MenuItem value="vencido">Vencidos</MenuItem>
                </TextField>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenForm()}
                  className="add-button"
                >
                  Novo Boleto
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3} className="boletos-grid">
              {filteredBoletos.map((boleto) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={boleto.id}>
                  <BoletoCard
                    boleto={boleto}
                    onViewer={handleOpenViewer}
                    onDownload={handleDownload}
                    onMenu={handleOpenMenu}
                    getStatusColor={getStatusColor}
                  />
                </Grid>
              ))}
            </Grid>

            {filteredBoletos.length === 0 && (
              <Box className="empty-state">
                <Description className="empty-icon" />
                <Typography variant="h6" className="empty-title">
                  Nenhum boleto encontrado
                </Typography>
                <Typography variant="body2" className="empty-text">
                  {searchTerm || filterStatus !== 'todos'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Clique em "Novo Boleto" para adicionar um boleto'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => menuBoleto && handleOpenViewer(menuBoleto)}>
          <Visibility fontSize="small" style={{ marginRight: 8 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={() => menuBoleto && handleOpenForm(menuBoleto)}>
          <Edit fontSize="small" style={{ marginRight: 8 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => menuBoleto && handleDownload(menuBoleto)} disabled={!menuBoleto?.imagem}>
          <Download fontSize="small" style={{ marginRight: 8 }} />
          Download
        </MenuItem>
        <MenuItem onClick={() => menuBoleto && handleDeleteBoleto(menuBoleto)}>
          <Delete fontSize="small" style={{ marginRight: 8 }} />
          Excluir
        </MenuItem>
      </Menu>

      <BoletoForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveBoleto}
        boleto={selectedBoleto}
      />

      <BoletoViewer
        open={openViewer}
        onClose={handleCloseViewer}
        boleto={selectedBoleto}
        onDownload={handleDownload}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Boletos;

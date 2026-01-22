import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Person,
  Phone,
  Home,
  Badge,
  FilterList
} from '@mui/icons-material';
import { initialMoradores, type Morador } from '../../services/mockData';
import MoradorForm from './MoradorForm';
import './Moradores.scss';

const Moradores: React.FC = () => {
  const [moradores, setMoradores] = useState<Morador[]>(initialMoradores);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedMorador, setSelectedMorador] = useState<Morador | null>(null);
/*   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMorador, setMenuMorador] = useState<Morador | null>(null); */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  const handleOpenForm = (morador?: Morador) => {
    setSelectedMorador(morador || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedMorador(null);
  };

  const handleSaveMorador = (moradorData: Omit<Morador, 'id'>) => {
    if (selectedMorador) {
      setMoradores(moradores.map(m => 
        m.id === selectedMorador.id ? { ...moradorData, id: selectedMorador.id } : m
      ));
      setSnackbar({ 
        open: true, 
        message: 'Morador atualizado com sucesso!', 
        severity: 'success' 
      });
    } else {
      const newId = Math.max(...moradores.map(m => m.id), 0) + 1;
      setMoradores([...moradores, { ...moradorData, id: newId }]);
      setSnackbar({ 
        open: true, 
        message: 'Morador cadastrado com sucesso!', 
        severity: 'success' 
      });
    }
    handleCloseForm();
  };

  const handleDeleteMorador = (morador: Morador) => {
    if (window.confirm(`Deseja realmente excluir o morador ${morador.nome}?`)) {
      setMoradores(moradores.filter(m => m.id !== morador.id));
      setSnackbar({ 
        open: true, 
        message: 'Morador excluído com sucesso!', 
        severity: 'success' 
      });
    }
  };


const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
  setPage(newPage);
};
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredMoradores = moradores.filter(morador =>
    morador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    morador.unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    morador.cpf.includes(searchTerm) ||
    morador.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMoradores = filteredMoradores.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box className="moradores-container">
      <Container maxWidth="xl">
        <Paper elevation={3} className="moradores-card">
          <Box className="moradores-header">
            <Person className="header-icon" />
            <Typography variant="h4" className="header-title">
              Gestão de Moradores
            </Typography>
          </Box>

          <Box className="moradores-content">
            <Box className="toolbar">
              <TextField
                placeholder="Buscar por nome, unidade, CPF ou email..."
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

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  sx={{ borderRadius: '12px' }}
                >
                  Filtros
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenForm()}
                  className="add-button"
                >
                  Novo Morador
                </Button>
              </Box>
            </Box>

            <TableContainer className="table-container">
              <Table>
                <TableHead className="table-header">
                  <TableRow>
                    <TableCell className="table-header-cell">Morador</TableCell>
                    <TableCell className="table-header-cell">Unidade</TableCell>
                    <TableCell className="table-header-cell">Telefone</TableCell>
                    <TableCell className="table-header-cell">Email</TableCell>
                    <TableCell className="table-header-cell">CPF</TableCell>
                    <TableCell className="table-header-cell">Status</TableCell>
                    <TableCell className="table-header-cell" align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMoradores.length > 0 ? (
                    paginatedMoradores.map((morador) => (
                      <TableRow key={morador.id} className="table-row">
                        <TableCell>
                          <Box className="avatar-cell">
                            <Avatar
                              src={morador.foto || undefined}
                              className="avatar"
                            >
                              {morador.nome.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight="500">
                              {morador.nome}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Home fontSize="small" sx={{ color: '#1976d2' }} />
                            <Typography variant="body2">{morador.unidade}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone fontSize="small" sx={{ color: '#1976d2' }} />
                            <Typography variant="body2">{morador.telefone}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={morador.email}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {morador.email}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Badge fontSize="small" sx={{ color: '#1976d2' }} />
                            <Typography variant="body2">{morador.cpf}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={morador.status.toUpperCase()}
                            color={morador.status === 'ativo' ? 'success' : 'default'}
                            size="small"
                            className="status-chip"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(morador)}
                              sx={{ mr: 1 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMorador(morador)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Box className="empty-state">
                          <Person className="empty-icon" />
                          <Typography variant="h6" className="empty-text">
                            Nenhum morador encontrado
                          </Typography>
                          {searchTerm && (
                            <Button
                              variant="outlined"
                              onClick={() => setSearchTerm('')}
                            >
                              Limpar busca
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredMoradores.length > 0 && (
              <TablePagination
                component="div"
                count={filteredMoradores.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Linhas por página:"
                className="pagination-container"
              />
            )}
          </Box>
        </Paper>
      </Container>

      <MoradorForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveMorador}
        morador={selectedMorador}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default Moradores;
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
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  DirectionsCar,
  Person,
  Palette,
  CalendarToday,
  FilterList,
} from '@mui/icons-material';
import './Veiculos.scss';
import { initialVeiculos, type Veiculo } from '../../services/mockData';
import VeiculoForm from './VeiculoForm';
import { AppStateModal } from '../../shared/components/AppStateModal';
import { useAppStateModal } from '../../shared/utils/useAppStateModal';

const Veiculos: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>(initialVeiculos);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuVeiculo, setMenuVeiculo] = useState<Veiculo | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { appStateModal, handleClose, showSuccess, showError } = useAppStateModal();

  const handleOpenForm = (veiculo?: Veiculo) => {
    return veiculo;
    //TODO - Implementar editar veiculo
/*     setSelectedVeiculo(veiculo || null);
    setOpenForm(true);
    handleCloseMenu(); */
  };

  const handleCloseForm = () => {
    setOpenForm(false);
   // setSelectedVeiculo(null);
  };

  const handleDeleteVeiculo = (veiculo: Veiculo) => {
    try {
      setVeiculos(veiculos.filter(v => v.id !== veiculo.id));
      showSuccess(`Veí­culo ${veiculo.placa} foi deletado com sucesso!`);
      handleCloseMenu();
    } catch {
      showError('Erro ao excluir veí­culo', 'Ocorreu um erro ao deletar o veí­culo.');
    }
  };

  const handleCloseMenu = (): void => {
    setAnchorEl(null);
    setMenuVeiculo(null);
  };

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };



  const safeString = (value: string | undefined): string => {
    return value || '';
  };

  const filteredVeiculos = veiculos.filter(veiculo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      safeString(veiculo.placa).toLowerCase().includes(searchLower) ||
      safeString(veiculo.modelo).toLowerCase().includes(searchLower) ||
      safeString(veiculo.marca).toLowerCase().includes(searchLower) ||
      safeString(veiculo.moradorNome).toLowerCase().includes(searchLower)
    );
  });

  const paginatedVeiculos = filteredVeiculos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box className="veiculos-container">
      <Container maxWidth="xl">
        <Paper elevation={3} className="veiculos-card">
          <Box className="veiculos-header">
            <DirectionsCar className="header-icon" />
            <Typography variant="h4" className="header-title">
              Gestão de Veículos
            </Typography>
            <Typography variant="subtitle1" className="header-subtitle">
              Controle de veículos e vagas do condomínio
            </Typography>
          </Box>

          <Box className="veiculos-content">
            <Box className="toolbar">
              <TextField
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                  },
                }}
                placeholder="Buscar por placa, modelo, marca ou morador..."
                variant="outlined"
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
                  Novo Veículo
                </Button>
              </Box>
            </Box>

            <TableContainer className="table-container">
              <Table>
                <TableHead className="table-header">
                  <TableRow>
                    <TableCell className="table-header-cell">Placa</TableCell>
                    <TableCell className="table-header-cell">Veículo</TableCell>
                    <TableCell className="table-header-cell">Cor/Ano</TableCell>
                    <TableCell className="table-header-cell">Morador</TableCell>
                    <TableCell className="table-header-cell" align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedVeiculos.length > 0 ? (
                    paginatedVeiculos.map((veiculo) => {
                      const placa = veiculo.placa || 'Sem placa';
                      const marca = veiculo.marca || '';
                      const modelo = veiculo.modelo || '';
                      const cor = veiculo.cor || 'Não definida';
                      const ano = veiculo.ano || '';
                      const moradorNome = veiculo.moradorNome || 'Não atribuído';
                      
                      return (
                        <TableRow key={veiculo.id} className="table-row">
                          <TableCell className="placa-cell">
                            <span className="placa-badge">
                              {placa}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                             
                              <Box>
                                <Typography variant="body2" fontWeight="600">
                                  {marca} {modelo}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Palette fontSize="small" sx={{ color: '#1976d2' }} />
                                <Typography variant="body2">{cor}</Typography>
                              </Box>
                              {ano && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarToday fontSize="small" sx={{ color: '#1976d2' }} />
                                  <Typography variant="body2">{ano}</Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" sx={{ color: '#1976d2' }} />
                              <Typography variant="body2">
                                {moradorNome}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenForm(veiculo)}
                                sx={{ mr: 1 }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteVeiculo(veiculo)}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Box className="empty-state">
                          <DirectionsCar className="empty-icon" />
                          <Typography variant="h6" className="empty-text">
                            Nenhum veículo encontrado
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

            {filteredVeiculos.length > 0 && (
              <TablePagination
                component="div"
                count={filteredVeiculos.length}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => menuVeiculo && handleOpenForm(menuVeiculo)}>
          <Edit fontSize="small" style={{ marginRight: 8 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => menuVeiculo && handleDeleteVeiculo(menuVeiculo)}>
          <Delete fontSize="small" style={{ marginRight: 8 }} />
          Excluir
        </MenuItem>
      </Menu>

      <VeiculoForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={()=>{}}
        veiculo={null}
      />

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        item={appStateModal.item}
        onConfirm={handleClose}
        onClose={handleClose}
      />
    </Box>
  );
};

export default Veiculos;





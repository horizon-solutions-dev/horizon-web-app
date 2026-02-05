import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Phone,
  Home,
  Badge,
  FilterList,
} from "@mui/icons-material";
import MoradorForm from "./MoradorForm";
import CardList from "../../shared/components/CardList";
import "./Moradores.scss";

export interface Morador {
  id?: string;
  nome: string;
  cpf: string;
  unidade: string;
  telefone: string;
  email: string;
  foto?: string | null;
  status: "ativo" | "inativo";
}

const pageSize = 10;

const Moradores: React.FC = () => {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedMorador, setSelectedMorador] = useState<Morador | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Buscar moradores na API
  useEffect(() => {
    loadMoradores();
  }, []);

  const loadMoradores = async () => {
    try {
      setLoading(true);
      // TODO: Implementar quando API estiver disponivel
      setMoradores([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Erro ao carregar moradores!",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (morador?: Morador) => {
    setSelectedMorador(morador || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedMorador(null);
  };

  const handleSaveMorador = async () => {
    try {
      // TODO: Implementar quando API estiver disponivel
      setSnackbar({
        open: true,
        message: "Morador salvo com sucesso!",
        severity: "success",
      });
      handleCloseForm();
      loadMoradores();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Erro ao salvar morador!",
        severity: "error",
      });
    }
  };

  const handleDeleteMorador = async (morador: Morador) => {
    if (window.confirm(`Deseja realmente excluir o morador ${morador.nome}?`)) {
      try {
        // TODO: Implementar quando API estiver disponivel
        setSnackbar({
          open: true,
          message: "Morador excluido com sucesso!",
          severity: "success",
        });
        await loadMoradores();
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Erro ao excluir morador!",
          severity: "error",
        });
      }
    }
  };

  const filteredMoradores = moradores.filter((morador) =>
    [morador.nome, morador.unidade, morador.cpf, morador.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredMoradores.length / pageSize));
  const paginatedMoradores = filteredMoradores.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize,
  );

  return (
    <Box className="moradores-container">
      <Container maxWidth="xl">
        <Paper elevation={3} className="moradores-card">
          <Box className="moradores-header">
            <Person className="header-icon" />
            <Typography variant="h4" className="header-title">
              Gestao de Moradores
            </Typography>
          </Box>

          <Box className="moradores-content">
            <Box className="toolbar">
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  sx={{ borderRadius: "12px" }}
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

            {loading ? (
              <Typography variant="body2">Carregando...</Typography>
            ) : (
              <CardList
                title="Moradores"
                showTitle={false}
                searchPlaceholder="Buscar morador..."
                onSearchChange={(value) => {
                  setSearchTerm(value);
                  setPage(1);
                }}
                showFilters={false}
                onAddClick={() => handleOpenForm()}
                addLabel="Novo"
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                page={page}
                totalPages={totalPages}
                onPageChange={(value) => setPage(value)}
                items={paginatedMoradores.map((morador, index) => ({
                  id: morador.id || `${morador.nome}-${index}`,
                  title: morador.nome,
                  subtitle: (
                    <>
                      <Home sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                      {morador.unidade}
                    </>
                  ),
                  meta: (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Phone sx={{ fontSize: 14 }} />
                        {morador.telefone}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Badge sx={{ fontSize: 14 }} />
                        {morador.cpf}
                      </Box>
                      <Chip
                        label={morador.status.toUpperCase()}
                        color={morador.status === "ativo" ? "success" : "default"}
                        size="small"
                        className="status-chip"
                      />
                    </>
                  ),
                  actions: (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit sx={{ fontSize: "16px !important" }} />}
                        onClick={() => handleOpenForm(morador)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete sx={{ fontSize: "16px !important" }} />}
                        onClick={() => handleDeleteMorador(morador)}
                      >
                        Excluir
                      </Button>
                    </Box>
                  ),
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
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

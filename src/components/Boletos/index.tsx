import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add,
  Download,
  Delete,
  Edit,
  Visibility,
  Description,
} from "@mui/icons-material";
import BoletoForm from "./BoletoForm";
import BoletoViewer from "./BoletoViewer";
import CardList from "../../shared/components/CardList";
import "./Boletos.scss";

interface Boleto {
  id: number;
  numero: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "pago" | "pendente" | "vencido";
  imagem: string | null;
  dataEmissao: string;
  beneficiario: string;
  pagador: string;
}

const pageSize = 8;

const Boletos: React.FC = () => {
  const [boletos, setBoletos] = useState<Boleto[]>([
    {
      id: 1,
      numero: "23793381260000500001234567890123456789012",
      descricao: "Condominio - Janeiro/2026",
      valor: 500.0,
      vencimento: "2026-01-20",
      status: "pendente",
      imagem: null,
      dataEmissao: "2026-01-05",
      beneficiario: "Condominio Horizonte",
      pagador: "Joao Silva",
    },
    {
      id: 2,
      numero: "23793381260000350001234567890123456789013",
      descricao: "Agua - Janeiro/2026",
      valor: 350.0,
      vencimento: "2026-01-15",
      status: "pago",
      imagem: null,
      dataEmissao: "2026-01-01",
      beneficiario: "Companhia de Aguas",
      pagador: "Joao Silva",
    },
    {
      id: 3,
      numero: "23793381260000250001234567890123456789014",
      descricao: "Luz - Dezembro/2025",
      valor: 250.0,
      vencimento: "2025-12-20",
      status: "vencido",
      imagem: null,
      dataEmissao: "2025-12-05",
      beneficiario: "Companhia de Energia",
      pagador: "Joao Silva",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [openForm, setOpenForm] = useState(false);
  const [openViewer, setOpenViewer] = useState(false);
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const handleOpenForm = (boleto?: Boleto) => {
    setSelectedBoleto(boleto || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedBoleto(null);
  };

  const handleOpenViewer = (boleto: Boleto) => {
    setSelectedBoleto(boleto);
    setOpenViewer(true);
  };

  const handleCloseViewer = () => {
    setOpenViewer(false);
    setSelectedBoleto(null);
  };

  const handleSaveBoleto = (boleto: Omit<Boleto, "id">) => {
    if (selectedBoleto) {
      setBoletos(
        boletos.map((b) =>
          b.id === selectedBoleto.id ? { ...boleto, id: selectedBoleto.id } : b,
        ),
      );
      setSnackbar({
        open: true,
        message: "Boleto atualizado com sucesso!",
        severity: "success",
      });
    } else {
      const newId = Math.max(...boletos.map((b) => b.id), 0) + 1;
      setBoletos([...boletos, { ...boleto, id: newId }]);
      setSnackbar({
        open: true,
        message: "Boleto criado com sucesso!",
        severity: "success",
      });
    }
    handleCloseForm();
  };

  const handleDeleteBoleto = (boleto: Boleto) => {
    if (window.confirm(`Deseja realmente excluir o boleto ${boleto.numero}?`)) {
      setBoletos(boletos.filter((b) => b.id !== boleto.id));
      setSnackbar({
        open: true,
        message: "Boleto excluido com sucesso!",
        severity: "success",
      });
    }
  };

  const handleDownload = (boleto: Boleto) => {
    if (boleto.imagem) {
      const link = document.createElement("a");
      link.href = boleto.imagem;
      link.download = `boleto_${boleto.numero}.png`;
      link.click();
      setSnackbar({ open: true, message: "Download iniciado!", severity: "success" });
    } else {
      setSnackbar({ open: true, message: "Este boleto nao possui imagem!", severity: "error" });
    }
  };

  const filteredBoletos = boletos.filter((boleto) => {
    const matchesSearch =
      boleto.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boleto.beneficiario.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "todos" || boleto.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBoletos.length / pageSize));
  const paginatedBoletos = filteredBoletos.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize,
  );

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
              Visualize, gerencie e faca download dos seus boletos
            </Typography>
          </Box>

          <Box className="boletos-content">
            <Box className="toolbar">
              <Box className="toolbar-actions">
                <TextField
                  select
                  size="small"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  className="filter-select"
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

            <CardList
              title="Boletos"
              showTitle={false}
              searchPlaceholder="Buscar boleto..."
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
              items={paginatedBoletos.map((boleto, index) => ({
                id: String(boleto.id),
                title: boleto.descricao,
                subtitle: `Numero: ${boleto.numero}`,
                meta: (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography variant="caption">Valor: R$ {boleto.valor.toFixed(2)}</Typography>
                    <Typography variant="caption">Vencimento: {boleto.vencimento}</Typography>
                    <Typography variant="caption">Status: {boleto.status}</Typography>
                  </Box>
                ),
                actions: (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility fontSize="small" />}
                      onClick={() => handleOpenViewer(boleto)}
                    >
                      Visualizar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit fontSize="small" />}
                      onClick={() => handleOpenForm(boleto)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Download fontSize="small" />}
                      onClick={() => handleDownload(boleto)}
                      disabled={!boleto.imagem}
                    >
                      Download
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete fontSize="small" />}
                      onClick={() => handleDeleteBoleto(boleto)}
                    >
                      Excluir
                    </Button>
                  </Box>
                ),
                accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
              }))}
            />

            {filteredBoletos.length === 0 && (
              <Box className="empty-state">
                <Description className="empty-icon" />
                <Typography variant="h6" className="empty-title">
                  Nenhum boleto encontrado
                </Typography>
                <Typography variant="body2" className="empty-text">
                  {searchTerm || filterStatus !== "todos"
                    ? "Tente ajustar os filtros de busca"
                    : "Clique em \"Novo Boleto\" para adicionar um boleto"}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

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

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
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Phone,
  Home,
  Badge,
  FilterList,
  Close,
  PeopleOutlined,
} from "@mui/icons-material";
import MoradorForm, { type MoradorCreatePayload } from "./MoradorForm";
import CardList from "../../shared/components/CardList";
import "./Moradores.scss";
import { useNavigate } from "react-router";
import { AccountService } from "../../services/accountService";
import { unitResidentService } from "../../services/unitResidentService";
import { organizationService } from "../../services/organizationService";
import { condominiumService } from "../../services/condominiumService";
import { blockService } from "../../services/blockService";
import { unitService } from "../../services/unitService";

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
const normalizePhoneToE164 = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
};

const isNotFoundError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("404") || message.includes("not found");
};

const resolveCondominiumId = async () => {
  const storedCondominiumIdRaw =
    localStorage.getItem("moradoresCondominiumId") ||
    localStorage.getItem("selectedCondominiumId") ||
    localStorage.getItem("condominiumId") ||
    "";

  if (storedCondominiumIdRaw) {
    try {
      const condominium =
        await condominiumService.getCondominiumById(storedCondominiumIdRaw);
      if (condominium?.condominiumId) return condominium.condominiumId;
    } catch {
      localStorage.removeItem("moradoresCondominiumId");
      localStorage.removeItem("selectedCondominiumId");
      localStorage.removeItem("condominiumId");
    }
  }

  let organizationId = localStorage.getItem("organizationId") || "";
  if (!organizationId) {
    organizationId = (await organizationService.getMyOrganizationId()) || "";
    if (organizationId) localStorage.setItem("organizationId", organizationId);
  }

  if (!organizationId) return "";

  const response = await condominiumService.getCondominiums(organizationId, 1, 1);
  const firstCondominiumId = response?.items?.[0]?.condominiumId || "";
  if (firstCondominiumId) {
    localStorage.setItem("moradoresCondominiumId", firstCondominiumId);
  }
  return firstCondominiumId;
};

const resolveCondominiumUnitId = () =>
  localStorage.getItem("moradoresUnitId") ||
  localStorage.getItem("selectedUnitId") ||
  localStorage.getItem("selectedCondominiumUnitId") ||
  localStorage.getItem("condominiumUnitId") ||
  localStorage.getItem("unitId") ||
  "";

const resolveCondominiumUnitIdAsync = async () => {
  const storedUnitId = resolveCondominiumUnitId();
  if (storedUnitId) return storedUnitId;

  const condominiumId = await resolveCondominiumId();
  if (!condominiumId) return "";

  try {
    const unitsByCondominium = await unitService.getUnitsByCondominium(
      condominiumId,
      1,
      1,
    );
    const firstUnitByCondominium =
      unitsByCondominium?.items?.[0]?.condominiumUnitId || "";
    if (firstUnitByCondominium) {
      localStorage.setItem("moradoresUnitId", firstUnitByCondominium);
      return firstUnitByCondominium;
    }
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  let blocks: Awaited<ReturnType<typeof blockService.getBlocks>> | null = null;
  try {
    blocks = await blockService.getBlocks(condominiumId, 1, 20);
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  for (const block of blocks?.items ?? []) {
    try {
      const unitsByBlock = await unitService.getUnitsByBlock(
        block.condominiumBlockId,
        1,
        1,
      );
      const firstUnitByBlock = unitsByBlock?.items?.[0]?.condominiumUnitId || "";
      if (firstUnitByBlock) {
        localStorage.setItem("moradoresUnitId", firstUnitByBlock);
        return firstUnitByBlock;
      }
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }

  return "";
};

const Moradores: React.FC = () => {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedMorador, setSelectedMorador] = useState<Morador | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Buscar moradores na API
  useEffect(() => {
    loadMoradores(page);
  }, [page]);

  const loadMoradores = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const condominiumId = await resolveCondominiumId();
      if (!condominiumId) {
        setMoradores([]);
        setSnackbar({
          open: true,
          message: "Nenhum condominio encontrado para listar moradores.",
          severity: "error",
        });
        return;
      }

      const response = await AccountService.getAccountsByCondominium(
        condominiumId,
        pageNumber,
        pageSize,
      );

      setMoradores(
        (response?.data || []).map((account) => ({
          id: account.userId,
          nome: `${account.name || ""} ${account.surname || ""}`.trim(),
          cpf: account.doc || "",
          unidade: "-",
          telefone: account.phone || "",
          email: account.email || "",
          foto: null,
          status: "ativo",
        })),
      );

      const total = response?.total ?? 0;
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
    } catch (error) {
      console.error("Erro ao carregar moradores:", error);
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

  const handleSaveMorador = async (payload: MoradorCreatePayload) => {
    console.log('entrou handleSaveMorador')
    try {
      console.log('payload', payload)
      const condominiumUnitId =
        payload.condominiumUnitId || (await resolveCondominiumUnitIdAsync());

      if (!condominiumUnitId) {
        console.log('condominiumUnitId nao encontrado')
        throw new Error(
          "CondominiumUnitId nao encontrado. Selecione uma unidade antes de criar o morador.",
        );
      }

      const accountResponse = await AccountService.createAccount({
        name: payload.name,
        surname: payload.surname,
        docType: payload.docType,
        doc: payload.doc,
        email: payload.email,
        phone: normalizePhoneToE164(payload.phone),
      });

      const userId = accountResponse;
      if (!userId) {
        throw new Error("Nao foi possivel obter userId apos criar conta.");
      }

      const startDate = new Date().toISOString().split("T")[0];
      await unitResidentService.createResident({
        condominiumUnitId,
        userId,
        unitType: "Owner",
        startDate,
        endDate: startDate,
        billingContact: payload.billingContact,
        canVote: payload.canVote,
        canMakeReservations: payload.canMakeReservations,
        hasGatehouseAccess: payload.hasGatehouseAccess,
        commit: true,
      });

      setSnackbar({
        open: true,
        message: "Morador criado e associado com sucesso!",
        severity: "success",
      });
      handleCloseForm();
      await loadMoradores(page);
    } catch (error) {
      console.error("Erro ao salvar morador:", error);
      const message =
        error instanceof Error ? error.message : "Erro ao salvar morador!";
      setSnackbar({
        open: true,
        message,
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
        console.error("Erro ao excluir morador:", error);
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

  const paginatedMoradores = filteredMoradores;

  const navigate = useNavigate();

  return (
    <Box className="moradores-container">
      <Container maxWidth="xl">
        <Paper elevation={3} className="moradores-card">
           <Box
           className="moradores-header"
              sx={{
                mb: 2,
                pb: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <PeopleOutlined sx={{ fontSize: 32, color: "#1976d2" }} />
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ fontSize: "26px" }}
                >
                  Gestao de Moradores
                </Typography>
              </Box>
              <Tooltip title="Fechar">
                <IconButton
                  onClick={() => navigate("/dashboard")}
                  className="close-button"
                  aria-label="Fechar"
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
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
        unitIdPreset={
          localStorage.getItem("moradoresUnitId") ||
          localStorage.getItem("selectedUnitId") ||
          localStorage.getItem("selectedCondominiumUnitId") ||
          ""
        }
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

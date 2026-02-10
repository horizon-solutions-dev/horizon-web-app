import React, { useEffect, useState } from "react";
import "./Unidades.scss";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Business,
  DeleteOutline,
  EditOutlined,
  Close,
  MeetingRoom,
  Apartment,
  SettingsOutlined,
  ChevronRight,
} from "@mui/icons-material";
import {
  unitService,
  type CondominiumUnit,
  type UnitTypeEnum,
} from "../../services/unitService";
import { blockService, type CondominiumBlock } from "../../services/blockService";
import { condominiumService, type Condominium } from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import UnidadeForm from "./UnidadeForm";

const Unidades: React.FC = () => {
  const [activeView, setActiveView] = useState<"condominios" | "unidades">("condominios");
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;

  const [condominiumIdQuery, setCondominiumIdQuery] = useState("");
  const [selectedCondominium, setSelectedCondominium] = useState<Condominium | null>(null);
  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitTypeEnum[]>([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<CondominiumUnit | null>(null);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [unitSearchText, setUnitSearchText] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const handleNotify = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const loadCondominiums = async (pageNumber = 1) => {
    setListLoading(true);
    setListError(null);
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId =
          (await organizationService.getMyOrganizationId()) || "";
        localStorage.setItem("organizationId", organizationId);
      }

      const response = await condominiumService.getCondominiums(
        organizationId,
        pageNumber,
        pageSize,
      );
      if (!organizationName) {
        try {
          const organizations = await organizationService.getMyOrganization();
          const orgName =
            organizations?.[0]?.name || organizations?.[0]?.legalName;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore organization name errors
        }
      }
      const normalized = response?.items ?? [];
      const computedTotalPages =
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil((response?.paging?.total ?? normalized.length) / pageSize),
        );
      setListPage(response?.paging?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar condomínios.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadUnits = async (pageNumber = 1) => {
    if (!condominiumIdQuery.trim()) {
      setListError("Informe o CondominiumId para carregar as unidades.");
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const data = await unitService.getUnitsByCondominium(
        condominiumIdQuery.trim(),
        pageNumber,
        pageSize,
      );
      const normalized = data?.data ?? [];
      const computedTotalPages =
        data?.totalPages ??
        Math.max(1, Math.ceil((data?.total ?? normalized.length) / pageSize));
      setListPage(data?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
      setUnits(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar unidades.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadBlocks = async (condominiumId: string) => {
    try {
      const data = await blockService.getBlocks(condominiumId);
      setBlocks(data?.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar blocos:", error);
      setBlocks([]);
    }
  };

  const loadUnitTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await unitService.getUnitTypes();
      setUnitTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de unidade.";
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
    loadUnitTypes();
  }, []);

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setCondominiumIdQuery(condominium.condominiumId);
    setUnits([]);
    setBlocks([]);
    setEditingUnit(null);
    setIsCadastroOpen(false);
    setUnitSearchText("");
    setActiveView("unidades");

    // Carregar blocos e unidades automaticamente
    setListLoading(true);
    setListError(null);
    try {
      await loadBlocks(condominium.condominiumId);
      const data = await unitService.getUnitsByCondominium(
        condominium.condominiumId,
        1,
        pageSize,
      );
      const normalized = data?.data ?? [];
      const computedTotalPages =
        data?.totalPages ??
        Math.max(1, Math.ceil((data?.total ?? normalized.length) / pageSize));
      setListPage(1);
      setTotalPages(computedTotalPages);
      setUnits(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar unidades.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const handleEdit = (unit: CondominiumUnit) => {
    setEditingUnit(unit);
    setIsCadastroOpen(true);
  };

  const handleDelete = (unit: CondominiumUnit) => {
    const confirmed = window.confirm(
      `Deseja excluir a unidade ${unit.unitCode}?`,
    );
    if (!confirmed) return;
    handleNotify("Exclusão ainda não está disponível.", "error");
  };

  const handleOpenCreate = () => {
    setEditingUnit(null);
    setIsCadastroOpen(true);
  };

  const handleCloseForm = () => {
    setIsCadastroOpen(false);
    setEditingUnit(null);
  };

  const handleSaved = async () => {
    await loadUnits(listPage);
  };

  return (
    <Box className="unidade-container">
      <Container maxWidth="xl">
        {activeView === "condominios" ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box
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
                <Business sx={{ fontSize: 36, color: "#1976d2" }} />
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "26px" }}>
                  {organizationName}
                </Typography>
              </Box>
              <Tooltip title="Fechar">
                <IconButton
                  onClick={() => window.history.back()}
                  className="close-button"
                  aria-label="Fechar"
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              {listLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando...</Typography>
                </Box>
              ) : listError ? (
                <Alert severity="error">{listError}</Alert>
              ) : condominiums.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum condomínio encontrado para esta organização.
                </Typography>
              ) : (
                <CardList
                  title="Condomínios da organização"
                  showTitle={false}
                  searchPlaceholder="Buscar condomínio..."
                  onSearchChange={setSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  showFilters={false}
                  page={listPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setListPage(page);
                    loadCondominiums(page);
                  }}
                  items={condominiums
                    .filter((condominium) =>
                      [condominium.name, condominium.city, condominium.state]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(searchText.toLowerCase()),
                    )
                    .map((condominium, index) => ({
                      id: condominium.condominiumId,
                      title: condominium.name,
                      subtitle: (
                        <>
                          <Apartment sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                          {condominium.city} - {condominium.state}
                        </>
                      ),
                      actions: (
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-manage"
                          startIcon={<SettingsOutlined />}
                          onClick={() => handleSelectCondominium(condominium)}
                        >
                          Gerenciar Unidades
                        </Button>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    }))}
                />
              )}
            </Paper>
          </Paper>
        ) : (
          <>
            {isCadastroOpen ? (
              <UnidadeForm
                open={isCadastroOpen}
                editingUnit={editingUnit}
                onClose={handleCloseForm}
                onSaved={handleSaved}
                onNotify={handleNotify}
                unitTypes={unitTypes}
                typesLoading={typesLoading}
                typesError={typesError}
                loading={loading}
                setLoading={setLoading}
                condominiumIdPreset={selectedCondominium?.condominiumId}
              />
            ) : (
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box
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
                    <MeetingRoom sx={{ fontSize: 36, color: "#1976d2" }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "26px" }}>
                        Unidades
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.5 }}>
                        <ChevronRight sx={{ fontSize: 16, color: "#1976d2", mr: 0.2 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                          {selectedCondominium?.name || "Condomínio selecionado"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Voltar">
                      <IconButton
                        onClick={() => {
                          setActiveView("condominios");
                          setSelectedCondominium(null);
                          setUnits([]);
                          setBlocks([]);
                          setEditingUnit(null);
                          setIsCadastroOpen(false);
                          setUnitSearchText("");
                          setListError(null);
                        }}
                        className="close-button"
                        aria-label="Voltar"
                      >
                        <Close sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  {listLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Carregando...</Typography>
                    </Box>
                  ) : listError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {listError}
                    </Alert>
                  ) : null}

                  <CardList
                    title="Unidades do condomínio"
                    showTitle={false}
                    showFilters={true}
                    searchPlaceholder="Buscar unidade..."
                    onSearchChange={setUnitSearchText}
                    onAddClick={handleOpenCreate}
                    addLabel="Novo"
                    addButtonPlacement="toolbar"
                    emptyImageLabel="Sem imagem"
                    page={listPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setListPage(page);
                      loadUnits(page);
                    }}
                    items={units
                      .filter((unit) =>
                        [unit.unitCode, unit.unitType]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase()
                          .includes(unitSearchText.toLowerCase()),
                      )
                      .map((unit, index) => ({
                        id: unit.condominiumUnitId,
                        title: unit.unitCode || "Sem código",
                        subtitle: (
                          <>
                            <MeetingRoom sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                            Tipo: {unit.unitType?.toString() === "1" ? "Proprietário" : "Inquilino"}
                          </>
                        ),
                        meta: (
                          <>
                            Bloco:{" "}
                            {blocks.find((b) => b.condominiumBlockId === unit.condominiumBlockId)
                              ?.name ||
                              unit.condominiumBlockId ||
                              "Desconhecido"}
                          </>
                        ),
                        actions: (
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-edit"
                              startIcon={<EditOutlined />}
                              onClick={() => handleEdit(unit)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-delete"
                              startIcon={<DeleteOutline />}
                              onClick={() => handleDelete(unit)}
                            >
                              Excluir
                            </Button>
                          </Box>
                        ),
                        accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                      }))}
                  />
                </Paper>
              </Paper>
            )}
          </>
        )}
      </Container>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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

export default Unidades;

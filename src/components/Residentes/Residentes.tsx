import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  MenuItem,
  IconButton,
} from "@mui/material";
<<<<<<< HEAD
import { PeopleOutlined, ArrowBack } from "@mui/icons-material";
=======
import { ArrowBack, PeopleOutlined } from "@mui/icons-material";
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
import {
  unitResidentService,
  type CondominiumUnitResident,
} from "../../services/unitResidentService";
import {
  unitService,
  type CondominiumUnit,
} from "../../services/unitService";
<<<<<<< HEAD
import { blockService, type CondominiumBlock } from "../../services/blockService";
import { condominiumService, type Condominium } from "../../services/condominiumService";
=======
import {
  blockService,
  type CondominiumBlock,
} from "../../services/blockService";
import {
  condominiumService,
  type Condominium,
} from "../../services/condominiumService";
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import ResidenteForm from "./ResidenteForm";

<<<<<<< HEAD
const pageSize = 4;

const Residentes: React.FC = () => {
  const [activeView, setActiveView] = useState<"condominios" | "unidades" | "residentes">(
    "condominios",
  );
=======
const condoPageSize = 4;
const unitPageSize = 6;
const residentPageSize = 6;

const Residentes: React.FC = () => {
  const [activeView, setActiveView] =
    useState<"condominios" | "unidades" | "residentes">("condominios");

>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [condoLoading, setCondoLoading] = useState(false);
  const [condoError, setCondoError] = useState<string | null>(null);
  const [condoSearchText, setCondoSearchText] = useState("");
  const [condoPage, setCondoPage] = useState(1);
  const [condoTotalPages, setCondoTotalPages] = useState(1);
<<<<<<< HEAD

  const [selectedCondominium, setSelectedCondominium] = useState<Condominium | null>(
    null,
  );
  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [blocks, setBlocks] = useState<{ data: CondominiumBlock[]; success: boolean }>(
    { data: [], success: false },
  );
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [unitSearchText, setUnitSearchText] = useState("");
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsTotalPages, setUnitsTotalPages] = useState(1);

  const [selectedUnit, setSelectedUnit] = useState<CondominiumUnit | null>(null);
=======
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);

  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [blocks, setBlocks] = useState<{
    data: CondominiumBlock[];
    success: boolean;
  }>({ data: [], success: false });
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedBlockName, setSelectedBlockName] = useState("");
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [unitSearchText, setUnitSearchText] = useState("");
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsTotalPages, setUnitsTotalPages] = useState(1);
  const [selectedUnit, setSelectedUnit] =
    useState<CondominiumUnit | null>(null);

>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  const [residents, setResidents] = useState<CondominiumUnitResident[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [residentsError, setResidentsError] = useState<string | null>(null);
  const [residentSearchText, setResidentSearchText] = useState("");
<<<<<<< HEAD
=======
  const [residentsPage, setResidentsPage] = useState(1);
  const [residentsTotalPages, setResidentsTotalPages] = useState(1);

>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setCondoLoading(true);
    setCondoError(null);
<<<<<<< HEAD
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId = (await organizationService.getMyOrganizationId()) || "";
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
          const orgName = organizations?.[0]?.name || organizations?.[0]?.legalName;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore organization name errors
        }
      }
      const normalized = response?.data ?? [];
      const computedTotalPages =
        response?.totalPages ??
        Math.max(1, Math.ceil((response?.total ?? normalized.length) / pageSize));
      setCondoPage(response?.pageNumber ?? pageNumber);
      setCondoTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar condominios.";
      setCondoError(message);
    } finally {
      setCondoLoading(false);
    }
  };

  const loadBlocks = async (condominiumId: string) => {
    try {
      const data = await blockService.getBlocks(condominiumId);
      if (data.success) {
        setBlocks(data);
      } else {
        setBlocks({ data: [], success: false });
      }
    } catch (error) {
      console.error("Erro ao carregar blocos:", error);
      setBlocks({ data: [], success: false });
    }
  };

  const loadUnits = async (
    blockIdOverride?: string,
    pageNumber = 1,
    condominiumIdOverride?: string,
  ) => {
    const condominiumId = condominiumIdOverride ?? selectedCondominium?.condominiumId;
    if (!condominiumId) {
      setUnitsError("Selecione um condominio para carregar as unidades.");
      return;
    }

    const blockId = blockIdOverride !== undefined ? blockIdOverride : selectedBlockId;
    setUnitsLoading(true);
    setUnitsError(null);
    try {
      const data = blockId
        ? await unitService.getUnitsByBlock(blockId, pageNumber, pageSize)
        : await unitService.getUnitsByCondominium(condominiumId, pageNumber, pageSize);
      const normalized = data?.data ?? [];
      const computedTotalPages =
        data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? normalized.length) / pageSize));
      setUnitsPage(data?.pageNumber ?? pageNumber);
      setUnitsTotalPages(computedTotalPages);
      setUnits(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar unidades.";
      setUnitsError(message);
    } finally {
      setUnitsLoading(false);
    }
  };

  const loadResidents = async (pageNumber = 1, unitIdOverride?: string) => {
    const unitId = unitIdOverride ?? selectedUnit?.condominiumUnitId;
    if (!unitId) {
      setResidentsError("Selecione uma unidade para carregar os residentes.");
      return;
    }

    setResidentsLoading(true);
    setResidentsError(null);
    try {
      const data = await unitResidentService.getResidents(
        unitId,
=======
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId = (await organizationService.getMyOrganizationId()) || "";
        localStorage.setItem("organizationId", organizationId);
      }

      const response = await condominiumService.getCondominiums(
        organizationId,
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
        pageNumber,
        condoPageSize,
      );
<<<<<<< HEAD
      setResidents(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar residentes.";
      setResidentsError(message);
    } finally {
      setResidentsLoading(false);
    }
  };

=======
      if (!organizationName) {
        try {
          const organizations = await organizationService.getMyOrganization();
          const orgName = organizations?.[0]?.name || organizations?.[0]?.legalName;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore
        }
      }
      const normalized = response?.data ?? [];
      const computedTotalPages =
        response?.totalPages ??
        Math.max(1, Math.ceil((response?.total ?? normalized.length) / condoPageSize));
      setCondoPage(response?.pageNumber ?? pageNumber);
      setCondoTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar condominios.";
      setCondoError(message);
    } finally {
      setCondoLoading(false);
    }
  };

  const loadBlocks = async (condominiumId: string) => {
    try {
      const data = await blockService.getBlocks(condominiumId);
      if (data.success) {
        setBlocks(data);
      } else {
        setBlocks({ data: [], success: false });
      }
    } catch {
      setBlocks({ data: [], success: false });
    }
  };

  const loadUnits = async (condominiumId: string, blockId?: string, pageNumber = 1) => {
    setUnitsLoading(true);
    setUnitsError(null);
    try {
      const data = blockId
        ? await unitService.getUnitsByBlock(blockId, pageNumber, unitPageSize)
        : await unitService.getUnitsByCondominium(condominiumId, pageNumber, unitPageSize);
      const normalized = data?.data ?? [];
      const computedTotalPages =
        data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? normalized.length) / unitPageSize));
      setUnitsPage(data?.pageNumber ?? pageNumber);
      setUnitsTotalPages(computedTotalPages);
      setUnits(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar unidades.";
      setUnitsError(message);
    } finally {
      setUnitsLoading(false);
    }
  };

  const loadResidents = async (unitId: string, pageNumber = 1) => {
    if (!unitId) {
      setResidentsError("Selecione uma unidade.");
      return;
    }
    setResidentsLoading(true);
    setResidentsError(null);
    try {
      const data = await unitResidentService.getResidents(
        unitId,
        pageNumber,
        residentPageSize,
      );
      const normalized = data ?? [];
      const totalPages = Math.max(1, Math.ceil(normalized.length / residentPageSize));
      setResidentsPage(pageNumber);
      setResidentsTotalPages(totalPages);
      setResidents(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar residentes.";
      setResidentsError(message);
    } finally {
      setResidentsLoading(false);
    }
  };

>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  useEffect(() => {
    loadCondominiums(1);
  }, []);

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setSelectedBlockId("");
<<<<<<< HEAD
    setSelectedUnit(null);
    setResidents([]);
    setResidentSearchText("");
    setUnits([]);
    setUnitSearchText("");
    setUnitsPage(1);
    setUnitsTotalPages(1);
    setUnitsError(null);
    setResidentsError(null);
    setActiveView("unidades");
    await loadBlocks(condominium.condominiumId);
    await loadUnits("", 1, condominium.condominiumId);
=======
    setSelectedBlockName("");
    setUnits([]);
    setUnitsError(null);
    setUnitSearchText("");
    setUnitsPage(1);
    setSelectedUnit(null);
    setResidents([]);
    setResidentsError(null);
    setResidentSearchText("");
    setActiveView("unidades");
    await loadBlocks(condominium.condominiumId);
    await loadUnits(condominium.condominiumId, undefined, 1);
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  };

  const handleSelectUnit = async (unit: CondominiumUnit) => {
    setSelectedUnit(unit);
<<<<<<< HEAD
    setResidentSearchText("");
    setResidents([]);
    setResidentsError(null);
    setActiveView("residentes");
    await loadResidents(1, unit.condominiumUnitId);
=======
    setResidents([]);
    setResidentsError(null);
    setResidentSearchText("");
    setResidentsPage(1);
    setActiveView("residentes");
    await loadResidents(unit.condominiumUnitId, 1);
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  };

  const handleOpenCreate = () => {
    if (!selectedUnit) {
      setResidentsError("Selecione uma unidade para cadastrar residentes.");
      return;
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSaved = async () => {
<<<<<<< HEAD
    await loadResidents(1);
=======
    if (selectedUnit) {
      await loadResidents(selectedUnit.condominiumUnitId, residentsPage);
    }
  };

  const getUnitTypeLabel = (value?: string) => {
    if (!value) return "-";
    if (value === "1" || value.toLowerCase() === "owner") return "Proprietario";
    if (value === "2" || value.toLowerCase() === "tenant") return "Inquilino";
    return value;
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
  };

  const getUnitTypeLabel = (value?: string) => {
    if (!value) return "-";
    if (value === "1" || value === "Owner") return "Proprietario";
    if (value === "2" || value === "Tenant") return "Inquilino";
    return value;
  };

  const getResidentPermissions = (resident: CondominiumUnitResident) => {
    const labels = [
      resident.billingContact ? "Cobranca" : null,
      resident.canVote ? "Voto" : null,
      resident.canMakeReservations ? "Reservas" : null,
      resident.hasGatehouseAccess ? "Portaria" : null,
    ].filter(Boolean);
    return labels.length > 0 ? `Permissoes: ${labels.join(" • ")}` : "Sem permissoes";
  };

  const selectedBlockName =
    blocks.data.find((block) => block.condominiumBlockId === selectedUnit?.condominiumBlockId)
      ?.name || "";

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {activeView === "condominios" ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <PeopleOutlined sx={{ fontSize: 32, color: "#1976d2" }} />
              <Typography variant="h4">{organizationName || "Residentes"}</Typography>
            </Box>

            {condoLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : condoError ? (
              <Alert severity="error">{condoError}</Alert>
            ) : (
              <CardList
                title="Condominios da organizacao"
                showTitle={false}
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setCondoSearchText}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                page={condoPage}
                totalPages={condoTotalPages}
                onPageChange={(page) => {
                  setCondoPage(page);
                  loadCondominiums(page);
                }}
                items={condominiums
                  .filter((condominium) =>
                    [condominium.name, condominium.city, condominium.state]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase()
                      .includes(condoSearchText.toLowerCase()),
                  )
                  .map((condominium, index) => ({
                    id: condominium.condominiumId,
                    title: condominium.name,
                    subtitle: (
                      <Typography variant="body2" color="text.secondary">
                        {condominium.city} - {condominium.state}
                      </Typography>
                    ),
                    accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    actions: (
                      <Button
                        size="small"
                        variant="outlined"
<<<<<<< HEAD
=======
                        className="action-button-manage"
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
                        onClick={() => handleSelectCondominium(condominium)}
                      >
                        Ver unidades
                      </Button>
                    ),
                  }))}
              />
            )}
          </Paper>
        ) : activeView === "unidades" ? (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <IconButton
                onClick={() => {
                  setActiveView("condominios");
                  setSelectedCondominium(null);
                  setUnits([]);
                  setBlocks({ data: [], success: false });
                  setSelectedBlockId("");
<<<<<<< HEAD
=======
                  setSelectedBlockName("");
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
                  setSelectedUnit(null);
                  setResidents([]);
                  setUnitsError(null);
                  setResidentsError(null);
                }}
              >
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h5">Unidades</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCondominium?.name || "Condominio selecionado"}
                </Typography>
              </Box>
            </Box>

            {unitsLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : unitsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {unitsError}
              </Alert>
            ) : null}

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <TextField
                label="Filtrar por bloco"
                select
                value={selectedBlockId}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSelectedBlockId(value);
<<<<<<< HEAD
                  setUnitSearchText("");
                  setUnitsPage(1);
                  await loadUnits(value, 1);
=======
                  const blockName =
                    blocks.data.find((block) => block.condominiumBlockId === value)?.name ||
                    "";
                  setSelectedBlockName(blockName);
                  setUnitSearchText("");
                  setUnitsPage(1);
                  if (selectedCondominium) {
                    await loadUnits(selectedCondominium.condominiumId, value || undefined, 1);
                  }
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
                }}
                fullWidth
              >
                <MenuItem value="">Todos os blocos</MenuItem>
                {blocks.data.map((block) => (
                  <MenuItem key={block.condominiumBlockId} value={block.condominiumBlockId}>
                    {block.name || block.code || block.condominiumBlockId}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <CardList
              title="Unidades do condominio"
              showTitle={false}
              showFilters={false}
              searchPlaceholder="Buscar unidade..."
              onSearchChange={setUnitSearchText}
              onAddClick={undefined}
              addButtonPlacement="toolbar"
              emptyImageLabel="Sem imagem"
              page={unitsPage}
              totalPages={unitsTotalPages}
              onPageChange={(page) => {
                setUnitsPage(page);
<<<<<<< HEAD
                loadUnits(selectedBlockId || undefined, page);
=======
                if (selectedCondominium) {
                  loadUnits(selectedCondominium.condominiumId, selectedBlockId || undefined, page);
                }
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
              }}
              items={units
                .filter((unit) =>
                  [unit.unitCode, unit.unitType, unit.condominiumBlockId]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(unitSearchText.toLowerCase()),
                )
                .map((unit, index) => ({
                  id: unit.condominiumUnitId,
                  title: unit.unitCode || "Sem codigo",
                  subtitle: (
                    <Typography variant="body2" color="text.secondary">
                      Tipo: {getUnitTypeLabel(unit.unitType?.toString())}
                    </Typography>
                  ),
                  meta: (
                    <Typography variant="caption" color="text.secondary">
                      Bloco:{" "}
                      {blocks.data.find((b) => b.condominiumBlockId === unit.condominiumBlockId)
                        ?.name ||
                        unit.condominiumBlockId ||
                        "Bloco desconhecido"}
                    </Typography>
                  ),
                  actions: (
                    <Button size="small" variant="outlined" onClick={() => handleSelectUnit(unit)}>
                      Ver residentes
                    </Button>
                  ),
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
            />
          </Paper>
        ) : (
          <>
            {isFormOpen ? (
              <ResidenteForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSaved={handleSaved}
                onNotify={handleNotify}
                loading={loading}
                setLoading={setLoading}
                unitIdPreset={selectedUnit?.condominiumUnitId}
              />
            ) : null}
<<<<<<< HEAD
=======

>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
            {!isFormOpen ? (
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <IconButton
                    onClick={() => {
                      setActiveView("unidades");
                      setSelectedUnit(null);
                      setResidents([]);
                      setResidentSearchText("");
                      setResidentsError(null);
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h5">Residentes</Typography>
                    <Typography variant="body2" color="text.secondary">
<<<<<<< HEAD
                      {selectedCondominium?.name || "Condominio"} •{" "}
                      {selectedUnit?.unitCode || selectedUnit?.condominiumUnitId || "Unidade"}
                      {selectedBlockName ? ` • Bloco ${selectedBlockName}` : ""}
=======
                      {selectedCondominium?.name || "Condominio"} â€¢{" "}
                      {selectedUnit?.unitCode ||
                        selectedUnit?.condominiumUnitId ||
                        "Unidade"}
                      {selectedBlockName ? ` â€¢ Bloco ${selectedBlockName}` : ""}
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
                    </Typography>
                  </Box>
                </Box>

                {residentsError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {residentsError}
                  </Alert>
                ) : null}

                {residentsLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Carregando...</Typography>
                  </Box>
                ) : (
                  <CardList
                    title="Residentes"
                    showTitle={false}
                    searchPlaceholder="Buscar residente..."
                    onSearchChange={setResidentSearchText}
                    onAddClick={handleOpenCreate}
                    addLabel="Novo"
                    addButtonPlacement="toolbar"
                    emptyImageLabel="Sem imagem"
                    showFilters={false}
<<<<<<< HEAD
                    showPagination={false}
=======
                    page={residentsPage}
                    totalPages={residentsTotalPages}
                    onPageChange={(page) => {
                      setResidentsPage(page);
                      if (selectedUnit) {
                        loadResidents(selectedUnit.condominiumUnitId, page);
                      }
                    }}
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
                    items={residents
                      .filter((resident) =>
                        [resident.userId, resident.condominiumUnitId]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase()
                          .includes(residentSearchText.toLowerCase()),
                      )
                      .map((resident, index) => ({
                        id: resident.condominiumUnitResidentId,
<<<<<<< HEAD
                        title: resident.userId || "Usuario",
                        subtitle: `Unidade: ${selectedUnit?.unitCode || resident.condominiumUnitId}`,
                        meta: (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Periodo: {resident.startDate || "-"} → {resident.endDate || "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getResidentPermissions(resident)}
                            </Typography>
                          </Box>
                        ),
=======
                        title: resident.userId,
                        subtitle: `Unidade: ${resident.condominiumUnitId}`,
                        meta: `Periodo: ${resident.startDate || "-"} -> ${resident.endDate || "-"}`,
>>>>>>> 1eea27b9c3e9d0285af0b2f3a7a6638006273f39
                        accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                      }))}
                  />
                )}
              </Paper>
            ) : null}
          </>
        )}
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

export default Residentes;

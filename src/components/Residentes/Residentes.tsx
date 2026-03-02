import React, { useEffect, useState } from "react";
import "./Residentes.scss";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Close,
  SettingsOutlined,
  MeetingRoom,
  Person2Sharp,
  Business,
  DeleteOutline,
  EditOutlined,
} from "@mui/icons-material";
import {
  unitResidentService,
  type CondominiumUnitResident,
} from "../../services/unitResidentService";
import { unitService, type CondominiumUnit } from "../../services/unitService";
import {
  blockService,
  type CondominiumBlock,
} from "../../services/blockService";
import {
  condominiumService,
  type Condominium,
} from "../../services/condominiumService";
import { AccountService } from "../../services/accountService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import ResidenteForm from "./ResidenteForm";
import { useNavigate } from "react-router";
import moment from "moment";
import { notify } from "../../shared/utils/toastMessage";
const condoPageSize = 4;
const unitPageSize = 6;
const residentPageSize = 6;

const Residentes: React.FC = () => {
  const [activeView, setActiveView] = useState<
    "condominios" | "unidades" | "residentes"
  >("condominios");

  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [condoLoading, setCondoLoading] = useState(false);
  const [, setCondoError] = useState<string | null>(null);
  const [condoSearchText, setCondoSearchText] = useState("");
  const [condoPage, setCondoPage] = useState(1);
  const [condoTotalPages, setCondoTotalPages] = useState(1);
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);

  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [, setUnitsError] = useState<string | null>(null);
  const [unitSearchText, setUnitSearchText] = useState("");
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsTotalPages, setUnitsTotalPages] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<CondominiumUnit | null>(
    null,
  );
  const [, setSelectedBlockName] = useState("");

  const [residents, setResidents] = useState<CondominiumUnitResident[]>([]);
  const [accountNamesByUserId, setAccountNamesByUserId] = useState<
    Record<string, string>
  >({});
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [, setResidentsError] = useState<string | null>(null);
  const [residentSearchText, setResidentSearchText] = useState("");
  const [residentsPage, setResidentsPage] = useState(1);
  const [residentsTotalPages, setResidentsTotalPages] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleNotify = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    notify({ message, type: severity });
  };

  const loadCondominiums = async (pageNumber = 1) => {
    setCondoLoading(true);
    setCondoError(null);
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
        condoPageSize,
      );
      if (!organizationName) {
        try {
          const organizations = await organizationService.getMyOrganization();
          const nameStorage = localStorage.getItem("condominium");
          const dataParse = nameStorage ? JSON.parse(nameStorage) : null;
          const orgName =
            organizations?.find(
              (o) => o.organizationId === dataParse?.organizationId,
            )?.name || dataParse?.name;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore
        }
      }
      const normalized = response?.items ?? [];
      const computedTotalPages =
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil(
            (response?.paging?.total ?? normalized.length) / condoPageSize,
          ),
        );
      setCondoPage(response?.paging?.pageNumber ?? pageNumber);
      setCondoTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar condominios.";
      setCondoError(message);
    } finally {
      setCondoLoading(false);
    }
  };

  const loadBlocks = async (condominiumId: string) => {
    try {
      const response = await blockService.getBlocks(condominiumId);
      setBlocks(response?.items ?? []);
    } catch {
      setBlocks([]);
    }
  };

  const loadAccountNames = async (condominiumId: string) => {
    try {
      const response = await AccountService.getAccountsByCondominium(
        condominiumId,
        1,
        500,
      );
      const accounts = Array.isArray(response)
        ? response
        : (response?.data ?? []);
      const namesByUserId = accounts.reduce(
        (acc, account) => {
          const userId = String(account?.userId ?? "");
          const fullName =
            `${account?.name ?? ""} ${account?.surname ?? ""}`.trim();
          if (userId && fullName) {
            acc[userId] = fullName;
          }
          return acc;
        },
        {} as Record<string, string>,
      );
      setAccountNamesByUserId(namesByUserId);
    } catch {
      setAccountNamesByUserId({});
    }
  };

  const loadUnits = async (
    condominiumId: string,
    blockId?: string,
    pageNumber = 1,
  ) => {
    setUnitsLoading(true);
    setUnitsError(null);
    try {
      const response = blockId
        ? await unitService.getUnitsByBlock(blockId, pageNumber, unitPageSize)
        : await unitService.getUnitsByCondominium(
            condominiumId,
            pageNumber,
            unitPageSize,
          );
      const normalized = response?.items ?? [];
      const computedTotalPages =
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil(
            (response?.paging?.total ?? normalized.length) / unitPageSize,
          ),
        );
      setUnitsPage(response?.paging?.pageNumber ?? pageNumber);
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
      const response = await unitResidentService.getResidents(
        unitId,
        pageNumber,
        residentPageSize,
      );
      const normalized = response?.items ?? [];
      const totalPages =
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil(
            (response?.paging?.total ?? normalized.length) / residentPageSize,
          ),
        );

      setResidentsPage(response?.paging?.pageNumber ?? pageNumber);
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

  useEffect(() => {
    loadCondominiums(1);
  }, []);

  const resetResidentsContext = () => {
    setSelectedUnit(null);
    setResidents([]);
    setResidentsError(null);
    setResidentSearchText("");
    setResidentsPage(1);
  };

  const resetUnitsContext = () => {
    setUnits([]);
    setBlocks([]);
    setSelectedBlockId("");
    setSelectedBlockName("");
    setUnitsError(null);
    setUnitSearchText("");
    setUnitsPage(1);
    resetResidentsContext();
  };

  const condominiumItems = condominiums
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
          className="action-button-manage"
          startIcon={<SettingsOutlined />}
          onClick={() => handleSelectCondominium(condominium)}
        >
          Visualizar Condomínios
        </Button>
      ),
    }));

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setSelectedBlockId("");
    setSelectedBlockName("");
    setUnits([]);
    setUnitsError(null);
    setUnitSearchText("");
    setUnitsPage(1);
    resetResidentsContext();
    setActiveView("unidades");
    await loadBlocks(condominium.condominiumId);
    await loadAccountNames(condominium.condominiumId);
    await loadUnits(condominium.condominiumId, undefined, 1);
  };

  useEffect(() => {
    loadAccountNames(selectedCondominium?.condominiumId || "");
  }, [residents]);

  const handleSelectUnit = async (unit: CondominiumUnit) => {
    setSelectedUnit(unit);
    setResidents([]);
    setResidentsError(null);
    setResidentSearchText("");
    setResidentsPage(1);
    setActiveView("residentes");
    await loadResidents(unit.condominiumUnitId, 1);
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
    loadResidents(selectedUnit?.condominiumUnitId || "", 1);
  };

  const handleSaved = async () => {
    await loadResidents(selectedUnit?.condominiumUnitId || "", 1);
  };

  const getUnitTypeLabel = (value?: string) => {
    if (!value) return "-";
    if (value === "1" || value === "Owner") return "Proprietario";
    if (value === "2" || value === "Tenant") return "Inquilino";
    return value;
  };

  function handleEdit() {
    return;
  }
  function handleDelete() {
    return;
  }

  const navigate = useNavigate();
  /*   const getResidentPermissions = (resident: CondominiumUnitResident) => {
      const labels = [
        resident.billingContact ? "Cobranca" : null,
        resident.canVote ? "Voto" : null,
        resident.canMakeReservations ? "Reservas" : null,
        resident.hasGatehouseAccess ? "Portaria" : null,
      ].filter(Boolean);
      return labels.length > 0 ? `Permissoes: ${labels.join(" • ")}` : "Sem permissoes";
    }; */

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {activeView === "condominios" ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box
              sx={{
                mb: 2,
                pb: 1.5,
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <Container
                sx={{
                  p: "0 !important",
                  maxWidth: "100vw !important",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Business sx={{ fontSize: 36, color: "#1976d2" }} />
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ fontSize: "26px" }}
                  >
                    {organizationName}
                  </Typography>
                </Box>
                <Tooltip title="Clique aqui para Fechar a janela">
                  <IconButton
                    onClick={() => navigate("/dashboard")}
                    className="close-button"
                    aria-label="Fechar"
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Container>
              <Box>
                <BreadcrumbTrail items={["Organização", "Condomínios"]} />
              </Box>
            </Box>

            {condoLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : (
              <>
                <CardList
                  title="Condominios da organizacao"
                  showTitle={false}
                  searchPlaceholder="Buscar condominio..."
                  onSearchChange={setCondoSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  showPagination={true}
                  page={condoPage}
                  totalPages={condoTotalPages}
                  onPageChange={(page) => {
                    setCondoPage(page);
                    loadCondominiums(page);
                  }}
                  items={condominiumItems}
                />
              </>
            )}
          </Paper>
        ) : activeView === "unidades" ? (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ fontSize: "26px" }}
                  >
                    Residentes
                  </Typography>
                  <BreadcrumbTrail
                    items={[
                      organizationName || "Organização",
                      selectedCondominium?.name || "Condominio selecionado",
                      "Unidades",
                    ]}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Clique aqui para Fechar a janela">
                  <IconButton
                    onClick={() => {
                      setActiveView("condominios");
                      setSelectedCondominium(null);
                      resetUnitsContext();
                      void loadCondominiums(condoPage);
                    }}
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {unitsLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : null}

            <CardList
              title="Unidades do condominio"
              showTitle={false}
              showFilters={true}
              searchPlaceholder="Buscar Unidades..."
              onSearchChange={setUnitSearchText}
              onAddClick={undefined}
              addButtonPlacement="toolbar"
              emptyImageLabel="Sem imagem"
              showPagination={true}
              page={unitsPage}
              totalPages={unitsTotalPages}
              onPageChange={(page) => {
                setUnitsPage(page);
                if (selectedCondominium) {
                  loadUnits(
                    selectedCondominium.condominiumId,
                    selectedBlockId || undefined,
                    page,
                  );
                }
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
                      {blocks.find(
                        (b) => b.condominiumBlockId === unit.condominiumBlockId,
                      )?.name ||
                        unit.condominiumBlockId ||
                        "Bloco desconhecido"}
                    </Typography>
                  ),
                  actions: (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        className="action-button-manage"
                        startIcon={<Person2Sharp />}
                        onClick={() => handleSelectUnit(unit)}
                      >
                        Visualizar Residentes
                      </Button>
                    </Box>
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
                condominiumNamePreset={selectedCondominium?.name}
                blockNamePreset={
                  blocks.find(
                    (b) =>
                      b.condominiumBlockId === selectedUnit?.condominiumBlockId,
                  )?.name || selectedUnit?.condominiumBlockId
                }
                unitCodePreset={selectedUnit?.unitCode}
              />
            ) : null}
            {!isFormOpen ? (
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ fontSize: "26px" }}
                      >
                        Residentes
                      </Typography>
                      <BreadcrumbTrail
                        items={[
                          organizationName || "Organização",
                          selectedCondominium?.name || "Condominio selecionado",
                          selectedUnit?.unitCode || "Unidade selecionada",
                          "Residentes",
                        ]}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Clique aqui para Fechar a janela">
                      <IconButton
                        onClick={() => {
                          setActiveView("unidades");
                          resetResidentsContext();
                          if (selectedCondominium) {
                            void loadUnits(
                              selectedCondominium.condominiumId,
                              selectedBlockId || undefined,
                              unitsPage,
                            );
                          }
                        }}
                      >
                        <Close sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {residentsLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Carregando...</Typography>
                  </Box>
                ) : (
                  <>
                    <CardList
                      title="Residentes"
                      showTitle={false}
                      searchPlaceholder="Buscar residente..."
                      onSearchChange={setResidentSearchText}
                      onAddClick={handleOpenCreate}
                      addLabel="Novo"
                      addButtonPlacement="toolbar"
                      emptyImageLabel="Sem imagem"
                      showFilters={true}
                      showPagination={true}
                      page={residentsPage}
                      totalPages={residentsTotalPages}
                      onPageChange={(page) => {
                        setResidentsPage(page);
                        if (selectedUnit) {
                          loadResidents(selectedUnit.condominiumUnitId, page);
                        }
                      }}
                      items={residents
                        .filter((resident) =>
                          [
                            resident.userId,
                            resident.condominiumUnitId,
                            accountNamesByUserId[resident.userId],
                          ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase()
                            .includes(residentSearchText.toLowerCase()),
                        )
                        .map((resident, index) => {
                          const unit = units.find(
                            (u) =>
                              u.condominiumUnitId ===
                              resident.condominiumUnitId,
                          );
                          const blockName = blocks.find(
                            (b) =>
                              b.condominiumBlockId === unit?.condominiumBlockId,
                          )?.name;
                          const residentName =
                            accountNamesByUserId[resident.userId] ||
                            resident.userId ||
                            "-";
                          const residentType = getUnitTypeLabel(
                            resident.unitType?.toString(),
                          );
                          const residentUnit =
                            unit?.unitCode || resident.condominiumUnitId || "-";
                          const residentBlock =
                            blockName || unit?.condominiumBlockId || "-";
                          const periodStart = resident.startDate
                            ? moment(resident.startDate).format("DD/MM/YYYY")
                            : "-";
                          const periodEnd = resident.endDate
                            ? moment(resident.endDate).format("DD/MM/YYYY")
                            : "Atual";

                          return {
                            actions: (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    className="action-button-edit"
                                    startIcon={<EditOutlined />}
                                    onClick={() => handleEdit()}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    className="action-button-delete"
                                    startIcon={<DeleteOutline />}
                                    onClick={() => handleDelete()}
                                  >
                                    Excluir
                                  </Button>
                                </Box>
                              </Box>
                            ),
                            id: resident.condominiumUnitResidentId,
                            title: `${residentName}`,
                            subtitle: `${residentType} | ${residentUnit} | ${residentBlock}`,
                            meta: `Periodo: ${periodStart} - ${periodEnd}`,
                            accentColor:
                              index % 2 === 0 ? "#eef6ee" : "#fdecef",
                          };
                        })}
                    />
                  </>
                )}
              </Paper>
            ) : null}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Residentes;

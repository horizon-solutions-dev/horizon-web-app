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
import type { AccountResponse } from "../../models/api.model";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import ResidenteForm from "./ResidenteForm";
import { useNavigate } from "react-router";
import moment from "moment";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { condominiumImageService } from "../../services/condominiumImageService";
import { useTranslation } from "react-i18next";
const condoPageSize = 4;
const unitPageSize = 6;
const residentPageSize = 6;

const Residentes: React.FC = () => {
  const [activeView, setActiveView] = useState<
    "condominios" | "unidades" | "residentes"
  >("condominios");
  const { t } = useTranslation();

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
  const [accountsByUserId, setAccountsByUserId] = useState<
    Record<string, AccountResponse>
  >({});
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [, setResidentsError] = useState<string | null>(null);
  const [residentSearchText, setResidentSearchText] = useState("");
  const [residentsPage, setResidentsPage] = useState(1);
  const [residentsTotalPages, setResidentsTotalPages] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] =
    useState<CondominiumUnitResident | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const { appStateModal, handleClose, showDelete } = useAppStateModal();

  const [condominiumImages, setCondominiumImages] = useState<
    Record<string, string>
  >({});
  const loadCondominiumImages = async (items: Condominium[]) => {
    const previews: Record<string, string> = {};
    await Promise.all(
      items.map(async (condominium) => {
        try {
          const list = await condominiumImageService.getCondominiumImages(
            condominium.condominiumId,
            "Facade",
          );
          const first = list?.[0];
          if (!first?.condominiumImageId) return;
          const detail = await condominiumImageService.getCondominiumImageById(
            first.condominiumImageId,
          );
          if (detail?.contentFile && detail?.contentType) {
            previews[condominium.condominiumId] =
              `data:${detail.contentType};base64,${detail.contentFile}`;
          }
        } catch (error) {
          console.error("Erro ao carregar imagem do condomínio:", error);
          // SILENCIOSO - Erro 404 de imagem é esperado quando não há imagem
          // Não loga nada no console para não poluir
        }
      }),
    );
    setCondominiumImages(previews);
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
      await loadCondominiumImages(normalized);
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
      const detailsByUserId = accounts.reduce(
        (acc, account) => {
          const userId = String(account?.userId ?? "");
          if (userId) {
            acc[userId] = account;
          }
          return acc;
        },
        {} as Record<string, AccountResponse>,
      );
      setAccountNamesByUserId(namesByUserId);
      setAccountsByUserId(detailsByUserId);
    } catch {
      setAccountNamesByUserId({});
      setAccountsByUserId({});
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
        <>
          <Business
            sx={{
              fontSize: 16,
              mr: 0.5,
              verticalAlign: "middle",
            }}
          />
          {condominium.city} - {condominium.state}
        </>
      ),
      imageUrl: condominiumImages[condominium.condominiumId],
      actions: (
        <Button
          size="small"
          variant="outlined"
          className="action-button-manage"
          startIcon={<SettingsOutlined />}
          onClick={() => handleSelectCondominium(condominium)}
        >
          {t("common.viewUnits")}
        </Button>
      ),
      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
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
    setEditingResident(null);
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingResident(null);
    setEditingAccount(null);
    setIsFormOpen(false);
    loadResidents(selectedUnit?.condominiumUnitId || "", 1);
  };

  const handleSaved = async () => {
    await loadResidents(selectedUnit?.condominiumUnitId || "", 1);
  };

  const getUnitTypeLabel = (value?: string) => {
    if (!value) return "-";
    if (value === "1" || value === "Owner") return t("common.owner");
    if (value === "2" || value === "Tenant") return t("common.tenant");
    return value;
  };

  function handleEdit(resident: CondominiumUnitResident) {
    setEditingResident(resident);
    setEditingAccount(accountsByUserId[resident.userId] || null);
    setIsFormOpen(true);
  }
  function handleDelete(resident: CondominiumUnitResident) {
    const residentLabel =
      accountNamesByUserId[resident.userId] || resident.userId || "-";
    showDelete(`Deseja realmente excluir o residente "${residentLabel}"?`);
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
                <Tooltip title={t("common.closeTooltip")}>
                  <IconButton
                    onClick={() => navigate("/dashboard")}
                    className="close-button"
                    aria-label={t("common.close")}
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Container>
              <Box>
                <BreadcrumbTrail
                  items={[t("common.organization"), t("common.condominiums")]}
                />
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
                  title={t("residentes.condominiumsList")}
                  showTitle={false}
                  searchPlaceholder={t(
                    "residentes.searchCondominiumPlaceholder",
                  )}
                  onSearchChange={setCondoSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel={t("common.noImage")}
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
                    {t("residentes.title")}
                  </Typography>
                  <BreadcrumbTrail
                    items={[
                      organizationName || t("common.organization"),
                      selectedCondominium?.name ||
                        t("residentes.selectedCondominium"),
                      t("common.units"),
                    ]}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title={t("common.closeTooltip")}>
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
              title={t("residentes.unitsList")}
              showTitle={false}
              showFilters={true}
              searchPlaceholder={t("residentes.searchUnitPlaceholder")}
              onSearchChange={setUnitSearchText}
              onAddClick={undefined}
              addButtonPlacement="toolbar"
              emptyImageLabel={t("common.noImage")}
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
                  title: unit.unitCode || t("residentes.noCode"),
                  subtitle: (
                    <Typography variant="body2" color="text.secondary">
                      {getUnitTypeLabel(unit.unitType?.toString())}
                    </Typography>
                  ),
                  meta: (
                    <Typography variant="caption" color="text.secondary">
                      {" "}
                      {blocks.find(
                        (b) => b.condominiumBlockId === unit.condominiumBlockId,
                      )?.name ||
                        unit.condominiumBlockId ||
                        t("residentes.unknownBlock")}
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
                        {t("common.viewResidents")}
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
                loading={loading}
                setLoading={setLoading}
                editResident={editingResident}
                editAccount={editingAccount}
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
                        {t("residentes.title")}
                      </Typography>
                      <BreadcrumbTrail
                        items={[
                          organizationName || t("common.organization"),
                          selectedCondominium?.name ||
                            t("residentes.selectedCondominium"),
                          selectedUnit?.unitCode ||
                            t("residentes.selectedUnit"),
                          t("common.residents"),
                        ]}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title={t("common.closeTooltip")}>
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
                    <Typography variant="body2">
                      {t("common.loading")}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <CardList
                      title={t("residentes.residentsList")}
                      showTitle={false}
                      searchPlaceholder={t("residentes.searchPlaceholder")}
                      onSearchChange={setResidentSearchText}
                      onAddClick={handleOpenCreate}
                      addLabel={t("common.new")}
                      addButtonPlacement="toolbar"
                      emptyImageLabel={t("common.noImage")}
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
                            : t("common.current");

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
                                    onClick={() => handleEdit(resident)}
                                  >
                                    {t("common.edit")}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    className="action-button-delete"
                                    startIcon={<DeleteOutline />}
                                    onClick={() => handleDelete(resident)}
                                  >
                                    {t("common.delete")}
                                  </Button>
                                </Box>
                              </Box>
                            ),
                            id: resident.condominiumUnitResidentId,
                            title: `${residentName}`,
                            subtitle: `${residentType} | ${residentUnit} | ${residentBlock}`,
                            meta: t("residentes.periodLabel", {
                              start: periodStart,
                              end: periodEnd,
                            }),
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

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        onConfirm={handleClose}
        onClose={handleClose}
      />
    </Box>
  );
};

export default Residentes;

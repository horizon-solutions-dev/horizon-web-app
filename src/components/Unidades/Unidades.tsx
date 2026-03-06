import React, { useEffect, useMemo, useState } from "react";
import "./Unidades.scss";
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
  Business,
  DeleteOutline,
  EditOutlined,
  Close,
  MeetingRoom,
  ViewModule,
  Apartment,
  SettingsOutlined,
} from "@mui/icons-material";
import {
  unitService,
  type CondominiumUnit,
  type UnitTypeEnum,
} from "../../services/unitService";
import {
  blockService,
  type CondominiumBlock,
} from "../../services/blockService";
import {
  condominiumService,
  type Condominium,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import UnidadeForm from "./UnidadeForm";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { useNavigate } from "react-router-dom";
import { condominiumImageService } from "../../services/condominiumImageService";
import { useTranslation } from "react-i18next";

const Unidades: React.FC = () => {
  const [activeView, setActiveView] = useState<"condominios" | "unidades">(
    "condominios",
  );
  const { t } = useTranslation();
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [condominiumsPage, setCondominiumsPage] = useState(1);
  const [condominiumsTotalPages, setCondominiumsTotalPages] = useState(1);
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsTotalPages, setUnitsTotalPages] = useState(1);
  const pageSize = 4;

  const [condominiumIdQuery, setCondominiumIdQuery] = useState("");
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitTypeEnum[]>([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<CondominiumUnit | null>(null);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [unitSearchText, setUnitSearchText] = useState("");
  const [blockSearchText, setBlockSearchText] = useState("");
  const [blockPage, setBlockPage] = useState(1);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const { appStateModal, handleClose, showDelete } = useAppStateModal();

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
          const nameStorage = localStorage.getItem('condominium');
          const dataParse = nameStorage ? JSON.parse(nameStorage) : null;
          const orgName =
            organizations?.find(o => o.organizationId === dataParse?.organizationId)?.name || dataParse?.name
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
      setCondominiumsPage(response?.paging?.pageNumber ?? pageNumber);
      setCondominiumsTotalPages(computedTotalPages);
      setCondominiums(normalized);
      await loadCondominiumImages(normalized);
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

  const loadUnits = async (
    blockId?: string,
    pageNumber = 1,
    condominiumIdOverride?: string,
  ) => {
    const condominiumId = (condominiumIdOverride ?? condominiumIdQuery).trim();
    if (!condominiumId) {
      setListError("Informe o CondominiumId para carregar as unidades.");
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const response = blockId
        ? await unitService.getUnitsByBlock(blockId, pageNumber, pageSize)
        : await unitService.getUnitsByCondominium(
          condominiumId,
          pageNumber,
          pageSize,
        );
      const normalized = response?.items ?? [];
      const computedTotalPages =
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil((response?.paging?.total ?? normalized.length) / pageSize),
        );
      setUnitsPage(response?.paging?.pageNumber ?? pageNumber);
      setUnitsTotalPages(computedTotalPages);
      setUnits(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar unidades.";
      const isNotFoundMessage = /nada encontrado|not found/i.test(message);
      setUnits([]);
      setUnitsPage(pageNumber);
      if (isNotFoundMessage) {
        setListError(null);
        setUnitsTotalPages(1);
        setUnits([]);
        setUnitsPage(1);
      } else {
        setListError(message);
      }
    } finally {
      setListLoading(false);
    }
  };

  const loadBlocks = async (condominiumId: string) => {
    try {
      const response = await blockService.getBlocks(condominiumId);
      setBlocks(response?.items ?? []);
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

  const blockPageSize = 6;
  const filteredBlocks = useMemo(
    () =>
      blocks.filter((block) =>
        [block.name, block.code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(blockSearchText.toLowerCase()),
      ),
    [blocks, blockSearchText],
  );
  const blockTotalPages = Math.max(
    1,
    Math.ceil(filteredBlocks.length / blockPageSize),
  );
  const paginatedBlocks = useMemo(
    () =>
      filteredBlocks.slice(
        (blockPage - 1) * blockPageSize,
        blockPage * blockPageSize,
      ),
    [filteredBlocks, blockPage],
  );

  useEffect(() => {
    if (blockPage > blockTotalPages) {
      setBlockPage(1);
    }
  }, [blockPage, blockTotalPages]);

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setCondominiumIdQuery(condominium.condominiumId);
    setUnits([]);
    setBlocks([]);
    setEditingUnit(null);
    setIsCadastroOpen(false);
    setUnitSearchText("");
    setBlockSearchText("");
    setBlockPage(1);
    setUnitsPage(1);
    setUnitsTotalPages(1);
    setSelectedBlockId("");
    setActiveView("unidades");

    // Carregar blocos e unidades automaticamente
    setListLoading(true);
    setListError(null);
    try {
      await loadBlocks(condominium.condominiumId);
      await loadUnits(undefined, 1, condominium.condominiumId);
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
    showDelete(
      "Confirma a exclusao do item?",
      `Voce escolheu o condominio "${selectedCondominium?.name || "-"}". Item selecionado para apagar: unidade "${unit.unitCode || "-"}".`,
    );
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
    await loadUnits(selectedBlockId || undefined, unitsPage);
  };

  const navigate = useNavigate()

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
                flexDirection: "column",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <Container
                sx={{
                  p: '0 !important',
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
                    aria-label={t("common.close")}
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Container>
              <Box >
                <BreadcrumbTrail
                  items={[
                    t("common.organization"),
                    t("common.condominiums"),
                  ]}
                />
              </Box>
            </Box>






            <Paper variant="outlined" sx={{ p: 2 }}>
              {listLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">{t("common.loading")}</Typography>
                </Box>
              ) : listError ? (
                <CardList
                  title={t("unidades.condominiumsList")}
                  showTitle={false}
                  searchPlaceholder={t("unidades.searchCondominiumPlaceholder")}
                  onSearchChange={setSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel={t("common.noImage")}
                  showFilters={false}
                  showPagination={true}
                  page={condominiumsPage}
                  totalPages={condominiumsTotalPages}
                  onPageChange={(page) => {
                    setCondominiumsPage(page);
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
                          <Apartment
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
                          {t("common.viewBlocks")}
                        </Button>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    }))}
                />
              ) : condominiums.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("unidades.noCondominiumsFound")}
                </Typography>
              ) : (
                <CardList
                  title="Condôminios da organização"
                  showTitle={false}
                  searchPlaceholder="Buscar condomínio..."
                  onSearchChange={setSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  showFilters={false}
                  showPagination={true}
                  page={condominiumsPage}
                  totalPages={condominiumsTotalPages}
                  onPageChange={(page) => {
                    setCondominiumsPage(page);
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
                          <Apartment
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
                          {t("common.viewBlocks")}
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
                unitTypes={unitTypes}
                typesLoading={typesLoading}
                typesError={typesError}
                loading={loading}
                blockId={
                  selectedBlockId || editingUnit?.condominiumBlockId || ""
                }
                blockNamePreset={
                  blocks.find(
                    (block) =>
                      block.condominiumBlockId ===
                      (selectedBlockId || editingUnit?.condominiumBlockId),
                  )?.name ||
                  blocks.find(
                    (block) =>
                      block.condominiumBlockId ===
                      (selectedBlockId || editingUnit?.condominiumBlockId),
                  )?.code ||
                  ""
                }
                setLoading={setLoading}
                condominiumIdPreset={selectedCondominium?.condominiumId}
                condominiumNamePreset={selectedCondominium?.name || ""}
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
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ fontSize: "26px" }}
                      >
                        {t("unidades.title")}
                      </Typography>
                      <BreadcrumbTrail
                        items={[
                          organizationName || t("common.organization"),
                          selectedCondominium?.name || t("unidades.selectedCondominium"),
                          t("common.blocks")
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
                          setUnits([]);
                          setBlocks([]);
                          setEditingUnit(null);
                          setIsCadastroOpen(false);
                          setUnitSearchText("");
                          setBlockSearchText("");
                          setBlockPage(1);
                          setSelectedBlockId("");
                          setListError(null);
                          setUnitsPage(1);
                          setUnitsTotalPages(1);
                          void loadCondominiums(condominiumsPage);
                        }}
                        className="close-button"
                        aria-label={t("common.back")}
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
                      <Typography variant="body2">{t("common.loading")}</Typography>
                    </Box>
                  ) : null}

                  {!selectedBlockId && (
                    <CardList
                      onClose={() => {
                        setSelectedBlockId("");
                        setUnitSearchText("");
                        setBlockPage(1);
                      }}
                      title={t("unidades.blocksList")}
                      showTitle={false}
                      showFilters={true}
                      searchPlaceholder={t("unidades.searchBlocksPlaceholder")}
                      onSearchChange={(value) => {
                        setBlockSearchText(value);
                        setBlockPage(1);
                      }}
                      onAddClick={undefined}
                      addButtonPlacement="toolbar"
                      emptyImageLabel={t("common.noImage")}
                      showPagination={true}
                      page={blockPage}
                      totalPages={blockTotalPages}
                      onPageChange={(page) => {
                        setBlockPage(page);
                      }}
                      items={paginatedBlocks
                        .map((block, index) => ({
                          id: block.condominiumBlockId,
                          title: block.name || t("common.noName"),
                          subtitle: (
                            <>
                              <ViewModule
                                sx={{
                                  fontSize: 14,
                                  mr: 0.5,
                                  verticalAlign: "middle",
                                }}
                              />
                              {block.code || "-"}
                            </>
                          ),
                          actions: (
                            <Button
                              startIcon={<SettingsOutlined />}
                              size="small"
                              variant="outlined"
                              className="action-button-manage"
                              onClick={() => {
                                setSelectedBlockId(block.condominiumBlockId);
                                setUnitSearchText("");
                                setUnitsPage(1);
                                loadUnits(block.condominiumBlockId, 1);
                                setEditingUnit(null);
                                setIsCadastroOpen(false);
                                setUnitsPage(1);
                              }}
                            >
                              {t("common.viewUnits")}
                            </Button>
                          ),
                          accentColor:
                            selectedBlockId === block.condominiumBlockId
                              ? "#dff1ff"
                              : index % 2 === 0
                                ? "#eef6ee"
                                : "#fdecef",
                        }))}
                    />
                  )}

                  {selectedBlockId && (
                    <CardList
                      onClose={() => {
                        setSelectedBlockId("");
                        setUnitsPage(1);
                        loadUnits(undefined, 1);
                      }}
                      title={t("unidades.unitsList")}
                      showTitle={false}
                      showFilters={true}
                      searchPlaceholder={t("unidades.searchPlaceholder")}
                      onSearchChange={setUnitSearchText}
                      onAddClick={handleOpenCreate}
                      addLabel={t("common.new")}
                      addButtonPlacement="toolbar"
                      emptyImageLabel={t("common.noImage")}
                      showPagination={true}
                      page={unitsPage}
                      totalPages={unitsTotalPages}
                      onPageChange={(page) => {
                        setUnitsPage(page);
                        loadUnits(selectedBlockId || undefined, page);
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
                          title: unit.unitCode || t("common.noCode"),
                          subtitle: (
                            <>
                              <MeetingRoom
                                sx={{
                                  fontSize: 14,
                                  mr: 0.5,
                                  verticalAlign: "middle",
                                }}
                              />
                              {" "}
                              {unit.unitType?.toString() === "1"
                                ? t("common.owner")
                                : t("common.tenant")}
                            </>
                          ),
                          meta: (
                            <>
                              {" "}
                              {blocks.find(
                                (b) =>
                                  b.condominiumBlockId ===
                                  unit.condominiumBlockId,
                              )?.name ||
                                unit.condominiumBlockId ||
                                t("common.unknown")}
                            </>
                          ),
                          actions: (
                            <Box
                              sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                            >
                              <Button
                                size="small"
                                variant="outlined"
                                className="action-button-edit"
                                startIcon={<EditOutlined />}
                                onClick={() => handleEdit(unit)}
                              >
                                {t("common.edit")}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                className="action-button-delete"
                                startIcon={<DeleteOutline />}
                                onClick={() => handleDelete(unit)}
                              >
                                {t("common.delete")}
                              </Button>
                            </Box>
                          ),
                          accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                        }))}
                    />
                  )}
                </Paper>
              </Paper>
            )}
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
        //showCancel={false}
      />
    </Box>
  );
};

export default Unidades;



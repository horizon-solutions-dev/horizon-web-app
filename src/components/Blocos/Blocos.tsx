import React, { useEffect, useState } from "react";
import "./Bloco.scss";
import { useNavigate } from "react-router-dom";
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
  DeleteOutline,
  EditOutlined,
  Close,
  ViewModule,
  Article,
  LocationOn,
  SearchOutlined,
} from "@mui/icons-material";
import { MdApartment } from "react-icons/md";
import {
  blockService,
  type CondominiumBlock,
} from "../../services/blockService";
import {
  condominiumService,
  type Condominium,
  type CondominiumTypeEnum,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import BlocoForm from "./BlocoForm";
import DeleteConfirmModal from "../../shared/components/ActionModal/DeleteConfirmModal";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { useTranslation } from "react-i18next";
import { formatCNPJ } from "../../shared/utils/funcoes";

const EstruturaCondominio: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<"condominios" | "blocos">(
    "condominios",
  );
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [condominiumsPage, setCondominiumsPage] = useState(1);
  const [condominiumsTotalPages, setCondominiumsTotalPages] = useState(1);
  const [blocksPage, setBlocksPage] = useState(1);
  const [blocksTotalPages, setBlocksTotalPages] = useState(1);
  const pageSize = 4;

  const [condominiumIdQuery, setCondominiumIdQuery] = useState("");
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CondominiumBlock | null>(
    null,
  );
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [blockSearchText, setBlockSearchText] = useState("");

  // Estado para o modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<CondominiumBlock | null>(
    null,
  );
  const { appStateModal, handleClose, showSuccess, showError, showDelete } =
    useAppStateModal();

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
          const nameStorage = localStorage.getItem("condominium");
          const dataParse = nameStorage ? JSON.parse(nameStorage) : null;
          const orgName =
            organizations?.find(
              (o) => o.organizationId === dataParse?.organizationId,
            )?.name || dataParse?.nameations?.[0]?.legalName;
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("blocos.deleteError");
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
    loadCondominiumTypes();
  }, []);

  const loadBlocks = async (pageNumber = 1) => {
    if (!condominiumIdQuery.trim()) {
      setListError("Informe o CondominiumId para carregar os blocos.");
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const response = await blockService.getBlocks(
        condominiumIdQuery.trim(),
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

      setBlocksPage(response?.paging.pageNumber ?? pageNumber);
      setBlocksTotalPages(computedTotalPages);
      setBlocks(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar blocos.";
      setListError(message);
      setBlocks([]);
      setBlocksPage(1);
      setBlocksTotalPages(1);
    } finally {
      setListLoading(false);
    }
  };

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setCondominiumIdQuery(condominium.condominiumId);
    setBlocks([]);
    setEditingBlock(null);
    setIsCadastroOpen(false);
    setBlockSearchText("");
    setBlocksPage(1);
    setBlocksTotalPages(1);
    setActiveView("blocos");

    // Carregar blocos automaticamente
    setListLoading(true);
    setListError(null);
    try {
      const response = await blockService.getBlocks(
        condominium.condominiumId,
        1,
        pageSize,
      );
      const normalized = response?.items ?? [];
      const computedTotalPages =
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil((response?.paging?.total ?? normalized.length) / pageSize),
        );

      setBlocksPage(1);
      setBlocksTotalPages(computedTotalPages);
      setBlocks(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar blocos.";
      setListError(message);
      setBlocks([]);
    } finally {
      setListLoading(false);
    }
  };

  const handleEdit = (block: CondominiumBlock) => {
    setEditingBlock(block);
    setIsCadastroOpen(true);
  };

  const handleDelete = (block: CondominiumBlock) => {
    setBlockToDelete(block);
    showDelete("Confirma a exclusao do item?", `${block?.name || "-"}`);
  };
  const [confirm, setConfirm] = useState(false);

  const handleConfirmDelete = async () => {
    if (!blockToDelete) return;

    try {
      setLoading(true);
      await blockService.deleteBlock(blockToDelete.condominiumBlockId);

      showSuccess(t("blocos.deleteSuccess", { name: blockToDelete.name }));
      if(confirm) {
        await loadBlocks(blocksPage);
        
        setDeleteModalOpen(false);
        setBlockToDelete(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("blocos.deleteError");
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setBlockToDelete(null);
  };

  const handleOpenCreate = () => {
    setEditingBlock(null);
    setIsCadastroOpen(true);
  };

  const handleCloseForm = () => {
    setIsCadastroOpen(false);
    setEditingBlock(null);
  };

  const handleSaved = async () => {
    await loadBlocks(blocksPage);
    setIsCadastroOpen(false);
    setEditingBlock(null);
  };

    const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);

  const getCondominiumImageUrl = (condominium: Condominium) => {
    if (!condominium.thumbnailFile || !condominium.contentType)
      return undefined;
    return `data:${condominium.contentType};base64,${condominium.thumbnailFile}`;
  };

  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || String(value);
  };

  const loadCondominiumTypes = async () => {
      const data = await condominiumService.getCondominiumTypes();
      setCondominiumTypes(data ?? []);
  };

  return (
    <Box className="bloco-container">
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
                  p: "0 !important",
                  maxWidth: "100vw !important",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <MdApartment style={{ fontSize: 36, color: "#1976d2" }} />
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
                  items={[t("common.condominiums")]}
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
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.35,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                            }}
                          >
                            <Article sx={{ fontSize: 14 }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatCNPJ(condominium.doc) || "-"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                            }}
                          >
                            <LocationOn sx={{ fontSize: 14 }} />
                            <Typography variant="body2" color="text.secondary">
                              {condominium.city} - {condominium.state}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {getCondominiumTypeLabel(
                                condominium.condominiumType,
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      ),
                   //   imageUrl: getCondominiumImageUrl(condominium),
                      actions: (
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-manage"
                          startIcon={<SearchOutlined />}
                          onClick={() => handleSelectCondominium(condominium)}
                        >
                          Visualizars Estrutura do condomínio
                        </Button>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    }))}
                />
              ) : condominiums.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("blocos.noCondominiumsFound")}
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
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.35,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                            }}
                          >
                            <Article sx={{ fontSize: 14 }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatCNPJ(condominium.doc) || "-"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                            }}
                          >
                            <LocationOn sx={{ fontSize: 14 }} />
                            <Typography variant="body2" color="text.secondary">
                              {condominium.city} - {condominium.state}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {getCondominiumTypeLabel(
                                condominium.condominiumType,
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      ),
                      imageUrl: getCondominiumImageUrl(condominium),

                      actions: (
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-manage"
                          startIcon={<SearchOutlined />}
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
              <BlocoForm
                open={isCadastroOpen}
                editingBlock={editingBlock}
                onClose={handleCloseForm}
                onSaved={handleSaved}
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
                    <ViewModule sx={{ fontSize: 36, color: "#1976d2" }} />
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ fontSize: "26px" }}
                      >
                        {t("blocos.title")}
                      </Typography>
                      <BreadcrumbTrail
                        items={[
                          localStorage.getItem("condominium")
                            ? JSON.parse(
                                localStorage.getItem("condominium") || "{}",
                              )?.name
                            : {},
                          selectedCondominium?.name ||
                            t("blocos.selectedCondominium"),
                          t("common.blocks"),
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
                          setBlocks([]);
                          setEditingBlock(null);
                          setIsCadastroOpen(false);
                          setBlockSearchText("");
                          setListError(null);
                          setBlocksPage(1);
                          setBlocksTotalPages(1);
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
                      <Typography variant="body2">
                        {t("common.loading")}
                      </Typography>
                    </Box>
                  ) : null}

                  <CardList
                    title={t("blocos.blocksList")}
                    showTitle={false}
                    showFilters={true}
                    haveImage={false}
                    searchPlaceholder={t("blocos.searchPlaceholder")}
                    onSearchChange={setBlockSearchText}
                    onAddClick={handleOpenCreate}
                    addLabel={t("common.new")}
                    addButtonPlacement="toolbar"
                    emptyImageLabel={t("common.noImage")}
                    showPagination={true}
                    page={blocksPage}
                    totalPages={blocksTotalPages}
                    onPageChange={(page) => {
                      setBlocksPage(page);
                      loadBlocks(page);
                    }}
                    items={(Array.isArray(blocks) ? blocks : [])
                      .filter((block) =>
                        [block.name, block.code]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase()
                          .includes(blockSearchText.toLowerCase()),
                      )
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
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                              mt: 3,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-edit"
                              startIcon={<EditOutlined />}
                              onClick={() => handleEdit(block)}
                            >
                              {t("common.edit")}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-delete"
                              startIcon={<DeleteOutline />}
                              onClick={() => handleDelete(block)}
                            >
                              {t("common.delete")}
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

      {/* Modal de confirmação de exclusão */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        title={t("blocos.deleteTitle")}
        message={
          blockToDelete
            ? t("blocos.deleteMessage", { name: blockToDelete.name })
            : ""
        }
        imageAlt={t("blocos.deleteImageAlt")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
      />

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        item={appStateModal.item}
        onConfirm={()=>{handleClose();setConfirm(true)}}
        onClose={()=>{handleClose();setConfirm(true)}}
      />
    </Box>
  );
};

export default EstruturaCondominio;
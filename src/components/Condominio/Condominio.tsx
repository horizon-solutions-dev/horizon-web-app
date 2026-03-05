import React, { useEffect, useState } from "react";
import "./Condominio.scss";
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
  Business,
  DeleteOutline,
  EditOutlined,
  HomeOutlined,
  BusinessOutlined,
  ApartmentOutlined,
  LocationOnOutlined,
  Close,
} from "@mui/icons-material";
import {
  condominiumService,
  type Condominium,
  type CondominiumTypeEnum,
} from "../../services/condominiumService";
import { condominiumImageService } from "../../services/condominiumImageService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import CondominioForm from "./CondominioForm";
import DeleteConfirmModal from "../../shared/components/ActionModal/DeleteConfirmModal";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { useTranslation } from "react-i18next";
import { AppStateModal } from "../../shared/components";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";

const CondominioPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [condominiumImages, setCondominiumImages] = useState<
    Record<string, string>
  >({});
  const [searchText, setSearchText] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;
  const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [editingCondominium, setEditingCondominium] =
    useState<Condominium | null>(null);
  const { appStateModal, handleClose } = useAppStateModal();

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
      const dataCondominium = JSON.parse(
        localStorage.getItem("dataCondominium") || "",
      );
      setOrganizationName(dataCondominium.name);

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
            )?.name || dataParse?.name;
          if (orgName) setOrganizationName(orgName);
        } catch (error) {
          console.error("Erro ao carregar nome da organização:", error);
          // Silencioso - não é crítico
        }
      }
      const normalized = response?.items ?? [];
      const computedTotalPages =
        response?.paging?.totalPages ??
        response?.paging?.totalPages ??
        Math.max(
          1,
          Math.ceil((response?.paging?.total ?? normalized.length) / pageSize),
          Math.ceil((response?.paging?.total ?? normalized.length) / pageSize),
        );
      setListPage(response?.paging?.pageNumber ?? pageNumber);
      setListPage(response?.paging?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
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

  const loadCondominiumImages = async (items: Condominium[]) => {
    const previews: Record<string, string> = {};
    await Promise.all(
      items.map(async (condominium) => {
        try {
          const list = await condominiumImageService.getCondominiumImages(
            condominium.condominiumId,
            "Cover",
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

  const loadCondominiumTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await condominiumService.getCondominiumTypes();
      setCondominiumTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de condomínio.";
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
    loadCondominiumTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [openDelete, setOpenDelete] = useState(false);
  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || String(value);
  };

  const handleEdit = (condominium: Condominium) => {
    setEditingCondominium(condominium);
    setIsCadastroOpen(true);
  };

  const handleDelete = (condominium: Condominium) => {
    console.log("Deletar condomínio:", condominium);
    setOpenDelete(false);
  };

  const handleOpenCreate = () => {
    setEditingCondominium(null);
    setIsCadastroOpen(true);
  };

  const handleCloseForm = () => {
    setIsCadastroOpen(false);
    setEditingCondominium(null);
  };

  const handleSaved = async () => {
    await loadCondominiums(listPage);
  };

  return (
    <Box className="condominio-container">
      <Container maxWidth="xl">
        {isCadastroOpen ? (
          <CondominioForm
            open={isCadastroOpen}
            editingCondominium={editingCondominium}
            onClose={handleCloseForm}
            onSaved={handleSaved}
            condominiumTypes={condominiumTypes}
            typesLoading={typesLoading}
            typesError={typesError}
            loading={loading}
            setLoading={setLoading}
          />
        ) : (
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
                    onClick={() => {
                      navigate("/dashboard");
                      setIsCadastroOpen(false);
                      setEditingCondominium(null);
                    }}
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

            <Paper variant="outlined" sx={{ p: 2 }}>
              {listLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">{t("common.loading")}</Typography>
                </Box>
              ) : listError ? (
                <CardList
                  title="Condominios da organização"
                  showTitle={false}
                  searchPlaceholder="Buscar condominio..."
                  onSearchChange={setSearchText}
                  onAddClick={handleOpenCreate}
                  addLabel="Novo"
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  showFilters={true}
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
                          <LocationOnOutlined
                            sx={{
                              fontSize: 14,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {condominium.city} - {condominium.state}
                        </>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                      meta: (
                        <>
                          {condominium.condominiumType === "Commercial" ||
                          getCondominiumTypeLabel(
                            condominium.condominiumType,
                          ) === "Comercial" ? (
                            <BusinessOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          ) : getCondominiumTypeLabel(
                              condominium.condominiumType,
                            ) === "Residencial" ? (
                            <HomeOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          ) : (
                            <ApartmentOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          )}
                          {getCondominiumTypeLabel(condominium.condominiumType)}
                        </>
                      ),
                      imageUrl: condominiumImages[condominium.condominiumId],
                      actions: (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-edit"
                            startIcon={<EditOutlined />}
                            onClick={() => handleEdit(condominium)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-delete"
                            startIcon={<DeleteOutline />}
                            onClick={() => {
                              setEditingCondominium(condominium);
                              setOpenDelete(true);
                            }}
                          >
                            Excluir
                          </Button>
                        </Box>
                      ),
                    }))}
                />
              ) : condominiums.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("condominio.notFound")}
                </Typography>
              ) : (
                <CardList
                  title="Condominios da organização"
                  showTitle={false}
                  searchPlaceholder="Buscar condomínio..."
                  onSearchChange={setSearchText}
                  onAddClick={handleOpenCreate}
                  addLabel="Novo"
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  showFilters={true}
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
                          <LocationOnOutlined
                            sx={{
                              fontSize: 14,
                              mr: 0.5,
                              verticalAlign: "middle",
                            }}
                          />
                          {condominium.city} - {condominium.state}
                        </>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                      meta: (
                        <>
                          {condominium.condominiumType === "Commercial" ||
                          getCondominiumTypeLabel(
                            condominium.condominiumType,
                          ) === "Comercial" ? (
                            <BusinessOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          ) : getCondominiumTypeLabel(
                              condominium.condominiumType,
                            ) === "Residencial" ? (
                            <HomeOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          ) : (
                            <ApartmentOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                          )}
                          {getCondominiumTypeLabel(condominium.condominiumType)}
                        </>
                      ),
                      imageUrl: condominiumImages[condominium.condominiumId],
                      actions: (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-edit"
                            startIcon={<EditOutlined />}
                            onClick={() => handleEdit(condominium)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-delete"
                            startIcon={<DeleteOutline />}
                            onClick={() => {
                              setEditingCondominium(condominium);
                              setOpenDelete(true);
                            }}
                          >
                            Excluir
                          </Button>
                        </Box>
                      ),
                    }))}
                />
              )}
            </Paper>
          </Paper>
        )}
      </Container>

      <DeleteConfirmModal
        open={openDelete}
        onConfirm={() => {
          if (editingCondominium) {
            handleDelete(editingCondominium);
          }
        }}
        onCancel={() => setOpenDelete(false)}
        onClose={() => setOpenDelete(false)}
      />

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

export default CondominioPage;

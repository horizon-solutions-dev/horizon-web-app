import React, { useEffect, useState } from "react";
import "./Condominio.scss";
import { useLocation, useNavigate } from "react-router-dom";
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
  Apartment,
  LocationOn,
  Article,
} from "@mui/icons-material";
import {
  condominiumService,
  type Condominium,
  type CondominiumTypeEnum,
  type PhysicalStructureEnum,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import CondominioForm from "./CondominioForm";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { useTranslation } from "react-i18next";
import { AppStateModal } from "../../shared/components";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import axios from "axios";
import { formatCNPJ } from "../../shared/utils/funcoes";

const CondominioPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [searchText, setSearchText] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;
  const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);
  const [physicalStructureTypes, setPhysicalStructureTypes] = useState<
    PhysicalStructureEnum[]
  >([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [physicalStructuresLoading, setPhysicalStructuresLoading] =
    useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [physicalStructuresError, setPhysicalStructuresError] = useState<
    string | null
  >(null);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [editingCondominium, setEditingCondominium] =
    useState<Condominium | null>(null);
  const [imageSelected, setImageSelected] = useState<string | null>(null);
  const { appStateModal, handleClose, showDelete } = useAppStateModal();
  useEffect(() => {
    if (!organizationName) atualizarNome();
  }, [organizationName]);

  async function atualizarNome() {
    const organizations = await organizationService.getMyOrganization();
    const nameStorage = localStorage.getItem("condominium");
    const dataParse = nameStorage ? JSON.parse(nameStorage) : null;
    const orgName = organizations?.find(
      (o) => o.organizationId === dataParse?.organizationId,
    )?.name;
    if (orgName) setOrganizationName(orgName);
  }

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
          const orgName = organizations?.find(
            (o) => o.organizationId === dataParse?.organizationId,
          )?.name;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore
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
      setTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar condominios.";
      const isNotFound =
        status === 404 || /not found|nada encontrado/i.test(message);

      if (isNotFound) {
        setCondominiums([]);
        setListPage(1);
        setTotalPages(1);
        setListError(null);
        return;
      }

      setListError(message);
    } finally {
      setListLoading(false);
    }
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
          : "Erro ao carregar tipos de côndomínio.";
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  const loadPhysicalStructureTypes = async () => {
    setPhysicalStructuresLoading(true);
    setPhysicalStructuresError(null);
    try {
      const data = await condominiumService.getPhysicalStructures();
      setPhysicalStructureTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de estrutura física.";
      setPhysicalStructuresError(message);
    } finally {
      setPhysicalStructuresLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
    loadCondominiumTypes();
    loadPhysicalStructureTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null;
    if (!state?.openCreate) return;

    setEditingCondominium(null);
    setImageSelected(null);
    setIsCadastroOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || String(value);
  };

  const getCondominiumImageUrl = (condominium: Condominium) => {
    if (!condominium.thumbnailFile || !condominium.contentType)
      return undefined;
    return `data:${condominium.contentType};base64,${condominium.thumbnailFile}`;
  };

  const handleEdit = (condominium: Condominium, image: string) => {
    setEditingCondominium(condominium);
    setImageSelected(image);
    setIsCadastroOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingCondominium(null);
    setImageSelected(null);
    setIsCadastroOpen(true);
  };
  const data =  JSON.parse(localStorage.getItem("dataCondominium")!)
  console.log('aaaa',data)
  console.log("aquio")
  const handleCloseForm = () => {
    setIsCadastroOpen(false);
    setEditingCondominium(null);
    setImageSelected(null);
  };

  const handleSaved = async () => {
    await loadCondominiums(listPage);
  };

  const condominiumItems = condominiums
    .filter((condominium) =>
      [
        condominium.name,
        condominium.doc,
        condominium.city,
        condominium.state,
        getCondominiumTypeLabel(condominium.condominiumType),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase()),
    )
    .map((condominium, index) => ({
      id: condominium.condominiumId,
      title: condominium.name,
      subtitle: (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap:'4px' }}>
            <Article sx={{ fontSize: 14 }} />
            <Typography variant="body2" color="text.secondary">
              {formatCNPJ(condominium.doc) || "-"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: '4px' }}>
            <LocationOn sx={{ fontSize: 14 }} />
            <Typography variant="body2" color="text.secondary">
              {condominium.city} - {condominium.state}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
            <Typography variant="body2" color="text.secondary">
              {getCondominiumTypeLabel(condominium.condominiumType)}
            </Typography>
          </Box>
        </Box>
      ),
      imageUrl: getCondominiumImageUrl(condominium),
      actions: (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            className="action-button-edit"
            startIcon={<EditOutlined />}
            onClick={() =>
              handleEdit(condominium, getCondominiumImageUrl(condominium) || "")
            }
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
              showDelete("Confirma a exclusao do item?", `${condominium.name}`);
            }}
          >
            Excluir
          </Button>
        </Box>
      ),
      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
    }));

  return (
    <Box className="condominio-container">
      <Container maxWidth="xl">
        {isCadastroOpen ? (
          <CondominioForm
            open={isCadastroOpen}
            editingCondominium={editingCondominium}
            imageSelected={imageSelected}
            onClose={handleCloseForm}
            onSaved={handleSaved}
            condominiumTypes={condominiumTypes}
            physicalStructureTypes={physicalStructureTypes}
            typesLoading={typesLoading}
            physicalStructuresLoading={physicalStructuresLoading}
            typesError={typesError}
            physicalStructuresError={physicalStructuresError}
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
            <Apartment sx={{ fontSize: 36, color: "#2563eb" }} />
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
              <Box sx={{ alignSelf: "stretch", pl: "48px" }}>
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
              ) : (
                <>
                  {listError ? (
                    <Typography
                      variant="body2"
                      color="error.main"
                      sx={{ mb: 1 }}
                    >
                      {listError}
                    </Typography>
                  ) : null}
                  <CardList
                    showAddButton={data.orgType == 1}
                    title={t("condominio.condominiumsList")}
                    showTitle={false}
                    variant="condominiumSelection"
                    searchPlaceholder={t("condominio.searchPlaceholder")}
                    onSearchChange={setSearchText}
                    onAddClick={handleOpenCreate}
                    addLabel={t("common.new")}
                    addButtonPlacement="toolbar"
                    emptyImageLabel={t("common.noImage")}
                    showFilters={true}
                    showPagination={true}
                    actionsMarginTop={0.5}
                    page={listPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setListPage(page);
                      loadCondominiums(page);
                    }}
                    items={condominiumItems}
                  />
                </>
              )}
            </Paper>
          </Paper>
        )}
      </Container>

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        item={appStateModal.item}
        onConfirm={handleClose}
        onClose={handleClose}
      />
    </Box>
  );
};

export default CondominioPage;

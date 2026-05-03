import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Article,
  Business,
  Close,
  DeleteOutline,
  EditOutlined,
  PlaceOutlined,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import CardList from "../../shared/components/CardList";
import {
  organizationService,
  type Organization,
  type OrganizationMeResponse,
  type OrganizationTypeEnum,
} from "../../services/organizationService";
import OrganizacaoForm from "./OrganizacaoForm";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";

const pageSize = 4;

const mapToOrganization = (item: OrganizationMeResponse): Organization => ({
  organizationId: item.organizationId,
  name: item.name || "",
  legalName: item.legalName || "",
  doc: item.doc || "",
  orgType: item.orgType,
  email: item.email || "",
  phone: item.phone || "",
  city: item.city || "",
  state: item.state || "",
  zipCode: item.zipCode || item.cep || "",
  active: item.active,
});

const Organizacoes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [, setListError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchText, setSearchText] = useState("");
  const [listPage, setListPage] = useState(1);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);
  const [organizationTypes, setOrganizationTypes] = useState<
    OrganizationTypeEnum[]
  >([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const { appStateModal, handleClose, showDelete } = useAppStateModal();
  const [isDelete, setIsDelete] = useState(false);

  const loadOrganizations = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await organizationService.getMyOrganization();
      const normalized = (data ?? []).map(mapToOrganization);
      setOrganizations(normalized);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar organizacoes.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await organizationService.getOrganizationTypes();
      setOrganizationTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar tipos de organizacao.";
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadTypes();
  }, []);

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null;
    if (!state?.openCreate) return;

    setEditingOrganization(null);
    setIsCadastroOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredOrganizations = useMemo(
    () =>
      organizations.filter((organization) =>
        [
          organization.name,
          organization.legalName,
          organization.city,
          organization.state,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchText.toLowerCase()),
      ),
    [organizations, searchText],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrganizations.length / pageSize),
  );
  const paginatedOrganizations = filteredOrganizations.slice(
    (listPage - 1) * pageSize,
    listPage * pageSize,
  );

  useEffect(() => {
    if (listPage > totalPages) {
      setListPage(1);
    }
  }, [listPage, totalPages]);

  const getOrgTypeLabel = (value?: string | number) => {
    const match = organizationTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || "Nao informado";
  };

  const handleOpenCreate = () => {
    setEditingOrganization(null);
    setIsCadastroOpen(true);
  };

  const handleEdit = async (organization: Organization) => {
    console.log("Editando organizacao:", organization);
    setLoading(true);
    try {
      const detail = await organizationService.getOrganizationById(
        organization.organizationId,
      );
      setEditingOrganization(detail ?? organization);
      setIsCadastroOpen(true);
      detail.zipCode = organization?.zipCode; // Garantir que zipCode seja preenchido
    } catch {
      setEditingOrganization(organization);
      setIsCadastroOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setIsCadastroOpen(false);
    setEditingOrganization(null);
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return "";

    const cleaned = cnpj.replace(/\D/g, "");

    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/,
      "$1.$2.$3/$4-$5",
    );
  };

  const handleSaved = async () => {
    await loadOrganizations();
    handleCloseForm();
  };
  const nameStorage = localStorage.getItem("condominium");
  const dataParse = nameStorage ? JSON.parse(nameStorage) : null;
  const canManageOrganizations = Number(dataParse?.orgType ?? 0) === 2;
  const orgName =
    organizations?.find((o) => o.organizationId === dataParse?.organizationId)
      ?.name || dataParse?.name;
  const organizationName = orgName || "Organizações";

  return (
    <Box className="page-container">
      <Container maxWidth="xl">
        {isCadastroOpen ? (
          <OrganizacaoForm
            open={isCadastroOpen}
            editingOrganization={editingOrganization}
            onClose={handleCloseForm}
            onSaved={handleSaved}
            organizationTypes={organizationTypes}
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
                justifyContent: "space-between",
                borderBottom: "2px solid #f0f0f0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Business sx={{ fontSize: 36, color: "#1976d2" }} />
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ fontSize: "26px" }}
                  >
                    {organizationName}
                  </Typography>
                  <BreadcrumbTrail items={["Organização", "Organizações"]} />
                </Box>
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
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              {listLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando...</Typography>
                </Box>
              ) : (
                <>
                  <CardList
                    haveImage={false}
                    title="Organizações"
                    showTitle={false}
                    searchPlaceholder="Buscar organizacao..."
                    onSearchChange={(value) => {
                      setSearchText(value);
                      setListPage(1);
                    }}
                    showAddButton={canManageOrganizations}
                    onAddClick={handleOpenCreate}
                    addLabel="Novo"
                    addButtonPlacement="toolbar"
                    emptyImageLabel="Sem imagem"
                    showFilters={true}
                    page={listPage}
                    totalPages={totalPages}
                    onPageChange={setListPage}
                    items={paginatedOrganizations.map(
                      (organization, index) => ({
                        id: organization.organizationId,
                        title: organization.name || "Sem nome",
                        meta: getOrgTypeLabel(organization.orgType),
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
                              }}
                            >
                              <PlaceOutlined
                                sx={{
                                  fontSize: 14,
                                  mr: 0.5,
                                  verticalAlign: "middle",
                                }}
                              />
                              {organization.city || "-"} -{" "}
                              {organization.state || "-"}
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.7,
                              }}
                            >
                              <Article sx={{ fontSize: 14 }} />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatCNPJ(organization.doc)}
                              </Typography>
                            </Box>
                          </Box>
                        ),

                        accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                        actions: (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                              mt: 2,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-edit"
                              startIcon={<EditOutlined />}
                              onClick={() => {
                                handleEdit(organization);
                                console.log("Clicou em editar:", organization);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-delete"
                              startIcon={<DeleteOutline />}
                              onClick={() => {
                                setIsDelete(true);
                                setEditingOrganization(organization);
                                showDelete(
                                  "Confirma a exclusao do item?",
                                  `${orgName}`,
                                );
                              }}
                            >
                              Excluir
                            </Button>
                          </Box>
                        ),
                      }),
                    )}
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
        onConfirm={() => {
          handleClose();
          setIsDelete(false);
        }}
        onClose={() => {
          handleClose();
          setIsDelete(false);
        }}
        showCancel={isDelete ? true : false}
      />
    </Box>
  );
};

export default Organizacoes;

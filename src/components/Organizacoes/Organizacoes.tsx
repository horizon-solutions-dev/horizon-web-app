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
  Business,
  Close,
  EditOutlined,
  PlaceOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CardList from "../../shared/components/CardList";
import {
  organizationService,
  type Organization,
  type OrganizationMeResponse,
  type OrganizationTypeEnum,
} from "../../services/organizationService";
import OrganizacaoForm from "./OrganizacaoForm";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { notify } from "../../shared/utils/toastMessage";

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
  const handleNotify = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    notify({ message, type: severity });
  };

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

  const handleSaved = async () => {
    await loadOrganizations();
  };
  const nameStorage = localStorage.getItem("condominium");
  const dataParse = nameStorage ? JSON.parse(nameStorage) : null;
  const orgName =
    organizations?.find((o) => o.organizationId === dataParse?.organizationId)
      ?.name || dataParse?.name;
  const organizationName = orgName || "Organizações";

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="xl">
        {isCadastroOpen ? (
          <OrganizacaoForm
            open={isCadastroOpen}
            editingOrganization={editingOrganization}
            onClose={handleCloseForm}
            onSaved={handleSaved}
            onNotify={handleNotify}
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
                  <BreadcrumbTrail items={["Organização", "Condôminios"]} />
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
                    title="Organizações"
                    showTitle={false}
                    searchPlaceholder="Buscar organizacao..."
                    onSearchChange={(value) => {
                      setSearchText(value);
                      setListPage(1);
                    }}
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
                        subtitle: (
                          <>
                            <PlaceOutlined
                              sx={{
                                fontSize: 14,
                                mr: 0.5,
                                verticalAlign: "middle",
                              }}
                            />
                            {organization.city || "-"} -{" "}
                            {organization.state || "-"}
                          </>
                        ),
                        accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                        meta: getOrgTypeLabel(organization.orgType),
                        actions: (
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
    </Box>
  );
};

export default Organizacoes;

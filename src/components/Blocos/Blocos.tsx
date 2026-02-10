import React, { useEffect, useState } from "react";
import "./Bloco.scss";
import { useNavigate } from "react-router-dom";
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
  ViewModule,
  Apartment,
  SettingsOutlined,
  ChevronRight,
} from "@mui/icons-material";
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
import BlocoForm from "./BlocoForm";

const Blocos: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"condominios" | "blocos">("condominios");
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
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CondominiumBlock | null>(null);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [blockSearchText, setBlockSearchText] = useState("");
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

  useEffect(() => {
    loadCondominiums(1);
  }, []);

  const loadBlocks = async () => {
    if (!condominiumIdQuery.trim()) {
      setListError("Informe o CondominiumId para carregar os blocos.");
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const data = await blockService.getBlocks(condominiumIdQuery.trim());
      setBlocks(data?.data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar blocos.";
      setListError(message);
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
    setActiveView("blocos");
    
    // Carregar blocos automaticamente
    setListLoading(true);
    setListError(null);
    try {
      const data = await blockService.getBlocks(condominium.condominiumId);
      setBlocks(data?.data ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar blocos.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const handleEdit = (block: CondominiumBlock) => {
    setEditingBlock(block);
    setIsCadastroOpen(true);
  };

  const handleDelete = (block: CondominiumBlock) => {
    const confirmed = window.confirm(
      `Deseja excluir o bloco ${block.name}?`,
    );
    if (!confirmed) return;
    handleNotify("Exclusão ainda não está disponível.", "error");
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
    await loadBlocks();
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
                          Gerenciar Blocos
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
                onNotify={handleNotify}
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
                      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "26px" }}>
                        Blocos
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
                          setBlocks([]);
                          setEditingBlock(null);
                          setIsCadastroOpen(false);
                          setBlockSearchText("");
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
                    title="Blocos do condomínio"
                    showTitle={false}
                    showFilters={true}
                    searchPlaceholder="Buscar bloco..."
                    onSearchChange={setBlockSearchText}
                    onAddClick={handleOpenCreate}
                    addLabel="Novo"
                    addButtonPlacement="toolbar"
                    emptyImageLabel="Sem imagem"
                    showPagination={false}
                    items={blocks
                      .filter((block) =>
                        [block.name, block.code]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase()
                          .includes(blockSearchText.toLowerCase()),
                      )
                      .map((block, index) => ({
                        id: block.condominiumBlockId,
                        title: block.name || "Sem nome",
                        subtitle: (
                          <>
                            <ViewModule sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                            Código: {block.code || "-"}
                          </>
                        ),
                        actions: (
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-edit"
                              startIcon={<EditOutlined />}
                              onClick={() => handleEdit(block)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              className="action-button-delete"
                              startIcon={<DeleteOutline />}
                              onClick={() => handleDelete(block)}
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

export default Blocos;

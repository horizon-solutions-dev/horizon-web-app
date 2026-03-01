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
  Business,
  DeleteOutline,
  EditOutlined,
  Close,
  ViewModule,
  Apartment,
  SettingsOutlined,
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
import DeleteConfirmModal from "../../shared/components/ActionModal/DeleteConfirmModal";
import { notify } from "../../shared/utils/toastMessage";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";

const Blocos: React.FC = () => {
  const navigate = useNavigate();
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

  const handleNotify = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    notify({ message, type: severity });
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
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!blockToDelete) return;

    try {
      setLoading(true);
      await blockService.deleteBlock(blockToDelete.condominiumBlockId);

      handleNotify(
        `Bloco "${blockToDelete.name}" excluído com sucesso!`,
        "success",
      );

      await loadBlocks(blocksPage);

      setDeleteModalOpen(false);
      setBlockToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir bloco.";
      handleNotify(message, "error");
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
                  p:'0 !important',
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
              <Box >
                <BreadcrumbTrail
                  items={[
                    "Organização",
                    "Condomínios",
                  ]}
                />
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              {listLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando...</Typography>
                </Box>
              ) : listError ? (
                <CardList
                  title="Condomínios da organização"
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
                      actions: (
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-manage"
                          startIcon={<SettingsOutlined />}
                          onClick={() => handleSelectCondominium(condominium)}
                        >
                          Visualizar Blocos
                        </Button>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    }))}
                />
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
                      actions: (
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-manage"
                          startIcon={<SettingsOutlined />}
                          onClick={() => handleSelectCondominium(condominium)}
                        >
                          Visualizar Blocos
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
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ fontSize: "26px" }}
                      >
                        Blocos
                      </Typography>
                      <BreadcrumbTrail
                        items={[
                          localStorage.getItem("condominium")
                            ? JSON.parse(
                                localStorage.getItem("condominium") || "{}",
                              )?.name
                            : {},
                          selectedCondominium?.name || "Condominio selecionado",
                          "Blocos",
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
                        title: block.name || "Sem nome",
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
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
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

      {/* Modal de confirmação de exclusão */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        title="Deseja excluir este bloco?"
        message={
          blockToDelete
            ? `O bloco "${blockToDelete.name}" será removido permanentemente.`
            : ""
        }
        imageAlt="Remover bloco"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
      />
    </Box>
  );
};

export default Blocos;

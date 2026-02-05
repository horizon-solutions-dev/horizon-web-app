import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import {
  blockService,
  type CondominiumBlock,
  type CondominiumBlockRequest,
} from "../../services/blockService";
import {
  condominiumService,
  type Condominium,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import CardList from "../../shared/components/CardList";
import StepWizardCard from "../../shared/components/StepWizardCard";

const initialForm: CondominiumBlockRequest = {
  condominiumId: "",
  code: "",
  name: "",
};

const Blocos: React.FC = () => {
  const [activeView, setActiveView] = useState<"condominios" | "blocos">(
    "condominios",
  );
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;

  const [formData, setFormData] =
    useState<CondominiumBlockRequest>(initialForm);
  const [condominiumIdQuery, setCondominiumIdQuery] = useState("");
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [blockSearchText, setBlockSearchText] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const steps = ["Dados do bloco"];

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
      const normalized = response?.data ?? [];
      const computedTotalPages =
        response?.totalPages ??
        Math.max(
          1,
          Math.ceil((response?.total ?? normalized.length) / pageSize),
        );
      setListPage(response?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar condominios.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
  }, []);

  const handleChange = (
    field: keyof CondominiumBlockRequest,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (condominiumIdQuery.trim()) {
      loadBlocks();
    }
  }, [condominiumIdQuery]);

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
    setEditingId(null);
    setActiveStep(0);
    setIsCadastroOpen(false);
    setBlockSearchText("");
    setFormData((prev) => ({
      ...prev,
      condominiumId: condominium.condominiumId,
    }));
    setActiveView("blocos");
    //await loadBlocks();
  };

  const handleEdit = (block: CondominiumBlock) => {
    setEditingId(block.condominiumBlockId);
    setFormData({
      condominiumId: block.condominiumId,
      code: block.code,
      name: block.name,
    });
    setActiveStep(0);
    setIsCadastroOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.condominiumId || !formData.code || !formData.name) {
      setSnackbar({
        open: true,
        message: "Preencha CondominiumId, Codigo e Nome.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await blockService.updateBlock(editingId, formData);
        setSnackbar({
          open: true,
          message: "Bloco atualizado com sucesso.",
          severity: "success",
        });
      } else {
        await blockService.createBlock(formData);
        setSnackbar({
          open: true,
          message: "Bloco criado com sucesso.",
          severity: "success",
        });
      }

      setFormData(initialForm);
      setEditingId(null);
      setIsCadastroOpen(false);
      if (condominiumIdQuery.trim()) {
        await loadBlocks();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar bloco.";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Codigo"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            fullWidth
          />
          <TextField
            label="Nome"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            fullWidth
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2">
          Codigo: {formData.code || "-"}
        </Typography>
        <Typography variant="subtitle2">
          Nome: {formData.name || "-"}
        </Typography>
      </Box>
    );
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {activeView === "condominios" ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {organizationName || "Condominios"}
            </Typography>

            {listLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : listError ? (
              <Alert severity="error">{listError}</Alert>
            ) : (
              <CardList
                title="Condominios da organizacao"
                showTitle={false}
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setSearchText}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
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
                      <Typography variant="body2" color="text.secondary">
                        {condominium.city} - {condominium.state}
                      </Typography>
                    ),
                    actions: (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSelectCondominium(condominium)}
                      >
                        Gerenciar blocos
                      </Button>
                    ),
                    accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                  }))}
              />
            )}
          </Paper>
        ) : (
          <>
            {isCadastroOpen ? null : (
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <IconButton
                    onClick={() => {
                      setActiveView("condominios");
                      setSelectedCondominium(null);
                      setBlocks([]);
                      setEditingId(null);
                      setActiveStep(0);
                      setIsCadastroOpen(false);
                      setFormData(initialForm);
                      setBlockSearchText("");
                      setListError(null);
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h5">Blocos</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCondominium?.name || "Condominio selecionado"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => {
                      setEditingId(null);
                      setActiveStep(0);
                      setFormData((prev) => ({
                        ...prev,
                        condominiumId:
                          selectedCondominium?.condominiumId ||
                          condominiumIdQuery,
                        code: "",
                        name: "",
                      }));
                      setIsCadastroOpen(true);
                    }}
                  >
                    Novo bloco
                  </Button>
                </Box>

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
                  title="Blocos do condominio"
                  showTitle={false}
                  showFilters={false}
                  searchPlaceholder="Buscar bloco..."
                  onSearchChange={setBlockSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  showPagination={true}
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
                        <Typography variant="body2" color="text.secondary">
                          Codigo: {block.code || "-"}
                        </Typography>
                      ),
                      meta: (
                        <Typography variant="caption" color="text.secondary">
                          Id: {block.condominiumBlockId}
                        </Typography>
                      ),
                      actions: (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEdit(block)}
                        >
                          Editar
                        </Button>
                      ),
                      accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    }))}
                />
              </Paper>
            )}

            {isCadastroOpen ? (
              <StepWizardCard
                title={editingId ? "Editar bloco" : "Criar bloco"}
                subtitle={steps[activeStep]}
                steps={steps}
                activeStep={activeStep}
                showBack={activeStep > 0 && activeStep < steps.length - 1}
                onBack={() => setActiveStep((prev) => prev - 1)}
                onClose={() => {
                  setIsCadastroOpen(false);
                  setEditingId(null);
                  setActiveStep(0);
                  setFormData(initialForm);
                }}
              >
                {renderStepContent()}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 3,
                  }}
                >
                  {activeStep === steps.length - 1 ? (
                    <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                  }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={20} />
                      ) : editingId ? (
                        "Atualizar"
                      ) : (
                        "Criar"
                      )}
                    </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep((prev) => prev + 1)}
                      >
                        Proximo
                      </Button>
                    </Box>
                  )}
                 
                </Box>
              </StepWizardCard>
            ) : null}
          </>
        )}
      </Container>

      <Snackbar
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

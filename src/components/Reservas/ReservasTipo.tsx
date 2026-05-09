import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Article,
  Close,
  DeleteOutline,
  EditOutlined,
  ImageOutlined,
  LocationOn,
  Place,
  SearchOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import { areaImageService } from "../../services/areaImageService";
import { areaService } from "../../services/areaService";
import {
  condominiumService,
  type Condominium,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import type { AreaEnum, AreaRequest, AreaResponse } from "../../models/area.model";
import { formatCNPJ } from "../../shared/utils/funcoes";

type AreaFormState = {
  name: string;
  type: string;
  sizeM2: string;
  capacityPeople: string;
  startTime: string;
  endTime: string;
  operatingDays: string;
  hasReservationPrice: boolean;
  hasApprovalRequired: boolean;
  hasFee: boolean;
  feeAmount: string;
  hasDeposit: boolean;
  depositAmount: string;
  hasAllowsGuests: boolean;
  guestLimit: string;
  notes: string;
  imageFile: File | null;
};

const emptyForm: AreaFormState = {
  name: "",
  type: "",
  sizeM2: "",
  capacityPeople: "",
  startTime: "08:00:00",
  endTime: "22:00:00",
  operatingDays: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
  hasReservationPrice: false,
  hasApprovalRequired: false,
  hasFee: false,
  feeAmount: "0",
  hasDeposit: false,
  depositAmount: "0",
  hasAllowsGuests: false,
  guestLimit: "0",
  notes: "",
  imageFile: null,
};

const getStoredOrganizationName = () => {
  const stored = localStorage.getItem("condominium");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { name?: string; legalName?: string };
      return parsed?.name || parsed?.legalName || "";
    } catch {
      return "";
    }
  }

  return localStorage.getItem("organizationName") || "";
};

const toNumber = (value: string) => Number(value.replace(",", ".")) || 0;

const getEnumOptionLabel = (option: AreaEnum) =>
  option.description || option.value || String(option.id);

const getEnumOptionValue = (option: AreaEnum) =>
  String(option.value || option.id);

const getAreaImageUrl = (area: AreaResponse) => {
  if (!area.thumbnailFile || !area.contentType) return undefined;
  return `data:${area.contentType};base64,${area.thumbnailFile}`;
};

const toFormState = (area: AreaResponse): AreaFormState => ({
  name: area.name || "",
  type: String(area.type || ""),
  sizeM2: String(area.sizeM2 ?? ""),
  capacityPeople: String(area.capacityPeople ?? ""),
  startTime: area.startTime || "08:00:00",
  endTime: area.endTime || "22:00:00",
  operatingDays: area.operatingDays || emptyForm.operatingDays,
  hasReservationPrice: Boolean(area.hasReservationPrice),
  hasApprovalRequired: Boolean(area.hasApprovalRequired),
  hasFee: Boolean(area.hasFee),
  feeAmount: String(area.feeAmount ?? 0),
  hasDeposit: Boolean(area.hasDeposit),
  depositAmount: String(area.depositAmount ?? 0),
  hasAllowsGuests: Boolean(area.hasAllowsGuests),
  guestLimit: String(area.guestLimit ?? 0),
  notes: area.notes || "",
  imageFile: null,
});

export default function ReservasTipo() {
  const navigate = useNavigate();
  const [organizationName] = useState(
    () => getStoredOrganizationName() || "Organizacao",
  );
  const [activeView, setActiveView] = useState<"condominios" | "areas">(
    "condominios",
  );
  const [loading, setLoading] = useState(false);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [areas, setAreas] = useState<AreaResponse[]>([]);
  const [areaTypes, setAreaTypes] = useState<AreaEnum[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaResponse | null>(null);
  const [formData, setFormData] = useState<AreaFormState>(emptyForm);
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();

  const filteredCondominiums = useMemo(
    () =>
      condominiums.filter((condominium) =>
        [condominium.name, condominium.doc, condominium.city, condominium.state]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [condominiums, searchTerm],
  );

  const filteredAreas = useMemo(
    () =>
      areas.filter((area) =>
        [area.name, area.type, area.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [areas, searchTerm],
  );

  const loadCondominiums = async () => {
    setLoading(true);
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId = (await organizationService.getMyOrganizationId()) || "";
      }
      if (!organizationId) {
        showError("Organizacao nao identificada para consultar condominios.");
        return;
      }
      const response = await condominiumService.getCondominiums(
        organizationId,
        1,
        100,
      );
      setCondominiums(response.items ?? []);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Erro ao carregar condominios.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAreaTypes = async () => {
    try {
      setAreaTypes(await areaService.getAreaTypes());
    } catch {
      setAreaTypes([]);
    }
  };

  const loadAreas = async (condominium = selectedCondominium) => {
    if (!condominium?.condominiumId) return;
    setLoading(true);
    try {
      const response = await areaService.getAreas(
        condominium.condominiumId,
        1,
        100,
      );
      setAreas(response.items ?? []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCondominiums();
    void loadAreaTypes();
  }, []);

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setSearchTerm("");
    setActiveView("areas");
    await loadAreas(condominium);
  };

  const openCreate = () => {
    setEditingArea(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (area: AreaResponse) => {
    setEditingArea(area);
    setFormData(toFormState(area));
    setIsFormOpen(true);
  };

  const buildPayload = (): AreaRequest => ({
    name: formData.name.trim(),
    type: formData.type,
    sizeM2: toNumber(formData.sizeM2),
    capacityPeople: toNumber(formData.capacityPeople),
    startTime: formData.startTime,
    endTime: formData.endTime,
    operatingDays: formData.operatingDays.trim(),
    hasReservationPrice: formData.hasReservationPrice,
    hasApprovalRequired: formData.hasApprovalRequired,
    hasFee: formData.hasFee,
    feeAmount: toNumber(formData.feeAmount),
    hasDeposit: formData.hasDeposit,
    depositAmount: toNumber(formData.depositAmount),
    hasAllowsGuests: formData.hasAllowsGuests,
    guestLimit: toNumber(formData.guestLimit),
    notes: formData.notes.trim(),
    condominiumId: selectedCondominium?.condominiumId || "",
    commit: true,
  });

  const handleSave = async () => {
    if (!selectedCondominium?.condominiumId) {
      showError("Selecione um condominio antes de salvar a area.");
      return;
    }
    if (!formData.name.trim() || !formData.type) {
      showError("Informe nome e tipo da area.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const response = editingArea
        ? await areaService.updateArea(editingArea.areaId, payload)
        : await areaService.createArea(payload);
      const areaId = editingArea?.areaId || response.areaId;

      if (formData.imageFile) {
        await areaImageService.uploadAreaImage(areaId, formData.imageFile, "Main");
      }

      setIsFormOpen(false);
      showSuccess(editingArea ? "Area alterada com sucesso." : "Area criada com sucesso.");
      await loadAreas();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao salvar area.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (area: AreaResponse) => {
    if (!window.confirm(`Deseja excluir a area ${area.name}?`)) return;
    setLoading(true);
    try {
      await areaService.deleteArea(area.areaId);
      showSuccess("Area excluida com sucesso.");
      await loadAreas();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Erro ao excluir area.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (value: string | number) => {
    const match = areaTypes.find(
      (type) => type.value === value || type.id === value || String(type.id) === String(value),
    );
    return match ? getEnumOptionLabel(match) : String(value || "-");
  };

  return (
    <Box className="page-container">
      <Container maxWidth="xl">
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
                <Place sx={{ fontSize: 36, color: "#1976d2" }} />
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: 26 }}>
                  {organizationName}
                </Typography>
              </Box>
              <Tooltip title="Clique aqui para Fechar a janela">
                <IconButton
                  onClick={() => {
                    if (activeView === "areas") {
                      setActiveView("condominios");
                      setSelectedCondominium(null);
                      setAreas([]);
                      return;
                    }
                    navigate("/dashboard");
                  }}
                  className="close-button"
                  aria-label="Fechar"
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Container>
            <BreadcrumbTrail
              items={[
                "Organizacao",
                selectedCondominium?.name || "Condominios",
                "Areas",
              ]}
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : null}

            {activeView === "condominios" ? (
              <CardList
                title="Condominios"
                showTitle={false}
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setSearchTerm}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters
                showPagination={false}
                items={filteredCondominiums.map((condominium, index) => ({
                  id: condominium.condominiumId,
                  title: condominium.name,
                  subtitle: (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <Article sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatCNPJ(condominium.doc) || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <LocationOn sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {condominium.city} - {condominium.state}
                        </Typography>
                      </Box>
                    </Box>
                  ),
                  actions: (
                    <Button
                      size="small"
                      variant="outlined"
                      className="action-button-manage"
                      startIcon={<SearchOutlined />}
                      onClick={() => void handleSelectCondominium(condominium)}
                    >
                      Ver areas
                    </Button>
                  ),
                  imageUrl:
                    condominium.thumbnailFile && condominium.contentType
                      ? `data:${condominium.contentType};base64,${condominium.thumbnailFile}`
                      : undefined,
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
              />
            ) : (
              <CardList
                title="Areas"
                showTitle={false}
                searchPlaceholder="Buscar area..."
                onSearchChange={setSearchTerm}
                onAddClick={openCreate}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters
                showPagination={false}
                imageWidth={150}
                imageHeight={108}
                cardMaxHeight="none"
                items={filteredAreas.map((area, index) => ({
                  id: area.areaId,
                  title: area.name,
                  badge: getTypeLabel(area.type),
                  subtitle: (
                    <Typography variant="body2" color="text.secondary">
                      Capacidade: {area.capacityPeople || 0} pessoas | {area.startTime} - {area.endTime}
                    </Typography>
                  ),
                  meta: (
                    <Typography variant="caption" color="text.secondary">
                      {area.hasFee ? `Taxa: R$ ${area.feeAmount || 0}` : "Sem taxa"} |{" "}
                      {area.hasApprovalRequired ? "Exige aprovacao" : "Sem aprovacao"}
                    </Typography>
                  ),
                  actions: (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        className="action-button-edit"
                        startIcon={<EditOutlined />}
                        onClick={() => openEdit(area)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        className="action-button-delete"
                        startIcon={<DeleteOutline />}
                        onClick={() => void handleDelete(area)}
                      >
                        Excluir
                      </Button>
                    </Box>
                  ),
                  imageUrl: getAreaImageUrl(area),
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
              />
            )}
          </Paper>
        </Paper>
      </Container>

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingArea ? "Editar area" : "Nova area"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={formData.type}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, type: event.target.value }))
                }
              >
                <MenuItem value="" disabled>
                  Selecione
                </MenuItem>
                {areaTypes.map((type) => (
                  <MenuItem key={getEnumOptionValue(type)} value={getEnumOptionValue(type)}>
                    {getEnumOptionLabel(type)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tamanho m2"
                value={formData.sizeM2}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, sizeM2: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Capacidade"
                value={formData.capacityPeople}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    capacityPeople: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Inicio"
                value={formData.startTime}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, startTime: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fim"
                value={formData.endTime}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, endTime: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dias de funcionamento"
                value={formData.operatingDays}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    operatingDays: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasFee}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        hasFee: event.target.checked,
                      }))
                    }
                  />
                }
                label="Possui taxa"
              />
              <TextField
                fullWidth
                label="Valor taxa"
                value={formData.feeAmount}
                disabled={!formData.hasFee}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, feeAmount: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasDeposit}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        hasDeposit: event.target.checked,
                      }))
                    }
                  />
                }
                label="Possui caucao"
              />
              <TextField
                fullWidth
                label="Valor caucao"
                value={formData.depositAmount}
                disabled={!formData.hasDeposit}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    depositAmount: event.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasAllowsGuests}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        hasAllowsGuests: event.target.checked,
                      }))
                    }
                  />
                }
                label="Permite convidados"
              />
              <TextField
                fullWidth
                label="Limite convidados"
                value={formData.guestLimit}
                disabled={!formData.hasAllowsGuests}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, guestLimit: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasApprovalRequired}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        hasApprovalRequired: event.target.checked,
                      }))
                    }
                  />
                }
                label="Exige aprovacao"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasReservationPrice}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        hasReservationPrice: event.target.checked,
                      }))
                    }
                  />
                }
                label="Possui preco de reserva"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button component="label" variant="outlined" startIcon={<ImageOutlined />}>
                {formData.imageFile ? formData.imageFile.name : "Imagem principal"}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      imageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Observacoes"
                value={formData.notes}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

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
}

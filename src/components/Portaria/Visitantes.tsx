import { useEffect, useState } from "react";
import "./Visitantes.scss";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Apartment,
  Article,
  Badge,
  Close,
  DeleteOutline,
  Email,
  LocationOn,
  SupervisedUserCircle,
  Phone,
  Schedule,
  SearchOutlined,
  Home,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import VisitanteForm, { type ExistingVisitorFormData } from "./VisitanteForm";
import { visitorService } from "../../services/visitorService";
import type { VisitorEnum, VisitorResponse } from "../../models/visitor.model";
import {
  condominiumService,
  type Condominium,
  type CondominiumTypeEnum,
} from "../../services/condominiumService";
import { organizationService } from "../../services/organizationService";
import { formatCNPJ } from "../../shared/utils/funcoes";
import { desabilitarCampos } from "../../shared/utils/desabilitarCampos";

interface Visitor {
  id: string;
  fullName: string;
  documentType?: number | string;
  document: string;
  email: string;
  phone: string;
  visitorTypeId?: number | string;
  visitorType: string;
  condominium: string;
  unit: string;
  lastVisit: string;
  entryAt: string;
  exitAt: string;
  visitReasonId?: number | string;
  visitReason: string;
  notes: string;
  finished: boolean;
  active: boolean;
  releasedBy: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  activeVisitId?: string;
  imageUrl?: string;
  documentImageUrl?: string;
  accentColor: string;
}

const badgeStyles: Record<string, { color: string; backgroundColor: string }> =
  {
    "Visitante Comum": { color: "#224ecf", backgroundColor: "#dfe8ff" },
    "Prestador de Serviço": { color: "#17663f", backgroundColor: "#d8f3df" },
    Entregador: { color: "#8a4f00", backgroundColor: "#ffe9c7" },
  };

const getStoredOrganizationName = () => {
  const stored = localStorage.getItem("condominium");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as {
        name?: string;
        legalName?: string;
      };
      return parsed?.name || parsed?.legalName || "";
    } catch {
      return "";
    }
  }

  return localStorage.getItem("organizationName") || "";
};

const getVisitorImageUrl = (visitor: VisitorResponse) => {
  if (!visitor.facePhotoThumbnailFile || !visitor.facePhotoContentType) {
    return undefined;
  }

  return `data:${visitor.facePhotoContentType};base64,${visitor.facePhotoThumbnailFile}`;
};

const getVisitorDocumentImageUrl = (visitor: VisitorResponse) => {
  if (!visitor.documentPhotoThumbnailFile || !visitor.documentPhotoContentType) {
    return undefined;
  }

  return `data:${visitor.documentPhotoContentType};base64,${visitor.documentPhotoThumbnailFile}`;
};

const getVisitorTypeLabel = (visitor: VisitorResponse, visitorTypes: VisitorEnum[]) => {
  if (visitor.visitorType?.trim()) {
    return visitor.visitorType;
  }

  const visitorType = visitorTypes.find(
    (type) =>
      String(type.id) === String(visitor.visitorTypeId) ||
      String(type.value) === String(visitor.visitorTypeId),
  );
  return visitorType?.description || visitorType?.value || "Visitante";
};

const getVisitorReasonLabel = (
  visitor: VisitorResponse,
  visitorReasons: VisitorEnum[],
) => {
  const visitorReason = visitorReasons.find(
    (reason) =>
      String(reason.id) === String(visitor.typeVisitorReasonId) ||
      String(reason.value) === String(visitor.typeVisitorReasonId),
  );

  return visitorReason?.description || visitorReason?.value || "-";
};

const stringifySearchValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      stringifySearchValue(record.unitCode) ||
      stringifySearchValue(record.code) ||
      stringifySearchValue(record.name) ||
      stringifySearchValue(record.description) ||
      stringifySearchValue(record.condominiumUnitId)
    );
  }

  return "";
};

const getVisitorUnitLabel = (visitor: VisitorResponse) => {
  const source = visitor as VisitorResponse & Record<string, unknown>;
  const possibleUnitFields = [
    source.unitCode,
    source.apto,
    source.apartment,
    source.unidade,
    source.destinationUnit,
    source.condominiumUnitCode,
    source.condominiumUnit,
    source.condominiumUnitId,
  ];

  return (
    possibleUnitFields.map(stringifySearchValue).find(Boolean) || "-"
  );
};

const formatVisitDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  const datePart = date.toLocaleDateString("pt-BR");
  const timePart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${datePart} ${timePart}`;
};

const matchesVisitorSearch = (visitor: Visitor, search: string) => {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  const fields = [
    visitor.fullName,
    visitor.email,
    visitor.document,
    visitor.phone,
    visitor.unit,
  ];
  const searchableText = fields.filter(Boolean).join(" ").toLowerCase();
  const searchableDigits = fields
    .filter(Boolean)
    .join(" ")
    .replace(/\D/g, "");
  const searchDigits = normalizedSearch.replace(/\D/g, "");

  return (
    searchableText.includes(normalizedSearch) ||
    Boolean(searchDigits && searchableDigits.includes(searchDigits))
  );
};

const mapVisitorResponse = (
  visitor: VisitorResponse,
  condominiumName: string,
  index: number,
  visitorTypes: VisitorEnum[],
  visitorReasons: VisitorEnum[],
): Visitor => ({
  id: visitor.visitorId,
  fullName: visitor.name || "-",
  documentType: visitor.documentType,
  document: visitor.documentNumber || "-",
  email: visitor.email || "-",
  phone: visitor.phone || "-",
  visitorTypeId: visitor.visitorTypeId,
  visitorType: getVisitorTypeLabel(visitor, visitorTypes),
  condominium: condominiumName,
  unit: getVisitorUnitLabel(visitor),
  lastVisit: formatVisitDate(visitor.entryAt || visitor.createdAt),
  entryAt: formatVisitDate(visitor.entryAt),
  exitAt: formatVisitDate(visitor.exitAt),
  visitReasonId: visitor.typeVisitorReasonId,
  visitReason: getVisitorReasonLabel(visitor, visitorReasons),
  notes: visitor.notes || "-",
  finished: Boolean(visitor.finished),
  active: Boolean(visitor.active),
  releasedBy: visitor.createdByName || visitor.createdBy || "-",
  createdAt: formatVisitDate(visitor.createdAt),
  createdBy: visitor.createdByName || visitor.createdBy || "-",
  updatedAt: formatVisitDate(visitor.updatedAt),
  updatedBy: visitor.updatedByName || visitor.updatedBy || "-",
  activeVisitId: visitor.visitorHistoryId,
  imageUrl: getVisitorImageUrl(visitor),
  documentImageUrl: getVisitorDocumentImageUrl(visitor),
  accentColor: index % 2 === 0 ? "#edf7f0" : "#eef5ff",
});

export default function Visitantes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"condominios" | "visitantes">(
    "condominios",
  );
  const [organizationName] = useState(
    () => getStoredOrganizationName() || "Organização",
  );
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);
  const [selectedCondominium, setSelectedCondominium] =
    useState<Condominium | null>(null);
  const [condoSearchTerm, setCondoSearchTerm] = useState("");
  const [condoPage, setCondoPage] = useState(1);
  const [condoTotalPages, setCondoTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [visitorsTotalPages, setVisitorsTotalPages] = useState(1);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [existingVisitor, setExistingVisitor] =
    useState<ExistingVisitorFormData | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    name: string;
  } | null>(null);
  const [finishVisitTarget, setFinishVisitTarget] = useState<Visitor | null>(null);
  const [finishVisitReasonId, setFinishVisitReasonId] = useState("");
  const [finishVisitNotes, setFinishVisitNotes] = useState("");
  const [finishVisitNotesError, setFinishVisitNotesError] = useState("");
  const [visitorReasons, setVisitorReasons] = useState<VisitorEnum[]>([]);
  const { appStateModal, handleClose, showSuccess, showError } = useAppStateModal();

  const filteredVisitors = visitors.filter((visitor) =>
    matchesVisitorSearch(visitor, searchTerm),
  );

  const condoPageSize = 4;
  const pageSize = 4;

  const loadCondominiumTypes = async () => {
    try {
      const data = await condominiumService.getCondominiumTypes();
      setCondominiumTypes(data ?? []);
    } catch {
      setCondominiumTypes([]);
    }
  };

  const getCondominiumTypeLabel = (value: string | number) => {
    const match = condominiumTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.description || match?.value || String(value || "-");
  };

  const loadCondominiums = async (pageNumber = 1) => {
    setLoading(true);
    try {
      let organizationId = localStorage.getItem("organizationId") || "";
      if (!organizationId) {
        organizationId =
          (await organizationService.getMyOrganizationId()) || "";
      }

      if (!organizationId) {
        showError("Organizacao nao identificada para consultar condominios.");
        return;
      }

      const response = await condominiumService.getCondominiums(
        organizationId,
        pageNumber,
        condoPageSize,
      );
      const items = response.items ?? [];
      setCondominiums(items);
      setCondoPage(response.paging?.pageNumber ?? pageNumber);
      setCondoTotalPages(
        response.paging?.totalPages ??
          Math.max(
            1,
            Math.ceil((response.paging?.total ?? items.length) / condoPageSize),
          ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar condominios.";
    } finally {
      setLoading(false);
    }
  };

  const loadVisitors = async (
    condominium: Condominium | null = selectedCondominium,
    pageNumber = 1,
  ) => {
    if (!condominium?.condominiumId) {
      showError("Selecione um condominio para consultar visitantes.");
      return;
    }

    setLoading(true);
    try {
      const [response, visitorTypes, reasons] = await Promise.all([
        visitorService.getVisitors(
          condominium.condominiumId,
          pageNumber,
          pageSize,
        ),
        visitorService.getVisitorTypes(),
        visitorService.getVisitorReasons(),
      ]);
      setVisitorReasons(reasons ?? []);
      setVisitors(
        (response.items ?? []).map((visitor, index) =>
          mapVisitorResponse(
            visitor,
            condominium.name,
            index,
            visitorTypes ?? [],
            reasons ?? [],
          ),
        ),
      );
      setPage(response.paging?.pageNumber ?? pageNumber);
      setVisitorsTotalPages(
        response.paging?.totalPages ??
          Math.max(
            1,
            Math.ceil((response.paging?.total ?? response.items?.length ?? 0) / pageSize),
          ),
      );
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Erro ao carregar visitantes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCondominiums(1);
    void loadCondominiumTypes();
    void visitorService.getVisitorReasons().then(setVisitorReasons).catch(() => {
      setVisitorReasons([]);
    });
  }, []);

  const handleSelectCondominium = async (condominium: Condominium) => {
    setSelectedCondominium(condominium);
    setVisitors([]);
    setSearchTerm("");
    setPage(1);
    setVisitorsTotalPages(1);
    setActiveView("visitantes");
    await loadVisitors(condominium, 1);
  };

  const currentPage = Math.min(page, visitorsTotalPages);

  const filteredCondominiums = condominiums.filter((condominium) =>
    [condominium.name, condominium.doc, condominium.city, condominium.state]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(condoSearchTerm.trim().toLowerCase()),
  );

  const handleOpenFinishVisit = (visitor: Visitor) => {
    setFinishVisitTarget(visitor);
    setFinishVisitReasonId(
      visitor.visitReasonId !== undefined && visitor.visitReasonId !== null
        ? String(visitor.visitReasonId)
        : "",
    );
    setFinishVisitNotes("");
    setFinishVisitNotesError("");
  };

  const handleCloseFinishVisit = () => {
    setFinishVisitTarget(null);
    setFinishVisitReasonId("");
    setFinishVisitNotes("");
    setFinishVisitNotesError("");
  };

  const handleFinishVisit = async () => {
    if (!finishVisitTarget?.activeVisitId) {
      showError(
        "Nao foi possivel finalizar.",
        "A listagem atual nao retornou o identificador da visita desse visitante.",
      );
      return;
    }

    if (!finishVisitReasonId) {
      showError("Selecione o motivo da visita para finalizar.");
      return;
    }

    if (!finishVisitNotes.trim()) {
      setFinishVisitNotesError("Informe a observacao para finalizar a visita.");
      return;
    }

    setLoading(true);
    try {
      await visitorService.finishVisit(finishVisitTarget.activeVisitId, {
        exitAt: new Date().toISOString(),
        typeVisitorReasonId: finishVisitReasonId,
        notes: finishVisitNotes.trim(),
      });
      showSuccess("Visita finalizada com sucesso.");
      handleCloseFinishVisit();
      await loadVisitors(selectedCondominium, page);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao finalizar visita.";
      showError(message);
    } finally {
      setLoading(false);
    }
  };
  const handleNewVisit = async (visitor: Visitor) => {
    if (!visitor.finished) {
      return;
    }

    setLoading(true);
    try {
      const response = await visitorService.getVisitorById(visitor.id);
      setExistingVisitor({
        id: response.visitorId || visitor.id,
        fullName: response.name || visitor.fullName,
        documentType: response.documentType || visitor.documentType,
        document: response.documentNumber || visitor.document,
        email: response.email || visitor.email,
        phone: response.phone || visitor.phone,
        visitorType: response.visitorTypeId || visitor.visitorTypeId || visitor.visitorType,
        visitorReasonId:
          response.typeVisitorReasonId ?? visitor.visitReasonId,
        notes: response.notes || (visitor.notes === "-" ? "" : visitor.notes),
        facePhotoUrl: getVisitorImageUrl(response) || visitor.imageUrl,
        documentPhotoUrl:
          getVisitorDocumentImageUrl(response) || visitor.documentImageUrl,
      });
      setIsCadastroOpen(true);
    } catch (error) {
      setExistingVisitor({
        id: visitor.id,
        fullName: visitor.fullName,
        documentType: visitor.documentType,
        document: visitor.document,
        email: visitor.email,
        phone: visitor.phone,
        visitorType: visitor.visitorTypeId || visitor.visitorType,
        visitorReasonId: visitor.visitReasonId,
        notes: visitor.notes === "-" ? "" : visitor.notes,
        facePhotoUrl: visitor.imageUrl,
        documentPhotoUrl: visitor.documentImageUrl,
      });
      setIsCadastroOpen(true);
      console.error(
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados do visitante.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisitor = () => {
    setExistingVisitor(null);
    setIsCadastroOpen(true);
  };

  const handleCloseForm = () => {
    setIsCadastroOpen(false);
    setExistingVisitor(null);
  };

  const handleSaved = async (visitor: Visitor) => {
    setVisitors((current) => [visitor, ...current]);
    setSearchTerm("");
    setPage(1);
    await loadVisitors(selectedCondominium, 1);
  };

  return (
    <Box className="visitantes-container" sx={{position:'relative'}}>
      <Container maxWidth="xl" >
        {isCadastroOpen ? (
          <VisitanteForm
            open={isCadastroOpen}
            organizationName={selectedCondominium?.name || organizationName}
            condominiumId={selectedCondominium?.condominiumId || ""}
            loading={loading}
            setLoading={setLoading}
            onClose={handleCloseForm}
            onSaved={handleSaved}
            existingVisitor={existingVisitor}
          />
        ) : (
          <Paper elevation={3} sx={{ p: activeView === "visitantes" ? 2 : 3 }}>
            <Box
              sx={{
                mb: activeView === "visitantes" ? 1.5 : 2,
                pb: activeView === "visitantes" ? 1 : 1.5,
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
                  {activeView === "condominios" ? (
            <Apartment sx={{ fontSize: 36, color: "#2563eb" }} />
                  ) : (
            <SupervisedUserCircle sx={{ fontSize: 36, color: "#f97316" }} />
                  )}
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
                      if (activeView === "visitantes") {
                        setActiveView("condominios");
                        setSelectedCondominium(null);
                        setVisitors([]);
                        setSearchTerm("");
                        setPage(1);
                        setVisitorsTotalPages(1);
                        return;
                      }
                      navigate("/dashboard");
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
                  items={
                    activeView === "condominios"
                      ? ["Condominios"]
                      : [selectedCondominium?.name || "Condominios", "Visitantes"]
                  }
                />
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: activeView === "visitantes" ? 1.5 : 2 }}>
              {activeView === "condominios" ? (
                <CardList
                  title="Condominios"
                  showTitle={false}
                  variant="condominiumSelection"
                  searchPlaceholder="Buscar condominio..."
                  onSearchChange={(value) => {
                    setCondoSearchTerm(value);
                    setCondoPage(1);
                  }}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel={t("common.noImage")}
                  showFilters
                  showPagination={condoTotalPages > 1}
                  page={condoPage}
                  totalPages={condoTotalPages}
                  onPageChange={(nextPage) => {
                    setCondoPage(nextPage);
                    void loadCondominiums(nextPage);
                  }}
                  items={filteredCondominiums.map((condominium, index) => ({
                    id: condominium.condominiumId,
                    title: condominium.name,
                    subtitle: (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                          <Typography variant="body2" color="text.secondary">
                            {getCondominiumTypeLabel(condominium.condominiumType)}
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
                        Ver visitantes
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
                <>
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando visitantes...</Typography>
                </Box>
              ) : null}
              <CardList
                title="Visitantes"
                showTitle={false}
                searchPlaceholder="Buscar por nome, email, documento, telefone ou apto..."
                onSearchChange={(value) => {
                  setSearchTerm(value);
                  setPage(1);
                }}
                onAddClick={handleCreateVisitor}
                addLabel={t("common.new")}
                addButtonPlacement="toolbar"
                emptyImageLabel={t("common.noImage")}
                showFilters
                showPagination={true}
                cardMaxHeight="none"
                imageWidth={138}
                imageHeight={96}
                actionsMarginTop={1}
                dense
                page={currentPage}
                totalPages={visitorsTotalPages}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  void loadVisitors(selectedCondominium, nextPage);
                }}
                items={filteredVisitors.map((visitor) => {
                  const badgeStyle = badgeStyles[visitor.visitorType] ?? {
                    color: "#355070",
                    backgroundColor: "#e8edf5",
                  };

                  return {
                    id: visitor.id,
                    title: visitor.fullName,
                    badge: (
                      <Chip
                        label={visitor.visitorType}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          color: badgeStyle.color,
                          backgroundColor: badgeStyle.backgroundColor,
                        }}
                      />
                    ),
                    subtitle: (
                      <Box
                        sx={{ display: "flex", flexDirection: "column", gap:  0}}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                          }}
                        >
                          <Badge sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            {visitor.document}
                          </Typography>
                        </Box>
                        <Box
                             sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                          }}
                          >
                            <Email sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{visitor.email}</Typography>
                          </Box>
                         <Box
                             sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                          }}
                          >
                            <Phone sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{visitor.phone}</Typography>
                          </Box>
                      </Box>
                    ),
                    meta: (
                      <Box
                        sx={{
                          mt: 0,
                          p: 0.35,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.55)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.2,
                        }}
                      >
                      {/*   <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Home sx={{ fontSize: 18, color: "#5173a8" }} />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            Unidade: {visitor.unit}
                          </Typography>
                        </Box> */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.2,
                            color: "text.secondary",
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "18px 104px 1fr",
                              alignItems: "center",
                              columnGap: 1,
                            }}
                          >
                            <Schedule sx={{ fontSize: 18 }} />
                            <Typography variant="body2">Inicio da visita:</Typography>
                            <Typography variant="body2">{visitor.entryAt}</Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "18px 104px 1fr",
                              alignItems: "center",
                              columnGap: 1,
                            }}
                          >
                            <Schedule sx={{ fontSize: 18 }} />
                            <Typography variant="body2">Fim da visita:</Typography>
                            <Typography variant="body2">{visitor.exitAt}</Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <Article sx={{ fontSize: 18 }} />
                            <Typography variant="body2">
                              Motivo: {visitor.visitReason}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ),
                    actions: (
                      <Box
                        sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-edit"
                          startIcon={<Add />}
                          disabled={!visitor.finished}
                          onClick={() => void handleNewVisit(visitor)}
                        >
                          Nova Visita
                        </Button>
                        {!visitor.finished &&
                          <Button
                            size="small"
                            variant="outlined"
                            className="action-button-delete"
                            startIcon={<DeleteOutline />}
                            onClick={() => handleOpenFinishVisit(visitor)}
                          >
                            Finalizar visita
                          </Button>
                        }
                      </Box>
                    ),
                    imageUrl: visitor.imageUrl,
                    onImageClick: visitor.imageUrl
                      ? () =>
                          setSelectedImage({
                            src: visitor.imageUrl!,
                            name: visitor.fullName,
                          })
                      : undefined,
                    accentColor: visitor.accentColor,
                    toolTip: visitor.imageUrl
                      ? "Clique para ampliar a foto"
                      : "Sem imagem",
                  };
                })}
              />
                </>
              )}
            </Paper>
          </Paper>
        )}
      </Container>

{finishVisitTarget ? (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(2px)",
      zIndex: 1300,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 2,
    }}
  >
    <StepWizardCard
      title="Finalizar visita"
      subtitle="Finalização"
      steps={["Finalização"]}
      activeStep={0}
      showBack
      backLabel="Voltar"
      onBack={handleCloseFinishVisit}
      onClose={handleCloseFinishVisit}
      width="min(650px, calc(100vw - 32px))"
      disableContent={loading}
      actions={
        <Button
          variant="contained"
          onClick={() => void handleFinishVisit()}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Concluir"}
        </Button>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          select
          disabled
          sx={desabilitarCampos}
          fullWidth
          label={finishVisitReasonId ? "" : "Servico"}
          value={finishVisitReasonId}
          onChange={(event) => setFinishVisitReasonId(event.target.value)}
        >
          {visitorReasons.map((reason) => (
            <MenuItem
              key={String(reason.id)}
              value={String(reason.id || reason.value)}
            >
              {reason.description || reason.value}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          multiline
          minRows={4}
          label={finishVisitNotes ? "" : "Observacoes"}
          placeholder="Observacoes"
          value={finishVisitNotes}
          onChange={(event) => {
            setFinishVisitNotes(event.target.value);
            if (finishVisitNotesError) {
              setFinishVisitNotesError("");
            }
          }}
          error={Boolean(finishVisitNotesError)}
          helperText={finishVisitNotesError}
        />
      </Box>
    </StepWizardCard>
  </Box>
) : null}

      <Dialog
        open={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {selectedImage?.name}
          </Typography>
          <IconButton
            onClick={() => setSelectedImage(null)}
            aria-label="Fechar"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 3 }}>
          {selectedImage ? (
            <Box
              component="img"
              src={selectedImage.src}
              alt={selectedImage.name}
              sx={{
                width: "100%",
                maxHeight: 520,
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AppStateModal
        showCancel={false}
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

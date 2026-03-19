import { useState } from "react";
import "./Visitantes.scss";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Apartment,
  Badge,
  Business,
  Close,
  DeleteOutline,
  Email,
  Person,
  Phone,
  Schedule,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import CardList from "../../shared/components/CardList";
import BreadcrumbTrail from "../../shared/components/BreadcrumbTrail";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";
import VisitanteForm from "./VisitanteForm";

interface Visitor {
  id: string;
  fullName: string;
  document: string;
  email: string;
  phone: string;
  visitorType: string;
  condominium: string;
  unit: string;
  lastVisit: string;
  releasedBy: string;
  imageUrl?: string;
  accentColor: string;
}

const visitorsSeed: Visitor[] = [
  {
    id: "1",
    fullName: "Carlos Eduardo Silva",
    document: "123.456.789-00",
    email: "carlos.silva@email.com",
    phone: "(41) 99999-9999",
    visitorType: "Visitante Comum",
    condominium: "Pallo Alto Residence",
    unit: "Apto 101",
    lastVisit: "06/03/2026 14:30",
    releasedBy: "João Administrador",
    imageUrl: "https://i.pravatar.cc/320?img=12",
    accentColor: "#edf7f0",
  },
  {
    id: "2",
    fullName: "Maria Fernanda Costa",
    document: "987.654.321-00",
    email: "maria.costa@email.com",
    phone: "(41) 98888-8888",
    visitorType: "Prestador de Serviço",
    condominium: "Condomínio do Zeca",
    unit: "Casa 12",
    lastVisit: "05/03/2026 09:15",
    releasedBy: "Ana Portaria",
    accentColor: "#fcf0f6",
  },
  {
    id: "3",
    fullName: "Bruno Oliveira Santos",
    document: "456.789.123-45",
    email: "bruno.santos@email.com",
    phone: "(41) 97777-2323",
    visitorType: "Entregador",
    condominium: "Pallo Alto Residence",
    unit: "Torre B 304",
    lastVisit: "03/03/2026 18:05",
    releasedBy: "Paula Recepção",
    imageUrl: "https://i.pravatar.cc/320?img=58",
    accentColor: "#eef5ff",
  },
];

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

export default function Visitantes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [organizationName] = useState(
    () => getStoredOrganizationName() || "Organização",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [visitors, setVisitors] = useState<Visitor[]>(visitorsSeed);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    name: string;
  } | null>(null);
  const { appStateModal, handleClose, showSuccess } = useAppStateModal();

  const filteredVisitors = visitors.filter((visitor) =>
    visitor.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredVisitors.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedVisitors = filteredVisitors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleDelete = (visitor: Visitor) => {
    if (
      !window.confirm(
        `Deseja realmente excluir o visitante ${visitor.fullName}?`,
      )
    ) {
      return;
    }

    setVisitors((current) => current.filter((item) => item.id !== visitor.id));
    showSuccess("Visitante excluído com sucesso.");
  };

  const handleNewVisit = (visitor: Visitor) => {
    showSuccess(`Nova visita preparada para ${visitor.fullName}.`);
  };

  const handleCreateVisitor = () => {
    setIsCadastroOpen(true);
  };

  const handleCloseForm = () => {
    setIsCadastroOpen(false);
  };

  const handleSaved = async (visitor: Visitor) => {
    setVisitors((current) => [visitor, ...current]);
    setSearchTerm("");
    setPage(1);
  };

  return (
    <Box className="visitantes-container">
      <Container maxWidth="xl">
        {isCadastroOpen ? (
          <VisitanteForm
            open={isCadastroOpen}
            organizationName={organizationName}
            loading={loading}
            setLoading={setLoading}
            onClose={handleCloseForm}
            onSaved={handleSaved}
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
                  items={[t("common.organization"), "Visitantes"]}
                />
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <CardList
                title="Visitantes"
                showTitle={false}
                searchPlaceholder="Buscar visitante..."
                onSearchChange={(value) => {
                  setSearchTerm(value);
                  setPage(1);
                }}
                onAddClick={handleCreateVisitor}
                addLabel={t("common.new")}
                addButtonPlacement="toolbar"
                emptyImageLabel={t("common.noImage")}
                showFilters
                showPagination={filteredVisitors.length > pageSize}
                cardMaxHeight="none"
                imageWidth={154}
                imageHeight={112}
                actionsMarginTop={2}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                items={paginatedVisitors.map((visitor) => {
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
                        sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                          }}
                        >
                          <Badge sx={{ fontSize: 18 }} />
                          <Typography variant="body2">
                            {visitor.document}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            color: "text.secondary",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                              flex: "1 1 240px",
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
                              minWidth: 0,
                              flex: "1 1 180px",
                            }}
                          >
                            <Phone sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{visitor.phone}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    ),
                    meta: (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          height: "100px",
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.55)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Apartment sx={{ fontSize: 18, color: "#5173a8" }} />
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            {visitor.condominium} | {visitor.unit}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            color: "text.secondary",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                              flex: "1 1 220px",
                            }}
                          >
                            <Schedule sx={{ fontSize: 18 }} />
                            <Typography variant="body2">
                              Ultima visita: {visitor.lastVisit}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                              flex: "1 1 220px",
                            }}
                          >
                            <Person sx={{ fontSize: 18 }} />
                            <Typography variant="body2">
                              Liberado por: {visitor.releasedBy}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ),
                    actions: (
                      <Box
                        sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 3 }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-edit"
                          startIcon={<Add />}
                          onClick={() => handleNewVisit(visitor)}
                        >
                          Nova Visita
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          className="action-button-delete"
                          startIcon={<DeleteOutline />}
                          onClick={() => handleDelete(visitor)}
                        >
                          Excluir
                        </Button>
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
            </Paper>
          </Paper>
        )}
      </Container>

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

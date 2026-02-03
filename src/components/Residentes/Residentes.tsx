import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { PeopleOutlined } from "@mui/icons-material";
import {
  unitResidentService,
  type CondominiumUnitResident,
} from "../../services/unitResidentService";
import CardList from "../../shared/components/CardList";
import ResidenteForm from "./ResidenteForm";

const pageSize = 6;

const Residentes: React.FC = () => {
  const [unitIdQuery, setUnitIdQuery] = useState("");
  const [residents, setResidents] = useState<CondominiumUnitResident[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const loadResidents = async (pageNumber = 1) => {
    if (!unitIdQuery.trim()) {
      setListError("Informe o CondominiumUnitId para carregar os residentes.");
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const data = await unitResidentService.getResidents(
        unitIdQuery.trim(),
        pageNumber,
        pageSize,
      );
      setResidents(data ?? []);
      setListPage(pageNumber);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar residentes.";
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSaved = async () => {
    await loadResidents(listPage);
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {isFormOpen ? (
          <ResidenteForm
            open={isFormOpen}
            onClose={handleCloseForm}
            onSaved={handleSaved}
            onNotify={handleNotify}
            loading={loading}
            setLoading={setLoading}
            unitIdPreset={unitIdQuery.trim()}
          />
        ) : (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <PeopleOutlined sx={{ fontSize: 32, color: "#1976d2" }} />
              <Typography variant="h4">Residentes</Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <TextField
                label="CondominiumUnitId (consulta)"
                value={unitIdQuery}
                onChange={(e) => setUnitIdQuery(e.target.value)}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => loadResidents(1)}
                disabled={listLoading}
              >
                {listLoading ? <CircularProgress size={20} /> : "Carregar residentes"}
              </Button>
            </Box>

            {listError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {listError}
              </Alert>
            ) : null}

            {listLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : (
              <CardList
                title="Residentes"
                showTitle={false}
                searchPlaceholder="Buscar residente..."
                onSearchChange={setSearchText}
                onAddClick={handleOpenCreate}
                addLabel="Novo"
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters={false}
                showPagination={false}
                items={residents
                  .filter((resident) =>
                    [resident.userId, resident.condominiumUnitId]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase()
                      .includes(searchText.toLowerCase()),
                  )
                  .map((resident, index) => ({
                    id: resident.condominiumUnitResidentId,
                    title: resident.userId,
                    subtitle: `Unidade: ${resident.condominiumUnitId}`,
                    meta: `Periodo: ${resident.startDate || "-"} -> ${resident.endDate || "-"}`,
                    accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                  }))}
              />
            )}
          </Paper>
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

export default Residentes;


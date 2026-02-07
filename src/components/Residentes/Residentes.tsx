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
        {activeView === "condominios" ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <PeopleOutlined sx={{ fontSize: 32, color: "#1976d2" }} />
              <Typography variant="h4">{organizationName || "Residentes"}</Typography>
            </Box>

            {condoLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : condoError ? (
              <Alert severity="error">{condoError}</Alert>
            ) : (
              <CardList
                title="Condominios da organizacao"
                showTitle={false}
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setCondoSearchText}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                page={condoPage}
                totalPages={condoTotalPages}
                onPageChange={(page) => {
                  setCondoPage(page);
                  loadCondominiums(page);
                }}
                items={condominiums
                  .filter((condominium) =>
                    [condominium.name, condominium.city, condominium.state]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase()
                      .includes(condoSearchText.toLowerCase()),
                  )
                  .map((condominium, index) => ({
                    id: condominium.condominiumId,
                    title: condominium.name,
                    subtitle: (
                      <Typography variant="body2" color="text.secondary">
                        {condominium.city} - {condominium.state}
                      </Typography>
                    ),
                    accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                    actions: (
                      <Button
                        size="small"
                        variant="outlined"
                        className="action-button-manage"
                        onClick={() => handleSelectCondominium(condominium)}
                      >
                        Ver unidades
                      </Button>
                    ),
                  }))}
              />
            )}
          </Paper>
        ) : activeView === "unidades" ? (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <IconButton
                onClick={() => {
                  setActiveView("condominios");
                  setSelectedCondominium(null);
                  setUnits([]);
                  setBlocks({ data: [], success: false });
                  setSelectedBlockId("");
                  setSelectedUnit(null);
                  setResidents([]);
                  setUnitsError(null);
                  setResidentsError(null);
                }}
              >
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h5">Unidades</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCondominium?.name || "Condominio selecionado"}
                </Typography>
              </Box>
            </Box>

            {unitsLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : unitsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {unitsError}
              </Alert>
            ) : null}

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <TextField
                label="Filtrar por bloco"
                select
                value={selectedBlockId}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSelectedBlockId(value);
                  setUnitSearchText("");
                  setUnitsPage(1);
                  await loadUnits(value, 1);
                }}
                fullWidth
              >
                <MenuItem value="">Todos os blocos</MenuItem>
                {blocks.data.map((block) => (
                  <MenuItem key={block.condominiumBlockId} value={block.condominiumBlockId}>
                    {block.name || block.code || block.condominiumBlockId}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <CardList
              title="Unidades do condominio"
              showTitle={false}
              showFilters={false}
              searchPlaceholder="Buscar unidade..."
              onSearchChange={setUnitSearchText}
              onAddClick={undefined}
              addButtonPlacement="toolbar"
              emptyImageLabel="Sem imagem"
              page={unitsPage}
              totalPages={unitsTotalPages}
              onPageChange={(page) => {
                setUnitsPage(page);
                loadUnits(selectedBlockId || undefined, page);
              }}
              items={units
                .filter((unit) =>
                  [unit.unitCode, unit.unitType, unit.condominiumBlockId]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(unitSearchText.toLowerCase()),
                )
                .map((unit, index) => ({
                  id: unit.condominiumUnitId,
                  title: unit.unitCode || "Sem codigo",
                  subtitle: (
                    <Typography variant="body2" color="text.secondary">
                      Tipo: {getUnitTypeLabel(unit.unitType?.toString())}
                    </Typography>
                  ),
                  meta: (
                    <Typography variant="caption" color="text.secondary">
                      Bloco:{" "}
                      {blocks.data.find((b) => b.condominiumBlockId === unit.condominiumBlockId)
                        ?.name ||
                        unit.condominiumBlockId ||
                        "Bloco desconhecido"}
                    </Typography>
                  ),
                  actions: (
                    <Button size="small" variant="outlined" onClick={() => handleSelectUnit(unit)}>
                      Ver residentes
                    </Button>
                  ),
                  accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
                }))}
            />
          </Paper>
        ) : (
          <>
            {isFormOpen ? (
              <ResidenteForm
                open={isFormOpen}
                onClose={handleCloseForm}
                onSaved={handleSaved}
                onNotify={handleNotify}
                loading={loading}
                setLoading={setLoading}
                unitIdPreset={selectedUnit?.condominiumUnitId}
              />
            ) : null}
            {!isFormOpen ? (
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <IconButton
                    onClick={() => {
                      setActiveView("unidades");
                      setSelectedUnit(null);
                      setResidents([]);
                      setResidentSearchText("");
                      setResidentsError(null);
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h5">Residentes</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCondominium?.name || "Condominio"} •{" "}
                      {selectedUnit?.unitCode || selectedUnit?.condominiumUnitId || "Unidade"}
                      {selectedBlockName ? ` • Bloco ${selectedBlockName}` : ""}
                    </Typography>
                  </Box>
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


import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import CardList from "../../shared/components/CardList";
import { profileService, type Profile } from "../../services/profileService";

const Perfis: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfiles();
      setProfiles(data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar perfis.";
      setError(message);
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const items = useMemo(
    () =>
      profiles
        .filter((profile) =>
          [profile.code, profile.name, String(profile.profileId)]
            .join(" ")
            .toLowerCase()
            .includes(searchText.toLowerCase()),
        )
        .map((profile, index) => ({
          id: String(profile.profileId),
          title: profile.name,
          subtitle: (
            <Typography variant="body2" color="text.secondary">
              Codigo: {profile.code}
            </Typography>
          ),
          meta: (
            <Typography variant="caption" color="text.secondary">
              Id: {profile.profileId}
            </Typography>
          ),
          accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
        })),
    [profiles, searchText],
  );

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Carregando...</Typography>
            </Box>
          ) : (
            <>
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : null}
              <CardList
                title="Profiles"
                showTitle={false}
                searchPlaceholder="Buscar profile..."
                onSearchChange={setSearchText}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                showFilters={true}
                showPagination={false}
                items={items}
              />
            </>
          )}
        </Paper>
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

export default Perfis;

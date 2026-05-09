import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import {
  BadgeOutlined,
  DeleteOutline,
  EditOutlined,
  Fingerprint,
} from "@mui/icons-material";
import CardList from "../../shared/components/CardList";
import { profileService, type Profile } from "../../services/profileService";
import { AppStateModal } from "../../shared/components/AppStateModal";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";

const getProfileInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter((word) => !["de", "da", "do", "das", "dos"].includes(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const Perfis: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const { appStateModal, handleClose, showError } = useAppStateModal();

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
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleDelete = async (profile: Profile) => {
    if (!window.confirm(`Deseja excluir o perfil ${profile.name}?`)) return;

    setLoading(true);
    try {
      await profileService.deleteProfile(profile.profileId);
      await loadProfiles();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir perfil.";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo(
    () =>
      profiles
        .filter((profile) =>
          [profile.code, profile.name, String(profile.profileId)]
            .join(" ")
            .toLowerCase()
            .includes(searchText.toLowerCase()),
        )
        .map((profile, index) => {
          const initials = getProfileInitials(profile.name);

          return {
            id: String(profile.profileId),
            title: `${profile.name} (${initials})`,
            subtitle: (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <BadgeOutlined sx={{ fontSize: 18, color: "#1976d2" }} />
                <Typography variant="body2" color="text.secondary">
                  Sigla: {initials}
                </Typography>
              </Box>
            ),
            meta: (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.5 }}>
                <Fingerprint sx={{ fontSize: 18, color: "#64748b" }} />
                <Typography variant="caption" color="text.secondary">
                  Id: {profile.profileId}
                </Typography>
              </Box>
            ),
            actions: (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined />}
                  disabled
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutline />}
                  onClick={() => void handleDelete(profile)}
                >
                  Excluir
                </Button>
              </Box>
            ),
            accentColor: index % 2 === 0 ? "#eef6ee" : "#fdecef",
          };
        }),
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
                haveImage={false}
                actionsMarginTop={1.5}
                items={items}
              />
            </>
          )}
        </Paper>
      </Container>

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
};

export default Perfis;

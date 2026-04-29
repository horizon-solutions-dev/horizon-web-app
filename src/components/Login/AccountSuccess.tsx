import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import "./AccountSuccess.scss";
import Check from "../../assets/5610944.png";
interface AccountSuccessProps {
  loading?: boolean;
  onSetup: () => void;
  onAccessAccount?: () => void;
}

export default function AccountSuccess({
  loading = false,
  onSetup,
}: AccountSuccessProps) {
  return (
    <Box className="account-success-page">
      <Container maxWidth="md" className="account-success-container">
        <Paper elevation={0} className="account-success-card">
          <Box>
            <img src={Check} width={"50px"} />
          </Box>

          <Typography className="account-success-title">
            Código validado com sucesso!
          </Typography>

          <Typography className="account-success-subtitle">
            Sua conta foi verificada com sucesso.
          </Typography>

          <Typography className="account-success-subtitle">
            Agora você já pode aproveitar todas as funcionalidades da
            plataforma.
          </Typography>

          <Box className="account-success-highlight">
            <ShieldOutlinedIcon />
            <Typography>Sua conta está segura e pronta para uso.</Typography>
          </Box>

          <Box className="account-success-actions">
            <Button
              className="account-success-button account-success-button--primary"
              onClick={onSetup}
              disabled={loading}
              startIcon={<SettingsOutlinedIcon />}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Ir para Configuração inicial"
              )}
            </Button>

          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

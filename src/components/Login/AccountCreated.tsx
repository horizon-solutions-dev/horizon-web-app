import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import "./AccountCreated.scss";
import Check from "../../assets/5610944.png";
interface AccountCreatedProps {
  email?: string;
  loading?: boolean;
  resendLoading?: boolean;
  onValidateCode: () => void;
  onResendCode: () => void;
}

export default function AccountCreated({
  email,
  loading = false,
  resendLoading = false,
  onValidateCode,
  onResendCode,
}: AccountCreatedProps) {
  return (
    <Box className="account-created-page">
      <Container maxWidth="md" className="account-created-container">
        <Paper elevation={0} className="account-created-card">
          <Box>
            <img src={Check} width={"50px"} />
          </Box>

          <Typography className="account-created-title">
            Usuario criado com sucesso!
          </Typography>

          <Typography className="account-created-subtitle">
            Enviamos um código de validação para o e-mail
          </Typography>

          <Typography className="account-created-email">
            {email || "seuemail@exemplo.com"}
          </Typography>

          <Box className="account-created-highlight">
            <MailOutlineRoundedIcon />
            <Typography>
              No próximo passo, informe o código recebido para concluir a
              validação da sua conta.
            </Typography>
          </Box>

          <Button
            className="account-created-button account-created-button--primary"
            onClick={onValidateCode}
            disabled={loading || resendLoading}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Avançar"
            )}
          </Button>

          <Box className="account-created-divider">
            <span />
            <Typography>ou</Typography>
            <span />
          </Box>

          <Button
            className="account-created-link"
            onClick={onResendCode}
            disabled={loading || resendLoading}
            startIcon={
              resendLoading ? (
                <CircularProgress size={18} sx={{ color: "#16a34a" }} />
              ) : (
                <AutorenewRoundedIcon />
              )
            }
          >
            Reenviar código
          </Button>

          <Box className="account-created-footer">
            <ShieldOutlinedIcon />
            <Typography>Verifique sua caixa de entrada ou spam.</Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

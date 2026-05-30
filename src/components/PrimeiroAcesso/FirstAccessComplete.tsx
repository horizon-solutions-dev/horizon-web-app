import { Box, Button, Container, Paper, Typography } from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Check from "../../assets/5610944.png";
import "./FirstAccessComplete.scss";

interface FirstAccessCompleteProps {
  onFinish: () => void;
  showPostLoginSetupMessage?: boolean;
  showAdditionalCondominiumsMessage?: boolean;
}

export default function FirstAccessComplete({
  onFinish,
  showPostLoginSetupMessage = false,
  showAdditionalCondominiumsMessage = false,
}: FirstAccessCompleteProps) {
  return (
    <Box className="first-access-complete-page">
      <Container maxWidth="md" className="first-access-complete-container">
        <Paper elevation={0} className="first-access-complete-card">
          <Box className="first-access-complete-badge">
            <img src={Check} alt="Configuracao concluida" width="64" />
          </Box>

          <Typography className="first-access-complete-title">
            Configuração concluída com sucesso!
          </Typography>

          <Typography className="first-access-complete-subtitle">
            {showPostLoginSetupMessage
              ? "O processo de criacao da conta foi concluido. As demais configuracoes e cadastros devem ser feitos depois que voce entrar com a conta que acabou de criar."
              : showAdditionalCondominiumsMessage
              ? "O primeiro condomínio foi cadastrado. Outros condomínios podem ser cadastrados após o login no sistema."
              : "A configuração inicial foi finalizada e sua organização já está pronta para uso."}
          </Typography>

          <Box className="first-access-complete-highlight">
            <ShieldOutlinedIcon />
            <Box>
              <Typography className="first-access-complete-highlight-title">
                Sua conta está ativa e segura
              </Typography>
              <Typography className="first-access-complete-highlight-text">
                Agora você já pode entrar na plataforma e continuar a
                configuração por lá.
              </Typography>
            </Box>
          </Box>

          <Button className="first-access-complete-button" onClick={onFinish}>
            Concluir
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

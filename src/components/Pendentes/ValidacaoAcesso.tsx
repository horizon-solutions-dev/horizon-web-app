import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import { useNavigate } from "react-router-dom";
import RouteNames from "../../routes/routeNames";
import { verificationService } from "../../services/verificationService";
import "./ValidacaoAcesso.scss";

const CODE_LENGTH = 6;
const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type ValidationResult = Awaited<
  ReturnType<typeof verificationService.validateCode>
>;

interface ValidacaoAcessoProps {
  onValidated?: (payload: {
    verificationCode: string;
    verificationResult: ValidationResult;
  }) => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

export default function ValidacaoAcesso({
  onValidated,
  onBack,
  title = "Confirmar acesso",
  subtitle = "Digite o código numérico para continuar a autenticação.",
  submitLabel = "Validar código",
}: ValidacaoAcessoProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const digits = useMemo(
    () => Array.from({ length: CODE_LENGTH }, (_, i) => code[i] || ""),
    [code],
  );

  const appendDigit = (digit: string) => {
    if (loading || code.length >= CODE_LENGTH) return;
    setErrorMessage("");
    setCode((prev) => `${prev}${digit}`.slice(0, CODE_LENGTH));
  };

  const clearCode = () => {
    if (loading) return;
    setErrorMessage("");
    setCode("");
  };

  const removeDigit = () => {
    if (loading) return;
    setErrorMessage("");
    setCode((prev) => prev.slice(0, -1));
  };

  const validateCode = async () => {
    if (code.length !== CODE_LENGTH) {
      setErrorMessage("Informe o código completo com 6 dígitos.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await verificationService.validateCode(code);

      if (onValidated) {
        onValidated({
          verificationCode: code,
          verificationResult: response,
        });
        return;
      }

      navigate(RouteNames.CadastrosOrganizacoes, {
        state: {
          openCreate: true,
          verificationCode: code,
          verificationResult: response,
        },
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          setErrorMessage("Código inválido. Verifique o número informado.");
        } else if (error.response?.status === 401) {
          setErrorMessage("Sua sessão expirou. Faça login novamente.");
        } else {
          setErrorMessage("Não foi possível validar o código agora.");
        }
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível validar o código agora.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="av-page">
      <Container className="container-max">
        <Paper elevation={0} className="av-card">
          {onBack ? (
            <Button
              variant="text"
              onClick={onBack}
              disabled={loading}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                mb: 1,
                color: "#6b7280",
              }}
            >
              Voltar
            </Button>
          ) : null}

          <Box className="av-icon-aqui">
            <LockOutlinedIcon className="av-icon__lock" />
          </Box>

          <Typography className="av-title">{title}</Typography>
          <Typography className="av-subtitle">{subtitle}</Typography>

          <Box className="av-digits">
            {digits.map((digit, i) => (
              <Box
                key={i}
                className={`av-digit ${digit ? "av-digit--filled" : ""}`}
              >
                {digit}
              </Box>
            ))}
          </Box>

          <Typography
            className={`av-status ${errorMessage ? "av-status--error" : ""}`}
          >
            {errorMessage
              ? errorMessage
              : code.length === CODE_LENGTH
                ? "Código preenchido"
                : "\u00A0"}
          </Typography>

          <Box className="av-keypad">
            {keypadKeys.map((key) => (
              <Button
                key={key}
                className="av-key"
                onClick={() => appendDigit(key)}
                disabled={loading}
              >
                {key}
              </Button>
            ))}

            <Button
              className="av-key av-key--action"
              onClick={clearCode}
              disabled={loading}
            >
              Limpar
            </Button>
            <Button
              className="av-key"
              onClick={() => appendDigit("0")}
              disabled={loading}
            >
              0
            </Button>
            <Button
              className="av-key av-key--action"
              onClick={removeDigit}
              disabled={loading}
            >
              <BackspaceOutlinedIcon fontSize="small" />
            </Button>
          </Box>

          <Button
            fullWidth
            className="av-submit"
            onClick={validateCode}
            disabled={loading || code.length !== CODE_LENGTH}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : (
              submitLabel
            )}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

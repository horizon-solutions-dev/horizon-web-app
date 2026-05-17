import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Logo from "../../assets/logo.svg";
import { AccountService } from "../../services/accountService";
import "./password-recovery.scss";
import { Box, Button, CircularProgress } from "@mui/material";
import { StepWizardCard } from "../../shared/components";

interface DefinePasswordProps {
  userId: string;
  tokenCode: string;
  onBack: () => void;
  onSuccess: (payload: { password: string }) => void;
}

export default function DefinePassword({
  userId,
  tokenCode,
  onBack,
  onSuccess,
}: DefinePasswordProps) {
  const { t } = useTranslation();

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, t("validation.passwordMinLength") || "Minimo 8 caracteres")
        .required(t("validation.passwordRequired")),
      confirmPassword: Yup.string()
        .oneOf(
          [Yup.ref("password")],
          t("validation.passwordMatch") || "As senhas nao conferem",
        )
        .required(
          t("validation.confirmPasswordRequired") ||
            "Confirmacao de senha e obrigatoria",
        ),
    }),
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await AccountService.setPassword({
          userId,
          newPassword: values.password,
          tokenCode,
        });

        onSuccess({ password: values.password });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("toast.error") || "Erro ao definir senha",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handler();
    }
  };


  return (
          <StepWizardCard
          
            title={"Definir senha"}
            steps={[]}
            activeStep={0}
            showBack={false}
            onBack={()=>{}}
            onClose={onBack}
            disableContent={formik.isSubmitting}
            width="720px">

    <div className="recovery-container">
      <div className="recovery-wrapper">
        <div className="recovery-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              formik.handleSubmit();
            }}
            >
            <div className="step-header">
              <div className="logo">
                <img src={Logo} alt="Logo" />
              </div>
            </div>

            <h1 className="title">
              {t("recovery.definePasswordTitle") || "Definir Senha"}
            </h1>

            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t("recovery.newPassword") || "Nova Senha"}
                className={`input-field ${
                  formik.touched.password && formik.errors.password
                  ? "input-error"
                  : ""
                }`}
                disabled={formik.isSubmitting}
                autoFocus
                />
              {formik.touched.password && formik.errors.password && (
                <div className="error-message">{formik.errors.password}</div>
              )}
            </div>

            <div className="input-wrapper">
              <input
                type="password"
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t("recovery.confirmPassword") || "Confirmar Senha"}
                className={`input-field ${
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                  ? "input-error"
                  : ""
                }`}
                onKeyPress={(e) => handleKeyPress(e, () => formik.handleSubmit())}
                disabled={formik.isSubmitting}
                />
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <div className="error-message">
                    {formik.errors.confirmPassword}
                  </div>
                )}
            </div>
<Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 2,
            pt: 2,
          }}
        >
          <Button
              sx={{
                textTransform: "none",
                backgroundColor: formik.isSubmitting ? "#ddd" : "#1976d2",
              }}
              variant="contained"
              type={formik.isSubmitting ? "button" : "submit"}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                "Concluir"
              )}
            </Button>
            </Box>
          </form>
        </div>
      </div>
    </div>
            </StepWizardCard>
  );
}

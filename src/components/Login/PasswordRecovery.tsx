import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoChevronBack } from "react-icons/io5";
import "./password-recovery.scss";
import { IoIosArrowBack } from "react-icons/io";

interface PasswordRecoveryProps {
  onBack: () => void;
}

export default function PasswordRecovery({ onBack }: PasswordRecoveryProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const emailValidationSchema = Yup.object({
    email: Yup.string()
      .email(t("validation.emailInvalid"))
      .required(t("validation.emailRequired")),
  });

  const codeValidationSchema = Yup.object({
    code: Yup.string()
      .length(6, t("validation.codeLength") || "O código deve ter 6 dígitos")
      .required(t("validation.codeRequired") || "Código é obrigatório"),
  });

  const passwordValidationSchema = Yup.object({
    password: Yup.string()
      .min(8, t("validation.passwordMinLength") || "Mínimo 8 caracteres")
      .required(t("validation.passwordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("validation.passwordMatch") || "As senhas não conferem")
      .required(t("validation.confirmPasswordRequired") || "Confirmação de senha é obrigatória"),
  });

  const emailFormik = useFormik({
    initialValues: { email: "" },
    validationSchema: emailValidationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        // TODO: Implementar quando AuthService.requestPasswordRecovery estiver disponível
        // await AuthService.requestPasswordRecovery({ email: values.email });
        
        setRecoveryEmail(values.email);
        toast.success(
          t("toast.recoveryCodeSent") || "Código de verificação enviado para seu e-mail"
        );
        setStep(2);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : (t("toast.error") || "Erro ao enviar código")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const codeFormik = useFormik({
    initialValues: { code: "" },
    validationSchema: codeValidationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async () => {
      setIsSubmitting(true);
      try {
        // TODO: Implementar quando AuthService.verifyRecoveryCode estiver disponível
        // await AuthService.verifyRecoveryCode({
        //   email: recoveryEmail,
        //   code: codeFormik.values.code,
        // });
        
        toast.success(
          t("toast.codeVerified") || "Código verificado com sucesso"
        );
        setStep(3);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : (t("toast.invalidCode") || "Código inválido")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema: passwordValidationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async () => {
      setIsSubmitting(true);
      try {
        // TODO: Implementar quando AuthService.resetPassword estiver disponível
        // await AuthService.resetPassword({
        //   email: recoveryEmail,
        //   code: codeFormik.values.code,
        //   newPassword: passwordFormik.values.password,
        // });
        
        toast.success(
          t("toast.passwordUpdated") || "Senha atualizada com sucesso"
        );
        setTimeout(() => {
          onBack();
        }, 500);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : (t("toast.error") || "Erro ao atualizar senha")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handler();
    }
  };

  const handleBackStep = (targetStep: number) => {
    // Limpar erros ao voltar
    if (targetStep === 1) {
      emailFormik.setErrors({});
      emailFormik.setTouched({});
    } else if (targetStep === 2) {
      codeFormik.setErrors({});
      codeFormik.setTouched({});
    } else if (targetStep === 3) {
      passwordFormik.setErrors({});
      passwordFormik.setTouched({});
    }
    setStep(targetStep);
  };

  const renderRecoveryStep = () => {
    switch (step) {
      case 1:
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              emailFormik.handleSubmit();
            }}
          >
            <div className="step-header">
              <div className="logo">
                <img src="/src/assets/logo.svg" alt="Logo" />
              </div>
            </div>

            <h1 className="title">{t("recovery.title") || "Recuperar Senha"}</h1>
            <p className="subtitle-text">
              {t("recovery.step1Description") ||
                "Digite seu e-mail para receber um código de verificação"}
            </p>

            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                value={emailFormik.values.email}
                onChange={emailFormik.handleChange}
                onBlur={emailFormik.handleBlur}
                placeholder={t("login.emailPlaceholder")}
                className={`input-field ${
                  emailFormik.touched.email && emailFormik.errors.email
                    ? "input-error"
                    : ""
                }`}
                onKeyPress={(e) =>
                  handleKeyPress(e, () => emailFormik.handleSubmit())
                }
                autoFocus
                disabled={isSubmitting}
              />
              {emailFormik.touched.email && emailFormik.errors.email && (
                <div className="error-message">{emailFormik.errors.email}</div>
              )}
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("login.loading") || "Carregando..."
                  : t("recovery.sendCode") || "Enviar Código"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onBack}
                disabled={isSubmitting}
              >
                {t("login.back") || "Voltar"}
              </button>
            </div>
          </form>
        );

      case 2:
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              codeFormik.handleSubmit();
            }}
          >
            <button
              onClick={() => handleBackStep(1)}
              className="back-indicator"
              disabled={isSubmitting}
              type="button"
            >
              <IoIosArrowBack />
              <span>{t("login.back") || "Voltar"}</span>
            </button>

            <div className="step-header">
              <div className="logo">
                <img src="/src/assets/logo.svg" alt="Logo" />
              </div>
            </div>

            <h1 className="title">{t("recovery.verifyCode") || "Verificar Código"}</h1>
            <p className="subtitle-text">
              {t("recovery.step2Description") ||
                `Enviamos um código de verificação para ${recoveryEmail}`}
            </p>

            <div className="input-wrapper">
              <input
                type="text"
                name="code"
                value={codeFormik.values.code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  codeFormik.setFieldValue("code", value);
                }}
                onBlur={codeFormik.handleBlur}
                placeholder={t("recovery.codePlaceholder") || "000000"}
                className={`input-field code-input ${
                  codeFormik.touched.code && codeFormik.errors.code
                    ? "input-error"
                    : ""
                }`}
                onKeyPress={(e) =>
                  handleKeyPress(e, () => codeFormik.handleSubmit())
                }
                autoFocus
                disabled={isSubmitting}
                maxLength={6}
              />
              {codeFormik.touched.code && codeFormik.errors.code && (
                <div className="error-message">{codeFormik.errors.code}</div>
              )}
            </div>

            <div className="link-section">
              <button
                type="button"
                className="text-link"
                onClick={() => handleBackStep(1)}
                disabled={isSubmitting}
              >
                {t("recovery.resendCode") || "Reenviar Código"}
              </button>
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !codeFormik.values.code}
              >
                {isSubmitting
                  ? t("login.loading") || "Carregando..."
                  : t("recovery.verify") || "Verificar"}
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              passwordFormik.handleSubmit();
            }}
          >
            <button
              onClick={() => handleBackStep(2)}
              className="back-indicator"
              disabled={isSubmitting}
              type="button"
            >
              <IoIosArrowBack />
              <span>{t("login.back") || "Voltar"}</span>
            </button>

            <div className="step-header">
              <div className="logo">
                <img src="/src/assets/logo.svg" alt="Logo" />
              </div>
            </div>

            <h1 className="title">{t("recovery.newPassword") || "Nova Senha"}</h1>
            <p className="subtitle-text">
              {t("recovery.step3Description") ||
                "Digite uma nova senha para sua conta"}
            </p>

            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                value={passwordFormik.values.password}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                placeholder={t("login.passwordPlaceholder") || "Senha"}
                className={`input-field ${
                  passwordFormik.touched.password && passwordFormik.errors.password
                    ? "input-error"
                    : ""
                }`}
                disabled={isSubmitting}
                autoFocus
              />
              {passwordFormik.touched.password && passwordFormik.errors.password && (
                <div className="error-message">{passwordFormik.errors.password}</div>
              )}
            </div>

            <div className="input-wrapper">
              <input
                type="password"
                name="confirmPassword"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                placeholder={t("recovery.confirmPassword") || "Confirmar Senha"}
                className={`input-field ${
                  passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword
                    ? "input-error"
                    : ""
                }`}
                onKeyPress={(e) =>
                  handleKeyPress(e, () => passwordFormik.handleSubmit())
                }
                disabled={isSubmitting}
              />
              {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                <div className="error-message">
                  {passwordFormik.errors.confirmPassword}
                </div>
              )}
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("login.loading") || "Carregando..."
                  : t("recovery.updatePassword") || "Atualizar Senha"}
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="recovery-container">
      <div className="recovery-wrapper">
        <div className="recovery-card">
          {renderRecoveryStep()}

          <div className="step-indicator">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`step-dot ${stepNumber === step ? "active" : ""} ${
                  stepNumber < step ? "completed" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
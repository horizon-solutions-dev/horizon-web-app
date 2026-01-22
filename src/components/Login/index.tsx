import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./login.scss";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack } from "react-icons/io";
import RouteNames from "../../routes/routeNames";

interface Company {
  id: number;
  name: string;
  role: string;
}

interface LoginFormValues {
  email: string;
  password: string;
  company: Company | null;
}

const COMPANIES: Company[] = [
  { id: 1, name: "Empresa Alpha Ltda", role: "Administrador" },
  { id: 2, name: "Beta Corporation", role: "Usuário" },
  { id: 3, name: "Gamma Tech Solutions", role: "Gerente" },
];

const STEP_CONFIG = {
  1: { fields: ["email"], nextButton: "next" },
  2: { fields: ["password"], nextButton: "enter" },
  3: { fields: ["company"], nextButton: "access" },
} as const;

export default function MultiStepLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t("validation.emailInvalid"))
      .required(t("validation.emailRequired")),
  
    password: Yup.string()
      .required(t("validation.passwordRequired")),
  
    company: Yup.object()
      .nullable()
      .required(t("validation.companyRequired")),
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      company: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);

      try {
        // Simulação de chamada à API
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Salvar dados de login no localStorage (temporário, até implementar autenticação real)
        localStorage.setItem('userEmail', values.email);
        localStorage.setItem('userCompany', JSON.stringify(values.company));
        localStorage.setItem('isAuthenticated', 'true');
        
        toast.success(
          t("toast.loginSuccess", { company: values.company?.name })
        );
        
        // Redirecionar para o Dashboard após login bem-sucedido
        setTimeout(() => {
          navigate(RouteNames.Dashboard);
        }, 500);
      } catch (error) {
        console.error("Erro no login:", error);
        toast.error(t("toast.loginError"));
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleEmailNext = () => {
    formik.validateField("email").then(() => {
      if (!formik.errors.email && formik.values.email) {
        setStep(2);
      }
    });
  };

  const handlePasswordNext = () => {
    formik.validateField("password").then(() => {
      if (!formik.errors.password && formik.values.password) {
        setStep(3);
      }
    });
  };

  const handleFinalLogin = () => {
    formik.validateForm().then((errors) => {
      if (Object.keys(errors).length === 0) {
        formik.handleSubmit();
      }
    });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handler();
    }
  };

  const canGoNext = () => {
    if (step === 1) return !formik.errors.email && !!formik.values.email;
    if (step === 2) return !formik.errors.password && !!formik.values.password;
    if (step === 3) return !formik.errors.company && !!formik.values.company;
    return false;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return t("login.title");
      case 2: return t("login.passwordTitle");
      case 3: return t("login.companyTitle");
      default: return "";
    }
  };

  const renderStep = () => {
    const config = STEP_CONFIG[step as keyof typeof STEP_CONFIG];

    switch (step) {
      case 1:
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailNext();
            }}
          >
            <div className="step-header">
              <div className="logo">
                <img src="/src/assets/logo.svg" alt="Logo" />
              </div>
            </div>

            <h1 className="title">{getStepTitle()}</h1>

            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t("login.emailPlaceholder")}
                className={`input-field ${
                  formik.touched.email && formik.errors.email
                    ? "input-error"
                    : ""
                }`}
                onKeyPress={(e) => handleKeyPress(e, handleEmailNext)}
                autoFocus
              />
              {formik.touched.email && formik.errors.email && (
                <div className="error-message">{formik.errors.email}</div>
              )}
            </div>

            <div className="link-section">
              <div>
                <span className="text-normal">{t("login.noAccount")} </span>
                <button type="button" className="text-link">
                  {t("login.createAccount")}
                </button>
              </div>
              <button type="button" className="text-link">
                {t("login.cannotAccess")}
              </button>
            </div>

            <div className="button-container">
              <button
                type="submit"
                className="btn-primary"
                disabled={!canGoNext() || isSubmitting}
              >
                {t(`login.${config.nextButton}`)}
              </button>
            </div>
          </form>
        );

      case 2:
        return (
          <>
            <div className="step-header flex-between-center">
              <div className="logo">
                <img src="/src/assets/logo.svg" alt="Logo" />
              </div>
              <button
                onClick={handleBack}
                className="back-button"
                disabled={isSubmitting}
              >
               <IoIosArrowBack />
{t("login.back")}
              </button>
            </div>

            <h1 className="title">{getStepTitle()}</h1>
            <div className="subtitle">{formik.values.email}</div>

            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={t("login.passwordPlaceholder")}
                className={`input-field ${
                  formik.touched.password && formik.errors.password
                    ? "input-error"
                    : ""
                }`}
                onKeyPress={(e) => handleKeyPress(e, handlePasswordNext)}
                autoFocus
              />
              {formik.touched.password && formik.errors.password && (
                <div className="error-message">{formik.errors.password}</div>
              )}
            </div>

            <div className="link-section">
              <button type="button" className="text-link">
                {t("login.forgotPassword")}
              </button>
            </div>

            <div className="button-container">
              <button
                onClick={handlePasswordNext}
                className="btn-primary"
                disabled={!canGoNext() || isSubmitting}
              >
                {t(`login.${config.nextButton}`)}
              </button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="step-header flex-between-center">
              <div className="logo">
                <img src="/src/assets/logo.svg" alt="Logo" />
              </div>
              <button
                onClick={handleBack}
                className="back-button"
                disabled={isSubmitting}
              >
                               <IoIosArrowBack />
 {t("login.back")}
              </button>
            </div>

            <h1 className="title">{getStepTitle()}</h1>
            <div className="subtitle">{formik.values.email}</div>

            <div className="company-list">
              {COMPANIES.map((company) => (
                <button
                  key={company.id}
                  onClick={() => formik.setFieldValue("company", company)}
                  className={`company-card ${
                    formik.values.company?.id === company.id ? "selected" : ""
                  }`}
                  type="button"
                  disabled={isSubmitting}
                >
                  <div className="company-icon">🏢</div>
                  <div className="company-info">
                    <div className="company-name">{company.name}</div>
                    <div className="company-role">{company.role}</div>
                  </div>
                </button>
              ))}
            </div>

            {formik.submitCount > 0 && formik.errors.company && (
              <div className="error-message text-center">
                {formik.errors.company}
              </div>
            )}

            <div className="button-container">
              <button
                onClick={handleFinalLogin}
                className="btn-primary"
                disabled={!canGoNext() || isSubmitting}
              >
                {isSubmitting ? t("login.loading") : t(`login.${config.nextButton}`)}
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {renderStep()}

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
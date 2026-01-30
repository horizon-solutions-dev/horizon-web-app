import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import "./login.scss";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoChevronBack } from "react-icons/io5";
import PasswordRecovery from "./PasswordRecovery";
import SignUp from "./SignUp";
import { AuthService } from "../../services/authService";
import { organizationService, type OrganizationMeResponse } from "../../services/organizationService";
import { IoIosArrowBack } from "react-icons/io";


interface LoginFormValues {
  email: string;
  password: string;
  condominium: OrganizationMeResponse | null;
}

const STEP_CONFIG = {
  1: { fields: ["email"], nextButton: "next" },
  2: { fields: ["password"], nextButton: "enter" },
  3: { fields: ["condominium"], nextButton: "access" },
} as const;

export default function MultiStepLogin() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [condominiums, setCondominiums] = useState<OrganizationMeResponse[]>([]);
  const [isLoadingCondominiums, setIsLoadingCondominiums] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t("validation.emailInvalid"))
      .required(t("validation.emailRequired")),
    password: Yup.string().required(t("validation.passwordRequired")),
    condominium: Yup.object()
      .nullable()
      .required(t("validation.companyRequired")),
  });

  const formik = useFormik<LoginFormValues>({
    initialValues: { email: "", password: "", condominium: null },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setIsLoggingIn(true);
      try {
        if (!values.condominium) {
          return;
        }

        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("condominiumId", values.condominium.organizationId || "");
        localStorage.setItem("condominium", JSON.stringify(values.condominium));
        localStorage.setItem("isAuthenticated", "true");

        toast.success(
          t("toast.loginSuccess", { company: values.condominium.name }),
        );

       window.location.href = "/dashboard";
       localStorage.setItem('organizationId', values.condominium.organizationId || '');
      } catch (error) {
        setIsLoggingIn(false);
        toast.error(
          error instanceof Error ? error.message : t("toast.loginError"),
        );
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
      if (formik.errors.password || !formik.values.password) {
        return;
      }

      if (condominiums.length > 0) {
        setStep(3);
        return;
      }

      setIsSubmitting(true);
      setIsLoadingCondominiums(true);
      setPasswordError(null);
      
      AuthService.login({
        login: formik.values.email,
        pass: formik.values.password,
        dataSource: "web",
        languageId: "pt-br",
        version: "1.0.0",
      })
        .then(async (response) => {
          localStorage.setItem("token", response.token);
          localStorage.setItem("refreshToken", response.refreshToken);

          const organizationId = await organizationService.getMyOrganizationId();
           const data = await organizationService.getMyOrganization();
          localStorage.setItem("organizationId", organizationId!);

          setCondominiums(data);
          setStep(3);
        })
        .catch((error) => {
          // Define a mensagem de erro que veio da API
          const errorMessage = error instanceof Error ? error.message : t("toast.loginError");
          setPasswordError(errorMessage);
        })
        .finally(() => {
          setIsSubmitting(false);
          setIsLoadingCondominiums(false);
        });
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
    if (step > 1) {
      setStep(step - 1);
      // Limpa o erro de senha ao voltar
      if (step === 2) {
        setPasswordError(null);
      }
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    handler: () => void,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handler();
    }
  };

  const canGoNext = () => {
    if (step === 1) return !formik.errors.email && !!formik.values.email;
    if (step === 2) return !formik.errors.password && !!formik.values.password;
    if (step === 3)
      return !formik.errors.condominium && !!formik.values.condominium;
    return false;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return t("login.title");
      case 2:
        return t("login.passwordTitle");
      case 3:
        return t("Selecionar organização") || "Selecionar organização";
      default:
        return "";
    }
  };

  const renderBackButton = () => {
    if (step === 1 || step === 3) return null;
    
    return (
      <button
        onClick={handleBack}
        className="back-indicator"
        disabled={isSubmitting}
        aria-label="Voltar"
      >
        <IoChevronBack />
        <span>Voltar</span>
      </button>
    );
  };


const getOrganizationInitials = (org: OrganizationMeResponse): string => {
  const name = org.name;

  
  if (name.length < 2) {
    return name.charAt(0).toUpperCase();
  }

  const firstLetter = name.charAt(0).toUpperCase();
  const secondLetter = name.charAt(1).toLowerCase();

  return firstLetter + secondLetter;
};


  // Função para obter a classe de cor baseada no orgType
  const getOrganizationColorClass = (org: OrganizationMeResponse): string => {
    // orgType: 1 = PropertyManagementCompany, 2 = ManagedCondominium
    if (org.orgType === 1) {
      return "org-type-company";
    } else if (org.orgType === 2) {
      return "org-type-condo";
    }
    return "org-type-default";
  };

  const renderStepOne = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleEmailNext();
      }}
    >
      <div className="logo-section">
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
            formik.touched.email && formik.errors.email ? "input-error" : ""
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
          <button
            type="button"
            className="text-link"
            onClick={() => setIsSignUpMode(true)}
          >
            {t("login.createAccount")}
          </button>
        </div>
        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            className="text-link"
            onClick={() => setIsRecoveryMode(true)}
          >
            {t("login.cannotAccess")}
          </button>
        </div>
      </div>

      <div className="button-container">
        <button
          type="submit"
          className="btn-primary"
          disabled={!canGoNext() || isSubmitting}
        >
          {t(`login.${STEP_CONFIG[1].nextButton}`)}
        </button>
      </div>
    </form>
  );

  const renderStepTwo = () => (
    <>
      <button
        onClick={handleBack}
        className="back-indicator"
        disabled={isSubmitting}
      >
        <IoIosArrowBack />
        <span>{t("login.back")}</span>
      </button>
      <div className="logo-section">
        <div className="logo">
          <img src="/src/assets/logo.svg" alt="Logo" />
        </div>
      </div>

      <h1 className="title">{getStepTitle()}</h1>
      <div className="subtitle">{formik.values.email}</div>

      <div className="input-wrapper">
        <input
          type="password"
          name="password"
          value={formik.values.password}
          onChange={(e) => {
            formik.handleChange(e);
            // Limpa o erro ao começar a digitar
            if (passwordError) {
              setPasswordError(null);
            }
          }}
          onBlur={formik.handleBlur}
          placeholder={t("login.passwordPlaceholder")}
          className={`input-field ${
            (formik.touched.password && formik.errors.password) || passwordError
              ? "input-error"
              : ""
          }`}
          onKeyPress={(e) => handleKeyPress(e, handlePasswordNext)}
          autoFocus
        />
        {formik.touched.password && formik.errors.password && (
          <div className="error-message">{formik.errors.password}</div>
        )}
        {passwordError && (
          <div className="error-message">{passwordError}</div>
        )}
      </div>

      <div className="link-section">
        <button
          type="button"
          className="text-link"
          onClick={() => setIsRecoveryMode(true)}
        >
          {t("login.forgotPassword")}
        </button>
      </div>

      <div className="button-container">
        <button
          onClick={handlePasswordNext}
          className="btn-primary"
          disabled={!canGoNext() || isSubmitting}
        >
          {t(`login.${STEP_CONFIG[2].nextButton}`)}
        </button>
      </div>
    </>
  );

  const renderStepThree = () => (
    <>
      <div className="logo-section">
        <div className="logo">
          <img src="/src/assets/logo.svg" alt="Logo" />
        </div>
      </div>

      <h1 className="title">{getStepTitle()}</h1>
      <div className="subtitle">{formik.values.email}</div>

      {isLoadingCondominiums ? (
        <div className="loading-message">
          {t("login.loadingCondominiums") || "Carregando organizações..."}
        </div>
      ) : condominiums.length === 0 ? (
        <div className="error-message text-center">
          {t("login.noCondominiums") || "Nenhuma organização disponível."}
        </div>
      ) : (
        <div className="company-list">
          {condominiums.map((condominium) => (
            <button
              key={condominium.organizationId}
              onClick={() => formik.setFieldValue("condominium", condominium)}
              className={`company-card ${
                formik.values.condominium?.organizationId ===
                condominium.organizationId
                  ? "selected"
                  : ""
              }`}
              type="button"
              disabled={isSubmitting}
            >
              <div className={`company-icon ${getOrganizationColorClass(condominium)}`}>
                {getOrganizationInitials(condominium)}
              </div>
              <div className="company-info">
                <div className="company-name">{condominium.name}</div>
                <div className="company-role">
                  {condominium.city} - {condominium.state}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {formik.submitCount > 0 && formik.errors.condominium && (
        <div className="error-message text-center">
          {formik.errors.condominium}
        </div>
      )}

      <div className="button-container">
        <button
          onClick={handleFinalLogin}
          className="btn-primary"
          disabled={!canGoNext() || isSubmitting}
        >
          {isSubmitting
            ? t("login.loading")
            : t(`login.${STEP_CONFIG[3].nextButton}`)}
        </button>
      </div>
    </>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      default:
        return null;
    }
  };

  return (
    <>
      {isRecoveryMode ? (
        <PasswordRecovery onBack={() => setIsRecoveryMode(false)} />
      ) : isSignUpMode ? (
        <SignUp
          onBack={() => setIsSignUpMode(false)}
          onSuccess={() => {
            setIsSignUpMode(false);
            toast.info(
              t("toast.accountCreatedRedirect") ||
                "Conta criada! Faça login com suas credenciais.",
            );
          }}
        />
      ) : (
        <div className="login-container">
          <div className="login-wrapper">
            <div className="login-card">
              {renderBackButton()}
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

          {/* Loading Overlay */}
          {isLoggingIn && (
            <div className="login-loading-overlay">
              <div className="login-loading-content">
                <div className="login-loader">
                  <div className="loader-ring"></div>
                  <div className="loader-ring"></div>
                  <div className="loader-ring"></div>
                </div>
                <p className="loading-text">
                  {t("login.accessingOrganization") || "Acessando organização..."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
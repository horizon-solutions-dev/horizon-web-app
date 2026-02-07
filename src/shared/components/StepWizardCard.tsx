import React from "react";
import { CheckCircle, Close } from "@mui/icons-material";
import "./StepWizardCard.scss";
import { IoChevronBack } from "react-icons/io5";
import { Tooltip, IconButton, Box } from "@mui/material";
import '../../index.scss'
interface StepWizardCardProps {
  title: string;
  subtitle?: string;
  steps: string[];
  activeStep: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
  onClose?: () => void;
  showLogo?: boolean;
}

export default function StepWizardCard({
  title,
  subtitle,
  steps,
  activeStep,
  children,
  actions,
  showBack = false,
  onBack,
  backLabel = "Voltar",
  onClose,
  showLogo = true,
}: StepWizardCardProps) {
  return (
    <div className="step-wizard">
      <div className="step-wizard-card">
        {showBack && onBack ? (
          <button className="step-wizard-back" type="button" onClick={onBack}>
            <IoChevronBack />
            <span>{backLabel}</span>
          </button>
        ) : null}
        {onClose ? (
          <Box className="step-wizard-close">
            <Tooltip title="Fechar">
              <IconButton
                color="error"
                onClick={() => {
                  //navigate("/dashboard");
                  //setIsCadastroOpen(false);
                  //setEditingId(null);
                  //setActiveStep(0);
                  onClose?.();
                }}
              >
                <Close />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}

        {showLogo ? (
          <div className="step-wizard-logo">
            <img src="/src/assets/logo.svg" alt="Horizon" />
          </div>
        ) : null}

        <h1 className="step-wizard-title">{title}</h1>
        {subtitle ? (
          <div className="step-wizard-subtitle">{subtitle}</div>
        ) : null}

        <div className="step-wizard-content">{children}</div>

        {actions ? <div className="step-wizard-actions">{actions}</div> : null}

        <div className="step-wizard-dots">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`step-dot ${index === activeStep ? "active" : ""} ${
                index < activeStep ? "completed" : ""
              }`}
            >
              {index < activeStep ? <CheckCircle /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { CheckCircle, Close } from "@mui/icons-material";
import "./StepWizardCard.scss";
import { IoChevronBack } from "react-icons/io5";
import { Tooltip, IconButton, Box } from "@mui/material";
import '../../index.scss'
import Logo from '../../assets/logo.svg'
interface StepWizardCardProps {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  steps: string[];
  activeStep: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
  onClose?: () => void;
  showLogo?: boolean;
  width?: string;
}

export default function StepWizardCard({
  title,
  subtitle,
  subtitleClassName,
  steps,
  activeStep,
  children,
  actions,
  showBack = false,
  onBack,
  backLabel = "Voltar",
  onClose,
  showLogo = true,
  width = '650px'
}: StepWizardCardProps) {
  return (
    <div className="step-wizard">
      <Box className="step-wizard-card" sx={{width}}>
        {showBack && onBack ? (
          <button className="step-wizard-back" type="button" onClick={onBack}>
            <IoChevronBack />
            <span>{backLabel}</span>
          </button>
        ) : null}
        {onClose ? (
          <Box className="step-wizard-close">
            <Tooltip title="Clique aqui para Fechar a janela">

              <IconButton
                color="error"
                onClick={() => {
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
            <img src={Logo} alt="Horizon" />
          </div>
        ) : null}

        <h1 className="step-wizard-title">{title}</h1>
        {subtitle ? (
          <div className={subtitleClassName || "step-wizard-subtitle"}>{subtitle}</div>
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
      </Box>
    </div>
  );
}
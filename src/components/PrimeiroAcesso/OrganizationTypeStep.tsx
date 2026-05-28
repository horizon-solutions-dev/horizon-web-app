import { Box, Button, CircularProgress, Typography } from "@mui/material";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import StepWizardCard from "../../shared/components/StepWizardCard";
import type { OrganizationTypeEnum } from "../../services/organizationService";

interface OrganizationTypeStepProps {
  organizationTypes: OrganizationTypeEnum[];
  loading: boolean;
  onClose: () => void;
  onSelect: (orgType: OrganizationTypeEnum) => void;
}

const FALLBACK_ORGANIZATION_TYPES: OrganizationTypeEnum[] = [
  {
    id: 2,
    value: "SelfManagedCondominium",
    description: "Administrado pelo próprio condomínio",
  },
  {
    id: 1,
    value: "PropertyManagementCompany",
    description: "Administradora",
  },
];

const isSelfManagedType = (type: OrganizationTypeEnum) => {
  const normalized = `${type.value} ${type.description}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    type.id === 2 ||
    normalized.includes("autogerido") ||
    normalized.includes("proprio condominio") ||
    normalized.includes("selfmanaged")
  );
};

export default function OrganizationTypeStep({
  organizationTypes,
  loading,
  onClose,
  onSelect,
}: OrganizationTypeStepProps) {
  const options =
    organizationTypes.length > 0 ? organizationTypes : FALLBACK_ORGANIZATION_TYPES;

  return (
    <StepWizardCard
      full={true}
      title="Tipo de Organizacao"
      subtitle="Selecione como sua operacao sera cadastrada"
      steps={["Tipo de Organizacao", "Cadastro"]}
      activeStep={0}
      showBack={false}
      onClose={onClose}
      disableContent={loading}
      width="720px"
      fullScreen={true}
    >
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          options.map((type) => {
            const selfManaged = isSelfManagedType(type);

            return (
              <Button
                key={type.id}
                variant="outlined"
                onClick={() => onSelect(type)}
                sx={{
                  justifyContent: "flex-start",
                  gap: 1.5,
                  p: 2,
                  textAlign: "left",
                  borderColor: "#d9dee5",
                  color: "#111827",
                  background: "#ffffff",
                  "&:hover": {
                    borderColor: "#1976d2",
                    background: "rgba(25, 118, 210, 0.04)",
                  },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                    {type.description || type.value}
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                    {selfManaged
                      ? "Cadastre diretamente o condominio da sua conta."
                      : "Cadastre a organizacao e depois o primeiro condominio."}
                  </Typography>
                </Box>
              </Button>
            );
          })
        )}
      </Box>
    </StepWizardCard>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import StepWizardCard from "../../shared/components/StepWizardCard";
import RouteNames from "../../routes/routeNames";
import OrganizacaoForm from "../Organizacoes/OrganizacaoForm";
import CondominioForm from "../Condominio/CondominioForm";
import BlocoForm from "../Blocos/BlocoForm";
import UnidadeForm from "../Unidades/UnidadeForm";
import ResidenteForm from "../Residentes/ResidenteForm";
import {
  organizationService,
  type OrganizationTypeEnum,
} from "../../services/organizationService";
import {
  condominiumService,
  type CondominiumTypeEnum,
  type PhysicalStructureEnum,
  type AllocationTypeEnum,
} from "../../services/condominiumService";
import { unitService, type UnitTypeEnum } from "../../services/unitService";
import {
  clearFirstAccessContext,
  markFirstAccessStepCompleted,
  patchFirstAccessContext,
  readFirstAccessContext,
  syncFirstAccessIdsToLegacyStorage,
} from "../../shared/utils/firstAccessStorage";

type WizardStage =
  | "organization"
  | "condominium"
  | "block"
  | "unit"
  | "resident"
  | "done";

const getInitialStage = (): WizardStage => {
  const context = readFirstAccessContext();
  if (!context?.organization) return "organization";
  if (!context.condominiums.length) return "condominium";
  if (!context.block?.id) return "block";
  if (!context.unit?.id) return "unit";
  if (!context.resident?.id) return "resident";
  return "done";
};

export default function PrimeiroAcessoWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFirstAccess = searchParams.get("primeiro") === "1";

  const [stage, setStage] = useState<WizardStage>(getInitialStage);
  const [busy, setBusy] = useState(false);
  const [organizationTypes, setOrganizationTypes] = useState<
    OrganizationTypeEnum[]
  >([]);
  const [condominiumTypes, setCondominiumTypes] = useState<
    CondominiumTypeEnum[]
  >([]);
  const [physicalStructureTypes, setPhysicalStructureTypes] = useState<
    PhysicalStructureEnum[]
  >([]);
  const [unitTypes, setUnitTypes] = useState<UnitTypeEnum[]>([]);
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>(
    [],
  );
  const [bootstrapLoading, setBootstrapLoading] = useState(true);

  useEffect(() => {
    if (!isFirstAccess) {
      navigate(RouteNames.Dashboard, { replace: true });
      return;
    }

    if (!readFirstAccessContext()) {
      patchFirstAccessContext({ enabled: true });
    }
  }, [isFirstAccess, navigate]);

  useEffect(() => {
    const loadBootstrap = async () => {
      setBootstrapLoading(true);
      try {
        const [
          orgTypes,
          condoTypes,
          structureTypes,
          fetchedUnitTypes,
          fetchedAllocationTypes,
        ] = await Promise.all([
          organizationService.getOrganizationTypes(),
          condominiumService.getCondominiumTypes(),
          condominiumService.getPhysicalStructures(),
          unitService.getUnitTypes(),
          unitService.getAllocationTypes(),
        ]);

        setOrganizationTypes(orgTypes ?? []);
        setCondominiumTypes(condoTypes ?? []);
        setPhysicalStructureTypes(structureTypes ?? []);
        setUnitTypes(fetchedUnitTypes ?? []);
        setAllocationTypes(fetchedAllocationTypes ?? []);
      } finally {
        setBootstrapLoading(false);
      }
    };

    void loadBootstrap();
  }, []);

  const context = readFirstAccessContext();
  console.log(context)
  const selectedCondominium = useMemo(() => {
    const currentId = context?.selectedCondominiumId;
    return (
      context?.condominiums.find((item) => item.id === currentId) ||
      context?.condominiums[0]
    );
  }, [context]);

  const residentUnitType =
    context?.unit?.unitType === 1 ||
    context?.unit?.unitType === 2 ||
    context?.unit?.unitType === "1" ||
    context?.unit?.unitType === "2"
      ? context.unit.unitType
      : typeof context?.unit?.unitType === "string"
        ? context.unit.unitType
        : undefined;

  const finishWizard = () => {
    clearFirstAccessContext();
    navigate(RouteNames.Dashboard);
  };

  const handleWizardClose = () => {
    navigate(RouteNames.Dashboard);
  };

  if (bootstrapLoading || !context) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (stage === "organization") {
    return (
      <OrganizacaoForm
        open={true}
        editingOrganization={null}
        onClose={handleWizardClose}
        onSaved={() => {}}
        organizationTypes={organizationTypes}
        typesLoading={false}
        typesError={null}
        loading={busy}
        setLoading={setBusy}
        firstAccessMode={true}
        onCreated={({ organizationId, orgType: createdOrgType, label }) => {
          patchFirstAccessContext({
            orgType: createdOrgType,
            organization: { id: organizationId, label },
          });
          syncFirstAccessIdsToLegacyStorage({ organizationId });
          markFirstAccessStepCompleted("organization");
        }}
        onCompleted={() => {
          setStage("condominium");
        }}
      />
    );
  }

  if (stage === "condominium") {
    return (
      <CondominioForm
        open={true}
        editingCondominium={null}
        onClose={handleWizardClose}
        imageSelected={null}
        onSaved={() => {}}
        condominiumTypes={condominiumTypes}
        physicalStructureTypes={physicalStructureTypes}
        typesLoading={false}
        physicalStructuresLoading={false}
        typesError={null}
        physicalStructuresError={null}
        loading={busy}
        setLoading={setBusy}
        firstAccessMode={true}
        onCreated={({ condominiumId, label }) => {
          patchFirstAccessContext({
            condominiums: [{ id: condominiumId, label }],
            selectedCondominiumId: condominiumId,
          });
          syncFirstAccessIdsToLegacyStorage({ condominiumId });
          markFirstAccessStepCompleted("condominium");
        }}
        onCompleted={() => {
          setStage("block");
        }}
      />
    );
  }

  if (stage === "block") {
    return (
      <BlocoForm
        open={true}
        editingBlock={null}
        onClose={handleWizardClose}
        onSaved={() => {}}
        loading={busy}
        setLoading={setBusy}
        condominiumIdPreset={selectedCondominium?.id}
        firstAccessMode={true}
        onCreated={({ blockId, label }) => {
          patchFirstAccessContext({
            blocks: [
              {
                id: blockId,
                label,
                condominiumId: selectedCondominium?.id,
              },
            ],
            block: {
              id: blockId,
              label,
              condominiumId: selectedCondominium?.id,
            },
          });
          markFirstAccessStepCompleted("block");
        }}
        onCompleted={() => {
          setStage("unit");
        }}
      />
    );
  }

  if (stage === "unit") {
    return (
      <UnidadeForm
        open={true}
        editingUnit={null}
        onClose={handleWizardClose}
        onSaved={() => {}}
        unitTypes={unitTypes}
        allocationTypes={allocationTypes}
        typesLoading={false}
        allocationTypesLoading={false}
        typesError={null}
        allocationTypesError={null}
        loading={busy}
        setLoading={setBusy}
        condominiumIdPreset={selectedCondominium?.id}
        condominiumNamePreset={selectedCondominium?.label}
        blockId={context.block?.condominiumId || ""}
        blockNamePreset={context.block?.label}
        firstAccessMode={true}
        onCreated={({ unitId, label, condominiumBlockId, unitType }) => {
          patchFirstAccessContext({
            units: [
              {
                id: unitId,
                label,
                condominiumId: selectedCondominium?.id,
                blockId: condominiumBlockId,
                unitType,
              },
            ],
            unit: {
              id: unitId,
              label,
              condominiumId: selectedCondominium?.id,
              blockId: condominiumBlockId,
              unitType,
            },
          });
          markFirstAccessStepCompleted("unit");
        }}
        onCompleted={() => {
          setStage("resident");
        }}
      />
    );
  }

  if (stage === "resident") {
    return (
      <ResidenteForm
        open={true}
        onClose={handleWizardClose}
        onSaved={() => {}}
        loading={busy}
        setLoading={setBusy}
        condominiumIdPreset={selectedCondominium?.id}
        condominiumNamePreset={selectedCondominium?.label}
        blockNamePreset={context.block?.label}
        unitIdPreset={context.unit?.id}
        unitCodePreset={context.unit?.label}
        unit={residentUnitType}
        firstAccessMode={true}
        onCreated={({ residentId, userId, label }) => {
          patchFirstAccessContext({
            residents: [{ id: residentId, label, userId }],
            resident: { id: residentId, label, userId },
          });
          if (!localStorage.getItem("userId")) {
            localStorage.setItem("userId", userId);
          }
          markFirstAccessStepCompleted("resident");
        }}
        onCompleted={() => {
          setStage("done");
        }}
      />
    );
  }

  return (
    <StepWizardCard
      title="Primeiro Acesso Concluido"
      subtitle="A configuracao inicial foi finalizada com sucesso. Voce ja pode continuar usando a plataforma."
      steps={["Organizacao", "Condominio", "Estrutura", "Unidade", "Ocupante"]}
      activeStep={4}
      onClose={finishWizard}
      disableContent={false}
      actions={
        <Button
          variant="contained"
          onClick={finishWizard}
          sx={{ textTransform: "none" }}
        >
          Ir para o Dashboard
        </Button>
      }
    >
      <Box sx={{ textAlign: "center" }}>
      </Box>
    </StepWizardCard>
  );
}

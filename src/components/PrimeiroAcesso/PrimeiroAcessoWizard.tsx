import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import RouteNames from "../../routes/routeNames";
import OrganizacaoForm from "../Organizacoes/OrganizacaoForm";
import CondominioForm from "../Condominio/CondominioForm";
import BlocoForm from "../Blocos/BlocoForm";
import UnidadeForm from "../Unidades/UnidadeForm";
import ResidenteForm from "../Residentes/ResidenteForm";
import FirstAccessComplete from "./FirstAccessComplete";
import OrganizationTypeStep from "./OrganizationTypeStep";
import {
  organizationService,
  type OrganizationTypeEnum,
} from "../../services/organizationService";
import {
  condominiumService,
  type Condominium,
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
import { AuthService } from "../../services/authService";

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

type WizardStage =
  | "organizationType"
  | "organization"
  | "condominium"
  | "block"
  | "unit"
  | "resident"
  | "done";

const getInitialStage = (): WizardStage => {
  const context = readFirstAccessContext();
  const orgType = Number(context?.orgType || 0);

  if (!context?.orgType) return "organizationType";
  if (orgType === 2) {
    if (!context.selectedCondominiumId) return "condominium";
    if (!context.block) return "block";
    if (!context.unit) return "unit";
    if (!context.resident) return "resident";
    return "done";
  }
  if (!context.organization) return "organization";
  if (!context.selectedCondominiumId) return "condominium";
  return "done";
};

export default function PrimeiroAcessoWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFirstAccess = searchParams.get("first") === "1";

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
  const [existingCondominium, setExistingCondominium] =
    useState<Condominium | null>(null);
  const [existingCondominiumLoading, setExistingCondominiumLoading] =
    useState(false);

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

  useEffect(() => {
    const loadExistingCondominium = async () => {
      if (stage !== "condominium") {
        return;
      }

      const currentContext = readFirstAccessContext();
      const organizationId = currentContext?.organization?.id;
      const orgType = Number(currentContext?.orgType || 0);

      if (orgType !== 2 || !organizationId) {
        setExistingCondominium(null);
        return;
      }

      setExistingCondominiumLoading(true);
      try {
        const response = await condominiumService.getCondominiums(
          organizationId,
          1,
          10,
        );
        const firstCondominium = response?.items?.[0] ?? null;
        setExistingCondominium(firstCondominium);

        if (firstCondominium) {
          patchFirstAccessContext({
            condominiums: [
              {
                id: firstCondominium.condominiumId,
                label: firstCondominium.name,
              },
            ],
            selectedCondominiumId: firstCondominium.condominiumId,
          });
          syncFirstAccessIdsToLegacyStorage({
            condominiumId: firstCondominium.condominiumId,
          });
          markFirstAccessStepCompleted("condominium");
        }
      } catch {
        setExistingCondominium(null);
      } finally {
        setExistingCondominiumLoading(false);
      }
    };

    void loadExistingCondominium();
  }, [stage]);

  const context = readFirstAccessContext();
  const effectiveOrganizationTypes = useMemo(
    () =>
      organizationTypes.length > 0
        ? organizationTypes
        : FALLBACK_ORGANIZATION_TYPES,
    [organizationTypes],
  );
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

  const endFirstAccessAndGoToLogin = () => {
    clearFirstAccessContext();
    AuthService.logout();
    window.dispatchEvent(new Event("storage"));
    navigate(RouteNames.Login, { replace: true });
  };

  const finishWizard = () => {
    endFirstAccessAndGoToLogin();
  };

  const handleWizardClose = () => {
    endFirstAccessAndGoToLogin();
  };

  const isSelfManagedFlow = Number(context?.orgType || 0) === 2;
  const getCondominiumWithOrganizationOrgType = () => {
    const selectedType = organizationTypes.find(
      (type) => type.id === Number(context?.orgType || 0),
    ) || effectiveOrganizationTypes.find(
      (type) => type.id === Number(context?.orgType || 0),
    );

    return (
      context?.orgTypeValue ||
      selectedType?.value ||
      context?.orgType ||
      ""
    );
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

  if (stage === "condominium" && existingCondominiumLoading) {
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

  if (stage === "organizationType") {
    return (
      <OrganizationTypeStep
        organizationTypes={organizationTypes}
        loading={bootstrapLoading}
        onClose={handleWizardClose}
        onSelect={(type) => {
          patchFirstAccessContext({
            orgType: type.id,
            orgTypeValue: type.value,
          });
          localStorage.setItem("onboardingOrgType", String(type.id));
          setStage(type.id === 2 ? "condominium" : "organization");
        }}
      />
    );
  }

  if (stage === "organization") {
    return (
      <OrganizacaoForm
      full={true}
        open={true}
        editingOrganization={null}
        onClose={handleWizardClose}
        onSaved={() => {}}
        organizationTypes={effectiveOrganizationTypes}
        typesLoading={false}
        typesError={null}
        loading={busy}
        setLoading={setBusy}
        firstAccessMode={true}
        presetOrgType={context.orgType}
        lockOrgType={true}
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
        editingCondominium={Number(context?.orgType || 0) === 2 ? existingCondominium : null}
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
        createWithOrganizationOrgType={
          isSelfManagedFlow ? getCondominiumWithOrganizationOrgType() : undefined
        }
        onCreated={({ condominiumId, label }) => {
          patchFirstAccessContext({
            condominiums: [{ id: condominiumId, label }],
            selectedCondominiumId: condominiumId,
          });
          syncFirstAccessIdsToLegacyStorage({ condominiumId });
          markFirstAccessStepCompleted("condominium");
        }}
        onCompleted={() => {
          if (isSelfManagedFlow && existingCondominium) {
            patchFirstAccessContext({
              condominiums: [
                {
                  id: existingCondominium.condominiumId,
                  label: existingCondominium.name,
                },
              ],
              selectedCondominiumId: existingCondominium.condominiumId,
            });
            syncFirstAccessIdsToLegacyStorage({
              condominiumId: existingCondominium.condominiumId,
            });
            markFirstAccessStepCompleted("condominium");
          }
          setStage(isSelfManagedFlow ? "block" : "done");
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
        blockId={context.block?.id || ""}
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
    <FirstAccessComplete
      onFinish={finishWizard}
      showAdditionalCondominiumsMessage={!isSelfManagedFlow}
    />
  );
}

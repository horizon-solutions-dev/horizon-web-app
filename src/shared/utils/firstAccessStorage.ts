export type FirstAccessEntityRef = {
  id: string;
  label: string;
  condominiumId?: string;
  blockId?: string;
  unitType?: string | number;
  userId?: string;
};

export type FirstAccessContext = {
  enabled: boolean;
  orgType?: number;
  orgTypeValue?: string;
  organization?: FirstAccessEntityRef;
  condominiums: FirstAccessEntityRef[];
  blocks: FirstAccessEntityRef[];
  units: FirstAccessEntityRef[];
  residents: FirstAccessEntityRef[];
  selectedCondominiumId?: string;
  block?: FirstAccessEntityRef;
  unit?: FirstAccessEntityRef;
  resident?: FirstAccessEntityRef;
  completedSteps: string[];
};

const STORAGE_KEY = "firstAccessContext";

const defaultContext = (): FirstAccessContext => ({
  enabled: true,
  condominiums: [],
  blocks: [],
  units: [],
  residents: [],
  completedSteps: [],
});

export const readFirstAccessContext = (): FirstAccessContext | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<FirstAccessContext>;
    return {
      ...defaultContext(),
      ...parsed,
      condominiums: parsed.condominiums ?? [],
      blocks: parsed.blocks ?? [],
      units: parsed.units ?? [],
      residents: parsed.residents ?? [],
      completedSteps: parsed.completedSteps ?? [],
    };
  } catch {
    return null;
  }
};

export const writeFirstAccessContext = (context: FirstAccessContext) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
};

export const patchFirstAccessContext = (
  partial: Partial<FirstAccessContext>,
) => {
  const next = {
    ...defaultContext(),
    ...(readFirstAccessContext() ?? {}),
    ...partial,
  };

  if (!next.condominiums) {
    next.condominiums = [];
  }

  if (!next.blocks) {
    next.blocks = [];
  }

  if (!next.units) {
    next.units = [];
  }

  if (!next.residents) {
    next.residents = [];
  }

  if (!next.completedSteps) {
    next.completedSteps = [];
  }

  writeFirstAccessContext(next);
  return next;
};

export const markFirstAccessStepCompleted = (step: string) => {
  const current = readFirstAccessContext() ?? defaultContext();
  const completedSteps = current.completedSteps.includes(step)
    ? current.completedSteps
    : [...current.completedSteps, step];

  return patchFirstAccessContext({ completedSteps });
};

export const clearFirstAccessContext = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const syncFirstAccessIdsToLegacyStorage = (
  partial: Partial<{
    organizationId: string;
    condominiumId: string;
  }>,
) => {
  if (partial.organizationId && !localStorage.getItem("organizationId")) {
    localStorage.setItem("organizationId", partial.organizationId);
  }

  if (partial.condominiumId && !localStorage.getItem("condominiumId")) {
    localStorage.setItem("condominiumId", partial.condominiumId);
  }
};

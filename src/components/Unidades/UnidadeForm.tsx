/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AxiosError } from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  //  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  unitService,
  type CondominiumUnit,
  type CondominiumUnitRequest,
  type UnitTypeEnum,
} from "../../services/unitService";
import {
  type AllocationTypeEnum,
} from "../../services/condominiumService";
import { AppStateModal } from "../../shared/components/AppStateModal";
import StepWizardCard from "../../shared/components/StepWizardCard";
import { useAppStateModal } from "../../shared/utils/useAppStateModal";

interface UnidadeFormProps {
  open: boolean;
  editingUnit: CondominiumUnit | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  unitTypes: UnitTypeEnum[];
  allocationUnitTypes: AllocationTypeEnum[];
  typesLoading: boolean;
  allocationTypesLoading: boolean;
  typesError: string | null;
  allocationTypesError: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  condominiumIdPreset?: string;
  condominiumNamePreset?: string;
  blockId: string;
  blockNamePreset?: string;
}

type FormErrors = {
  unitCode?: string;
  unitType?: string;
  allocationType?: string;
  allocationTypeValue?: string;
};
/* 
const ALLOCATION_OPTIONS = [
  { value: "FractionalAllocation", label: "Fracionado" },
  { value: "FixedAllocation", label: "Fixo" },
  { value: "ProportionalAllocation", label: "Proporcional" },
]; */

const normalizeUnitType = (value?: string | number) => {
  if (value === 1 || value === "1") return "Owner";
  if (value === 2 || value === "2") return "Tenant";
  return value || "Owner";
};

const normalizeAllocationType = (value?: string | number) => {
  if (value === 1 || value === "1") return "FractionalAllocation";
  if (value === 2 || value === "2") return "FixedAllocation";
  if (value === 3 || value === "3") return "ProportionalAllocation";
  return value || "FractionalAllocation";
};

const normalizeAllocationTypeValue = (
  value: string | number | undefined,
  allocationTypes: AllocationTypeEnum[],
) => {
  const match = allocationTypes.find(
    (type) => type.id === value || type.value === value,
  );
  return match?.id ?? value;
};

const UnidadeForm: React.FC<UnidadeFormProps> = ({
  open,
  editingUnit,
  onClose,
  onSaved,
  unitTypes,
  allocationUnitTypes,
  typesLoading,
  allocationTypesLoading,
  typesError,
  allocationTypesError,
  loading,
  setLoading,
  condominiumIdPreset,
  condominiumNamePreset,
  blockId,
  blockNamePreset,
}) => {
  const [allocationLoading, setAllocationLoading] = useState(false);
  const normalizeAllocationTypeValue = (value: any) => {
    console.log("Normalizing allocation type value:", value,'-', allocationTypes);
    const match = allocationTypes.find(
      (type) => type.id === value || type.value === value,
    );
    return match?.id ?? value;
  };
  const { appStateModal, handleClose, showSuccess, showError } =
    useAppStateModal();
  const [closeAfterModal, setCloseAfterModal] = useState(false);
  const [formData, setFormData] = useState<CondominiumUnitRequest>({
    condominiumId: condominiumIdPreset || "",
    condominiumBlockId: blockId,
    unitCode: "",
    unitType: "Owner",
    allocationType: 1,
    allocationTypeValue: 1,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const { t } = useTranslation();
  const steps = [t("unidadeForm.stepData")];
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>(
    [],
  );

  const loadAllocationTypes = async () => {
    setAllocationLoading(true);
    try {
      const data = await unitService.getAllocationTypes();
      setAllocationTypes(data ?? []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("condominioForm.allocationLoadError");
      showError(message);
    } finally {
      setAllocationLoading(false);
    }
  };

  const resolvedCondominiumName = useMemo(
    () => condominiumNamePreset || t("unidadeForm.selectedCondominium"),
    [condominiumNamePreset, t],
  );
  const resolvedBlockName = useMemo(
    () => blockNamePreset || t("unidadeForm.selectedBlock"),
    [blockNamePreset, t],
  );

  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (editingUnit) {
      setEditingId(editingUnit.condominiumUnitId);
      setFormData({
        condominiumId: editingUnit.condominiumId,
        condominiumBlockId: editingUnit.condominiumBlockId,
        unitCode: editingUnit.unitCode,
        unitType: normalizeUnitType(editingUnit.unitType),
        allocationType: normalizeAllocationTypeValue(editingUnit.allocationType),
        allocationTypeValue: editingUnit.allocationTypeValue ?? "",
      });
      return;
    }

    setEditingId(null);
    setFormData({
      condominiumId: condominiumIdPreset || "",
      condominiumBlockId: blockId,
      unitCode: "",
      unitType: "Owner",
      allocationType: "FractionalAllocation",
      allocationTypeValue: "",
    });
  }, [open, editingUnit, condominiumIdPreset, blockId, allocationTypes]);

  useEffect(() => {
    loadAllocationTypes();
  }, []);

  if (!open) return null;

  const handleChange = (field: keyof CondominiumUnitRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    console.log(formData);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!formData.unitCode.trim()) {
      nextErrors.unitCode = t("unidadeForm.unitCodeRequired");
    }
    if (!formData.unitType) {
      nextErrors.unitType = t("unidadeForm.unitTypeRequired");
    }
    if (!formData.allocationType) {
      nextErrors.allocationType = t("unidadeForm.allocationTypeRequired");
    }
    if (
      formData.allocationTypeValue === undefined ||
      formData.allocationTypeValue === null ||
      String(formData.allocationTypeValue).trim() === ""
    ) {
      nextErrors.allocationTypeValue = t(
        "unidadeForm.allocationTypeValueRequired",
      );
    }

    setErrors(nextErrors);
    const hasIdErrors = !formData.condominiumId || !formData.condominiumBlockId;
    return !hasIdErrors && Object.keys(nextErrors).length === 0;
  };

  const fieldMap: Record<string, keyof CondominiumUnitRequest> = {
    condominiumid: "condominiumId",
    condominiumblockid: "condominiumBlockId",
    unitcode: "unitCode",
    unittype: "unitType",
    allocationtype: "allocationType",
    allocationtypevalue: "allocationTypeValue",
    commit: "commit",
  };

  const applyBackendValidationErrors = (
    validations: Array<{ field: string; message: string }>,
  ) => {
    const nextErrors: FormErrors = {};
    validations.forEach((validation) => {
      const key = validation.field?.replace(/\s+/g, "").toLowerCase();
      const field = key ? fieldMap[key] : undefined;
      if (!field) return;
      if (field === "unitCode") nextErrors.unitCode = validation.message;
      if (field === "unitType") nextErrors.unitType = validation.message;
      if (field === "allocationType")
        nextErrors.allocationType = validation.message;
      if (field === "allocationTypeValue")
        nextErrors.allocationTypeValue = validation.message;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload: CondominiumUnitRequest = {
        ...formData,
        allocationType: normalizeAllocationTypeValue(formData.allocationType!),

        allocationTypeValue: Number(formData.allocationTypeValue),
        commit: true,
      };

      const { valid, validations } = editingId
        ? await unitService.validateUnitEdit(
            {
              ...payload,
              commit: false,
            },
            editingUnit?.condominiumUnitId || "",
          )
        : await unitService.validateUnit({
            ...payload,
            commit: false,
          });

      if (!valid && validations.length > 0) {
        if (applyBackendValidationErrors(validations)) {
          return;
        }
      }

      if (editingId) {
        await unitService.updateUnit(editingId, payload);
        showSuccess(t("unidadeForm.updateSuccess"));
      } else {
        await unitService.createUnit(payload);
        showSuccess(t("unidadeForm.createSuccess"));
      }

      setCloseAfterModal(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        setErrors({
          unitCode: t("unidadeForm.duplicateUnitCode"),
        });
      } else {
        const message =
          error instanceof Error ? error.message : t("unidadeForm.saveError");
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = async () => {
    handleClose();
    await onSaved();

    if (closeAfterModal) {
      setCloseAfterModal(false);
      onClose();
    }
    onSaved();
  };

  const renderUnitTypeOptions = () => {
    if (typesLoading) {
      return (
        <MenuItem value={formData.unitType} disabled>
          {t("common.loading")}
        </MenuItem>
      );
    }

    if (unitTypes.length > 0) {
      return unitTypes.map((type) => (
        <MenuItem key={type.id} value={type.value}>
          {type.description || type.value}
        </MenuItem>
      ));
    }

    return (
      <>
        <MenuItem value="Owner">{t("common.owner")}</MenuItem>
        <MenuItem value="Tenant">{t("common.tenant")}</MenuItem>
      </>
    );
  };

  return (
    <>
      <StepWizardCard
        title={
          editingId ? t("unidadeForm.editTitle") : t("unidadeForm.createTitle")
        }
        subtitle={steps[0]}
        steps={steps}
        activeStep={0}
        showBack={false}
        onClose={onClose}
        disableContent={loading}
        actions={
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ marginTop: "16px" }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : t("common.finish")}
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
              },
              "& .MuiOutlinedInput-root.Mui-disabled:hover fieldset": {
                borderColor: "#e0e0e0 !important",
              },
              "& .MuiOutlinedInput-root.Mui-disabled fieldset": {
                borderColor: "#e0e0e0 !important",
              },
            }}
            value={resolvedCondominiumName}
            fullWidth
            disabled
          />
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
                display: "flex",
              },
              "& .MuiOutlinedInput-root.Mui-disabled:hover fieldset": {
                borderColor: "#e0e0e0 !important",
              },
              "& .MuiOutlinedInput-root.Mui-disabled fieldset": {
                borderColor: "#e0e0e0 !important",
              },
            }}
            value={resolvedBlockName}
            fullWidth
            disabled
          />

          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
                display: "flex",
              },
            }}
            fullWidth
            value={formData.unitCode}
            onChange={(e) => handleChange("unitCode", e.target.value)}
            error={Boolean(errors.unitCode)}
            helperText={errors.unitCode}
            placeholder={t("unidadeForm.unitCodePlaceholder")}
          />
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
                display: "flex",
              },
            }}
            select
            value={formData.unitType || ""}
            onChange={(e) => handleChange("unitType", e.target.value)}
            fullWidth
            error={Boolean(errors.unitType)}
            helperText={errors.unitType || typesError || ""}
          >
            {renderUnitTypeOptions()}
          </TextField>
          <TextField
            fullWidth
            select
            value={formData.allocationType}
            onChange={(e) =>
              handleChange(
                "allocationType",
                normalizeAllocationTypeValue(e.target.value as string),
              )
            }
            error={!!errors.allocationType}
            helperText={errors.allocationType}
            size="small"
          >
            <MenuItem value="" disabled>
              <em>Selecione o tipo de rateio</em>
            </MenuItem>
            {allocationLoading ? (
              <MenuItem
                value={formData.allocationType}
                disabled
              >
                {t("common.loading")}
              </MenuItem>
            ) : allocationTypes.length > 0 ? (
              allocationTypes.map((type) => (
                <MenuItem sx={{ width: "340px" }} key={type.id} value={type.id}>
                  {type.description || type.value}
                </MenuItem>
              ))
            ) : (
              <>
                <MenuItem value="FractionalAllocation">
                  Rateio fracionário
                </MenuItem>
                <MenuItem value="FixedAllocation">Rateio fixo</MenuItem>
                <MenuItem value="ProportionalAllocation">
                  Rateio proporcional
                </MenuItem>
              </>
            )}
          </TextField>
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 46,
                display: "flex",
              },
            }}
            fullWidth
            type="number"
            value={formData.allocationTypeValue ?? ""}
            onChange={(e) =>
              handleChange("allocationTypeValue", e.target.value)
            }
            error={Boolean(errors.allocationTypeValue)}
            helperText={errors.allocationTypeValue}
            placeholder={t("unidadeForm.allocationTypeValuePlaceholder")}
            inputProps={{ min: 0, step: "any" }}
          />
        </Box>
      </StepWizardCard>

      <AppStateModal
        open={appStateModal.open}
        type={appStateModal.type}
        title={appStateModal.title}
        message={appStateModal.message}
        detail={appStateModal.detail}
        item={appStateModal.item}
        onConfirm={handleModalClose}
        onClose={handleModalClose}
        showCancel={false}
      />
    </>
  );
};

export default UnidadeForm;

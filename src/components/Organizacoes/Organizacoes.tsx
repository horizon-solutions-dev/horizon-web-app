import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { organizationService, type OrganizationRequest, type OrganizationTypeEnum } from '../../services/organizationService';
import { profileService, type Profile } from '../../services/profileService';
import { condominiumService, type CondominiumRequest, type CondominiumTypeEnum, type AllocationTypeEnum } from '../../services/condominiumService';
import { condominiumImageService, type ImageTypeEnum, type ImageType, type CondominiumImage } from '../../services/condominiumImageService';
import { AuthService } from '../../services/authService';
import { TokenService } from '../../services/tokenService';
import StepWizardCard from '../../shared/components/StepWizardCard';

const sequenceStorageKey = 'organizationSequence';

type SequenceState = {
  organizationId: string;
  organizationUserId: string;
  condominiumId: string;
};

const initialSequence: SequenceState = {
  organizationId: '',
  organizationUserId: '',
  condominiumId: '',
};

const initialOrganizationForm: OrganizationRequest = {
  name: '',
  legalName: '',
  doc: '',
  orgType: undefined,
  email: '',
  phone: '',
  city: '',
  state: '',
};

const initialCondoForm: CondominiumRequest = {
  organizationId: '',
  name: '',
  doc: '',
  address: '',
  addressNumber: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  condominiumType: 1,
  unitCount: 0,
  hasBlocks: false,
  hasWaterIndividual: false,
  hasPowerByBlock: false,
  hasGasByBlock: false,
  allocationType: 'FractionalAllocation',
  allocationValuePerc: 0,
};

const steps = ['Organizacao', 'Usuario', 'Condominio', 'Imagens'];

const Organizacoes: React.FC = () => {
  const [sequence, setSequence] = useState<SequenceState>(initialSequence);
  const [activeStep, setActiveStep] = useState(0);

  const [organizationForm, setOrganizationForm] = useState<OrganizationRequest>(initialOrganizationForm);
  const [existingOrganizationId, setExistingOrganizationId] = useState('');
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationTypeEnum[]>([]);
  const [organizationTypesLoading, setOrganizationTypesLoading] = useState(false);
  const [organizationTypesError, setOrganizationTypesError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | ''>('');
  const [owner, setOwner] = useState(false);

  const [condoForm, setCondoForm] = useState<CondominiumRequest>(initialCondoForm);
  const [existingCondominiumId, setExistingCondominiumId] = useState('');
  const [condominiumTypes, setCondominiumTypes] = useState<CondominiumTypeEnum[]>([]);
  const [allocationTypes, setAllocationTypes] = useState<AllocationTypeEnum[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const [imageTypes, setImageTypes] = useState<ImageTypeEnum[]>([]);
  const [imageTypesLoading, setImageTypesLoading] = useState(false);
  const [imageType, setImageType] = useState<ImageType | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFilterType, setImageFilterType] = useState<ImageType | ''>('');
  const [images, setImages] = useState<CondominiumImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const tokenUserId = useMemo(() => {
    const token = AuthService.getToken();
    return TokenService.getUserId(token) || '';
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(sequenceStorageKey);
    if (saved) {
      try {
        const parsed: SequenceState = JSON.parse(saved);
        setSequence({ ...initialSequence, ...parsed });
      } catch {
        setSequence(initialSequence);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(sequenceStorageKey, JSON.stringify(sequence));
  }, [sequence]);

  useEffect(() => {
    if (!sequence.organizationId) {
      setActiveStep(0);
    } else if (!sequence.organizationUserId) {
      setActiveStep(1);
    } else if (!sequence.condominiumId) {
      setActiveStep(2);
    } else {
      setActiveStep(3);
    }
  }, [sequence]);

  useEffect(() => {
    setOrganizationTypesLoading(true);
    organizationService
      .getOrganizationTypes()
      .then((data) => setOrganizationTypes(data ?? []))
      .catch((error) =>
        setOrganizationTypesError(error instanceof Error ? error.message : 'Erro ao carregar tipos.'),
      )
      .finally(() => setOrganizationTypesLoading(false));
  }, []);

  useEffect(() => {
    setProfilesLoading(true);
    profileService
      .getProfiles()
      .then((data) => setProfiles(data ?? []))
      .catch((error) =>
        setProfilesError(error instanceof Error ? error.message : 'Erro ao carregar perfis.'),
      )
      .finally(() => setProfilesLoading(false));
  }, []);

  useEffect(() => {
    setTypesLoading(true);
    setAllocationLoading(true);

    condominiumService
      .getCondominiumTypes()
      .then((data) => setCondominiumTypes(data ?? []))
      .catch((error) =>
        setTypesError(error instanceof Error ? error.message : 'Erro ao carregar tipos de condominio.'),
      )
      .finally(() => setTypesLoading(false));

    condominiumService
      .getAllocationTypes()
      .then((data) => setAllocationTypes(data ?? []))
      .catch((error) =>
        setAllocationError(error instanceof Error ? error.message : 'Erro ao carregar tipos de rateio.'),
      )
      .finally(() => setAllocationLoading(false));
  }, []);

  useEffect(() => {
    setImageTypesLoading(true);
    condominiumImageService
      .getImageTypes()
      .then((data) => setImageTypes(data ?? []))
      .catch(() => null)
      .finally(() => setImageTypesLoading(false));
  }, []);

  useEffect(() => {
    if (sequence.organizationId) {
      setCondoForm((prev) => ({ ...prev, organizationId: sequence.organizationId }));
    }
  }, [sequence.organizationId]);

  const handleCepLookup = async () => {
    const cepDigits = condoForm.zipCode.replace(/\D/g, '');
    if (cepDigits.length !== 8) {
      setCepError('CEP deve conter 8 digitos.');
      return;
    }

    setCepLoading(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      if (data?.erro) {
        setCepError('CEP nao encontrado.');
        return;
      }

      setCondoForm((prev) => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch {
      setCepError('Erro ao consultar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!organizationForm.name || !organizationForm.legalName || !organizationForm.doc) {
      setSnackbar({ open: true, message: 'Preencha os campos obrigatorios da organizacao.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await organizationService.createOrganization(organizationForm);
      setSequence((prev) => ({ ...prev, organizationId: response.organizationId }));
      setActiveStep(1);
      setSnackbar({ open: true, message: 'Organizacao criada com sucesso.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar organizacao.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkUser = async () => {
    if (!sequence.organizationId) {
      setSnackbar({ open: true, message: 'OrganizationId nao definido.', severity: 'error' });
      return;
    }
    if (!tokenUserId) {
      setSnackbar({ open: true, message: 'UserId nao encontrado no token.', severity: 'error' });
      return;
    }
    if (!profileId) {
      setSnackbar({ open: true, message: 'Selecione o perfil.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await organizationService.addUserToOrganization(sequence.organizationId, {
        userId: tokenUserId,
        profileId: Number(profileId),
        owner,
      });
      setSequence((prev) => ({ ...prev, organizationUserId: response.organizationUserId }));
      setSnackbar({ open: true, message: 'Usuario vinculado com sucesso.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao vincular usuario.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCondominium = async () => {
    if (!sequence.organizationId) {
      setSnackbar({ open: true, message: 'OrganizationId nao definido.', severity: 'error' });
      return;
    }
    if (!condoForm.name || !condoForm.doc || !condoForm.address || !condoForm.neighborhood) {
      setSnackbar({ open: true, message: 'Preencha os campos obrigatorios do condominio.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await condominiumService.createCondominium({
        ...condoForm,
        organizationId: sequence.organizationId,
      });
      setSequence((prev) => ({ ...prev, condominiumId: response.condominiumId }));
      setSnackbar({ open: true, message: 'Condominio criado com sucesso.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar condominio.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!sequence.condominiumId) {
      setSnackbar({ open: true, message: 'CondominiumId nao definido.', severity: 'error' });
      return;
    }
    if (!imageType || !imageFile) {
      setSnackbar({ open: true, message: 'Selecione o tipo e o arquivo da imagem.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await condominiumImageService.uploadCondominiumImage({
        imageType,
        contentFile: imageFile,
        condominiumId: sequence.condominiumId,
      });
      setSnackbar({ open: true, message: 'Imagem enviada com sucesso.', severity: 'success' });
      setImageFile(null);
      setImageType('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar imagem.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    if (!sequence.condominiumId) {
      setSnackbar({ open: true, message: 'CondominiumId nao definido.', severity: 'error' });
      return;
    }
    setImagesLoading(true);
    try {
      const list = await condominiumImageService.getCondominiumImages(
        sequence.condominiumId,
        imageFilterType || undefined
      );
      const normalized = list ?? [];
      setImages(normalized);

      const previews: Record<string, string> = {};
      await Promise.all(
        normalized.map(async (item) => {
          try {
            const detail = await condominiumImageService.getCondominiumImageById(item.condominiumImageId);
            if (detail?.contentFile && detail?.contentType) {
              previews[item.condominiumImageId] = `data:${detail.contentType};base64,${detail.contentFile}`;
            }
          } catch {
            // ignore individual errors
          }
        })
      );
      setImagePreviews(previews);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar imagens.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setImagesLoading(false);
    }
  };

  const handleUseExistingId = (key: keyof SequenceState, value: string) => {
    if (!value.trim()) {
      setSnackbar({ open: true, message: 'Informe o ID para continuar.', severity: 'error' });
      return;
    }
    setSequence((prev) => ({ ...prev, [key]: value.trim() }));
    if (key === 'organizationId') {
      setActiveStep(1);
    }
    if (key === 'organizationUserId') {
      setActiveStep(2);
    }
    if (key === 'condominiumId') {
      setActiveStep(3);
    }
  };

  const resetSequence = () => {
    setSequence(initialSequence);
    setOrganizationForm(initialOrganizationForm);
    setCondoForm(initialCondoForm);
    setExistingOrganizationId('');
    setExistingCondominiumId('');
    setProfileId('');
    setOwner(false);
    setImageFile(null);
    setImageType('');
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">

        {activeStep === 0 ? (
          <StepWizardCard
            title="Criar organizacao"
            subtitle={steps[activeStep]}
            steps={steps}
            activeStep={activeStep}
            showBack={activeStep > 0 && activeStep < steps.length - 1}
            onBack={() => setActiveStep((prev) => prev - 1)}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Organizacao
            </Typography>
            {organizationTypesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {organizationTypesError}
              </Alert>
            ) : null}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Nome"
                  value={organizationForm.name}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Razao Social"
                  value={organizationForm.legalName}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, legalName: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Documento (CNPJ)"
                  value={organizationForm.doc}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, doc: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Tipo de Organizacao"
                  select
                  value={organizationForm.orgType ?? ''}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, orgType: e.target.value }))}
                >
                  {organizationTypesLoading ? (
                    <MenuItem value="" disabled>
                      Carregando...
                    </MenuItem>
                  ) : organizationTypes.length > 0 ? (
                    organizationTypes.map((type) => (
                      <MenuItem key={type.id} value={type.value}>
                        {type.description || type.value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="PropertyManagementCompany">Administradora</MenuItem>
                  )}
                </TextField>
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Email"
                  value={organizationForm.email}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={organizationForm.phone}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={organizationForm.city}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Estado"
                  value={organizationForm.state}
                  onChange={(e) => setOrganizationForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={handleCreateOrganization} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Salvar e avancar'}
              </Button>
              <Button variant="outlined" onClick={resetSequence} disabled={loading}>
                Cancelar
              </Button>
              <TextField
                label="Usar organizacao existente (ID)"
                value={existingOrganizationId}
                onChange={(e) => setExistingOrganizationId(e.target.value)}
                size="small"
              />
              <Button variant="outlined" onClick={() => handleUseExistingId('organizationId', existingOrganizationId)}>
                Usar ID existente
              </Button>
            </Box>
          </StepWizardCard>
        ) : null}

        {activeStep === 1 ? (
          <StepWizardCard
            title="Criar organizacao"
            subtitle={steps[activeStep]}
            steps={steps}
            activeStep={activeStep}
            showBack={activeStep > 0 && activeStep < steps.length - 1}
            onBack={() => setActiveStep((prev) => prev - 1)}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Vincular usuario
            </Typography>
            {profilesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profilesError}
              </Alert>
            ) : null}
            {!tokenUserId ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                UserId nao encontrado no token. Faca login novamente.
              </Alert>
            ) : null}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <TextField fullWidth label="OrganizationId" value={sequence.organizationId} disabled />
              </Box>
              <Box>
                <TextField fullWidth label="UserId (token)" value={tokenUserId} disabled />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Perfil"
                  select
                  value={profileId}
                  onChange={(e) => setProfileId(Number(e.target.value))}
                >
                  <MenuItem value="" disabled>
                    Selecione um perfil
                  </MenuItem>
                  {profilesLoading ? (
                    <MenuItem value="" disabled>
                      Carregando...
                    </MenuItem>
                  ) : profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <MenuItem key={profile.profileId} value={profile.profileId}>
                        {profile.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value={1}>Administrador</MenuItem>
                  )}
                </TextField>
              </Box>
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={owner} onChange={(e) => setOwner(e.target.checked)} />}
                  label="Owner"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={handleLinkUser} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Salvar e avancar'}
              </Button>
              <Button variant="outlined" onClick={resetSequence} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleUseExistingId('organizationUserId', 'skipped')}
              >
                Pular por agora
              </Button>
            </Box>
          </StepWizardCard>
        ) : null}

        {activeStep === 2 ? (
          <StepWizardCard
            title="Criar organizacao"
            subtitle={steps[activeStep]}
            steps={steps}
            activeStep={activeStep}
            showBack={activeStep > 0 && activeStep < steps.length - 1}
            onBack={() => setActiveStep((prev) => prev - 1)}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Condominio
            </Typography>
            {typesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {typesError}
              </Alert>
            ) : null}
            {allocationError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {allocationError}
              </Alert>
            ) : null}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="CEP"
                  value={condoForm.zipCode}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                  onBlur={handleCepLookup}
                  error={!!cepError}
                  helperText={cepError || 'Informe o CEP para buscar o endereco'}
                  InputProps={{ endAdornment: cepLoading ? <CircularProgress size={18} /> : null }}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Endereco"
                  value={condoForm.address}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Numero"
                  value={condoForm.addressNumber}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, addressNumber: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Complemento"
                  value={condoForm.complement}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, complement: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={condoForm.neighborhood}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, neighborhood: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={condoForm.city}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="UF"
                  value={condoForm.state}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Nome do condominio"
                  value={condoForm.name}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="CNPJ"
                  value={condoForm.doc}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, doc: e.target.value }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Tipo de condominio"
                  select
                  value={condoForm.condominiumType}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, condominiumType: e.target.value }))}
                >
                  {typesLoading ? (
                    <MenuItem value="" disabled>
                      Carregando...
                    </MenuItem>
                  ) : condominiumTypes.length > 0 ? (
                    condominiumTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.description || type.value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="Residential">Residencial</MenuItem>
                  )}
                </TextField>
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Quantidade de unidades"
                  type="number"
                  value={condoForm.unitCount}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, unitCount: Number(e.target.value) }))}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Tipo de rateio"
                  select
                  value={condoForm.allocationType}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, allocationType: e.target.value }))}
                >
                  {allocationLoading ? (
                    <MenuItem value="" disabled>
                      Carregando...
                    </MenuItem>
                  ) : allocationTypes.length > 0 ? (
                    allocationTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.description || type.value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="FractionalAllocation">Fracionario</MenuItem>
                  )}
                </TextField>
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Percentual de rateio (%)"
                  type="number"
                  value={condoForm.allocationValuePerc}
                  onChange={(e) => setCondoForm((prev) => ({ ...prev, allocationValuePerc: Number(e.target.value) }))}
                />
              </Box>
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={condoForm.hasBlocks} onChange={(e) => setCondoForm((prev) => ({ ...prev, hasBlocks: e.target.checked }))} />}
                  label="Possui blocos"
                />
              </Box>
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={condoForm.hasWaterIndividual} onChange={(e) => setCondoForm((prev) => ({ ...prev, hasWaterIndividual: e.target.checked }))} />}
                  label="Agua individual"
                />
              </Box>
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={condoForm.hasPowerByBlock} onChange={(e) => setCondoForm((prev) => ({ ...prev, hasPowerByBlock: e.target.checked }))} />}
                  label="Energia por bloco"
                />
              </Box>
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={condoForm.hasGasByBlock} onChange={(e) => setCondoForm((prev) => ({ ...prev, hasGasByBlock: e.target.checked }))} />}
                  label="Gas por bloco"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={handleCreateCondominium} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Salvar e avancar'}
              </Button>
              <Button variant="outlined" onClick={resetSequence} disabled={loading}>
                Cancelar
              </Button>
              <TextField
                label="Usar condominio existente (ID)"
                value={existingCondominiumId}
                onChange={(e) => setExistingCondominiumId(e.target.value)}
                size="small"
              />
              <Button variant="outlined" onClick={() => handleUseExistingId('condominiumId', existingCondominiumId)}>
                Usar ID existente
              </Button>
            </Box>
          </StepWizardCard>
        ) : null}

        {activeStep === 3 ? (
          <StepWizardCard
            title="Criar organizacao"
            subtitle={steps[activeStep]}
            steps={steps}
            activeStep={activeStep}
            showBack={activeStep > 0 && activeStep < steps.length - 1}
            onBack={() => setActiveStep((prev) => prev - 1)}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Imagens do condominio
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <TextField fullWidth label="CondominiumId" value={sequence.condominiumId} disabled />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Tipo de imagem"
                  select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value as ImageType)}
                >
                  <MenuItem value="" disabled>
                    Selecione um tipo
                  </MenuItem>
                  {imageTypesLoading ? (
                    <MenuItem value="" disabled>
                      Carregando...
                    </MenuItem>
                  ) : imageTypes.length > 0 ? (
                    imageTypes.map((type) => (
                      <MenuItem key={type.id} value={type.value}>
                        {type.description || type.value}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="Logo">Logo</MenuItem>
                  )}
                </TextField>
              </Box>
              <Box>
                <Button variant="outlined" component="label">
                  Selecionar arquivo
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {imageFile ? (
                  <Typography variant="body2" sx={{ ml: 2, display: 'inline-block' }}>
                    {imageFile.name}
                  </Typography>
                ) : null}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={handleUploadImage} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Enviar imagem'}
              </Button>
              <Button variant="outlined" onClick={loadImages} disabled={imagesLoading || loading}>
                {imagesLoading ? <CircularProgress size={20} /> : 'Carregar imagens'}
              </Button>
              <Button variant="outlined" onClick={resetSequence}>
                Reiniciar sequencia
              </Button>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Imagens cadastradas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Filtrar por tipo"
                    select
                    value={imageFilterType}
                    onChange={(e) => setImageFilterType(e.target.value as ImageType)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {imageTypes.map((type) => (
                      <MenuItem key={type.id} value={type.value}>
                        {type.description || type.value}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {images.length === 0 ? (
                  <Box>
                    <Alert severity="info">Nenhuma imagem encontrada.</Alert>
                  </Box>
                ) : (
                  images.map((item) => (
                    <Box>
                      <Paper elevation={2} sx={{ p: 2 }}>
                        <Box
                          sx={{
                            width: '100%',
                            height: 180,
                            background: '#f5f5f5',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            mb: 1,
                          }}
                        >
                          {imagePreviews[item.condominiumImageId] ? (
                            <img
                              src={imagePreviews[item.condominiumImageId]}
                              alt={String(item.imageType)}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sem preview
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="subtitle2">
                          Tipo: {String(item.imageType)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.condominiumImageId}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </StepWizardCard>
        ) : null}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Organizacoes;

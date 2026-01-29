import React, { useEffect, useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  organizationService,
  type OrganizationRequest,
  type OrganizationTypeEnum,
  type Organization,
  type OrganizationUserRequest,
} from '../../services/organizationService';

const initialForm: OrganizationRequest = {
  name: '',
  legalName: '',
  doc: '',
  orgType: undefined,
  email: '',
  phone: '',
  city: '',
  state: '',
};

const Organizacoes: React.FC = () => {
  const [formData, setFormData] = useState<OrganizationRequest>(initialForm);
  const [organizationIdQuery, setOrganizationIdQuery] = useState('');
  const [loadedOrganization, setLoadedOrganization] = useState<Organization | null>(null);
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationTypeEnum[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [activeStepOrg, setActiveStepOrg] = useState(0);
  const [activeStepLink, setActiveStepLink] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const orgSteps = ['Dados principais', 'Contato', 'Revisao'];
  const linkSteps = ['Dados do vinculo', 'Revisao'];

  const [linkUserData, setLinkUserData] = useState<OrganizationUserRequest>({
    userId: '',
    profileId: 0,
    owner: false,
  });

  const handleChange = (field: keyof OrganizationRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadOrganizationTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await organizationService.getOrganizationTypes();
      setOrganizationTypes(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar tipos.';
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizationTypes();
  }, []);

  const handleLookup = async () => {
    if (!organizationIdQuery.trim()) {
      setSnackbar({ open: true, message: 'Informe o OrganizationId.', severity: 'error' });
      return;
    }

    setLookupLoading(true);
    try {
      const data = await organizationService.getOrganizationById(organizationIdQuery.trim());
      setLoadedOrganization(data);
      setFormData({
        name: data.name,
        legalName: data.legalName,
        doc: data.doc,
        orgType: data.orgType,
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
      });
      setActiveStepOrg(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar organizacao.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.legalName || !formData.doc || !formData.email) {
      setSnackbar({ open: true, message: 'Preencha os campos obrigatorios.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (loadedOrganization?.organizationId) {
        await organizationService.updateOrganization(loadedOrganization.organizationId, formData);
        setSnackbar({ open: true, message: 'Organizacao atualizada com sucesso.', severity: 'success' });
      } else {
        const response = await organizationService.createOrganization(formData);
        setSnackbar({
          open: true,
          message: `Organizacao criada com sucesso. ID: ${response.organizationId}`,
          severity: 'success',
        });
      }
      setFormData(initialForm);
      setLoadedOrganization(null);
      setOrganizationIdQuery('');
      setActiveStepOrg(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar organizacao.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkUser = async () => {
    if (!organizationIdQuery.trim() || !linkUserData.userId || !linkUserData.profileId) {
      setSnackbar({ open: true, message: 'Informe OrganizationId, UserId e ProfileId.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await organizationService.addUserToOrganization(organizationIdQuery.trim(), linkUserData);
      setSnackbar({ open: true, message: 'Usuario vinculado com sucesso.', severity: 'success' });
      setLinkUserData({ userId: '', profileId: 0, owner: false });
      setActiveStepLink(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao vincular usuario.';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Organizacoes
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="OrganizationId (consulta/edicao)"
              value={organizationIdQuery}
              onChange={(e) => setOrganizationIdQuery(e.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={handleLookup} disabled={lookupLoading}>
              {lookupLoading ? <CircularProgress size={20} /> : 'Carregar organizacao'}
            </Button>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {loadedOrganization ? 'Editar organizacao' : 'Nova organizacao'}
          </Typography>
          {typesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typesError}
            </Alert>
          ) : null}
          <Stepper activeStep={activeStepOrg} sx={{ mb: 3 }}>
            {orgSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStepOrg === 0 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Nome"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                fullWidth
              />
              <TextField
                label="Razao Social"
                value={formData.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
                fullWidth
              />
              <TextField
                label="Documento (CNPJ)"
                value={formData.doc}
                onChange={(e) => handleChange('doc', e.target.value)}
                fullWidth
              />
              <TextField
                label="Tipo de Organizacao"
                select
                value={formData.orgType ?? ''}
                onChange={(e) => handleChange('orgType', e.target.value)}
                fullWidth
              >
                {typesLoading ? (
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
          ) : null}

          {activeStepOrg === 1 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
              />
              <TextField
                label="Telefone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
              />
              <TextField
                label="Cidade"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                fullWidth
              />
              <TextField
                label="Estado"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                fullWidth
              />
            </Box>
          ) : null}

          {activeStepOrg === 2 ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="subtitle2">Nome: {formData.name || '-'}</Typography>
              <Typography variant="subtitle2">Razao Social: {formData.legalName || '-'}</Typography>
              <Typography variant="subtitle2">Documento: {formData.doc || '-'}</Typography>
              <Typography variant="subtitle2">Tipo: {String(formData.orgType || '-')}</Typography>
              <Typography variant="subtitle2">Email: {formData.email || '-'}</Typography>
              <Typography variant="subtitle2">Telefone: {formData.phone || '-'}</Typography>
              <Typography variant="subtitle2">Cidade: {formData.city || '-'}</Typography>
              <Typography variant="subtitle2">Estado: {formData.state || '-'}</Typography>
            </Box>
          ) : null}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              disabled={activeStepOrg === 0 || loading}
              onClick={() => setActiveStepOrg((prev) => prev - 1)}
            >
              Voltar
            </Button>
            {activeStepOrg === orgSteps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : loadedOrganization ? 'Atualizar' : 'Criar'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStepOrg((prev) => prev + 1)}>
                Proximo
              </Button>
            )}
            {loadedOrganization ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setLoadedOrganization(null);
                  setFormData(initialForm);
                  setActiveStepOrg(0);
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Vincular usuario a organizacao
          </Typography>
          <Stepper activeStep={activeStepLink} sx={{ mb: 3 }}>
            {linkSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStepLink === 0 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="OrganizationId"
                value={organizationIdQuery}
                onChange={(e) => setOrganizationIdQuery(e.target.value)}
                fullWidth
              />
              <TextField
                label="UserId"
                value={linkUserData.userId}
                onChange={(e) => setLinkUserData((prev) => ({ ...prev, userId: e.target.value }))}
                fullWidth
              />
              <TextField
                label="ProfileId"
                type="number"
                value={linkUserData.profileId}
                onChange={(e) =>
                  setLinkUserData((prev) => ({ ...prev, profileId: Number(e.target.value) }))
                }
                fullWidth
              />
              <TextField
                label="Owner"
                select
                value={linkUserData.owner ? 'true' : 'false'}
                onChange={(e) => setLinkUserData((prev) => ({ ...prev, owner: e.target.value === 'true' }))}
                fullWidth
              >
                <MenuItem value="false">Nao</MenuItem>
                <MenuItem value="true">Sim</MenuItem>
              </TextField>
            </Box>
          ) : null}

          {activeStepLink === 1 ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="subtitle2">OrganizationId: {organizationIdQuery || '-'}</Typography>
              <Typography variant="subtitle2">UserId: {linkUserData.userId || '-'}</Typography>
              <Typography variant="subtitle2">ProfileId: {linkUserData.profileId || 0}</Typography>
              <Typography variant="subtitle2">Owner: {linkUserData.owner ? 'Sim' : 'Nao'}</Typography>
            </Box>
          ) : null}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              disabled={activeStepLink === 0 || loading}
              onClick={() => setActiveStepLink((prev) => prev - 1)}
            >
              Voltar
            </Button>
            {activeStepLink === linkSteps.length - 1 ? (
              <Button variant="contained" onClick={handleLinkUser} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Vincular usuario'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStepLink((prev) => prev + 1)}>
                Proximo
              </Button>
            )}
          </Box>
        </Paper>
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

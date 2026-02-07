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
  IconButton,
} from '@mui/material';
import { ArrowBack, SettingsOutlined } from '@mui/icons-material';
import {
  unitService,
  type CondominiumUnit,
  type CondominiumUnitRequest,
  type UnitTypeEnum,
} from '../../services/unitService';
import { blockService, type CondominiumBlock } from '../../services/blockService';
import { condominiumService, type Condominium } from '../../services/condominiumService';
import { organizationService } from '../../services/organizationService';
import CardList from '../../shared/components/CardList';
import StepWizardCard from '../../shared/components/StepWizardCard';
import './Unidades.scss'
const initialForm: CondominiumUnitRequest = {
  condominiumId: '',
  condominiumBlockId: '',
  unitCode: '',
  unitType: 'Owner',
};

const Unidades: React.FC = () => {
  const [activeView, setActiveView] = useState<'condominios' | 'unidades'>('condominios');
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 4;

  const [formData, setFormData] = useState<CondominiumUnitRequest>(initialForm);
  const [condominiumIdQuery, setCondominiumIdQuery] = useState('');
  const [selectedCondominium, setSelectedCondominium] = useState<Condominium | null>(null);
  const [units, setUnits] = useState<CondominiumUnit[]>([]);
  const [blocks, setBlocks] = useState<{
    data: CondominiumBlock[];
    success: boolean;
  }>({ data: [], success: false });
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [unitTypes, setUnitTypes] = useState<UnitTypeEnum[]>([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [unitSearchText, setUnitSearchText] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const steps = ['Dados da unidade'];

  const handleChange = (field: keyof CondominiumUnitRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadCondominiums = async (pageNumber = 1) => {
    setListLoading(true);
    setListError(null);
    try {
      let organizationId = localStorage.getItem('organizationId') || '';
      if (!organizationId) {
        organizationId = (await organizationService.getMyOrganizationId()) || '';
        localStorage.setItem('organizationId', organizationId);
      }

      const response = await condominiumService.getCondominiums(
        organizationId,
        pageNumber,
        pageSize
      );
      if (!organizationName) {
        try {
          const organizations = await organizationService.getMyOrganization();
          const orgName = organizations?.[0]?.name || organizations?.[0]?.legalName;
          if (orgName) setOrganizationName(orgName);
        } catch {
          // ignore organization name errors
        }
      }
      const normalized = response?.data ?? [];
      const computedTotalPages =
        response?.totalPages ??
        Math.max(1, Math.ceil((response?.total ?? normalized.length) / pageSize));
      setListPage(response?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
      setCondominiums(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar condominios.';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadUnits = async (blockIdOverride?: string, pageNumber = 1) => {
    console.log('Loading units for condominiumId:', condominiumIdQuery, );
    if (!condominiumIdQuery.trim()) {
      setListError('Informe o CondominiumId para carregar as unidades.');
      return;
    }

    const blockId = blockIdOverride !== undefined ? blockIdOverride : selectedBlockId;
    setListLoading(true);
    setListError(null);
    try {
      const data = blockId
        ? await unitService.getUnitsByBlock(blockId, pageNumber, pageSize)
        : await unitService.getUnitsByCondominium(condominiumIdQuery.trim(), pageNumber, pageSize);
    console.log('Loaded units data:', data);
      const normalized = data?.data ?? [];
      const computedTotalPages =
        data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? normalized.length) / pageSize));
      setListPage(data?.pageNumber ?? pageNumber);
      setTotalPages(computedTotalPages);
      setUnits(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar unidades.';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const loadBlocks = async (condominiumId: string) => {
    try {
      const data = await blockService.getBlocks(condominiumId);
      console.log('Loaded blocks:', data);
      if(data.success)
      setBlocks(data);
      else
      setBlocks({ data: [], success: false });
    } catch (error) {
      console.error('Erro ao carregar blocos:', error);
      setBlocks({ data: [], success: false });
    }
  };

  const loadUnitTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const data = await unitService.getUnitTypes();
      setUnitTypes(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar tipos de unidade.';
      setTypesError(message);
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    loadCondominiums(1);
    loadUnitTypes();
  }, [ ]);

  const handleSelectCondominium = async (condominium: Condominium) => {
    console.log('Selected condominium:', condominium);
    setSelectedCondominium(condominium);
    setCondominiumIdQuery(condominium.condominiumId);
    setUnits([]);
    setBlocks({ data: [], success: false });
    setSelectedBlockId('');
    setEditingId(null);
    setActiveStep(0);
    setIsCadastroOpen(false);
    setUnitSearchText('');
    setListPage(1);
    setFormData((prev) => ({ ...prev, condominiumId: condominium.condominiumId }));
    setActiveView('unidades');
   
  };

   useEffect(() => {
    console.log('condominiumIdQuery changed:', condominiumIdQuery);
    if (condominiumIdQuery.trim()) {
     loadBlocks(condominiumIdQuery.trim());
     loadUnits('', 1);
    }
  },[setCondominiumIdQuery, condominiumIdQuery])

  const handleEdit = (unit: CondominiumUnit) => {
    console.log('Unidade todo' ,unit);
    setEditingId(unit.condominiumUnitId);
    setFormData({
      condominiumId: unit.condominiumId,
      condominiumBlockId: unit.condominiumBlockId,
      unitCode: unit.unitCode,
      unitType: unit.unitType === '1' ? 'Owner' : 'Tenant',
    });
    console.log('id unidadee', formData);
    setActiveStep(0);
    setIsCadastroOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.condominiumId || !formData.condominiumBlockId || !formData.unitCode) {
      setSnackbar({
        open: true,
        message: 'Preencha CondominiumId, CondominiumBlockId e Codigo da unidade.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await unitService.updateUnit(editingId, formData);
        setSnackbar({
          open: true,
          message: 'Unidade atualizada com sucesso.',
          severity: 'success',
        });
      } else {
        await unitService.createUnit(formData);
        setSnackbar({
          open: true,
          message: 'Unidade criada com sucesso.',
          severity: 'success',
        });
      }

      setFormData(initialForm);
      setEditingId(null);
      setIsCadastroOpen(false);
      if (condominiumIdQuery.trim()) {
        await loadUnits(undefined, listPage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar unidade.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUnitTypeOptions = () => {
    if (typesLoading) {
      return (
        <MenuItem value={formData.unitType} disabled>
          Carregando...
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
        <MenuItem value="Owner">Proprietario</MenuItem>
        <MenuItem value="Tenant">Inquilino</MenuItem>
      </>
    );
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Bloco do condominio"
            select
            value={formData.condominiumBlockId}
            onChange={(e) => handleChange('condominiumBlockId', e.target.value)}
            fullWidth
          >
            {blocks.data.length === 0 ? (
              <MenuItem value="" disabled>
                {listLoading ? 'Carregando...' : 'Nenhum bloco encontrado'}
              </MenuItem>
            ) : (
              blocks.data.map((block) => (
                <MenuItem key={block.condominiumBlockId} value={block.condominiumBlockId}>
                  {block.name || block.code || block.condominiumBlockId}
                </MenuItem>
              ))
            )}
          </TextField>
          <TextField
            label="Codigo da Unidade"
            value={formData.unitCode}
            onChange={(e) => handleChange('unitCode', e.target.value)}
            fullWidth
          />
          <TextField
            label="Tipo da Unidade"
            select
            value={formData.unitType || ''}
            onChange={(e) => handleChange('unitType', e.target.value)}
            fullWidth
          >
            {renderUnitTypeOptions()}
          </TextField>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">CondominiumId: {formData.condominiumId || '-'}</Typography>
        <Typography variant="subtitle2">
          CondominiumBlockId: {formData.condominiumBlockId || '-'}
        </Typography>
        <Typography variant="subtitle2">Codigo: {formData.unitCode || '-'}</Typography>
        <Typography variant="subtitle2">Tipo: {formData.unitType || '-'}</Typography>
      </Box>
    );
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {activeView === 'condominios' ? (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {organizationName || 'Condominios'}
            </Typography>

            {listLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Carregando...</Typography>
              </Box>
            ) : listError ? (
              <Alert severity="error">{listError}</Alert>
            ) : (
              <CardList
                title="Condominios da organizacao"
                showTitle={false}
                searchPlaceholder="Buscar condominio..."
                onSearchChange={setSearchText}
                onAddClick={undefined}
                addButtonPlacement="toolbar"
                emptyImageLabel="Sem imagem"
                page={listPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setListPage(page);
                  loadCondominiums(page);
                }}
                items={condominiums
                  .filter((condominium) =>
                    [condominium.name, condominium.city, condominium.state]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase()
                      .includes(searchText.toLowerCase())
                  )
                  .map((condominium, index) => ({
                    id: condominium.condominiumId,
                    title: condominium.name,
                    subtitle: (
                      <Typography variant="body2" color="text.secondary">
                        {condominium.city} - {condominium.state}
                      </Typography>
                    ),
                    accentColor: index % 2 === 0 ? '#eef6ee' : '#fdecef',
                    actions: (
                       <Button
                        size="small"
                        variant="outlined"
                        className="action-button-manage"
                        startIcon={<SettingsOutlined />}
                        onClick={() => handleSelectCondominium(condominium)}>
                        Gerenciar Unidade
                      </Button>
                    ),
                  }))}
              />
            )}
          </Paper>
        ) : (
          <>
            {isCadastroOpen ? null : (
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <IconButton
                    onClick={() => {
                      setActiveView('condominios');
                      setSelectedCondominium(null);
                      setUnits([]);
                      setBlocks({ data: [], success: false });
                      setEditingId(null);
                      setActiveStep(0);
                      setIsCadastroOpen(false);
                      setFormData(initialForm);
                      setUnitSearchText('');
                      setListError(null);
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h5">Unidades</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCondominium?.name || 'Condominio selecionado'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setEditingId(null);
                      setActiveStep(0);
                      setFormData((prev) => ({
                        ...prev,
                        condominiumId: selectedCondominium?.condominiumId || condominiumIdQuery,
                        condominiumBlockId: selectedBlockId || '',
                        unitCode: '',
                        unitType: prev.unitType || 'Owner',
                      }));
                      setIsCadastroOpen(true);
                    }}
                  >
                    Nova unidade
                  </Button>
                </Box>

                {listLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Carregando...</Typography>
                  </Box>
                ) : listError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {listError}
                  </Alert>
                ) : null}

                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Filtrar por bloco"
                    select
                    value={selectedBlockId}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setSelectedBlockId(value);
                      setUnitSearchText('');
                      setListPage(1);
                      await loadUnits(value, 1);
                    }}
                    fullWidth
                  >
                    <MenuItem value="">Todos os blocos</MenuItem>
                    {blocks.data.map((block) => (
                      <MenuItem key={block.condominiumBlockId} value={block.condominiumBlockId}>
                        {block.name || block.code || block.condominiumBlockId}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <CardList
                  title="Unidades do condominio"
                  showTitle={false}
                  showFilters={false}
                  searchPlaceholder="Buscar unidade..."
                  onSearchChange={setUnitSearchText}
                  onAddClick={undefined}
                  addButtonPlacement="toolbar"
                  emptyImageLabel="Sem imagem"
                  page={listPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setListPage(page);
                    loadUnits(selectedBlockId || undefined, page);
                  }}
                  items={units
                    .filter((unit) =>
                      [unit.unitCode, unit.unitType, unit.condominiumBlockId]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                        .includes(unitSearchText.toLowerCase())
                    )
                    .map((unit, index) => ({
                      id: unit.condominiumUnitId,
                      title: unit.unitCode || 'Sem codigo',
                      subtitle: (
                        <Typography variant="body2" color="text.secondary">
                          Tipo: {unit.unitType?.toString() === '1' ? 'Proprietario' : 'Inquilino'}
                        </Typography>
                      ),
                      meta: (
                        <Typography variant="caption" color="text.secondary">
                          Bloco: {blocks.data.find((b) => b.condominiumBlockId === unit.condominiumBlockId)?.name ||
                            unit.condominiumBlockId ||
                            'Bloco desconhecido'}
                        </Typography>
                      ),
                      actions: (
                        <Button size="small" variant="outlined" onClick={() => handleEdit(unit)}>
                          Editar
                        </Button>
                      ),
                      accentColor: index % 2 === 0 ? '#eef6ee' : '#fdecef',
                    }))}
                />
              </Paper>
            )}

            {isCadastroOpen ? (
              <StepWizardCard
                title={editingId ? 'Editar unidade' : 'Criar unidade'}
                subtitle={steps[activeStep]}
                steps={steps}
                activeStep={activeStep}
                showBack={activeStep > 0 && activeStep < steps.length - 1}
                onBack={() => setActiveStep((prev) => prev - 1)}
                onClose={() => {
                  setIsCadastroOpen(false);
                  setEditingId(null);
                  setActiveStep(0);
                  setFormData(initialForm);
                }}
              >
                {typesError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {typesError}
                  </Alert>
                ) : null}
                {renderStepContent()}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                  {activeStep === steps.length - 1 ? (
                    <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                  }}>

                    <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                      {loading ? <CircularProgress size={20} /> : editingId ? 'Atualizar' : 'Criar'}
                    </Button>
                    </Box>
                  ) : (
                    <Button variant="contained" onClick={() => setActiveStep((prev) => prev + 1)}>
                      Proximo
                    </Button>
                  )}
                 
                </Box>
              </StepWizardCard>
            ) : null}
          </>
        )}
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

export default Unidades;

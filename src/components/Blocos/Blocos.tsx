import React, { useState } from 'react';
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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { blockService, type CondominiumBlock, type CondominiumBlockRequest } from '../../services/blockService';
import StepWizardCard from '../../shared/components/StepWizardCard';

const initialForm: CondominiumBlockRequest = {
  condominiumId: '',
  code: '',
  name: '',
};

const Blocos: React.FC = () => {
  const [formData, setFormData] = useState<CondominiumBlockRequest>(initialForm);
  const [condominiumIdQuery, setCondominiumIdQuery] = useState('');
  const [blocks, setBlocks] = useState<CondominiumBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const steps = ['Dados do bloco', 'Revisao'];

  const handleChange = (field: keyof CondominiumBlockRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadBlocks = async () => {
    if (!condominiumIdQuery.trim()) {
      setListError('Informe o CondominiumId para carregar os blocos.');
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const data = await blockService.getBlocks(condominiumIdQuery.trim());
      setBlocks(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar blocos.';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  const handleEdit = (block: CondominiumBlock) => {
    setEditingId(block.condominiumBlockId);
    setFormData({
      condominiumId: block.condominiumId,
      code: block.code,
      name: block.name,
    });
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    if (!formData.condominiumId || !formData.code || !formData.name) {
      setSnackbar({
        open: true,
        message: 'Preencha CondominiumId, Codigo e Nome.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await blockService.updateBlock(editingId, formData);
        setSnackbar({
          open: true,
          message: 'Bloco atualizado com sucesso.',
          severity: 'success',
        });
      } else {
        await blockService.createBlock(formData);
        setSnackbar({
          open: true,
          message: 'Bloco criado com sucesso.',
          severity: 'success',
        });
      }

      setFormData(initialForm);
      setEditingId(null);
      if (condominiumIdQuery.trim()) {
        await loadBlocks();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar bloco.';
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="CondominiumId"
            value={formData.condominiumId}
            onChange={(e) => handleChange('condominiumId', e.target.value)}
            fullWidth
          />
          <TextField
            label="Codigo"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            fullWidth
          />
          <TextField
            label="Nome"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
          />
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle2">CondominiumId: {formData.condominiumId || '-'}</Typography>
        <Typography variant="subtitle2">Codigo: {formData.code || '-'}</Typography>
        <Typography variant="subtitle2">Nome: {formData.name || '-'}</Typography>
      </Box>
    );
  };

  return (
    <Box className="page-container" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Blocos
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="CondominiumId (consulta)"
              value={condominiumIdQuery}
              onChange={(e) => setCondominiumIdQuery(e.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={loadBlocks} disabled={listLoading}>
              {listLoading ? <CircularProgress size={20} /> : 'Carregar blocos'}
            </Button>
          </Box>

          {listError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {listError}
            </Alert>
          ) : null}

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Codigo</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>CondominiumId</TableCell>
                <TableCell>Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum bloco carregado.</TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.condominiumBlockId}>
                    <TableCell>{block.condominiumBlockId}</TableCell>
                    <TableCell>{block.code}</TableCell>
                    <TableCell>{block.name}</TableCell>
                    <TableCell>{block.condominiumId}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => handleEdit(block)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        <StepWizardCard
          title="Criar bloco"
          subtitle={steps[activeStep]}
          steps={steps}
          activeStep={activeStep}
          showBack={activeStep > 0 && activeStep < steps.length - 1}
          onBack={() => setActiveStep((prev) => prev - 1)}
        >
          {renderStepContent()}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : editingId ? 'Atualizar' : 'Criar'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep((prev) => prev + 1)}>
                Proximo
              </Button>
            )}
            {editingId ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingId(null);
                  setFormData(initialForm);
                  setActiveStep(0);
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </Box>
        </StepWizardCard>
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

export default Blocos;

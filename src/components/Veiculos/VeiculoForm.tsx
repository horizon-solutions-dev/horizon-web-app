import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import './Veiculos.scss';
import { type Veiculo } from '../../services/veiculoService';

interface VeiculoFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (veiculo: Omit<Veiculo, 'id'>) => void;
  veiculo: Veiculo | null;
}

const VeiculoForm: React.FC<VeiculoFormProps> = ({ open, onClose, onSave, veiculo }) => {
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    marca: '',
    cor: '',
    moradorId: '',
    moradorNome: '',
    ano: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (veiculo) {
      setFormData({
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        marca: veiculo.marca,
        cor: veiculo.cor,
        moradorId: veiculo.moradorId,
        moradorNome: veiculo.moradorNome || '',
        ano: veiculo.ano || ''
      });
    } else {
      setFormData({
        placa: '',
        modelo: '',
        marca: '',
        cor: '',
        moradorId: '',
        moradorNome: '',
        ano: ''
      });
    }
    setErrors({});
  }, [veiculo, open]);

  const handleChange = (field: string, value: unknown): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.placa.trim()) newErrors.placa = 'Placa é obrigatória';
    if (!formData.modelo.trim()) newErrors.modelo = 'Modelo é obrigatório';
    if (!formData.marca.trim()) newErrors.marca = 'Marca é obrigatória';
    if (!formData.cor.trim()) newErrors.cor = 'Cor é obrigatória';
    if (!formData.moradorNome.trim()) newErrors.moradorNome = 'Morador é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth className="veiculo-form-dialog">
      <DialogTitle className="form-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {veiculo ? 'Editar Veículo' : 'Novo Veículo'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="form-content">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Morador Responsável"
              value={formData.moradorNome}
              onChange={(e) => handleChange('moradorNome', e.target.value)}
              error={!!errors.moradorNome}
              helperText={errors.moradorNome}
              placeholder="Digite o nome do morador"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Placa"
              value={formData.placa}
              onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
              error={!!errors.placa}
              helperText={errors.placa}
              placeholder="Ex: ABC-1234"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Marca"
              value={formData.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              error={!!errors.marca}
              helperText={errors.marca}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Modelo"
              value={formData.modelo}
              onChange={(e) => handleChange('modelo', e.target.value)}
              error={!!errors.modelo}
              helperText={errors.modelo}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cor"
              value={formData.cor}
              onChange={(e) => handleChange('cor', e.target.value)}
              error={!!errors.cor}
              helperText={errors.cor}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ano"
              type="number"
              value={formData.ano}
              onChange={(e) => handleChange('ano', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="form-actions">
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" className="save-button">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VeiculoForm;


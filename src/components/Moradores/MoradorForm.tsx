import React, { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  IconButton,
  Avatar
} from '@mui/material';
import { Close, CloudUpload } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import './Moradores.scss';
import type { Morador } from '../../services/mockData';

interface MoradorFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (morador: Omit<Morador, 'id'>) => void;
  morador: Morador | null;
}

const MoradorForm: React.FC<MoradorFormProps> = ({ open, onClose, onSave, morador }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    unidade: '',
    telefone: '',
    email: '',
    foto: null as string | null,
    status: 'ativo' as 'ativo' | 'inativo'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (morador) {
      setFormData({
        nome: morador.nome,
        cpf: morador.cpf,
        unidade: morador.unidade,
        telefone: morador.telefone,
        email: morador.email,
        foto: morador.foto,
        status: morador.status
      });
    } else {
      setFormData({
        nome: '',
        cpf: '',
        unidade: '',
        telefone: '',
        email: '',
        foto: null,
        status: 'ativo'
      });
    }
    setErrors({});
  }, [morador, open]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });

  const handleChange = (field: string, value: unknown): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.unidade.trim()) newErrors.unidade = 'Unidade é obrigatória';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="morador-form-dialog">
      <DialogTitle className="form-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {morador ? 'Editar Morador' : 'Novo Morador'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="form-content">
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" flexDirection="column" alignItems="center">
            <Box {...getRootProps()} className="avatar-upload">
              <input {...getInputProps()} />
              <Avatar
                src={formData.foto || undefined}
                sx={{ width: 100, height: 100, cursor: 'pointer' }}
              >
                {formData.nome ? formData.nome.charAt(0) : <CloudUpload />}
              </Avatar>
              <Typography variant="caption" sx={{ mt: 1, color: '#666' }}>
                Clique para alterar a foto
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              error={!!errors.nome}
              helperText={errors.nome}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CPF"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              error={!!errors.cpf}
              helperText={errors.cpf}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Unidade (Bloco/Apto)"
              value={formData.unidade}
              onChange={(e) => handleChange('unidade', e.target.value)}
              error={!!errors.unidade}
              helperText={errors.unidade}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Status"
              select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="ativo">Ativo</MenuItem>
              <MenuItem value="inativo">Inativo</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
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

export default MoradorForm;

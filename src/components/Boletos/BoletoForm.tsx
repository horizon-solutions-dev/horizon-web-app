import React, { useState, useCallback, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  Close,
  CloudUpload,
  Delete,
} from '@mui/icons-material';
import './Boletos.scss';

interface Boleto {
  id: number;
  numero: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pago' | 'pendente' | 'vencido';
  imagem: string | null;
  dataEmissao: string;
  beneficiario: string;
  pagador: string;
}

interface BoletoFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (boleto: Omit<Boleto, 'id'>) => void;
  boleto: Boleto | null;
}

const BoletoForm: React.FC<BoletoFormProps> = ({ open, onClose, onSave, boleto }) => {
  const [formData, setFormData] = useState({
    numero: '',
    descricao: '',
    valor: '',
    vencimento: '',
    status: 'pendente' as 'pago' | 'pendente' | 'vencido',
    imagem: null as string | null,
    dataEmissao: new Date().toISOString().split('T')[0],
    beneficiario: '',
    pagador: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (boleto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        numero: boleto.numero,
        descricao: boleto.descricao,
        valor: boleto.valor.toString(),
        vencimento: boleto.vencimento,
        status: boleto.status,
        imagem: boleto.imagem,
        dataEmissao: boleto.dataEmissao,
        beneficiario: boleto.beneficiario,
        pagador: boleto.pagador
      });
    } else {
      setFormData({
        numero: '',
        descricao: '',
        valor: '',
        vencimento: '',
        status: 'pendente',
        imagem: null,
        dataEmissao: new Date().toISOString().split('T')[0],
        beneficiario: '',
        pagador: ''
      });
    }
    setErrors({});
  }, [boleto, open]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, imagem: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagem: null }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero.trim()) {
      newErrors.numero = 'Número do boleto é obrigatório';
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }
    if (!formData.vencimento) {
      newErrors.vencimento = 'Data de vencimento é obrigatória';
    }
    if (!formData.beneficiario.trim()) {
      newErrors.beneficiario = 'Beneficiário é obrigatório';
    }
    if (!formData.pagador.trim()) {
      newErrors.pagador = 'Pagador é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave({
        numero: formData.numero,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        vencimento: formData.vencimento,
        status: formData.status,
        imagem: formData.imagem,
        dataEmissao: formData.dataEmissao,
        beneficiario: formData.beneficiario,
        pagador: formData.pagador
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      className="boleto-form-dialog"
    >
      <DialogTitle className="form-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {boleto ? 'Editar Boleto' : 'Novo Boleto'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="form-content">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" className="section-title">
              Informações do Boleto
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Número do Boleto"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              error={!!errors.numero}
              helperText={errors.numero}
              placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              error={!!errors.descricao}
              helperText={errors.descricao}
              placeholder="Ex: Condomínio - Janeiro/2026"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Valor"
              type="number"
              value={formData.valor}
              onChange={(e) => handleChange('valor', e.target.value)}
              error={!!errors.valor}
              helperText={errors.valor}
              InputProps={{
                startAdornment: <Typography>R$</Typography>
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Vencimento"
              type="date"
              value={formData.vencimento}
              onChange={(e) => handleChange('vencimento', e.target.value)}
              error={!!errors.vencimento}
              helperText={errors.vencimento}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="pago">Pago</MenuItem>
              <MenuItem value="vencido">Vencido</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Beneficiário"
              value={formData.beneficiario}
              onChange={(e) => handleChange('beneficiario', e.target.value)}
              error={!!errors.beneficiario}
              helperText={errors.beneficiario}
              placeholder="Nome do beneficiário"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pagador"
              value={formData.pagador}
              onChange={(e) => handleChange('pagador', e.target.value)}
              error={!!errors.pagador}
              helperText={errors.pagador}
              placeholder="Nome do pagador"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Data de Emissão"
              type="date"
              value={formData.dataEmissao}
              onChange={(e) => handleChange('dataEmissao', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" className="section-title">
              Imagem do Boleto
            </Typography>
          </Grid>

          <Grid item xs={12}>
            {formData.imagem ? (
              <Paper className="image-preview-container">
                <Box className="image-preview">
                  <img src={formData.imagem} alt="Preview do boleto" />
                </Box>
                <Box className="image-actions">
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleRemoveImage}
                  >
                    Remover Imagem
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Paper
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''}`}
              >
                <input {...getInputProps()} />
                <CloudUpload className="dropzone-icon" />
                <Typography variant="h6" className="dropzone-title">
                  {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                </Typography>
                <Typography variant="body2" className="dropzone-text">
                  Formatos aceitos: PNG, JPG, JPEG, GIF
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="form-actions">
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" className="save-button">
          {boleto ? 'Atualizar' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoletoForm;

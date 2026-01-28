import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Chip,
  Paper
} from '@mui/material';
import {
  Close,
  Download,
  Print,
  AttachMoney,
  CalendarToday,
  Description,
  Person,
  Business,
  Image as ImageIcon
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

interface BoletoViewerProps {
  open: boolean;
  onClose: () => void;
  boleto: Boleto | null;
  onDownload: (boleto: Boleto) => void;
}

const BoletoViewer: React.FC<BoletoViewerProps> = ({ open, onClose, boleto, onDownload }) => {
  if (!boleto) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'success';
      case 'pendente': return 'warning';
      case 'vencido': return 'error';
      default: return 'default';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      className="boleto-viewer-dialog"
    >
      <DialogTitle className="viewer-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Description />
            <Typography variant="h6">Detalhes do Boleto</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip
              label={boleto.status.toUpperCase()}
              color={getStatusColor(boleto.status) as any}
              className="status-chip-large"
            />
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="viewer-content">
        {boleto.imagem && (
          <Paper elevation={2} className="boleto-image-container">
            <img src={boleto.imagem} alt={`Boleto ${boleto.numero}`} className="boleto-image-full" />
          </Paper>
        )}

        {!boleto.imagem && (
          <Paper elevation={0} className="no-image-placeholder">
            <ImageIcon className="no-image-icon-large" />
            <Typography variant="h6" color="textSecondary">
              Sem imagem do boleto
            </Typography>
          </Paper>
        )}

        <Box mt={3}>
          <Typography variant="h6" className="section-header">
            Informações do Boleto
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box className="info-item">
                <Typography variant="caption" className="info-label">
                  Número do Boleto
                </Typography>
                <Typography variant="body1" className="info-value code">
                  {boleto.numero}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box className="info-item">
                <Typography variant="caption" className="info-label">
                  Descrição
                </Typography>
                <Typography variant="body1" className="info-value">
                  {boleto.descricao}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="info-item">
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachMoney className="info-icon-colored" />
                  <Typography variant="caption" className="info-label">
                    Valor
                  </Typography>
                </Box>
                <Typography variant="h6" className="info-value highlight">
                  R$ {boleto.valor.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="info-item">
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarToday className="info-icon-colored" />
                  <Typography variant="caption" className="info-label">
                    Vencimento
                  </Typography>
                </Box>
                <Typography variant="h6" className="info-value">
                  {new Date(boleto.vencimento).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="info-item">
                <Box display="flex" alignItems="center" gap={1}>
                  <Business className="info-icon-colored" />
                  <Typography variant="caption" className="info-label">
                    Beneficiário
                  </Typography>
                </Box>
                <Typography variant="body1" className="info-value">
                  {boleto.beneficiario}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="info-item">
                <Box display="flex" alignItems="center" gap={1}>
                  <Person className="info-icon-colored" />
                  <Typography variant="caption" className="info-label">
                    Pagador
                  </Typography>
                </Box>
                <Typography variant="body1" className="info-value">
                  {boleto.pagador}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box className="info-item">
                <Typography variant="caption" className="info-label">
                  Data de Emissão
                </Typography>
                <Typography variant="body1" className="info-value">
                  {new Date(boleto.dataEmissao).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions className="viewer-actions">
        <Button 
          onClick={handlePrint} 
          variant="outlined" 
          startIcon={<Print />}
        >
          Imprimir
        </Button>
        <Button 
          onClick={() => onDownload(boleto)} 
          variant="contained" 
          startIcon={<Download />}
          disabled={!boleto.imagem}
          className="download-button"
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoletoViewer;

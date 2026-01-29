import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardMedia,
} from '@mui/material';
import {
  Visibility,
  Download,
  MoreVert,
  Description,
  AttachMoney,
  CalendarToday,
} from '@mui/icons-material';

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

interface BoletoCardProps {
  boleto: Boleto;
  onViewer: (boleto: Boleto) => void;
  onDownload: (boleto: Boleto) => void;
  onMenu: (event: React.MouseEvent<HTMLElement>, boleto: Boleto) => void;
  getStatusColor: (status: string) => 'success' | 'warning' | 'error' | 'default';
}

export const BoletoCard: React.FC<BoletoCardProps> = ({
  boleto,
  onViewer,
  onDownload,
  onMenu,
  getStatusColor,
}) => {
  return (
    <Card className="boleto-card">
      <CardMedia
        component="div"
        className="boleto-image"
        onClick={() => onViewer(boleto)}
      >
        {boleto.imagem ? (
          <img src={boleto.imagem} alt={`Boleto ${boleto.numero}`} />
        ) : (
          <Box className="no-image">
            <Description className="no-image-icon" />
            <Typography variant="caption">Sem imagem</Typography>
          </Box>
        )}
      </CardMedia>

      <CardContent className="boleto-content">
        <Box className="boleto-status-row">
          <Chip
            label={boleto.status.toUpperCase()}
            color={getStatusColor(boleto.status)}
            size="small"
            className="status-chip"
          />
          <IconButton
            size="small"
            onClick={(e) => onMenu(e, boleto)}
          >
            <MoreVert />
          </IconButton>
        </Box>

        <Typography variant="h6" className="boleto-title">
          {boleto.descricao}
        </Typography>

        <Box className="boleto-info">
          <Box className="info-row">
            <AttachMoney className="info-icon" />
            <Typography variant="body2">
              R$ {boleto.valor.toFixed(2)}
            </Typography>
          </Box>
          <Box className="info-row">
            <CalendarToday className="info-icon" />
            <Typography variant="body2">
              {new Date(boleto.vencimento).toLocaleDateString('pt-BR')}
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" className="boleto-numero">
          {boleto.numero}
        </Typography>
      </CardContent>

      <CardActions className="boleto-actions">
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onViewer(boleto)}
        >
          Visualizar
        </Button>
        <Button
          size="small"
          startIcon={<Download />}
          onClick={() => onDownload(boleto)}
          disabled={!boleto.imagem}
        >
          Download
        </Button>
      </CardActions>
    </Card>
  );
};

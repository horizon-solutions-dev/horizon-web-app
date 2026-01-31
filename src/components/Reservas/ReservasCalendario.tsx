import { Box, Container, Paper, Typography } from '@mui/material';
import BookingCalendar from '../Calendar/Calendar';

export default function ReservasCalendario() {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Reservas - Calendario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visao de calendario das reservas.
          </Typography>
        </Paper>

        <BookingCalendar />
      </Container>
    </Box>
  );
}

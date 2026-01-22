import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  IconButton,
  Paper
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  AccessTime,
  Person
} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
  getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Calendar.scss';

const BookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookings, setBookings] = useState([
    { date: new Date(2026, 0, 5), time: '10:00' },
    { date: new Date(2026, 0, 5), time: '14:00' },
    { date: new Date(2026, 0, 10), time: '15:00' },
  ]);

  const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const startDay = getDay(monthStart);
    const emptyDays = Array(startDay).fill(null);
    
    return [...emptyDays, ...days];
  };

  const isDateBooked = (date) => {
    return bookings.some(booking => isSameDay(booking.date, date));
  };

  const isTimeBooked = (date, time) => {
    return bookings.some(booking => 
      isSameDay(booking.date, date) && booking.time === time
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date) => {
    if (!isBefore(date, startOfDay(new Date()))) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      setBookings([...bookings, { date: selectedDate, time: selectedTime }]);
      setSelectedTime(null);
      alert('Reserva confirmada!');
    }
  };

  const renderCalendarDays = () => {
    const days = getCalendarDays();
    
    return days.map((date, index) => {
      if (!date) {
        return <div key={`empty-${index}`} className="calendar-day empty"></div>;
      }

      const isPast = isBefore(date, startOfDay(new Date()));
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const hasBooking = isDateBooked(date);
      
      return (
        <button
          key={date.toISOString()}
          onClick={() => handleDateClick(date)}
          disabled={isPast}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${hasBooking ? 'has-booking' : ''} ${isPast ? 'past' : ''}`}
        >
          {format(date, 'd')}
          {hasBooking && !isSelected && <div className="booking-indicator"></div>}
        </button>
      );
    });
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Container maxWidth="lg" className="booking-container">
      <Paper elevation={3} className="booking-card">
        <Box className="booking-header">
          <CalendarToday className="header-icon" />
          <Typography variant="h4" className="header-title">
            Sistema de Reservas
          </Typography>
          <Typography variant="subtitle1" className="header-subtitle">
            Selecione uma data e horário disponível
          </Typography>
        </Box>

        <Grid container spacing={3} className="booking-content">
          <Grid item xs={12} md={6}>
            <Box className="calendar-section">
              <Box className="calendar-header">
                <IconButton onClick={handlePrevMonth} className="nav-button">
                  <ChevronLeft />
                </IconButton>
                <Typography variant="h5" className="month-title">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </Typography>
                <IconButton onClick={handleNextMonth} className="nav-button">
                  <ChevronRight />
                </IconButton>
              </Box>

              <Box className="calendar-grid">
                {dayNames.map(day => (
                  <div key={day} className="day-header">
                    {day}
                  </div>
                ))}
                {renderCalendarDays()}
              </Box>

              <Box className="calendar-legend">
                <Box className="legend-item">
                  <Box className="legend-color selected"></Box>
                  <Typography variant="caption">Selecionado</Typography>
                </Box>
                <Box className="legend-item">
                  <Box className="legend-color has-booking"></Box>
                  <Typography variant="caption">Com reservas</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="times-section">
              {selectedDate ? (
                <>
                  <Box className="times-header">
                    <AccessTime className="times-icon" />
                    <Typography variant="h6" className="times-title">
                      Horários Disponíveis
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" className="selected-date">
                    {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Typography>

                  <Grid container spacing={1} className="times-grid">
                    {availableTimes.map(time => {
                      const booked = isTimeBooked(selectedDate, time);
                      const selected = selectedTime === time;
                      
                      return (
                        <Grid item xs={6} key={time}>
                          <Button
                            fullWidth
                            onClick={() => !booked && setSelectedTime(time)}
                            disabled={booked}
                            className={`time-slot ${selected ? 'selected' : ''} ${booked ? 'booked' : ''}`}
                            variant="outlined"
                          >
                            {time}
                            {booked && <span className="booked-label">Reservado</span>}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {selectedTime && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleBooking}
                      className="confirm-button"
                    >
                      Confirmar Reserva
                    </Button>
                  )}
                </>
              ) : (
                <Box className="empty-state">
                  <Person className="empty-icon" />
                  <Typography variant="body1" className="empty-text">
                    Selecione uma data no calendário para ver os horários disponíveis
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default BookingCalendar;
import BookingCalendar from "../Calendar/Calendar";

export default function ReservasListagem() {
  return (
    <div className="page-container">
      <h1>Listagem de Reservas</h1>
      <p>Listar reservas disponíveis</p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <BookingCalendar />
      </div>
    </div>
  );
}

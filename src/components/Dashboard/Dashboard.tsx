import './Dashboard.scss';

import { AttachMoney, EventAvailable, LocalShipping, People } from '@mui/icons-material';
import { MdAttachMoney, MdEventAvailable, MdLocalShipping, MdPeople, MdWarning } from 'react-icons/md';

export default function Dashboard() {
  const stats = [
    {
      id: 1,
      title: 'Total de Moradores',
      value: '245',
      icon: <People />,
      color: '#4facfe',
      trend: '+12%',
    },
    {
      id: 2,
      title: 'Reservas Ativas',
      value: '18',
      icon: <EventAvailable />,
      color: '#00bcd4',
      trend: '+5%',
    },
    {
      id: 3,
      title: 'Boletos Pendentes',
      value: '32',
      icon: <AttachMoney />,
      color: '#f093fb',
      trend: '-8%',
    },
    {
      id: 4,
      title: 'Encomendas',
      value: '7',
      icon: <LocalShipping />,
      color: '#f5576c',
      trend: '+3',
    },
  ];

  const recentActivities = [
    { id: 1, text: 'Nova reserva do salao de festas', time: 'Ha 2 horas' },
    { id: 2, text: 'Encomenda recebida para Apto 301', time: 'Ha 3 horas' },
    { id: 3, text: 'Novo morador cadastrado', time: 'Ha 5 horas' },
    { id: 4, text: 'Boleto pago - Apto 205', time: 'Ha 1 dia' },
  ];

  const pendingItems = [
    { id: 1, text: 'Aprovar liberacao de acesso - Visitante', priority: 'Alta' },
    { id: 2, text: 'Revisar despesas do mes', priority: 'Media' },
    { id: 3, text: 'Enviar notificacao de assembleia', priority: 'Baixa' },
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-icon" style={{ background: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3 className="stat-title">{stat.title}</h3>
              <div className="stat-value-row">
                <span className="stat-value">{stat.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2 className="card-title">Atividades Recentes</h2>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-text">{activity.text}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="card-title">
            <MdWarning /> Pendências
          </h2>
          <div className="pending-list">
            {pendingItems.map((item) => (
              <div key={item.id} className="pending-item">
                <span className={`priority-badge priority-${item.priority}`}>
                  {item.priority === "high" && "Alta"}
                  {item.priority === "medium" && "Média"}
                  {item.priority === "low" && "Baixa"}
                </span>
                <p className="pending-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="card-title">Ações Rápidas</h2>
        <div className="action-buttons">
          <button className="action-btn">
            <MdEventAvailable />
            <span>Nova Reserva</span>
          </button>
          <button className="action-btn">
            <MdPeople />
            <span>Cadastrar Morador</span>
          </button>
          <button className="action-btn">
            <MdAttachMoney />
            <span>Lançar Despesa</span>
          </button>
          <button className="action-btn">
            <MdLocalShipping />
            <span>Registrar Encomenda</span>
          </button>
        </div>
      </div>
    </div>
  );
}
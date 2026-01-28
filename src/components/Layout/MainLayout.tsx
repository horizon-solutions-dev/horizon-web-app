import { Outlet, useNavigate, useLocation } from "react-router-dom";
import MenuComponent from "../MenuComponent/MenuComponent";
import { MdNotifications, MdAccountCircle, MdLogout, MdMenu } from "react-icons/md";
import { useState } from "react";
import "./MainLayout.scss";
import NotificationsModal, { type Notification } from "../NotificationsModal/NotificationsModal";
import { useAuth } from "../../contexts/useAuth";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Nome do morador - depois pode vir de um contexto/API
  const residentName = "João Silva";
  const residentApartment = "Apto 301";

  // Mapear rotas para títulos
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/condominio': 'Condomínio',
      '/reservas/tipo': 'Tipo de Reserva',
      '/reservas/listagem': 'Listagem de Reservas',
      '/reservas/calendario': 'Calendário de Reservas',
      '/reservas/disponibilidade': 'Disponibilidade',
      '/financeiro/boletos': 'Boletos',
      '/financeiro/balancetes': 'Balancetes',
      '/financeiro/despesas': 'Despesas',
      '/portaria/usuarios': 'Usuários da Portaria',
      '/portaria/liberacao': 'Liberação de Acesso',
      '/portaria/relatorios': 'Relatórios da Portaria',
      '/moradores': 'Moradores',
      '/veiculos': 'Veículos',
      '/fale-conosco': 'Fale Conosco',
      '/encomendas/recebimento': 'Recebimento de Encomendas',
      '/encomendas/notificacao': 'Notificação de Encomendas',
    };
    return titleMap[path] || 'Dashboard';
  };

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "delivery",
      title: "Nova encomenda recebida",
      message: "Uma encomenda foi registrada para o apartamento 301. Por favor, notifique o morador.",
      time: "Há 5 minutos",
      read: false,
    },
    {
      id: "2",
      type: "warning",
      title: "Boleto próximo do vencimento",
      message: "O boleto do condomínio vence em 2 dias. Não se esqueça de realizar o pagamento.",
      time: "Há 2 horas",
      read: false,
    },
    {
      id: "3",
      type: "success",
      title: "Reserva confirmada",
      message: "Sua reserva do salão de festas para o dia 20/01 foi confirmada com sucesso.",
      time: "Há 5 horas",
      read: false,
    },
    {
      id: "4",
      type: "info",
      title: "Manutenção programada",
      message: "Haverá manutenção no elevador social no dia 18/01 das 9h às 12h.",
      time: "Ontem",
      read: true,
    },
    {
      id: "5",
      type: "delivery",
      title: "Encomenda retirada",
      message: "A encomenda do apartamento 205 foi retirada com sucesso.",
      time: "Há 2 dias",
      read: true,
    },
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="main-layout">
      <aside className={`main-layout-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <MenuComponent />
      </aside>

      <div className="main-layout-content">
        <header className="main-layout-header">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MdMenu />
            </button>
            <h1 className="header-title">{getPageTitle()}</h1>
          </div>

          <div className="header-right">
            <button 
              className="header-icon-btn" 
              title="Notificações"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <MdNotifications />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            <div className="header-user">
              <MdAccountCircle className="user-avatar" />
              <div className="user-info">
                <span className="user-name">{residentName}</span>
                <span className="user-role">{residentApartment}</span>
              </div>
            </div>

            <button className="header-icon-btn logout-btn" onClick={handleLogout} title="Sair">
              <MdLogout />
            </button>
          </div>
        </header>

        <main className="main-layout-body">
          <Outlet />
        </main>
      </div>

      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
}
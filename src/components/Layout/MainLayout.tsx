/* eslint-disable @typescript-eslint/no-unused-vars */
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MenuComponent from "../MenuComponent/MenuComponent";
import { MdNotifications, MdAccountCircle, MdLogout, MdMenu } from "react-icons/md";
import { useState } from "react";
import "./MainLayout.scss";
import NotificationsModal, { type Notification } from "../NotificationsModal/NotificationsModal";
import { useAuth } from "../../contexts/useAuth";
import RouteNames from "../../routes/routeNames";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../LanguageSeletor/LanguageSeletor";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Nome do morador - depois pode vir de um contexto/API

  // Mapear rotas para títulos
  /*  const getPageTitle = () => {
     const path = location.pathname;
     const titleMap: { [key: string]: string } = {
       '/dashboard': 'Dashboard',
       '/condominium': 'Condôminio',
       '/reservations/type': 'Tipo de Reserva',
       '/reservations/list': 'Listagem de Reservas',
       '/reservations/calendar': 'Calendário de Reservas',
       '/reservations/availability': 'Disponibilidade',
       '/finance/bills': 'Boletos',
       '/finance/trial-balances': 'Balancetes',
       '/finance/expenses': 'Despesas',
       '/front-desk/users': 'Usuários da Portaria',
       '/front-desk/access-release': 'Liberação de Acesso',
       '/front-desk/reports': 'Relatórios da Portaria',
       '/residents': 'Moradores',
       '/vehicles': 'Veículos',
       '/contact-us': 'Fale Conosco',
       '/packages/receiving': 'Recebimento de Encomendas',
       '/packages/notification': 'Notificação de Encomendas',
     };
     return titleMap[path] || 'Dashboard';
   }; */

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
    navigate("/");
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

  const routeTitles: Record<string, { label: string; parent?: string }> = {
    [RouteNames.Dashboard]: { label: "Dashboard" },
    [RouteNames.Condominio]: { label: "Condominio" },
    [RouteNames.Veiculos]: { label: "Veiculos" },
    [RouteNames.FaleConosco]: { label: "Fale Conosco" },

    [RouteNames.Areas]: { label: "Areas", parent: "Reservas" },
    [RouteNames.ReservasTipo]: { label: "Tipo de Reserva", parent: "Reservas" },
    [RouteNames.ReservasListagem]: { label: "Listagem", parent: "Reservas" },
    [RouteNames.ReservasCalendario]: { label: "Calendario", parent: "Reservas" },
    [RouteNames.ReservasDisponibilidade]: { label: "Disponibilidade", parent: "Reservas" },

    [RouteNames.FinanceiroBoletos]: { label: "Boletos", parent: "Financeiro" },
    [RouteNames.FinanceiroBoletosDownload]: { label: "Download", parent: "Financeiro / Boletos" },
    [RouteNames.FinanceiroBoletosAnexos]: { label: "Anexos", parent: "Financeiro / Boletos" },
    [RouteNames.FinanceiroBalancetes]: { label: "Balancetes", parent: "Financeiro" },
    [RouteNames.FinanceiroBalancetesDownload]: { label: "Download", parent: "Financeiro / Balancetes" },
    [RouteNames.FinanceiroBalancetesRelatorio]: { label: "Relatorio", parent: "Financeiro / Balancetes" },
    [RouteNames.FinanceiroDespesas]: { label: "Despesas", parent: "Financeiro" },
    [RouteNames.FinanceiroDespesasAnexo]: { label: "Anexos", parent: "Financeiro / Despesas" },

    [RouteNames.PortariaUsuarios]: { label: "Usuarios", parent: "Portaria" },
    [RouteNames.PortariaVisitantes]: { label: "Visitantes", parent: "Portaria" },
    [RouteNames.PortariaLiberacao]: { label: "Liberacao", parent: "Portaria" },
    [RouteNames.PortariaRelatorios]: { label: "Relatorios", parent: "Portaria" },

    [RouteNames.EncomendasRecebimento]: { label: "Recebimento", parent: "Encomendas" },
    [RouteNames.EncomendasNotificacao]: { label: "Notificacao", parent: "Encomendas" },
    [RouteNames.ValidacaoAcesso]: { label: "Validacao de Acesso", parent: "Pendentes" },

    [RouteNames.CadastrosBlocos]: { label: "Estrutura do condomínio", },
    [RouteNames.CadastrosUnidades]: { label: "Unidades", },
    [RouteNames.CadastrosResidentes]: { label: "Moradores", },
    [RouteNames.CadastrosOrganizacoes]: { label: "Organizações", },
    [RouteNames.CadastrosPerfis]: { label: "Perfis", },
  };

  const getHeaderTitle = () => {
    const current = routeTitles[location.pathname];
    if (current) {
      return current.parent ? `${current.parent} / ${current.label}` : current.label;
    }

    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    return segments
      .map((segment) => segment.replace(/-/g, " "))
      .map((segment) => segment.replace(/\b\w/g, (char) => char.toUpperCase()))
      .join(" / ");
  };

  return (
    <div className="main-layout">
      <aside className={`main-layout-sidebar ${mobileMenuOpen ? "mobile-open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
        <MenuComponent
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
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
            <h1 className="header-title">{getHeaderTitle()}</h1>
          </div>

          <div className="header-right">
            <LanguageToggle i18n={i18n} />
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
                <span className="user-name">{user?.name}</span>
                {/*                 <span className="user-role">{user?.role || 'Sem cargo'}</span>
 */}              </div>
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

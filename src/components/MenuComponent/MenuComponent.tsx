import { useState, type JSX } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdEventAvailable,
  MdAttachMoney,
  MdSecurity,
  MdPeople,
  MdDirectionsCar,
  MdEmail,
  MdLocalShipping,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import "./MenuComponent.scss";
import RouteNames from "../../routes/routeNames";

interface MenuItem {
  id: string;
  label: string;
  icon: JSX.Element;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <MdDashboard />,
    path: RouteNames.Dashboard,
  },
  {
    id: "reservas",
    label: "Reservas",
    icon: <MdEventAvailable />,
    children: [
      { id: "reservas-tipo", label: "Tipo de Reserva", icon: <></>, path: RouteNames.ReservasTipo },
      { id: "reservas-listagem", label: "Listagem", icon: <></>, path: RouteNames.ReservasListagem },
      { id: "reservas-calendario", label: "Calendário", icon: <></>, path: RouteNames.ReservasCalendario },
      { id: "reservas-disponibilidade", label: "Disponibilidade", icon: <></>, path: RouteNames.ReservasDisponibilidade },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: <MdAttachMoney />,
    children: [
      { id: "financeiro-boletos", label: "Boletos", icon: <></>, path: RouteNames.FinanceiroBoletos },
      { id: "financeiro-balancetes", label: "Balancetes", icon: <></>, path: RouteNames.FinanceiroBalancetes },
      { id: "financeiro-despesas", label: "Despesas", icon: <></>, path: RouteNames.FinanceiroDespesas },
    ],
  },
  {
    id: "portaria",
    label: "Portaria",
    icon: <MdSecurity />,
    children: [
      { id: "portaria-usuarios", label: "Usuários", icon: <></>, path: RouteNames.PortariaUsuarios },
      { id: "portaria-liberacao", label: "Liberação", icon: <></>, path: RouteNames.PortariaLiberacao },
      { id: "portaria-relatorios", label: "Relatórios", icon: <></>, path: RouteNames.PortariaRelatorios },
    ],
  },
  {
    id: "moradores",
    label: "Moradores",
    icon: <MdPeople />,
    path: RouteNames.Moradores,
  },
  {
    id: "veiculos",
    label: "Veículos",
    icon: <MdDirectionsCar />,
    path: RouteNames.Veiculos,
  },
  {
    id: "fale-conosco",
    label: "Fale Conosco",
    icon: <MdEmail />,
    path: RouteNames.FaleConosco,
  },
  {
    id: "encomendas",
    label: "Encomendas",
    icon: <MdLocalShipping />,
    children: [
      { id: "encomendas-recebimento", label: "Recebimento", icon: <></>, path: RouteNames.EncomendasRecebimento },
      { id: "encomendas-notificacao", label: "Notificação", icon: <></>, path: RouteNames.EncomendasNotificacao },
    ],
  },
];

export default function MenuComponent() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && location.pathname === child.path);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const itemIsActive = isActive(item.path);
    const parentActive = isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.id} className="menu-item-wrapper">
          <div
            className={`menu-item ${parentActive ? "parent-active" : ""}`}
            onClick={() => toggleExpand(item.id)}
            style={{ paddingLeft: `${level * 16 + 16}px` }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-expand-icon">
              {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
            </span>
          </div>
          {isExpanded && (
            <div className="menu-submenu">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path || "#"}
        className={`menu-item ${itemIsActive ? "active" : ""}`}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
      >
        {level === 0 && <span className="menu-icon">{item.icon}</span>}
        <span className="menu-label">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="menu-component">
      <div className="menu-header">
        <img src="/src/assets/logo.svg" alt="Horizon Logo" className="menu-logo" />
        <h2 className="menu-title">Horizon</h2>
      </div>
      <nav className="menu-nav">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );
}

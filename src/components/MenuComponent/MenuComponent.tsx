import { useEffect, useState, type JSX } from "react";
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
  MdApartment,
  MdSettings,
  MdExpandMore,
  MdExpandLess,
  MdChevronLeft,
  MdChevronRight,
  MdBusiness,
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

interface MenuComponentProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <MdDashboard />,
    path: RouteNames.Dashboard,
  },
  {
    id: "condominio",
    label: "Condominio",
    icon: <MdApartment />,
    path: RouteNames.Condominio,
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
    id: "cadastros",
    label: "Cadastros",
    icon: <MdSettings />,
    children: [
      { id: "cadastros-blocos", label: "Blocos", icon: <></>, path: RouteNames.CadastrosBlocos },
      { id: "cadastros-unidades", label: "Unidades", icon: <></>, path: RouteNames.CadastrosUnidades },
      { id: "cadastros-residentes", label: "Residentes", icon: <></>, path: RouteNames.CadastrosResidentes },
      { id: "cadastros-organizacoes", label: "Organizacoes", icon: <></>, path: RouteNames.CadastrosOrganizacoes },
      { id: "cadastros-perfis", label: "Perfis", icon: <></>, path: RouteNames.CadastrosPerfis },
    ],
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

export default function MenuComponent({ collapsed = false, onToggleCollapse }: MenuComponentProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState<string>("");

  useEffect(() => {
    const loadOrganization = () => {
      const stored = localStorage.getItem("condominium");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { name?: string; legalName?: string };
          const name = parsed?.name || parsed?.legalName || "";
          setOrganizationName(name);
          return;
        } catch {
          // ignore JSON parse errors
        }
      }
      const fallback = localStorage.getItem("organizationName") || "";
      setOrganizationName(fallback);
    };

    loadOrganization();
    window.addEventListener("storage", loadOrganization);
    return () => window.removeEventListener("storage", loadOrganization);
  }, []);

  const getOrganizationInitials = (name: string) => {
    const safeName = name.trim();
    if (!safeName) return "SA";
    const parts = safeName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const toggleExpand = (itemId: string) => {
    if (collapsed) return; // Não expande quando colapsado
    
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
            className={`menu-item ${parentActive ? "parent-active" : ""} ${collapsed ? "collapsed" : ""}`}
            onClick={() => toggleExpand(item.id)}
            style={{ paddingLeft: collapsed ? '0' : `${level * 16 + 16}px` }}
            title={collapsed ? item.label : undefined}
          >
            <span className="menu-icon">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="menu-label">{item.label}</span>
                <span className="menu-expand-icon">
                  {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                </span>
              </>
            )}
          </div>
          {!collapsed && isExpanded && (
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
        className={`menu-item ${itemIsActive ? "active" : ""} ${collapsed ? "collapsed" : ""}`}
        style={{ paddingLeft: collapsed ? '0' : `${level * 16 + 16}px` }}
        title={collapsed ? item.label : undefined}
      >
        {level === 0 && <span className="menu-icon">{item.icon}</span>}
        {!collapsed && <span className="menu-label">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className={`menu-component ${collapsed ? "collapsed" : ""}`}>
      <div className="menu-header">
        <img 
          src="/src/assets/logo.svg" 
          alt="Horizon Logo" 
          className={`menu-logo ${collapsed ? "collapsed" : ""}`}
        />
        {!collapsed && <h2 className="menu-title">Horizon</h2>}
        <div className="menu-org">
          <div className="menu-org-avatar">
            {organizationName ? getOrganizationInitials(organizationName) : <MdBusiness />}
          </div>
          {!collapsed && (
            <div className="menu-org-name" title={organizationName || "Sao Gabriel"}>
              {organizationName || "Sao Gabriel"}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Colapso */}
      <button 
        className="collapse-toggle" 
        onClick={onToggleCollapse}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
      </button>

      <nav className="menu-nav">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );
}

import { useEffect, useMemo, useState, type JSX } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdEventAvailable,
  MdAttachMoney,
  MdSecurity,
  MdDirectionsCar,
  MdLocalShipping,
  MdEmail,
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
import {
  AssignmentInd,
  Close,
  Home,
  People,
  ViewModule,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import Logo from "../../assets/logo.svg";
import {
  organizationService,
  type OrganizationMeResponse,
} from "../../services/organizationService";

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

const getStoredOrganization = (): OrganizationMeResponse | null => {
  const stored = localStorage.getItem("condominium");
  if (!stored) return null;

  try {
    return JSON.parse(stored) as OrganizationMeResponse;
  } catch {
    return null;
  }
};

export default function MenuComponent({
  collapsed = false,
  onToggleCollapse,
}: MenuComponentProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [activeOrganizationId, setActiveOrganizationId] = useState("");
  const [availableOrganizations, setAvailableOrganizations] = useState<
    OrganizationMeResponse[]
  >([]);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isSwitchingListLoading, setIsSwitchingListLoading] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: t("menu.dashboard"),
      icon: <MdDashboard />,
      path: RouteNames.Dashboard,
    },
    {
      id: "cadastros-organizacoes",
      label: t("menu.organizations"),
      icon: <MdBusiness />,
      path: RouteNames.CadastrosOrganizacoes,
    },
    {
      id: "condominios",
      label: t("menu.condominiums"),
      icon: <MdApartment />,
      path: RouteNames.Condominio,
    },
    {
      id: "cadastros-blocos",
      label: t("menu.blocks"),
      icon: <ViewModule />,
      path: RouteNames.CadastrosBlocos,
    },
    {
      id: "cadastros-unidades",
      label: t("menu.units"),
      icon: <Home />,
      path: RouteNames.CadastrosUnidades,
    },
    {
      id: "cadastros-moradores",
      label: t("menu.residents"),
      icon: <People />,
      path: RouteNames.CadastrosResidentes,
    },
    {
      id: "cadastros-perfis",
      label: t("menu.profiles"),
      icon: <AssignmentInd />,
      path: RouteNames.CadastrosPerfis,
    },
    {
      id: "itens-pendentes",
      label: t("menu.pendingItems"),
      icon: <MdSettings />,
      children: [
        {
          id: "pendente-reservas",
          label: t("menu.reservations"),
          icon: <MdEventAvailable />,
          path: RouteNames.ReservasTipo,
        },
        {
          id: "pendente-financeiro",
          label: t("menu.financial"),
          icon: <MdAttachMoney />,
          path: RouteNames.FinanceiroBoletos,
        },
        {
          id: "pendente-portaria",
          label: t("menu.gatehouse"),
          icon: <MdSecurity />,
          path: RouteNames.PortariaUsuarios,
        },
        {
          id: "pendente-veiculos",
          label: t("menu.vehicles"),
          icon: <MdDirectionsCar />,
          path: RouteNames.Veiculos,
        },
        {
          id: "pendente-encomendas",
          label: t("menu.deliveries"),
          icon: <MdLocalShipping />,
          path: RouteNames.EncomendasRecebimento,
        },
        {
          id: "fale-conosco",
          label: t("menu.contactUs"),
          icon: <MdEmail />,
          path: RouteNames.FaleConosco,
        },
      ],
    },
  ];

  useEffect(() => {
    const loadOrganization = () => {
      const storedOrganization = getStoredOrganization();
      if (storedOrganization) {
        setOrganizationName(
          storedOrganization.name || storedOrganization.legalName || "",
        );
        setActiveOrganizationId(storedOrganization.organizationId || "");
        return;
      }

      const fallback = localStorage.getItem("organizationName") || "";
      const organizationId = localStorage.getItem("organizationId") || "";
      setOrganizationName(fallback);
      setActiveOrganizationId(organizationId);
    };

    loadOrganization();
    window.addEventListener("storage", loadOrganization);
    return () => window.removeEventListener("storage", loadOrganization);
  }, []);

  const loadOrganizations = async () => {
    setIsSwitchingListLoading(true);
    setSwitchError(null);

    try {
      const organizations = await organizationService.getMyOrganization();
      setAvailableOrganizations(organizations ?? []);
    } catch (error) {
      setSwitchError(
        error instanceof Error
          ? error.message
          : t("menu.switchError") || "Erro ao carregar condominios.",
      );
    } finally {
      setIsSwitchingListLoading(false);
    }
  };

  const openSwitchModal = async () => {
    setIsSwitchModalOpen(true);
    await loadOrganizations();
  };

  const closeSwitchModal = () => {
    setIsSwitchModalOpen(false);
    setSwitchError(null);
  };

  const handleSwitchOrganization = (organization: OrganizationMeResponse) => {
    const serialized = JSON.stringify(organization);
    localStorage.setItem("condominium", serialized);
    localStorage.setItem("dataCondominium", serialized);
    localStorage.setItem("condominiumId", organization.organizationId || "");
    localStorage.setItem("organizationId", organization.organizationId || "");
    localStorage.setItem(
      "organizationName",
      organization.name || organization.legalName || "",
    );
    localStorage.setItem("isAuthenticated", "true");
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  };

  const currentOrganization = useMemo(
    () =>
      availableOrganizations.find(
        (organization) => organization.organizationId === activeOrganizationId,
      ) || getStoredOrganization(),
    [activeOrganizationId, availableOrganizations],
  );

  const getOrganizationInitials = (name: string) => {
    const safeName = name.trim();
    if (!safeName) return "HZ";
    const parts = safeName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const toggleExpand = (itemId: string) => {
    if (collapsed) return;

    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(
      (child) => child.path && location.pathname === child.path,
    );
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
            style={{ paddingLeft: collapsed ? "0" : `${level * 16 + 16}px` }}
            title={collapsed ? item.label : undefined}
          >
            <span className="menu-icon">{item.icon}</span>
            {!collapsed ? (
              <>
                <span className="menu-label">{item.label}</span>
                <span className="menu-expand-icon">
                  {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                </span>
              </>
            ) : null}
          </div>
          {!collapsed && isExpanded ? (
            <div className="menu-submenu">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path || "#"}
        className={`menu-item ${itemIsActive ? "active" : ""} ${collapsed ? "collapsed" : ""}`}
        style={{ paddingLeft: collapsed ? "0" : `${level * 16 + 16}px` }}
        title={collapsed ? item.label : undefined}
      >
        {level === 0 ? <span className="menu-icon">{item.icon}</span> : null}
        {!collapsed ? <span className="menu-label">{item.label}</span> : null}
      </Link>
    );
  };

  return (
    <>
      <div className={`menu-component ${collapsed ? "collapsed" : ""}`}>
        <div className="menu-header">
          <img
            src={Logo}
            alt="Horizon Logo"
            className={`menu-logo ${collapsed ? "collapsed" : ""}`}
          />
          {!collapsed ? <h2 className="menu-title">Horizon</h2> : null}
          <button
            type="button"
            className={`menu-org menu-org-button ${collapsed ? "collapsed" : ""}`}
            onClick={() => void openSwitchModal()}
            title={t("menu.switchCondominium") || "Trocar condominio"}
          >
            <div className="menu-org-avatar">
              {organizationName ? (
                getOrganizationInitials(organizationName)
              ) : (
                <MdBusiness />
              )}
            </div>
            {!collapsed ? (
              <div className="menu-org-content">
                <div
                  className="menu-org-name"
                  title={organizationName || "Condominio atual"}
                >
                  {organizationName || "Condominio atual"}
                </div>
                <div className="menu-org-action">
                  {t("menu.switchCondominium") || "Trocar condominio"}
                </div>
              </div>
            ) : null}
          </button>
        </div>

        <button
          className="collapse-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? t("common.expandMenu") : t("common.collapseMenu")}
          aria-label={
            collapsed ? t("common.expandMenu") : t("common.collapseMenu")
          }
        >
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>

        <nav className="menu-nav">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      {isSwitchModalOpen ? (
        <div className="menu-switch-overlay" onClick={closeSwitchModal}>
          <div
            className="menu-switch-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="menu-switch-header">
              <div>
                <strong>
                  {t("menu.switchCondominiumTitle") ||
                    "Selecionar condominio"}
                </strong>
                <span>
                  {t("menu.switchCondominiumDescription") ||
                    "Escolha qual condominio deseja carregar agora."}
                </span>
              </div>
              <button
                type="button"
                className="menu-switch-close"
                onClick={closeSwitchModal}
                aria-label={t("common.close") || "Fechar"}
              >
                <Close />
              </button>
            </div>

            {isSwitchingListLoading ? (
              <div className="menu-switch-empty">
                {t("common.loading") || "Carregando..."}
              </div>
            ) : switchError ? (
              <div className="menu-switch-error">{switchError}</div>
            ) : availableOrganizations.length === 0 ? (
              <div className="menu-switch-empty">
                {t("login.noCondominiums") || "Nenhum condominio disponivel."}
              </div>
            ) : (
              <div className="menu-switch-list">
                {availableOrganizations.map((organization) => {
                  const isActiveOrganization =
                    organization.organizationId ===
                    (currentOrganization?.organizationId || activeOrganizationId);

                  return (
                    <button
                      key={organization.organizationId}
                      type="button"
                      className={`menu-switch-item ${isActiveOrganization ? "active" : ""}`}
                      onClick={() => handleSwitchOrganization(organization)}
                    >
                      <div className="menu-switch-item-avatar">
                        {getOrganizationInitials(
                          organization.name || organization.legalName || "HZ",
                        )}
                      </div>
                      <div className="menu-switch-item-content">
                        <strong>{organization.name || organization.legalName}</strong>
                        <span>
                          {organization.city} - {organization.state}
                        </span>
                      </div>
                      {isActiveOrganization ? (
                        <div className="menu-switch-item-badge">
                          {t("common.current") || "Atual"}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

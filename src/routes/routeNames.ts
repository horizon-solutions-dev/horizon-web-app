const CommonRoutes = {
  Login: "/",
  NotFound: "/not-found",
  EsqueciSenha: "/forgot-password",
  RecuperarSenha: "/recover-password/:recoveryToken",
  CriarConta: "/create-account",
  PrimeiroAcesso: "/first-access"
};

const CondominioRoutes = {
  Dashboard: "/dashboard",

  // Reservas
  Areas: "/reservations/areas",
  ReservasTipo: "/reservations/type",
  ReservasListagem: "/reservations/list",
  ReservasCalendario: "/reservations/calendar",
  ReservasDisponibilidade: "/reservations/availability",

  // Financeiro - Boletos
  FinanceiroBoletos: "/finance/bills",
  FinanceiroBoletosDownload: "/finance/bills/download",
  FinanceiroBoletosAnexos: "/finance/bills/attachments",

  // Financeiro - Balancetes
  FinanceiroBalancetes: "/finance/trial-balances",
  FinanceiroBalancetesDownload: "/finance/trial-balances/download",
  FinanceiroBalancetesRelatorio: "/finance/trial-balances/report",

  // Financeiro - Despesas
  FinanceiroDespesas: "/finance/expenses",
  FinanceiroDespesasAnexo: "/finance/expenses/attachment",

  // Portaria
  PortariaUsuarios: "/front-desk/users",
  PortariaVisitantes: "/front-desk/visitors",
  PortariaLiberacao: "/front-desk/access-release",
  PortariaRelatorios: "/front-desk/reports",

  // Condominio
  Condominio: "/condominium",

  // Cadastros
  CadastrosBlocos: "/registrations/blocks",
  CadastrosUnidades: "/registrations/units",
  CadastrosResidentes: "/registrations/residents",
  CadastrosOrganizacoes: "/registrations/organizations",
  CadastrosPerfis: "/registrations/profiles",

  // Veiculos
  Veiculos: "/vehicles",
  // Fale Conosco
  FaleConosco: "/contact-us",

  // Encomendas
  EncomendasRecebimento: "/packages/receiving",
  EncomendasNotificacao: "/packages/notification",
  ValidacaoAcesso: "/pending/access-validation",
};

const PersonalRoutes = {
  LojaHome: "/store/home",
  LojaFinalizarCesta: "/store/home/checkout",
  LojaPesquisarCesta: "/store/search",
  LojaMinhasCompras: "/store/my-purchases",
  LojaCheckout: "/store/checkout",
  LojaRefreshPayment: "/store/home/refresh-payment/basket",
};

const AdminRoutes = {
  AdminLogin: "/admin/login",
  AdminEsqueciSenha: "/admin/forgot-password",

  AdminDashboard: "/admin/dashboard",

  AdminListaPerfil: "/admin/profile",
  AdminPerfilCadastro: "/admin/profile/create",

  AdminListaEmpresa: "/admin/company",
  AdminEmpresaCadastro: "/admin/company/create",

  AdminListaColaboradorCliente: "/admin/customer-collaborators",
  AdminCadastroColaboradorCliente: "/admin/customer-collaborators/create",

  AdminListaProduto: "/admin/product",
  AdminProdutoCadastro: "/admin/product/create",

  AdminListaCesta: "/admin/basket",
  AdminCadastroCesta: "/admin/basket/create",

  AdminCestasCompradas: "/admin/purchased",
};

const RouteNames = {
  //common routes
  ...CommonRoutes,
  //condominium routes
  ...CondominioRoutes,
  //e-commerce routes
  ...PersonalRoutes,

  //admin routes
  ...AdminRoutes,
};

export default RouteNames;

const CommonRoutes = {
  Login: "/login",
  NotFound: "/not-found",
  EsqueciSenha: "/esqueci-senha",
  RecuperarSenha: "/recuperar-senha/:recoveryToken",
};

const CondominioRoutes = {
  Dashboard: "/dashboard",
  
  // Reservas
  ReservasTipo: "/reservas/tipo",
  ReservasListagem: "/reservas/listagem",
  ReservasCalendario: "/reservas/calendario",
  ReservasDisponibilidade: "/reservas/disponibilidade",
  
  // Financeiro - Boletos
  FinanceiroBoletos: "/financeiro/boletos",
  FinanceiroBoletosDownload: "/financeiro/boletos/download",
  FinanceiroBoletosAnexos: "/financeiro/boletos/anexos",
  
  // Financeiro - Balancetes
  FinanceiroBalancetes: "/financeiro/balancetes",
  FinanceiroBalancetesDownload: "/financeiro/balancetes/download",
  FinanceiroBalancetesRelatorio: "/financeiro/balancetes/relatorio",
  
  // Financeiro - Despesas
  FinanceiroDespesas: "/financeiro/despesas",
  FinanceiroDespesasAnexo: "/financeiro/despesas/anexo",
  
  // Portaria
  PortariaUsuarios: "/portaria/usuarios",
  PortariaLiberacao: "/portaria/liberacao",
  PortariaRelatorios: "/portaria/relatorios",
  
  // Moradores
  Moradores: "/moradores",
  
  // Veículos
  Veiculos: "/veiculos",
  
  // Fale Conosco
  FaleConosco: "/fale-conosco",
  
  // Encomendas
  EncomendasRecebimento: "/encomendas/recebimento",
  EncomendasNotificacao: "/encomendas/notificacao",
};

const PersonalRoutes = {
	LojaHome: "/loja/home",
	LojaFinalizarCesta: "/loja/home/finalizacao",
	LojaPesquisarCesta: "/loja/pesquisar",
	LojaMinhasCompras: "/loja/minhas-compras",
	LojaCheckout: "/loja/checkout",
	LojaRefreshPayment: "/loja/home/refresh-payment/basket",
};

const AdminRoutes = {
	AdminLogin: "/admin/login",
	AdminEsqueciSenha: "/admin/esqueci-senha",

	AdminDashboard: "/admin/dashboard",

	AdminListaPerfil: "/admin/perfil",
	AdminPerfilCadastro: "/admin/perfil/cadastro",

	AdminListaEmpresa: "/admin/empresa",
	AdminEmpresaCadastro: "/admin/empresa/cadastro",

	AdminListaColaboradorCliente: "/admin/colaboradores-cliente",
	AdminCadastroColaboradorCliente: "/admin/colaboradores-cliente/cadastro",

	AdminListaProduto: "/admin/produto",
	AdminProdutoCadastro: "/admin/produto/cadastro",

	AdminListaCesta: "/admin/cesta",
	AdminCadastroCesta: "/admin/cesta/cadastro",
	
	AdminCestasCompradas: "/admin/compradas",
	
};

const RouteNames = {
  //common routes
  ...CommonRoutes,
  //condominio routes
  ...CondominioRoutes,
  //e-commerce routes
  ...PersonalRoutes,

  //admin routes
  ...AdminRoutes,
};

export default RouteNames;

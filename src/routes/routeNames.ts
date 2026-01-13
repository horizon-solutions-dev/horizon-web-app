const CommonRoutes = {
  Login: "/login",
  NotFound: "/not-found",
  EsqueciSenha: "/esqueci-senha",
  RecuperarSenha: "/recuperar-senha/:recoveryToken",
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
  //e-commerce routes
  ...PersonalRoutes,

  //admin routes
  ...AdminRoutes,
};

export default RouteNames;

export interface MenuItem {
  id: string;
  label: string;
  pode_visualizar?: boolean;
  pode_criar?: boolean;
  pode_editar?: boolean;
  pode_deletar?: boolean;
  submenu?: MenuItem[];
}

export interface UserSession {
  usuario: {
    id: string;
    email: string;
    username: string;
    avatar_url: string | null;
  };
  menu: MenuItem[];
}

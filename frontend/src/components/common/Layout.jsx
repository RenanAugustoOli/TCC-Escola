import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = {
  ADMINISTRADOR: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/alunos', label: 'Alunos', icon: '👥' },
    { to: '/funcionarios', label: 'Funcionários', icon: '👤' },
    { to: '/planos', label: 'Planos', icon: '📋' },
    { to: '/matriculas', label: 'Matrículas', icon: '📝' },
    { to: '/financeiro', label: 'Financeiro', icon: '💰' },
    { to: '/fichas', label: 'Fichas de Treino', icon: '🏋️' },
    { to: '/checkin', label: 'Check-in', icon: '✅' },
    { to: '/relatorios', label: 'Relatórios', icon: '📈' },
  ],
  RECEPCIONISTA: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/alunos', label: 'Alunos', icon: '👥' },
    { to: '/matriculas', label: 'Matrículas', icon: '📝' },
    { to: '/financeiro', label: 'Financeiro', icon: '💰' },
    { to: '/checkin', label: 'Check-in', icon: '✅' },
  ],
  INSTRUTOR: [
    { to: '/alunos', label: 'Alunos', icon: '👥' },
    { to: '/fichas', label: 'Fichas de Treino', icon: '🏋️' },
  ],
  ALUNO: [
    { to: '/meu-treino', label: 'Meu Treino', icon: '🏋️' },
    { to: '/meus-pagamentos', label: 'Meus Pagamentos', icon: '💰' },
    { to: '/minha-frequencia', label: 'Minha Frequência', icon: '📅' },
  ],
};

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const itens = navItems[usuario?.perfil] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-primary-800 text-white">
        <div className="p-6 border-b border-primary-700">
          <h1 className="text-2xl font-bold tracking-tight">GymTech</h1>
          <p className="text-primary-200 text-xs mt-1">{usuario?.nome}</p>
          <span className="text-xs bg-primary-700 px-2 py-0.5 rounded mt-1 inline-block">
            {usuario?.perfil}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary-700 ${
                  isActive ? 'bg-primary-700 border-r-2 border-white' : 'text-primary-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-700">
          <button onClick={handleLogout} className="w-full text-left text-sm text-primary-200 hover:text-white py-2 px-2 rounded hover:bg-primary-700 transition-colors">
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden bg-primary-800 text-white px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">GymTech</h1>
          <button onClick={() => setMenuAberto(!menuAberto)} className="p-2">
            {menuAberto ? '✕' : '☰'}
          </button>
        </header>

        {/* Mobile nav overlay */}
        {menuAberto && (
          <div className="md:hidden fixed inset-0 z-50 bg-primary-800 text-white flex flex-col pt-16">
            <button
              onClick={() => setMenuAberto(false)}
              className="absolute top-4 right-4 text-white text-2xl"
            >✕</button>
            <nav className="flex-1 py-4">
              {itens.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center gap-3 px-6 py-4 text-base font-medium hover:bg-primary-700"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-6 py-4 text-base text-primary-200 w-full"
              >
                🚪 Sair
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

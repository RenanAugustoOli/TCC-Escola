import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { perfilRedirecionamento } from '../utils/formatters';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (!form.email || !form.senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    try {
      const usuario = await login(form.email, form.senha);
      navigate(perfilRedirecionamento(usuario.perfil));
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao entrar. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-800 rounded-2xl mb-4">
            <span className="text-white text-3xl font-bold">G</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-800">GymTech</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestão de Academia</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar</h2>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          GymTech © 2026 — TCC E.E. Prof. Sebastião de Castro
        </p>
      </div>
    </div>
  );
}

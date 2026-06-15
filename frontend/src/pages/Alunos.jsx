import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatarCPF, formatarData, statusLabel } from '../utils/formatters';
import Paginacao from '../components/common/Paginacao';
import Modal from '../components/common/Modal';

export default function Alunos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const podeEditar = ['ADMINISTRADOR', 'RECEPCIONISTA'].includes(usuario?.perfil);

  const [alunos, setAlunos] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [confirmarInativar, setConfirmarInativar] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params = { pagina };
      if (busca) params.busca = busca;
      if (filtroStatus) params.status = filtroStatus;
      const { data } = await api.get('/alunos', { params });
      setAlunos(data.alunos);
      setTotal(data.total);
      setPaginas(data.paginas);
    } catch {
      // erro tratado pelo interceptor
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroStatus, pagina]);

  useEffect(() => { carregar(); }, [carregar]);

  async function inativar() {
    await api.patch(`/alunos/${confirmarInativar.id}/inativar`);
    setConfirmarInativar(null);
    carregar();
  }

  function badgeStatus(status) {
    const cls = { ATIVO: 'badge-ativo', INADIMPLENTE: 'badge-inadimplente', INATIVO: 'badge-inativo' };
    return <span className={cls[status] || 'badge-inativo'}>{statusLabel(status)}</span>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
        {podeEditar && (
          <button className="btn-primary" onClick={() => navigate('/alunos/novo')}>
            + Novo Aluno
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
          />
          <select
            className="input md:w-48"
            value={filtroStatus}
            onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1); }}
          >
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INADIMPLENTE">Inadimplente</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 text-sm text-gray-500">
          {total} aluno{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Aluno</th>
                <th className="px-6 py-3 text-left">CPF</th>
                <th className="px-6 py-3 text-left">Plano</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Vencimento</th>
                {podeEditar && <th className="px-6 py-3 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carregando ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : alunos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum aluno encontrado.</td></tr>
              ) : alunos.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-semibold text-sm overflow-hidden">
                        {a.foto
                          ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/${a.foto}`} alt="" className="w-full h-full object-cover" />
                          : a.nome[0]?.toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{a.nome}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatarCPF(a.cpf)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.plano || '-'}</td>
                  <td className="px-6 py-4">{badgeStatus(a.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatarData(a.vencimento)}</td>
                  {podeEditar && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/alunos/${a.id}`)} className="btn btn-sm btn-secondary">Ver</button>
                        <button onClick={() => navigate(`/alunos/${a.id}/editar`)} className="btn btn-sm btn-ghost">Editar</button>
                        {a.ativo && (
                          <button onClick={() => setConfirmarInativar(a)} className="btn btn-sm btn-danger">Inativar</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Paginacao pagina={pagina} totalPaginas={paginas} onChange={setPagina} />
        </div>
      </div>

      <Modal aberto={!!confirmarInativar} titulo="Confirmar Inativação" onFechar={() => setConfirmarInativar(null)}>
        <p className="text-gray-700 mb-6">
          Deseja inativar o aluno <strong>{confirmarInativar?.nome}</strong>?
          O aluno não conseguirá mais fazer login.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setConfirmarInativar(null)}>Cancelar</button>
          <button className="btn-danger" onClick={inativar}>Inativar</button>
        </div>
      </Modal>
    </div>
  );
}

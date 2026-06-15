import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { formatarData, formatarMoeda, statusLabel } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

export default function Financeiro() {
  const { usuario } = useAuth();
  const [cobranças, setCobranças] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState({ status: '', dataInicio: '', dataFim: '', alunoId: '' });
  const [modalPagar, setModalPagar] = useState(null);
  const [modalEstornar, setModalEstornar] = useState(null);
  const [formPagar, setFormPagar] = useState({ dataPagamento: '', formaPagamento: 'PIX' });
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data } = await api.get('/cobrancas', { params: filtros });
      setCobranças(data.cobranças);
      setTotal(data.total);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => { carregar(); }, [carregar]);

  async function pagar() {
    setErros({});
    try {
      await api.post(`/cobrancas/${modalPagar.id}/pagar`, formPagar);
      setModalPagar(null);
      carregar();
    } catch (err) {
      setErros({ pagar: err.response?.data?.erro || 'Erro ao registrar pagamento.' });
    }
  }

  async function estornar() {
    if (!motivoEstorno) { setErros({ estorno: 'Motivo obrigatório.' }); return; }
    await api.post(`/cobrancas/${modalEstornar.id}/estornar`, { motivo: motivoEstorno });
    setModalEstornar(null);
    setMotivoEstorno('');
    carregar();
  }

  const statusColors = {
    PENDENTE: 'badge-pendente', PAGO: 'badge-pago', VENCIDO: 'badge-vencido', CANCELADO: 'badge-cancelado',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="input" value={filtros.status}
            onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <input type="date" className="input" placeholder="Data início" value={filtros.dataInicio}
            onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))} />
          <input type="date" className="input" placeholder="Data fim" value={filtros.dataFim}
            onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))} />
          <button className="btn-secondary" onClick={carregar}>Filtrar</button>
        </div>
      </div>

      {/* Totalizador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card py-4">
          <p className="text-sm text-gray-500">Total do filtro</p>
          <p className="text-2xl font-bold text-primary-800">{formatarMoeda(total)}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Cobranças</p>
          <p className="text-2xl font-bold text-gray-900">{cobranças.length}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Pagas</p>
          <p className="text-2xl font-bold text-green-700">
            {formatarMoeda(cobranças.filter((c) => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0))}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Aluno</th>
                <th className="px-6 py-3 text-left">Competência</th>
                <th className="px-6 py-3 text-left">Valor</th>
                <th className="px-6 py-3 text-left">Vencimento</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Pagamento</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carregando ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : cobranças.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhuma cobrança encontrada.</td></tr>
              ) : cobranças.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {c.matricula?.aluno?.usuario?.nome}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(c.competencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{formatarMoeda(c.valor)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatarData(c.vencimento)}</td>
                  <td className="px-6 py-4">
                    <span className={statusColors[c.status] || 'badge-inativo'}>{statusLabel(c.status)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.dataPagamento ? `${formatarData(c.dataPagamento)} · ${c.formaPagamento}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {(c.status === 'PENDENTE' || c.status === 'VENCIDO') && (
                      <button onClick={() => { setModalPagar(c); setFormPagar({ dataPagamento: '', formaPagamento: 'PIX' }); setErros({}); }}
                        className="btn btn-sm btn-primary">Registrar pagamento</button>
                    )}
                    {c.status === 'PAGO' && usuario?.perfil === 'ADMINISTRADOR' && (
                      <button onClick={() => { setModalEstornar(c); setMotivoEstorno(''); setErros({}); }}
                        className="btn btn-sm btn-ghost">Estornar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pagar */}
      <Modal aberto={!!modalPagar} titulo="Registrar Pagamento" onFechar={() => setModalPagar(null)}>
        {erros.pagar && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erros.pagar}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Forma de pagamento *</label>
            <select className="input" value={formPagar.formaPagamento}
              onChange={(e) => setFormPagar((f) => ({ ...f, formaPagamento: e.target.value }))}>
              <option value="PIX">Pix</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão</option>
            </select>
          </div>
          <div>
            <label className="label">Data do pagamento</label>
            <input type="date" className="input" value={formPagar.dataPagamento}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormPagar((f) => ({ ...f, dataPagamento: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Deixe em branco para usar a data de hoje.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalPagar(null)}>Cancelar</button>
            <button className="btn-primary" onClick={pagar}>Confirmar pagamento</button>
          </div>
        </div>
      </Modal>

      {/* Modal estornar */}
      <Modal aberto={!!modalEstornar} titulo="Estornar Pagamento" onFechar={() => setModalEstornar(null)}>
        {erros.estorno && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erros.estorno}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Motivo do estorno *</label>
            <textarea className="input" rows={3} value={motivoEstorno} onChange={(e) => setMotivoEstorno(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setModalEstornar(null)}>Cancelar</button>
            <button className="btn-danger" onClick={estornar}>Confirmar estorno</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

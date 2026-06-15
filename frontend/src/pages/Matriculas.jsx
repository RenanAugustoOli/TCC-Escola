import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { formatarData, formatarMoeda, statusLabel } from '../utils/formatters';

export default function Matriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [buscaAluno, setBuscaAluno] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(null);
  const [form, setForm] = useState({ alunoId: '', planoId: '', dataInicio: '', diaVencimento: '10' });
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  async function carregar() {
    const { data } = await api.get('/matriculas');
    setMatriculas(data);
  }
  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    api.get('/planos', { params: { apenasAtivos: 'true' } }).then(({ data }) => setPlanos(data));
  }, []);

  useEffect(() => {
    if (!buscaAluno || buscaAluno.length < 2) { setAlunos([]); return; }
    api.get('/alunos', { params: { busca: buscaAluno } }).then(({ data }) => setAlunos(data.alunos));
  }, [buscaAluno]);

  const planoSelecionado = planos.find((p) => String(p.id) === String(form.planoId));

  function dataFimCalc() {
    if (!form.dataInicio || !planoSelecionado) return null;
    const d = new Date(form.dataInicio);
    d.setMonth(d.getMonth() + planoSelecionado.duracaoMeses);
    return formatarData(d);
  }

  async function matricular() {
    setErros({});
    setCarregando(true);
    try {
      await api.post('/matriculas', form);
      setModalAberto(false);
      setForm({ alunoId: '', planoId: '', dataInicio: '', diaVencimento: '10' });
      carregar();
    } catch (err) {
      setErros({ geral: err.response?.data?.erro || 'Erro ao matricular.' });
    } finally {
      setCarregando(false);
    }
  }

  async function cancelar() {
    if (!motivoCancelamento) { setErros({ motivo: 'Motivo obrigatório.' }); return; }
    await api.patch(`/matriculas/${modalCancelar.id}/cancelar`, { motivo: motivoCancelamento });
    setModalCancelar(null);
    setMotivoCancelamento('');
    carregar();
  }

  const statusColors = { ATIVO: 'badge-ativo', INATIVO: 'badge-inativo', CANCELADO: 'badge-cancelado' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
        <button className="btn-primary" onClick={() => { setForm({ alunoId: '', planoId: '', dataInicio: '', diaVencimento: '10' }); setErros({}); setModalAberto(true); }}>
          + Nova Matrícula
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Aluno</th>
                <th className="px-6 py-3 text-left">Plano</th>
                <th className="px-6 py-3 text-left">Valor</th>
                <th className="px-6 py-3 text-left">Início</th>
                <th className="px-6 py-3 text-left">Término</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {matriculas.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.aluno?.usuario?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.plano?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatarMoeda(m.valorContratado)}/mês</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatarData(m.dataInicio)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatarData(m.dataFim)}</td>
                  <td className="px-6 py-4">
                    <span className={statusColors[m.status] || 'badge-inativo'}>{statusLabel(m.status)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {m.status === 'ATIVO' && (
                      <button onClick={() => { setModalCancelar(m); setMotivoCancelamento(''); setErros({}); }}
                        className="btn btn-sm btn-danger">Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nova matrícula */}
      <Modal aberto={modalAberto} titulo="Nova Matrícula" onFechar={() => setModalAberto(false)}>
        {erros.geral && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erros.geral}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Aluno *</label>
            <input className="input mb-1" placeholder="Buscar aluno..." value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)} />
            {alunos.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                {alunos.map((a) => (
                  <button key={a.id} className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
                    onClick={() => { setForm((f) => ({ ...f, alunoId: a.id })); setBuscaAluno(a.nome); setAlunos([]); }}>
                    {a.nome} — {a.cpf}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Plano *</label>
            <select className="input" value={form.planoId} onChange={(e) => setForm((f) => ({ ...f, planoId: e.target.value }))}>
              <option value="">Selecione...</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {formatarMoeda(p.valorMensal)}/mês ({p.duracaoMeses} {p.duracaoMeses === 1 ? 'mês' : 'meses'})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data de início *</label>
              <input type="date" className="input" value={form.dataInicio}
                onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))} />
            </div>
            <div>
              <label className="label">Dia de vencimento *</label>
              <input type="number" className="input" min={1} max={28} value={form.diaVencimento}
                onChange={(e) => setForm((f) => ({ ...f, diaVencimento: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Entre 1 e 28</p>
            </div>
          </div>
          {planoSelecionado && form.dataInicio && (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm">
              <p><strong>Valor mensal:</strong> {formatarMoeda(planoSelecionado.valorMensal)}</p>
              <p><strong>Duração:</strong> {planoSelecionado.duracaoMeses} {planoSelecionado.duracaoMeses === 1 ? 'mês' : 'meses'}</p>
              <p><strong>Término previsto:</strong> {dataFimCalc()}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button className="btn-primary" onClick={matricular} disabled={carregando || !form.alunoId || !form.planoId}>
              {carregando ? 'Matriculando...' : 'Matricular'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal cancelar */}
      <Modal aberto={!!modalCancelar} titulo="Cancelar Matrícula" onFechar={() => setModalCancelar(null)}>
        <p className="text-gray-700 mb-4">
          Cancelar a matrícula de <strong>{modalCancelar?.aluno?.usuario?.nome}</strong>?
          Mensalidades futuras pendentes serão canceladas.
        </p>
        <div className="mb-4">
          <label className="label">Motivo *</label>
          <textarea className={`input ${erros.motivo ? 'input-error' : ''}`} rows={3}
            value={motivoCancelamento} onChange={(e) => setMotivoCancelamento(e.target.value)} />
          {erros.motivo && <p className="text-xs text-red-600 mt-1">{erros.motivo}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setModalCancelar(null)}>Voltar</button>
          <button className="btn-danger" onClick={cancelar}>Confirmar cancelamento</button>
        </div>
      </Modal>
    </div>
  );
}

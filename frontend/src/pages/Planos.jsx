import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { formatarMoeda } from '../utils/formatters';

const formVazio = { nome: '', duracaoMeses: 1, valorMensal: '', descricao: '' };

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVazio);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    const { data } = await api.get('/planos');
    setPlanos(data);
  }
  useEffect(() => { carregar(); }, []);

  function abrirNovo() { setEditando(null); setForm(formVazio); setErros({}); setModalAberto(true); }
  function abrirEditar(p) {
    setEditando(p);
    setForm({ nome: p.nome, duracaoMeses: p.duracaoMeses, valorMensal: p.valorMensal, descricao: p.descricao || '' });
    setErros({});
    setModalAberto(true);
  }

  function set(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: '' }));
  }

  async function salvar() {
    setErros({});
    setCarregando(true);
    try {
      if (editando) {
        await api.put(`/planos/${editando.id}`, form);
      } else {
        await api.post('/planos', form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      const e = err.response?.data;
      if (e?.campo) setErros({ [e.campo]: e.erro });
      else setErros({ geral: e?.erro || 'Erro ao salvar.' });
    } finally {
      setCarregando(false);
    }
  }

  async function toggleAtivo(p) {
    await api.patch(`/planos/${p.id}/${p.ativo ? 'inativar' : 'ativar'}`);
    carregar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo Plano</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planos.map((p) => (
          <div key={p.id} className={`card ${!p.ativo ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{p.nome}</h3>
              <span className={p.ativo ? 'badge-ativo' : 'badge-inativo'}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
            <p className="text-3xl font-bold text-primary-800">{formatarMoeda(p.valorMensal)}</p>
            <p className="text-sm text-gray-500 mb-1">/mês · {p.duracaoMeses} {p.duracaoMeses === 1 ? 'mês' : 'meses'}</p>
            {p.descricao && <p className="text-sm text-gray-600 mt-2">{p.descricao}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => abrirEditar(p)} className="btn btn-sm btn-secondary flex-1">Editar</button>
              <button onClick={() => toggleAtivo(p)} className={`btn btn-sm flex-1 ${p.ativo ? 'btn-danger' : 'btn-ghost'}`}>
                {p.ativo ? 'Inativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal aberto={modalAberto} titulo={editando ? 'Editar Plano' : 'Novo Plano'} onFechar={() => setModalAberto(false)}>
        {erros.geral && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erros.geral}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Nome do plano *</label>
            <input className="input" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Mensal" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duração (meses) *</label>
              <input type="number" className="input" value={form.duracaoMeses} min={1}
                onChange={(e) => set('duracaoMeses', e.target.value)} required />
            </div>
            <div>
              <label className="label">Valor mensal (R$) *</label>
              <input type="number" step="0.01" min="0.01" className={`input ${erros.valorMensal ? 'input-error' : ''}`}
                value={form.valorMensal} onChange={(e) => set('valorMensal', e.target.value)} placeholder="89.90" required />
              {erros.valorMensal && <p className="text-xs text-red-600 mt-1">{erros.valorMensal}</p>}
            </div>
          </div>
          <div>
            <label className="label">Descrição / Benefícios</label>
            <textarea className="input" rows={2} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
          </div>
          {editando && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
              ⚠️ Alterar o valor não afeta matrículas já existentes.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvar} disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { formatarCPF, statusLabel } from '../utils/formatters';

function mascaraCPF(v) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}

const formVazio = { nome: '', cpf: '', email: '', telefone: '', cargo: 'RECEPCIONISTA', cref: '', senha: '' };

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVazio);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    const { data } = await api.get('/funcionarios');
    setFuncionarios(data);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() { setEditando(null); setForm(formVazio); setErros({}); setModalAberto(true); }
  function abrirEditar(f) {
    setEditando(f);
    setForm({ nome: f.usuario.nome, cpf: f.cpf, email: f.usuario.email, telefone: '', cargo: f.cargo, cref: f.cref || '', senha: '' });
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
        await api.put(`/funcionarios/${editando.id}`, form);
      } else {
        await api.post('/funcionarios', form);
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

  async function desativar(f) {
    if (!window.confirm(`Desativar ${f.usuario.nome}?`)) return;
    await api.patch(`/funcionarios/${f.id}/desativar`);
    carregar();
  }

  const cargos = { ADMINISTRADOR: '🔑 Admin', RECEPCIONISTA: '🖥️ Recepcionista', INSTRUTOR: '🏋️ Instrutor' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo Funcionário</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">Nome</th>
              <th className="px-6 py-3 text-left">CPF</th>
              <th className="px-6 py-3 text-left">Cargo</th>
              <th className="px-6 py-3 text-left">CREF</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {funcionarios.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-sm text-gray-900">{f.usuario.nome}</p>
                  <p className="text-xs text-gray-400">{f.usuario.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatarCPF(f.cpf)}</td>
                <td className="px-6 py-4 text-sm">{cargos[f.cargo] || f.cargo}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{f.cref || '-'}</td>
                <td className="px-6 py-4">
                  <span className={f.usuario.ativo ? 'badge-ativo' : 'badge-inativo'}>
                    {f.usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => abrirEditar(f)} className="btn btn-sm btn-ghost">Editar</button>
                    {f.usuario.ativo && (
                      <button onClick={() => desativar(f)} className="btn btn-sm btn-danger">Desativar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal aberto={modalAberto} titulo={editando ? 'Editar Funcionário' : 'Novo Funcionário'} onFechar={() => setModalAberto(false)}>
        {erros.geral && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erros.geral}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CPF *</label>
              <input className={`input ${erros.cpf ? 'input-error' : ''}`} value={form.cpf}
                onChange={(e) => set('cpf', mascaraCPF(e.target.value))} placeholder="000.000.000-00" />
              {erros.cpf && <p className="text-xs text-red-600 mt-1">{erros.cpf}</p>}
            </div>
            <div>
              <label className="label">Cargo *</label>
              <select className="input" value={form.cargo} onChange={(e) => set('cargo', e.target.value)}>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="RECEPCIONISTA">Recepcionista</option>
                <option value="INSTRUTOR">Instrutor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input type="email" className={`input ${erros.email ? 'input-error' : ''}`} value={form.email}
              onChange={(e) => set('email', e.target.value)} />
            {erros.email && <p className="text-xs text-red-600 mt-1">{erros.email}</p>}
          </div>
          {form.cargo === 'INSTRUTOR' && (
            <div>
              <label className="label">CREF *</label>
              <input className={`input ${erros.cref ? 'input-error' : ''}`} value={form.cref}
                onChange={(e) => set('cref', e.target.value)} placeholder="000000-G/XX" />
              {erros.cref && <p className="text-xs text-red-600 mt-1">{erros.cref}</p>}
            </div>
          )}
          {!editando && (
            <div>
              <label className="label">Senha inicial *</label>
              <input type="password" className="input" value={form.senha}
                onChange={(e) => set('senha', e.target.value)} minLength={6} />
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

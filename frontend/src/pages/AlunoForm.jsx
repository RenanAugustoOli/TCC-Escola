import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function mascaraCPF(v) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}
function mascaraTelefone(v) {
  const d = v.replace(/\D/g, '');
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 16);
}

export default function AlunoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = !!id;

  const [form, setForm] = useState({
    nome: '', cpf: '', nascimento: '', telefone: '', email: '', endereco: '', obsSaude: '',
  });
  const [foto, setFoto] = useState(null);
  const [erros, setErros] = useState({});
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (editando) {
      api.get(`/alunos/${id}`).then(({ data }) => {
        setForm({
          nome: data.usuario?.nome || '',
          cpf: data.cpf || '',
          nascimento: data.nascimento ? data.nascimento.split('T')[0] : '',
          telefone: data.telefone || '',
          email: data.usuario?.email || '',
          endereco: data.endereco || '',
          obsSaude: data.obsSaude || '',
        });
      });
    }
  }, [id, editando]);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErros({});
    setSucesso('');
    setCarregando(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (foto) fd.append('foto', foto);

    try {
      if (editando) {
        await api.put(`/alunos/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSucesso('Aluno atualizado com sucesso!');
      } else {
        const { data } = await api.post('/alunos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSucesso(`Aluno cadastrado! Senha provisória: ${data.senhaProvisoria}`);
      }
      setTimeout(() => navigate('/alunos'), 2500);
    } catch (err) {
      const e = err.response?.data;
      if (e?.campo) setErros({ [e.campo]: e.erro });
      else setErros({ geral: e?.erro || 'Erro ao salvar.' });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← Voltar</button>
        <h1 className="text-2xl font-bold text-gray-900">{editando ? 'Editar Aluno' : 'Novo Aluno'}</h1>
      </div>

      <div className="card">
        {sucesso && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
            {sucesso}
          </div>
        )}
        {erros.geral && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erros.geral}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nome completo *</label>
              <input className={`input ${erros.nome ? 'input-error' : ''}`} value={form.nome}
                onChange={(e) => set('nome', e.target.value)} minLength={3} required />
              {erros.nome && <p className="text-xs text-red-600 mt-1">{erros.nome}</p>}
            </div>

            <div>
              <label className="label">CPF *</label>
              <input className={`input ${erros.cpf ? 'input-error' : ''}`} value={form.cpf}
                onChange={(e) => set('cpf', mascaraCPF(e.target.value))} placeholder="000.000.000-00" required />
              {erros.cpf && <p className="text-xs text-red-600 mt-1">{erros.cpf}</p>}
            </div>

            <div>
              <label className="label">Data de nascimento *</label>
              <input type="date" className={`input ${erros.nascimento ? 'input-error' : ''}`} value={form.nascimento}
                onChange={(e) => set('nascimento', e.target.value)} required />
            </div>

            <div>
              <label className="label">Telefone / WhatsApp *</label>
              <input className={`input ${erros.telefone ? 'input-error' : ''}`} value={form.telefone}
                onChange={(e) => set('telefone', mascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" required />
            </div>

            <div>
              <label className="label">E-mail *</label>
              <input type="email" className={`input ${erros.email ? 'input-error' : ''}`} value={form.email}
                onChange={(e) => set('email', e.target.value)} required />
              {erros.email && <p className="text-xs text-red-600 mt-1">{erros.email}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="label">Endereço</label>
              <input className="input" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} />
            </div>

            <div>
              <label className="label">Foto (JPG/PNG, máx. 2MB)</label>
              <input type="file" accept="image/jpeg,image/png" className="input py-1.5"
                onChange={(e) => setFoto(e.target.files[0])} />
              {erros.foto && <p className="text-xs text-red-600 mt-1">{erros.foto}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="label">Observações de saúde</label>
              <textarea className="input" rows={3} value={form.obsSaude}
                onChange={(e) => set('obsSaude', e.target.value)}
                placeholder="Lesões, restrições médicas..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={carregando}>
              {carregando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

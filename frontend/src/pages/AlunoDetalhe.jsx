import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatarCPF, formatarTelefone, formatarData, formatarMoeda, statusLabel } from '../utils/formatters';
import Modal from '../components/common/Modal';

export default function AlunoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  const [cobranças, setCobranças] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [aba, setAba] = useState('dados');

  useEffect(() => {
    async function carregar() {
      const [alunoRes, matRes, cobRes] = await Promise.all([
        api.get(`/alunos/${id}`),
        api.get('/matriculas', { params: { alunoId: id } }),
        api.get('/cobrancas', { params: { alunoId: id } }),
      ]);
      setAluno(alunoRes.data);
      setMatriculas(matRes.data);
      setCobranças(cobRes.data.cobranças);
    }
    carregar();
  }, [id]);

  if (!aluno) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← Voltar</button>
        <h1 className="text-2xl font-bold text-gray-900">Ficha do Aluno</h1>
        <button onClick={() => navigate(`/alunos/${id}/editar`)} className="btn-secondary ml-auto">Editar</button>
      </div>

      {/* Cabeçalho do aluno */}
      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-2xl overflow-hidden flex-shrink-0">
            {aluno.foto
              ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/${aluno.foto}`} alt="" className="w-full h-full object-cover" />
              : aluno.usuario?.nome[0]?.toUpperCase()
            }
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{aluno.usuario?.nome}</h2>
            <p className="text-gray-500 text-sm">{aluno.usuario?.email}</p>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-200 mb-4">
        {['dados', 'matriculas', 'financeiro'].map((a) => (
          <button key={a} onClick={() => setAba(a)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${aba === a ? 'border-primary-800 text-primary-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {a === 'dados' ? 'Dados Pessoais' : a === 'matriculas' ? 'Matrículas' : 'Financeiro'}
          </button>
        ))}
      </div>

      {aba === 'dados' && (
        <div className="card grid grid-cols-2 gap-4">
          {[
            { label: 'CPF', value: formatarCPF(aluno.cpf) },
            { label: 'Nascimento', value: formatarData(aluno.nascimento) },
            { label: 'Telefone', value: formatarTelefone(aluno.telefone) },
            { label: 'Endereço', value: aluno.endereco || '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="font-medium text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
          {aluno.obsSaude && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Observações de Saúde</p>
              <p className="font-medium text-gray-900 mt-0.5 bg-yellow-50 p-2 rounded text-sm">{aluno.obsSaude}</p>
            </div>
          )}
        </div>
      )}

      {aba === 'matriculas' && (
        <div className="space-y-3">
          {matriculas.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">Nenhuma matrícula encontrada.</div>
          ) : matriculas.map((m) => (
            <div key={m.id} className="card py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{m.plano?.nome}</p>
                  <p className="text-sm text-gray-500">{formatarData(m.dataInicio)} → {formatarData(m.dataFim)}</p>
                  <p className="text-sm text-gray-500">{formatarMoeda(m.valorContratado)}/mês</p>
                </div>
                <span className={`badge-${m.status.toLowerCase()}`}>{statusLabel(m.status)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 'financeiro' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Competência</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-left">Vencimento</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cobranças.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{new Date(c.competencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-right">{formatarMoeda(c.valor)}</td>
                  <td className="px-4 py-3">{formatarData(c.vencimento)}</td>
                  <td className="px-4 py-3"><span className={`badge-${c.status.toLowerCase()}`}>{statusLabel(c.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

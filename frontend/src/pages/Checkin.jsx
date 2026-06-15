import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { formatarData } from '../utils/formatters';

export default function Checkin() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [checkinsDia, setCheckinsDia] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [confirmandoManual, setConfirmandoManual] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    carregarCheckinsDia();
  }, []);

  async function carregarCheckinsDia() {
    const hoje = new Date().toISOString().split('T')[0];
    const { data } = await api.get('/checkins', { params: { data: hoje } });
    setCheckinsDia(data);
  }

  async function buscarAluno() {
    if (!busca.trim()) return;
    const { data } = await api.post('/checkins/buscar', { termo: busca });
    setResultados(data);
  }

  async function registrarCheckin(alunoId, liberarManual = false) {
    try {
      await api.post('/checkins', { alunoId, liberarManual });
      const aluno = resultados.find((r) => r.id === alunoId);
      setFeedback({ tipo: 'sucesso', mensagem: `✅ Entrada registrada: ${aluno?.nome}` });
      setBusca('');
      setResultados([]);
      setConfirmandoManual(null);
      carregarCheckinsDia();
      inputRef.current?.focus();
    } catch (err) {
      const e = err.response?.data;
      if (e?.requerAutorizacao) {
        setConfirmandoManual(alunoId);
        setFeedback({ tipo: 'aviso', mensagem: e.mensagem });
      } else {
        setFeedback({ tipo: 'erro', mensagem: e?.erro || 'Erro ao registrar check-in.' });
      }
    }
    setTimeout(() => setFeedback(null), 4000);
  }

  const feedbackColors = {
    sucesso: 'bg-green-50 border-green-300 text-green-800',
    aviso: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    erro: 'bg-red-50 border-red-300 text-red-800',
  };

  const statusCheckinColors = {
    ATIVO: 'bg-green-100 border-green-300',
    INADIMPLENTE: 'bg-red-100 border-red-300',
    INATIVO: 'bg-gray-100 border-gray-300',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Check-in</h1>

      {feedback && (
        <div className={`p-4 border rounded-xl mb-4 font-medium text-sm ${feedbackColors[feedback.tipo]}`}>
          {feedback.mensagem}
        </div>
      )}

      {/* Campo de busca */}
      <div className="card mb-6">
        <label className="label">Buscar aluno por nome ou CPF</label>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            className="input flex-1 text-base"
            placeholder="Nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarAluno()}
          />
          <button className="btn-primary px-6" onClick={buscarAluno}>Buscar</button>
        </div>
      </div>

      {/* Resultados da busca */}
      {resultados.length > 0 && (
        <div className="space-y-3 mb-6">
          {resultados.map((a) => (
            <div key={a.id} className={`p-4 rounded-xl border-2 ${statusCheckinColors[a.statusCheckin] || 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-xl overflow-hidden flex-shrink-0">
                  {a.foto
                    ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/${a.foto}`} alt="" className="w-full h-full object-cover" />
                    : a.nome[0]?.toUpperCase()
                  }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-lg">{a.nome}</p>
                  <p className="text-sm text-gray-500">{a.plano || 'Sem plano ativo'}</p>
                  <p className={`text-sm font-medium mt-0.5 ${a.statusCheckin === 'ATIVO' ? 'text-green-700' : a.statusCheckin === 'INADIMPLENTE' ? 'text-red-700' : 'text-gray-500'}`}>
                    {a.mensagem}
                  </p>
                </div>
                <div>
                  {a.statusCheckin === 'INATIVO' ? (
                    <span className="badge-inativo">Bloqueado</span>
                  ) : a.statusCheckin === 'INADIMPLENTE' && confirmandoManual === a.id ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-center text-red-600 font-medium">Liberar mesmo assim?</p>
                      <button onClick={() => registrarCheckin(a.id, true)} className="btn-danger">Liberar</button>
                      <button onClick={() => setConfirmandoManual(null)} className="btn-secondary btn-sm">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => registrarCheckin(a.id)} className="btn-primary px-8 py-3 text-base">
                      Confirmar entrada
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Últimos check-ins do dia */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Entradas hoje ({checkinsDia.length})</h2>
        {checkinsDia.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma entrada registrada hoje.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {checkinsDia.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-sm font-medium">
                    {c.aluno?.usuario?.nome[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.aluno?.usuario?.nome}</p>
                    {c.liberadoManual && <p className="text-xs text-yellow-600">⚠️ Liberado manualmente</p>}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

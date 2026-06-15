import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatarData, formatarMoeda, statusLabel } from '../utils/formatters';

export default function MeuTreino() {
  const [ficha, setFicha] = useState(null);
  const [divisaoAtiva, setDivisaoAtiva] = useState('');
  const [pagamentos, setPagamentos] = useState(null);
  const [frequencia, setFrequencia] = useState(null);
  const [aba, setAba] = useState('treino');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [fichaRes, pagRes, freqRes] = await Promise.all([
          api.get('/fichas'),
          api.get('/cobrancas/minhas'),
          api.get('/checkins/minha-frequencia'),
        ]);
        setFicha(fichaRes.data);
        if (fichaRes.data) {
          const divisoes = [...new Set(fichaRes.data.exercicios.map((e) => e.divisao))];
          setDivisaoAtiva(divisoes[0] || 'A');
        }
        setPagamentos(pagRes.data);
        setFrequencia(freqRes.data);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const hoje = new Date();
  const fichaVencida = ficha && new Date(ficha.validade) < hoje;
  const divisoes = ficha ? [...new Set(ficha.exercicios.map((e) => e.divisao))] : [];
  const exerciciosDivisao = ficha?.exercicios.filter((e) => e.divisao === divisaoAtiva) || [];

  if (carregando) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary-800">GymTech</h1>
        <p className="text-gray-500 text-sm">Minha Academia</p>
      </div>

      {/* Abas */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
        {[
          { key: 'treino', label: '🏋️ Treino' },
          { key: 'pagamentos', label: '💰 Pagamentos' },
          { key: 'frequencia', label: '📅 Frequência' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setAba(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${aba === tab.key ? 'bg-primary-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Treino */}
      {aba === 'treino' && (
        ficha ? (
          <div>
            {fichaVencida && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800 mb-4">
                ⚠️ Sua ficha venceu em {formatarData(ficha.validade)}. Procure seu instrutor.
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mb-3">
              Validade: {formatarData(ficha.validade)} · Instrutor: {ficha.instrutor?.usuario?.nome}
            </p>

            {/* Seletor de divisão */}
            <div className="flex gap-2 justify-center mb-4 flex-wrap">
              {divisoes.map((d) => (
                <button key={d} onClick={() => setDivisaoAtiva(d)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${divisaoAtiva === d ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  Treino {d}
                </button>
              ))}
            </div>

            {/* Exercícios */}
            <div className="space-y-3">
              {exerciciosDivisao.map((ex, i) => (
                <div key={i} className="card py-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{ex.exercicio.nome}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ex.exercicio.grupoMuscular}</span>
                  </div>
                  <div className="flex gap-4 text-sm mt-2">
                    <span><strong>{ex.series}</strong> séries</span>
                    <span><strong>{ex.repeticoes}</strong> reps</span>
                    {ex.carga && <span><strong>{ex.carga}</strong></span>}
                    {ex.descanso && <span>Descanso: <strong>{ex.descanso}</strong></span>}
                  </div>
                  {ex.observacao && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">💬 {ex.observacao}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-gray-600 font-medium">Nenhuma ficha de treino</p>
            <p className="text-gray-400 text-sm mt-1">Procure seu instrutor para montar seu treino.</p>
          </div>
        )
      )}

      {/* Pagamentos */}
      {aba === 'pagamentos' && (
        <div className="space-y-3">
          {(pagamentos || []).length === 0 ? (
            <div className="card text-center py-8 text-gray-400">Nenhum pagamento encontrado.</div>
          ) : pagamentos.map((p) => (
            <div key={p.id} className="card py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{new Date(p.competencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <p className="text-xs text-gray-500">Vencimento: {formatarData(p.vencimento)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatarMoeda(p.valor)}</p>
                <span className={`badge-${p.status.toLowerCase()}`}>{statusLabel(p.status)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Frequência */}
      {aba === 'frequencia' && (
        <div>
          <p className="text-sm text-gray-500 mb-3 text-center">
            Entradas este mês: <strong>{(frequencia || []).length}</strong>
          </p>
          <div className="space-y-2">
            {(frequencia || []).length === 0 ? (
              <div className="card text-center py-8 text-gray-400">Nenhum check-in este mês.</div>
            ) : frequencia.map((c) => (
              <div key={c.id} className="card py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{new Date(c.dataHora).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
                <span className="text-xs text-gray-400">{new Date(c.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { formatarData } from '../utils/formatters';

export default function FichaTreino() {
  const [alunos, setAlunos] = useState([]);
  const [buscaAluno, setBuscaAluno] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [fichaAtual, setFichaAtual] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [exerciciosBiblioteca, setExerciciosBiblioteca] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [buscaExercicio, setBuscaExercicio] = useState('');
  const [divisoes, setDivisoes] = useState([{ letra: 'A', exercicios: [] }]);
  const [divisaoAtiva, setDivisaoAtiva] = useState(0);
  const [validade, setValidade] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (buscaAluno.length >= 2) {
      api.get('/alunos', { params: { busca: buscaAluno } }).then(({ data }) => setAlunos(data.alunos));
    } else setAlunos([]);
  }, [buscaAluno]);

  useEffect(() => {
    api.get('/fichas/exercicios', { params: { busca: buscaExercicio } }).then(({ data }) => setExerciciosBiblioteca(data));
  }, [buscaExercicio]);

  async function selecionarAluno(a) {
    setAlunoSelecionado(a);
    setBuscaAluno(a.nome);
    setAlunos([]);
    const [fichaRes, histRes] = await Promise.all([
      api.get('/fichas', { params: { alunoId: a.id } }),
      api.get(`/fichas/historico/${a.id}`),
    ]);
    setFichaAtual(fichaRes.data?.[0] || null);
    setHistorico(histRes.data);
  }

  function abrirNovaFicha() {
    setDivisoes([{ letra: 'A', exercicios: [] }]);
    setDivisaoAtiva(0);
    setValidade('');
    setModalAberto(true);
  }

  function adicionarDivisao() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const proxLetra = letras[divisoes.length] || `D${divisoes.length}`;
    setDivisoes((prev) => [...prev, { letra: proxLetra, exercicios: [] }]);
  }

  function adicionarExercicio(ex) {
    setDivisoes((prev) => prev.map((d, i) =>
      i === divisaoAtiva
        ? { ...d, exercicios: [...d.exercicios, { exercicioId: ex.id, nome: ex.nome, grupoMuscular: ex.grupoMuscular, series: 3, repeticoes: '10', carga: '', descanso: '60s', observacao: '' }] }
        : d
    ));
  }

  function removerExercicio(divIdx, exIdx) {
    setDivisoes((prev) => prev.map((d, i) =>
      i === divIdx ? { ...d, exercicios: d.exercicios.filter((_, j) => j !== exIdx) } : d
    ));
  }

  function atualizarExercicio(divIdx, exIdx, campo, valor) {
    setDivisoes((prev) => prev.map((d, i) =>
      i === divIdx
        ? { ...d, exercicios: d.exercicios.map((e, j) => j === exIdx ? { ...e, [campo]: valor } : e) }
        : d
    ));
  }

  async function salvarFicha() {
    if (!alunoSelecionado) return;
    const exerciciosPayload = divisoes.flatMap((d, di) =>
      d.exercicios.map((ex, ei) => ({
        divisao: d.letra,
        exercicioId: ex.exercicioId,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga: ex.carga,
        descanso: ex.descanso,
        observacao: ex.observacao,
        ordem: ei,
      }))
    );
    if (exerciciosPayload.length === 0) {
      alert('Adicione ao menos 1 exercício.');
      return;
    }
    setCarregando(true);
    try {
      await api.post('/fichas', { alunoId: alunoSelecionado.id, validade, exercicios: exerciciosPayload });
      setModalAberto(false);
      selecionarAluno(alunoSelecionado);
    } finally {
      setCarregando(false);
    }
  }

  const hoje = new Date();
  const fichaVencida = fichaAtual && new Date(fichaAtual.validade) < hoje;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fichas de Treino</h1>
      </div>

      {/* Busca de aluno */}
      <div className="card mb-4">
        <label className="label">Selecionar aluno</label>
        <div className="relative">
          <input className="input" placeholder="Buscar por nome..." value={buscaAluno}
            onChange={(e) => { setBuscaAluno(e.target.value); setAlunoSelecionado(null); }} />
          {alunos.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 divide-y max-h-48 overflow-y-auto">
              {alunos.map((a) => (
                <button key={a.id} className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50"
                  onClick={() => selecionarAluno(a)}>
                  {a.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {alunoSelecionado && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ficha de {alunoSelecionado.nome}</h2>
            <button className="btn-primary" onClick={abrirNovaFicha}>+ Nova Ficha</button>
          </div>

          {fichaAtual ? (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-500">Ficha ativa · Instrutor: {fichaAtual.instrutor?.usuario?.nome}</span>
                  <p className="text-sm">
                    Validade: {formatarData(fichaAtual.validade)}
                    {fichaVencida && <span className="ml-2 badge-vencido">Vencida! Renove a ficha.</span>}
                  </p>
                </div>
              </div>

              {/* Abas de divisões */}
              {[...new Set(fichaAtual.exercicios.map((e) => e.divisao))].map((div) => (
                <div key={div} className="mb-4">
                  <h3 className="font-semibold text-primary-800 mb-2 text-sm uppercase tracking-wide">Treino {div}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Exercício</th>
                          <th className="px-3 py-2 text-left">Grupo</th>
                          <th className="px-3 py-2 text-center">Séries</th>
                          <th className="px-3 py-2 text-center">Reps</th>
                          <th className="px-3 py-2 text-center">Carga</th>
                          <th className="px-3 py-2 text-center">Descanso</th>
                          <th className="px-3 py-2 text-left">Obs.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {fichaAtual.exercicios.filter((e) => e.divisao === div).map((ex) => (
                          <tr key={ex.id}>
                            <td className="px-3 py-2 font-medium">{ex.exercicio.nome}</td>
                            <td className="px-3 py-2 text-gray-500">{ex.exercicio.grupoMuscular}</td>
                            <td className="px-3 py-2 text-center">{ex.series}</td>
                            <td className="px-3 py-2 text-center">{ex.repeticoes}</td>
                            <td className="px-3 py-2 text-center">{ex.carga || '-'}</td>
                            <td className="px-3 py-2 text-center">{ex.descanso || '-'}</td>
                            <td className="px-3 py-2 text-gray-500">{ex.observacao || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 text-gray-500">Nenhuma ficha ativa. Crie uma nova ficha.</div>
          )}

          {historico.filter((f) => f.status === 'ARQUIVADA').length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Histórico de fichas arquivadas</h3>
              <div className="space-y-2">
                {historico.filter((f) => f.status === 'ARQUIVADA').map((f) => (
                  <div key={f.id} className="card py-3 px-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Criada em {formatarData(f.criadoEm)} · Validade: {formatarData(f.validade)}</span>
                    <span className="badge-inativo">Arquivada</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal nova ficha */}
      <Modal aberto={modalAberto} titulo="Nova Ficha de Treino" onFechar={() => setModalAberto(false)} tamanho="xl">
        <div className="space-y-4">
          <div>
            <label className="label">Validade da ficha *</label>
            <input type="date" className="input max-w-xs" value={validade}
              min={new Date().toISOString().split('T')[0]} onChange={(e) => setValidade(e.target.value)} />
          </div>

          {/* Abas divisões */}
          <div className="flex items-center gap-2 flex-wrap">
            {divisoes.map((d, i) => (
              <button key={i} onClick={() => setDivisaoAtiva(i)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${divisaoAtiva === i ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Treino {d.letra}
              </button>
            ))}
            {divisoes.length < 6 && (
              <button onClick={adicionarDivisao} className="btn btn-ghost btn-sm">+ Divisão</button>
            )}
          </div>

          {/* Busca de exercícios */}
          <div>
            <label className="label">Adicionar exercício ao Treino {divisoes[divisaoAtiva]?.letra}</label>
            <input className="input mb-2" placeholder="Buscar exercício..." value={buscaExercicio}
              onChange={(e) => setBuscaExercicio(e.target.value)} />
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {exerciciosBiblioteca.slice(0, 10).map((ex) => (
                <button key={ex.id} onClick={() => adicionarExercicio(ex)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 flex items-center justify-between">
                  <span>{ex.nome}</span>
                  <span className="text-xs text-gray-400">{ex.grupoMuscular}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exercícios adicionados */}
          {divisoes[divisaoAtiva]?.exercicios.length > 0 && (
            <div className="space-y-2">
              {divisoes[divisaoAtiva].exercicios.map((ex, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{ex.nome}</span>
                    <button onClick={() => removerExercicio(divisaoAtiva, i)} className="text-red-500 hover:text-red-700 text-xs">Remover</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Séries</label>
                      <input type="number" className="input py-1" value={ex.series}
                        onChange={(e) => atualizarExercicio(divisaoAtiva, i, 'series', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Reps</label>
                      <input className="input py-1" value={ex.repeticoes}
                        onChange={(e) => atualizarExercicio(divisaoAtiva, i, 'repeticoes', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Carga</label>
                      <input className="input py-1" value={ex.carga}
                        onChange={(e) => atualizarExercicio(divisaoAtiva, i, 'carga', e.target.value)} placeholder="kg" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Descanso</label>
                      <input className="input py-1" value={ex.descanso}
                        onChange={(e) => atualizarExercicio(divisaoAtiva, i, 'descanso', e.target.value)} placeholder="60s" />
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <label className="text-xs text-gray-500">Observação</label>
                      <input className="input py-1" value={ex.observacao}
                        onChange={(e) => atualizarExercicio(divisaoAtiva, i, 'observacao', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarFicha} disabled={carregando || !validade}>
              {carregando ? 'Salvando...' : 'Salvar Ficha'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import api from '../services/api';
import { formatarMoeda, formatarData } from '../utils/formatters';

const TIPOS = [
  { key: 'receita', label: '💰 Receita', descricao: 'Total recebido por forma de pagamento' },
  { key: 'inadimplencia', label: '⚠️ Inadimplência', descricao: 'Alunos devedores e dias de atraso' },
  { key: 'frequencia', label: '📅 Frequência', descricao: 'Check-ins por dia e horário de pico' },
  { key: 'alunos', label: '👥 Alunos', descricao: 'Novas matrículas × cancelamentos' },
];

export default function Relatorios() {
  const [tipo, setTipo] = useState('receita');
  const [filtros, setFiltros] = useState({ inicio: '', fim: '' });
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function gerar() {
    setCarregando(true);
    try {
      const { data } = await api.get(`/relatorios/${tipo}`, { params: filtros });
      setDados({ tipo, ...data });
    } finally {
      setCarregando(false);
    }
  }

  async function exportarPDF() {
    const params = new URLSearchParams({ ...filtros }).toString();
    const token = localStorage.getItem('gymtech_token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/relatorios/${tipo}/pdf?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gymtech-${tipo}.pdf`;
    link.click();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>

      {/* Seletor de tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {TIPOS.map((t) => (
          <button key={t.key} onClick={() => { setTipo(t.key); setDados(null); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${tipo === t.key ? 'border-primary-800 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200'}`}>
            <p className="font-medium text-sm">{t.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.descricao}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="label">Data início</label>
            <input type="date" className="input" value={filtros.inicio}
              onChange={(e) => setFiltros((f) => ({ ...f, inicio: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="label">Data fim</label>
            <input type="date" className="input" value={filtros.fim}
              onChange={(e) => setFiltros((f) => ({ ...f, fim: e.target.value }))} />
          </div>
          <button className="btn-primary" onClick={gerar} disabled={carregando}>
            {carregando ? 'Gerando...' : 'Gerar relatório'}
          </button>
          {dados && (
            <button className="btn-secondary" onClick={exportarPDF}>Exportar PDF</button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {dados && (
        <div className="card">
          {/* Receita */}
          {dados.tipo === 'receita' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Receita</h2>
                <span className="text-2xl font-bold text-green-700">{formatarMoeda(dados.totalGeral)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {Object.entries(dados.porForma || {}).map(([forma, valor]) => (
                  <div key={forma} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{forma}</p>
                    <p className="font-bold text-lg">{formatarMoeda(valor)}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Aluno</th>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                      <th className="px-4 py-2 text-left">Forma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(dados.cobranças || []).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{c.matricula?.aluno?.usuario?.nome}</td>
                        <td className="px-4 py-2">{formatarData(c.dataPagamento)}</td>
                        <td className="px-4 py-2 text-right">{formatarMoeda(c.valor)}</td>
                        <td className="px-4 py-2">{c.formaPagamento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inadimplência */}
          {dados.tipo === 'inadimplencia' && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Inadimplentes ({(dados || []).length})</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Aluno</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                    <th className="px-4 py-2 text-left">Vencimento</th>
                    <th className="px-4 py-2 text-right">Dias em atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(Array.isArray(dados) ? dados : []).map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{a.nome}</td>
                      <td className="px-4 py-2 text-right">{formatarMoeda(a.valor)}</td>
                      <td className="px-4 py-2">{formatarData(a.vencimento)}</td>
                      <td className="px-4 py-2 text-right text-red-600 font-semibold">{a.diasAtraso} dias</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Frequência */}
          {dados.tipo === 'frequencia' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Total de entradas</p>
                  <p className="text-3xl font-bold text-primary-800">{dados.total}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Horário de pico</p>
                  <p className="text-3xl font-bold text-primary-800">{dados.horaPico || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Dias com registro</p>
                  <p className="text-3xl font-bold text-primary-800">{Object.keys(dados.porDia || {}).length}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-right">Check-ins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(dados.porDia || {}).sort().map(([dia, qtd]) => (
                      <tr key={dia}>
                        <td className="px-4 py-2">{formatarData(dia)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{qtd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alunos */}
          {dados.tipo === 'alunos' && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Matrículas no Período</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
                  <p className="text-sm text-green-700 font-medium">Novas matrículas</p>
                  <p className="text-5xl font-bold text-green-700 mt-2">{dados.novasMatriculas}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
                  <p className="text-sm text-red-700 font-medium">Cancelamentos</p>
                  <p className="text-5xl font-bold text-red-700 mt-2">{dados.cancelamentos}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

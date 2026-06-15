import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../services/api';
import { formatarData, formatarMoeda } from '../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Card({ titulo, valor, cor = 'primary', onClick }) {
  const cores = {
    primary: 'from-primary-700 to-primary-800',
    green: 'from-green-600 to-green-700',
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
  };
  return (
    <div
      className={`bg-gradient-to-br ${cores[cor]} text-white rounded-xl p-5 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <p className="text-sm font-medium opacity-80">{titulo}</p>
      <p className="text-3xl font-bold mt-1">{valor}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setDados(data);
      setCarregando(false);
    });
  }, []);

  if (carregando) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>;
  if (!dados) return null;

  // Preparar dados do gráfico dos últimos 30 dias
  const hoje = new Date();
  const labels = [];
  const valores = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    valores.push(dados.frequencia30Dias[key] || 0);
  }

  const chartData = {
    labels,
    datasets: [{
      label: 'Check-ins',
      data: valores,
      backgroundColor: '#1565C0',
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { ticks: { maxTicksLimit: 10 } },
    },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card titulo="Alunos Ativos" valor={dados.alunosAtivos} cor="primary" />
        <Card titulo="Inadimplentes" valor={dados.inadimplentes} cor="red"
          onClick={() => navigate('/alunos?status=INADIMPLENTE')} />
        <Card titulo="Check-ins Hoje" valor={dados.checkinsHoje} cor="blue" />
        <Card titulo="Receita do Mês" valor={formatarMoeda(dados.receitaMes)} cor="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de frequência */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">Frequência — últimos 30 dias</h2>
          {valores.every((v) => v === 0) ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Sem registros no período.
            </div>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Vencimentos próximos */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Vencimentos em 7 dias</h2>
          {dados.vencimentosProximos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum vencimento próximo.</p>
          ) : (
            <div className="space-y-3">
              {dados.vencimentosProximos.map((v) => (
                <div key={v.cobrancaId} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{v.nome}</p>
                    <p className="text-xs text-gray-500">{formatarData(v.vencimento)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{formatarMoeda(v.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

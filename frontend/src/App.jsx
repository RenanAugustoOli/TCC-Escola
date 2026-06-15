import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alunos from './pages/Alunos';
import AlunoForm from './pages/AlunoForm';
import AlunoDetalhe from './pages/AlunoDetalhe';
import Funcionarios from './pages/Funcionarios';
import Planos from './pages/Planos';
import Matriculas from './pages/Matriculas';
import Financeiro from './pages/Financeiro';
import FichaTreino from './pages/FichaTreino';
import MeuTreino from './pages/MeuTreino';
import Checkin from './pages/Checkin';
import Relatorios from './pages/Relatorios';

function AppLayout({ children, perfis }) {
  return (
    <ProtectedRoute perfis={perfis}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA']}><Dashboard /></AppLayout>
          } />

          <Route path="/alunos" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUTOR']}><Alunos /></AppLayout>
          } />
          <Route path="/alunos/novo" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA']}><AlunoForm /></AppLayout>
          } />
          <Route path="/alunos/:id" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA', 'INSTRUTOR']}><AlunoDetalhe /></AppLayout>
          } />
          <Route path="/alunos/:id/editar" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA']}><AlunoForm /></AppLayout>
          } />

          <Route path="/funcionarios" element={
            <AppLayout perfis={['ADMINISTRADOR']}><Funcionarios /></AppLayout>
          } />

          <Route path="/planos" element={
            <AppLayout perfis={['ADMINISTRADOR']}><Planos /></AppLayout>
          } />

          <Route path="/matriculas" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA']}><Matriculas /></AppLayout>
          } />

          <Route path="/financeiro" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA']}><Financeiro /></AppLayout>
          } />

          <Route path="/fichas" element={
            <AppLayout perfis={['ADMINISTRADOR', 'INSTRUTOR']}><FichaTreino /></AppLayout>
          } />

          <Route path="/meu-treino" element={
            <AppLayout perfis={['ALUNO']}><MeuTreino /></AppLayout>
          } />

          <Route path="/checkin" element={
            <AppLayout perfis={['ADMINISTRADOR', 'RECEPCIONISTA']}><Checkin /></AppLayout>
          } />

          <Route path="/relatorios" element={
            <AppLayout perfis={['ADMINISTRADOR']}><Relatorios /></AppLayout>
          } />

          <Route path="/sem-acesso" element={
            <div className="flex items-center justify-center h-screen flex-col gap-4 text-center px-4">
              <p className="text-5xl">🚫</p>
              <h1 className="text-2xl font-bold text-gray-900">Acesso não autorizado</h1>
              <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
              <a href="/login" className="btn-primary">Voltar ao login</a>
            </div>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, perfis }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to="/sem-acesso" replace />;

  return children;
}

import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem('gymtech_usuario');
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('gymtech_token', data.token);
    localStorage.setItem('gymtech_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gymtech_token');
    localStorage.removeItem('gymtech_usuario');
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

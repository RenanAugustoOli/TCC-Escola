export function formatarCPF(cpf) {
  const d = cpf.replace(/\D/g, '');
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarTelefone(tel) {
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
}

export function formatarData(data) {
  if (!data) return '-';
  return new Date(data).toLocaleDateString('pt-BR');
}

export function formatarDataHora(data) {
  if (!data) return '-';
  return new Date(data).toLocaleString('pt-BR');
}

export function statusLabel(status) {
  const map = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    INADIMPLENTE: 'Inadimplente',
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    VENCIDO: 'Vencido',
    CANCELADO: 'Cancelado',
    ADMINISTRADOR: 'Administrador',
    RECEPCIONISTA: 'Recepcionista',
    INSTRUTOR: 'Instrutor',
    ALUNO: 'Aluno',
  };
  return map[status] || status;
}

export function perfilRedirecionamento(perfil) {
  if (perfil === 'ALUNO') return '/meu-treino';
  if (perfil === 'INSTRUTOR') return '/alunos';
  return '/dashboard';
}

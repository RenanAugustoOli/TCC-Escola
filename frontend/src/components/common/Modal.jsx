import { useEffect } from 'react';

export default function Modal({ aberto, titulo, onFechar, children, tamanho = 'md' }) {
  useEffect(() => {
    if (aberto) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  if (!aberto) return null;

  const larguras = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${larguras[tamanho]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Paginacao({ pagina, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onChange(pagina - 1)}
        disabled={pagina === 1}
        className="btn btn-ghost btn-sm"
      >
        ‹ Anterior
      </button>
      <span className="text-sm text-gray-600">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        onClick={() => onChange(pagina + 1)}
        disabled={pagina === totalPaginas}
        className="btn btn-ghost btn-sm"
      >
        Próxima ›
      </button>
    </div>
  );
}

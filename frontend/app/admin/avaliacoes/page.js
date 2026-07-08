"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminAvaliacoes() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadAvaliacoes(token);
  }, []);

  async function loadAvaliacoes(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/avaliacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAvaliacoes(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta avaliacao?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/avaliacoes/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setAvaliacoes(prev => prev.filter(a => a.id !== id));
    else alert("Erro ao excluir avaliacao");
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
        <Link href="/admin" className="text-gray-300 hover:text-white">Dashboard</Link>
        <span className="text-gray-600">/</span>
        <span className="font-bold">Avaliacoes</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Gestao de Avaliacoes ({avaliacoes.length})</h1>

        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Espaco</th>
                <th className="text-left p-4">Usuario</th>
                <th className="text-left p-4">Nota</th>
                <th className="text-left p-4">Comentario</th>
                <th className="text-left p-4">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {avaliacoes.map(a => (
                <tr key={a.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4 text-gray-400">{a.id}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.tipoAvaliacao === "LOCATARIO_AVALIA_ESPACO" ? "bg-blue-700 text-blue-200" : "bg-purple-700 text-purple-200"
                    }`}>
                      {a.tipoAvaliacao === "LOCATARIO_AVALIA_ESPACO" ? "Espaco" : "Locatario"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{a.Space?.name || "-"}</td>
                  <td className="p-4 text-gray-300">{a.User?.name || "-"}</td>
                  <td className="p-4">{"⭐".repeat(a.nota)}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{a.comentario || "-"}</td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(a.id)}
                      className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1 rounded-lg">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

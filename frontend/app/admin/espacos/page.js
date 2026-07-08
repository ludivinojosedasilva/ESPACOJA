"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminEspacos() {
  const router = useRouter();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadSpaces(token);
  }, []);

  async function loadSpaces(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSpaces(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este espaco e todas as suas reservas?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/spaces/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setSpaces(prev => prev.filter(s => s.id !== id));
    else alert("Erro ao excluir espaco");
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
        <Link href="/admin" className="text-gray-300 hover:text-white">Dashboard</Link>
        <span className="text-gray-600">/</span>
        <span className="font-bold">Espacos</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Gestao de Espacos ({spaces.length})</h1>

        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Localizacao</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Proprietario</th>
                <th className="text-right p-4">Preco/h</th>
                <th className="text-left p-4">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {spaces.map(s => (
                <tr key={s.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4 text-gray-400">{s.id}</td>
                  <td className="p-4 font-medium">{s.name}</td>
                  <td className="p-4 text-gray-300">{s.location}</td>
                  <td className="p-4 text-gray-300">{s.TipoEspaco?.nome || "-"}</td>
                  <td className="p-4 text-gray-300">{s.User?.name || "-"}</td>
                  <td className="p-4 text-right text-green-400 font-bold">
                    R$ {parseFloat(s.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(s.id)}
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

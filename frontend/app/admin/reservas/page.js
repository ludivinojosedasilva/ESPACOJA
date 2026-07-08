"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminReservas() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadReservations(token);
  }, []);

  async function loadReservations(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setReservations(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta reserva?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reservations/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setReservations(prev => prev.filter(r => r.id !== id));
    else alert("Erro ao excluir reserva");
  }

  async function handleStatus(id, status) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  function getStatusColor(status) {
    switch (status) {
      case "CONFIRMADA": return "bg-green-700 text-green-200";
      case "PENDENTE":   return "bg-yellow-700 text-yellow-200";
      case "FINALIZADA": return "bg-blue-700 text-blue-200";
      case "CANCELADA":  return "bg-red-700 text-red-200";
      default:           return "bg-gray-700 text-gray-200";
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
        <Link href="/admin" className="text-gray-300 hover:text-white">Dashboard</Link>
        <span className="text-gray-600">/</span>
        <span className="font-bold">Reservas</span>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Gestao de Reservas ({reservations.length})</h1>

        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Espaco</th>
                <th className="text-left p-4">Locatario</th>
                <th className="text-left p-4">Inicio</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Valor</th>
                <th className="text-left p-4">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-4 text-gray-400">{r.id}</td>
                  <td className="p-4 font-medium">{r.Space?.name || "-"}</td>
                  <td className="p-4 text-gray-300">{r.User?.name || "-"}</td>
                  <td className="p-4 text-gray-300">{new Date(r.startDateTime).toLocaleString("pt-BR")}</td>
                  <td className="p-4">
                    <select
                      value={r.status}
                      onChange={e => handleStatus(r.id, e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                    >
                      {["PENDENTE","CONFIRMADA","FINALIZADA","CANCELADA"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right text-green-400">
                    R$ {parseFloat(r.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(r.id)}
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

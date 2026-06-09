"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function MyReservations() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadReservations(token);
  }, []);

  async function loadReservations(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.ok ? await res.json() : [];
      setReservations(data);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "CONFIRMADA":  return "bg-green-100 text-green-700 border-green-200";
      case "PENDENTE":    return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "FINALIZADA":  return "bg-blue-100 text-blue-700 border-blue-200";
      case "CANCELADA":   return "bg-red-100 text-red-700 border-red-200";
      default:            return "bg-gray-100 text-gray-700";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "CONFIRMADA":  return "✅ Confirmada";
      case "PENDENTE":    return "⏳ Pendente";
      case "FINALIZADA":  return "🏁 Finalizada";
      case "CANCELADA":   return "❌ Cancelada";
      default:            return status;
    }
  }

  const filtradas = filtro === "TODOS"
    ? reservations
    : reservations.filter((r) => r.status === filtro);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando reservas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📅 Minhas Reservas</h1>
            <p className="text-gray-500 mt-1">{reservations.length} reserva(s) encontrada(s)</p>
          </div>

          {/* FILTROS */}
          <div className="flex gap-2 flex-wrap">
            {["TODOS", "CONFIRMADA", "PENDENTE", "FINALIZADA", "CANCELADA"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-1 rounded-full text-sm font-medium border transition ${
                  filtro === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {f === "TODOS" ? "Todos" : getStatusLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p>Nenhuma reserva encontrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtradas.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    🏢
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {r.Space?.name || "Espaço"}
                    </h3>
                    <p className="text-gray-500 text-sm">📍 {r.Space?.location}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      🕐 {new Date(r.startDateTime).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-gray-400 text-sm">
                      até {new Date(r.endDateTime).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(r.status)}`}>
                    {getStatusLabel(r.status)}
                  </span>
                  <p className="text-green-600 font-bold text-lg">
                    R$ {parseFloat(r.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  {r.valorDesconto > 0 && (
                    <p className="text-xs text-blue-500">
                      Desconto: R$ {parseFloat(r.valorDesconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {r.valorMulta > 0 && (
                    <p className="text-xs text-red-500">
                      Multa: R$ {parseFloat(r.valorMulta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

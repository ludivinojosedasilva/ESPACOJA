"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadReservations(token);
  }, []);

  async function loadReservations(token) {
    try {
      const spacesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/spaces`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const spaces = spacesRes.ok ? await spacesRes.json() : [];

      const allReservations = [];
      for (const space of spaces) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reservations/espaco/${space.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          data.forEach(r => r.spaceName = space.name);
          allReservations.push(...data);
        }
      }

      allReservations.sort((a, b) =>
        new Date(b.startDateTime) - new Date(a.startDateTime)
      );
      setReservations(allReservations);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setUpdating(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );
      if (res.ok) {
        setReservations(prev =>
          prev.map(r => r.id === id ? { ...r, status } : r)
        );
      } else {
        alert("Erro ao atualizar status");
      }
    } catch {
      alert("Erro ao conectar com servidor");
    } finally {
      setUpdating(null);
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
      case "CONFIRMADA":  return "Confirmada";
      case "PENDENTE":    return "Pendente";
      case "FINALIZADA":  return "Finalizada";
      case "CANCELADA":   return "Cancelada";
      default:            return status;
    }
  }

  const filtradas = filtro === "TODOS"
    ? reservations
    : reservations.filter(r => r.status === filtro);

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
            <h1 className="text-3xl font-bold text-gray-800">Reservas dos Meus Espacos</h1>
            <p className="text-gray-500 mt-1">{reservations.length} reserva(s) no total</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {["TODOS", "PENDENTE", "CONFIRMADA", "FINALIZADA", "CANCELADA"].map(f => (
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
            {filtradas.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{r.spaceName}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(r.status)}`}>
                        {getStatusLabel(r.status)}
                      </span>
                    </div>

                    <p className="text-gray-500 text-sm">
                      Solicitado por: <span className="font-medium text-gray-700">{r.User?.name || "Locatario"}</span>
                    </p>
                    <p className="text-gray-400 text-sm">{r.User?.email}</p>

                    <div className="mt-2 flex gap-4">
                      <p className="text-gray-500 text-sm">
                        Inicio: <span className="font-medium">{new Date(r.startDateTime).toLocaleString("pt-BR")}</span>
                      </p>
                      <p className="text-gray-500 text-sm">
                        Fim: <span className="font-medium">{new Date(r.endDateTime).toLocaleString("pt-BR")}</span>
                      </p>
                    </div>

                    <p className="text-green-600 font-bold text-lg mt-2">
                      R$ {parseFloat(r.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* ACOES DO PROPRIETARIO */}
                  {r.status === "PENDENTE" && (
                    <div className="flex flex-col gap-2 min-w-fit">
                      <button
                        onClick={() => updateStatus(r.id, "CONFIRMADA")}
                        disabled={updating === r.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold px-5 py-2 rounded-lg transition"
                      >
                        {updating === r.id ? "..." : "Confirmar"}
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "CANCELADA")}
                        disabled={updating === r.id}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold px-5 py-2 rounded-lg transition"
                      >
                        {updating === r.id ? "..." : "Cancelar"}
                      </button>
                    </div>
                  )}

                  {r.status === "CONFIRMADA" && (
                    <div className="flex flex-col gap-2 min-w-fit">
                      <button
                        onClick={() => updateStatus(r.id, "FINALIZADA")}
                        disabled={updating === r.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-5 py-2 rounded-lg transition"
                      >
                        {updating === r.id ? "..." : "Finalizar"}
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "CANCELADA")}
                        disabled={updating === r.id}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold px-5 py-2 rounded-lg transition"
                      >
                        {updating === r.id ? "..." : "Cancelar"}
                      </button>
                    </div>
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
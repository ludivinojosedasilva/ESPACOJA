"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData(token);
  }, []);

  async function loadData(token) {
    try {
      const [profileRes, resRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-reservations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!profileRes.ok) { router.push("/login"); return; }

      const profileData = await profileRes.json();
      const resData = resRes.ok ? await resRes.json() : [];

      setUser(profileData);
      setReservations(resData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "CONFIRMADA":  return "bg-green-100 text-green-700";
      case "PENDENTE":    return "bg-yellow-100 text-yellow-700";
      case "FINALIZADA":  return "bg-blue-100 text-blue-700";
      case "CANCELADA":   return "bg-red-100 text-red-700";
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

  const stats = {
    total:      reservations.length,
    confirmada: reservations.filter((r) => r.status === "CONFIRMADA").length,
    pendente:   reservations.filter((r) => r.status === "PENDENTE").length,
    finalizada: reservations.filter((r) => r.status === "FINALIZADA").length,
    cancelada:  reservations.filter((r) => r.status === "CANCELADA").length,
    gasto:      reservations
      .filter((r) => r.status !== "CANCELADA")
      .reduce((acc, r) => acc + parseFloat(r.valorTotal || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* CARD DE PERFIL */}
        <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {user?.tipoUsuario === "PROPRIETARIO" ? "🏠 Proprietário" : "👤 Locatário"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Telefone</p>
            <p className="font-semibold">{user?.telefone || "—"}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-gray-500 text-sm mt-1">Total de Reservas</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.confirmada}</p>
            <p className="text-gray-500 text-sm mt-1">Confirmadas</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.finalizada}</p>
            <p className="text-gray-500 text-sm mt-1">Finalizadas</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-gray-700">
              R$ {stats.gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-gray-500 text-sm mt-1">Total Gasto</p>
          </div>
        </div>

        {/* RESERVAS */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800">📅 Minhas Reservas</h2>

          {reservations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-3">📭</p>
              <p>Nenhuma reserva encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {r.Space?.name || "Espaço"}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      📍 {r.Space?.location}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      🕐 {new Date(r.startDateTime).toLocaleString("pt-BR")}
                      {" → "}
                      {new Date(r.endDateTime).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(r.status)}`}>
                      {getStatusLabel(r.status)}
                    </span>
                    <p className="text-green-600 font-bold">
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
    </div>
  );
}

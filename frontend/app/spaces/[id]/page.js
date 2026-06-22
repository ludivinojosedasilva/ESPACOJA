"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function SpaceDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [space, setSpace] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ startDateTime: "", endDateTime: "" });

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const spaceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`);
      const spaceData = await spaceRes.json();

      if (spaceRes.ok) {
        setSpace(spaceData);
      } else {
        setSpace(null);
      }

      const avalRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/avaliacoes/espaco/${id}`);
      if (avalRes.ok) setAvaliacoes(await avalRes.json());

      const token = localStorage.getItem("token");
      if (token) {
        const resRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reservations/espaco/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resRes.ok) setReservations(await resRes.json());
      }
    } catch {
      setSpace(null);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function formatarDuracao(horas) {
    const dias = Math.floor(horas / 24);
    const horasRestantes = Math.round((horas % 24) * 10) / 10;

    if (dias === 0) {
      return `${horasRestantes} hora(s)`;
    }
    if (horasRestantes === 0) {
      return `${dias} dia(s)`;
    }
    return `${dias} dia(s) e ${horasRestantes} hora(s)`;
  }

  async function handleReserve(e) {
    e.preventDefault();
    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    if (end <= start) { alert("Data/hora invalida"); return; }

    const diffHoras = (end - start) / 3600000;

    // Confirmação extra para reservas muito longas (provavel engano de seleção de dia)
    if (diffHoras > 24) {
      const confirmar = confirm(
        `Atencao: esta reserva tem duracao de ${formatarDuracao(diffHoras)}.\n\nIsso esta correto? Clique OK para confirmar ou Cancelar para revisar as datas.`
      );
      if (!confirmar) return;
    }

    const token = localStorage.getItem("token");
    if (!token) { alert("Faca login para reservar"); router.push("/login"); return; }

    setSending(true);
    try {
      const valorBruto = diffHoras * parseFloat(space.price);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          spaceId: space.id,
          dataHoraInicio: form.startDateTime,
          dataHoraFim: form.endDateTime,
          valorTotal: valorBruto.toFixed(2)
        })
      });

      const data = await res.json();
      if (!res.ok) { alert(data.message || "Erro ao reservar"); return; }

      if (data.descontoAplicado) {
        alert("Reserva criada com 10% de desconto por antecedencia!");
      } else {
        alert("Reserva criada com sucesso!");
      }

      setForm({ startDateTime: "", endDateTime: "" });
      setShowForm(false);
      loadData();
    } catch {
      alert("Erro ao reservar");
    } finally {
      setSending(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "CONFIRMADA": return "bg-green-100 text-green-700";
      case "PENDENTE":   return "bg-yellow-100 text-yellow-700";
      case "FINALIZADA": return "bg-blue-100 text-blue-700";
      case "CANCELADA":  return "bg-red-100 text-red-700";
      default:           return "bg-gray-100 text-gray-700";
    }
  }

  function renderEstrelas(nota) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < nota ? "text-yellow-400" : "text-gray-300"}>⭐</span>
    ));
  }

  const mediaNotas = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando espaco...</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
        <p className="text-2xl text-gray-500">Espaco nao encontrado</p>
        <button onClick={() => router.push("/dashboard")} className="bg-blue-500 text-white px-6 py-2 rounded-lg">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const imageUrl = space.image ? `${process.env.NEXT_PUBLIC_API_URL}${space.image}` : null;

  // Calculo em tempo real para exibicao no formulario
  let resumoReserva = null;
  if (form.startDateTime && form.endDateTime) {
    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    if (end > start) {
      const diffHoras = (end - start) / 3600000;
      const valorBruto = diffHoras * parseFloat(space.price);
      const diasAntecedencia = Math.floor((start - new Date()) / (1000 * 60 * 60 * 24));
      const temDesconto = diasAntecedencia >= 20;
      const valorComDesconto = temDesconto ? valorBruto * 0.9 : valorBruto;
      const duracaoLonga = diffHoras > 24;

      resumoReserva = { diffHoras, valorBruto, diasAntecedencia, temDesconto, valorComDesconto, duracaoLonga };
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        <button onClick={() => router.back()} className="text-blue-500 mb-6 hover:underline">
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {imageUrl ? (
            <img src={imageUrl} alt={space.name} className="w-full h-80 object-cover" />
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-8xl">🏢</span>
            </div>
          )}

          <div className="p-8">

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{space.name}</h1>
                <p className="text-gray-500 mt-1">📍 {space.location}</p>
                {space.TipoEspaco && (
                  <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    {space.TipoEspaco.nome}
                  </span>
                )}
                {mediaNotas && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="font-bold text-gray-700">{mediaNotas}</span>
                    <span className="text-gray-400 text-sm">({avaliacoes.length} avaliacao(oes))</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  R$ {parseFloat(space.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-gray-400 text-sm">por hora</p>
              </div>
            </div>

            {space.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{space.description}</p>
            )}

            {space.comodidades && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-gray-700 mb-1">Comodidades</p>
                <p className="text-gray-600 text-sm">{space.comodidades}</p>
              </div>
            )}

            {space.User && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-gray-700 mb-1">Proprietario</p>
                <p className="text-gray-600">{space.User.name}</p>
                <p className="text-gray-400 text-sm">{space.User.email}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-800 mb-1">📋 Politica de Reservas</p>
              <ul className="text-amber-700 text-sm space-y-1">
                <li>• Reservas feitas com 20 dias ou mais de antecedencia tem 10% de desconto</li>
                <li>• Cancelamentos com 5 dias ou menos de antecedencia estao sujeitos a multa</li>
                {space.TipoEspaco?.percentualMulta && (
                  <li>• Multa para esta categoria ({space.TipoEspaco.nome}): <strong>{parseFloat(space.TipoEspaco.percentualMulta)}%</strong></li>
                )}
              </ul>
            </div>

            {avaliacoes.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-800">Avaliacoes ({avaliacoes.length})</h2>
                <div className="space-y-3">
                  {avaliacoes.map((a) => (
                    <div key={a.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-700">{a.User?.name || "Usuario"}</span>
                        <div className="flex">{renderEstrelas(a.nota)}</div>
                      </div>
                      {a.comentario && <p className="text-gray-500 text-sm mt-1">{a.comentario}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reservations.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-800">Reservas neste espaco</h2>
                <div className="space-y-2">
                  {reservations.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        {new Date(r.startDateTime).toLocaleString("pt-BR")} →{" "}
                        {new Date(r.endDateTime).toLocaleString("pt-BR")}
                      </p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-xl transition text-lg"
              >
                Reservar este Espaco
              </button>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800">Fazer Reserva</h2>
                <form onSubmit={handleReserve} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Data e hora de inicio *</label>
                    <input
                      type="datetime-local"
                      name="startDateTime"
                      value={form.startDateTime}
                      onChange={handleChange}
                      className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Data e hora de termino *</label>
                    <input
                      type="datetime-local"
                      name="endDateTime"
                      value={form.endDateTime}
                      onChange={handleChange}
                      className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      required
                    />
                  </div>

                  {resumoReserva && (
                    <div className={`border rounded-lg p-3 ${
                      resumoReserva.duracaoLonga
                        ? "bg-orange-50 border-orange-300"
                        : resumoReserva.temDesconto
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                    }`}>

                      {/* AVISO DE DURACAO LONGA - evita engano de selecao de dia */}
                      {resumoReserva.duracaoLonga && (
                        <p className="text-orange-700 text-sm font-bold mb-2">
                          ⚠️ Duracao total: {formatarDuracao(resumoReserva.diffHoras)} -- confira se as datas estao corretas
                        </p>
                      )}

                      {resumoReserva.temDesconto && (
                        <>
                          <p className="text-green-700 text-sm font-bold mb-1">
                            🎉 Desconto de 10% aplicado! (reserva com {resumoReserva.diasAntecedencia} dias de antecedencia)
                          </p>
                          <p className="text-gray-500 text-sm line-through">
                            R$ {resumoReserva.valorBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </>
                      )}

                      <p className="text-blue-700 font-bold text-lg">
                        Valor final: R$ {resumoReserva.valorComDesconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>

                      {!resumoReserva.temDesconto && resumoReserva.diasAntecedencia >= 0 && resumoReserva.diasAntecedencia < 20 && (
                        <p className="text-gray-400 text-xs mt-1">
                          Reserve com 20 dias ou mais de antecedencia e ganhe 10% de desconto
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={sending}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold p-3 rounded-lg transition"
                    >
                      {sending ? "Reservando..." : "Confirmar Reserva"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold p-3 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

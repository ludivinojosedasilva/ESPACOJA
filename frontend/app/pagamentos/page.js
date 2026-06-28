"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function PagamentosPage() {
  const router = useRouter();
  const [reservasComPendencia, setReservasComPendencia] = useState([]);
  const [notas, setNotas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(null);
  const [formaSelecionada, setFormaSelecionada] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData(token);
  }, []);

  async function loadData(token) {
    try {
      const [resRes, notasRes, pagRes, formasRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/my-reservations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/notas`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagamentos`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/formas-pagamento`)
      ]);

      const reservas = resRes.ok ? await resRes.json() : [];
      const notasData = notasRes.ok ? await notasRes.json() : [];
      const pagData = pagRes.ok ? await pagRes.json() : [];
      const formasData = formasRes.ok ? await formasRes.json() : [];

      // Mostra reservas FINALIZADAS (pagamento do servico) e CANCELADAS com multa (pagamento da multa)
      const comPendencia = reservas.filter(r =>
        r.status === "FINALIZADA" || (r.status === "CANCELADA" && parseFloat(r.valorMulta) > 0)
      );

      setReservasComPendencia(comPendencia);
      setNotas(notasData);
      setPagamentos(pagData);
      setFormasPagamento(formasData);
    } catch {
      console.log("erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  function getNotaDaReserva(reservationId) {
    return notas.find(n => n.reservationId === reservationId || n.Reservation?.id === reservationId);
  }

  function getPagamentoDaNota(notaId) {
    return pagamentos.find(p => p.notaId === notaId);
  }

  async function criarNota(reservationId, valor) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId,
          dataNota: new Date().toISOString().split("T")[0],
          valorNota: valor
        })
      });
      if (res.ok) {
        const novaNota = await res.json();
        setNotas(prev => [...prev, novaNota]);
        return novaNota;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function handlePagar(notaId) {
    if (!formaSelecionada) { alert("Selecione a forma de pagamento"); return; }
    setEnviando(true);
    const token = localStorage.getItem("token");

    try {
      const nota = notas.find(n => n.id === notaId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notaId,
          formaPagamentoId: parseInt(formaSelecionada),
          valorPagamento: nota.valorNota,
          dataPagamento: new Date().toISOString().split("T")[0]
        })
      });

      if (res.ok) {
        const novoPagamento = await res.json();
        setPagamentos(prev => [...prev, novoPagamento]);
        setModalAberto(null);
        setFormaSelecionada("");
        alert("Pagamento registado! Aguardando confirmacao do proprietario.");
      } else {
        const data = await res.json();
        alert(data.message || "Erro ao registar pagamento");
      }
    } catch {
      alert("Erro ao conectar com servidor");
    } finally {
      setEnviando(false);
    }
  }

  async function handleGerarNotaEAbrirPagamento(reserva, valor) {
    let nota = getNotaDaReserva(reserva.id);
    if (!nota) {
      nota = await criarNota(reserva.id, valor);
      if (!nota) { alert("Erro ao gerar nota fiscal"); return; }
    }
    setModalAberto(nota.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando pagamentos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pagamentos</h1>
        <p className="text-gray-500 mb-8">
          Gerencie pagamentos de reservas finalizadas e multas de cancelamento
        </p>

        {reservasComPendencia.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <p className="text-5xl mb-3">💳</p>
            <p>Nenhuma pendencia de pagamento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservasComPendencia.map((r) => {
              const isMulta = r.status === "CANCELADA";
              const valorCobranca = isMulta ? parseFloat(r.valorMulta) : parseFloat(r.valorTotal || 0);
              const nota = getNotaDaReserva(r.id);
              const pagamento = nota ? getPagamentoDaNota(nota.id) : null;
              const pago = pagamento && pagamento.status === "APROVADO";

              return (
                <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 text-lg">{r.Space?.name}</h3>
                        {isMulta && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                            Multa de Cancelamento
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">
                        {new Date(r.startDateTime).toLocaleDateString("pt-BR")} -{" "}
                        {isMulta ? "Reserva Cancelada" : "Reserva Finalizada"}
                      </p>
                      <p className={`font-bold text-lg mt-1 ${isMulta ? "text-red-600" : "text-green-600"}`}>
                        R$ {valorCobranca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div>
                      {pago ? (
                        <span className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-lg text-sm">
                          ✅ Pago via {formasPagamento.find(f => f.id === pagamento.formaPagamentoId)?.nome}
                        </span>
                      ) : pagamento && pagamento.status === "PENDENTE" ? (
                        <span className="bg-yellow-100 text-yellow-700 font-bold px-4 py-2 rounded-lg text-sm">
                          Aguardando confirmacao
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGerarNotaEAbrirPagamento(r, valorCobranca)}
                          className={`font-bold px-6 py-3 rounded-xl transition text-white ${
                            isMulta ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          Pagar Agora
                        </button>
                      )}
                    </div>
                  </div>

                  {modalAberto === nota?.id && !pago && (!pagamento || pagamento.status !== "PENDENTE") && (
                    <div className="mt-4 border-t pt-4">
                      <label className="text-sm text-gray-600 font-medium block mb-2">
                        Escolha a forma de pagamento
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {formasPagamento.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setFormaSelecionada(f.id.toString())}
                            className={`p-3 rounded-lg border text-sm font-medium transition ${
                              formaSelecionada === f.id.toString()
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                            }`}
                          >
                            {f.nome}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handlePagar(nota.id)}
                          disabled={enviando}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold px-6 py-2 rounded-lg transition"
                        >
                          {enviando ? "Processando..." : "Confirmar Pagamento"}
                        </button>
                        <button
                          onClick={() => { setModalAberto(null); setFormaSelecionada(""); }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-2 rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
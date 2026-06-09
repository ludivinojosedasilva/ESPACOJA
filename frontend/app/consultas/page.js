"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import Navbar from "../../components/Navbar";

export default function ConsultasPage() {
  const [consulta1, setConsulta1] = useState([]);
  const [consulta2, setConsulta2] = useState([]);
  const [consulta3, setConsulta3] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultas/receita-por-tipo`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultas/avaliacoes-por-espaco`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultas/reservas-por-mes`)
        ]);
        setConsulta1(r1.ok ? await r1.json() : []);
        setConsulta2(r2.ok ? await r2.json() : []);
        setConsulta3(r3.ok ? await r3.json() : []);
      } catch {
        console.log("Erro ao carregar consultas");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const fmtBRL = (v) =>
    `R$ ${parseFloat(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando consultas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Consultas SQL</h1>
          <p className="text-gray-500 mt-1">
            Resultados das 3 consultas com agregação executadas diretamente no banco de dados MySQL.
          </p>
        </div>

        {/* CONSULTA 1 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Consulta 1 — Receita por Tipo de Espaço</h2>
          <p className="text-gray-500 text-sm mb-6">
            Total arrecadado por tipo de espaço, considerando apenas pagamentos aprovados.
            Tabelas: <code>tipo_espaco</code>, <code>espaco</code>, <code>reserva</code>, <code>nota</code>, <code>pagamento</code>
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* TABELA */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-3 rounded-l">Tipo de Espaço</th>
                    <th className="text-right p-3">Pagamentos</th>
                    <th className="text-right p-3 rounded-r">Total Arrecadado</th>
                  </tr>
                </thead>
                <tbody>
                  {consulta1.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{row.tipo_espaco}</td>
                      <td className="p-3 text-right">{row.total_pagamentos}</td>
                      <td className="p-3 text-right text-green-600 font-bold">{fmtBRL(row.total_arrecadado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GRÁFICO */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consulta1}>
                <XAxis dataKey="tipo_espaco" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmtBRL(v)} />
                <Bar dataKey="total_arrecadado" fill="#1D9E75" radius={[4,4,0,0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONSULTA 2 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Consulta 2 — Avaliações por Espaço</h2>
          <p className="text-gray-500 text-sm mb-6">
            Média das avaliações por espaço, ordenado do melhor para o pior.
            Tabelas: <code>espaco</code>, <code>usuario</code>, <code>avaliacao</code>
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* TABELA */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-3 rounded-l">Espaço</th>
                    <th className="text-left p-3">Proprietário</th>
                    <th className="text-right p-3">Avaliações</th>
                    <th className="text-right p-3 rounded-r">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {consulta2.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{row.espaco}</td>
                      <td className="p-3 text-gray-500">{row.proprietario}</td>
                      <td className="p-3 text-right">{row.total_avaliacoes}</td>
                      <td className="p-3 text-right font-bold text-yellow-600">
                        {"⭐".repeat(Math.round(row.media_nota))} {parseFloat(row.media_nota).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GRÁFICO */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consulta2} layout="vertical">
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="espaco" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="media_nota" fill="#7F77DD" radius={[0,4,4,0]} name="Média" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONSULTA 3 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Consulta 3 — Reservas por Mês</h2>
          <p className="text-gray-500 text-sm mb-6">
            Volume de reservas e valor movimentado por mês (confirmadas e finalizadas).
            Tabelas: <code>reserva</code>, <code>espaco</code>, <code>tipo_espaco</code>
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* TABELA */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-3 rounded-l">Mês/Ano</th>
                    <th className="text-right p-3">Reservas</th>
                    <th className="text-right p-3 rounded-r">Valor Movimentado</th>
                  </tr>
                </thead>
                <tbody>
                  {consulta3.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{row.mes_ano}</td>
                      <td className="p-3 text-right">{row.total_reservas}</td>
                      <td className="p-3 text-right text-green-600 font-bold">{fmtBRL(row.valor_movimentado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GRÁFICO */}
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={consulta3}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes_ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, name) => name === "valor_movimentado" ? fmtBRL(v) : v} />
                <Line type="monotone" dataKey="valor_movimentado" stroke="#378ADD" strokeWidth={2} dot={{ r: 5 }} name="Valor" />
                <Line type="monotone" dataKey="total_reservas" stroke="#9F77DD" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Reservas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

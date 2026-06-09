"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function IAPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    tipo: "",
    endereco: "",
    comodidades: "",
    descricao: ""
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResultado(null);
    setErro(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ia/sugerir-preco`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Erro ao consultar IA");
        return;
      }

      setResultado(data);
    } catch {
      setErro("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  // Formata o texto da IA em HTML simples
  function formatarResposta(texto) {
    return texto
      .split("\n")
      .map((linha, i) => {
        if (linha.startsWith("**") && linha.endsWith("**")) {
          return <h4 key={i} className="font-bold text-gray-800 mt-3">{linha.replaceAll("**", "")}</h4>;
        }
        if (linha.match(/^\d\./)) {
          return <p key={i} className="mt-2 text-gray-700">{linha.replace(/\*\*/g, "")}</p>;
        }
        if (linha.startsWith("*")) {
          return <li key={i} className="ml-4 text-gray-600 list-disc">{linha.replace(/\*/g, "").trim()}</li>;
        }
        return linha ? <p key={i} className="text-gray-700 mt-1">{linha.replace(/\*\*/g, "")}</p> : <br key={i} />;
      });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">🤖 Assistente de Precificação</h1>
          <p className="text-blue-100">
            Powered by IA Generativa (Groq / LLaMA 3.3) — Informe os dados do seu espaço
            e receba uma sugestão de preço competitivo baseada no mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* FORMULÁRIO */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Dados do Espaço</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Nome do espaço *</label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex: Salão Central"
                  className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Tipo de espaço *</label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Salão de Festas">Salão de Festas</option>
                  <option value="Quadra Esportiva">Quadra Esportiva</option>
                  <option value="Auditório">Auditório</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Espaço Coworking">Espaço Coworking</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Localização *</label>
                <input
                  name="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  placeholder="Ex: Porto Alegre/RS"
                  className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Comodidades</label>
                <input
                  name="comodidades"
                  value={form.comodidades}
                  onChange={handleChange}
                  placeholder="Ex: Som, Ar-condicionado, Estacionamento"
                  className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Descrição</label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Descreva o espaço brevemente..."
                  rows={3}
                  className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold p-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Consultando IA...
                  </>
                ) : (
                  <>🤖 Obter Sugestão de Preço</>
                )}
              </button>
            </form>
          </div>

          {/* RESULTADO */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Sugestão da IA</h2>

            {!resultado && !erro && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-5xl mb-3">🤖</p>
                <p className="text-center text-sm">
                  Preencha os dados ao lado e clique em<br />
                  <strong>"Obter Sugestão de Preço"</strong>
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-blue-500">
                <p className="text-5xl mb-3 animate-bounce">🧠</p>
                <p>A IA está analisando o mercado...</p>
              </div>
            )}

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
                <p className="font-bold">❌ Erro</p>
                <p className="text-sm mt-1">{erro}</p>
              </div>
            )}

            {resultado && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-blue-500 font-bold mb-1">ESPAÇO ANALISADO</p>
                  <p className="font-semibold">{resultado.espacoAnalisado.nome}</p>
                  <p className="text-sm text-gray-500">{resultado.espacoAnalisado.tipo} — {resultado.espacoAnalisado.endereco}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Baseado em {resultado.espacosReferencia} espaços similares na plataforma
                  </p>
                </div>

                <div className="prose prose-sm max-w-none">
                  {formatarResposta(resultado.sugestao)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

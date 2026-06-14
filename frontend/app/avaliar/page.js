"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function AvaliarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceId = searchParams.get("spaceId");
  const spaceName = searchParams.get("spaceName");

  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!spaceId) { router.push("/my-reservations"); return; }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/avaliacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spaceId: parseInt(spaceId), nota, comentario })
      });

      if (res.ok) {
        alert("Avaliacao enviada com sucesso!");
        router.push("/my-reservations");
      } else {
        const data = await res.json();
        alert(data.message || "Erro ao enviar avaliacao");
      }
    } catch {
      alert("Erro ao conectar com servidor");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">

        <button
          onClick={() => router.back()}
          className="text-blue-500 mb-6 hover:underline flex items-center gap-1"
        >
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Avaliar Espaco</h1>
          <p className="text-gray-500 mb-6">{spaceName}</p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ESTRELAS */}
            <div>
              <label className="text-sm text-gray-600 font-medium block mb-3">
                Sua nota
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNota(n)}
                    className={`text-4xl transition-transform hover:scale-110 ${
                      n <= nota ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-sm mt-2">
                {nota === 1 && "Muito ruim"}
                {nota === 2 && "Ruim"}
                {nota === 3 && "Regular"}
                {nota === 4 && "Bom"}
                {nota === 5 && "Excelente!"}
              </p>
            </div>

            {/* COMENTÁRIO */}
            <div>
              <label className="text-sm text-gray-600 font-medium block mb-1">
                Comentario (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Conte como foi sua experiencia..."
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold p-4 rounded-xl transition text-lg"
            >
              {enviando ? "Enviando..." : "Enviar Avaliacao"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

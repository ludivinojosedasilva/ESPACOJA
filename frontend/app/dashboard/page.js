"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function Dashboard() {
  const router = useRouter();
  const [spaces, setSpaces] = useState([]);
  const [allSpaces, setAllSpaces] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState("todos");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData(token);
  }, []);

  async function loadData(token) {
    try {
      const [profileRes, mySpacesRes, allSpacesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/todos`)
      ]);

      if (!profileRes.ok) { router.push("/login"); return; }

      const profileData = await profileRes.json();
      const mySpacesData = mySpacesRes.ok ? await mySpacesRes.json() : [];
      const allSpacesData = allSpacesRes.ok ? await allSpacesRes.json() : [];

      setUser(profileData);
      setSpaces(mySpacesData);
      setAllSpaces(allSpacesData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir este espaco?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setSpaces((prev) => prev.filter((s) => s.id !== id));
      setAllSpaces((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert("Erro ao excluir espaco");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Carregando...</p>
      </div>
    );
  }

  const isProprietario = user?.tipoUsuario === "PROPRIETARIO";
  const displaySpaces = aba === "meus" ? spaces : allSpaces;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Ola, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-gray-500 mt-1">
              {isProprietario
                ? "Gerencie seus espacos ou explore outros disponiveis"
                : "Explore os espacos disponiveis para reservar"}
            </p>
          </div>

          {isProprietario && (
            <Link
              href="/spaces/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              + Cadastrar Espaco
            </Link>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setAba("todos")}
            className={`px-5 py-2 rounded-full font-medium transition ${
              aba === "todos"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300"
            }`}
          >
            Todos os Espacos ({allSpaces.length})
          </button>
          {isProprietario && (
            <button
              onClick={() => setAba("meus")}
              className={`px-5 py-2 rounded-full font-medium transition ${
                aba === "meus"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              Meus Espacos ({spaces.length})
            </button>
          )}
        </div>

        {displaySpaces.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <p className="text-5xl mb-3">🏗</p>
            <p className="text-lg">Nenhum espaco encontrado.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displaySpaces.map((space) => {
              const imageUrl = space.image
                ? `${process.env.NEXT_PUBLIC_API_URL}${space.image}`
                : null;

              return (
                <div key={space.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={space.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-6xl">🏢</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{space.name}</h3>
                      {space.TipoEspaco && (
                        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">
                          {space.TipoEspaco.nome}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm mb-1">📍 {space.location}</p>

                    {space.comodidades && (
                      <p className="text-gray-400 text-xs mb-3 truncate">✨ {space.comodidades}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-green-600 font-bold text-lg">
                        R$ {parseFloat(space.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        <span className="text-gray-400 text-sm font-normal">/h</span>
                      </p>

                      <div className="flex gap-2">
                        <Link
                          href={`/spaces/${space.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
                        >
                          Ver
                        </Link>
                        {aba === "meus" && (
                          <button
                            onClick={() => handleDelete(space.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 text-sm px-3 py-2 rounded-lg transition"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

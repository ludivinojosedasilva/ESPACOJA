"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    async function loadData() {
      try {
        // 🔐 PROFILE
        const profileRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const profileData = await profileRes.json();

        if (!profileRes.ok) {
          localStorage.removeItem("token");
          window.location.replace("/login");
          return;
        }

        setUser(profileData);

        // 🏠 SPACES
        const spacesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/spaces`
        );

        const spacesData = await spacesRes.json();
        setSpaces(spacesData);

      } catch (error) {
        alert("Erro ao carregar dashboard ❌");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-600">
        Carregando dashboard...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          EspaçoJá Dashboard
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Olá, {user?.name}
          </span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Sair
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 max-w-6xl mx-auto">

        {/* INFO BOX */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-lg font-semibold">
            Bem-vindo ao EspaçoJá 🚀
          </h2>

          <p className="text-gray-600">
            Aqui você encontra todos os espaços disponíveis.
          </p>
        </div>

        {/* SPACES GRID */}
        <h2 className="text-xl font-bold mb-4">
          Espaços disponíveis
        </h2>

        {spaces.length === 0 ? (
          <p className="text-gray-500">
            Nenhum espaço cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-md transition"
              >
                <h3 className="font-bold text-lg">
                  {space.name}
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  {space.description}
                </p>

                <p className="text-sm mt-2">
                  📍 {space.location}
                </p>

                <p className="font-semibold mt-2 text-green-600">
                  R$ {space.price}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    async function loadProfile() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          localStorage.removeItem("token");
          window.location.replace("/login");
          return;
        }

        setUser(data);

      } catch (error) {
        alert("Erro ao carregar perfil ❌");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-600">
        Carregando perfil...
      </p>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">

        <h1 className="text-2xl font-bold mb-6">
          Meu Perfil
        </h1>

        <div className="space-y-2 mb-6">
          <p>
            <strong>Nome:</strong> {user.name}
          </p>

          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition"
        >
          Sair
        </button>

      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "/profile";
    }
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, password })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Usuário criado com sucesso 🚀");
        window.location.href = "/login";
      } else {
        alert(data.message);
      }

    } catch (error) {
      alert("Erro ao conectar com servidor ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

        <h1 className="text-2xl font-bold text-center mb-6">
          Criar Conta
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">

          <input
            type="text"
            placeholder="Nome"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
          >
            {loading ? "Criando..." : "Cadastrar"}
          </button>

        </form>

        <p className="text-center mt-4 text-sm">
          Já tem conta?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Fazer login
          </a>
        </p>

      </div>
    </div>
  );
}
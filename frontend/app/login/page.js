"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      window.location.replace("/dashboard");
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro no login");
        return;
      }

      localStorage.setItem("token", data.token);
      window.location.replace("/dashboard");

    } catch (error) {
      alert("Erro ao conectar com servidor ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">

        <h1 className="text-3xl font-bold text-center mb-2">
          EspaçoJá
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Faça login para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

        </form>

        <p className="text-center mt-5 text-sm text-gray-600">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="text-blue-500 hover:underline"
          >
            Criar conta
          </Link>
        </p>

      </div>
    </div>
  );
}
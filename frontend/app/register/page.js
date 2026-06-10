"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    telefone: "",
    tipoUsuario: "LOCATARIO"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) window.location.href = "/dashboard";
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Conta criada com sucesso! Faça login.");
        window.location.href = "/login";
      } else {
        alert(data.message || "Erro ao criar conta");
      }
    } catch {
      alert("Erro ao conectar com servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl">

        <h1 className="text-2xl font-bold text-center mb-2">Criar Conta</h1>
        <p className="text-gray-500 text-center text-sm mb-6">EspaçoJá Real</p>

        <form onSubmit={handleRegister} className="space-y-4">

          <div>
            <label className="text-sm text-gray-600 font-medium">Nome completo *</label>
            <input
              name="name"
              type="text"
              placeholder="Seu nome"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Email *</label>
            <input
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Telefone</label>
            <input
              name="telefone"
              type="text"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={handleChange}
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Senha *</label>
            <input
              name="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Tipo de conta *</label>
            <select
              name="tipoUsuario"
              value={form.tipoUsuario}
              onChange={handleChange}
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            >
              <option value="LOCATARIO">Locatario - quero reservar espacos</option>
              <option value="PROPRIETARIO">Proprietario - quero anunciar espacos</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold p-3 rounded-lg transition"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>

        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          Ja tem conta?{" "}
          <Link href="/login" className="text-blue-500 hover:underline font-medium">
            Fazer login
          </Link>
        </p>

      </div>
    </div>
  );
}

'use client'
import { useState } from "react";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Login realizado com sucesso 🔐");
    } else {
      alert(data.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Login</h1>

        <input
          placeholder="Email"
          className="p-2 text-black bg-white rounded"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Senha"
          className="p-2 text-black bg-white rounded"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button className="bg-blue-500 p-2 rounded">
          Entrar
        </button>
      </form>
    </main>
  );
}
'use client'
import { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Cadastro</h1>

        <input
          placeholder="Nome"
          className="p-2 text-black bg-white rounded"
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

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

        <button className="bg-green-500 p-2 rounded">
          Cadastrar
        </button>
      </form>
    </main>
  );
}
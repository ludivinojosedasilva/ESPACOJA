'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Carregando...");

  useEffect(() => {
    fetch("http://localhost:8000")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage("Erro ao conectar com backend"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">EspaçoJá 🚀</h1>
        <p className="text-xl">{message}</p>
      </div>
    </main>
  );
}
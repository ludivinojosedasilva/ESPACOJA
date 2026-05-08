'use client';

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">

      <div className="max-w-2xl w-full text-center">

        <h1 className="text-5xl font-bold text-blue-400 mb-6">
          EspaçoJá 🚀
        </h1>

        <p className="text-xl text-gray-300 mb-10">
          Plataforma para reserva de espaços, eventos,
          apartamentos e locais comerciais.
        </p>

        <div className="flex gap-4 justify-center">

          <Link
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold"
          >
            Entrar
          </Link>

          <Link
            href="/register"
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold"
          >
            Criar Conta
          </Link>

        </div>

      </div>

    </main>
  );
}
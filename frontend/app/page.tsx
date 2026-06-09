"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">

      {/* HERO */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <h1 className="text-6xl font-extrabold text-blue-400 mb-4">
          EspaçoJá Real
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mb-10">
          Plataforma digital para gestão e agendamento de espaços para eventos,
          salões, quadras, auditórios, casas e apartamentos. Reserva simples,
          rápida e segura.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-xl font-bold text-lg transition"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-xl font-bold text-lg transition"
          >
            Criar Conta
          </Link>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-lg font-bold mb-2">Diversos Tipos de Espaço</h3>
          <p className="text-gray-400 text-sm">
            Salões de festas, quadras esportivas, auditórios, apartamentos e muito mais.
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-bold mb-2">Reservas Online</h3>
          <p className="text-gray-400 text-sm">
            Reserve com data e hora exatas. O sistema verifica conflitos automaticamente.
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-lg font-bold mb-2">IA para Precificação</h3>
          <p className="text-gray-400 text-sm">
            Integração com IA Generativa que sugere o preço competitivo para o seu espaço.
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-3">💳</div>
          <h3 className="text-lg font-bold mb-2">Gestão de Pagamentos</h3>
          <p className="text-gray-400 text-sm">
            PIX, cartão, boleto e transferência. Controle completo de notas fiscais.
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="text-lg font-bold mb-2">Avaliações</h3>
          <p className="text-gray-400 text-sm">
            Locatários avaliam os espaços após as reservas finalizadas.
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-bold mb-2">Relatórios e Gráficos</h3>
          <p className="text-gray-400 text-sm">
            Consultas SQL com gráficos de receita, avaliações e volume mensal.
          </p>
        </div>
      </div>

    </main>
  );
}

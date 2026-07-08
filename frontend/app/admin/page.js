"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [backupInfo, setBackupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData(token);
  }, []);

  async function loadData(token) {
    try {
      const [statsRes, backupRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banco/backup-info`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (!statsRes.ok) { router.push("/login"); return; }
      setStats(await statsRes.json());
      if (backupRes.ok) setBackupInfo(await backupRes.json());
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleApagarBanco() {
    if (!confirm("ATENCAO: Isso vai apagar TODOS os dados do banco. Um backup sera salvo automaticamente. Deseja continuar?")) return;
    setAcao("apagando");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banco/apagar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Banco apagado! Backup salvo em: ${new Date(data.backupCriadoEm).toLocaleString("pt-BR")}`);
        loadData(token);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Erro ao apagar banco");
    } finally {
      setAcao(null);
    }
  }

  async function handleRestaurar() {
    if (!confirm("Deseja restaurar os dados do ultimo backup?")) return;
    setAcao("restaurando");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banco/restaurar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Dados restaurados com sucesso! Backup de: ${new Date(data.backupDe).toLocaleString("pt-BR")}`);
        loadData(token);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Erro ao restaurar backup");
    } finally {
      setAcao(null);
    }
  }

  async function handleInicializar() {
    if (!confirm("Deseja inicializar o banco com os dados basicos (tipos de espaco e formas de pagamento)?")) return;
    setAcao("inicializando");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/banco/inicializar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadData(token);
      } else {
        alert(data.message);
      }
    } catch {
      alert("Erro ao inicializar banco");
    } finally {
      setAcao(null);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-lg">Carregando painel admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* NAVBAR ADMIN */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <span className="font-bold text-xl">EspacoJa Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/usuarios" className="text-gray-300 hover:text-white">Usuarios</Link>
          <Link href="/admin/espacos" className="text-gray-300 hover:text-white">Espacos</Link>
          <Link href="/admin/reservas" className="text-gray-300 hover:text-white">Reservas</Link>
          <Link href="/admin/pagamentos" className="text-gray-300 hover:text-white">Pagamentos</Link>
          <Link href="/admin/avaliacoes" className="text-gray-300 hover:text-white">Avaliacoes</Link>
          <Link href="/admin/formas-pagamento" className="text-gray-300 hover:text-white">Formas Pag.</Link>
          <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg">Sair</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-400 mb-8">Gestao completa do sistema EspacoJa Real</p>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Usuarios", value: stats?.usuarios, color: "blue", icon: "👤" },
            { label: "Proprietarios", value: stats?.proprietarios, color: "green", icon: "🏠" },
            { label: "Locatarios", value: stats?.locatarios, color: "purple", icon: "👥" },
            { label: "Espacos", value: stats?.espacos, color: "yellow", icon: "🏢" },
            { label: "Reservas", value: stats?.reservas, color: "orange", icon: "📅" },
            { label: "Pagamentos", value: stats?.pagamentos, color: "teal", icon: "💳" },
            { label: "Avaliacoes", value: stats?.avaliacoes, color: "pink", icon: "⭐" },
            { label: "Receita Total", value: `R$ ${parseFloat(stats?.receitaTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "green", icon: "💰" }
          ].map((s, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl p-5 text-center border border-gray-700">
              <p className="text-3xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* RESERVAS POR STATUS */}
        {stats?.reservasPorStatus && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
            <h2 className="text-lg font-bold mb-4">Reservas por Status</h2>
            <div className="flex gap-4 flex-wrap">
              {stats.reservasPorStatus.map((r, i) => (
                <div key={i} className="bg-gray-700 rounded-xl px-4 py-2 text-sm">
                  <span className="font-bold">{r.status}</span>
                  <span className="text-gray-300 ml-2">{r.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GESTAO DO BANCO */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-bold mb-2">Gestao do Banco de Dados</h2>
          <p className="text-gray-400 text-sm mb-6">
            Operacoes criticas do banco. O backup e feito automaticamente antes de apagar.
          </p>

          {/* INFO DO BACKUP */}
          {backupInfo?.existe && (
            <div className="bg-blue-900 border border-blue-700 rounded-xl p-4 mb-4">
              <p className="text-blue-300 text-sm font-bold mb-1">Backup disponivel</p>
              <p className="text-blue-200 text-sm">
                Criado em: {new Date(backupInfo.criadoEm).toLocaleString("pt-BR")}
              </p>
              <p className="text-blue-200 text-sm">
                {backupInfo.totais.usuarios} usuarios | {backupInfo.totais.espacos} espacos |{" "}
                {backupInfo.totais.reservas} reservas | {backupInfo.totais.pagamentos} pagamentos
              </p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleInicializar}
              disabled={!!acao}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 font-bold px-6 py-3 rounded-xl transition"
            >
              {acao === "inicializando" ? "Inicializando..." : "Inicializar Banco"}
            </button>

            {backupInfo?.existe && (
              <button
                onClick={handleRestaurar}
                disabled={!!acao}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-900 font-bold px-6 py-3 rounded-xl transition"
              >
                {acao === "restaurando" ? "Restaurando..." : "Recuperar Dados"}
              </button>
            )}

            <button
              onClick={handleApagarBanco}
              disabled={!!acao}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 font-bold px-6 py-3 rounded-xl transition"
            >
              {acao === "apagando" ? "Apagando..." : "Apagar Tudo"}
            </button>
          </div>
        </div>

        {/* LINKS RAPIDOS */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/admin/usuarios", label: "Gerir Usuarios", icon: "👤", desc: "Ver, editar e excluir contas" },
            { href: "/admin/espacos", label: "Gerir Espacos", icon: "🏢", desc: "Ver e excluir espacos" },
            { href: "/admin/reservas", label: "Gerir Reservas", icon: "📅", desc: "Ver e atualizar reservas" },
            { href: "/admin/pagamentos", label: "Gerir Pagamentos", icon: "💳", desc: "Ver e excluir pagamentos" },
            { href: "/admin/avaliacoes", label: "Gerir Avaliacoes", icon: "⭐", desc: "Ver e excluir avaliacoes" },
            { href: "/admin/formas-pagamento", label: "Formas de Pagamento", icon: "💰", desc: "Criar, editar e excluir" }
          ].map((item, i) => (
            <Link key={i} href={item.href}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl p-5 transition"
            >
              <p className="text-3xl mb-2">{item.icon}</p>
              <p className="font-bold">{item.label}</p>
              <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

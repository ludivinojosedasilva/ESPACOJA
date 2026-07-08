"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminFormasPagamento() {
  const router = useRouter();
  const [formas, setFormas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [editando, setEditando] = useState(null);
  const [editNome, setEditNome] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadFormas(token);
  }, []);

  async function loadFormas(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/formas-pagamento`);
      if (res.ok) setFormas(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/formas-pagamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome: novoNome })
    });
    if (res.ok) {
      const nova = await res.json();
      setFormas(prev => [...prev, nova]);
      setNovoNome("");
    } else alert("Erro ao criar forma de pagamento");
  }

  async function handleEdit(id) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/formas-pagamento/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome: editNome })
    });
    if (res.ok) {
      setFormas(prev => prev.map(f => f.id === id ? { ...f, nome: editNome } : f));
      setEditando(null);
    } else alert("Erro ao editar");
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta forma de pagamento?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/formas-pagamento/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setFormas(prev => prev.filter(f => f.id !== id));
    else alert("Erro ao excluir");
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
        <Link href="/admin" className="text-gray-300 hover:text-white">Dashboard</Link>
        <span className="text-gray-600">/</span>
        <span className="font-bold">Formas de Pagamento</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Formas de Pagamento</h1>

        {/* CRIAR NOVA */}
        <form onSubmit={handleCreate} className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6 flex gap-3">
          <input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Nova forma de pagamento..."
            className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-sm"
            required
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 font-bold px-6 py-3 rounded-lg">
            Adicionar
          </button>
        </form>

        {/* LISTA */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          {formas.map(f => (
            <div key={f.id} className="flex items-center justify-between p-4 border-b border-gray-700 last:border-0">
              {editando === f.id ? (
                <div className="flex gap-2 flex-1">
                  <input value={editNome} onChange={e => setEditNome(e.target.value)}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm" />
                  <button onClick={() => handleEdit(f.id)} className="bg-green-600 px-4 py-2 rounded-lg text-sm">Salvar</button>
                  <button onClick={() => setEditando(null)} className="bg-gray-600 px-4 py-2 rounded-lg text-sm">Cancelar</button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">{f.nome}</span>
                    <span className="text-gray-500 text-xs ml-2">ID: {f.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditando(f.id); setEditNome(f.nome); }}
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 rounded-lg">Editar</button>
                    <button onClick={() => handleDelete(f.id)}
                      className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1 rounded-lg">Excluir</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

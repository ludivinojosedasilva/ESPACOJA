"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminUsuarios() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadUsers(token);
  }, []);

  async function loadUsers(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este usuario?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
    else { const d = await res.json(); alert(d.message); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${editando}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === editando ? { ...u, ...updated } : u));
      setEditando(null);
    } else alert("Erro ao atualizar");
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
        <Link href="/admin" className="text-gray-300 hover:text-white">Dashboard</Link>
        <span className="text-gray-600">/</span>
        <span className="font-bold">Usuarios</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Gestao de Usuarios ({users.length})</h1>

        <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Telefone</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <>
                  <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="p-4 text-gray-400">{u.id}</td>
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-gray-300">{u.email}</td>
                    <td className="p-4 text-gray-300">{u.telefone || "-"}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        u.tipoUsuario === "ADMIN" ? "bg-yellow-700 text-yellow-200" :
                        u.tipoUsuario === "PROPRIETARIO" ? "bg-blue-700 text-blue-200" :
                        "bg-green-700 text-green-200"
                      }`}>{u.tipoUsuario}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditando(u.id); setForm({ name: u.name, email: u.email, telefone: u.telefone }); }}
                          className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 rounded-lg"
                        >Editar</button>
                        {u.tipoUsuario !== "ADMIN" && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="bg-red-600 hover:bg-red-700 text-xs px-3 py-1 rounded-lg"
                          >Excluir</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editando === u.id && (
                    <tr key={`edit-${u.id}`} className="bg-gray-750 border-t border-gray-600">
                      <td colSpan={6} className="p-4">
                        <form onSubmit={handleEdit} className="flex gap-3 flex-wrap items-end">
                          <div>
                            <label className="text-xs text-gray-400">Nome</label>
                            <input value={form.name || ""} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                              className="block mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm w-48" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Email</label>
                            <input value={form.email || ""} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                              className="block mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm w-56" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Telefone</label>
                            <input value={form.telefone || ""} onChange={e => setForm(p => ({...p, telefone: e.target.value}))}
                              className="block mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm w-36" />
                          </div>
                          <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold">Salvar</button>
                          <button type="button" onClick={() => setEditando(null)} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm">Cancelar</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

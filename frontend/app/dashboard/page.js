"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    price: "",
    image: null
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    loadData(token);
  }, []);

  async function loadData(token) {
    try {
      const [profileRes, spacesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`)
      ]);

      if (!profileRes.ok) {
        localStorage.removeItem("token");
        window.location.replace("/login");
        return;
      }

      const profile = await profileRes.json();
      const spacesData = await spacesRes.json();

      setUser(profile);
      setSpaces(spacesData);

    } catch {
      alert("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.replace("/login");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleFile(e) {
    const file = e.target.files[0];

    setForm((prev) => ({
      ...prev,
      image: file
    }));
  }

  function handleEdit(space) {
    setEditingId(space.id);

    setForm({
      name: space.name,
      description: space.description,
      location: space.location,
      price: space.price,
      image: null
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja deletar?")) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`, {
      method: "DELETE"
    });

    setSpaces((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("location", form.location);
      formData.append("price", form.price);

      if (form.image) {
        formData.append("image", form.image);
      }

      let res;

      if (editingId) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/spaces/${editingId}`,
          {
            method: "PUT",
            body: formData
          }
        );
      } else {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/spaces`,
          {
            method: "POST",
            body: formData
          }
        );
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erro");
        return;
      }

      if (editingId) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === editingId ? data : s))
        );
        alert("Espaço atualizado ✏️");
      } else {
        setSpaces((prev) => [data, ...prev]);
        alert("Espaço criado 🚀");
      }

      setEditingId(null);

      setForm({
        name: "",
        description: "",
        location: "",
        price: "",
        image: null
      });

    } catch {
      alert("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-10">Carregando...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">EspaçoJá Dashboard</h1>

        <div className="flex items-center gap-4">
          <span>Olá, {user?.name}</span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* FORM */}
        <div className="bg-white p-6 rounded-2xl shadow mb-8">

          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Editar Espaço" : "Criar Novo Espaço"}
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">

            <input name="name" placeholder="Nome" value={form.name} onChange={handleChange} className="p-3 border rounded-lg" required />

            <input name="location" placeholder="Localização" value={form.location} onChange={handleChange} className="p-3 border rounded-lg" required />

            <input name="price" placeholder="Preço" value={form.price} onChange={handleChange} className="p-3 border rounded-lg" required />

            <input type="file" accept="image/*" onChange={handleFile} className="p-3 border rounded-lg" />

            <textarea name="description" placeholder="Descrição" value={form.description} onChange={handleChange} className="p-3 border rounded-lg md:col-span-2" rows="4" required />

            <button type="submit" disabled={submitting} className="bg-green-500 text-white p-3 rounded-lg md:col-span-2">
              {submitting
                ? "Salvando..."
                : editingId
                ? "Atualizar Espaço"
                : "Criar Espaço"}
            </button>

          </form>
        </div>

        {/* LISTA */}
        <h2 className="text-2xl font-bold mb-4">
          Espaços Disponíveis
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          {spaces.map((space) => (
            <div key={space.id} className="bg-white rounded-2xl shadow overflow-hidden">

              <Link href={`/spaces/${space.id}`}>
                <div className="cursor-pointer">
                  {space.image && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${space.image}`}
                      alt={space.name}
                      className="w-full h-52 object-cover"
                    />
                  )}

                  <div className="p-4">
                    <h3 className="text-lg font-bold">{space.name}</h3>
                    <p className="text-sm text-gray-600 mt-2">{space.description}</p>
                    <p className="mt-2">📍 {space.location}</p>
                    <p className="text-green-600 font-bold mt-2">
                      R$ {space.price}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex gap-2 p-4">
                <button
                  onClick={() => handleEdit(space)}
                  className="bg-yellow-400 px-3 py-1 rounded"
                >
                  Editar
                </button>

                <button
                  onClick={() => handleDelete(space.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Deletar
                </button>
              </div>

            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
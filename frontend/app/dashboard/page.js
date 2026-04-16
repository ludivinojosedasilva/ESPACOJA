"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    price: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [profileRes, spacesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`)
        ]);

        if (!profileRes.ok) {
          localStorage.removeItem("token");
          window.location.replace("/login");
          return;
        }

        const profileData = await profileRes.json();
        const spacesData = await spacesRes.json();

        setUser(profileData);
        setSpaces(spacesData || []);

      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    window.location.replace("/login");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function createSpace(e) {
    e.preventDefault();

    if (!form.name || !form.location || !form.price) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/spaces`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            price: Number(form.price)
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erro ao criar espaço");
        return;
      }

      // atualização segura do estado
      setSpaces(prev => [data, ...prev]);

      setForm({
        name: "",
        description: "",
        location: "",
        price: ""
      });

    } catch (error) {
      console.error(error);
      alert("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-600">
        Carregando dashboard...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          EspaçoJá Dashboard
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Olá, {user?.name}
          </span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">

        {/* FORM */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">

          <h2 className="text-lg font-bold mb-4">
            Criar novo espaço
          </h2>

          <form onSubmit={createSpace} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nome"
              className="p-2 border rounded"
            />

            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Localização"
              className="p-2 border rounded"
            />

            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Preço"
              className="p-2 border rounded"
            />

            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descrição"
              className="p-2 border rounded md:col-span-2"
            />

            <button
              type="submit"
              disabled={submitting}
              className="bg-green-500 text-white p-2 rounded md:col-span-2 disabled:opacity-50"
            >
              {submitting ? "Criando..." : "Criar Espaço"}
            </button>

          </form>
        </div>

        {/* LIST */}
        <h2 className="text-xl font-bold mb-4">
          Espaços disponíveis
        </h2>

        {spaces.length === 0 ? (
          <p className="text-gray-500">
            Nenhum espaço cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {spaces.map((space) => (
              <Link key={space.id} href={`/spaces/${space.id}`}>
                <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg cursor-pointer transition">

                  <h3 className="font-bold">
                    {space.name}
                  </h3>

                  <p className="text-sm text-gray-600">
                    {space.description}
                  </p>

                  <p className="text-sm">
                    📍 {space.location}
                  </p>

                  <p className="font-bold text-green-600">
                    R$ {space.price}
                  </p>

                </div>
              </Link>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../../../components/Navbar";

export default function EditSpace() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [tipos, setTipos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    price: "",
    comodidades: "",
    tipoEspacoId: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadData(token);
  }, [id]);

  async function loadData(token) {
    try {
      const [spaceRes, tiposRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tipos-espaco`)
      ]);

      const spaceData = await spaceRes.json();
      const tiposData = tiposRes.ok ? await tiposRes.json() : [];

      setTipos(tiposData);
      setForm({
        name: spaceData.name || "",
        description: spaceData.description || "",
        location: spaceData.location || "",
        price: spaceData.price || "",
        comodidades: spaceData.comodidades || "",
        tipoEspacoId: spaceData.tipoEspacoId || ""
      });

      if (spaceData.image) {
        setPreview(`${process.env.NEXT_PUBLIC_API_URL}${spaceData.image}`);
      }
    } catch {
      alert("Erro ao carregar espaco");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (!form.price || parseFloat(form.price) <= 0) {
      alert("Preco deve ser maior que zero");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("location", form.location);
      formData.append("price", form.price);
      formData.append("comodidades", form.comodidades);
      if (form.tipoEspacoId) formData.append("tipoEspacoId", form.tipoEspacoId);
      if (image) formData.append("image", image);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erro ao atualizar espaco");
        return;
      }

      alert("Espaco atualizado com sucesso!");
      router.push("/dashboard");
    } catch {
      alert("Erro ao conectar com servidor");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => router.back()}
          className="text-blue-500 mb-6 hover:underline"
        >
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Espaco</h1>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-sm text-gray-600 font-medium">Imagem do espaco</label>
              <div className="mt-2">
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
                    <label className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-lg cursor-pointer">
                      Trocar
                      <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition">
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-gray-500 text-sm">Clique para adicionar imagem</span>
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-gray-600 font-medium">Nome *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Localizacao *</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Preco por hora (R$) *</label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium">Tipo de espaco</label>
                <select
                  name="tipoEspacoId"
                  value={form.tipoEspacoId}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Comodidades</label>
              <input
                name="comodidades"
                value={form.comodidades}
                onChange={handleChange}
                placeholder="Ex: Ar-condicionado, Som, Estacionamento"
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium">Descricao *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold p-4 rounded-xl transition text-lg"
            >
              {submitting ? "Salvando..." : "Salvar Alteracoes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

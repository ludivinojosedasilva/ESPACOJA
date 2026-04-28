"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SpaceDetails() {
  const params = useParams();
  const id = params?.id;

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    startDateTime: "",
    endDateTime: ""
  });

  useEffect(() => {
    if (!id) return;
    loadSpace();
  }, [id]);

  async function loadSpace() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`
      );

      const data = await res.json();

      if (res.ok) {
        setSpace(data);
      } else {
        setSpace(null);
      }

    } catch (error) {
      console.log(error);
      setSpace(null);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleReserve(e) {
    e.preventDefault();

    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);

    if (end <= start) {
      alert("Data/Hora término deve ser maior que início.");
      return;
    }

    setSending(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            customerName: form.customerName,
            phone: form.phone,
            startDateTime: form.startDateTime,
            endDateTime: form.endDateTime,
            spaceId: id
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erro ao criar reserva");
        return;
      }

      alert("Reserva realizada com sucesso 🚀");

      setShowForm(false);

      setForm({
        customerName: "",
        phone: "",
        startDateTime: "",
        endDateTime: ""
      });

    } catch (error) {
      alert("Erro ao reservar");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10">
        Carregando...
      </p>
    );
  }

  if (!space) {
    return (
      <p className="text-center mt-10">
        Espaço não encontrado
      </p>
    );
  }

  const now = new Date()
    .toISOString()
    .slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow overflow-hidden">

        {space.image && (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${space.image}`}
            alt={space.name}
            className="w-full h-80 object-cover"
          />
        )}

        <div className="p-8">

          <button
            onClick={() => window.history.back()}
            className="text-blue-500 mb-6 hover:underline"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-bold mb-4">
            {space.name}
          </h1>

          <p className="text-gray-600 mb-4">
            {space.description}
          </p>

          <p className="mb-2">
            📍 {space.location}
          </p>

          <p className="text-green-600 text-2xl font-bold mb-8">
            R$ {space.price}
          </p>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
            >
              Reservar Espaço
            </button>
          ) : (
            <form
              onSubmit={handleReserve}
              className="grid gap-4"
            >
              <input
                type="text"
                name="customerName"
                placeholder="Seu nome"
                value={form.customerName}
                onChange={handleChange}
                className="p-3 border rounded-lg"
                required
              />

              <input
                type="text"
                name="phone"
                placeholder="Telefone"
                value={form.phone}
                onChange={handleChange}
                className="p-3 border rounded-lg"
                required
              />

              <div>
                <label className="block mb-1 font-medium">
                  Data/Hora Início
                </label>

                <input
                  type="datetime-local"
                  name="startDateTime"
                  min={now}
                  value={form.startDateTime}
                  onChange={handleChange}
                  className="p-3 border rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Data/Hora Término
                </label>

                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={form.endDateTime}
                  onChange={handleChange}
                  className="p-3 border rounded-lg w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="bg-green-500 text-white p-3 rounded-lg disabled:opacity-50"
              >
                {sending
                  ? "Reservando..."
                  : "Confirmar Reserva"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
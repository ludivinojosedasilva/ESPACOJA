"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SpaceDetails() {
  const params = useParams();
  const id = params?.id;

  const [space, setSpace] = useState(null);
  const [reservations, setReservations] = useState([]);
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
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [spaceRes, reservationsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/${id}`)
      ]);

      const spaceData = await spaceRes.json();
      const reservationsData = await reservationsRes.json();

      if (spaceRes.ok) setSpace(spaceData);
      else setSpace(null);

      if (reservationsRes.ok) setReservations(reservationsData);

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
      alert("Data inválida");
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
            ...form,
            spaceId: id
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Reserva criada 🚀");

      setShowForm(false);

      setForm({
        customerName: "",
        phone: "",
        startDateTime: "",
        endDateTime: ""
      });

      // 🔥 Atualiza lista após reservar
      loadData();

    } catch {
      alert("Erro ao reservar");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="text-center mt-10">Carregando...</p>;
  }

  if (!space) {
    return <p className="text-center mt-10">Espaço não encontrado</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow overflow-hidden">

        {space.image && (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${space.image}`}
            className="w-full h-80 object-cover"
          />
        )}

        <div className="p-8">

          <button
            onClick={() => window.history.back()}
            className="text-blue-500 mb-6 hover:underline"
          >
          ⬅️ Voltar
        </button>

          <h1 className="text-3xl font-bold">{space.name}</h1>
          <p className="text-gray-600 mt-2">{space.description}</p>

          <p className="mt-4">📍 {space.location}</p>

          <p className="text-green-600 text-2xl font-bold mt-2">
            R$ {space.price}
          </p>

          {/* 🔥 RESERVAS */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">
              Reservas existentes
            </h2>

            {reservations.length === 0 ? (
              <p className="text-gray-500">
                Nenhuma reserva ainda
              </p>
            ) : (
              <ul className="space-y-2">
                {reservations.map((r) => (
                  <li
                    key={r.id}
                    className="bg-gray-100 p-3 rounded"
                  >
                    <strong>{r.customerName}</strong><br />
                    {new Date(r.startDateTime).toLocaleString()} →{" "}
                    {new Date(r.endDateTime).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* BOTÃO */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 w-full bg-blue-500 text-white p-3 rounded-lg"
            >
              Reservar Espaço
            </button>
          ) : (
            <form onSubmit={handleReserve} className="mt-6 space-y-3">

              <input
                name="customerName"
                placeholder="Nome"
                value={form.customerName}
                onChange={handleChange}
                className="p-3 border rounded w-full"
                required
              />

              <input
                name="phone"
                placeholder="Telefone"
                value={form.phone}
                onChange={handleChange}
                className="p-3 border rounded w-full"
                required
              />

              <input
                type="datetime-local"
                name="startDateTime"
                value={form.startDateTime}
                onChange={handleChange}
                className="p-3 border rounded w-full"
                required
              />

              <input
                type="datetime-local"
                name="endDateTime"
                value={form.endDateTime}
                onChange={handleChange}
                className="p-3 border rounded w-full"
                required
              />

              <button
                type="submit"
                disabled={sending}
                className="bg-green-500 text-white p-3 rounded w-full"
              >
                {sending ? "Reservando..." : "Confirmar"}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
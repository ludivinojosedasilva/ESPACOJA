"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyReservations() {

  const router = useRouter();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    loadReservations(token);

  }, []);

  async function loadReservations(token) {

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/my-reservations`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        alert("Erro ao carregar reservas");
        return;
      }

      const data = await res.json();

      setReservations(data);

    } catch (error) {
      console.log(error);
      alert("Erro ao carregar reservas");

    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10">
        Carregando...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold">
            Minhas Reservas
          </h1>

          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Dashboard
          </button>

        </div>

        {reservations.length === 0 ? (

          <div className="bg-white rounded-2xl p-8 shadow text-center">
            <p className="text-gray-500">
              Você ainda não possui reservas.
            </p>
          </div>

        ) : (

          <div className="grid md:grid-cols-2 gap-6">

            {reservations.map((reservation) => (

              <div
                key={reservation.id}
                className="bg-white rounded-2xl shadow overflow-hidden"
              >

                {reservation.Space?.image && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${reservation.Space.image}`}
                    className="w-full h-52 object-cover"
                  />
                )}

                <div className="p-5">

                  <h2 className="text-xl font-bold">
                    {reservation.Space?.name}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    📍 {reservation.Space?.location}
                  </p>

                  <p className="text-green-600 font-bold mt-2">
                    R$ {reservation.Space?.price}
                  </p>

                  <div className="mt-4 text-sm text-gray-700">

                    <p>
                      <strong>Cliente:</strong>{" "}
                      {reservation.customerName}
                    </p>

                    <p className="mt-2">
                      <strong>Início:</strong><br />
                      {new Date(
                        reservation.startDateTime
                      ).toLocaleString()}
                    </p>

                    <p className="mt-2">
                      <strong>Fim:</strong><br />
                      {new Date(
                        reservation.endDateTime
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>
              </div>

            ))}

          </div>

        )}

      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SpaceDetails() {
  const params = useParams();
  const id = params?.id;

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/spaces/${id}`
        );

        const text = await res.text();

        try {
          const data = JSON.parse(text);

          if (!res.ok) {
            setSpace(null);
          } else {
            setSpace(data);
          }

        } catch (err) {
          console.error("Resposta inválida:", text);
          setSpace(null);
        }

      } catch (error) {
        console.error(error);
        setSpace(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-10">Carregando...</p>;
  }

  if (!space) {
    return <p className="text-center mt-10">Espaço não encontrado</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">

      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">

        <h1 className="text-2xl font-bold mb-4">
          {space.name}
        </h1>

        <p className="text-gray-600 mb-2">
          {space.description}
        </p>

        <p className="mb-2">
          📍 {space.location}
        </p>

        <p className="font-bold text-green-600">
          R$ {space.price}
        </p>

      </div>

    </div>
  );
}
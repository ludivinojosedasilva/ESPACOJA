'use client'
import { useEffect, useState } from "react";

export default function Profile() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8000/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setData(data);
        }
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div>
        <h1 className="text-2xl font-bold mb-4">Perfil</h1>

        {error && <p>{error}</p>}

        {data && (
          <div>
            <p><strong>ID:</strong> {data.id}</p>
            <p><strong>Nome:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
          </div>
        )}
      </div>
    </main>
  );
}
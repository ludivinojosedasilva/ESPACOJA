"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("token");

      // 🔒 Se não tiver token → volta pro login
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // 🔒 Token inválido
        if (!response.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const data = await response.json();
        setUser(data);

      } catch (error) {
        router.push("/login");
      }
    }

    fetchProfile();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (!user) return <p>Carregando...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Perfil</h2>

      <p>Nome: {user.name}</p>
      <p>Email: {user.email}</p>

      <br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
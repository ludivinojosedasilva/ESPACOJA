"use client";

import { useState, useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔥 Se já estiver logado, redireciona automaticamente
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      window.location.replace("/profile");
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    console.log("LOGIN CLICADO");

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      console.log("RESPOSTA:", data);

      if (response.ok) {
        localStorage.setItem("token", data.token);

        alert("Login realizado com sucesso 🚀");

        console.log("REDIRECIONANDO AGORA...");

        // 🔥 REDIRECIONAMENTO FORÇADO
        window.location.replace("/profile");

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com servidor ❌");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Senha"
          onChange={e => setPassword(e.target.value)}
        />
        <br /><br />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
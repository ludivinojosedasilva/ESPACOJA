"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {});
  }, [pathname]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  const isActive = (href) =>
    pathname === href
      ? "text-blue-400 font-bold"
      : "text-gray-300 hover:text-white";

  if (!user) return null;

  const isProprietario = user?.tipoUsuario === "PROPRIETARIO";

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link href="/dashboard" className="text-white font-bold text-xl">
        🏢 EspacoJa
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link href="/dashboard" className={isActive("/dashboard")}>
          Dashboard
        </Link>

        {isProprietario ? (
          <Link href="/reservations" className={isActive("/reservations")}>
            Gerir Reservas
          </Link>
        ) : (
          <Link href="/my-reservations" className={isActive("/my-reservations")}>
            Minhas Reservas
          </Link>
        )}

        <Link href="/consultas" className={isActive("/consultas")}>
          Consultas
        </Link>
        <Link href="/ia" className={isActive("/ia")}>
          IA
        </Link>
        <Link href="/profile" className={isActive("/profile")}>
          Perfil
        </Link>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}

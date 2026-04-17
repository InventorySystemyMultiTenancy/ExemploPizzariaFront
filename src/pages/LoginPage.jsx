import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/auth/login", payload);
      return response.data?.data;
    },
    onSuccess: (data) => {
      login(data);
      toast.success("Login realizado");

      if (data.user.role === "COZINHA") {
        navigate("/cozinha");
        return;
      }

      if (["ADMIN", "FUNCIONARIO"].includes(data.user.role)) {
        navigate("/admin");
        return;
      }

      navigate("/dashboard");
    },
    onError: () => {
      toast.error("Email ou senha invalidos");
    },
  });

  const onSubmit = (event) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <main className="flex min-h-screen bg-white text-gray-900">
      {/* Left — hero */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=80"
          alt="Pizza artesanal Fellice"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rosso/80 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-12 text-white">
          <img
            src="/logo-fellice.png"
            alt="Pizzaria Fellice"
            className="h-16 w-auto brightness-0 invert"
          />
          <p className="font-script text-2xl italic text-white/90">
            O seu momento de ser feliz!
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src="/logo-fellice.png"
              alt="Pizzaria Fellice"
              className="h-12 w-auto"
            />
          </div>

          <h1 className="font-display text-3xl font-bold text-gray-900">
            Bem-vindo
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Entre na sua conta para acompanhar pedidos.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none transition focus:border-rosso focus:ring-2 focus:ring-rosso/10"
            />
            <input
              type="password"
              required
              placeholder="Senha"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none transition focus:border-rosso focus:ring-2 focus:ring-rosso/10"
            />

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-2xl bg-rosso py-4 text-base font-bold text-white shadow-md transition hover:bg-ember disabled:opacity-50"
            >
              {mutation.isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <Link
            to="/"
            className="mt-5 block text-center text-sm text-gray-400 transition hover:text-rosso"
          >
            ← Voltar para o cardápio
          </Link>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;

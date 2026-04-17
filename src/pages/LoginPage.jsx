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
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 text-white sm:px-0">
      <form
        onSubmit={onSubmit}
        className="w-full rounded-3xl border border-gold/20 bg-lacquer/70 p-5 sm:p-7"
      >
        <h1 className="font-display text-3xl text-gold">Entrar</h1>
        <p className="mt-1 text-sm text-smoke">
          Use sua conta para acompanhar pedidos.
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none focus:border-gold"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-ember to-red-500 px-5 py-4 text-base font-bold disabled:opacity-50"
        >
          {mutation.isPending ? "Entrando..." : "Entrar"}
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-sm text-smoke hover:text-white"
        >
          Voltar para o cardapio
        </Link>
      </form>
    </main>
  );
}

export default LoginPage;

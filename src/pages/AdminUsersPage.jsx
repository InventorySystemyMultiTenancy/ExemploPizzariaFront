import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";

const ROLES = [
  { value: "MOTOBOY", label: "🛵 Motoboy" },
  { value: "COZINHA", label: "👨‍🍳 Cozinha" },
  { value: "FUNCIONARIO", label: "🧑‍💼 Funcionário" },
  { value: "ADMIN", label: "🔑 Admin" },
  { value: "CLIENTE", label: "👤 Cliente" },
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "MOTOBOY",
};

function AdminUsersPage() {
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/auth/users", payload);
      return res.data?.data;
    },
    onSuccess: (user) => {
      setCreated(user);
      setForm(EMPTY);
      toast.success("Usuário criado com sucesso!");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        "Erro ao criar usuário. Verifique os dados.";
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      password: form.password,
      role: form.role,
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    createMutation.mutate(payload);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 text-gray-900 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/admin"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-800"
        >
          ← Painel Admin
        </Link>
        <h1 className="font-display text-3xl text-gold">Criar Usuário</h1>
      </div>

      <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wide">
              Perfil *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, role: r.value }))
                  }
                  className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                    form.role === r.value
                      ? "border-rosso bg-rosso text-white shadow"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Nome completo *
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              placeholder="Ex: João Silva"
              value={form.name}
              onChange={set("name")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold/60 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              E-mail
            </label>
            <input
              type="email"
              placeholder="ex@email.com"
              value={form.email}
              onChange={set("email")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold/60 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Telefone
            </label>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={set("phone")}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold/60 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Pode ser usado para login no lugar do e-mail.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={set("password")}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:border-gold/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full rounded-2xl bg-rosso py-3.5 text-sm font-bold text-white shadow transition hover:bg-ember disabled:opacity-50"
          >
            {createMutation.isPending
              ? "Criando..."
              : `Criar ${ROLES.find((r) => r.value === form.role)?.label ?? "Usuário"}`}
          </button>
        </form>
      </div>

      {/* Success card */}
      {created && (
        <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-bold text-green-800">
            ✅ Usuário criado com sucesso!
          </p>
          <div className="mt-3 space-y-1 text-sm text-green-700">
            <p>
              <span className="font-semibold">Nome:</span> {created.name}
            </p>
            {created.email && (
              <p>
                <span className="font-semibold">E-mail:</span> {created.email}
              </p>
            )}
            {created.phone && (
              <p>
                <span className="font-semibold">Telefone:</span> {created.phone}
              </p>
            )}
            <p>
              <span className="font-semibold">Perfil:</span>{" "}
              {ROLES.find((r) => r.value === created.role)?.label ??
                created.role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreated(null)}
            className="mt-3 text-xs text-green-600 underline"
          >
            Criar outro usuário
          </button>
        </div>
      )}
    </main>
  );
}

export default AdminUsersPage;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useTranslation } from "../context/I18nContext.jsx";

function MesaAccessPage() {
  const { token } = useParams();
  const { login, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | error

  useEffect(() => {
    // Se já está logado como MESA, vai direto para o cardápio
    if (isAuthenticated && user?.role === "MESA") {
      navigate("/cardapio", { replace: true });
      return;
    }

    if (!token) {
      setStatus("error");
      return;
    }

    api
      .get(`/mesas/acesso/${token}`)
      .then((res) => {
        const { accessToken, mesa } = res.data.data;
        login({
          accessToken,
          user: {
            id: mesa.id,
            name: mesa.name,
            role: "MESA",
            mesaNumber: mesa.number,
          },
        });
        navigate("/cardapio", { replace: true });
      })
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        <p className="text-sm text-gray-500">
          {t("MESA_ACCESS_LOADING", "Identificando mesa...")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <p className="text-4xl">😕</p>
      <h1 className="text-lg font-semibold text-gray-900">
        {t("MESA_ACCESS_INVALID_QR_TITLE", "QR Code inválido")}
      </h1>
      <p className="text-sm text-gray-500">
        {t(
          "MESA_ACCESS_INVALID_QR_TEXT_1",
          "Este QR code expirou ou não é mais válido.",
        )}
        <br />
        {t(
          "MESA_ACCESS_INVALID_QR_TEXT_2",
          "Peça para um atendente gerar um novo.",
        )}
      </p>
    </div>
  );
}

export default MesaAccessPage;

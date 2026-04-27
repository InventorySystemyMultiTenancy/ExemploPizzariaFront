import { Link } from "react-router-dom";
import CartDrawer from "../components/CartDrawer.jsx";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useTranslation } from "../context/I18nContext.jsx";

function HomePage() {
  const { openCart, items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Sticky Nav */}
      <Navbar activeLink="home" />

      {/* Hero */}
      <section className="relative h-[58vh] min-h-[380px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80"
          alt="Pizza artesanal Fellice"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-16">
          <div className="max-w-lg">
            <p className="mb-3 font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold">
              {t(
                "HOME_SINCE_1997",
                "Desde 1997 · 27 anos de tradição italiana",
              )}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {t("HOME_HERO_TITLE_1", "Autêntica")}
              <br />
              {t("HOME_HERO_TITLE_2", "pizza italiana")}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
              {t(
                "HOME_HERO_DESC",
                "Massa de fermentação lenta, ingredientes selecionados e o sabor que faz você se sentir feliz.",
              )}
            </p>
            <Link
              to="/cardapio"
              className="mt-7 inline-block rounded-2xl bg-rosso px-8 py-4 text-base font-extrabold text-white shadow-xl transition-all hover:scale-[1.03] hover:bg-ember"
            >
              {t("HOME_BTN_ORDER", "Fazer Pedido Agora")}
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <div className="mb-10 text-center">
          <p className="font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold">
            {t("HOME_ABOUT_LABEL", "Nossa história")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
            {t("HOME_ABOUT_TITLE", "Pizzaria Fellice – 27 Anos de Tradição")}
          </h2>
          <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-rosso" />
        </div>

        <div className="space-y-5 text-base leading-8 text-gray-600">
          <p>
            {t(
              "HOME_ABOUT_P1",
              "Desde 1997, a Pizzaria Fellice é sinônimo de qualidade e sabor. Combinamos ingredientes frescos e selecionados com receitas exclusivas para criar pizzas que encantam a todos. Seja em nosso salão, que oferece um ambiente aconchegante para momentos especiais, ou através do nosso eficiente serviço de delivery, garantimos uma experiência gastronômica única.",
            )}
          </p>
          <p>
            {t(
              "HOME_ABOUT_P2",
              "Além das nossas pizzas, oferecemos uma deliciosa variedade de porções, beirutes, petiscos, batatas e sobremesas, tudo preparado com o mesmo cuidado e dedicação que nos tornaram referência na região.",
            )}
          </p>
          <p>
            {t(
              "HOME_ABOUT_P3",
              "Descubra por que a Pizzaria Fellice é a escolha certa para quem busca tradição, qualidade e um toque de exclusividade. Visite-nos ou faça seu pedido online e saboreie o melhor da gastronomia italiana com o nosso toque especial.",
            )}
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/cardapio"
            className="rounded-2xl bg-rosso px-10 py-4 text-base font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-ember"
          >
            {t("HOME_BTN_MENU", "Ver Cardápio Completo")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        {t(
          "FOOTER_COPYRIGHT",
          "Pizzaria Fellice © 2024 · O seu momento de ser feliz!",
        )}
      </footer>

      <CartDrawer />
    </main>
  );
}

export default HomePage;

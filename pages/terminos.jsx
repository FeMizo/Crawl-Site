import Head from "next/head";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function TerminosPage() {
  return (
    <>
      <Head>
        <title>Términos y Condiciones | SEO Crawler</title>
        <meta
          name="description"
          content="Términos y condiciones de uso de SEO Crawler. Conoce las reglas y limitaciones del servicio antes de utilizarlo."
        />
        <link rel="canonical" href={`${APP_URL}/terminos`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${APP_URL}/terminos`} />
        <meta property="og:title" content="Términos y Condiciones | SEO Crawler" />
        <meta property="og:description" content="Términos y condiciones de uso de SEO Crawler. Conoce las reglas y limitaciones del servicio antes de utilizarlo." />
        <meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="SEO Crawler — Términos y Condiciones" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@aionsite" />
        <meta name="twitter:title" content="Términos y Condiciones | SEO Crawler" />
        <meta name="twitter:description" content="Términos y condiciones de uso de SEO Crawler. Conoce las reglas y limitaciones del servicio antes de utilizarlo." />
        <meta name="twitter:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta name="twitter:image:alt" content="SEO Crawler — Términos y Condiciones" />
      </Head>

      <AppShell
        activeKey=""
        user={null}
        showSidebar={false}
        kicker="Legal"
        title="Términos y Condiciones"
        description="Última actualización: abril 2026"
      >
        <Card className="terms-card">
          <Eyebrow icon={<Icon name="shield" size={12} />}>AIONSITE</Eyebrow>

          <div className="terms-body">
            <section>
              <h2>1. Aceptación de los términos</h2>
              <p>
                Al acceder y utilizar SEO Crawler (en adelante "el Servicio"), operado por{" "}
                <strong>AIONSITE</strong>, aceptas quedar vinculado por estos Términos y Condiciones.
                Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.
              </p>
            </section>

            <section>
              <h2>2. Descripción del servicio</h2>
              <p>
                SEO Crawler es una herramienta de auditoría SEO que permite a los usuarios rastrear
                sitios web para detectar errores 404, metadatos faltantes, redirecciones, páginas noindex
                y otros problemas de posicionamiento. El Servicio se ofrece bajo un modelo de suscripción
                con distintos planes que limitan la cantidad de proyectos y rastreos disponibles.
              </p>
            </section>

            <section>
              <h2>3. Registro y cuenta de usuario</h2>
              <p>
                Para utilizar el Servicio debes registrar una cuenta proporcionando información
                verdadera, precisa y completa. Eres responsable de:
              </p>
              <ul>
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Todas las actividades realizadas bajo tu cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              </ul>
              <p>
                Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.
              </p>
            </section>

            <section>
              <h2>4. Planes y pagos</h2>
              <p>
                El Servicio ofrece un plan gratuito con funcionalidades limitadas y planes de pago
                (Basic, Starter, Pro, Agency) con capacidades ampliadas. Los pagos se procesan a través
                de <strong>Stripe</strong>. Al suscribirte a un plan de pago:
              </p>
              <ul>
                <li>Autorizas el cobro recurrente según el ciclo de facturación seleccionado</li>
                <li>Puedes cancelar tu suscripción en cualquier momento desde tu perfil</li>
                <li>Los cargos ya realizados no son reembolsables salvo error de facturación</li>
                <li>Los precios pueden modificarse con 30 días de aviso previo</li>
              </ul>
            </section>

            <section>
              <h2>5. Uso aceptable</h2>
              <p>Al utilizar el Servicio te comprometes a no:</p>
              <ul>
                <li>Rastrear sitios web sin autorización de sus propietarios</li>
                <li>Utilizar el Servicio para actividades ilegales o fraudulentas</li>
                <li>Intentar sobrecargar, hackear o comprometer la infraestructura del Servicio</li>
                <li>Revender o sublicenciar el acceso al Servicio sin autorización expresa</li>
                <li>Usar bots o scripts automatizados para acceder al Servicio fuera de la API oficial</li>
              </ul>
            </section>

            <section>
              <h2>6. Propiedad intelectual</h2>
              <p>
                El Servicio, incluyendo su código fuente, diseño, marcas y contenido, es propiedad
                exclusiva de AIONSITE. Los datos generados por tus rastreos (URLs, errores detectados,
                reportes) son de tu propiedad y puedes exportarlos en cualquier momento.
              </p>
            </section>

            <section>
              <h2>7. Limitación de responsabilidad</h2>
              <p>
                El Servicio se provee "tal como está". AIONSITE no garantiza disponibilidad ininterrumpida
                ni exactitud absoluta de los resultados del rastreo. En ningún caso seremos responsables
                por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de
                uso del Servicio.
              </p>
              <p>
                La responsabilidad máxima de AIONSITE ante cualquier reclamación no excederá el monto
                pagado por el usuario en los últimos 3 meses de servicio.
              </p>
            </section>

            <section>
              <h2>8. Modificaciones al servicio</h2>
              <p>
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del
                Servicio con o sin previo aviso. No seremos responsables ante ti ni terceros por
                cualquier modificación, suspensión o discontinuación del Servicio.
              </p>
            </section>

            <section>
              <h2>9. Terminación</h2>
              <p>
                Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil.
                Nos reservamos el derecho de terminar o suspender tu acceso inmediatamente, sin previo
                aviso, si violas estos Términos. Al terminar, tu derecho a usar el Servicio cesa
                inmediatamente.
              </p>
            </section>

            <section>
              <h2>10. Ley aplicable</h2>
              <p>
                Estos Términos se rigen por las leyes de los <strong>Estados Unidos Mexicanos</strong>.
                Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de
                la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponder.
              </p>
            </section>

            <section>
              <h2>11. Contacto</h2>
              <p>
                Para cualquier pregunta sobre estos Términos y Condiciones, contáctanos en{" "}
                <a href="mailto:contacto@aionsite.com.mx">contacto@aionsite.com.mx</a>.
              </p>
            </section>
          </div>
        </Card>

        <style jsx>{`
          .terms-card {
            display: grid;
            gap: 20px;
          }
          .terms-body {
            display: grid;
            gap: 20px;
          }
          .terms-body section {
            display: grid;
            gap: 8px;
          }
          .terms-body h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            margin: 0;
            color: var(--text);
          }
          .terms-body p {
            margin: 0;
            font-size: 13px;
            color: var(--text2);
            line-height: 1.7;
          }
          .terms-body ul {
            margin: 0;
            padding-left: 20px;
            display: grid;
            gap: 4px;
          }
          .terms-body li {
            font-size: 13px;
            color: var(--text2);
            line-height: 1.6;
          }
          .terms-body a {
            color: var(--accent);
            text-decoration: none;
          }
          .terms-body a:hover {
            text-decoration: underline;
          }
          .terms-body strong {
            color: var(--text);
          }
        `}</style>
      </AppShell>
    </>
  );
}

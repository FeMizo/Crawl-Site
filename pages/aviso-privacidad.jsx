import Head from "next/head";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function AvisoPrivacidadPage() {
  return (
    <>
      <Head>
        <title>Aviso de Privacidad | SEO Crawler</title>
        <meta
          name="description"
          content="Aviso de privacidad de SEO Crawler. Conoce cómo tratamos tus datos personales conforme a la LFPDPPP."
        />
        <link rel="canonical" href={`${APP_URL}/aviso-privacidad`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${APP_URL}/aviso-privacidad`} />
        <meta property="og:title" content="Aviso de Privacidad | SEO Crawler" />
        <meta property="og:description" content="Aviso de privacidad de SEO Crawler. Conoce cómo tratamos tus datos personales conforme a la LFPDPPP." />
        <meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />
      </Head>

      <AppShell
        activeKey=""
        user={null}
        showSidebar={false}
        kicker="Legal"
        title="Aviso de Privacidad"
        description="Última actualización: abril 2026"
      >
        <Card className="privacy-card">
          <Eyebrow icon={<Icon name="shield" size={12} />}>LFPDPPP</Eyebrow>

          <div className="privacy-body">
            <section>
              <h2>1. Responsable del tratamiento</h2>
              <p>
                <strong>AIONSITE</strong>, con domicilio en México y correo electrónico de contacto{" "}
                <a href="mailto:contacto@aionsite.com.mx">contacto@aionsite.com.mx</a>, es responsable
                del uso y protección de sus datos personales conforme a la{" "}
                <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</em> (LFPDPPP).
              </p>
            </section>

            <section>
              <h2>2. Datos personales que recabamos</h2>
              <p>Para las finalidades descritas en este aviso podemos recabar los siguientes datos:</p>
              <ul>
                <li>Nombre completo</li>
                <li>Correo electrónico</li>
                <li>Datos de navegación (dirección IP, páginas visitadas, tiempo de sesión)</li>
                <li>Información de pago procesada por Stripe (no almacenamos datos de tarjeta)</li>
              </ul>
            </section>

            <section>
              <h2>3. Finalidades del tratamiento</h2>
              <p><strong>Finalidades primarias (necesarias):</strong></p>
              <ul>
                <li>Crear y gestionar tu cuenta de usuario</li>
                <li>Procesar pagos y gestionar suscripciones</li>
                <li>Proveer el servicio de auditoría SEO</li>
                <li>Atender solicitudes de contacto y soporte</li>
              </ul>
              <p><strong>Finalidades secundarias (opcionales):</strong></p>
              <ul>
                <li>Enviar comunicaciones sobre nuevas funcionalidades o actualizaciones del servicio</li>
                <li>Realizar análisis estadísticos de uso de la plataforma</li>
              </ul>
              <p>
                Si no deseas que tus datos sean tratados para finalidades secundarias, puedes manifestarlo
                enviando un correo a{" "}
                <a href="mailto:contacto@aionsite.com.mx">contacto@aionsite.com.mx</a> con el asunto{" "}
                <em>Opt-out finalidades secundarias</em>.
              </p>
            </section>

            <section>
              <h2>4. Transferencia de datos</h2>
              <p>
                Tus datos personales pueden ser compartidos con terceros proveedores de servicios
                estrictamente necesarios para operar la plataforma:
              </p>
              <ul>
                <li><strong>Stripe</strong> — procesamiento de pagos</li>
                <li><strong>Neon / PostgreSQL</strong> — almacenamiento de datos</li>
                <li><strong>Vercel</strong> — infraestructura de hosting</li>
              </ul>
              <p>Estos proveedores están obligados a mantener la confidencialidad de tu información.</p>
            </section>

            <section>
              <h2>5. Derechos ARCO</h2>
              <p>
                Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento
                de tus datos personales. Para ejercer estos derechos envía una solicitud a{" "}
                <a href="mailto:contacto@aionsite.com.mx">contacto@aionsite.com.mx</a> incluyendo:
              </p>
              <ul>
                <li>Nombre completo y correo electrónico registrado</li>
                <li>Descripción clara del derecho que deseas ejercer</li>
                <li>Documentación que acredite tu identidad</li>
              </ul>
              <p>Daremos respuesta en un plazo máximo de 20 días hábiles.</p>
            </section>

            <section>
              <h2>6. Uso de cookies</h2>
              <p>
                Este sitio utiliza cookies de sesión para mantener tu autenticación y cookies de
                preferencias para recordar configuraciones de tema e idioma. No utilizamos cookies
                de seguimiento de terceros con fines publicitarios.
              </p>
            </section>

            <section>
              <h2>7. Cambios al aviso de privacidad</h2>
              <p>
                Nos reservamos el derecho de modificar este aviso en cualquier momento. Los cambios
                serán publicados en esta página. Te recomendamos revisarla periódicamente.
              </p>
            </section>
          </div>
        </Card>

        <style jsx>{`
          .privacy-card {
            display: grid;
            gap: 20px;
          }
          .privacy-body {
            display: grid;
            gap: 20px;
          }
          .privacy-body section {
            display: grid;
            gap: 8px;
          }
          .privacy-body h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            margin: 0;
            color: var(--text);
          }
          .privacy-body p {
            margin: 0;
            font-size: 13px;
            color: var(--text2);
            line-height: 1.7;
          }
          .privacy-body ul {
            margin: 0;
            padding-left: 20px;
            display: grid;
            gap: 4px;
          }
          .privacy-body li {
            font-size: 13px;
            color: var(--text2);
            line-height: 1.6;
          }
          .privacy-body a {
            color: var(--accent);
            text-decoration: none;
          }
          .privacy-body a:hover {
            text-decoration: underline;
          }
          .privacy-body strong {
            color: var(--text);
          }
          .privacy-body em {
            color: var(--text);
            font-style: italic;
          }
        `}</style>
      </AppShell>
    </>
  );
}

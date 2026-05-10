"use client";
import { useState, useEffect } from "react";

const GDPR_KEY = "gdpr_consent";
const GDPR_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

function setCookie(value) {
  document.cookie = `${GDPR_KEY}=${value}; max-age=${GDPR_MAX_AGE}; path=/; SameSite=Lax`;
}

function getCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${GDPR_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getGdprConsent() {
  return getCookie();
}

export default function GdprBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!getCookie()) setVisible(true);
  }, []);

  function accept() {
    setCookie("accepted");
    setVisible(false);
    setModalOpen(false);
  }

  function reject() {
    setCookie("rejected");
    setVisible(false);
    setModalOpen(false);
  }

  if (!visible) return null;

  return (
    <>
      <div className="gdpr-banner">
        <div className="gdpr-banner__content">
          <p className="gdpr-banner__text">
            <span className="gdpr-banner__icon">🍪</span>
            Usamos cookies técnicas y recopilamos datos de navegación (IP, dispositivo, sesión) para mantener el servicio funcionando y mejorarlo.
          </p>
          <div className="gdpr-banner__actions">
            <button className="gdpr-btn gdpr-btn--accept" onClick={accept}>Aceptar</button>
            <button className="gdpr-btn gdpr-btn--reject" onClick={reject}>Rechazar</button>
            <button className="gdpr-btn gdpr-btn--more" onClick={() => setModalOpen(true)}>Leer más</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="gdpr-overlay" onClick={() => setModalOpen(false)}>
          <div className="gdpr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gdpr-modal__header">
              <h2 className="gdpr-modal__title">Política de Privacidad y Cookies</h2>
              <button className="gdpr-modal__close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <div className="gdpr-modal__body">
              <div className="gdpr-section">
                <h3>Qué datos recopilamos</h3>
                <ul>
                  <li><strong>Dirección IP</strong> — para seguridad, prevención de abuso y detección de ubicación aproximada.</li>
                  <li><strong>Datos de navegación</strong> — páginas visitadas, tiempo de sesión, acciones dentro del panel.</li>
                  <li><strong>Información del dispositivo</strong> — tipo de navegador, sistema operativo, resolución de pantalla.</li>
                  <li><strong>Cookies de sesión</strong> — token de autenticación para mantenerte conectado.</li>
                </ul>
              </div>

              <div className="gdpr-section">
                <h3>Para qué los usamos</h3>
                <ul>
                  <li>Autenticación segura y control de acceso.</li>
                  <li>Análisis de uso para mejorar el servicio.</li>
                  <li>Detección de errores y problemas técnicos.</li>
                  <li>Cumplimiento de límites del plan y facturación.</li>
                </ul>
              </div>

              <div className="gdpr-section">
                <h3>Tipos de cookies</h3>
                <p>
                  <span className="gdpr-tag gdpr-tag--required">Necesarias</span>
                  Cookies de sesión (<code>auth_token</code>). Sin estas el sitio no funciona. No requieren consentimiento.
                </p>
                <p style={{ marginTop: 8 }}>
                  <span className="gdpr-tag gdpr-tag--optional">Opcionales</span>
                  Cookies de analytics y mejora de experiencia. Solo se activan si aceptas.
                </p>
              </div>

              <div className="gdpr-section">
                <h3>Si rechazas</h3>
                <p>
                  El sitio continúa funcionando con normalidad. Solo desactivamos las cookies opcionales de tracking y análisis. Las cookies técnicas esenciales (sesión, autenticación) siguen activas porque son necesarias para operar el servicio.
                </p>
              </div>

              <div className="gdpr-section">
                <h3>Tus derechos (GDPR)</h3>
                <ul>
                  <li><strong>Acceso</strong> — podés solicitar qué datos tenemos sobre vos.</li>
                  <li><strong>Rectificación</strong> — podés pedirnos que corrijamos datos incorrectos.</li>
                  <li><strong>Eliminación</strong> — podés solicitar que borremos tu cuenta y datos asociados.</li>
                  <li><strong>Portabilidad</strong> — podés pedir una copia de tus datos en formato legible.</li>
                  <li><strong>Oposición</strong> — podés oponerte al procesamiento de tus datos para fines no esenciales.</li>
                </ul>
              </div>

              <div className="gdpr-section">
                <h3>Contacto</h3>
                <p>
                  Para ejercer tus derechos o cualquier consulta sobre privacidad, escribinos a{" "}
                  <a href="mailto:femiss0693@gmail.com" className="gdpr-link">femiss0693@gmail.com</a>.
                </p>
              </div>
            </div>

            <div className="gdpr-modal__footer">
              <button className="gdpr-btn gdpr-btn--reject" onClick={reject}>Rechazar</button>
              <button className="gdpr-btn gdpr-btn--accept" onClick={accept}>Aceptar todo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

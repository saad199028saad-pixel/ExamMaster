import React, { useEffect, useState } from "react";

/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Écran de fermeture d'un test / examen en ligne.
 * Design "plateforme d'examen officielle" : sobre, premium, rassurant.
 *
 * - Aucune dépendance externe (uniquement React).
 * - Toutes les animations et styles sont injectés via une balise <style>
 *   pour que le composant reste 100% autonome dans un seul fichier.
 * - Entièrement responsive (mobile / tablette / desktop).
 * ---------------------------------------------------------------------------
 */

export default function App() {
  // Petit état pour déclencher l'entrée en scène de la carte
  // (fade-in + zoom) une fois le composant monté.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // On attend un micro-délai pour être sûr que la transition CSS
    // parte bien de son état initial (évite un "saut" sans animation).
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.page}>
      {/* Formes floues animées en arrière-plan, très discrètes */}
      <div style={styles.blobTopLeft} aria-hidden="true" />
      <div style={styles.blobBottomRight} aria-hidden="true" />
      <div style={styles.blobCenter} aria-hidden="true" />

      {/* Carte centrale */}
      <main
        style={{
          ...styles.card,
          opacity: mounted ? 1 : 0,
          transform: mounted
            ? "translateY(0) scale(1)"
            : "translateY(18px) scale(0.96)",
        }}
        role="main"
        aria-label="Statut du test : fermé"
      >
        {/* Icône bouclier / cadenas */}
        <div style={styles.iconWrapper}>
          <div style={styles.iconPulseRing} aria-hidden="true" />
          <div style={styles.iconCircle}>
            <ShieldLockIcon />
          </div>
        </div>

        {/* Titre principal */}
        <h1 style={styles.title}>TEST FERMÉ</h1>

        {/* Sous-texte explicatif */}
        <p style={styles.subtitle}>
          Les soumissions sont désormais closes.
          <br />
          Merci pour votre participation.
        </p>
        <p style={styles.subtitleStrong}>
          Il n'est plus possible d'accéder au test.
        </p>

        {/* Encadré d'information */}
        <div style={styles.infoBox}>
          <InfoLine text="Le temps du test est terminé." />
          <InfoLine text="Les réponses ont été enregistrées (si elles ont été soumises)." />
          <InfoLine text="Contactez votre enseignant en cas de problème." />
        </div>

        {/* Séparateur discret */}
        <div style={styles.divider} />

        {/* Pied de carte : identité de l'établissement */}
        <footer style={styles.footer}>
          <p style={styles.footerLine1}>Faculté des Sciences Ben M'Sick</p>
          <p style={styles.footerLine2}>Département de Mathématiques</p>
        </footer>
      </main>

      {/* Styles globaux + animations (keyframes) */}
      <style>{`
        @keyframes pulseRing {
          0% {
            transform: scale(0.85);
            opacity: 0.55;
          }
          70% {
            transform: scale(1.35);
            opacity: 0;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }

        @keyframes floatSlow {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(20px, -25px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes floatSlowReverse {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-25px, 20px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }

        * {
          box-sizing: border-box;
        }

        html, body, #root {
          height: 100%;
          margin: 0;
        }

        body {
          font-family: 'Segoe UI', 'Inter', system-ui, -apple-system,
            'Helvetica Neue', Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * Sous-composants
 * --------------------------------------------------------------------- */

// Ligne de l'encadré d'information, avec coche verte discrète.
function InfoLine({ text }) {
  return (
    <div style={styles.infoLine}>
      <span style={styles.checkMark}>✔</span>
      <span style={styles.infoText}>{text}</span>
    </div>
  );
}

// Icône SVG "bouclier + cadenas" (aucune dépendance externe requise).
function ShieldLockIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"
        fill="rgba(255,255,255,0.12)"
        stroke="#F8FAFC"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect
        x="9"
        y="11"
        width="6"
        height="5"
        rx="1"
        fill="#F8FAFC"
      />
      <path
        d="M10 11V9.6a2 2 0 1 1 4 0V11"
        stroke="#F8FAFC"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -----------------------------------------------------------------------
 * Styles (objets JS, aucune dépendance CSS externe)
 * --------------------------------------------------------------------- */

const NAVY = "#0B1F3A";
const NAVY_DEEP = "#081527";
const NAVY_SOFT = "#13294F";
const RED_DISCREET = "#B3312C";
const WHITE = "#F8FAFC";

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    overflow: "hidden",
    background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 45%, ${NAVY_SOFT} 100%)`,
  },

  // Formes floues d'ambiance (très discrètes, faible opacité)
  blobTopLeft: {
    position: "absolute",
    top: "-10%",
    left: "-8%",
    width: "38vw",
    height: "38vw",
    maxWidth: 420,
    maxHeight: 420,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 70%)",
    filter: "blur(10px)",
    animation: "floatSlow 14s ease-in-out infinite",
    pointerEvents: "none",
  },
  blobBottomRight: {
    position: "absolute",
    bottom: "-12%",
    right: "-10%",
    width: "42vw",
    height: "42vw",
    maxWidth: 460,
    maxHeight: 460,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(179,49,44,0.14) 0%, rgba(179,49,44,0) 70%)",
    filter: "blur(10px)",
    animation: "floatSlowReverse 16s ease-in-out infinite",
    pointerEvents: "none",
  },
  blobCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "60vw",
    height: "60vw",
    maxWidth: 600,
    maxHeight: 600,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0) 70%)",
    filter: "blur(20px)",
    pointerEvents: "none",
  },

  // Carte centrale (glassmorphism)
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 480,
    padding: "48px 36px 36px",
    borderRadius: "24px",
    textAlign: "center",
    background: "rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow:
      "0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
    transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
  },

  iconWrapper: {
    position: "relative",
    width: 76,
    height: 76,
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconPulseRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: `2px solid ${RED_DISCREET}`,
    animation: "pulseRing 2.4s ease-out infinite",
  },
  iconCircle: {
    position: "relative",
    width: 68,
    height: 68,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(145deg, ${NAVY_SOFT}, ${NAVY_DEEP})`,
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },

  title: {
    margin: "0 0 14px",
    fontSize: "clamp(24px, 4vw, 30px)",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: WHITE,
  },

  subtitle: {
    margin: "0 0 4px",
    fontSize: 15.5,
    lineHeight: 1.6,
    color: "rgba(248, 250, 252, 0.82)",
  },
  subtitleStrong: {
    margin: "0 0 26px",
    fontSize: 14,
    fontWeight: 600,
    color: RED_DISCREET,
  },

  infoBox: {
    textAlign: "left",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    padding: "18px 20px",
    marginBottom: "28px",
  },
  infoLine: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "6px 0",
  },
  checkMark: {
    color: "#4ADE80",
    fontSize: 14,
    lineHeight: "22px",
    flexShrink: 0,
  },
  infoText: {
    fontSize: 13.5,
    lineHeight: 1.55,
    color: "rgba(248, 250, 252, 0.88)",
  },

  divider: {
    height: 1,
    width: "100%",
    background:
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
    marginBottom: "20px",
  },

  footer: {
    lineHeight: 1.5,
  },
  footerLine1: {
    margin: 0,
    fontSize: 13.5,
    fontWeight: 600,
    color: "rgba(248, 250, 252, 0.75)",
  },
  footerLine2: {
    margin: 0,
    fontSize: 12.5,
    color: "rgba(248, 250, 252, 0.5)",
  },
};

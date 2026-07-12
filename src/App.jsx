/**
 * ============================================================
 *  PyExam Studio — Plateforme d'Évaluation Python
 *  Fichier unique : App.jsx
 *  Design : JupyterLab-inspired, glassmorphism, dark pro theme
 *
 *  NOUVELLES FONCTIONNALITÉS (v2) :
 *  1. Affichage pédagogique structuré des énoncés
 *  2. Support LaTeX via KaTeX (CDN)
 *  3. Import Excel des étudiants via SheetJS
 *  4. Vérification stricte des informations étudiant
 *  5. Interface d'administration enrichie
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DEFAULT_STUDENTS,
  DEFAULT_NOTEBOOKS,
  DEFAULT_EXERCISES,
  DEFAULT_QUESTIONS,
} from "./Data.js";

// ─────────────────────────────────────────────
//  CHARGEMENT DYNAMIQUE DE KATEX (CDN)
//  KaTeX est injecté une seule fois dans le <head>
// ─────────────────────────────────────────────

let katexLoaded = false;
let katexLoadingPromise = null;

const loadKaTeX = () => {
  if (katexLoaded) return Promise.resolve();
  if (katexLoadingPromise) return katexLoadingPromise;

  katexLoadingPromise = new Promise((resolve, reject) => {
    // Feuille de style KaTeX
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
    document.head.appendChild(link);

    // Script KaTeX
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
    script.onload = () => {
      // Script auto-render pour les délimiteurs $...$ et $$...$$
      const autoScript = document.createElement("script");
      autoScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js";
      autoScript.onload = () => {
        katexLoaded = true;
        resolve();
      };
      autoScript.onerror = reject;
      document.head.appendChild(autoScript);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return katexLoadingPromise;
};

// ─────────────────────────────────────────────
//  CHARGEMENT DYNAMIQUE DE SHEETJS (CDN)
//  Pour lire les fichiers Excel .xlsx
// ─────────────────────────────────────────────

let xlsxLoaded = false;
let xlsxLoadingPromise = null;

const loadXLSX = () => {
  if (xlsxLoaded) return Promise.resolve();
  if (xlsxLoadingPromise) return xlsxLoadingPromise;

  xlsxLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => { xlsxLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return xlsxLoadingPromise;
};

// ─────────────────────────────────────────────
//  CHARGEMENT DYNAMIQUE DE MARKED.JS (CDN)
//  Pour le rendu Markdown des cellules Texte
// ─────────────────────────────────────────────

let markedLoaded = false;
let markedLoadingPromise = null;

const loadMarked = () => {
  if (markedLoaded) return Promise.resolve();
  if (markedLoadingPromise) return markedLoadingPromise;

  markedLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js";
    script.onload = () => { markedLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return markedLoadingPromise;
};

// ─────────────────────────────────────────────
//  CHARGEMENT DYNAMIQUE DE JSPDF + AUTOTABLE
//  Pour la génération de PDF professionnels
// ─────────────────────────────────────────────

let jsPDFLoaded = false;
let jsPDFLoadingPromise = null;

const loadJsPDF = () => {
  if (jsPDFLoaded) return Promise.resolve();
  if (jsPDFLoadingPromise) return jsPDFLoadingPromise;

  jsPDFLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      const autoTable = document.createElement("script");
      autoTable.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
      autoTable.onload = () => { jsPDFLoaded = true; resolve(); };
      autoTable.onerror = reject;
      document.head.appendChild(autoTable);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return jsPDFLoadingPromise;
};

// ─────────────────────────────────────────────
//  CHARGEMENT DYNAMIQUE DE SUPABASE-JS (CDN)
//  Pour l'enregistrement automatique et sécurisé
//  du PDF dans le Storage Bucket (aucun téléchargement local)
// ─────────────────────────────────────────────

let supabaseJsLoaded = false;
let supabaseJsLoadingPromise = null;

const loadSupabaseJs = () => {
  if (supabaseJsLoaded) return Promise.resolve();
  if (supabaseJsLoadingPromise) return supabaseJsLoadingPromise;

  supabaseJsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
    script.onload = () => { supabaseJsLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return supabaseJsLoadingPromise;
};

// ── Configuration Supabase ──
const SUPABASE_URL = "https://lcsyjwyxmaxebsmjlqpi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_L444eMiupJs_noJVn4PGlA_8Ih3Wwws";
const SUPABASE_PDF_BUCKET = "TpEval";

let supabaseClientSingleton = null;

/**
 * Retourne un client Supabase unique (singleton), en chargeant
 * la librairie via CDN si nécessaire.
 */
const getSupabaseClient = async () => {
  await loadSupabaseJs();
  if (!supabaseClientSingleton) {
    supabaseClientSingleton = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClientSingleton;
};

/**
 * Nettoie une chaîne pour en faire un segment de chemin de fichier
 * sûr (pas d'accents, d'espaces ou de caractères spéciaux).
 */
const sanitizeForFilename = (str) =>
  (str || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // retire les accents
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

/**
 * Envoie le PDF (Blob) directement dans le bucket Supabase Storage.
 * Le fichier n'est jamais exposé au téléchargement côté client :
 * il est uniquement transmis au stockage distant.
 */
const uploadPdfToSupabase = async (pdfBlob, filename) => {
  const client = await getSupabaseClient();
  const { data, error } = await client.storage
    .from(SUPABASE_PDF_BUCKET)
    .upload(filename, pdfBlob, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────
//  UTILITAIRES DE SOUMISSION
// ─────────────────────────────────────────────

/**
 * Génère un identifiant de soumission sécurisé (UUID v4 simplifié + hash)
 */
const generateSubmissionId = (student, timestamp) => {
  const random = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  const apogeeFragment = student.apogee.slice(-4);
  const ts = timestamp.toString(36).toUpperCase().slice(-4);
  return `EXM-${apogeeFragment}-${ts}-${random()}-${random()}`;
};

/**
 * Calcule un code de vérification basé sur les données de soumission
 * (hash simplifié pour usage pédagogique)
 */
const computeVerificationCode = (submissionId, apogee, timestamp) => {
  const raw = `${submissionId}|${apogee}|${timestamp}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
};

/**
 * Sauvegarde une soumission dans le localStorage
 */
const saveSubmission = (submission) => {
  const all = lsGet(STORAGE_KEYS.SUBMISSIONS, []);
  // Évite les doublons par submissionId
  const idx = all.findIndex((s) => s.submissionId === submission.submissionId);
  if (idx !== -1) {
    all[idx] = submission;
  } else {
    all.unshift(submission); // plus récent en premier
  }
  lsSet(STORAGE_KEYS.SUBMISSIONS, all);
};

/**
 * Nettoie le texte LaTeX pour l'affichage PDF (supprime les balises $)
 */
const stripLatex = (text = "") =>
  text
    .replace(/\$\$[\s\S]*?\$\$/g, "[formule]")
    .replace(/\$([^$]+)\$/g, (_, m) => m.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1").replace(/[\\_^{}\\\\]/g, ""))
    .replace(/\\\\/g, " ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .trim();

// ─────────────────────────────────────────────
//  CONSTANTES & DONNÉES INITIALES
// ─────────────────────────────────────────────

const ADMIN_CREDENTIALS = { login: "admin", password: "admin123" };

const STORAGE_KEYS = {
  STUDENTS: "pyexam_students",
  QUESTIONS: "pyexam_questions",
  NOTEBOOKS: "pyexam_notebooks",
  SESSION: "pyexam_session",
  ANSWERS: "pyexam_answers",
  EXAM_STATE: "pyexam_exam_state",
  SUBMISSIONS: "pyexam_submissions",
  EXERCISES: "pyexam_exercises",
  VIOLATIONS: "pyexam_security_violations",
  THEME: "pyexam_theme",
};

const MAX_VIOLATIONS = 10;

const EXAM_DURATION = 90 * 60; // 90 minutes en secondes

// ─────────────────────────────────────────────
//  DONNÉES (étudiants, notebooks, exercices, questions)
//  Externalisées dans Data.js et importées en haut du fichier.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  UTILITAIRES
// ─────────────────────────────────────────────

/** Lecture sécurisée du localStorage */
const lsGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

/** Écriture sécurisée dans localStorage */
const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

/** Génère un identifiant unique */
const uid = () => Math.random().toString(36).slice(2, 10);

/** Formate les secondes en MM:SS */
const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

/** Normalise une chaîne pour comparaison insensible à la casse et aux accents */
const normalize = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// ─────────────────────────────────────────────
//  COLORATION SYNTAXIQUE PYTHON (pur JS)
// ─────────────────────────────────────────────

const escHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Coloration syntaxique Python inspirée VS Code Dark+
 * Retourne du HTML avec des <span> colorés.
 */
const highlightPython = (code) => {
  const keywords =
    /\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g;
  const builtins =
    /\b(print|len|range|int|float|str|list|dict|set|tuple|bool|type|input|open|enumerate|zip|map|filter|sorted|reversed|sum|min|max|abs|round|isinstance|issubclass|hasattr|getattr|setattr|delattr|callable|iter|next|repr|id|hash|hex|oct|bin|chr|ord|format|vars|dir|help|object|super|property|staticmethod|classmethod)\b/g;
  const strings =
    /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /(#[^\n]*)/g;
  const numbers = /\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g;
  const decorators = /(@\w+)/g;
  // Nom de fonction/classe déclaré juste après "def"/"class" (façon VS Code)
  const functionDefs = /(?<=\bdef[ \t]+)[A-Za-z_]\w*/g;
  const classDefs = /(?<=\bclass[ \t]+)[A-Za-z_]\w*/g;
  // Appels de fonction : identifiant directement suivi de "("
  const functionCalls = /\b[A-Za-z_]\w*(?=[ \t]*\()/g;
  // self / cls, colorés distinctement comme dans VS Code
  const selfCls = /\b(self|cls)\b/g;

  const tokens = [];
  const addTokens = (regex, type) => {
    let m;
    const re = new RegExp(regex.source, "g");
    while ((m = re.exec(code)) !== null) {
      tokens.push({
        start: m.index,
        end: m.index + m[0].length,
        type,
        text: m[0],
      });
      if (m[0].length === 0) re.lastIndex++; // garde-fou anti-boucle infinie
    }
  };

  addTokens(comments, "comment");
  addTokens(strings, "string");
  addTokens(decorators, "decorator");
  addTokens(functionDefs, "function");
  addTokens(classDefs, "class");
  addTokens(keywords, "keyword");
  addTokens(selfCls, "self");
  addTokens(builtins, "builtin");
  addTokens(functionCalls, "function");
  addTokens(numbers, "number");

  tokens.sort((a, b) => a.start - b.start || b.end - a.end);

  const occupied = new Uint8Array(code.length);
  const final = [];
  for (const t of tokens) {
    let ok = true;
    for (let i = t.start; i < t.end; i++) if (occupied[i]) { ok = false; break; }
    if (ok) {
      for (let i = t.start; i < t.end; i++) occupied[i] = 1;
      final.push(t);
    }
  }

  // Coloration des parenthèses / crochets / accolades par niveau de profondeur
  // (comme le "Bracket Pair Colorization" de VS Code), en ignorant les zones
  // déjà occupées par une chaîne ou un commentaire.
  let depth = 0;
  const BRACKET_TYPES = ["bracket1", "bracket2", "bracket3"];
  for (let i = 0; i < code.length; i++) {
    if (occupied[i]) continue;
    const ch = code[i];
    if (ch === "(" || ch === "[" || ch === "{") {
      final.push({ start: i, end: i + 1, type: BRACKET_TYPES[depth % 3], text: ch });
      depth++;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      depth = Math.max(0, depth - 1);
      final.push({ start: i, end: i + 1, type: BRACKET_TYPES[depth % 3], text: ch });
    }
  }

  final.sort((a, b) => a.start - b.start);

  const COLOR = {
    keyword: "var(--syn-keyword)",
    builtin: "var(--syn-builtin)",
    string: "var(--syn-string)",
    comment: "var(--syn-comment)",
    number: "var(--syn-number)",
    decorator: "var(--syn-decorator)",
    function: "var(--syn-function)",
    class: "var(--syn-class)",
    self: "var(--syn-self)",
    bracket1: "var(--syn-bracket-1)",
    bracket2: "var(--syn-bracket-2)",
    bracket3: "var(--syn-bracket-3)",
  };

  let html = "";
  let cur = 0;
  for (const t of final) {
    if (t.start > cur) html += escHtml(code.slice(cur, t.start));
    const color = COLOR[t.type];
    const style =
      t.type === "comment"
        ? `color:${color};font-style:italic;background:var(--syn-comment-bg);`
        : t.type === "self"
        ? `color:${color};font-style:italic;`
        : `color:${color};`;
    html += `<span style="${style}">${escHtml(t.text)}</span>`;
    cur = t.end;
  }
  if (cur < code.length) html += escHtml(code.slice(cur));
  return html;
};

// ─────────────────────────────────────────────
//  INDENTATION INTELLIGENTE (façon VS Code)
//  — utilisée par tous les éditeurs de code de l'app —
// ─────────────────────────────────────────────

const INDENT_UNIT = "    "; // 4 espaces, comme configuré dans le reste de l'éditeur

const getLineIndent = (line) => {
  const m = line.match(/^[ \t]*/);
  return m ? m[0] : "";
};

// Une ligne se terminant par ":" (hors commentaire) déclenche une indentation
// supplémentaire à la ligne suivante, comme dans VS Code.
const lineEndsWithColon = (line) => {
  const withoutComment = line.split("#")[0];
  return /:\s*$/.test(withoutComment.trimEnd());
};

/**
 * Calcule le résultat d'une pression sur "Entrée" avec indentation intelligente :
 *  - conserve l'indentation de la ligne courante,
 *  - l'augmente d'un niveau après une ligne se terminant par ":",
 *  - la réduit d'un niveau si la ligne courante est vide et indentée
 *    (comme lorsqu'on quitte un bloc dans un IDE professionnel).
 */
const computeSmartEnter = (value, cursorPos) => {
  const before = value.slice(0, cursorPos);
  const after = value.slice(cursorPos);
  const lastNl = before.lastIndexOf("\n");
  const currentLine = before.slice(lastNl + 1);
  const indent = getLineIndent(currentLine);
  const trimmed = currentLine.trim();

  let newIndent = indent;

  if (trimmed === "" && indent.length > 0) {
    newIndent =
      indent.length >= INDENT_UNIT.length
        ? indent.slice(0, indent.length - INDENT_UNIT.length)
        : "";
  } else if (lineEndsWithColon(currentLine)) {
    newIndent = indent + INDENT_UNIT;
  }

  const insertion = "\n" + newIndent;
  return {
    value: before + insertion + after,
    cursor: before.length + insertion.length,
  };
};

/**
 * Gère Tab / Shift+Tab avec support de la sélection multi-lignes, comme dans VS Code :
 *  - Tab sans sélection : insère 4 espaces au curseur,
 *  - Tab avec sélection multi-lignes : indente chaque ligne sélectionnée,
 *  - Shift+Tab : désindente (jusqu'à 4 espaces ou une tabulation) chaque ligne concernée.
 */
const computeTabIndent = (value, selStart, selEnd, shiftKey) => {
  if (selStart === selEnd && !shiftKey) {
    return {
      value: value.slice(0, selStart) + INDENT_UNIT + value.slice(selEnd),
      selStart: selStart + INDENT_UNIT.length,
      selEnd: selStart + INDENT_UNIT.length,
    };
  }

  const lineStart = value.lastIndexOf("\n", selStart - 1) + 1;
  let lineEnd = value.indexOf("\n", selEnd);
  if (lineEnd === -1) lineEnd = value.length;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");

  let firstLineDelta = 0;
  let totalDelta = 0;

  const newLines = lines.map((line, idx) => {
    if (shiftKey) {
      let removed = 0;
      let newLine = line;
      if (newLine.startsWith(INDENT_UNIT)) {
        newLine = newLine.slice(INDENT_UNIT.length);
        removed = INDENT_UNIT.length;
      } else if (newLine.startsWith("\t")) {
        newLine = newLine.slice(1);
        removed = 1;
      } else {
        const m = newLine.match(/^ {1,3}/);
        if (m) {
          newLine = newLine.slice(m[0].length);
          removed = m[0].length;
        }
      }
      if (idx === 0) firstLineDelta = -removed;
      totalDelta -= removed;
      return newLine;
    } else {
      if (idx === 0) firstLineDelta = INDENT_UNIT.length;
      totalDelta += INDENT_UNIT.length;
      return INDENT_UNIT + line;
    }
  });

  const newBlock = newLines.join("\n");
  const newValue = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);

  return {
    value: newValue,
    selStart: Math.max(lineStart, selStart + firstLineDelta),
    selEnd: selEnd + totalDelta,
  };
};

// ─────────────────────────────────────────────
//  STYLES GLOBAUX (injectés dans <head>)
// ─────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-root:    #0d1117;
    --bg-card:    #161b22;
    --bg-panel:   #1c2128;
    --bg-cell:    #0d1117;
    --bg-hover:   #21262d;
    --border:     #30363d;
    --border-acc: #388bfd;
    --text-pri:   #e6edf3;
    --text-sec:   #8b949e;
    --text-muted: #66707b;
    --accent:     #388bfd;
    --accent-2:   #7ee787;
    --accent-3:   #f78166;
    --accent-4:   #d2a8ff;
    --warn:       #e3b341;
    --danger:     #f85149;
    --success:    #3fb950;
    --radius:     8px;
    --radius-lg:  12px;
    --shadow:     0 8px 32px rgba(0,0,0,.4);
    --shadow-sm:  0 2px 8px rgba(0,0,0,.3);
    --glass:      rgba(22,27,34,0.85);
    --font-mono:  'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    --font-ui:    'Inter', system-ui, -apple-system, sans-serif;
    --transition: 0.18s cubic-bezier(0.4,0,0.2,1);
    --scrollbar-thumb: var(--border);
    --scrollbar-thumb-hover: var(--text-muted);

    /* Échelle typographique (légèrement agrandie, harmonieuse) */
    --fs-2xs: 11px;
    --fs-xs:  12.5px;
    --fs-sm:  13.5px;
    --fs-md:  14.5px;
    --fs-lg:  16px;
    --fs-xl:  18px;
    --fs-2xl: 22px;
    --fs-code: 15.5px;

    /* Palette de coloration syntaxique — inspirée VS Code Dark+, claire et contrastée */
    --syn-keyword:    #ff9d4d;   /* mots-clés : orange */
    --syn-builtin:    #61afef;   /* fonctions natives : bleu */
    --syn-string:     #f0dfa0;   /* chaînes : jaune clair */
    --syn-comment:    #6a9955;   /* commentaires : vert */
    --syn-comment-bg: rgba(106,153,85,0.08);
    --syn-number:     #8ecdf7;   /* nombres : bleu clair */
    --syn-decorator:  #e5c07b;
    --syn-function:   #56b6ff;   /* fonctions (déclaration/appel) : bleu */
    --syn-class:      #e0c15c;   /* classes : jaune */
    --syn-self:       #6fc7e8;   /* self / cls */
    --syn-bracket-1:  #ffd866;   /* parenthèses/crochets : discrets, par profondeur */
    --syn-bracket-2:  #c792ea;
    --syn-bracket-3:  #7fdbca;
  }

  /* ── Thème clair, professionnel ── */
  html[data-theme="light"] {
    --bg-root:    #f6f8fa;
    --bg-card:    #ffffff;
    --bg-panel:   #ffffff;
    --bg-cell:    #f6f8fa;
    --bg-hover:   #eef1f4;
    --border:     #d7dce1;
    --border-acc: #0969da;
    --text-pri:   #1f2328;
    --text-sec:   #57606a;
    --text-muted: #8c959f;
    --accent:     #0969da;
    --accent-2:   #1a7f37;
    --accent-3:   #bc4c00;
    --accent-4:   #8250df;
    --warn:       #9a6700;
    --danger:     #cf222e;
    --success:    #1a7f37;
    --shadow:     0 8px 28px rgba(31,35,40,.12);
    --shadow-sm:  0 2px 8px rgba(31,35,40,.08);
    --glass:      rgba(255,255,255,0.9);

    --syn-keyword:    #bf5b04;
    --syn-builtin:    #4078f2;
    --syn-string:     #8a6d1d;
    --syn-comment:    #2e7d32;
    --syn-comment-bg: rgba(46,125,50,0.08);
    --syn-number:     #1a73e8;
    --syn-decorator:  #c18401;
    --syn-function:   #0966d1;
    --syn-class:      #8a6d1d;
    --syn-self:       #0969da;
    --syn-bracket-1:  #a6790a;
    --syn-bracket-2:  #9b59b6;
    --syn-bracket-3:  #0f9d8d;
  }

  html, body, #root { height: 100%; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: var(--font-ui);
    background: var(--bg-root);
    color: var(--text-pri);
    line-height: 1.65;
    font-size: var(--fs-sm);
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Transition instantanée mais douce entre thèmes clair / sombre */
  body, .glass-card, .sidebar, .app-header, .modal-box, .exercise-card,
  .cell-wrapper, .stat-card, .toast, .enonce-card, .md-cell, .question-block,
  .code-textarea, .code-highlight, .btn, .input, .exercise-sidebar-item,
  .sidebar-item, .add-cell-menu, .exam-start-card, .violation-box {
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
  * { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent; }
  * { scroll-behavior: smooth; }

  ::selection { background: rgba(56,139,253,0.3); }
  html[data-theme="light"] ::selection { background: rgba(9,105,218,0.18); }

  /* Empêche tout débordement horizontal accidentel */
  img, svg, video, canvas, table, pre { max-width: 100%; }
  pre { overflow-x: auto; }

  /* Keyframes */
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes ripple  { from{transform:scale(0);opacity:.6} to{transform:scale(4);opacity:0} }
  @keyframes popIn   { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }

  .fade-in  { animation: fadeIn .25s ease forwards; }
  .slide-in { animation: slideIn .2s ease forwards; }

  /* Glassmorphism card */
  .glass-card {
    background: var(--glass);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
  }

  /* Boutons — plus premium : léger relief, meilleure zone tactile */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 15px; border-radius: var(--radius);
    font-family: var(--font-ui); font-size: var(--fs-sm); font-weight: 500;
    cursor: pointer; border: 1px solid transparent;
    transition: all var(--transition);
    user-select: none; white-space: nowrap;
    letter-spacing: .1px;
  }
  .btn:active { transform: scale(0.97); }
  .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .btn-primary   { background: var(--accent);   color: #fff; border-color: var(--accent); box-shadow: 0 1px 0 rgba(0,0,0,.08); }
  .btn-primary:hover { background: #58a6ff; box-shadow: 0 2px 10px rgba(56,139,253,.35); }
  .btn-success   { background: var(--success);  color: #04170a; border-color: var(--success); }
  .btn-success:hover { filter: brightness(1.08); box-shadow: 0 2px 10px rgba(63,185,80,.3); }
  .btn-danger    { background: var(--danger);   color: #fff; border-color: var(--danger); }
  .btn-danger:hover  { filter: brightness(1.08); box-shadow: 0 2px 10px rgba(248,81,73,.3); }
  .btn-warn      { background: var(--warn);     color: #221a00; border-color: var(--warn); }
  .btn-warn:hover    { filter: brightness(1.08); }
  .btn-ghost     { background: transparent; color: var(--text-sec); border-color: var(--border); }
  .btn-ghost:hover   { background: var(--bg-hover); color: var(--text-pri); border-color: var(--text-muted); }
  .btn-excel     { background: #1d6f42; color: #fff; border-color: #1d6f42; }
  .btn-excel:hover   { background: #228b52; }
  .btn-sm { padding: 5px 11px; font-size: var(--fs-xs); }
  .btn-xs { padding: 3px 8px;  font-size: var(--fs-2xs); }
  .btn:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }

  /* Input */
  .input {
    width: 100%; padding: 9px 13px;
    background: var(--bg-root); color: var(--text-pri);
    border: 1px solid var(--border); border-radius: var(--radius);
    font-family: var(--font-ui); font-size: var(--fs-sm);
    transition: border-color var(--transition), box-shadow var(--transition);
    outline: none;
  }
  .input:hover { border-color: var(--text-muted); }
  .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(56,139,253,.15); }
  .input::placeholder { color: var(--text-muted); }

  textarea.input { resize: vertical; font-family: var(--font-mono); }

  /* Badge */
  .badge {
    display: inline-flex; align-items: center; padding: 2px 9px;
    border-radius: 99px; font-size: var(--fs-2xs); font-weight: 600;
    border: 1px solid transparent;
  }
  .badge-blue   { background: rgba(56,139,253,.15); color: var(--accent);   border-color: rgba(56,139,253,.3); }
  .badge-green  { background: rgba(63,185,80,.15);  color: var(--success);  border-color: rgba(63,185,80,.3); }
  .badge-orange { background: rgba(227,179,65,.15); color: var(--warn);     border-color: rgba(227,179,65,.3); }
  .badge-red    { background: rgba(248,81,73,.15);  color: var(--danger);   border-color: rgba(248,81,73,.3); }
  .badge-purple { background: rgba(210,168,255,.15);color: var(--accent-4); border-color: rgba(210,168,255,.3); }

  /* Progress bar */
  .progress-bar {
    height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-4));
    border-radius: 3px; transition: width 0.5s ease;
  }

  /* Tabs */
  .tab-bar { display: flex; gap: 2px; padding: 4px; background: var(--bg-root); border-radius: var(--radius); flex-wrap: wrap; }
  .tab-item {
    padding: 7px 15px; border-radius: 6px; font-size: var(--fs-sm); font-weight: 500;
    cursor: pointer; transition: all var(--transition); color: var(--text-sec);
  }
  .tab-item.active { background: var(--bg-panel); color: var(--text-pri); box-shadow: var(--shadow-sm); }
  .tab-item:hover:not(.active) { background: var(--bg-hover); }

  /* Modal overlay */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn .15s ease;
    padding: 16px;
  }
  .modal-box {
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 24px; width: min(500px, 95vw);
    box-shadow: var(--shadow); animation: popIn .2s cubic-bezier(0.4,0,0.2,1);
    max-height: 90vh; overflow-y: auto;
  }

  /* Notification toast */
  .toast-container {
    position: fixed; top: 16px; right: 16px; left: 16px; z-index: 9999;
    display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
    pointer-events: none;
  }
  .toast-container .toast { pointer-events: auto; }
  .toast {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 17px; border-radius: var(--radius);
    background: var(--bg-panel); border: 1px solid var(--border);
    box-shadow: var(--shadow); animation: slideIn .2s ease;
    font-size: var(--fs-sm); font-weight: 500; min-width: 240px; max-width: min(380px, 90vw);
  }
  .toast-error   { border-color: var(--danger);  color: var(--danger); }
  .toast-success { border-color: var(--success); color: var(--success); }
  .toast-warn    { border-color: var(--warn);    color: var(--warn); }
  .toast-info    { border-color: var(--accent);  color: var(--accent); }

  /* Code cell */
  .cell-wrapper {
    position: relative;
    background: var(--bg-cell);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: border-color var(--transition), box-shadow var(--transition);
    overflow: hidden;
  }
  .cell-wrapper:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(56,139,253,.12);
  }
  .cell-wrapper.running {
    border-color: var(--warn);
    box-shadow: 0 0 0 3px rgba(227,179,65,.12);
  }

  /* ── Éditeur de code façon IDE moderne ── */
  .code-container {
    display: flex; min-height: 80px;
    font-family: var(--font-mono); font-size: var(--fs-code); font-weight: 500;
    line-height: 1.7; letter-spacing: 0.1px;
    font-feature-settings: "liga" 1, "calt" 1;
    font-variant-ligatures: contextual;
    position: relative;
    overflow-x: auto;
  }
  .line-numbers {
    min-width: 46px; padding: 8px 6px;
    background: rgba(255,255,255,.025);
    border-right: 1px solid var(--border);
    color: var(--text-muted); font-size: var(--fs-code); font-weight: 500;
    text-align: right; user-select: none;
    display: flex; flex-direction: column;
    position: sticky; left: 0; z-index: 2;
  }
  .line-num { line-height: 1.7; padding: 0 6px; transition: color var(--transition); }
  .code-edit-area {
    position: relative; flex: 1; overflow: hidden; min-width: 220px;
  }
  /* Aucune ligne de fond : indentation et retours à la ligne du code affichés tels quels */
  .code-highlight {
    position: absolute; inset: 0;
    padding: 8px 12px; pointer-events: none;
    white-space: pre; overflow: auto;
    color: var(--text-pri);
    tab-size: 4;
  }
  .code-textarea {
    position: absolute; inset: 0;
    padding: 8px 12px;
    background-color: transparent; color: transparent; caret-color: var(--accent);
    caret-shape: bar;
    border: none; outline: none; resize: none;
    font-family: var(--font-mono); font-size: var(--fs-code); font-weight: 500; line-height: 1.7; letter-spacing: 0.1px;
    white-space: pre; overflow: auto; tab-size: 4;
    -webkit-text-fill-color: transparent;
  }
  .code-textarea::selection { background: rgba(56,139,253,.28); }
  html[data-theme="light"] .code-textarea::selection { background: rgba(9,105,218,.2); }

  /* Output area */
  .cell-output {
    border-top: 1px solid var(--border);
    padding: 10px 12px;
    font-family: var(--font-mono); font-size: var(--fs-xs);
    color: var(--accent-2); white-space: pre-wrap; word-break: break-word;
    background: rgba(0,0,0,.2);
    max-height: 200px; overflow-y: auto;
  }
  html[data-theme="light"] .cell-output { background: rgba(9,105,218,.04); }
  .cell-output.error { color: var(--danger); }

  /* Sidebar */
  .sidebar {
    width: 220px; flex-shrink: 0;
    background: var(--bg-card);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow-y: auto; overflow-x: hidden;
  }
  .sidebar-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; cursor: pointer;
    transition: all var(--transition);
    color: var(--text-sec); font-size: var(--fs-sm); font-weight: 500;
    border-left: 2px solid transparent;
  }
  .sidebar-item:hover { background: var(--bg-hover); color: var(--text-pri); }
  .sidebar-item.active { background: rgba(56,139,253,.1); color: var(--accent); border-left-color: var(--accent); }

  /* Stats card */
  .stat-card {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    transition: all var(--transition);
  }
  .stat-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

  /* Table — encapsulée pour permettre le scroll horizontal sans casser la mise en page */
  .table-scroll { width: 100%; overflow-x: auto; border-radius: var(--radius); }
  table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
  th { padding: 11px 15px; text-align: left; color: var(--text-sec); font-weight: 600; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid var(--border); background: var(--bg-root); white-space: nowrap; }
  td { padding: 11px 15px; border-bottom: 1px solid rgba(48,54,61,.5); }
  html[data-theme="light"] td { border-bottom: 1px solid rgba(31,35,40,.08); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-hover); }

  /* Drag handle */
  .drag-handle { cursor: grab; color: var(--text-muted); }
  .drag-handle:active { cursor: grabbing; }

  /* Security overlay text */
  .security-warning {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(248,81,73,.12);
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
    animation: fadeIn .1s ease;
  }
  .security-warning-box {
    background: var(--bg-panel); border: 2px solid var(--danger);
    border-radius: var(--radius-lg); padding: 20px 32px;
    text-align: center; color: var(--danger); font-weight: 700; font-size: var(--fs-lg);
    box-shadow: 0 0 40px rgba(248,81,73,.3);
    max-width: 92vw;
  }

  /* ── Sécurité examen : écran de démarrage plein écran ── */
  .exam-start-gate {
    position: fixed; inset: 0; z-index: 100000;
    background: var(--bg-app, var(--bg-root));
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .exam-start-card {
    background: var(--bg-panel); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 460px;
    text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,.35);
  }

  /* Violation modal */
  .violation-overlay {
    position: fixed; inset: 0; z-index: 100001;
    background: rgba(0,0,0,.75);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .violation-box {
    background: var(--bg-panel); border: 2px solid var(--danger);
    border-radius: var(--radius-lg); padding: 28px 32px; width: 100%; max-width: 440px;
    text-align: center; box-shadow: 0 0 50px rgba(248,81,73,.35);
  }

  /* Indicateur discret de violations */
  .violation-indicator {
    font-size: var(--fs-2xs); font-weight: 600; padding: 3px 9px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--text-sec); white-space: nowrap;
  }
  .violation-indicator.has-violations { color: var(--danger); border-color: var(--danger); }

  /* Scrollable main */
  .main-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; min-width: 0; }

  /* Separator */
  .sep { width: 100%; height: 1px; background: var(--border); margin: 12px 0; }

  /* Form group */
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; min-width: 0; }
  .form-label { font-size: var(--fs-xs); font-weight: 600; color: var(--text-sec); text-transform: uppercase; letter-spacing: .5px; }

  /* Empty state */
  .empty-state { padding: 48px 20px; text-align: center; color: var(--text-muted); }
  .empty-state svg { opacity: .3; margin-bottom: 12px; }

  /* Chip */
  .chip { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:99px;font-size:var(--fs-2xs);font-weight:600;background:var(--bg-hover);color:var(--text-sec); }

  /* Header */
  .app-header {
    min-height: 52px; flex-shrink: 0;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 8px 20px; gap: 16px;
    flex-wrap: wrap;
  }

  /* Bouton de bascule de thème (clair / sombre) */
  .theme-toggle-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--bg-hover); border: 1px solid var(--border);
    color: var(--text-sec); cursor: pointer; font-size: 15px;
    transition: all var(--transition);
    flex-shrink: 0;
  }
  .theme-toggle-btn:hover { color: var(--text-pri); border-color: var(--accent); transform: rotate(14deg); }
  .theme-toggle-fab {
    position: fixed; bottom: 18px; right: 18px; z-index: 10000;
    box-shadow: var(--shadow);
  }

  /* Timer danger animation */
  @keyframes timerDanger { 0%,100%{color:var(--danger)} 50%{color:#ff7b72} }
  .timer-danger { animation: timerDanger 1s ease-in-out infinite; }

  /* ── ENONCE PEDAGOGIQUE ── */
  /* Carte principale de l'énoncé structuré */
  .enonce-card {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 0;
    margin-bottom: 16px;
    overflow: hidden;
  }
  .enonce-header {
    background: linear-gradient(90deg, rgba(56,139,253,.15), rgba(210,168,255,.08));
    border-bottom: 1px solid var(--border);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .enonce-body { padding: 20px; }
  .enonce-section {
    margin-bottom: 18px;
  }
  .enonce-section:last-child { margin-bottom: 0; }
  .enonce-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-2xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .8px;
    color: var(--text-muted);
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(48,54,61,.5);
  }
  .enonce-section-icon { font-size: 14px; }
  .enonce-section-toggle {
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: inherit;
    color: var(--text-muted);
    transition: color var(--transition);
  }
  .enonce-section-toggle:hover { color: var(--text-pri); }
  .enonce-chevron {
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .enonce-context {
    font-size: var(--fs-md);
    color: var(--text-sec);
    line-height: 1.75;
    background: rgba(56,139,253,.04);
    border-left: 3px solid var(--accent);
    padding: 10px 14px;
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .enonce-objectif {
    font-size: var(--fs-md);
    color: var(--text-pri);
    line-height: 1.75;
    font-weight: 500;
  }
  .enonce-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .enonce-list li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: var(--fs-sm);
    color: var(--text-sec);
    line-height: 1.6;
  }
  .enonce-list li::before {
    content: "▸";
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 2px;
  }
  .enonce-contrainte li::before { color: var(--warn); content: "⚠"; }
  .enonce-resultat {
    font-size: var(--fs-sm);
    color: var(--accent-2);
    line-height: 1.7;
    background: rgba(63,185,80,.05);
    border-left: 3px solid var(--success);
    padding: 10px 14px;
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .enonce-io {
    background: var(--bg-cell);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .enonce-io-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .enonce-io-col {
    padding: 12px 14px;
    min-width: 0;
  }
  .enonce-io-col:first-child { border-right: 1px solid var(--border); }
  .enonce-io-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .enonce-io-code {
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    color: var(--accent-2);
    white-space: pre-wrap;
    line-height: 1.6;
    word-break: break-word;
  }

  /* ── KATEX overrides pour le thème sombre ── */
  .katex { color: var(--text-pri) !important; font-size: 1.05em; }
  .katex-display { margin: 10px 0 !important; overflow-x: auto; overflow-y: hidden; }

  /* ── BLOC QUESTION (au-dessus de chaque cellule de réponse) ── */
  .question-block {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    margin-bottom: 8px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .question-text {
    color: var(--text-pri);
    font-size: var(--fs-md);
    line-height: 1.7;
  }

  /* ── MENU "TYPE DE CELLULE" (à l'ajout d'une cellule) ── */
  .add-cell-wrap { position: relative; display: inline-block; }
  .add-cell-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
  }
  .add-cell-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 41;
    min-width: 260px;
    max-width: 90vw;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: 0 12px 28px rgba(0,0,0,.45);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .add-cell-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    text-align: left;
    background: none;
    border: none;
    border-radius: var(--radius);
    padding: 10px 12px;
    cursor: pointer;
    color: var(--text-pri);
    font-family: inherit;
    transition: background var(--transition);
  }
  .add-cell-option:hover { background: rgba(56,139,253,.12); }
  .add-cell-icon { font-size: 18px; line-height: 1.2; }
  .add-cell-option strong { display: block; font-size: var(--fs-sm); font-weight: 700; }
  .add-cell-option small { display: block; font-size: var(--fs-2xs); color: var(--text-muted); margin-top: 2px; }

  /* ── CELLULE TEXTE (Markdown + LaTeX) ── */
  .md-cell {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--bg-cell);
  }
  .md-cell-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    background: rgba(210,168,255,.05);
    flex-wrap: wrap;
  }
  .md-cell-label {
    font-family: var(--font-mono);
    font-size: var(--fs-2xs);
    color: var(--text-muted);
    font-weight: 600;
  }
  .md-mode-toggle { display: flex; gap: 4px; }
  .md-mode-toggle .btn-active {
    background: var(--accent);
    color: #fff;
  }
  .md-cell-textarea {
    width: 100%;
    min-height: 90px;
    padding: 14px 16px;
    background: transparent;
    border: none;
    outline: none;
    resize: vertical;
    color: var(--text-pri);
    font-family: var(--font-mono);
    font-size: var(--fs-sm);
    line-height: 1.75;
  }
  .md-cell-preview {
    padding: 14px 18px;
    font-size: var(--fs-md);
    line-height: 1.75;
    color: var(--text-pri);
    overflow-x: auto;
  }
  .md-cell-preview :is(h1,h2,h3,h4) { margin: 10px 0 8px; font-weight: 700; }
  .md-cell-preview p { margin: 0 0 10px; }
  .md-cell-preview ul, .md-cell-preview ol { margin: 0 0 10px; padding-left: 22px; }
  .md-cell-preview code {
    background: rgba(255,255,255,.08);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
  html[data-theme="light"] .md-cell-preview code { background: rgba(31,35,40,.07); }
  .md-cell-preview pre {
    background: rgba(0,0,0,.25);
    padding: 10px 12px;
    border-radius: var(--radius);
    overflow-x: auto;
  }
  html[data-theme="light"] .md-cell-preview pre { background: rgba(31,35,40,.05); }
  .md-cell-preview blockquote {
    border-left: 3px solid var(--accent);
    margin: 0 0 10px;
    padding: 4px 12px;
    color: var(--text-sec);
  }
  .md-cell-preview-empty { color: var(--text-muted); font-style: italic; font-size: var(--fs-sm); }

  /* ── MODE "CODE UNIQUEMENT" ── */
  .focus-mode-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    margin-bottom: 12px;
    background: rgba(56,139,253,.08);
    border: 1px dashed var(--accent);
    border-radius: var(--radius);
    font-size: var(--fs-xs);
    color: var(--text-sec);
    flex-wrap: wrap;
  }

  /* ── IMPORT EXCEL ── */
  .excel-drop-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    padding: 32px 20px;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition);
  }
  .excel-drop-zone:hover, .excel-drop-zone.drag-over {
    border-color: #1d6f42;
    background: rgba(29,111,66,.08);
  }
  .preview-table-wrap {
    max-height: 300px;
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .preview-badge-ok   { background: rgba(63,185,80,.15);  color: var(--success); }
  .preview-badge-warn { background: rgba(227,179,65,.15); color: var(--warn); }
  .preview-badge-err  { background: rgba(248,81,73,.15);  color: var(--danger); }

  /* ── STRUCTURE EXERCICES → QUESTIONS ── */
  /* Carte d'exercice */
  .exercise-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin-bottom: 28px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    animation: fadeIn .25s ease forwards;
  }
  .exercise-header {
    background: linear-gradient(90deg, rgba(56,139,253,.18), rgba(210,168,255,.09));
    border-bottom: 1px solid var(--border);
    padding: 16px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .exercise-title {
    font-size: var(--fs-lg);
    font-weight: 700;
    color: var(--text-pri);
    flex: 1;
    min-width: 120px;
  }
  .exercise-description {
    font-size: var(--fs-sm);
    color: var(--text-sec);
    line-height: 1.65;
    padding: 12px 22px 6px;
    border-bottom: 1px solid rgba(48,54,61,.5);
  }
  .exercise-body {
    padding: 0;
  }

  /* Bloc question individuel */
  .question-editor-block {
    border-bottom: 1px solid var(--border);
    padding: 20px 22px;
    transition: background var(--transition);
  }
  .question-editor-block:last-child {
    border-bottom: none;
  }
  .question-editor-block:hover {
    background: rgba(255,255,255,.012);
  }
  .question-editor-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .question-number-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(56,139,253,.18);
    color: var(--accent);
    font-size: var(--fs-xs);
    font-weight: 700;
    flex-shrink: 0;
    border: 1px solid rgba(56,139,253,.3);
    margin-top: 2px;
  }
  .question-statement {
    font-size: var(--fs-md);
    color: var(--text-pri);
    line-height: 1.75;
    flex: 1;
    min-width: 180px;
  }
  .question-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border);
    flex-shrink: 0;
    margin-top: 10px;
    transition: background var(--transition);
  }
  .question-status-dot.done {
    background: var(--success);
    box-shadow: 0 0 6px rgba(63,185,80,.4);
  }

  /* Barre d'outils de l'éditeur de question */
  .question-editor-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(255,255,255,.025);
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: var(--radius) var(--radius) 0 0;
    flex-wrap: wrap;
  }
  .question-run-output {
    border-top: 1px solid var(--border);
    padding: 10px 12px;
    font-family: var(--font-mono);
    font-size: var(--fs-xs);
    color: var(--accent-2);
    white-space: pre-wrap;
    word-break: break-word;
    background: rgba(0,0,0,.2);
    max-height: 160px;
    overflow-y: auto;
    border-radius: 0 0 var(--radius) var(--radius);
  }
  html[data-theme="light"] .question-run-output { background: rgba(9,105,218,.04); }
  .question-run-output.error { color: var(--danger); }

  /* Sidebar exercises */
  .exercise-sidebar-section {
    padding: 8px 10px 4px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: .6px;
  }
  .exercise-sidebar-item {
    padding: 8px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all var(--transition);
    color: var(--text-sec);
    font-size: var(--fs-xs);
    font-weight: 600;
    border-left: 2px solid transparent;
  }
  .exercise-sidebar-item:hover { background: var(--bg-hover); color: var(--text-pri); }
  .exercise-sidebar-item.active { background: rgba(56,139,253,.1); color: var(--accent); border-left-color: var(--accent); }
  .exercise-sidebar-subitem {
    padding: 5px 14px 5px 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all var(--transition);
    color: var(--text-muted);
    font-size: var(--fs-2xs);
  }
  .exercise-sidebar-subitem:hover { color: var(--text-sec); background: var(--bg-hover); }
  .exercise-sidebar-subitem.done { color: var(--success); }

  /* Grilles responsives réutilisables (2 colonnes -> 1 colonne sur petit écran) */
  .responsive-grid-2 { min-width: 0; }
  .responsive-grid-2 > * { min-width: 0; }

  /* ══════════════════════════════════════════════════
     RESPONSIVE — Tablette (≤ 1024px)
     ══════════════════════════════════════════════════ */
  @media (max-width: 1024px) {
    .sidebar { width: 190px; }
    .exercise-title { font-size: var(--fs-md); }
    .modal-box { padding: 20px; }
  }

  /* ══════════════════════════════════════════════════
     RESPONSIVE — Petite tablette / grand mobile (≤ 860px)
     ══════════════════════════════════════════════════ */
  @media (max-width: 860px) {
    .sidebar, nav.sidebar { width: 64px !important; }
    .sidebar-item span:not(:first-child):not(.badge),
    .exercise-sidebar-item span:not(:first-child) { display: none; }
    .sidebar-item { justify-content: center; padding: 10px 6px; }
    .sidebar-item .badge { display: none; }
    .sidebar > div:first-child { padding: 12px 6px; }
    .sidebar > div:first-child div div { display: none; }
    .sidebar > div:last-child { padding: 10px 6px; }
    .sidebar > div:last-child .btn span { display: none; }

    .app-header { padding: 8px 12px; gap: 10px; }
    .enonce-io-row { grid-template-columns: 1fr; }
    .enonce-io-col:first-child { border-right: none; border-bottom: 1px solid var(--border); }
    .responsive-grid-2 { grid-template-columns: 1fr !important; }
    .responsive-grid-3 { grid-template-columns: 1fr 1fr !important; }
    .exercise-header, .enonce-header { padding: 14px 16px; }
    .exercise-description { padding: 10px 16px 6px; }
    .question-editor-block { padding: 16px; }
    .enonce-body { padding: 16px; }
  }

  /* ══════════════════════════════════════════════════
     RESPONSIVE — Mobile (≤ 600px)
     ══════════════════════════════════════════════════ */
  @media (max-width: 600px) {
    :root {
      --fs-2xs: 11px;
      --fs-xs:  12px;
      --fs-sm:  13px;
      --fs-md:  13.5px;
      --fs-lg:  15px;
      --fs-xl:  16.5px;
      --fs-2xl: 19px;
      --fs-code: 13.5px;
    }
    .sidebar { width: 52px !important; }
    .app-header { min-height: 46px; padding: 6px 10px; }
    .modal-box { padding: 16px; width: 100%; max-width: 100vw; border-radius: var(--radius); }
    .modal-overlay { padding: 0; align-items: flex-end; }
    .modal-overlay .modal-box { max-height: 92vh; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
    .stat-card { padding: 12px 14px; }
    .exercise-title { font-size: var(--fs-sm); min-width: 0; }
    .responsive-grid-3 { grid-template-columns: 1fr !important; }
    .exercise-header, .enonce-header { padding: 12px; gap: 8px; }
    .question-statement { min-width: 0; font-size: var(--fs-sm); }
    .toast-container { left: 8px; right: 8px; top: 8px; align-items: stretch; }
    .toast { max-width: 100%; min-width: 0; }
    .btn { padding: 7px 12px; }
    .code-container { font-size: var(--fs-code); }
    .line-numbers { min-width: 32px; }
    table { font-size: var(--fs-xs); }
    th, td { padding: 8px 10px; }
    .exam-start-card { padding: 24px 18px; }
    .violation-box { padding: 20px 18px; }
  }
`;

// ─────────────────────────────────────────────
//  COMPOSANT : TOAST NOTIFICATIONS
// ─────────────────────────────────────────────

let _toastDispatch = null;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _toastDispatch = (msg, type = "info") => {
      const id = uid();
      setToasts((t) => [...t, { id, msg, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    };
    return () => { _toastDispatch = null; };
  }, []);

  const icon = { error: "⛔", success: "✅", warn: "⚠️", info: "ℹ️" };

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{icon[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </>
  );
};

const toast = (msg, type = "info") => _toastDispatch?.(msg, type);

// ─────────────────────────────────────────────
//  COMPOSANT : MODAL GÉNÉRIQUE
// ─────────────────────────────────────────────

const Modal = ({ title, onClose, children, width = 500 }) => (
  <div
    className="modal-overlay"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="modal-box" style={{ width: `min(${width}px, 95vw)` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─────────────────────────────────────────────
//  COMPOSANT : RENDU LATEX (KaTeX)
//  Rend du texte contenant des formules $...$ et $$...$$
// ─────────────────────────────────────────────

const LatexRenderer = ({ text, className, style }) => {
  const ref = useRef(null);
  const [katexReady, setKatexReady] = useState(katexLoaded);

  // Charger KaTeX si pas encore fait
  useEffect(() => {
    if (!katexLoaded) {
      loadKaTeX().then(() => setKatexReady(true)).catch(() => {});
    } else {
      setKatexReady(true);
    }
  }, []);

  // Écrit le texte brut (échappé) dans le DOM, puis applique le rendu
  // KaTeX (auto-render) sur les délimiteurs $...$ et $$...$$.
  // Tout est regroupé dans un seul effet pour garantir que le HTML
  // injecté est toujours celui qui vient d'être (ré)écrit, et pour
  // éviter qu'un texte non-rendu (formules brutes "$...$") ne reste
  // affiché après une mise à jour.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Échappe les caractères HTML spéciaux pour ne jamais casser le
    // parsing (ex: "<" ou ">" dans un énoncé) — auto-render de KaTeX
    // travaille ensuite sur le texte réellement affiché (textContent),
    // donc l'échappement n'interfère pas avec la détection de $...$.
    const safe = escHtml(String(text ?? "")).replace(/\n/g, "<br/>");
    node.innerHTML = safe;

    if (!katexReady || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(node, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
        output: "html",
      });
    } catch (e) {
      // Silencieux en cas d'erreur LaTeX
    }
  }, [text, katexReady]);

  return <span ref={ref} className={className} style={style} />;
};

// ─────────────────────────────────────────────
//  COMPOSANT : ÉNONCÉ PÉDAGOGIQUE STRUCTURÉ
//  Affiche les champs titre, contexte, objectif,
//  données, contraintes, résultat attendu, exemple I/O
//  avec rendu LaTeX pour chaque section.
// ─────────────────────────────────────────────

/**
 * Section pédagogique repliable (accordion).
 * Le titre agit comme un bouton qui replie/déplie le contenu —
 * utile pendant les démonstrations ou les séances d'évaluation
 * pour ne garder que le code visible.
 */
const CollapsibleSection = ({ icon, title, defaultCollapsed = false, children }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="enonce-section">
      <button
        type="button"
        className="enonce-section-title enonce-section-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="enonce-section-icon">{icon}</span> {title}
        </span>
        <span className="enonce-chevron">{collapsed ? "▸" : "▾"}</span>
      </button>
      {!collapsed && children}
    </div>
  );
};

const EnoncePedagogique = ({ question, hidden }) => {
  const s = question.structure;

  // Mode "code uniquement" : on masque entièrement l'énoncé pédagogique
  if (hidden) return null;

  // Si pas de structure pédagogique, affichage simple de l'énoncé
  if (!s) {
    return (
      <div className="enonce-card">
        <div className="enonce-header">
          <span className="badge badge-blue">Question {question.ordre}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{question.titre}</h3>
        </div>
        <div className="enonce-body">
          <CollapsibleSection icon="📄" title="Énoncé">
            <LatexRenderer
              text={question.enonce}
              style={{ color: "var(--text-sec)", fontSize: 14, lineHeight: 1.75 }}
            />
          </CollapsibleSection>
        </div>
      </div>
    );
  }

  return (
    <div className="enonce-card">
      {/* En-tête */}
      <div className="enonce-header">
        <span className="badge badge-blue">Exercice {question.ordre}</span>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>
          <LatexRenderer text={question.titre} />
        </h3>
      </div>

      <div className="enonce-body">
        {/* Énoncé (texte principal, compatibilité avec l'ancienne structure) */}
        {question.enonce && (
          <CollapsibleSection icon="📄" title="Énoncé">
            <div className="enonce-context">
              <LatexRenderer text={question.enonce} />
            </div>
          </CollapsibleSection>
        )}

        {/* Contexte / Explications */}
        {s.contexte && (
          <CollapsibleSection icon="📚" title="Explications">
            <div className="enonce-context">
              <LatexRenderer text={s.contexte} />
            </div>
          </CollapsibleSection>
        )}

        {/* Objectif */}
        {s.objectif && (
          <CollapsibleSection icon="🎯" title="Objectif">
            <div className="enonce-objectif">
              <LatexRenderer text={s.objectif} />
            </div>
          </CollapsibleSection>
        )}

        {/* Données */}
        {s.donnees && s.donnees.length > 0 && (
          <CollapsibleSection icon="📋" title="Données fournies">
            <ul className="enonce-list">
              {s.donnees.map((d, i) => (
                <li key={i}>
                  <LatexRenderer text={d} />
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Contraintes / Consignes */}
        {s.contraintes && s.contraintes.length > 0 && (
          <CollapsibleSection icon="⚠️" title="Consignes">
            <ul className="enonce-list enonce-contrainte">
              {s.contraintes.map((c, i) => (
                <li key={i}>
                  <LatexRenderer text={c} />
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Résultat attendu / Notes */}
        {s.resultatAttendu && (
          <CollapsibleSection icon="✅" title="Notes (résultat attendu)">
            <div className="enonce-resultat">
              <LatexRenderer text={s.resultatAttendu} />
            </div>
          </CollapsibleSection>
        )}

        {/* Exemple I/O */}
        {s.exempleIO && (
          <CollapsibleSection icon="💡" title="Exemple d'entrée / sortie">
            <div className="enonce-io">
              <div className="enonce-io-row">
                <div className="enonce-io-col">
                  <div className="enonce-io-label">Entrée</div>
                  <div className="enonce-io-code">{s.exempleIO.entree}</div>
                </div>
                <div className="enonce-io-col">
                  <div className="enonce-io-label">Sortie attendue</div>
                  <div className="enonce-io-code">{s.exempleIO.sortie}</div>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : ÉDITEUR DE CELLULE (style JupyterLab / VS Code)
// ─────────────────────────────────────────────

const CodeCell = ({
  cell,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRun,
  isFirst,
  isLast,
  readOnly,
}) => {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const [highlighted, setHighlighted] = useState("");
  const [output, setOutput] = useState(cell.output || "");
  const [outputType, setOutputType] = useState(cell.outputType || "");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setHighlighted(highlightPython(cell.content));
  }, [cell.content]);

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    if (readOnly) { e.preventDefault(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en } = e.target;
      const val = cell.content;
      const result = computeTabIndent(val, s, en, e.shiftKey);
      onChange({ ...cell, content: result.value });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = result.selStart;
          textareaRef.current.selectionEnd = result.selEnd;
        }
      }, 0);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: s } = e.target;
      const val = cell.content;
      const result = computeSmartEnter(val, s);
      onChange({ ...cell, content: result.value });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = result.cursor;
        }
      }, 0);
    }
  };

  const blockAction = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    toast("⛔ Action non autorisée pendant l'examen !", "error");
  };

  const runCell = async () => {
    setRunning(true);
    setOutput("");
    await new Promise((r) => setTimeout(r, 400));

    try {
      const lines = [];
      const fakeEnv = {
        print: (...args) => lines.push(args.map(String).join(" ")),
        range: (n, e, s = 1) => {
          const a = [];
          if (e === undefined) {
            for (let i = 0; i < n; i += s) a.push(i);
          } else {
            for (let i = n; i < e; i += s) a.push(i);
          }
          return a;
        },
        len: (x) => x.length,
        np: {
          array: (a) => a,
          zeros: (n) => new Array(n).fill(0),
          random: { randn: (n) => Array.from({ length: n }, () => Math.random()) },
          dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
          linalg: { norm: (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0)) },
        },
      };

      let jsCode = cell.content
        .replace(/import numpy as np/g, "")
        .replace(/import numpy/g, "")
        .replace(/from numpy/g, "")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null")
        .replace(/#[^\n]*/g, "")
        .replace(/def (\w+)\((.*?)\):/g, "function $1($2) {")
        .replace(/^\s*return\b/gm, "return")
        .replace(/for (\w+) in range\((\d+)\):/g, "for(let $1=0;$1<$2;$1++) {")
        .replace(/for (\w+) in range\((\w+)\):/g, "for(let $1=0;$1<$2;$1++) {")
        .replace(/if (.+):/g, "if($1) {")
        .replace(/else:/g, "} else {")
        .replace(/while (.+):/g, "while($1) {")
        .replace(/print\((.*?)\)/g, "print($1)")
        .replace(/^\s{4}/gm, "");

      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(fakeEnv), jsCode);
      fn(...Object.values(fakeEnv));

      if (lines.length > 0) {
        setOutput(lines.join("\n"));
        setOutputType("ok");
      } else {
        setOutput("✓ Cellule exécutée sans sortie.");
        setOutputType("ok");
      }
    } catch (err) {
      setOutput(
        `Erreur d'exécution : ${err.message}\n\n(Note: l'exécution Python réelle nécessite un backend. La simulation JS est limitée.)`
      );
      setOutputType("error");
    }

    onChange({ ...cell, output: output, outputType });
    if (onRun) onRun(cell.id, output);
    setRunning(false);
  };

  const lineCount = (cell.content.match(/\n/g) || []).length + 1;

  return (
    <div className={`cell-wrapper ${running ? "running" : ""}`} style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,.02)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
          In [ ]
        </span>
        <div style={{ flex: 1 }} />
        {!readOnly && (
          <>
            <button className="btn btn-ghost btn-xs drag-handle" title="Déplacer">⠿</button>
            <button className="btn btn-ghost btn-xs" onClick={() => onMoveUp()} disabled={isFirst} title="Remonter">↑</button>
            <button className="btn btn-ghost btn-xs" onClick={() => onMoveDown()} disabled={isLast} title="Descendre">↓</button>
            <button className="btn btn-ghost btn-xs" onClick={() => onDelete(cell.id)} title="Supprimer cellule" style={{ color: "var(--danger)" }}>✕</button>
          </>
        )}
        <button
          className={`btn btn-xs ${running ? "btn-warn" : "btn-success"}`}
          onClick={runCell}
          disabled={running}
          title="Exécuter (Shift+Enter)"
        >
          {running ? "⏳ …" : "▶ Run"}
        </button>
      </div>

      <div className="code-container">
        <div className="line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="line-num">{i + 1}</div>
          ))}
        </div>
        <div className="code-edit-area">
          <div
            ref={highlightRef}
            className="code-highlight"
            dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
            aria-hidden
          />
          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={cell.content}
            readOnly={readOnly}
            onChange={(e) => !readOnly && onChange({ ...cell, content: e.target.value })}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onCopy={blockAction}
            onPaste={blockAction}
            onCut={blockAction}
            onContextMenu={blockAction}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            rows={Math.max(4, lineCount + 1)}
            style={{ minHeight: `${Math.max(4, lineCount + 1) * 1.7 * 13}px` }}
          />
        </div>
      </div>

      {output && (
        <div className={`cell-output ${outputType === "error" ? "error" : ""}`}>
          {output}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : CELLULE TEXTE (Markdown + LaTeX)
//  Contenu pédagogique (explications, consignes, remarques)
//  avec mode édition et mode aperçu.
// ─────────────────────────────────────────────

const MarkdownCell = ({
  cell,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  readOnly,
}) => {
  const [mode, setMode] = useState(readOnly ? "preview" : "edit");
  const [markedReady, setMarkedReady] = useState(markedLoaded);
  const [katexReady, setKatexReady] = useState(katexLoaded);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!markedLoaded) {
      loadMarked().then(() => setMarkedReady(true)).catch(() => {});
    } else {
      setMarkedReady(true);
    }
    if (!katexLoaded) {
      loadKaTeX().then(() => setKatexReady(true)).catch(() => {});
    } else {
      setKatexReady(true);
    }
  }, []);

  // Rendu Markdown + LaTeX en mode aperçu
  useEffect(() => {
    if (mode !== "preview" || !previewRef.current) return;
    const node = previewRef.current;
    const raw = cell.content || "";

    if (!raw.trim()) {
      node.innerHTML = '<span class="md-cell-preview-empty">Aucun contenu — passez en mode édition pour écrire du texte.</span>';
      return;
    }

    let html;
    try {
      html =
        markedReady && window.marked
          ? window.marked.parse(raw)
          : escHtml(raw).replace(/\n/g, "<br/>");
    } catch (e) {
      html = escHtml(raw).replace(/\n/g, "<br/>");
    }
    node.innerHTML = html;

    if (katexReady && window.renderMathInElement) {
      try {
        window.renderMathInElement(node, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
          output: "html",
        });
      } catch (e) {
        // Silencieux en cas d'erreur LaTeX
      }
    }
  }, [mode, cell.content, markedReady, katexReady]);

  return (
    <div className="md-cell" style={{ marginBottom: 12 }}>
      <div className="md-cell-toolbar">
        <span className="md-cell-label">📝 TEXTE</span>
        <div style={{ flex: 1 }} />
        {!readOnly && (
          <div className="md-mode-toggle">
            <button
              className={`btn btn-ghost btn-xs ${mode === "edit" ? "btn-active" : ""}`}
              onClick={() => setMode("edit")}
              title="Mode édition"
            >
              ✏️ Édition
            </button>
            <button
              className={`btn btn-ghost btn-xs ${mode === "preview" ? "btn-active" : ""}`}
              onClick={() => setMode("preview")}
              title="Mode aperçu"
            >
              👁 Aperçu
            </button>
          </div>
        )}
        {!readOnly && (
          <>
            <button className="btn btn-ghost btn-xs drag-handle" title="Déplacer">⠿</button>
            <button className="btn btn-ghost btn-xs" onClick={onMoveUp} disabled={isFirst} title="Remonter">↑</button>
            <button className="btn btn-ghost btn-xs" onClick={onMoveDown} disabled={isLast} title="Descendre">↓</button>
            <button className="btn btn-ghost btn-xs" onClick={() => onDelete(cell.id)} title="Supprimer cellule" style={{ color: "var(--danger)" }}>✕</button>
          </>
        )}
      </div>

      {mode === "edit" && !readOnly ? (
        <textarea
          className="md-cell-textarea"
          value={cell.content}
          onChange={(e) => onChange({ ...cell, content: e.target.value })}
          placeholder="Écrivez vos explications, consignes ou remarques. Markdown (titres, listes, **gras**…) et LaTeX ($...$ / $$...$$) sont supportés."
          rows={Math.max(4, (cell.content.match(/\n/g) || []).length + 2)}
        />
      ) : (
        <div ref={previewRef} className="md-cell-preview" />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : ÉDITEUR INDÉPENDANT PAR QUESTION
//  Chaque QuestionEditor a son propre état :
//   - code (contenu de l'éditeur)
//   - output (résultat d'exécution)
//   - historique (undo/redo basique)
//  Une modification dans une question n'affecte jamais les autres.
// ─────────────────────────────────────────────

const QuestionEditor = ({
  question,       // { id, statement, initialCode }
  exerciseId,
  questionIndex,  // index local dans l'exercice (0-based)
  globalIndex,    // numéro global affiché à l'étudiant (1-based)
  savedCode,      // code sauvegardé (peut être undefined)
  onSave,         // (code: string) => void
  readOnly,
}) => {
  const [code, setCode] = useState(() => savedCode ?? question.initialCode ?? "# Votre code Python ici\n");
  const [output, setOutput] = useState("");
  const [outputType, setOutputType] = useState("ok");
  const [running, setRunning] = useState(false);
  // Cellules supplémentaires ajoutées par l'étudiant (brouillons/annexes)
  const [extraCells, setExtraCells] = useState([]);
  // Historique simple (undo/redo)
  const historyRef = useRef([code]);
  const historyIdxRef = useRef(0);

  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const [highlighted, setHighlighted] = useState(() => highlightPython(code));

  // Synchronise la sauvegarde vers le parent à chaque changement de code
  useEffect(() => {
    onSave(code);
  }, [code]);

  useEffect(() => {
    setHighlighted(highlightPython(code));
  }, [code]);

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleChange = (newCode) => {
    setCode(newCode);
    // Ajoute au historique (coupe le futur si on revient en arrière)
    const h = historyRef.current.slice(0, historyIdxRef.current + 1);
    h.push(newCode);
    historyRef.current = h;
    historyIdxRef.current = h.length - 1;
  };

  // Insère un symbole à la position du curseur dans le textarea
  const insertSymbol = (sym) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newCode = code.slice(0, start) + sym + code.slice(end);
    handleChange(newCode);
    // Replace cursor after inserted symbol
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + sym.length;
    });
  };

  const addExtraCell = () => {
    setExtraCells((cs) => [...cs, { id: uid(), content: "# Cellule supplémentaire\n" }]);
  };

  const handleKeyDown = (e) => {
    if (readOnly) { e.preventDefault(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en } = e.target;
      const result = computeTabIndent(code, s, en, e.shiftKey);
      handleChange(result.value);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = result.selStart;
          textareaRef.current.selectionEnd = result.selEnd;
        }
      }, 0);
    }
    // Ctrl+Z : undo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      if (historyIdxRef.current > 0) {
        historyIdxRef.current--;
        const prev = historyRef.current[historyIdxRef.current];
        setCode(prev);
        onSave(prev);
      }
    }
    // Ctrl+Shift+Z ou Ctrl+Y : redo
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      if (historyIdxRef.current < historyRef.current.length - 1) {
        historyIdxRef.current++;
        const next = historyRef.current[historyIdxRef.current];
        setCode(next);
        onSave(next);
      }
    }
    // Shift+Enter : exécuter
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      runCode();
    }
    // Entrée simple : indentation intelligente façon VS Code
    else if (e.key === "Enter") {
      e.preventDefault();
      const { selectionStart: s } = e.target;
      const result = computeSmartEnter(code, s);
      handleChange(result.value);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = result.cursor;
        }
      }, 0);
    }
  };

  const blockAction = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    toast("⛔ Action non autorisée pendant l'examen !", "error");
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("");
    await new Promise((r) => setTimeout(r, 350));
    try {
      const lines = [];
      const fakeEnv = {
        print: (...args) => lines.push(args.map(String).join(" ")),
        range: (n, e, s = 1) => {
          const a = [];
          if (e === undefined) { for (let i = 0; i < n; i += s) a.push(i); }
          else { for (let i = n; i < e; i += s) a.push(i); }
          return a;
        },
        len: (x) => x.length,
        np: {
          array: (a) => a,
          zeros: (n) => new Array(n).fill(0),
          random: { randn: (n) => Array.from({ length: n }, () => Math.random()) },
          dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
          linalg: { norm: (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0)) },
        },
      };
      let jsCode = code
        .replace(/import numpy as np/g, "")
        .replace(/import numpy/g, "")
        .replace(/from numpy/g, "")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null")
        .replace(/#[^\n]*/g, "")
        .replace(/def (\w+)\((.*?)\):/g, "function $1($2) {")
        .replace(/^\s*return\b/gm, "return")
        .replace(/for (\w+) in range\((\d+)\):/g, "for(let $1=0;$1<$2;$1++) {")
        .replace(/for (\w+) in range\((\w+)\):/g, "for(let $1=0;$1<$2;$1++) {")
        .replace(/if (.+):/g, "if($1) {")
        .replace(/else:/g, "} else {")
        .replace(/while (.+):/g, "while($1) {")
        .replace(/print\((.*?)\)/g, "print($1)")
        .replace(/^\s{4}/gm, "");
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(fakeEnv), jsCode);
      fn(...Object.values(fakeEnv));
      setOutput(lines.length > 0 ? lines.join("\n") : "✓ Code exécuté sans sortie.");
      setOutputType("ok");
    } catch (err) {
      setOutput(`Erreur : ${err.message}\n(Note : simulation JS limitée — un backend Python est requis pour l'exécution réelle.)`);
      setOutputType("error");
    }
    setRunning(false);
  };

  const lineCount = (code.match(/\n/g) || []).length + 1;
  const isDone = code.trim() && code.trim() !== (question.initialCode ?? "# Votre code Python ici\n").trim();

  return (
    <div className="question-editor-block" id={`question-${question.id}`}>
      {/* En-tête de la question */}
      <div className="question-editor-header">
        <div className="question-number-badge">{globalIndex}</div>
        <div className="question-statement">
          <LatexRenderer text={question.statement} />
        </div>
        <div className={`question-status-dot ${isDone ? "done" : ""}`} title={isDone ? "Répondu" : "Non répondu"} />
      </div>

      {/* Barre d'outils enrichie */}
      {!readOnly && (
        <div className="question-editor-toolbar" style={{ flexWrap: "wrap", gap: 6, paddingBottom: 8 }}>
          {/* Groupe : symboles d'insertion rapide */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            background: "rgba(56,139,253,.06)",
            border: "1px solid rgba(56,139,253,.15)",
            borderRadius: "var(--radius)",
            padding: "3px 6px",
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px", marginRight: 4 }}>
              Insérer
            </span>
            {[
              { label: "+",  sym: "+" },
              { label: "−",  sym: "-" },
              { label: "×",  sym: "*" },
              { label: "÷",  sym: "/" },
              { label: "=",  sym: "=" },
              { label: "==", sym: "==" },
              { label: "{",  sym: "{" },
              { label: "}",  sym: "}" },
              { label: "#",  sym: "# " },
              { label: "[",  sym: "[" },
              { label: "]",  sym: "]" },
            ].map(({ label, sym }) => (
              <button
                key={sym + label}
                className="btn btn-ghost btn-xs"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "2px 7px",
                  minWidth: 28,
                  color: "var(--accent)",
                  borderColor: "transparent",
                }}
                title={`Insérer ${sym}`}
                onClick={() => insertSymbol(sym)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Séparateur vertical */}
          <div style={{ width: 1, height: 20, background: "var(--border)", alignSelf: "center" }} />

          {/* Bouton Ajouter une cellule */}
          <button
            className="btn btn-ghost btn-xs"
            style={{ gap: 4, color: "var(--success)", borderColor: "rgba(63,185,80,.25)", background: "rgba(63,185,80,.06)" }}
            onClick={addExtraCell}
            title="Ajouter une cellule de code supplémentaire"
          >
            ＋ Cellule
          </button>

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Shift+Enter pour exécuter</span>
          <button
            className={`btn btn-xs ${running ? "btn-warn" : "btn-success"}`}
            onClick={runCode}
            disabled={running || readOnly}
            title="Exécuter (Shift+Enter)"
          >
            {running ? "⏳ …" : "▶ Run"}
          </button>
        </div>
      )}
      {readOnly && (
        <div className="question-editor-toolbar">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            In [{globalIndex}]
          </span>
          <div style={{ flex: 1 }} />
          <button
            className={`btn btn-xs ${running ? "btn-warn" : "btn-success"}`}
            onClick={runCode}
            disabled={running || readOnly}
            title="Exécuter (Shift+Enter)"
          >
            {running ? "⏳ …" : "▶ Run"}
          </button>
        </div>
      )}

      {/* Éditeur de code */}
      <div className={`cell-wrapper ${running ? "running" : ""}`} style={{ borderRadius: "0 0 var(--radius) var(--radius)", borderTop: "none", marginBottom: 0 }}>
        <div className="code-container">
          <div className="line-numbers">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="line-num">{i + 1}</div>
            ))}
          </div>
          <div className="code-edit-area">
            <div
              ref={highlightRef}
              className="code-highlight"
              dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
              aria-hidden
            />
            <textarea
              ref={textareaRef}
              className="code-textarea"
              value={code}
              readOnly={readOnly}
              onChange={(e) => !readOnly && handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={syncScroll}
              onCopy={blockAction}
              onPaste={blockAction}
              onCut={blockAction}
              onContextMenu={blockAction}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              rows={Math.max(4, lineCount + 1)}
              style={{ minHeight: `${Math.max(4, lineCount + 1) * 1.7 * 13}px` }}
            />
          </div>
        </div>

        {output && (
          <div className={`question-run-output ${outputType === "error" ? "error" : ""}`}>
            {output}
          </div>
        )}
      </div>

      {/* Cellules supplémentaires ajoutées par l'étudiant */}
      {extraCells.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {extraCells.map((ec, idx) => {
            const ecLineCount = (ec.content.match(/\n/g) || []).length + 1;
            const ecHighlight = highlightPython(ec.content);
            const ecRef = { current: null };
            return (
              <div key={ec.id} style={{ marginTop: 8 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "rgba(63,185,80,.06)",
                  border: "1px solid rgba(63,185,80,.2)",
                  borderBottom: "none",
                  borderRadius: "var(--radius) var(--radius) 0 0",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                    Cellule +{idx + 1}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button
                    className="btn btn-xs"
                    style={{ color: "var(--danger)", background: "transparent", border: "none" }}
                    onClick={() => setExtraCells((cs) => cs.filter((c) => c.id !== ec.id))}
                    title="Supprimer cette cellule"
                  >
                    ✕
                  </button>
                </div>
                <div className="cell-wrapper" style={{ borderRadius: "0 0 var(--radius) var(--radius)", borderTop: "none" }}>
                  <div className="code-container">
                    <div className="line-numbers">
                      {Array.from({ length: ecLineCount }, (_, i) => (
                        <div key={i} className="line-num">{i + 1}</div>
                      ))}
                    </div>
                    <div className="code-edit-area">
                      <div
                        className="code-highlight"
                        dangerouslySetInnerHTML={{ __html: ecHighlight + "\n" }}
                        aria-hidden
                      />
                      <textarea
                        className="code-textarea"
                        value={ec.content}
                        readOnly={readOnly}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExtraCells((cs) => cs.map((c) => c.id === ec.id ? { ...c, content: val } : c));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const { selectionStart: s, selectionEnd: en } = e.target;
                            const result = computeTabIndent(ec.content, s, en, e.shiftKey);
                            setExtraCells((cs) => cs.map((c) => c.id === ec.id ? { ...c, content: result.value } : c));
                            setTimeout(() => {
                              e.target.selectionStart = result.selStart;
                              e.target.selectionEnd = result.selEnd;
                            }, 0);
                          } else if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const { selectionStart: s } = e.target;
                            const result = computeSmartEnter(ec.content, s);
                            setExtraCells((cs) => cs.map((c) => c.id === ec.id ? { ...c, content: result.value } : c));
                            setTimeout(() => {
                              e.target.selectionStart = e.target.selectionEnd = result.cursor;
                            }, 0);
                          }
                        }}
                        onCopy={(e) => { e.preventDefault(); e.stopPropagation(); toast("⛔ Action non autorisée pendant l'examen !", "error"); }}
                        onPaste={(e) => { e.preventDefault(); e.stopPropagation(); toast("⛔ Action non autorisée pendant l'examen !", "error"); }}
                        onCut={(e) => { e.preventDefault(); e.stopPropagation(); toast("⛔ Action non autorisée pendant l'examen !", "error"); }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        spellCheck={false}
                        autoCapitalize="none"
                        autoCorrect="off"
                        rows={Math.max(3, ecLineCount + 1)}
                        style={{ minHeight: `${Math.max(3, ecLineCount + 1) * 1.7 * 13}px` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : CARTE D'EXERCICE
//  Affiche un exercice avec toutes ses questions.
//  Chaque question possède son propre QuestionEditor indépendant.
// ─────────────────────────────────────────────

const ExerciseCard = ({
  exercise,          // { id, title, description, questions[] }
  exerciseIndex,     // index de l'exercice (0-based)
  questionOffset,    // offset global des numéros de questions
  savedCodes,        // { [questionId]: string }
  onSave,            // (questionId: string, code: string) => void
  readOnly,
}) => {
  return (
    <div className="exercise-card" id={`exercise-${exercise.id}`}>
      {/* En-tête de l'exercice */}
      <div className="exercise-header">
        <span className="badge badge-blue" style={{ fontSize: 12, padding: "3px 10px" }}>
          Exercice {exerciseIndex + 1}
        </span>
        <span className="exercise-title">{exercise.title}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {exercise.questions.length} question{exercise.questions.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Description (si disponible) */}
      {exercise.description && (
        <div className="exercise-description">
          <LatexRenderer text={exercise.description} />
        </div>
      )}

      {/* Questions */}
      <div className="exercise-body">
        {exercise.questions.map((q, qi) => (
          <QuestionEditor
            key={q.id}
            question={q}
            exerciseId={exercise.id}
            questionIndex={qi}
            globalIndex={questionOffset + qi + 1}
            savedCode={savedCodes?.[q.id]}
            onSave={(code) => onSave(q.id, code)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : NOTEBOOK ÉTUDIANT (legacy, conservé pour compatibilité)
// ─────────────────────────────────────────────

const StudentNotebook = ({ question, notebook, savedCells, onSave, readOnly }) => {
  const [cells, setCells] = useState(() => {
    if (savedCells && savedCells.length > 0) return savedCells;
    return (
      notebook?.cells?.map((c) => ({
        ...c,
        id: uid(),
        output: "",
        outputType: "",
      })) || [{ id: uid(), type: "code", content: "# Votre code Python ici\n", output: "", outputType: "" }]
    );
  });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => { onSave(cells); }, [cells]);

  const addCell = (type = "code") => {
    setCells((cs) => [
      ...cs,
      type === "markdown"
        ? { id: uid(), type: "markdown", content: "" }
        : { id: uid(), type: "code", content: "# Nouvelle cellule\n", output: "", outputType: "" },
    ]);
    setShowAddMenu(false);
  };

  const deleteCell = (id) =>
    setCells((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));

  const moveCell = (idx, dir) =>
    setCells((cs) => {
      const arr = [...cs];
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return arr;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return arr;
    });

  const runAll = async () => {
    toast("Toutes les cellules exécutées", "success");
  };

  return (
    <div>
      {focusMode && (
        <div className="focus-mode-banner">
          <span>💻 Mode code uniquement actif — énoncé, explications et consignes masqués.</span>
        </div>
      )}

      {/* Énoncé pédagogique structuré avec LaTeX (masqué en mode focus) */}
      <EnoncePedagogique question={question} hidden={focusMode} />

      {/* Barre d'outils notebook */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          padding: "8px 12px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {!readOnly && (
          <>
            <button className="btn btn-success btn-sm" onClick={runAll}>▶▶ Exécuter tout</button>
            <div className="add-cell-wrap">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMenu((v) => !v)}>
                ＋ Ajouter cellule
              </button>
              {showAddMenu && (
                <>
                  <div className="add-cell-backdrop" onClick={() => setShowAddMenu(false)} />
                  <div className="add-cell-menu">
                    <button className="add-cell-option" onClick={() => addCell("code")}>
                      <span className="add-cell-icon">💻</span>
                      <span>
                        <strong>Cellule Code</strong>
                        <small>Écrire et exécuter du code Python</small>
                      </span>
                    </button>
                    <button className="add-cell-option" onClick={() => addCell("markdown")}>
                      <span className="add-cell-icon">📝</span>
                      <span>
                        <strong>Cellule Texte</strong>
                        <small>Explications, consignes — Markdown &amp; LaTeX</small>
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        <div style={{ flex: 1 }} />
        <button
          className={`btn btn-sm ${focusMode ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFocusMode((v) => !v)}
          title="Masquer les sections descriptives pour ne garder que le code"
        >
          {focusMode ? "🧩 Afficher tout" : "💻 Code uniquement"}
        </button>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {cells.length} cellule{cells.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Questions + cellules, affichées séquentiellement :
          chaque question est immédiatement suivie de sa propre
          cellule de réponse (et non regroupées en haut/en bas). */}
      {cells.map((cell, idx) => {
        // En mode "code uniquement", les cellules Texte (pédagogiques)
        // sont masquées : seuls le code et les résultats restent visibles.
        if (focusMode && cell.type === "markdown") return null;

        return (
          <div key={cell.id}>
            {!focusMode && cell.question && (
              <div className="question-block">
                <span className="badge badge-blue">Question {idx + 1}</span>
                <div className="question-text">
                  <LatexRenderer text={cell.question} />
                </div>
              </div>
            )}
            {cell.type === "markdown" ? (
              <MarkdownCell
                cell={cell}
                onChange={(updated) =>
                  setCells((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
                }
                onDelete={deleteCell}
                onMoveUp={() => moveCell(idx, -1)}
                onMoveDown={() => moveCell(idx, 1)}
                isFirst={idx === 0}
                isLast={idx === cells.length - 1}
                readOnly={readOnly}
              />
            ) : (
              <CodeCell
                cell={cell}
                onChange={(updated) =>
                  setCells((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
                }
                onDelete={deleteCell}
                onMoveUp={() => moveCell(idx, -1)}
                onMoveDown={() => moveCell(idx, 1)}
                isFirst={idx === 0}
                isLast={idx === cells.length - 1}
                readOnly={readOnly}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : IMPORT EXCEL
//  Lecture d'un fichier .xlsx avec SheetJS.
//  Colonnes attendues : Nom, Prénom, CodeApogee
//  Prévisualise les données avant l'import en masse.
// ─────────────────────────────────────────────

const ExcelImportModal = ({ onImport, onClose }) => {
  const [preview, setPreview] = useState(null); // { rows: [...], errors: [...] }
  const [loading, setLoading] = useState(false);
  const [xlsxReady, setXlsxReady] = useState(xlsxLoaded);
  const fileRef = useRef(null);

  // Charger SheetJS si nécessaire
  useEffect(() => {
    if (!xlsxLoaded) {
      loadXLSX()
        .then(() => setXlsxReady(true))
        .catch(() => toast("Impossible de charger SheetJS", "error"));
    }
  }, []);

  /**
   * Normalise les noms de colonnes : gère les variantes d'orthographe
   * (CodeApogee / Code Apogée / code_apogee, etc.)
   */
  const findColumn = (headers, variants) => {
    const normalizedHeaders = headers.map((h) => normalize(String(h || "")));
    for (const v of variants) {
      const idx = normalizedHeaders.indexOf(normalize(v));
      if (idx !== -1) return headers[idx];
    }
    return null;
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|ods)$/i)) {
      toast("Format non supporté. Utilisez .xlsx, .xls ou .ods", "error");
      return;
    }

    setLoading(true);
    try {
      const XLSX = window.XLSX;
      if (!XLSX) throw new Error("SheetJS non chargé");

      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (raw.length === 0) {
        toast("Le fichier Excel est vide", "warn");
        setLoading(false);
        return;
      }

      // Détection automatique des colonnes
      const headers = Object.keys(raw[0]);
      const colNom = findColumn(headers, ["Nom", "nom", "NOM", "last_name", "lastname"]);
      const colPrenom = findColumn(headers, ["Prenom", "Prénom", "prenom", "PRENOM", "first_name", "firstname"]);
      const colApogee = findColumn(headers, ["CodeApogee", "Code Apogee", "Code Apogée", "codeapogee", "code_apogee", "apogee", "Apogee", "APOGEE"]);

      const errors = [];
      if (!colNom) errors.push("Colonne 'Nom' introuvable");
      if (!colPrenom) errors.push("Colonne 'Prénom' introuvable");
      if (!colApogee) errors.push("Colonne 'CodeApogee' introuvable");

      if (errors.length > 0) {
        setPreview({ rows: [], errors, headers });
        setLoading(false);
        return;
      }

      // Validation de chaque ligne
      const rows = raw.map((row, i) => {
        const nom = String(row[colNom] || "").trim();
        const prenom = String(row[colPrenom] || "").trim();
        const apogee = String(row[colApogee] || "").trim();
        const rowErrors = [];
        if (!nom) rowErrors.push("Nom vide");
        if (!prenom) rowErrors.push("Prénom vide");
        if (!apogee) rowErrors.push("Code Apogée vide");
        else if (!/^\d+$/.test(apogee)) rowErrors.push("Code Apogée non numérique");
        return { _line: i + 2, nom, prenom, apogee, _errors: rowErrors };
      });

      setPreview({ rows, errors: [], headers });
    } catch (err) {
      toast(`Erreur de lecture : ${err.message}`, "error");
    }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const validRows = preview?.rows.filter((r) => r._errors.length === 0) || [];
  const invalidRows = preview?.rows.filter((r) => r._errors.length > 0) || [];

  const confirmImport = () => {
    if (validRows.length === 0) {
      toast("Aucune ligne valide à importer", "warn");
      return;
    }
    onImport(validRows.map((r) => ({ id: uid(), nom: r.nom, prenom: r.prenom, apogee: r.apogee })));
    toast(`${validRows.length} étudiant(s) importé(s)`, "success");
    onClose();
  };

  return (
    <Modal title="📊 Importer des étudiants depuis Excel" onClose={onClose} width={780}>
      {!xlsxReady && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
          Chargement de SheetJS…
        </div>
      )}

      {xlsxReady && !preview && (
        <div>
          {/* Zone de dépôt */}
          <div
            className="excel-drop-zone"
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Glissez un fichier Excel ici ou cliquez pour sélectionner
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Formats supportés : .xlsx, .xls, .ods — Colonnes requises : <strong>Nom</strong>, <strong>Prénom</strong>, <strong>CodeApogee</strong>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.ods"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-sec)" }}>
              Lecture en cours…
            </div>
          )}

          {/* Modèle de fichier */}
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "var(--bg-cell)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 12,
              color: "var(--text-sec)",
            }}
          >
            <strong>Structure attendue du fichier Excel :</strong>
            <table style={{ marginTop: 8, fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>CodeApogee</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>EL ALAOUI</td><td>Ahmed</td><td>22012345</td></tr>
                <tr><td>BENALI</td><td>Sara</td><td>22012346</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Erreurs de format */}
      {preview && preview.errors.length > 0 && (
        <div
          style={{
            background: "rgba(248,81,73,.08)",
            border: "1px solid rgba(248,81,73,.3)",
            borderRadius: "var(--radius)",
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 6 }}>
            ⛔ Erreurs de format détectées :
          </div>
          {preview.errors.map((e, i) => (
            <div key={i} style={{ color: "var(--danger)", fontSize: 13 }}>• {e}</div>
          ))}
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
            Colonnes détectées : {preview.headers?.join(", ")}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setPreview(null)}>
            ← Recommencer
          </button>
        </div>
      )}

      {/* Prévisualisation des données */}
      {preview && preview.errors.length === 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <span className="badge badge-green" style={{ marginRight: 6 }}>
                ✓ {validRows.length} valide{validRows.length !== 1 ? "s" : ""}
              </span>
              {invalidRows.length > 0 && (
                <span className="badge badge-red">
                  ⚠ {invalidRows.length} erreur{invalidRows.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPreview(null)}>
              ← Rechanger le fichier
            </button>
          </div>

          <div className="preview-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Code Apogée</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{row._line}</td>
                    <td style={{ fontWeight: 600 }}>{row.nom || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                    <td>{row.prenom || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                    <td>
                      {row.apogee ? (
                        <span className="badge badge-blue">{row.apogee}</span>
                      ) : (
                        <em style={{ color: "var(--text-muted)" }}>—</em>
                      )}
                    </td>
                    <td>
                      {row._errors.length === 0 ? (
                        <span className="badge preview-badge-ok">✓ OK</span>
                      ) : (
                        <span
                          className="badge preview-badge-err"
                          title={row._errors.join(", ")}
                        >
                          ✕ {row._errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidRows.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "rgba(227,179,65,.08)",
                border: "1px solid rgba(227,179,65,.2)",
                borderRadius: "var(--radius)",
                fontSize: 12,
                color: "var(--warn)",
              }}
            >
              ⚠️ Les lignes en erreur seront ignorées lors de l'import. Seules les lignes valides seront importées.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button
              className="btn btn-excel"
              onClick={confirmImport}
              disabled={validRows.length === 0}
            >
              📥 Importer {validRows.length} étudiant{validRows.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {!(preview && preview.errors.length === 0) && preview?.errors.length === 0 && (
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      )}
    </Modal>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : PAGE DE CONNEXION
//  La vérification étudiant compare maintenant
//  Nom + Prénom + CodeApogée avec correspondance exacte
//  (insensible à la casse et aux accents).
// ─────────────────────────────────────────────

const LoginPage = ({ onStudentLogin, onAdminLogin }) => {
  const [tab, setTab] = useState("student");
  const [form, setForm] = useState({ nom: "", prenom: "", apogee: "", login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  /** Récupère la liste à jour depuis le localStorage */
  const getStudents = () => lsGet(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);

  /**
   * Accès libre : aucune vérification n'est effectuée par rapport à une
   * base de données ou une liste d'étudiants autorisés. Les informations
   * saisies sont simplement utilisées pour identifier l'étudiant pendant
   * le test (sauvegarde des réponses, export, etc.).
   */
  const handleStudentLogin = () => {
    setLoginError("");
    const { nom, prenom, apogee } = form;
    if (!nom.trim() || !prenom.trim() || !apogee.trim()) {
      setLoginError("Veuillez remplir les trois champs : Nom, Prénom et Code Apogée.");
      return;
    }

    const student = { nom: nom.trim(), prenom: prenom.trim(), apogee: apogee.trim() };

    setLoading(true);
    setTimeout(() => { onStudentLogin(student); setLoading(false); }, 600);
  };

  const handleAdminLogin = () => {
    if (
      form.login === ADMIN_CREDENTIALS.login &&
      form.password === ADMIN_CREDENTIALS.password
    ) {
      setLoading(true);
      setTimeout(() => { onAdminLogin(); setLoading(false); }, 600);
    } else {
      toast("Identifiants administrateur incorrects", "error");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 20% 50%, rgba(56,139,253,.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(126,231,135,.06) 0%, transparent 50%), var(--bg-root)",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        className="glass-card fade-in"
        style={{ width: "min(460px, 95vw)", padding: "40px 36px", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--accent), var(--accent-4))",
              marginBottom: 14,
              fontSize: 26,
            }}
          >
            🐍
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px" }}>PyExam Studio</h1>
          <p style={{ color: "var(--text-sec)", fontSize: 13, marginTop: 4 }}>
            Plateforme d'Évaluation Python
          </p>
        </div>

        <div className="tab-bar" style={{ marginBottom: 24 }}>
          <div
            className={`tab-item ${tab === "student" ? "active" : ""}`}
            style={{ flex: 1, textAlign: "center" }}
            onClick={() => { setTab("student"); setLoginError(""); }}
          >
            👨‍🎓 Étudiant
          </div>
          <div
            className={`tab-item ${tab === "admin" ? "active" : ""}`}
            style={{ flex: 1, textAlign: "center" }}
            onClick={() => { setTab("admin"); setLoginError(""); }}
          >
            🔐 Admin
          </div>
        </div>

        {tab === "student" ? (
          <div className="fade-in">
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                className="input"
                placeholder="Votre nom de famille"
                value={form.nom}
                onChange={(e) => { setForm({ ...form, nom: e.target.value }); setLoginError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                className="input"
                placeholder="Votre prénom"
                value={form.prenom}
                onChange={(e) => { setForm({ ...form, prenom: e.target.value }); setLoginError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code Apogée</label>
              <input
                className="input"
                placeholder="Ex: 20210001"
                value={form.apogee}
                onChange={(e) => { setForm({ ...form, apogee: e.target.value }); setLoginError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
              />
            </div>

            {/* Message d'erreur de connexion */}
            {loginError && (
              <div
                style={{
                  background: "rgba(248,81,73,.08)",
                  border: "1px solid rgba(248,81,73,.25)",
                  borderRadius: "var(--radius)",
                  padding: "10px 14px",
                  marginBottom: 12,
                  fontSize: 13,
                  color: "var(--danger)",
                  lineHeight: 1.5,
                }}
              >
                ⛔ {loginError}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: 4 }}
              onClick={handleStudentLogin}
              disabled={loading}
            >
              {loading ? "Vérification…" : "Accéder à l'examen →"}
            </button>

            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
              Les trois champs doivent correspondre exactement aux données enregistrées.
            </p>
          </div>
        ) : (
          <div className="fade-in">
            <div className="form-group">
              <label className="form-label">Login</label>
              <input
                className="input"
                placeholder="admin"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px", marginTop: 4 }}
              onClick={handleAdminLogin}
              disabled={loading}
            >
              {loading ? "Connexion…" : "Connexion Admin →"}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
              Identifiants par défaut : admin / admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  MODALES ADMIN — Formulaires
// ─────────────────────────────────────────────

/** Modal d'ajout / modification d'un étudiant */
const StudentFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ nom: "", prenom: "", apogee: "", ...initial });
  return (
    <Modal title={initial?.id ? "Modifier l'étudiant" : "Ajouter un étudiant"} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nom</label>
        <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Prénom</label>
        <input className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Code Apogée</label>
        <input className="input" value={form.apogee} onChange={(e) => setForm({ ...form, apogee: e.target.value })} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.nom || !form.prenom || !form.apogee) {
              toast("Tous les champs sont requis", "error");
              return;
            }
            onSave(form);
          }}
        >
          Enregistrer
        </button>
      </div>
    </Modal>
  );
};

/**
 * Modal d'ajout / modification d'une question.
 * Supporte l'édition de la structure pédagogique complète.
 */
const QuestionFormModal = ({ initial, notebooks, onSave, onClose }) => {
  const [form, setForm] = useState({
    titre: "",
    enonce: "",
    ordre: 1,
    notebookId: "",
    structure: null,
    ...initial,
  });

  const [showStructure, setShowStructure] = useState(!!initial?.structure);

  const initStructure = () => ({
    contexte: "",
    objectif: "",
    donnees: [""],
    contraintes: [""],
    resultatAttendu: "",
    exempleIO: { entree: "", sortie: "" },
  });

  const s = form.structure || initStructure();

  const updateStructure = (field, value) =>
    setForm((f) => ({ ...f, structure: { ...(f.structure || initStructure()), [field]: value } }));

  const updateListItem = (field, idx, value) => {
    const arr = [...(s[field] || [])];
    arr[idx] = value;
    updateStructure(field, arr);
  };

  const addListItem = (field) =>
    updateStructure(field, [...(s[field] || []), ""]);

  const removeListItem = (field, idx) =>
    updateStructure(field, (s[field] || []).filter((_, i) => i !== idx));

  return (
    <Modal
      title={initial?.id ? "Modifier la question" : "Ajouter une question"}
      onClose={onClose}
      width={720}
    >
      <div className="form-group">
        <label className="form-label">Titre</label>
        <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Ordre d'affichage</label>
        <input
          className="input"
          type="number"
          min={1}
          value={form.ordre}
          onChange={(e) => setForm({ ...form, ordre: parseInt(e.target.value) || 1 })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Notebook associé</label>
        <select
          className="input"
          style={{ cursor: "pointer" }}
          value={form.notebookId}
          onChange={(e) => setForm({ ...form, notebookId: e.target.value })}
        >
          <option value="">— Aucun —</option>
          {notebooks.map((n) => (
            <option key={n.id} value={n.id}>{n.titre}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Énoncé (texte simple ou LaTeX $...$)</label>
        <textarea
          className="input"
          rows={3}
          style={{ fontFamily: "var(--font-ui)" }}
          value={form.enonce}
          onChange={(e) => setForm({ ...form, enonce: e.target.value })}
          placeholder="Énoncé principal. Utilisez $...$ pour le LaTeX inline et $$...$$ pour les blocs."
        />
      </div>

      {/* Bascule structure pédagogique */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "var(--bg-cell)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          marginBottom: 14,
          cursor: "pointer",
        }}
        onClick={() => {
          if (!showStructure) {
            setForm((f) => ({ ...f, structure: f.structure || initStructure() }));
          }
          setShowStructure((v) => !v);
        }}
      >
        <span style={{ fontSize: 14 }}>{showStructure ? "▾" : "▸"}</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          Structure pédagogique détaillée
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
          (contexte, objectif, données, contraintes, résultat, exemple I/O)
        </span>
      </div>

      {showStructure && (
        <div
          style={{
            background: "var(--bg-cell)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Contexte */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">📚 Contexte du problème</label>
            <textarea
              className="input"
              rows={2}
              style={{ fontFamily: "var(--font-ui)" }}
              value={s.contexte}
              onChange={(e) => updateStructure("contexte", e.target.value)}
              placeholder="Contexte pédagogique, introduction au problème…"
            />
          </div>

          {/* Objectif */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">🎯 Objectif à atteindre</label>
            <textarea
              className="input"
              rows={2}
              style={{ fontFamily: "var(--font-ui)" }}
              value={s.objectif}
              onChange={(e) => updateStructure("objectif", e.target.value)}
              placeholder="Ce que l'étudiant doit réaliser…"
            />
          </div>

          {/* Données */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">📋 Données fournies</label>
            {(s.donnees || []).map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input
                  className="input"
                  value={d}
                  onChange={(e) => updateListItem("donnees", i, e.target.value)}
                  placeholder={`Donnée ${i + 1} (LaTeX OK : $A = \\begin{bmatrix}…)`}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--danger)", flexShrink: 0 }}
                  onClick={() => removeListItem("donnees", i)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => addListItem("donnees")}>＋ Ajouter une donnée</button>
          </div>

          {/* Contraintes */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">⚠️ Contraintes à respecter</label>
            {(s.contraintes || []).map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input
                  className="input"
                  value={c}
                  onChange={(e) => updateListItem("contraintes", i, e.target.value)}
                  placeholder={`Contrainte ${i + 1}`}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--danger)", flexShrink: 0 }}
                  onClick={() => removeListItem("contraintes", i)}
                >
                  ✕
                </button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => addListItem("contraintes")}>＋ Ajouter une contrainte</button>
          </div>

          {/* Résultat attendu */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">✅ Résultat attendu</label>
            <textarea
              className="input"
              rows={2}
              style={{ fontFamily: "var(--font-ui)" }}
              value={s.resultatAttendu}
              onChange={(e) => updateStructure("resultatAttendu", e.target.value)}
              placeholder="Description du résultat attendu…"
            />
          </div>

          {/* Exemple I/O */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">💡 Exemple d'entrée / sortie</label>
            <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <textarea
                className="input"
                rows={3}
                placeholder="Entrée…"
                value={s.exempleIO?.entree || ""}
                onChange={(e) =>
                  updateStructure("exempleIO", { ...s.exempleIO, entree: e.target.value })
                }
              />
              <textarea
                className="input"
                rows={3}
                placeholder="Sortie attendue…"
                value={s.exempleIO?.sortie || ""}
                onChange={(e) =>
                  updateStructure("exempleIO", { ...s.exempleIO, sortie: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.titre || !form.enonce) {
              toast("Titre et énoncé requis", "error");
              return;
            }
            onSave({ ...form, structure: showStructure ? form.structure : null });
          }}
        >
          Enregistrer
        </button>
      </div>
    </Modal>
  );
};

/** Modal d'ajout / modification d'un notebook */
const NotebookFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ titre: "", description: "", cells: [], ...initial });

  const addCell = () =>
    setForm((f) => ({
      ...f,
      cells: [...(f.cells || []), { id: uid(), question: "", content: "# Nouvelle cellule\n" }],
    }));

  const removeCell = (id) =>
    setForm((f) => ({ ...f, cells: f.cells.filter((c) => c.id !== id) }));

  const updateCell = (id, field, value) =>
    setForm((f) => ({
      ...f,
      cells: f.cells.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));

  return (
    <Modal
      title={initial?.id ? "Modifier le notebook" : "Créer un notebook"}
      onClose={onClose}
      width={700}
    >
      <div className="form-group">
        <label className="form-label">Titre</label>
        <input className="input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span className="form-label" style={{ flex: 1 }}>Cellules ({form.cells?.length || 0})</span>
          <button className="btn btn-ghost btn-sm" onClick={addCell}>＋ Cellule</button>
        </div>
        {(form.cells || []).map((c, i) => (
          <div key={c.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Cellule {i + 1}</span>
              <button
                className="btn btn-xs"
                style={{ color: "var(--danger)", marginLeft: "auto" }}
                onClick={() => removeCell(c.id)}
              >
                ✕
              </button>
            </div>
            <textarea
              className="input"
              rows={2}
              style={{ fontFamily: "var(--font-ui)", marginBottom: 6 }}
              value={c.question || ""}
              onChange={(e) => updateCell(c.id, "question", e.target.value)}
              placeholder={`Question ${i + 1} (texte affiché au-dessus de la cellule, LaTeX $...$ supporté)`}
            />
            <textarea
              className="input"
              rows={4}
              value={c.content}
              onChange={(e) => updateCell(c.id, "content", e.target.value)}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.titre) { toast("Titre requis", "error"); return; }
            onSave(form);
          }}
        >
          Enregistrer
        </button>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : PANNEAU SOUMISSIONS (Admin)
// ─────────────────────────────────────────────

const SubmissionsPanel = ({ submissions, questions, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const filtered = submissions.filter((s) => {
    const matchSearch =
      !search ||
      `${s.nom} ${s.prenom} ${s.apogee} ${s.submissionId}`.toLowerCase().includes(search.toLowerCase());
    const matchDate =
      !filterDate ||
      s.date.startsWith(filterDate);
    return matchSearch && matchDate;
  });

  const verifySubmission = () => {
    if (!verifyInput.trim()) return;
    const found = submissions.find(
      (s) =>
        s.submissionId === verifyInput.trim() ||
        s.verificationCode === verifyInput.trim()
    );
    setVerifyResult(found || null);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Soumissions des Étudiants</h2>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Actualiser">
          🔄 Actualiser
        </button>
      </div>

      {/* Barre de filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="🔍 Nom, prénom, code Apogée ou identifiant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="input"
          type="date"
          style={{ width: 160 }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          title="Filtrer par date"
        />
        {(search || filterDate) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilterDate(""); }}>
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, fontSize: 12, color: "var(--text-muted)" }}>
        <span>Total : <strong style={{ color: "var(--text-sec)" }}>{submissions.length}</strong></span>
        {filtered.length !== submissions.length && (
          <span>Filtrés : <strong style={{ color: "var(--accent)" }}>{filtered.length}</strong></span>
        )}
        <span>PDFs téléchargés : <strong style={{ color: "var(--success)" }}>{submissions.filter((s) => s.pdfDownloaded).length}</strong></span>
      </div>

      {/* Tableau des soumissions */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        {filtered.length === 0 ? (
          <div className="empty-state">
            {submissions.length === 0
              ? "Aucune soumission enregistrée pour le moment."
              : "Aucun résultat pour ces filtres."}
          </div>
        ) : (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Étudiant</th>
                <th>Code Apogée</th>
                <th>Date & Heure</th>
                <th>Questions</th>
                <th>Code de vérification</th>
                <th>PDF</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.submissionId}>
                  <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{s.prenom} {s.nom}</td>
                  <td>
                    <span className="badge badge-blue">{s.apogee}</span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-sec)" }}>{s.dateDisplay}</td>
                  <td>
                    <span className={`badge ${s.completedCount === s.totalQuestions ? "badge-green" : "badge-blue"}`}>
                      {s.completedCount}/{s.totalQuestions}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--accent)",
                        background: "rgba(56,139,253,.08)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {s.verificationCode}
                    </span>
                  </td>
                  <td>
                    {s.pdfDownloaded ? (
                      <span className="badge badge-green">✓ Téléchargé</span>
                    ) : (
                      <span className="badge" style={{ color: "var(--warn)", background: "rgba(227,179,65,.1)" }}>En attente</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => setSelectedSub(s)}
                      title="Voir les détails"
                    >
                      👁 Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Vérificateur d'authenticité */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
        }}
      >
        <h4 style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>
          🔐 Vérifier l'authenticité d'une soumission
        </h4>
        <p style={{ color: "var(--text-sec)", fontSize: 13, marginBottom: 14 }}>
          Saisissez un identifiant de soumission ou un code de vérification pour valider un document.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            style={{ flex: 1, fontFamily: "var(--font-mono)" }}
            placeholder="EXM-XXXX-XXXX-XXXX-XXXX  ou  ABCD-1234"
            value={verifyInput}
            onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(undefined); }}
            onKeyDown={(e) => e.key === "Enter" && verifySubmission()}
          />
          <button className="btn btn-primary" onClick={verifySubmission}>
            Vérifier
          </button>
        </div>
        {verifyResult === null && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(248,81,73,.08)",
              border: "1px solid rgba(248,81,73,.3)",
              borderRadius: "var(--radius)",
              color: "var(--danger)",
              fontSize: 13,
            }}
          >
            ❌ Aucune soumission trouvée avec cet identifiant ou code de vérification.
          </div>
        )}
        {verifyResult && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 16px",
              background: "rgba(63,185,80,.08)",
              border: "1px solid rgba(63,185,80,.3)",
              borderRadius: "var(--radius)",
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--success)", marginBottom: 6 }}>
              ✅ Soumission authentique
            </div>
            <div style={{ color: "var(--text-sec)" }}>
              <strong>{verifyResult.prenom} {verifyResult.nom}</strong> — Apogée : <strong>{verifyResult.apogee}</strong>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
              Soumis le {verifyResult.dateDisplay} • {verifyResult.completedCount}/{verifyResult.totalQuestions} questions
            </div>
          </div>
        )}
      </div>

      {/* Modal détail soumission */}
      {selectedSub && (
        <Modal
          title={`Soumission — ${selectedSub.prenom} ${selectedSub.nom}`}
          onClose={() => setSelectedSub(null)}
          width={680}
        >
          <div style={{ marginBottom: 16 }}>
            <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                ["Code Apogée", selectedSub.apogee],
                ["Date", selectedSub.dateDisplay],
                ["Temps", selectedSub.timeSpent],
                ["Questions", `${selectedSub.completedCount}/${selectedSub.totalQuestions}`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "var(--bg-root)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".5px" }}>{lbl}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(56,139,253,.06)", border: "1px solid rgba(56,139,253,.2)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>IDENTIFIANT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700 }}>{selectedSub.submissionId}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Code de vérification : <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{selectedSub.verificationCode}</span>
              </div>
            </div>

            {/* Réponses */}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {/* Affichage exercices (nouveau format) */}
              {selectedSub.exercises && selectedSub.exercises.length > 0 && (() => {
                let gq = 0;
                return selectedSub.exercises.map((ex, ei) => (
                  <div key={ex.id} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>
                      Exercice {ei + 1} — {ex.title}
                    </div>
                    {ex.questions.map((q, qi) => {
                      gq++;
                      const code = selectedSub.answers?.[q.id] || "";
                      const answered = code.trim() && code.trim() !== (q.initialCode ?? "# Votre code Python ici\n").trim();
                      return (
                        <div key={q.id} style={{ marginBottom: 8, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                          <div style={{ background: "var(--bg-panel)", padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                            <span className={`badge ${answered ? "badge-green" : ""}`} style={!answered ? { background: "rgba(248,81,73,.1)", color: "var(--danger)" } : {}}>
                              Q{gq}
                            </span>
                            <span style={{ fontWeight: 500, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {stripLatex(q.statement || "").slice(0, 60)}
                            </span>
                            <span style={{ fontSize: 11, color: answered ? "var(--success)" : "var(--danger)" }}>
                              {answered ? "✓" : "✕"}
                            </span>
                          </div>
                          {code.trim() && (
                            <pre style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-sec)", background: "var(--bg-cell)", padding: "6px 10px", margin: 0, whiteSpace: "pre-wrap", maxHeight: 80, overflow: "auto" }}>
                              {code.trim()}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
              {/* Affichage legacy (questions plates) */}
              {(!selectedSub.exercises || selectedSub.exercises.length === 0) && questions.map((q) => {
                const cells = selectedSub.answers?.[q.id] || [];
                const answered = cells.some((c) => c.content?.trim() && c.content !== "# Votre code Python ici\n");
                return (
                  <div key={q.id} style={{ marginBottom: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                    <div style={{ background: "var(--bg-panel)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`badge ${answered ? "badge-green" : ""}`} style={!answered ? { background: "rgba(248,81,73,.1)", color: "var(--danger)" } : {}}>Q{q.ordre}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{stripLatex(q.titre)}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: answered ? "var(--success)" : "var(--danger)" }}>
                        {answered ? "✓ Répondu" : "✕ Non répondu"}
                      </span>
                    </div>
                    {cells.length > 0 && (
                      <div style={{ padding: "8px 14px" }}>
                        {cells.map((c, ci) => (
                          <div key={ci} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>Cellule {ci + 1}</div>
                            <pre style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-sec)", background: "var(--bg-cell)", padding: "6px 10px", borderRadius: 4, whiteSpace: "pre-wrap", maxHeight: 100, overflow: "auto" }}>
                              {(c.content || "").trim() || "(vide)"}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setSelectedSub(null)}>Fermer</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : TABLEAU DE BORD ADMINISTRATEUR
//  Améliorations :
//  - Onglet "Étudiants" avec import Excel
//  - Recherche par nom ou code Apogée
//  - Prévisualisation LaTeX des questions
// ─────────────────────────────────────────────

const AdminDashboard = ({ onLogout }) => {
  const [section, setSection] = useState("students");
  const [students, setStudents] = useState(() => lsGet(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS));
  const [questions, setQuestions] = useState(() => lsGet(STORAGE_KEYS.QUESTIONS, DEFAULT_QUESTIONS));
  const [notebooks, setNotebooks] = useState(() => lsGet(STORAGE_KEYS.NOTEBOOKS, DEFAULT_NOTEBOOKS));
  const [submissions, setSubmissions] = useState(() => lsGet(STORAGE_KEYS.SUBMISSIONS, []));
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id à supprimer

  // Persistence automatique
  useEffect(() => { lsSet(STORAGE_KEYS.STUDENTS, students); }, [students]);
  useEffect(() => { lsSet(STORAGE_KEYS.QUESTIONS, questions); }, [questions]);
  useEffect(() => { lsSet(STORAGE_KEYS.NOTEBOOKS, notebooks); }, [notebooks]);

  // ── Étudiants ──
  const saveStudent = (data) => {
    if (modal?.data?.id) {
      setStudents((s) => s.map((x) => (x.id === data.id ? data : x)));
      toast("Étudiant modifié", "success");
    } else {
      setStudents((s) => [...s, { ...data, id: uid() }]);
      toast("Étudiant ajouté", "success");
    }
    setModal(null);
  };

  const deleteStudent = (id) => {
    setStudents((s) => s.filter((x) => x.id !== id));
    toast("Étudiant supprimé", "warn");
    setDeleteConfirm(null);
  };

  /**
   * Import en masse depuis Excel.
   * Remplace les doublons (même apogée) ou ajoute les nouveaux.
   */
  const importStudentsFromExcel = (newStudents) => {
    setStudents((existing) => {
      const merged = [...existing];
      for (const ns of newStudents) {
        const idx = merged.findIndex((e) => e.apogee === ns.apogee);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...ns }; // mise à jour
        } else {
          merged.push(ns); // ajout
        }
      }
      return merged;
    });
  };

  // ── Questions ──
  const saveQuestion = (data) => {
    if (modal?.data?.id) {
      setQuestions((q) => q.map((x) => (x.id === data.id ? data : x)));
      toast("Question modifiée", "success");
    } else {
      setQuestions((q) => [...q, { ...data, id: uid() }]);
      toast("Question ajoutée", "success");
    }
    setModal(null);
  };
  const deleteQuestion = (id) => {
    setQuestions((q) => q.filter((x) => x.id !== id));
    toast("Question supprimée", "warn");
  };

  // ── Notebooks ──
  const saveNotebook = (data) => {
    if (modal?.data?.id) {
      setNotebooks((n) => n.map((x) => (x.id === data.id ? data : x)));
      toast("Notebook modifié", "success");
    } else {
      setNotebooks((n) => [...n, { ...data, id: uid() }]);
      toast("Notebook créé", "success");
    }
    setModal(null);
  };
  const deleteNotebook = (id) => {
    setNotebooks((n) => n.filter((x) => x.id !== id));
    toast("Notebook supprimé", "warn");
  };

  /** Filtre la liste d'étudiants par nom, prénom ou code Apogée */
  const filteredStudents = students.filter(
    (s) =>
      !search ||
      `${s.nom} ${s.prenom} ${s.apogee}`.toLowerCase().includes(search.toLowerCase())
  );

  // Refresh submissions when switching to that section
  const handleSectionChange = (id) => {
    if (id === "submissions") {
      setSubmissions(lsGet(STORAGE_KEYS.SUBMISSIONS, []));
    }
    setSection(id);
    setSearch("");
  };

  const NAV = [
    { id: "overview", label: "Vue d'ensemble", icon: "📊" },
    { id: "students", label: "Étudiants", icon: "👥" },
    { id: "questions", label: "Questions", icon: "❓" },
    { id: "notebooks", label: "Notebooks", icon: "📓" },
    { id: "submissions", label: "Soumissions", icon: "📋" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar navigation */}
      <nav className="sidebar">
        <div style={{ padding: "16px 14px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🐍</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>PyExam Studio</div>
              <div style={{ fontSize: 11, color: "var(--accent)" }}>Administrateur</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`sidebar-item ${section === n.id ? "active" : ""}`}
              onClick={() => handleSectionChange(n.id)}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
              {n.id === "students" && (
                <span className="badge badge-blue" style={{ marginLeft: "auto", fontSize: 10 }}>
                  {students.length}
                </span>
              )}
              {n.id === "questions" && (
                <span className="badge badge-purple" style={{ marginLeft: "auto", fontSize: 10 }}>
                  {questions.length}
                </span>
              )}
              {n.id === "submissions" && submissions.length > 0 && (
                <span className="badge badge-green" style={{ marginLeft: "auto", fontSize: 10 }}>
                  {submissions.length}
                </span>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={onLogout}
          >
            ⬅ Déconnexion
          </button>
        </div>
      </nav>

      {/* Zone principale */}
      <main className="main-scroll" style={{ flex: 1, padding: "24px", background: "var(--bg-root)" }}>

        {/* ── Vue d'ensemble ── */}
        {section === "overview" && (
          <div className="fade-in">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Vue d'ensemble</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {[
                { label: "Étudiants", value: students.length, icon: "👥", color: "var(--accent)" },
                { label: "Questions", value: questions.length, icon: "❓", color: "var(--accent-4)" },
                { label: "Notebooks", value: notebooks.length, icon: "📓", color: "var(--success)" },
                { label: "Soumissions", value: submissions.length, icon: "📋", color: "var(--warn)" },
              ].map((s) => (
                <div key={s.label} className="stat-card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ color: "var(--text-sec)", fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
              }}
            >
              <h4 style={{ marginBottom: 12, fontWeight: 600 }}>Configuration rapide</h4>
              <p style={{ color: "var(--text-sec)", fontSize: 14 }}>
                Compte admin : <strong>admin</strong> / <strong>admin123</strong>
              </p>
              <div className="sep" />
              <p style={{ color: "var(--text-sec)", fontSize: 14 }}>
                Les étudiants se connectent avec leur <strong>Nom</strong>,{" "}
                <strong>Prénom</strong> et <strong>Code Apogée</strong>. Les trois champs doivent
                correspondre exactement.
              </p>
              <div className="sep" />
              <p style={{ color: "var(--text-sec)", fontSize: 14 }}>
                💡 Vous pouvez importer la liste des étudiants depuis un fichier Excel dans la section{" "}
                <strong>Étudiants</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Gestion des Étudiants ── */}
        {section === "students" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Gestion des Étudiants</h2>
              {/* Recherche par nom ou code Apogée */}
              <input
                className="input"
                style={{ width: 230 }}
                placeholder="🔍 Nom, prénom ou code Apogée…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* Import Excel */}
              <button
                className="btn btn-excel"
                onClick={() => setShowExcelImport(true)}
                title="Importer depuis un fichier Excel"
              >
                📊 Importer Excel
              </button>
              {/* Ajout manuel */}
              <button
                className="btn btn-primary"
                onClick={() => setModal({ type: "student", data: {} })}
              >
                ＋ Ajouter
              </button>
            </div>

            {/* Statistiques rapides */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 16,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <span>Total : <strong style={{ color: "var(--text-sec)" }}>{students.length}</strong></span>
              {search && (
                <span>
                  Résultats : <strong style={{ color: "var(--accent)" }}>{filteredStudents.length}</strong>
                </span>
              )}
            </div>

            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Code Apogée</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}
                      >
                        {search ? "Aucun résultat pour cette recherche" : "Aucun étudiant enregistré"}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <tr key={s.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: 11, width: 40 }}>
                          {idx + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{s.nom}</td>
                        <td>{s.prenom}</td>
                        <td>
                          <span className="badge badge-blue">{s.apogee}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setModal({ type: "student", data: s })}
                          >
                            ✏️ Modifier
                          </button>{" "}
                          <button
                            className="btn btn-xs"
                            style={{
                              color: "var(--danger)",
                              background: "rgba(248,81,73,.1)",
                              border: "1px solid rgba(248,81,73,.3)",
                            }}
                            onClick={() => setDeleteConfirm(s.id)}
                          >
                            🗑 Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Gestion des Questions ── */}
        {section === "questions" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Gestion des Questions</h2>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setModal({ type: "question", data: { ordre: questions.length + 1 } })
                }
              >
                ＋ Ajouter
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions
                .sort((a, b) => a.ordre - b.ordre)
                .map((q) => (
                  <div
                    key={q.id}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "16px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span className="badge badge-blue">Q{q.ordre}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>
                          <LatexRenderer text={q.titre} />
                        </div>
                        <div style={{ color: "var(--text-sec)", fontSize: 13, lineHeight: 1.6 }}>
                          <LatexRenderer text={(q.enonce || "").slice(0, 160) + (q.enonce?.length > 160 ? "…" : "")} />
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {q.notebookId && (
                            <span className="chip">
                              📓 {notebooks.find((n) => n.id === q.notebookId)?.titre || "Notebook"}
                            </span>
                          )}
                          {q.structure && (
                            <span className="chip" style={{ color: "var(--accent)" }}>
                              🎓 Structure pédagogique
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => setModal({ type: "question", data: q })}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-xs"
                          style={{
                            color: "var(--danger)",
                            background: "rgba(248,81,73,.1)",
                            border: "1px solid rgba(248,81,73,.3)",
                          }}
                          onClick={() => deleteQuestion(q.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              {questions.length === 0 && (
                <div className="empty-state">Aucune question définie</div>
              )}
            </div>
          </div>
        )}

        {/* ── Soumissions ── */}
        {section === "submissions" && (
          <SubmissionsPanel submissions={submissions} questions={questions} onRefresh={() => setSubmissions(lsGet(STORAGE_KEYS.SUBMISSIONS, []))} />
        )}

        {/* ── Gestion des Notebooks ── */}
        {section === "notebooks" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Gestion des Notebooks</h2>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setModal({
                    type: "notebook",
                    data: { cells: [{ id: uid(), content: "# Cellule 1\n" }] },
                  })
                }
              >
                ＋ Créer
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {notebooks.map((nb) => (
                <div key={nb.id} className="stat-card" style={{ cursor: "pointer" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📓</div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{nb.titre}</div>
                  <div style={{ color: "var(--text-sec)", fontSize: 13, marginBottom: 12 }}>
                    {nb.description}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 12 }}>
                    {nb.cells?.length || 0} cellule{nb.cells?.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setModal({ type: "notebook", data: nb })}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{
                        color: "var(--danger)",
                        background: "rgba(248,81,73,.1)",
                        border: "1px solid rgba(248,81,73,.3)",
                      }}
                      onClick={() => deleteNotebook(nb.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
              {notebooks.length === 0 && (
                <div className="empty-state">Aucun notebook créé</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Modales formulaires ── */}
      {modal?.type === "student" && (
        <StudentFormModal
          initial={modal.data}
          onSave={saveStudent}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "question" && (
        <QuestionFormModal
          initial={modal.data}
          notebooks={notebooks}
          onSave={saveQuestion}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "notebook" && (
        <NotebookFormModal
          initial={modal.data}
          onSave={saveNotebook}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal import Excel ── */}
      {showExcelImport && (
        <ExcelImportModal
          onImport={importStudentsFromExcel}
          onClose={() => setShowExcelImport(false)}
        />
      )}

      {/* ── Confirmation de suppression ── */}
      {deleteConfirm && (
        <Modal title="🗑 Confirmer la suppression" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: "var(--text-sec)", marginBottom: 20, lineHeight: 1.7 }}>
            Voulez-vous vraiment supprimer cet étudiant ? Cette action est{" "}
            <strong>irréversible</strong>.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </button>
            <button className="btn btn-danger" onClick={() => deleteStudent(deleteConfirm)}>
              🗑 Supprimer définitivement
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : INTERFACE ÉTUDIANT (EXAMEN)
//  Refonte hiérarchique : Exercice → Questions → Éditeur
//  La sidebar affiche les exercices et sous-questions.
//  Chaque exercice est une ExerciseCard avec des QuestionEditors indépendants.
// ─────────────────────────────────────────────

const StudentExam = ({ student, onLogout }) => {
  // Charge les exercices depuis le localStorage (ou les données par défaut)
  const exercises = lsGet(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);

  // Calcul du nombre total de questions
  const totalQuestions = exercises.reduce((sum, ex) => sum + ex.questions.length, 0);

  const savedExam = lsGet(STORAGE_KEYS.EXAM_STATE + "_" + student.apogee, null);

  // answers : { [questionId]: string (code) }
  // Structure plate pour simplifier la sauvegarde et la compatibilité
  const [answers, setAnswers] = useState(() =>
    lsGet(STORAGE_KEYS.ANSWERS + "_" + student.apogee, {})
  );
  const [timeLeft, setTimeLeft] = useState(() => savedExam?.timeLeft ?? EXAM_DURATION);
  const [submitted, setSubmitted] = useState(() => savedExam?.submitted ?? false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [securityWarn, setSecurityWarn] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState(exercises[0]?.id ?? null);
  // Pagination : index de l'exercice courant affiché (0-based)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // ── Sécurité plein écran / anti-triche ──
  // L'examen ne démarre (timer, anti-triche) qu'après le clic sur « Commencer le test »
  const [started, setStarted] = useState(false);
  const [violations, setViolations] = useState(() =>
    lsGet(STORAGE_KEYS.VIOLATIONS + "_" + student.apogee, [])
  );
  const [violationDialog, setViolationDialog] = useState(null); // { attempt, remaining }
  const [forceEnded, setForceEnded] = useState(false);
  const lastViolationAtRef = useRef(0);

  // ── Timer ──
  useEffect(() => {
    if (submitted || !started || forceEnded) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [submitted, started, forceEnded]);

  // ── Auto-save toutes les 5 secondes ──
  useEffect(() => {
    const id = setInterval(() => {
      lsSet(STORAGE_KEYS.ANSWERS + "_" + student.apogee, answers);
      lsSet(STORAGE_KEYS.EXAM_STATE + "_" + student.apogee, { timeLeft, submitted });
    }, 5000);
    return () => clearInterval(id);
  }, [answers, timeLeft, submitted]);

  // ── Sécurité : mode plein écran simulé en CSS (pas d'API Fullscreen) ──
  // La taille de fenêtre au moment du démarrage sert de référence pour détecter
  // toute réduction significative par la suite.
  const refSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });

  // Démarrage du test : capture la taille de référence puis active la surveillance.
  // Le test occupe déjà toute la fenêtre du navigateur via le CSS (position fixed, 100vw/100vh).
  const handleStartExam = useCallback(() => {
    refSizeRef.current = { width: window.innerWidth, height: window.innerHeight };
    setStarted(true);
  }, []);

  // Enregistre une violation, affiche le compte d'essais restants, et termine le test à la 3e
  const recordViolation = useCallback((type) => {
    if (!started || submitted || forceEnded) return;
    if (violations.length >= MAX_VIOLATIONS) return;
    const now = Date.now();
    if (now - lastViolationAtRef.current < 1200) return; // anti-doublon (ex: resize + blur simultanés)
    lastViolationAtRef.current = now;

    const entry = { type, date: new Date().toISOString(), attempt: violations.length + 1 };
    const next = [...violations, entry];
    setViolations(next);
    lsSet(STORAGE_KEYS.VIOLATIONS + "_" + student.apogee, next);

    if (next.length >= MAX_VIOLATIONS) {
      setForceEnded(true);
      setSubmitted(true);
      lsSet(STORAGE_KEYS.ANSWERS + "_" + student.apogee, answers);
      lsSet(STORAGE_KEYS.EXAM_STATE + "_" + student.apogee, { timeLeft, submitted: true });
    } else {
      setViolationDialog({ attempt: next.length, remaining: MAX_VIOLATIONS - next.length });
    }
  }, [started, submitted, forceEnded, violations, answers, timeLeft, student.apogee]);

  // ── Surveillance redimensionnement / changement d'onglet / perte de focus ──
  useEffect(() => {
    if (!started) return;

    const onResize = () => {
      // Réduction significative (>10%) par rapport à la taille de référence prise au démarrage
      const { width, height } = refSizeRef.current;
      const shrunkWidth = window.innerWidth < width * 0.9;
      const shrunkHeight = window.innerHeight < height * 0.9;
      if (shrunkWidth || shrunkHeight) {
        recordViolation("redimensionnement_fenetre");
      } else {
        // La fenêtre est redevenue assez grande : on met à jour la référence
        refSizeRef.current = { width: window.innerWidth, height: window.innerHeight };
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) recordViolation("changement_onglet");
    };
    const onBlur = () => {
      recordViolation("perte_focus");
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [started, recordViolation]);

  // ── Blocage global Ctrl+C/V/X/A ──
  useEffect(() => {
    const block = (e) => {
      if (["c", "v", "x", "a"].includes(e.key?.toLowerCase()) && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        showSecurityWarning();
      }
    };
    const blockCtx = (e) => { e.preventDefault(); showSecurityWarning(); };
    document.addEventListener("keydown", block, true);
    document.addEventListener("contextmenu", blockCtx, true);
    return () => {
      document.removeEventListener("keydown", block, true);
      document.removeEventListener("contextmenu", blockCtx, true);
    };
  }, []);

  const showSecurityWarning = useCallback(() => {
    setSecurityWarn(true);
    toast("⛔ Action interdite pendant l'examen !", "error");
    setTimeout(() => setSecurityWarn(false), 1500);
  }, []);

  // Sauvegarde le code d'une question individuelle
  const saveQuestionCode = useCallback((questionId, code) => {
    setAnswers((prev) => ({ ...prev, [questionId]: code }));
  }, []);

  // Nombre de questions répondues (code non vide et différent du template)
  const completedCount = exercises.reduce((count, ex) =>
    count + ex.questions.filter((q) => {
      const code = answers[q.id];
      return code && code.trim() && code.trim() !== (q.initialCode ?? "# Votre code Python ici\n").trim();
    }).length
  , 0);

  const progress = totalQuestions ? Math.round((completedCount / totalQuestions) * 100) : 0;
  const timerDanger = timeLeft < 600;

  const handleSubmit = (auto = false) => {
    setSubmitted(true);
    lsSet(STORAGE_KEYS.ANSWERS + "_" + student.apogee, answers);
    lsSet(STORAGE_KEYS.EXAM_STATE + "_" + student.apogee, { timeLeft: 0, submitted: true });
    if (!auto) toast("Examen soumis avec succès !", "success");
  };

  if (submitted) {
    if (forceEnded) {
      return (
        <div className="exam-start-gate">
          <div className="exam-start-card">
            <div style={{ fontSize: 40, marginBottom: 12 }}>⛔</div>
            <h2 style={{ color: "var(--danger)", marginBottom: 12 }}>Test arrêté automatiquement</h2>
            <p style={{ color: "var(--text-sec)", marginBottom: 24, lineHeight: 1.5 }}>
              Votre test a été arrêté automatiquement, car vous avez dépassé le nombre autorisé de violations ({MAX_VIOLATIONS}).
            </p>
            <button className="btn btn-primary" onClick={() => setForceEnded(false)}>
              Voir mon rapport
            </button>
          </div>
        </div>
      );
    }
    return (
      <ExamReport
        student={student}
        exercises={exercises}
        answers={answers}
        timeSpent={EXAM_DURATION - timeLeft}
        onLogout={onLogout}
      />
    );
  }

  // ── Porte d'entrée : l'étudiant doit cliquer pour démarrer le test ──
  if (!started) {
    return (
      <div className="exam-start-gate">
        <div className="exam-start-card">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖥️</div>
          <h2 style={{ marginBottom: 12 }}>Fenêtre maximisée requise</h2>
          <p style={{ color: "var(--text-sec)", marginBottom: 8, lineHeight: 1.5 }}>
            Pour des raisons de sécurité, ce test doit être réalisé avec la fenêtre du
            navigateur maximisée et visible. Toute réduction notable de la fenêtre,
            changement d'onglet, ou perte de focus sera comptabilisée comme une violation.
          </p>
          <p style={{ color: "var(--text-sec)", marginBottom: 24, fontSize: 13 }}>
            Vous disposez de <b>{MAX_VIOLATIONS}</b> tentatives maximum avant l'arrêt automatique du test.
          </p>
          <button className="btn btn-primary" onClick={handleStartExam}>
            🔒 Commencer le test
          </button>
        </div>
      </div>
    );
  }

  // Calcul des offsets globaux (numérotation continue des questions)
  let globalOffset = 0;
  const exerciseOffsets = exercises.map((ex) => {
    const offset = globalOffset;
    globalOffset += ex.questions.length;
    return offset;
  });

  // Navigation vers un exercice via la sidebar ou la pagination
  const navigateToExercise = (exId) => {
    setActiveExerciseId(exId);
    const idx = exercises.findIndex((ex) => ex.id === exId);
    if (idx !== -1) setCurrentExerciseIndex(idx);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg-root)" }}>
      {/* Avertissement sécurité */}
      {securityWarn && (
        <div className="security-warning">
          <div className="security-warning-box">
            ⛔ Action interdite !
            <br />
            <span style={{ fontWeight: 400, fontSize: 13 }}>
              Copier/Coller/Couper est désactivé pendant l'examen.
            </span>
          </div>
        </div>
      )}

      {/* Avertissement de violation : redimensionnement / onglet / focus */}
      {violationDialog && (
        <div className="violation-overlay">
          <div className="violation-box">
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <h3 style={{ color: "var(--danger)", marginBottom: 10 }}>Violation détectée</h3>
            <p style={{ marginBottom: 14, lineHeight: 1.5 }}>
              Vous devez effectuer le test avec la fenêtre du navigateur maximisée et
              visible. Toute réduction de la fenêtre, changement d'onglet ou perte de
              focus est considérée comme une violation.
            </p>
            <p style={{ fontWeight: 700, marginBottom: 18 }}>
              Tentatives restantes : {violationDialog.remaining}/{MAX_VIOLATIONS}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setViolationDialog(null);
                refSizeRef.current = { width: window.innerWidth, height: window.innerHeight };
              }}
            >
              J'ai compris, revenir au test
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="app-header">
        <span style={{ fontSize: 20 }}>🐍</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>PyExam Studio</span>
        <div className="sep" style={{ width: 1, height: 20, margin: "0 8px", background: "var(--border)" }} />
        <span style={{ fontSize: 13, color: "var(--text-sec)" }}>
          {student.prenom} {student.nom}
        </span>
        <span className="badge badge-blue" style={{ marginLeft: 4 }}>{student.apogee}</span>
        <span className={`violation-indicator${violations.length > 0 ? " has-violations" : ""}`} style={{ marginLeft: 8 }}>
          Violations : {violations.length}/{MAX_VIOLATIONS}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text-sec)" }}>
            {completedCount}/{totalQuestions}
          </span>
          <div className="progress-bar" style={{ width: 100 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{progress}%</span>
        </div>
        <div className="sep" style={{ width: 1, height: 20, margin: "0 8px", background: "var(--border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          <span style={{ fontSize: 13 }}>⏱</span>
          <span
            className={timerDanger ? "timer-danger" : ""}
            style={{ fontSize: 15, color: timerDanger ? "var(--danger)" : "var(--text-pri)" }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
        <button className="btn btn-warn btn-sm" onClick={() => setShowConfirm(true)}>
          🏁 Terminer
        </button>
      </header>

      {/* ── Corps ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Sidebar Exercices / Questions ── */}
        <nav className="sidebar" style={{ width: 200 }}>
          <div className="exercise-sidebar-section">Navigation</div>

          {exercises.map((ex, ei) => {
            const offset = exerciseOffsets[ei];
            const isActive = activeExerciseId === ex.id;
            const exCompleted = ex.questions.filter((q) => {
              const code = answers[q.id];
              return code && code.trim() && code.trim() !== (q.initialCode ?? "# Votre code Python ici\n").trim();
            }).length;

            return (
              <div key={ex.id}>
                <div
                  className={`exercise-sidebar-item ${isActive ? "active" : ""}`}
                  onClick={() => navigateToExercise(ex.id)}
                  title={ex.title}
                >
                  <span
                    className={`badge ${exCompleted === ex.questions.length ? "badge-green" : "badge-blue"}`}
                    style={{ fontSize: 10, minWidth: 18, height: 18, justifyContent: "center" }}
                  >
                    {ei + 1}
                  </span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                    {ex.title}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {exCompleted}/{ex.questions.length}
                  </span>
                </div>
                {/* Sous-questions */}
                {ex.questions.map((q, qi) => {
                  const code = answers[q.id];
                  const done = code && code.trim() && code.trim() !== (q.initialCode ?? "# Votre code Python ici\n").trim();
                  return (
                    <div
                      key={q.id}
                      className={`exercise-sidebar-subitem ${done ? "done" : ""}`}
                      onClick={() => {
                        setActiveExerciseId(ex.id);
                        const el = document.getElementById(`question-${q.id}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      title={`Question ${offset + qi + 1}`}
                    >
                      {done
                        ? <span style={{ color: "var(--success)", fontSize: 11 }}>✓</span>
                        : <span style={{ color: "var(--border)", fontSize: 11 }}>○</span>
                      }
                      <span>Q{offset + qi + 1}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Avancement global</div>
            <div className="progress-bar" style={{ marginBottom: 6 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-sec)" }}>
              {completedCount} / {totalQuestions} répondues
            </div>
          </div>
        </nav>

        {/* ── Zone principale : exercice courant (pagination) ── */}
        <main className="main-scroll" style={{ flex: 1, padding: "24px 28px" }}>
          {exercises.length > 0 ? (() => {
            const ex = exercises[currentExerciseIndex];
            const isFirst = currentExerciseIndex === 0;
            const isLast = currentExerciseIndex === exercises.length - 1;

            const goTo = (idx) => {
              setCurrentExerciseIndex(idx);
              setActiveExerciseId(exercises[idx].id);
            };

            return (
              <div className="fade-in" key={ex.id}>
                {/* Indicateur de progression */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 18,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}>
                  <span>Exercice <strong style={{ color: "var(--text-pri)" }}>{currentExerciseIndex + 1}</strong> sur <strong style={{ color: "var(--text-pri)" }}>{exercises.length}</strong></span>
                  <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%`,
                      background: "linear-gradient(90deg, var(--accent), var(--accent-4))",
                      borderRadius: 2,
                      transition: "width 0.35s ease",
                    }} />
                  </div>
                </div>

                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  exerciseIndex={currentExerciseIndex}
                  questionOffset={exerciseOffsets[currentExerciseIndex]}
                  savedCodes={answers}
                  onSave={saveQuestionCode}
                  readOnly={false}
                />

                {/* Navigation Précédent / Suivant */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 24,
                  marginBottom: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                }}>
                  <button
                    className="btn btn-ghost"
                    style={{ gap: 8, opacity: isFirst ? 0.35 : 1 }}
                    disabled={isFirst}
                    onClick={() => goTo(currentExerciseIndex - 1)}
                  >
                    ← Précédent
                  </button>

                  {/* Points de navigation */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {exercises.map((e, i) => (
                      <button
                        key={e.id}
                        title={e.title}
                        onClick={() => goTo(i)}
                        style={{
                          width: i === currentExerciseIndex ? 24 : 10,
                          height: 10,
                          borderRadius: 99,
                          border: "none",
                          cursor: "pointer",
                          background: i === currentExerciseIndex
                            ? "var(--accent)"
                            : "var(--border)",
                          transition: "all 0.25s ease",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>

                  {isLast ? (
                    <button
                      className="btn btn-warn"
                      style={{ fontSize: 13, padding: "8px 20px" }}
                      onClick={() => setShowConfirm(true)}
                    >
                      🏁 Terminer et soumettre
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ gap: 8 }}
                      onClick={() => goTo(currentExerciseIndex + 1)}
                    >
                      Suivant →
                    </button>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="empty-state">
              <p>Aucun exercice disponible pour cet examen.</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Confirmation soumission ── */}
      {showConfirm && (
        <Modal title="🏁 Terminer l'examen" onClose={() => setShowConfirm(false)}>
          <p style={{ color: "var(--text-sec)", marginBottom: 20, lineHeight: 1.7 }}>
            Êtes-vous sûr de vouloir soumettre votre examen ? Cette action est{" "}
            <strong>irréversible</strong>.
            <br />
            Questions répondues : <strong>{completedCount}/{totalQuestions}</strong>
          </p>
          <div
            style={{
              background: "rgba(248,81,73,.08)",
              border: "1px solid rgba(248,81,73,.2)",
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <span style={{ color: "var(--danger)", fontSize: 13 }}>
              ⚠️ Une fois soumis, vous ne pourrez plus modifier vos réponses.
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>
              Continuer l'examen
            </button>
            <button
              className="btn btn-danger"
              onClick={() => { setShowConfirm(false); handleSubmit(); }}
            >
              ✅ Confirmer la soumission
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT : RAPPORT FINAL (avec génération PDF)
// ─────────────────────────────────────────────

const ExamReport = ({ student, exercises, questions: legacyQuestions, notebooks, answers, timeSpent, onLogout }) => {
  // Support des deux structures : exercises (nouveau) ou questions (legacy)
  const hasExercises = exercises && exercises.length > 0;

  // Calcul du nombre total de questions et du nombre répondues
  const totalQuestions = hasExercises
    ? exercises.reduce((sum, ex) => sum + ex.questions.length, 0)
    : (legacyQuestions?.length ?? 0);

  const [pdfState, setPdfState] = useState("idle"); // idle | loading | done | error
  const [pdfReady, setPdfReady] = useState(false); // true dès que le PDF local existe (indépendant de l'envoi au serveur)
  const [showMegaModal, setShowMegaModal] = useState(false); // affiche le widget de dépôt Mega
  const [submissionId, setSubmissionId] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const submissionRef = useRef(null);
  const pdfBlobRef = useRef(null); // conserve le PDF déjà généré pour le téléchargement étudiant
  const pdfFilenameRef = useRef(null);

  const now = useRef(new Date());
  const dateStr = now.current.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.current.toLocaleTimeString("fr-FR");

  const completedCount = hasExercises
    ? exercises.reduce((count, ex) =>
        count + ex.questions.filter((q) => {
          const code = answers[q.id];
          return code && code.trim() && code.trim() !== (q.initialCode ?? "# Votre code Python ici\n").trim();
        }).length
      , 0)
    : (legacyQuestions ?? []).filter((q) =>
        answers[q.id]?.some((c) => c.content?.trim() && c.content !== "# Votre code Python ici\n")
      ).length;

  // Initialise la soumission au montage (une seule fois)
  useEffect(() => {
    const ts = now.current.getTime();
    const sid = generateSubmissionId(student, ts);
    const vcode = computeVerificationCode(sid, student.apogee, ts);
    setSubmissionId(sid);
    setVerificationCode(vcode);

    const submission = {
      submissionId: sid,
      verificationCode: vcode,
      nom: student.nom,
      prenom: student.prenom,
      apogee: student.apogee,
      date: now.current.toISOString(),
      dateDisplay: `${dateStr} à ${timeStr}`,
      timeSpent: formatTime(timeSpent),
      completedCount,
      totalQuestions,
      // Stocke les réponses dans le format adapté (exercises ou legacy)
      answers: hasExercises
        ? answers  // déjà plat { [questionId]: string }
        : Object.fromEntries(
            (legacyQuestions ?? []).map((q) => [q.id, (answers[q.id] || []).map((c) => ({ ...c }))])
          ),
      exercises: hasExercises ? exercises : null,
      pdfDownloaded: false,
    };
    submissionRef.current = submission;
    saveSubmission(submission);
  }, []);

  /**
   * Génère le PDF académique premium avec jsPDF
   * – Page de garde professionnelle
   * – Coloration syntaxique Python (mots-clés, chaînes, commentaires, nombres)
   * – Code complet et fidèle (aucune troncature)
   * – Zone de notation après chaque question
   * – Police monospace Courier pour le code, Helvetica pour le texte
   */
  const generatePDF = async () => {
    if (pdfState === "loading") return;
    setPdfState("loading");
    try {
      await loadJsPDF();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ── Palette couleurs premium ──
      const C = {
        ink:         [15,  23,  42],   // texte principal (ardoise très foncé)
        accentDark:  [30,  58, 138],   // bleu foncé professionnel (#1E3A8A) — titres principaux
        accent:      [37,  99, 235],   // bleu moderne (#2563EB) — numéros de questions
        accentBg:    [239, 246, 255],  // fond bleu très clair
        muted:       [55,  65,  81],   // gris foncé — informations étudiant
        faint:       [107, 114, 128],  // gris moyen — libellés discrets
        line:        [209, 213, 219],  // bordures gris clair
        success:     [21, 128,  61],   // vert foncé — note (#15803D)
        warn:        [180,  83,   9],  // orange discret — commentaires (#B45309)
        codebg:      [243, 244, 246],  // fond code gris clair moderne, style ChatGPT (#F3F4F6)
        codeOuterBg: [249, 250, 251],  // fond wrapper extérieur légèrement plus clair (#F9FAFB)
        codeline:    [229, 231, 235],  // bordure code gris discrète et élégante (#E5E7EB)
        codetext:    [17,  24,  39],   // texte code : encre foncée, lisible sur fond clair (#111827)
        linenum:     [156, 163, 175],  // numéros de ligne : gris discret (#9CA3AF)
        white:       [255, 255, 255],
        // Couleurs syntaxiques (style clair, haute lisibilité sur fond gris clair — inspiré GitHub Light / ChatGPT)
        kwColor:    [8,   109, 221],   // mots-clés : bleu vif
        strColor:   [10,  126,  70],   // chaînes : vert
        cmtColor:   [107, 114, 128],   // commentaires : gris moyen
        numColor:   [176,  61,   0],   // nombres : orange foncé
        builtinColor:[136,  20, 176],  // builtins : violet
        decorColor: [176,  61,   0],   // décorateurs : orange foncé
        bgNotation: [240, 253, 244],   // fond zone de notation (vert très clair)
        lineNotation:[134, 239, 172],  // bordure zone de notation (vert)
      };

      // ── Helpers typographie monospace ──
      // Pour les libellés importants : utilise courier bold (simulant JetBrains Mono Bold)
      const setMonoBold = (size) => { doc.setFont("courier", "bold"); doc.setFontSize(size); };
      const setMonoNormal = (size) => { doc.setFont("courier", "normal"); doc.setFontSize(size); };
      const setUIBold = (size) => { doc.setFont("helvetica", "bold"); doc.setFontSize(size); };
      const setUIItalic = (size) => { doc.setFont("helvetica", "italic"); doc.setFontSize(size); };
      const setUINormal = (size) => { doc.setFont("helvetica", "normal"); doc.setFontSize(size); };

      // ── Tokeniseur syntaxique Python pour PDF ──
      // Retourne un tableau de segments { text, color } pour dessiner ligne par ligne
      const tokenizePythonLine = (line) => {
        const segments = [];
        // Patterns (ordre important : commentaires et chaînes d'abord)
        const PATTERNS = [
          { re: /#[^\n]*$/,                                                                         color: C.cmtColor,     italic: true },
          { re: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,               color: C.strColor },
          { re: /(@\w+)/,                                                                            color: C.decorColor },
          { re: /\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/, color: C.kwColor, bold: true },
          { re: /\b(print|len|range|int|float|str|list|dict|set|tuple|bool|type|input|open|enumerate|zip|map|filter|sorted|reversed|sum|min|max|abs|round|isinstance|issubclass|hasattr|getattr|setattr|callable|iter|next|repr|id|hash|hex|oct|bin|chr|ord|format|vars|dir|super|property|staticmethod|classmethod)\b/, color: C.builtinColor },
          { re: /\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/,                                                color: C.numColor },
        ];

        let remaining = line;
        let offset = 0;
        while (remaining.length > 0) {
          let earliest = null;
          let earliestIdx = Infinity;
          for (const pat of PATTERNS) {
            const m = remaining.match(pat.re);
            if (m && m.index < earliestIdx) {
              earliestIdx = m.index;
              earliest = { pat, m };
            }
          }
          if (!earliest) {
            segments.push({ text: remaining, color: C.codetext, bold: true });
            break;
          }
          if (earliest.m.index > 0) {
            segments.push({ text: remaining.slice(0, earliest.m.index), color: C.codetext, bold: true });
          }
          segments.push({ text: earliest.m[0], color: earliest.pat.color, bold: true, italic: earliest.pat.italic });
          remaining = remaining.slice(earliest.m.index + earliest.m[0].length);
        }
        return segments;
      };

      // ── Helper : dessiner une ligne de code colorée ──
      const drawCodeLine = (lineText, xStart, yPos, fontSize) => {
        const segs = tokenizePythonLine(lineText);
        let cx = xStart;
        for (const seg of segs) {
          if (!seg.text) continue;
          doc.setTextColor(...seg.color);
          if (seg.bold && seg.italic) doc.setFont("courier", "bolditalic");
          else if (seg.bold) doc.setFont("courier", "bold");
          else if (seg.italic) doc.setFont("courier", "italic");
          else doc.setFont("courier", "normal");
          doc.setFontSize(fontSize);
          // Calcule la largeur pour avancer cx
          const w = doc.getTextWidth(seg.text);
          doc.text(seg.text, cx, yPos);
          cx += w;
        }
      };

      // ── Helper : bordure latérale accent ──
      const accentLine = (yPos, height) => {
        doc.setFillColor(...C.accent);
        doc.rect(margin, yPos, 1.5, height, "F");
      };

      // ── Helper : nouvelle page ──
      const newPage = () => {
        addFooter();
        doc.addPage();
        y = margin + 16;
        addHeader();
      };

      // ── Helper : espace suffisant ──
      const ensureSpace = (needed) => {
        if (y + needed > pageH - margin - 14) newPage();
      };

      // ── En-tête de page (à partir de la page 2) ──
      let isFirstPage = true;
      const addHeader = () => {
        if (isFirstPage) { isFirstPage = false; return; }
        doc.setFillColor(...C.accentBg);
        doc.rect(0, 0, pageW, 13, "F");
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.3);
        doc.line(margin, 13, pageW - margin, 13);

        setMonoBold(8.5);
        doc.setTextColor(...C.accentDark);
        doc.text("PyExam Studio", margin, 9);
        setUINormal(7);
        doc.setTextColor(...C.faint);
        doc.text("— Rapport d'Évaluation Python", margin + 28, 9);

        setMonoBold(7.5);
        doc.setTextColor(...C.ink);
        doc.text(`${student.prenom} ${student.nom}  |  Apogée : ${student.apogee}`, pageW - margin, 9, { align: "right" });

        y = Math.max(y, 20);
      };

      // ── Pied de page ──
      const addFooter = () => {
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.3);
        doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
        setMonoNormal(6.5);
        doc.setTextColor(...C.faint);
        doc.text(`Réf. : ${submissionId}  •  Vérif. : ${verificationCode}`, margin, pageH - 7);
        setMonoBold(6.5);
        doc.setTextColor(...C.ink);
        doc.text(`Page ${pg} / {total_pages_count_string}`, pageW - margin, pageH - 7, { align: "right" });
      };

      // ════════════════════════════════════════════
      //  PAGE DE GARDE PROFESSIONNELLE
      // ════════════════════════════════════════════
      isFirstPage = true; // ne pas appeler addHeader sur la page 1

      // Bandeau supérieur coloré
      doc.setFillColor(...C.accentDark);
      doc.rect(0, 0, pageW, 38, "F");

      // Logo/titre dans le bandeau
      setMonoBold(22);
      doc.setTextColor(...C.white);
      doc.text("PyExam Studio", margin, 18);
      setUINormal(10);
      doc.setTextColor(186, 214, 255);
      doc.text("Plateforme d'Évaluation Python", margin, 27);
      doc.setFontSize(8);
      doc.setTextColor(147, 197, 253);
      doc.text(dateStr, margin, 34);

      y = 52;

      // Titre principal du rapport
      setMonoBold(17);
      doc.setTextColor(...C.accentDark);
      doc.text("Rapport de Soumission d'Examen", margin, y);
      doc.setDrawColor(...C.accent);
      doc.setLineWidth(0.8);
      doc.line(margin, y + 2, margin + 100, y + 2);
      y += 12;

      // ── Fiche étudiant ──
      const ficheH = 64;
      doc.setFillColor(...C.accentBg);
      doc.roundedRect(margin, y, contentW, ficheH, 4, 4, "F");
      doc.setDrawColor(...C.accent);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentW, ficheH, 4, 4, "S");
      // Barre titre de la fiche
      doc.setFillColor(...C.accent);
      doc.roundedRect(margin, y, contentW, 11, 4, 4, "F");
      doc.rect(margin, y + 7, contentW, 4, "F"); // coins inférieurs carrés
      setMonoBold(8);
      doc.setTextColor(...C.white);
      doc.text("INFORMATIONS DE L'ÉTUDIANT", margin + 6, y + 7.5);

      const leftItems = [
        ["Nom", student.nom],
        ["Prénom", student.prenom],
        ["Code Apogée", student.apogee],
      ];
      const rightItems = [
        ["Date", dateStr.split(",").slice(-1)[0]?.trim() || dateStr],
        ["Heure de soumission", timeStr],
        ["Temps utilisé", formatTime(timeSpent)],
      ];
      const halfW = contentW / 2 - 4;
      leftItems.forEach(([lbl, val], i) => {
        const ry = y + 17 + i * 14;
        setMonoNormal(7);
        doc.setTextColor(...C.faint);
        doc.text(lbl.toUpperCase(), margin + 8, ry);
        setMonoBold(9.5);
        doc.setTextColor(...C.muted);
        doc.text(String(val), margin + 8, ry + 5.5);
      });
      rightItems.forEach(([lbl, val], i) => {
        const ry = y + 17 + i * 14;
        const cx = margin + halfW + 10;
        setMonoNormal(7);
        doc.setTextColor(...C.faint);
        doc.text(lbl.toUpperCase(), cx, ry);
        setMonoBold(9.5);
        doc.setTextColor(...C.muted);
        doc.text(String(val), cx, ry + 5.5);
      });
      // Séparateur vertical
      doc.setDrawColor(...C.line);
      doc.setLineWidth(0.3);
      doc.line(margin + halfW + 4, y + 13, margin + halfW + 4, y + ficheH - 4);
      y += ficheH + 8;

      // ── Statistiques de soumission ──
      const statsH = 22;
      const statsW = (contentW - 8) / 3;
      const statsData = [
        { label: "Questions répondues", value: `${completedCount} / ${totalQuestions}`, icon: "✓" },
        { label: "Score de complétion", value: `${Math.round(completedCount / Math.max(totalQuestions, 1) * 100)} %`, icon: "%" },
        { label: "Statut", value: completedCount === totalQuestions ? "Complet" : "Partiel", icon: "●" },
      ];
      statsData.forEach((s, i) => {
        const sx = margin + i * (statsW + 4);
        const bgColor = i === 0 ? [240, 253, 244] : i === 1 ? [239, 246, 255] : completedCount === totalQuestions ? [240, 253, 244] : [255, 247, 237];
        const borderColor = i === 0 ? [134, 239, 172] : i === 1 ? [147, 197, 253] : completedCount === totalQuestions ? [134, 239, 172] : [252, 211, 77];
        doc.setFillColor(...bgColor);
        doc.roundedRect(sx, y, statsW, statsH, 3, 3, "F");
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(sx, y, statsW, statsH, 3, 3, "S");
        setMonoBold(14);
        doc.setTextColor(...C.accentDark);
        doc.text(s.value, sx + statsW / 2, y + 12, { align: "center" });
        setMonoNormal(6.5);
        doc.setTextColor(...C.faint);
        doc.text(s.label, sx + statsW / 2, y + 19, { align: "center" });
      });
      y += statsH + 10;

      // ── Identifiant de soumission ──
      const idH = 28;
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, y, contentW, idH, 4, 4, "F");
      setMonoBold(7);
      doc.setTextColor(148, 163, 184);
      doc.text("IDENTIFIANT DE SOUMISSION", margin + contentW / 2, y + 7, { align: "center" });
      setMonoBold(13);
      doc.setTextColor(226, 232, 240);
      doc.text(submissionId, margin + contentW / 2, y + 16, { align: "center" });
      setMonoNormal(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Code de vérification : ${verificationCode}`, margin + contentW / 2, y + 23, { align: "center" });
      y += idH + 8;

      // ── Note pédagogique sur le document ──
      setUIItalic(7.5);
      doc.setTextColor(...C.faint);
      const noteLines = doc.splitTextToSize(
        "Ce document est généré automatiquement à partir du notebook de l'étudiant. Il contient le code exact tel qu'il a été saisi, ainsi qu'une zone de notation pour chaque question.",
        contentW
      );
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 6;

      // ─ Séparateur ─
      doc.setDrawColor(...C.line);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      // Footer de la page de garde
      addFooter();

      // ════════════════════════════════════════════
      //  PAGES DES QUESTIONS
      // ════════════════════════════════════════════
      doc.addPage();
      isFirstPage = false;
      y = 20;
      addHeader();

      // ── Helper : dessiner un bloc de code complet (sans troncature) ──
      const drawCodeBlock = (codeText, label) => {
        const codeLines = codeText.split("\n");
        const codeFontSize = 7.5;
        const lineH = 4.7;
        const paddingTop = 9;
        const paddingBottom = 5;
        const paddingLeft = 12;
        const lineNumW = 10;
        const totalCodeH = codeLines.length * lineH + paddingTop + paddingBottom;

        // Dessine le bloc page par page si nécessaire
        let linesDrawn = 0;
        let isFirstChunk = true;

        while (linesDrawn < codeLines.length) {
          const availH = pageH - margin - 14 - y;
          const linesInChunk = Math.max(1, Math.floor((availH - paddingTop - paddingBottom) / lineH));
          const chunkLines = codeLines.slice(linesDrawn, linesDrawn + linesInChunk);
          const chunkH = chunkLines.length * lineH + paddingTop + paddingBottom;

          // S'il ne reste presque plus de place, passer à la page suivante
          if (availH < lineH * 2 + paddingTop + paddingBottom) {
            newPage();
            continue;
          }

          // Wrapper extérieur (#F9FAFB) avec bordure grise fine, style carte moderne
          doc.setFillColor(...C.codeOuterBg);
          doc.roundedRect(margin, y, contentW, chunkH + 4, 4, 4, "F");
          doc.setDrawColor(...C.codeline);
          doc.setLineWidth(0.5);
          doc.roundedRect(margin, y, contentW, chunkH + 4, 4, 4, "S");

          // Fond gris clair du bloc code intérieur (style ChatGPT, léger padding autour)
          const innerX = margin + 2;
          const innerW = contentW - 4;
          doc.setFillColor(...C.codebg);
          doc.roundedRect(innerX, y + 2, innerW, chunkH, 3, 3, "F");

          // Colonne des numéros de ligne (gris légèrement plus soutenu que le fond du code)
          doc.setFillColor(236, 237, 240);
          doc.roundedRect(innerX, y + 2, lineNumW + 4, chunkH, 3, 3, "F");
          doc.rect(innerX + lineNumW + 1, y + 2, 3, chunkH, "F");

          // Étiquette « Python » dans le coin supérieur droit si première portion
          if (isFirstChunk) {
            doc.setFillColor(...C.accent);
            doc.roundedRect(innerX + innerW - 26, y + 4.5, 22, 5.5, 1, 1, "F");
            setMonoBold(5.5);
            doc.setTextColor(...C.white);
            doc.text("Python", innerX + innerW - 22, y + 8.5);
            isFirstChunk = false;
          }

          // Dessin de chaque ligne
          chunkLines.forEach((ln, li) => {
            const lineIndex = linesDrawn + li;
            const ly = y + 2 + paddingTop + li * lineH;
            // Numéro de ligne
            setMonoNormal(6);
            doc.setTextColor(...C.linenum);
            doc.text(String(lineIndex + 1).padStart(3), innerX + 1, ly);
            // Contenu coloré
            drawCodeLine(ln, innerX + lineNumW + 5, ly, codeFontSize);
          });

          y += chunkH + 4 + 3;
          linesDrawn += chunkLines.length;

          if (linesDrawn < codeLines.length) {
            newPage();
          }
        }
      };

      // ── Helper : zone de notation ──
      const drawGradingZone = (maxPoints) => {
        const zoneH = 32;
        ensureSpace(zoneH + 6);
        doc.setFillColor(...C.bgNotation);
        doc.roundedRect(margin, y, contentW, zoneH, 3, 3, "F");
        doc.setDrawColor(...C.lineNotation);
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, y, contentW, zoneH, 3, 3, "S");

        // Barre titre zone notation
        doc.setFillColor(...C.success);
        doc.roundedRect(margin, y, contentW, 8, 3, 3, "F");
        doc.rect(margin, y + 5, contentW, 3, "F");
        setMonoBold(6.5);
        doc.setTextColor(...C.white);
        doc.text("ZONE DE NOTATION", margin + 5, y + 5.5);

        // Ligne Note
        setMonoBold(10);
        doc.setTextColor(...C.success);
        doc.text("Note :", margin + 6, y + 17);
        // Trait de saisie
        doc.setDrawColor(21, 128, 61);
        doc.setLineWidth(0.5);
        doc.line(margin + 26, y + 17.5, margin + 60, y + 17.5);
        setMonoNormal(9);
        doc.setTextColor(...C.ink);
        doc.text(`/ ${maxPoints || 20}`, margin + 62, y + 17);

        // Ligne Commentaires
        setMonoBold(8.5);
        doc.setTextColor(...C.warn);
        doc.text("Commentaires :", margin + 6, y + 26);
        doc.setDrawColor(...C.faint);
        doc.setLineWidth(0.3);
        doc.line(margin + 44, y + 26.5, margin + contentW - 6, y + 26.5);

        y += zoneH + 8;
      };

      // ── Rendu des questions ──
      let globalQNum = 0;

      if (hasExercises) {
        exercises.forEach((ex, ei) => {
          // ── Titre de l'exercice ──
          ensureSpace(22);
          doc.setFillColor(...C.accentBg);
          doc.roundedRect(margin, y, contentW, 14, 3, 3, "F");
          doc.setFillColor(...C.accent);
          doc.roundedRect(margin, y, 4, 14, 3, 3, "F");
          doc.rect(margin + 2, y, 2, 14, "F"); // coin droit du trait carré

          setMonoBold(11);
          doc.setTextColor(...C.accentDark);
          doc.text(`Exercice ${ei + 1}`, margin + 10, y + 9.5);
          setUINormal(9.5);
          doc.setTextColor(...C.ink);
          const exTitle = stripLatex(ex.title || "");
          if (exTitle) doc.text(exTitle, margin + 48, y + 9.5);

          y += 18;

          ex.questions.forEach((q, qi) => {
            globalQNum++;
            const code = answers[q.id] || "";

            // ── 1. Titre de la question ──
            ensureSpace(20);
            setMonoBold(11);
            doc.setTextColor(...C.accent);
            doc.text(`Question ${globalQNum}`, margin, y);
            doc.setDrawColor(...C.accent);
            doc.setLineWidth(0.5);
            doc.line(margin, y + 2, margin + contentW, y + 2);
            y += 9;

            // ── 2. Énoncé complet de la question ──
            const stmtFull = stripLatex(q.statement || "");
            if (stmtFull) {
              const stmtLines = doc.splitTextToSize(stmtFull, contentW - 14);
              const stmtBlockH = stmtLines.length * 5.2 + 10;
              ensureSpace(stmtBlockH + 4);
              doc.setFillColor(...C.codeOuterBg);
              doc.roundedRect(margin, y, contentW, stmtBlockH, 2, 2, "F");
              doc.setDrawColor(...C.line);
              doc.setLineWidth(0.2);
              doc.roundedRect(margin, y, contentW, stmtBlockH, 2, 2, "S");
              // Bordure gauche bleue
              doc.setFillColor(...C.accent);
              doc.rect(margin, y, 2.5, stmtBlockH, "F");
              setUIItalic(8.5);
              doc.setTextColor(55, 65, 81);
              doc.text(stmtLines, margin + 7, y + 7);
              y += stmtBlockH + 6;
            }

            // ── 3. Réponse de l'étudiant (code) ──
            ensureSpace(12);
            setMonoBold(8.5);
            doc.setTextColor(...C.accentDark);
            doc.text("Réponse de l'étudiant :", margin, y);
            y += 6;

            const codeToShow = code.trim() ? code : (q.initialCode ?? "# Votre code Python ici\n");
            drawCodeBlock(codeToShow);

            // ── 4. Zone de notation ──
            drawGradingZone(q.points || 20);

            // Espacement entre questions
            y += 4;
          });

          // Espace entre exercices
          y += 4;
        });

      } else {
        // Format legacy : questions plates
        (legacyQuestions ?? []).forEach((q, qi) => {
          const cells = answers[q.id] || [];
          globalQNum++;

          // ── 1. Titre de la question ──
          ensureSpace(20);
          setMonoBold(11);
          doc.setTextColor(...C.accent);
          doc.text(`Question ${q.ordre || globalQNum}`, margin, y);
          setUINormal(9.5);
          doc.setTextColor(...C.ink);
          const qtitle = stripLatex(q.titre || "");
          if (qtitle) doc.text(` — ${qtitle}`, margin + 46, y);
          doc.setDrawColor(...C.accent);
          doc.setLineWidth(0.5);
          doc.line(margin, y + 2, margin + contentW, y + 2);
          y += 9;

          // ── 2. Énoncé complet ──
          const eonceText = stripLatex(q.enonce || "");
          if (eonceText) {
            const stmtLines = doc.splitTextToSize(eonceText, contentW - 14);
            const stmtBlockH = stmtLines.length * 5.2 + 10;
            ensureSpace(stmtBlockH + 4);
            doc.setFillColor(...C.codeOuterBg);
            doc.roundedRect(margin, y, contentW, stmtBlockH, 2, 2, "F");
            doc.setDrawColor(...C.line);
            doc.setLineWidth(0.2);
            doc.roundedRect(margin, y, contentW, stmtBlockH, 2, 2, "S");
            // Bordure gauche bleue
            doc.setFillColor(...C.accent);
            doc.rect(margin, y, 2.5, stmtBlockH, "F");
            setUIItalic(8.5);
            doc.setTextColor(55, 65, 81);
            doc.text(stmtLines, margin + 7, y + 7);
            y += stmtBlockH + 6;
          }

          // ── 3. Cellules de code ──
          ensureSpace(12);
          setMonoBold(8.5);
          doc.setTextColor(...C.accentDark);
          doc.text("Réponse de l'étudiant :", margin, y);
          y += 6;

          if (cells.length === 0) {
            ensureSpace(14);
            setUIItalic(8.5);
            doc.setTextColor(...C.faint);
            doc.text("Aucune réponse soumise.", margin + 4, y + 5);
            y += 12;
          } else {
            cells.forEach((cell, ci) => {
              if (cells.length > 1) {
                ensureSpace(10);
                setMonoBold(7.5);
                doc.setTextColor(...C.accentDark);
                doc.text(`Cellule ${ci + 1}${cell.question ? ` — ${stripLatex(cell.question).slice(0, 60)}` : ""}`, margin, y);
                y += 5;
              }
              drawCodeBlock(cell.content || "");
              // Sortie d'exécution
              if (cell.output) {
                const outLines = cell.output.split("\n").slice(0, 12);
                const outH = outLines.length * 4 + 10;
                ensureSpace(outH + 4);
                doc.setFillColor(240, 253, 244);
                doc.roundedRect(margin, y, contentW, outH, 2, 2, "F");
                doc.setDrawColor(134, 239, 172);
                doc.setLineWidth(0.25);
                doc.roundedRect(margin, y, contentW, outH, 2, 2, "S");
                setMonoBold(6.5);
                doc.setTextColor(...C.success);
                doc.text("▶ Sortie :", margin + 4, y + 6);
                setMonoNormal(7);
                doc.setTextColor(30, 41, 59);
                outLines.forEach((ln, li) => {
                  doc.text(ln.slice(0, 110), margin + 4, y + 10 + li * 4);
                });
                y += outH + 4;
              }
            });
          }

          // ── 4. Zone de notation ──
          drawGradingZone(20);

          y += 4;
        });
      }

      // ════════════════════════════════════════════
      //  SIGNATURE FINALE
      // ════════════════════════════════════════════
      ensureSpace(52);
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, y, contentW, 46, 4, 4, "F");
      setMonoBold(8);
      doc.setTextColor(148, 163, 184);
      doc.text("SIGNATURE NUMÉRIQUE DE LA SOUMISSION", margin + contentW / 2, y + 9, { align: "center" });
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.3);
      doc.line(margin + 20, y + 12, margin + contentW - 20, y + 12);
      setMonoBold(13);
      doc.setTextColor(226, 232, 240);
      doc.text(submissionId, margin + contentW / 2, y + 24, { align: "center" });
      setMonoNormal(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Code de vérification : ${verificationCode}`, margin + contentW / 2, y + 32, { align: "center" });
      setUINormal(7.5);
      doc.text(`Généré le ${dateStr} à ${timeStr}`, margin + contentW / 2, y + 38, { align: "center" });
      doc.setTextColor(71, 85, 105);
      doc.text("Ce document constitue la preuve officielle de soumission de l'étudiant.", margin + contentW / 2, y + 44, { align: "center" });
      y += 52;

      // Finalisation
      addFooter();
      if (typeof doc.putTotalPages === "function") {
        doc.putTotalPages("{total_pages_count_string}");
      }

      // Nom de fichier unique : apogée + nom (nettoyé) + timestamp
      const ts = now.current.getTime();
      const filename = `rapport_test_${sanitizeForFilename(student.apogee)}_${sanitizeForFilename(student.nom)}_${ts}.pdf`;

      // ── Enregistrement automatique et sécurisé dans Supabase Storage ──
      // Le PDF n'est jamais proposé au téléchargement local : il est
      // uniquement envoyé vers le bucket distant "TpEval".
      const pdfBlob = doc.output("blob");
      pdfBlobRef.current = pdfBlob;      // gardé en mémoire pour le bouton "Télécharger le rapport"
      pdfFilenameRef.current = filename;
      setPdfReady(true);                 // le téléchargement est possible dès maintenant, sans attendre l'envoi au serveur
      await uploadPdfToSupabase(pdfBlob, filename);

      if (submissionRef.current) {
        submissionRef.current.pdfDownloaded = true; // conservé pour compat. avec le panneau admin
        submissionRef.current.pdfFilename = filename;
        submissionRef.current.pdfStoragePath = `${SUPABASE_PDF_BUCKET}/${filename}`;
        saveSubmission(submissionRef.current);
      }

      setPdfState("done");
      toast("Votre rapport PDF a été généré et enregistré en toute sécurité.", "success");
    } catch (err) {
      console.error("PDF generation error:", err);
      setPdfState("error");
      toast("Erreur lors de l'enregistrement du PDF : " + err.message, "error");
    }
  };

  // ── Déclenchement automatique : génération + envoi dès que la
  //    soumission est prête (fin du test). Aucune action de l'étudiant
  //    n'est requise, et aucun téléchargement local n'est proposé.
  useEffect(() => {
    if (submissionId && verificationCode && pdfState === "idle") {
      generatePDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, verificationCode]);

  const printReport = () => window.print();

  // Déclenche le téléchargement local du PDF déjà généré (aucune régénération,
  // aucun appel réseau supplémentaire : réutilise simplement le blob en mémoire).
  const downloadReport = () => {
    if (!pdfBlobRef.current) {
      toast("Le PDF est en cours de préparation, veuillez patienter…", "info");
      return;
    }
    const url = URL.createObjectURL(pdfBlobRef.current);
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfFilenameRef.current || `rapport_${submissionId || "examen"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Ouvre le widget de dépôt Mega et télécharge le PDF en même temps,
  // pour que l'utilisateur puisse le glisser-déposer dans la zone Mega.
  const openMegaDeposit = () => {
    if (!pdfBlobRef.current) {
      toast("Le PDF est en cours de préparation, veuillez patienter…", "info");
      return;
    }
    downloadReport();
    setShowMegaModal(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-root)",
        overflow: "auto",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* En-tête rapport */}
        <div
          className="glass-card fade-in"
          style={{ padding: "32px 36px", marginBottom: 24, textAlign: "center" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            Examen soumis avec succès
          </h1>
          <p style={{ color: "var(--text-sec)" }}>
            Votre travail a été enregistré et verrouillé.
          </p>

          <div className="sep" />

          {/* Bloc identifiant de soumission */}
          {submissionId && (
            <div
              style={{
                background: "rgba(56,139,253,.08)",
                border: "1px solid rgba(56,139,253,.3)",
                borderRadius: "var(--radius)",
                padding: "14px 20px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
                🔐 Identifiant de soumission
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--text-pri)", letterSpacing: "2px" }}>
                {submissionId}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Code de vérification : <strong style={{ color: "var(--text-sec)", fontFamily: "var(--font-mono)" }}>{verificationCode}</strong>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Conservez cet identifiant — il permet de vérifier l'authenticité de votre PDF.
              </div>
            </div>
          )}

          {/* Statut d'enregistrement automatique du PDF (aucun bouton de téléchargement) */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <span
              className="badge"
              style={{
                fontSize: 13,
                padding: "10px 20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color:
                  pdfState === "error"
                    ? "var(--danger)"
                    : pdfState === "done"
                    ? "var(--success)"
                    : "var(--text-sec)",
              }}
            >
              {pdfState === "loading" && <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>}
              {(pdfState === "idle" || pdfState === "loading") && "📄 Enregistrement sécurisé du PDF en cours…"}
              {pdfState === "done" && "✅ PDF enregistré en toute sécurité"}
              {pdfState === "error" && "❌ Erreur lors de l'enregistrement du PDF"}
            </span>
          </div>

          {pdfState === "done" && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 16px",
                background: "rgba(63,185,80,.08)",
                border: "1px solid rgba(63,185,80,.3)",
                borderRadius: "var(--radius)",
                fontSize: 13,
                color: "var(--success)",
              }}
            >
              ✅ Votre PDF académique a été généré et enregistré automatiquement sur le serveur. Votre soumission est enregistrée sous l'identifiant <strong style={{ fontFamily: "var(--font-mono)" }}>{submissionId}</strong>.
            </div>
          )}

          {pdfState === "error" && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 16px",
                background: "rgba(248,81,73,.08)",
                border: "1px solid rgba(248,81,73,.3)",
                borderRadius: "var(--radius)",
                fontSize: 13,
                color: "var(--danger)",
              }}
            >
              ⚠️ Le PDF n'a pas pu être enregistré automatiquement. Votre soumission reste néanmoins conservée sous l'identifiant <strong style={{ fontFamily: "var(--font-mono)" }}>{submissionId}</strong>. Merci de contacter l'enseignant.
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, marginBottom: 32 }}>
          <button className="btn btn-ghost" onClick={printReport}>🖨 Imprimer le rapport</button>
          <button
            className="btn btn-ghost"
            onClick={downloadReport}
            disabled={!pdfReady}
            title={!pdfReady ? "Le rapport est en cours de génération…" : "Télécharger le rapport PDF"}
          >
            {pdfReady ? "⬇️ Télécharger le rapport PDF" : "⏳ Génération du rapport…"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={openMegaDeposit}
            disabled={!pdfReady}
            title={!pdfReady ? "Le rapport est en cours de génération…" : "Déposer le PDF sur Mega"}
          >
            ☁️ Déposer sur Mega
          </button>
          <button className="btn btn-ghost" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={onLogout}>🔒 Quitter l'examen</button>
        </div>
      </div>

      {/* Fenêtre de dépôt Mega : le PDF a déjà été téléchargé,
          l'utilisateur n'a qu'à le glisser dans la zone ci-dessous. */}
      {showMegaModal && (
        <div
          onClick={() => setShowMegaModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 28, maxWidth: 380, width: "100%", textAlign: "center" }}
          >
            <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>☁️ Déposer sur Mega</h3>
            <p style={{ color: "var(--text-sec)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Le PDF vient d'être téléchargé sur votre ordinateur. Glissez-le dans la zone ci-dessous pour le déposer sur Mega.
            </p>
            <iframe
              width="250"
              height="54"
              frameBorder="0"
              src="https://mega.nz/filerequest#!ETeo5ajhUeA!l!fr"
              style={{ margin: "0 auto", display: "block" }}
              title="Dépôt de fichier Mega"
            />
            <button
              className="btn btn-ghost"
              style={{ marginTop: 20 }}
              onClick={() => setShowMegaModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
//  COMPOSANT RACINE : APP
// ─────────────────────────────────────────────

export default function App() {
  // Injection des styles globaux une seule fois
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // ── Thème clair / sombre (préférence d'affichage uniquement, aucun impact sur la logique) ──
  const [theme, setTheme] = useState(() => lsGet(STORAGE_KEYS.THEME, "dark"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    lsSet(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Préchargement de KaTeX au démarrage
  useEffect(() => {
    loadKaTeX().catch(() => {});
  }, []);

  // Initialisation des données par défaut si première visite
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS))
      lsSet(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS))
      lsSet(STORAGE_KEYS.QUESTIONS, DEFAULT_QUESTIONS);
    if (!localStorage.getItem(STORAGE_KEYS.NOTEBOOKS))
      lsSet(STORAGE_KEYS.NOTEBOOKS, DEFAULT_NOTEBOOKS);
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISES))
      lsSet(STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES);
  }, []);

  const [session, setSession] = useState(() => lsGet(STORAGE_KEYS.SESSION, null));

  const loginStudent = (student) => {
    const s = { type: "student", student };
    setSession(s);
    lsSet(STORAGE_KEYS.SESSION, s);
  };

  const loginAdmin = () => {
    const s = { type: "admin" };
    setSession(s);
    lsSet(STORAGE_KEYS.SESSION, s);
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    toast("Déconnecté", "info");
  };

  return (
    <ToastProvider>
      <button
        type="button"
        className="theme-toggle-btn theme-toggle-fab"
        onClick={toggleTheme}
        title={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
        aria-label="Changer de thème"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      {!session && (
        <LoginPage onStudentLogin={loginStudent} onAdminLogin={loginAdmin} />
      )}
      {session?.type === "admin" && <AdminDashboard onLogout={logout} />}
      {session?.type === "student" && (
        <StudentExam student={session.student} onLogout={logout} />
      )}
    </ToastProvider>
  );
}

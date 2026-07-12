/**
 * ============================================================
 *  Data.js — Données pédagogiques de PyExam Studio
 *  Contient : étudiants par défaut, notebooks, exercices et
 *  questions (avec structure pédagogique enrichie).
 *
 *  Ce fichier centralise toutes les données afin de faciliter
 *  la maintenance et la personnalisation de l'examen, sans
 *  toucher à la logique applicative dans App.jsx.
 * ============================================================
 */

export const DEFAULT_STUDENTS = [
  { id: "1", nom: "El Amrani", prenom: "Sara", apogee: "20210001" },
  { id: "2", nom: "Benali", prenom: "Youssef", apogee: "20210002" },
  { id: "3", nom: "Idrissi", prenom: "Fatima", apogee: "20210003" },
  { id: "4", nom: "Benalii", prenom: "Youssef", apogee: "20210009" },
  { id: "5", nom: "Idrissii", prenom: "Fatima", apogee: "20210008" },
];

export const DEFAULT_NOTEBOOKS = [
  {
    id: "nb1",
    titre: "Gradient Descent",
    description: "Implémentation de la descente de gradient",
    cells: [
      {
        id: "c1",
        question:
          "Implémentez la fonction objectif $f(x) = x^2$ que l'on souhaite minimiser.",
        content:
          "import numpy as np\n\n# Fonction objectif : f(x) = x^2\ndef f(x):\n    return x ** 2\n",
      },
      {
        id: "c2",
        question:
          "Implémentez le gradient $\\nabla f(x) = 2x$ de la fonction $f$.",
        content: "# Dérivée de f\ndef df(x):\n    return 2 * x\n",
      },
    ],
  },
  {
    id: "nb2",
    titre: "Newton Raphson",
    description: "Méthode de Newton-Raphson",
    cells: [
      {
        id: "c3",
        question:
          "Implémentez la méthode de Newton-Raphson avec la mise à jour $x_{k+1} = x_k - \\frac{f(x_k)}{f'(x_k)}$.",
        content:
          "import numpy as np\n\n# Méthode de Newton-Raphson\ndef newton(f, df, x0, tol=1e-6, max_iter=100):\n    x = x0\n    for i in range(max_iter):\n        fx = f(x)\n        if abs(fx) < tol:\n            return x, i\n        x = x - fx / df(x)\n    return x, max_iter\n",
      },
    ],
  },
];

// ─────────────────────────────────────────────
//  STRUCTURE HIÉRARCHIQUE : EXERCICES → QUESTIONS
//  Chaque exercice contient plusieurs questions indépendantes.
//  Chaque question possède son propre éditeur, état et historique.
// ─────────────────────────────────────────────

/**
 * DEFAULT_EXERCISES — données pédagogiques centralisées.
 * Structure : exercice → questions → initialCode
 * Modifiez ce tableau pour personnaliser l'examen.
 */
export const DEFAULT_EXERCISES = [
  {
    id: "ex1",
    title: "SymPy : Calcul Symbolique",
    description:
      "Cet exercice porte sur les bases du calcul symbolique avec SymPy : déclaration de variables réelles, simplification, factorisation, résolution d'équations, substitution et calcul de gradient.",
    questions: [
      {
        id: "ex1q1",
        statement:
          "En utilisant SymPy, déclarez `x` comme une variable symbolique **réelle** à l'aide de `symbols()`, puis utilisez la fonction `simplify()` pour simplifier l'expression $\\dfrac{x^2-1}{x-1}$.",
        initialCode:
          "from sympy import symbols, simplify\n\n# Déclarez x comme une variable symbolique réelle (real=True)\n# Votre code ici\n\nexpr = (x**2 - 1) / (x - 1)\n\n# Simplifiez expr à l'aide de simplify()\nresultat = ______\n\nprint(resultat)\n",
      },
      {
        id: "ex1q2",
        statement:
          "On exécute le code suivant avec SymPy :\n\n```python\nfrom sympy import symbols, factor\nx = symbols('x')\nexpr = x**2 - 9\nresult = factor(expr)\nprint(result)\n```\n\nQuelle est la sortie affichée par ce programme ?\n\nA. `x**2 - 9`\nB. `(x - 3)*(x + 3)`\nC. `(x - 9)*(x + 1)`\nD. `x*(x - 9)`\n\nÉcrivez la lettre correspondant à la bonne réponse.",
        initialCode:
          "# Question à choix multiple\n# Écrivez la lettre de la bonne réponse (A, B, C ou D) entre guillemets\n\nreponse = \"\"\n",
      },
      {
        id: "ex1q3",
        statement:
          "Soit $f(x) = x^2 - 4$. On souhaite d'abord trouver les racines de $f(x) = 0$ avec `solve()`, puis vérifier avec `subs()` que la première racine trouvée annule bien $f$. Complétez le code ci-dessous.",
        initialCode:
          "from sympy import symbols, solve\n\nx = symbols('x', real=True)\nf = x**2 - 4\n\n# Trouvez les racines de f avec solve()\nracines = ______\n\n# Substituez la première racine dans f pour vérifier qu'elle l'annule\nverification = f.subs(x, ______)\n\nprint(racines, verification)\n",
      },
      {
        id: "ex1q4",
        statement:
          "On souhaite développer l'expression $(x + 3)^2 - x$ avec SymPy. Complétez le code ci-dessous à l'aide de la fonction `expand()`.",
        initialCode:
          "from sympy import symbols, expand\n\nx = symbols('x')\nexpr = (x + 3)**2 - x\n\n# Développez expr à l'aide de expand()\nresultat = ______\n\nprint(resultat)\n",
      },
      {
        id: "ex1q5",
        statement:
          "Soit $f(x, y) = x^2y + 3xy^2$. Calculez le gradient $\\nabla f = \\left(\\dfrac{\\partial f}{\\partial x}, \\dfrac{\\partial f}{\\partial y}\\right)$ avec `diff()`, puis évaluez ce gradient au point $(x, y) = (1, 2)$ à l'aide de `subs()`.",
        initialCode:
          "from sympy import symbols, diff\n\nx, y = symbols('x y', real=True)\nf = x**2*y + 3*x*y**2\n\n# Calculez les dérivées partielles df/dx et df/dy\ndfx = ______\ndfy = ______\n\n# Évaluez le gradient au point (1, 2)\ngrad_point = (dfx.subs({x: 1, y: 2}), dfy.subs({x: 1, y: 2}))\n\nprint(grad_point)\n",
      },
    ],
  },
  {
    id: "ex2",
    title: "Algorithme de Dichotomie",
    description:
      "Complétion de l'algorithme de dichotomie (bissection) pour trouver une racine d'une fonction continue sur un intervalle donné, puis application numérique sur un exemple simple.",
    questions: [
      {
        id: "ex2q1",
        statement:
          "Complétez l'algorithme de dichotomie ci-dessous, qui recherche une racine de `f` sur $[a, b]$ en s'arrêtant lorsque la largeur de l'intervalle est inférieure à `eps`.",
        initialCode:
          "def dichotomie(f, a, b, eps):\n    while ______:\n        m = ______\n        if f(a) * f(m) <= 0:\n            b = ______\n        else:\n            a = ______\n    return (a + b) / 2\n",
      },
      {
        id: "ex2q2",
        statement:
          "Complétez la fonction `critere_arret` ci-dessous, qui renvoie `True` tant que l'on doit continuer les itérations, c'est-à-dire tant que la largeur de l'intervalle $[a, b]$ dépasse la tolérance `eps`.",
        initialCode:
          "def critere_arret(a, b, eps):\n    # Renvoyez True tant que (b - a) dépasse eps\n    return ______\n",
      },
      {
        id: "ex2q3",
        statement:
          "On souhaite réécrire la dichotomie avec un nombre fixe d'itérations `n_iter`, à l'aide d'une boucle `for` plutôt que d'une boucle `while`. Complétez le code ci-dessous.",
        initialCode:
          "def dichotomie_for(f, a, b, n_iter):\n    for i in range(______):\n        m = (a + b) / 2\n        if f(a) * f(m) <= 0:\n            b = m\n        else:\n            ______\n    return (a + b) / 2\n",
      },
      {
        id: "ex2q4",
        statement:
          "**Exercice d'application.** Soit $f(x) = x^2 - 2$ et l'intervalle de départ $[a, b] = [1, 2]$, avec $f(1) = -1$ et $f(2) = 2$ (signes opposés). On effectue **une seule itération** de la méthode de dichotomie. Calculez le milieu `m`, puis complétez la mise à jour de l'intervalle $[a, b]$ pour l'itération suivante.",
        initialCode:
          "def f(x):\n    return x**2 - 2\n\na, b = 1, 2\n\n# Calculez le milieu m de l'intervalle [a, b]\nm = ______\n\n# f(a) = -1. Complétez la mise à jour de l'intervalle\n# selon le signe de f(a) * f(m)\nif f(a) * f(m) <= 0:\n    b = ______\nelse:\n    a = ______\n\nprint(a, b)\n",
      },
    ],
  },
  {
    id: "ex3",
    title: "Méthode de la Section Dorée",
    description:
      "Complétion de l'algorithme de la section dorée (golden section search), qui recherche le minimum d'une fonction unimodale sans calculer sa dérivée.",
    questions: [
      {
        id: "ex3q1",
        statement:
          "Complétez l'algorithme de la section dorée ci-dessous : le calcul du nombre d'or `phi`, et la mise à jour du point intérieur `c` (dans la branche `if`) et du point intérieur `d` (dans la branche `else`).",
        initialCode:
          "import math\n\ndef section_doree(f, a, b, eps):\n    phi = ______\n    c = b - phi * (b - a)\n    d = a + phi * (b - a)\n    fc, fd = f(c), f(d)\n\n    while (b - a) > eps:\n        if fc < fd:\n            b = d\n            d = c\n            fd = fc\n            c = ______\n            fc = f(c)\n        else:\n            a = c\n            c = d\n            fc = fd\n            d = ______\n            fd = f(d)\n    return (a + b) / 2\n",
      },
      {
        id: "ex3q2",
        statement:
          "On souhaite exécuter la section dorée avec un nombre fixe d'itérations `n_iter` (boucle `for`) plutôt qu'un critère de tolérance. Complétez le code ci-dessous.",
        initialCode:
          "import math\n\ndef section_doree_for(f, a, b, n_iter):\n    phi = (math.sqrt(5) - 1) / 2\n    c = b - phi * (b - a)\n    d = a + phi * (b - a)\n    fc, fd = f(c), f(d)\n\n    for i in range(______):\n        if fc < fd:\n            b = d\n            d = c\n            fd = fc\n            c = b - phi * (b - a)\n            fc = f(c)\n        else:\n            a = c\n            c = d\n            fc = fd\n            d = ______\n            fd = f(d)\n    return (a + b) / 2\n",
      },
    ],
  },
  {
    id: "ex4",
    title: "Gradient à Pas Fixe",
    description:
      "Implémentation de la descente de gradient avec un pas (taux d'apprentissage) fixé à l'avance et constant à chaque itération.",
    questions: [
      {
        id: "ex4q1",
        statement:
          "Complétez la fonction `gradient_pas_fixe` ci-dessous : la condition d'arrêt (norme du gradient supérieure à `eps`) et la mise à jour de `x` selon $x_{k+1} = x_k - \\alpha \\nabla f(x_k)$.",
        initialCode:
          "import numpy as np\n\ndef gradient_pas_fixe(grad, x0, alpha, eps):\n    x = x0\n    g = grad(x)\n    while ______:\n        x = ______\n        g = grad(x)\n    return x\n",
      },
      {
        id: "ex4q2",
        statement:
          "Un pas `alpha` trop petit ralentit fortement la convergence de l'algorithme, au point de nécessiter un très grand nombre d'itérations. Pour éviter que la boucle ne tourne indéfiniment dans ce cas, on ajoute un nombre maximal d'itérations `max_iter`. Complétez le code ci-dessous.",
        initialCode:
          "import numpy as np\n\ndef gradient_pas_fixe_securise(grad, x0, alpha, eps, max_iter):\n    x = x0\n    g = grad(x)\n    iterations = 0\n    while np.linalg.norm(g) > eps and ______:\n        x = x - alpha * g\n        g = grad(x)\n        iterations = ______\n    return x, iterations\n",
      },
    ],
  },
  {
    id: "ex5",
    title: "Gradient à Pas Optimal",
    description:
      "Descente de gradient dans laquelle le pas est recalculé à chaque itération afin de minimiser la fonction le long de la direction de descente.",
    questions: [
      {
        id: "ex5q1",
        statement:
          "Pour $f(x) = x^2$, on définit $\\phi(\\alpha) = f(x_k - \\alpha \\nabla f(x_k))$. Complétez le code ci-dessous pour trouver le pas optimal $\\alpha^*$ qui minimise $\\phi$, à l'aide de `scipy.optimize.minimize_scalar`.",
        initialCode:
          "from scipy.optimize import minimize_scalar\n\ndef f(x):\n    return x**2\n\ndef grad(x):\n    return 2*x\n\nx_k = 4\ng_k = grad(x_k)\n\ndef phi(alpha):\n    return f(x_k - alpha * g_k)\n\n# Trouvez alpha* qui minimise phi(alpha)\nalpha_star = ______\n\nx_next = x_k - alpha_star * g_k\nprint(x_next)\n",
      },
    ],
  },
  {
    id: "ex6",
    title: "Gradient Conjugué",
    description:
      "Implémentation de la méthode du gradient conjugué, qui construit à chaque itération une direction de recherche combinant le gradient courant et la direction précédente.",
    questions: [
      {
        id: "ex6q1",
        statement:
          "Complétez la boucle principale de l'algorithme du gradient conjugué ci-dessous : le résidu mis à jour `r_new`, le coefficient `beta`, et la nouvelle direction de recherche `d`.",
        initialCode:
          "import numpy as np\n\ndef gradient_conjugue(A, b, x0, eps):\n    x = x0\n    r = b - A @ x\n    d = r\n    while np.linalg.norm(r) > eps:\n        alpha = (r @ r) / (d @ (A @ d))\n        x = x + alpha * d\n        r_new = ______\n        beta = ______\n        d = ______\n        r = r_new\n    return x\n",
      },
      {
        id: "ex6q2",
        statement:
          "Contrairement aux itérations suivantes, la toute première direction de recherche du gradient conjugué ne comporte pas de terme correctif $\\beta_k d_{k-1}$ : elle est égale au résidu initial (direction de plus forte descente). Complétez l'initialisation ci-dessous.",
        initialCode:
          "import numpy as np\n\ndef gradient_conjugue(A, b, x0, eps):\n    x = x0\n    r = ______\n    d = ______\n    while np.linalg.norm(r) > eps:\n        alpha = (r @ r) / (d @ (A @ d))\n        x = x + alpha * d\n        r_new = r - alpha * (A @ d)\n        beta = (r_new @ r_new) / (r @ r)\n        d = r_new + beta * d\n        r = r_new\n    return x\n",
      },
    ],
  },
  {
    id: "ex7",
    title: "Méthode de Newton",
    description:
      "Implémentation de la méthode de Newton pour l'optimisation, utilisant à la fois le gradient et la matrice Hessienne d'une fonction.",
    questions: [
      {
        id: "ex7q1",
        statement:
          "Complétez la fonction `newton_optim` ci-dessous, qui applique la mise à jour $x_{k+1} = x_k - H^{-1}\\nabla f(x_k)$, où `H` est la Hessienne évaluée en $x_k$.",
        initialCode:
          "import numpy as np\n\ndef newton_optim(grad, hess, x0, eps):\n    x = x0\n    g = grad(x)\n    while np.linalg.norm(g) > eps:\n        H = hess(x)\n        p = ______\n        x = ______\n        g = grad(x)\n    return x\n",
      },
      {
        id: "ex7q2",
        statement:
          "Pour comparer l'amplitude du déplacement entre un pas de gradient à pas fixe et un pas de Newton, complétez le code ci-dessous qui calcule les deux directions de déplacement à partir du gradient `g` et de la Hessienne `H`.",
        initialCode:
          "import numpy as np\n\ng = np.array([2.0, -1.0])\nH = np.array([[4.0, 0.0], [0.0, 2.0]])\nalpha = 0.1\n\n# Direction de déplacement du gradient à pas fixe : alpha * g\npas_gradient = ______\n\n# Direction de déplacement de Newton : H^{-1} @ g\npas_newton = ______\n\nprint(pas_gradient, pas_newton)\n",
      },
    ],
  },
  {
    id: "ex8",
    title: "Méthodes de Quasi-Newton (BFGS / DFP)",
    description:
      "Découverte des méthodes de quasi-Newton BFGS et DFP, qui approximent l'inverse de la Hessienne à partir des informations de gradient, sans jamais la calculer explicitement.",
    questions: [
      {
        id: "ex8q1",
        statement:
          "Dans BFGS, on maintient une approximation `H` de l'inverse de la Hessienne, et la direction de descente est $p = -H\\nabla f(x)$. Complétez le code ci-dessous, qui calcule cette direction puis met à jour $x$ selon $x_{\\text{new}} = x + \\alpha p$.",
        initialCode:
          "import numpy as np\n\nH = np.eye(2)\ngrad = np.array([1.0, -2.0])\nalpha = 0.5\nx = np.array([0.0, 0.0])\n\n# Calculez la direction de descente p = -H @ grad\np = ______\n\n# Mettez à jour x selon x_new = x + alpha * p\nx_new = ______\n\nprint(x_new)\n",
      },
      {
        id: "ex8q2",
        statement:
          "Complétez la fonction `bfgs_update` ci-dessous, qui met à jour la matrice `H` (approximation de l'inverse de la Hessienne) à partir des vecteurs $s = x_{\\text{new}} - x$ et $y = \\nabla f(x_{\\text{new}}) - \\nabla f(x)$, selon $\\rho = \\dfrac{1}{y^\\top s}$.",
        initialCode:
          "import numpy as np\n\ndef bfgs_update(H, s, y):\n    # Calculez rho = 1 / (y^T s)\n    rho = ______\n    I = np.eye(len(s))\n    H_new = (I - rho * np.outer(s, y)) @ H @ (I - rho * np.outer(y, s)) + rho * np.outer(s, s)\n    return H_new\n",
      },
    ],
  },
];

/**
 * Structure pédagogique enrichie des questions.
 * Chaque question dispose désormais d'un objet `structure` contenant :
 *   - contexte, objectif, donnees, contraintes, resultatAttendu, exempleIO
 * Le champ `enonce` reste pour la compatibilité avec l'ancienne structure.
 */
export const DEFAULT_QUESTIONS = [
  {
    id: "q1",
    titre: "SymPy : Résolution d'Équation",
    enonce:
      "Utilisez SymPy pour déclarer une variable réelle $x$ et résoudre l'équation $x^2 - 5x + 6 = 0$ à l'aide de la fonction `solve()`.",
    structure: {
      contexte:
        "SymPy est une bibliothèque Python de calcul symbolique qui permet de manipuler des expressions mathématiques exactes, de résoudre des équations et de calculer des dérivées sans passer par des méthodes numériques approchées.",
      objectif:
        "Déclarer une variable symbolique réelle avec SymPy et utiliser `solve()` pour résoudre une équation polynomiale.",
      donnees: [
        "Équation : $x^2 - 5x + 6 = 0$",
        "Variable : $x$, déclarée avec `real=True`",
      ],
      contraintes: [
        "Utiliser `symbols('x', real=True)` pour déclarer la variable.",
        "Utiliser la fonction `solve()` de SymPy pour résoudre l'équation.",
      ],
      resultatAttendu:
        "Les deux racines réelles de l'équation doivent être affichées : $x = 2$ et $x = 3$.",
      exempleIO: {
        entree: "equation = x**2 - 5*x + 6",
        sortie: "[2, 3]",
      },
    },
    ordre: 1,
    notebookId: "nb1",
  },
  {
    id: "q2",
    titre: "Dichotomie : Recherche de Racine",
    enonce:
      "Implémentez la méthode de dichotomie pour trouver une racine de $f(x) = x^3 - x - 2$ sur l'intervalle $[1, 2]$, avec une tolérance de $10^{-6}$.",
    structure: {
      contexte:
        "La méthode de dichotomie (ou bissection) est une méthode simple et robuste pour trouver une racine d'une fonction continue changeant de signe sur un intervalle.",
      objectif:
        "Réduire progressivement un intervalle $[a, b]$ contenant une racine, en divisant l'intervalle en deux à chaque itération.",
      donnees: [
        "Fonction : $f(x) = x^3 - x - 2$",
        "Intervalle initial : $[a, b] = [1, 2]$",
        "Tolérance : $10^{-6}$",
      ],
      contraintes: [
        "Vérifier que $f(a)$ et $f(b)$ sont de signes opposés.",
        "S'arrêter lorsque $b - a < 10^{-6}$.",
      ],
      resultatAttendu:
        "Une approximation de la racine de $f$, proche de $x \\approx 1.521$.",
      exempleIO: {
        entree: "a=1, b=2, tol=1e-6",
        sortie: "Racine approximative : x ≈ 1.5214",
      },
    },
    ordre: 2,
    notebookId: "nb2",
  },
  {
    id: "q3",
    titre: "Méthode de Newton : Optimisation",
    enonce:
      "Implémentez la méthode de Newton pour trouver le minimum de $f(x, y) = x^2 + y^2 - xy$ en utilisant le gradient et la Hessienne calculés avec SymPy.",
    structure: {
      contexte:
        "La méthode de Newton pour l'optimisation utilise la Hessienne (dérivées secondes) en plus du gradient pour converger plus rapidement qu'une simple descente de gradient, notamment près du minimum.",
      objectif:
        "Calculer le gradient et la Hessienne de $f$, puis appliquer la mise à jour $x_{k+1} = x_k - H^{-1}\\nabla f(x_k)$.",
      donnees: [
        "Fonction : $f(x, y) = x^2 + y^2 - xy$",
        "Point initial : $(x_0, y_0) = (1, 1)$",
      ],
      contraintes: [
        "Calculer le gradient et la Hessienne avec SymPy.",
        "Utiliser `numpy` pour inverser la Hessienne numériquement.",
      ],
      resultatAttendu:
        "L'algorithme doit converger vers le minimum global $(0, 0)$ en une seule itération, car $f$ est quadratique.",
      exempleIO: {
        entree: "x0 = [1, 1]",
        sortie: "Minimum trouvé : (0.0, 0.0) en 1 itération",
      },
    },
    ordre: 3,
    notebookId: "nb1",
  },
];

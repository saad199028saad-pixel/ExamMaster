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
          "Complétez la fonction `resoudre_equation`, qui résout l'équation `expression = 0` par rapport à `variable` avec la fonction `solve()` de SymPy.",
        initialCode:
          "from sympy import solve\n\ndef resoudre_equation(expression, variable):\n    # TODO : résoudre expression = 0 par rapport à variable avec solve()\n    return solutions\n",
      },
      {
        id: "ex1q2",
        statement:
          "Complétez la fonction `simplifier_expression`, qui simplifie une expression symbolique avec la fonction `simplify()` de SymPy.",
        initialCode:
          "from sympy import simplify\n\ndef simplifier_expression(expression):\n    # TODO : simplifier expression avec simplify()\n    return resultat\n",
      },
      {
        id: "ex1q3",
        statement:
          "La fonction `resoudre_equation(expression, variable)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous : déclarez `x`, construisez l'expression $x^2 - 5x + 6$, appelez la fonction et affichez le résultat.",
        initialCode:
          "from sympy import symbols, solve\n\ndef resoudre_equation(expression, variable):\n    return solve(expression, variable)\n\n\n# TODO : déclarer x comme variable symbolique réelle avec symbols()\nexpression = x**2 - 5*x + 6\n# TODO : appeler resoudre_equation avec expression et x\n# TODO : afficher le résultat\n",
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
          "Complétez l'algorithme de dichotomie, qui recherche une racine de `f` sur $[a, b]$ en s'arrêtant lorsque la largeur de l'intervalle est inférieure à `eps`.",
        initialCode:
          "def dichotomie(f, a, b, eps):\n    while (b - a) > eps:\n        # TODO : calculer le milieu m de l'intervalle [a, b]\n        if f(a) * f(m) <= 0:\n            # TODO : mettre à jour b avec m\n        else:\n            # TODO : mettre à jour a avec m\n    return (a + b) / 2\n",
      },
      {
        id: "ex2q2",
        statement:
          "Complétez la fonction `critere_arret`, qui renvoie `True` tant que l'on doit continuer les itérations, c'est-à-dire tant que la largeur de l'intervalle $[a, b]$ dépasse la tolérance `eps`.",
        initialCode:
          "def critere_arret(a, b, eps):\n    # TODO : renvoyer True tant que (b - a) dépasse eps\n    return resultat\n",
      },
      {
        id: "ex2q3",
        statement:
          "La fonction `dichotomie(f, a, b, eps)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous pour trouver une racine de $f(x) = x^2 - 2$ sur l'intervalle $[1, 2]$.",
        initialCode:
          "def dichotomie(f, a, b, eps):\n    while (b - a) > eps:\n        m = (a + b) / 2\n        if f(a) * f(m) <= 0:\n            b = m\n        else:\n            a = m\n    return (a + b) / 2\n\n\n# TODO : définir une fonction f telle que f(x) = x**2 - 2\na = 1\nb = 2\neps = 0.0001\n# TODO : appeler dichotomie avec f, a, b et eps\n# TODO : afficher le résultat\n",
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
          "Complétez l'algorithme de la section dorée : le calcul du nombre d'or `phi`, et la mise à jour des bornes `a` et `b` selon la comparaison de $f(c)$ et $f(d)$.",
        initialCode:
          "import math\n\ndef section_doree(f, a, b, eps):\n    # TODO : calculer phi, le nombre d'or ((racine de 5 - 1) / 2)\n    c = b - phi * (b - a)\n    d = a + phi * (b - a)\n    while (b - a) > eps:\n        if f(c) < f(d):\n            # TODO : mettre à jour b avec d\n        else:\n            # TODO : mettre à jour a avec c\n        c = b - phi * (b - a)\n        d = a + phi * (b - a)\n    return (a + b) / 2\n",
      },
      {
        id: "ex3q2",
        statement:
          "La fonction `section_doree(f, a, b, eps)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous pour trouver le minimum de $f(x) = (x - 2)^2$ sur l'intervalle $[0, 5]$.",
        initialCode:
          "import math\n\ndef section_doree(f, a, b, eps):\n    phi = (math.sqrt(5) - 1) / 2\n    c = b - phi * (b - a)\n    d = a + phi * (b - a)\n    while (b - a) > eps:\n        if f(c) < f(d):\n            b = d\n        else:\n            a = c\n        c = b - phi * (b - a)\n        d = a + phi * (b - a)\n    return (a + b) / 2\n\n\n# TODO : définir une fonction f telle que f(x) = (x - 2) ** 2\na = 0\nb = 5\neps = 0.001\n# TODO : appeler section_doree avec f, a, b et eps\n# TODO : afficher le résultat\n",
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
          "Complétez la fonction `gradient_pas_fixe` : la mise à jour de `x` selon $x_{k+1} = x_k - \\alpha \\nabla f(x_k)$.",
        initialCode:
          "def gradient_pas_fixe(grad, x0, alpha, eps):\n    x = x0\n    while abs(grad(x)) > eps:\n        # TODO : mettre à jour x selon x = x - alpha * grad(x)\n    return x\n",
      },
      {
        id: "ex4q2",
        statement:
          "La fonction `gradient_pas_fixe(grad, x0, alpha, eps)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous pour $f(x) = x^2$ (dont le gradient est $2x$).",
        initialCode:
          "def gradient_pas_fixe(grad, x0, alpha, eps):\n    x = x0\n    while abs(grad(x)) > eps:\n        x = x - alpha * grad(x)\n    return x\n\n\n# TODO : définir une fonction grad telle que grad(x) = 2 * x\nx0 = 10\nalpha = 0.1\neps = 0.0001\n# TODO : appeler gradient_pas_fixe avec grad, x0, alpha et eps\n# TODO : afficher le résultat\n",
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
          "Complétez la fonction `gradient_pas_optimal` : le calcul du pas `alpha` avec `minimize_scalar` pour minimiser $\\phi(\\alpha) = f(x_k - \\alpha \\nabla f(x_k))$, puis la mise à jour de `x`.",
        initialCode:
          "from scipy.optimize import minimize_scalar\n\ndef gradient_pas_optimal(f, grad, x0, eps):\n    x = x0\n    while abs(grad(x)) > eps:\n        phi = lambda alpha: f(x - alpha * grad(x))\n        # TODO : trouver alpha qui minimise phi avec minimize_scalar\n        # TODO : mettre à jour x selon x = x - alpha * grad(x)\n    return x\n",
      },
      {
        id: "ex5q2",
        statement:
          "La fonction `gradient_pas_optimal(f, grad, x0, eps)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous pour trouver le minimum de $f(x) = x^2$.",
        initialCode:
          "from scipy.optimize import minimize_scalar\n\ndef gradient_pas_optimal(f, grad, x0, eps):\n    x = x0\n    while abs(grad(x)) > eps:\n        phi = lambda alpha: f(x - alpha * grad(x))\n        alpha = minimize_scalar(phi).x\n        x = x - alpha * grad(x)\n    return x\n\n\n# TODO : définir f(x) = x**2 et grad(x) = 2*x\nx0 = 5\neps = 0.0001\n# TODO : appeler gradient_pas_optimal avec f, grad, x0 et eps\n# TODO : afficher le résultat\n",
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
          "Complétez la boucle principale de l'algorithme du gradient conjugué : le résidu mis à jour `r_new`, le coefficient `beta`, et la nouvelle direction de recherche `d`.",
        initialCode:
          "import numpy as np\n\ndef gradient_conjugue(A, b, x0, eps):\n    x = x0\n    r = b - A @ x\n    d = r\n    while np.linalg.norm(r) > eps:\n        alpha = (r @ r) / (d @ (A @ d))\n        x = x + alpha * d\n        # TODO : calculer le nouveau résidu r_new\n        # TODO : calculer beta = (r_new . r_new) / (r . r)\n        # TODO : calculer la nouvelle direction d = r_new + beta * d\n        r = r_new\n    return x\n",
      },
      {
        id: "ex6q2",
        statement:
          "Complétez l'initialisation de l'algorithme du gradient conjugué : le résidu initial `r` et la direction initiale `d`, qui correspond à la direction de plus forte descente.",
        initialCode:
          "import numpy as np\n\ndef gradient_conjugue(A, b, x0, eps):\n    x = x0\n    # TODO : initialiser le résidu r = b - A @ x\n    # TODO : initialiser la direction d = r\n    while np.linalg.norm(r) > eps:\n        alpha = (r @ r) / (d @ (A @ d))\n        x = x + alpha * d\n        r_new = r - alpha * (A @ d)\n        beta = (r_new @ r_new) / (r @ r)\n        d = r_new + beta * d\n        r = r_new\n    return x\n",
      },
      {
        id: "ex6q3",
        statement:
          "La fonction `gradient_conjugue(A, b, x0, eps)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous pour résoudre le système $Ax = b$ avec $A = \\begin{pmatrix}4 & 1\\\\1 & 3\\end{pmatrix}$ et $b = (1, 2)$.",
        initialCode:
          "import numpy as np\n\ndef gradient_conjugue(A, b, x0, eps):\n    x = x0\n    r = b - A @ x\n    d = r\n    while np.linalg.norm(r) > eps:\n        alpha = (r @ r) / (d @ (A @ d))\n        x = x + alpha * d\n        r_new = r - alpha * (A @ d)\n        beta = (r_new @ r_new) / (r @ r)\n        d = r_new + beta * d\n        r = r_new\n    return x\n\n\n# TODO : définir A, b et x0 avec numpy\neps = 0.0001\n# TODO : appeler gradient_conjugue avec A, b, x0 et eps\n# TODO : afficher le résultat\n",
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
          "Complétez la fonction `newton_optim`, qui applique la mise à jour $x_{k+1} = x_k - H^{-1}\\nabla f(x_k)$, où `H` est la Hessienne évaluée en $x_k$.",
        initialCode:
          "import numpy as np\n\ndef newton_optim(grad, hess, x0, eps):\n    x = x0\n    while np.linalg.norm(grad(x)) > eps:\n        H = hess(x)\n        # TODO : calculer la direction p = H^{-1} @ grad(x)\n        # TODO : mettre à jour x selon x = x - p\n    return x\n",
      },
      {
        id: "ex7q2",
        statement:
          "Pour comparer l'amplitude du déplacement entre un pas de gradient à pas fixe et un pas de Newton, complétez le code ci-dessous qui calcule les deux directions de déplacement à partir du gradient `g` et de la Hessienne `H`.",
        initialCode:
          "import numpy as np\n\ng = np.array([2.0, -1.0])\nH = np.array([[4.0, 0.0], [0.0, 2.0]])\nalpha = 0.1\n\n# TODO : calculer pas_gradient = alpha * g\n# TODO : calculer pas_newton = H^{-1} @ g (utiliser np.linalg.inv)\n\nprint(pas_gradient, pas_newton)\n",
      },
      {
        id: "ex7q3",
        statement:
          "La fonction `newton_optim(grad, hess, x0, eps)` est déjà implémentée pour $f(x, y) = x^2 + y^2$. Complétez l'exemple d'utilisation ci-dessous.",
        initialCode:
          "import numpy as np\n\ndef newton_optim(grad, hess, x0, eps):\n    x = x0\n    while np.linalg.norm(grad(x)) > eps:\n        H = hess(x)\n        p = np.linalg.inv(H) @ grad(x)\n        x = x - p\n    return x\n\n\n# TODO : définir grad(x) et hess(x) pour f(x, y) = x**2 + y**2\nx0 = np.array([3.0, 3.0])\neps = 0.0001\n# TODO : appeler newton_optim avec grad, hess, x0 et eps\n# TODO : afficher le résultat\n",
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
          "Complétez la fonction `bfgs_update`, qui met à jour la matrice `H` (approximation de l'inverse de la Hessienne) à partir des vecteurs `s` et `y`, selon $\\rho = \\dfrac{1}{y^\\top s}$.",
        initialCode:
          "import numpy as np\n\ndef bfgs_update(H, s, y):\n    # TODO : calculer rho = 1 / (y . s)\n    I = np.eye(len(s))\n    H_new = (I - rho * np.outer(s, y)) @ H @ (I - rho * np.outer(y, s)) + rho * np.outer(s, s)\n    return H_new\n",
      },
      {
        id: "ex8q2",
        statement:
          "La fonction `bfgs_update(H, s, y)` est déjà implémentée. Complétez l'exemple d'utilisation ci-dessous pour mettre à jour `H` à partir de `s` et `y`.",
        initialCode:
          "import numpy as np\n\ndef bfgs_update(H, s, y):\n    rho = 1 / (y @ s)\n    I = np.eye(len(s))\n    H_new = (I - rho * np.outer(s, y)) @ H @ (I - rho * np.outer(y, s)) + rho * np.outer(s, s)\n    return H_new\n\n\n# TODO : définir H (matrice identité 2x2), s et y\n# TODO : appeler bfgs_update avec H, s et y\n# TODO : afficher le résultat\n",
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

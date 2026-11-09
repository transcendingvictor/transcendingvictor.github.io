const Obra = (() => {
  const el = (tag, attrs = {}, ...hijos) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v; else n.setAttribute(k, v);
    }
    for (const h of hijos) n.append(h);
    return n;
  };
  const cargar = () => fetch("datos/obra.json").then(r => r.json());
  const fecha = p => p.fecha_escritura || p.fecha_publicacion;
  const guardado = (k, v) => {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  };

  // Idioma de la interfaz (en inglés, los poemas añaden su traducción bajo cada verso). Misma clave 'lang' y atributo
  // html[data-lang] que el resto de la web, para que la elección se comparta.
  const TEXTOS = {
    es: {
      titulo: "Obra completa", volver: "← Obra completa",
      entradilla: "Poemas desde 2016, ordenados por fecha.",  leyCs: "del blog", leyMb: "del blog", leyRev: "revisado por mí; el círculo vacío, todavía sin revisar", leyDed: "código de dedicatoria: una pista de a quién va, no necesariamente un nombre",
      buscar: "Buscar un título o un verso…", todo: "Todo", poemas: "Ciencias sociales", banales: "Mentiras banales",
      cualquier: "Cualquier tema", vacio: "Nada por aquí.", cuenta: n => n === 1 ? "1 poema" : `${n} poemas`, dedicada: "Dedicada a…", banalesMeta: "mentiras banales · ", comentado: " · comentado", revisado: "Revisado por mí", sinRevisar: "Sin revisar",
      noEncuentro: "No encuentro esa pieza.", publicado: f => ` · publicado el ${f}`, escrito: f => `Escrito hacia el ${f}`, escritoAprox: (parte, m, a) => `Escrito hacia ${["principios", "mediados", "finales"][parte]} de ${m} de ${a}`, primero: "Mi primer poema publicado",
      historia: "Historia", comentarioForma: "Comentario de la forma", quitarColores: "Quitar colores", ponerColores: "Poner colores", imagen: "Imagen del poema", explicacion: "Explicación", temas: "Temas", figuras: "Figuras", personas: "Personas verbales", valoracion: "Valoración del autor", anteriores: n => `Valoraciones anteriores (${n})`,
      analisis: "Análisis", capas: { forma: "Forma", sentido: "Sentido", referencia: "Referencias" }, provisional: "provisional",
      forma: "Forma", estrofa: "Estrofa", medida: "Medida", esquema: "Esquema",
      lectura: "Análisis del autor", notaGeneral: "Nota general",
      rasgos: { profundidad: "Profundidad", dureza: "Dureza", "pintar conceptos": "Pintar conceptos", sonoridad: "Sonoridad" },
      meses: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      fechaLarga: (d, m, a) => d ? `${d} de ${m} de ${a}` : m ? `${m} de ${a}` : a,
    },
    en: {
      titulo: "Complete works", volver: "← Complete works",
      entradilla: "Poems since 2016, in date order, mostly in Spanish.",  leyCs: "from the blog", leyMb: "from the blog", leyRev: "reviewed by me; the empty circle, not reviewed yet", leyDed: "dedication code: a clue to who it is for, not necessarily a name",
      buscar: "Search a title or a line…", todo: "All", poemas: "Ciencias sociales", banales: "Mentiras banales",
      cualquier: "Any theme", vacio: "Nothing here.", cuenta: n => n === 1 ? "1 poem" : `${n} poems`, dedicada: "Dedicated to…", banalesMeta: "mentiras banales · ", comentado: " · annotated", revisado: "Reviewed by me", sinRevisar: "Not reviewed yet",
      noEncuentro: "I can't find that piece.", publicado: f => ` · published ${f}`, escrito: f => `Written around ${f}`, escritoAprox: (parte, m, a) => `Written around ${["early", "mid", "late"][parte]} ${m} ${a}`, primero: "My first published poem",
      historia: "Story", comentarioForma: "Commentary on the form", quitarColores: "Remove colours", ponerColores: "Show colours", imagen: "Image of the poem", explicacion: "Explanation", temas: "Themes", figuras: "Figures", personas: "Verb persons", valoracion: "Author's rating", anteriores: n => `Earlier ratings (${n})`,
      analisis: "Analysis", capas: { forma: "Form", sentido: "Meaning", referencia: "References" }, provisional: "placeholder",
      forma: "Form", estrofa: "Stanza", medida: "Metre", esquema: "Rhyme scheme",
      lectura: "Author's analysis", notaGeneral: "Overall score",
      rasgos: { profundidad: "Depth", dureza: "Harshness", "pintar conceptos": "Painting concepts", sonoridad: "Sound" },
      meses: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      fechaLarga: (d, m, a) => d ? `${d} ${m} ${a}` : m ? `${m} ${a}` : a,
    },
  };
  const idiomaInicial = () => {
    const q = new URLSearchParams(location.search).get("lang");
    const l = q || guardado("lang");
    return l === "en" ? "en" : "es";
  };
  let lang = idiomaInicial();
  const T = k => TEXTOS[lang][k];
  const fechaLarga = f => {
    const [a, m, d] = f.split("-");
    return T("fechaLarga")(d ? +d : "", m ? T("meses")[+m - 1] : "", a);
  };
  const escritoAprox = f => {
    const [a, m, d] = f.split("-");
    return T("escritoAprox")(+d <= 10 ? 0 : +d <= 20 ? 1 : 2, T("meses")[+m - 1], a);
  };
  const traducirEstaticos = () => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    document.querySelectorAll("[data-t]").forEach(n => { n.textContent = T(n.dataset.t); });
    document.querySelectorAll("[data-t-placeholder]").forEach(n => { n.placeholder = T(n.dataset.tPlaceholder); });
  };
  const selectorIdioma = alCambiar => {
    const caja = document.getElementById("idioma");
    if (!caja) return;
    caja.className = "idioma";
    const pintar = () => caja.replaceChildren(...["es", "en"].map(l => {
      const b = el("button", { type: "button", "aria-pressed": String(l === lang) }, l.toUpperCase());
      b.addEventListener("click", () => {
        if (l === lang) return;
        lang = l; guardado("lang", l); traducirEstaticos(); pintar(); alCambiar();
      });
      return b;
    }));
    pintar();
  };

  function indice() {
    const caja = document.getElementById("indice");
    const buscar = document.getElementById("buscar");
    const formato = document.getElementById("formato");
    const etiqueta = document.getElementById("etiqueta");
    traducirEstaticos();
    // Mismos colores que el resto de la web; dentro de un año se van alternando
    const COLORES = ["#e5d8f7", "#fcd8d8", "#c4e6cc", "#fde7b0", "#d6e6f7"];
    const cuenta = el("p", { class: "cuenta" });
    caja.before(cuenta);
    cargar().then(piezas => {
      const temas = [...new Set(piezas.flatMap(p => p.etiquetas))].sort();
      const encaja = (p, q, conTema) =>
        (!formato.value || p.formato === formato.value) &&
        (!conTema || !etiqueta.value || p.etiquetas.includes(etiqueta.value)) &&
        (!q || (p.titulo + "\n" + p.texto).toLowerCase().includes(q));
      const pintar = () => {
        const q = buscar.value.trim().toLowerCase();
        // Cuántas piezas hay de cada tema con la búsqueda actual, para no tener que probarlos
        const sinTema = piezas.filter(p => encaja(p, q, false));
        const elegido = etiqueta.value;
        etiqueta.replaceChildren(el("option", { value: "" }, `${T("cualquier")} (${sinTema.length})`),
          ...temas.map(e => {
            const n = sinTema.filter(p => p.etiquetas.includes(e)).length;
            const o = el("option", { value: e }, `${e.replace(/-/g, " ")} (${n})`);
            if (!n && e !== elegido) o.disabled = true;
            return o;
          }));
        etiqueta.value = elegido;
        const lista = piezas.filter(p => encaja(p, q, true));
        cuenta.textContent = T("cuenta")(lista.length);
        caja.replaceChildren();
        if (!lista.length) { caja.append(el("p", { class: "vacio" }, T("vacio"))); return; }
        let anio = null, ul = null, k = 0;
        for (const p of lista) {
          const a = fecha(p).slice(0, 4);
          if (a !== anio) {
            anio = a; k = 0;
            const n = lista.filter(x => fecha(x).startsWith(a)).length;
            caja.append(el("h2", { class: "anio" }, a, el("span", { class: "n" }, String(n))));
            ul = caja.appendChild(el("ul", { class: "burbujas" }));
          }
          const marca = "";
          const b = el("a", { class: "burbuja" + (p.revisado ? " revisada" : ""), href: `poema.html?c=${p.codigo}` },
            el("span", { class: "check", title: p.revisado ? T("revisado") : T("sinRevisar"), "aria-label": p.revisado ? T("revisado") : T("sinRevisar") }, p.revisado ? "✓" : ""),
            el("span", { class: "t" }, p.titulo),
            el("span", { class: "f" }, fechaLarga(fecha(p)) + marca));
          // Etiquetas: el blog de donde viene y, si la tiene, la dedicatoria con su código
          const etiquetas = el("span", { class: "etiquetas" },
            el("span", { class: "tipo" }, /mentiras banales/i.test(p.fuente) ? "mentiras banales" : "ciencias sociales"));
          if (p.dedicatoria_pista) etiquetas.append(el("span", { class: "dedica", title: T("dedicada") }, "✉ " + p.dedicatoria_pista));
          b.append(etiquetas);
          b.style.setProperty("--color", COLORES[k++ % COLORES.length]);
          ul.append(el("li", {}, b));
        }
      };
      [buscar, formato, etiqueta].forEach(c => c.addEventListener("input", pintar));
      selectorIdioma(pintar);
      pintar();
    });
  }

  // Capas de comentarios: cada nota pertenece a una y cada botón enciende la suya
  const CAPAS = ["forma", "sentido", "referencia"];
  const COLORES_RIMA = ["#f7c6c6", "#c9e4f7", "#fbe3a6", "#d4c9f2", "#bfe5c8", "#f8d2e8",
    "#d9ecb0", "#f9d7b5", "#c4dede", "#e8d4c0", "#dcd6f7", "#f2e2a0"];
  // Mismo color para la misma rima, en el orden en que aparecen
  const ordenRimas = f => [...new Set(Object.keys(f.versos).sort((a, b) => a - b)
    .map(v => f.versos[v].rima.toLowerCase()).filter(r => r !== "-"))];
  const colorRima = (f, r) => COLORES_RIMA[Math.max(0, ordenRimas(f).indexOf(r)) % COLORES_RIMA.length];

  const lateral = window.matchMedia("(min-width: 1280px)");
  const cerrarNota = n => {
    n.classList.remove("abierta");
    (n._marcados || []).forEach(m => m.classList.remove("activo"));
  };

  // Versos partidos: empiezan donde acaba el anterior, como si siguieran en la misma línea
  const escalonar = (caja, versos) => versos.forEach(n => {
    const v = caja.querySelector(`.verso[data-v="${n}"]`), prev = caja.querySelector(`.verso[data-v="${n - 1}"]`);
    if (!v || !prev) return;
    v.style.paddingLeft = "";
    const r = document.createRange();
    r.selectNodeContents(prev.querySelector(".txt"));
    const rects = [...r.getClientRects()].filter(x => x.width);
    if (rects.length) v.style.paddingLeft = (rects[rects.length - 1].right - prev.getBoundingClientRect().left + 6) + "px";
  });

  // Envuelve en un span el primer trozo de texto que coincida, sin tocar lo ya marcado
  const envolver = (raiz, trozo, clase) => {
    const textos = [];
    const recorrer = x => x.childNodes.forEach(h => h.nodeType === 3 ? textos.push(h) : recorrer(h));
    recorrer(raiz);
    for (const t of textos) {
      const k = t.textContent.indexOf(trozo);
      if (k < 0) continue;
      const s = el("span", { class: clase }, trozo);
      t.replaceWith(t.textContent.slice(0, k), s, t.textContent.slice(k + trozo.length));
      return s;
    }
    return null;
  };

  function versos(p) {
    // Cada línea del poema; las vacías son separación de estrofa. El texto va en .txt para
    // que el subrayado de un verso siga a las letras y no a todo el ancho.
    const lineas = p.texto.split("\n");
    const en = p.texto_en ? p.texto_en.split("\n") : [];
    const caja = el("div", { class: "poema" });
    const nodos = [];
    let n = 0;
    for (const [i, l] of lineas.entries()) {
      if (!l.trim()) { caja.append(el("span", { class: "estrofa" })); continue; }
      const v = el("span", { class: "verso" }, el("span", { class: "txt" }, l));
      // Traducción bajo el verso; solo se ve con la web en inglés
      if (en[i] && en[i] !== l) v.append(el("span", { class: "tr", lang: "en" }, en[i]));
      v.dataset.v = ++n;
      caja.append(v);
      nodos.push(v);
    }
    const txt = v => v.querySelector(".txt");
    // Forma: al margen, sílabas y letra de rima; sus observaciones se abren desde ahí
    const metros = {};
    if (p.forma) nodos.forEach(v => {
      const d = p.forma.versos[v.dataset.v];
      if (!d) return;
      const r = d.rima.toLowerCase();
      const metro = el("span", { class: "metro" }, `${d.silabas} `, el("b", {}, d.rima === "-" ? "–" : d.rima));
      if (r !== "-") metro.style.setProperty("--rima", colorRima(p.forma, r));
      v.prepend(metro);
      metros[v.dataset.v] = metro;
    });
    const notas = [...p.anotaciones, ...(p.lectura ? p.lectura.anotaciones : [])];
    notas.forEach(a => {
      const nota = el("div", { class: `nota capa-${a.capa}` });
      if (a.autor === "provisional") nota.append(el("span", { class: "autor" }, T("provisional")));
      if (a.aviso) nota.append(el("span", { class: "autor" }, a.aviso));
      nota.append(a.texto);
      let marcados = [], tras;
      if (a.fragmento) {
        const v = nodos.find(x => txt(x).textContent.includes(a.fragmento));
        if (!v) return;
        marcados = [envolver(txt(v), a.fragmento, "anotado")];
        tras = v;
      } else {
        const vs = nodos.slice(a.desde - 1, a.hasta);
        if (!vs.length) return;
        // Solo se subraya un trozo concreto (o el número, si la nota es de la medida): una nota de
        // un verso o de un tramo lleva raya al margen, para no llenar el poema de subrayados
        marcados = a.metro && metros[a.desde] ? [metros[a.desde]] : vs;
        tras = vs[vs.length - 1];
      }
      // Si varias notas caen en el mismo verso, van una detrás de otra
      while (tras.nextElementSibling && tras.nextElementSibling.classList.contains("nota")) tras = tras.nextElementSibling;
      tras.after(nota);
      const tramo = marcados.length > 1 || marcados[0].classList.contains("verso");
      const tam = a.fragmento ? 0 : a.hasta - a.desde + 1;
      marcados.forEach(m => m.classList.add("anotado", `${tramo ? "r" : "c"}-${a.capa}`));
      const abrir = () => {
        const abierta = !nota.classList.contains("abierta");
        // Como en Genius: en pantalla ancha la nota sale al lado y solo hay una abierta
        if (abierta && lateral.matches) caja.querySelectorAll(".nota.abierta").forEach(cerrarNota);
        if (!abierta) { cerrarNota(nota); return; }
        nota.classList.add("abierta");
        marcados.forEach(m => m.classList.add("activo"));
        nota._marcados = marcados;
        if (lateral.matches) nota.style.top = marcados[0].offsetTop + "px";
      };
      marcados.forEach(m => (m._notas = m._notas || []).push({ capa: a.capa, tam, abrir }));
    });
    // Un clic abre la nota más concreta de las capas encendidas (trozo > verso > tramo)
    caja.querySelectorAll(".anotado").forEach(m => m.addEventListener("click", e => {
      const on = m._notas.filter(n => caja.parentNode.classList.contains(`on-${n.capa}`));
      if (!on.length) return;
      e.stopPropagation();
      on.sort((x, y) => x.tam - y.tam)[0].abrir();
    }));
    // La última palabra de cada verso, coloreada según su rima
    if (p.forma) nodos.forEach(v => {
      const d = p.forma.versos[v.dataset.v];
      if (!d || d.rima === "-") return;
      const textos = [];
      const recorrer = x => x.childNodes.forEach(h => h.nodeType === 3 ? textos.push(h) : recorrer(h));
      recorrer(txt(v));
      for (let i = textos.length - 1; i >= 0; i--) {
        const t = textos[i].textContent, m = t.match(/([\p{L}\p{N}]+)([^\p{L}\p{N}]*)$/u);
        if (!m) continue;
        const s = el("span", { class: "rima" }, m[1]);
        s.style.setProperty("--rima", colorRima(p.forma, d.rima.toLowerCase()));
        textos[i].replaceWith(t.slice(0, m.index), s, m[2]);
        break;
      }
    });
    return caja;
  }

  function forma(f) {
    const s = el("section", { class: "forma" }, el("h2", {}, T("forma")));
    if (f.estado) s.append(el("p", { class: "aviso" }, f.estado));
    const dl = el("dl");
    [["estrofa", f.estrofa], ["medida", f.medida], ["esquema", f.esquema]].forEach(([k, v]) => {
      if (v) dl.append(el("dt", {}, T(k)), el("dd", {}, v));
    });
    s.append(dl);
    const ul = el("ul", { class: "rimas" });
    Object.entries(f.rimas).forEach(([l, texto]) => {
      const b = el("b", {}, l.toUpperCase());
      b.style.setProperty("--rima", colorRima(f, l));
      ul.append(el("li", {}, b, " ", texto));
    });
    if (ul.children.length) s.append(ul);
    // Personas verbales: quién hace cada verbo, en una tabla
    const pv = f.personas;
    if (pv) {
      s.append(el("h3", {}, T("personas")));
      if (pv.antes) pv.antes.split(/\n\n/).forEach(t => s.append(el("p", {}, t)));
      if (pv.filas.length) {
        const [cab, ...filas] = pv.filas;
        const tabla = el("table", { class: "personas" },
          el("thead", {}, el("tr", {}, ...cab.map(c => el("th", {}, c)))),
          el("tbody", {}, ...filas.map(f => el("tr", {}, ...f.map(c => el("td", {}, c))))));
        s.append(el("div", { class: "tabla-desliza" }, tabla));
      }
      if (pv.despues) pv.despues.split(/\n\n/).forEach(t => s.append(el("p", {}, t)));
    }
    return s;
  }

  function temas(t) {
    const s = el("section", { class: "temas" }, el("h2", {}, T("temas")));
    if (t.estado) s.append(el("p", { class: "aviso" }, t.estado));
    s.append(el("ul", {}, ...t.lista.map(x => el("li", {}, el("b", {}, x.tema), x.sub ? el("span", { class: "sub" }, " › " + x.sub) : ""))));
    return s;
  }

  function lectura(l) {
    const s = el("section", { class: "lectura" }, el("h2", {}, T("lectura")));
    const cab = [l.fecha ? fechaLarga(l.fecha) : "", l.estado ? T("provisional") : ""].filter(Boolean).join(" · ");
    if (cab) s.append(el("p", { class: "cab-analisis" }, cab));
    const tabla = el("dl", { class: "rasgos" });
    if (l.nota) tabla.append(el("dt", {}, T("notaGeneral")), el("dd", {}, el("span", { class: "nota-num" }, `${l.nota}/10`)));
    Object.entries(l.rasgos).forEach(([k, v]) => {
      const puntos = el("span", { class: "puntos", title: `${v}/5` });
      for (let i = 1; i <= 5; i++) puntos.append(el("i", i <= v ? { class: "lleno" } : {}));
      tabla.append(el("dt", {}, T("rasgos")[k] || k), el("dd", {}, puntos));
    });
    s.append(tabla);
    l.texto.split(/\n\n/).forEach(t => s.append(el("p", {}, t)));
    return s;
  }

  function poema() {
    const main = document.getElementById("pieza");
    const migas = main.querySelector(".migas");
    const codigo = new URLSearchParams(location.search).get("c");
    traducirEstaticos();
    cargar().then(piezas => {
      const i = piezas.findIndex(p => p.codigo === codigo);
      const pintar = () => {
      main.replaceChildren(migas);
      if (i < 0) { main.append(el("p", { class: "vacio" }, T("noEncuentro"))); return; }
      const p = piezas[i];
      document.title = `${p.titulo} | Obra completa`;
      main.append(el("h1", {}, p.titulo, p.titulo_en && p.titulo_en !== p.titulo ? el("span", { class: "tr", lang: "en" }, p.titulo_en) : ""));
      const meta = el("p", { class: "meta" }, p.fecha_escritura ? (p.escritura_aprox ? escritoAprox(p.fecha_escritura) : T("escrito")(fechaLarga(p.fecha_escritura))) : fechaLarga(fecha(p)));
      main.append(el("p", { class: "sello" + (p.revisado ? " revisada" : "") }, el("span", { class: "check" }, p.revisado ? "✓" : ""), p.revisado ? T("revisado") : T("sinRevisar")));
      if (p.fecha_escritura) meta.append(T("publicado")(fechaLarga(p.fecha_publicacion)));
      meta.append(" · ", el("a", { href: p.url, target: "_blank", rel: "noopener" }, p.fuente));
      if (p.primero) main.append(el("p", { class: "primero" }, T("primero")));
      main.append(meta);

      const cuerpo = el("div");
      // Todo el análisis cuelga de un interruptor: apagado, solo queda el poema
      const todas = [...p.anotaciones, ...(p.lectura ? p.lectura.anotaciones : [])];
      const hay = CAPAS.filter(c => (c === "forma" && p.forma) || todas.some(a => a.capa === c));
      const conAnalisis = hay.length || p.explicacion || p.historia || p.valoraciones.length;
      let activas = (guardado("obra-capas") || "").split(",").filter(c => hay.includes(c));
      const sw = el("input", { type: "checkbox", role: "switch" });
      sw.checked = guardado("obra-analisis") === "1";
      const barra = el("div", { class: "capas", role: "group" });
      const aplicar = () => {
        main.classList.toggle("analisis", sw.checked);
        CAPAS.forEach(c => cuerpo.classList.toggle(`on-${c}`, sw.checked && activas.includes(c)));
        cuerpo.querySelectorAll(".nota.abierta").forEach(n => {
          if (!CAPAS.some(c => n.classList.contains(`capa-${c}`) && cuerpo.classList.contains(`on-${c}`))) cerrarNota(n);
        });
        barra.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(activas.includes(b.dataset.capa))));
        guardado("obra-analisis", sw.checked ? "1" : "0");
        guardado("obra-capas", activas.join(","));
      };
      hay.forEach(c => {
        const b = el("button", { type: "button", class: `capa-${c}`, "data-capa": c }, T("capas")[c]);
        b.addEventListener("click", () => {
          activas = activas.includes(c) ? activas.filter(x => x !== c) : [...activas, c];
          aplicar();
        });
        barra.append(b);
      });
      // «Quitar colores»: el poema sin rimas teñidas ni subrayados; la medida y la letra de rima se quedan
      const colores = el("button", { type: "button", class: "quitar-colores" });
      const pintarColores = () => {
        const sin = guardado("obra-sin-colores") === "1";
        cuerpo.classList.toggle("sin-colores", sin);
        colores.textContent = sin ? T("ponerColores") : T("quitarColores");
        colores.setAttribute("aria-pressed", String(sin));
      };
      colores.addEventListener("click", () => {
        guardado("obra-sin-colores", guardado("obra-sin-colores") === "1" ? "0" : "1");
        pintarColores();
      });
      pintarColores();
      sw.addEventListener("change", () => {
        if (sw.checked && !activas.length) activas = [...hay];
        aplicar();
      });
      if (conAnalisis) main.append(el("div", { class: "herramientas" },
        el("label", { class: "interruptor" }, sw, el("span", { class: "pista" }), T("analisis")), barra, colores));
      cuerpo.append(versos(p));
      main.append(cuerpo);
      aplicar();
      const partidos = p.forma ? p.forma.escalonados : [];
      if (partidos.length) {
        const caja = cuerpo.querySelector(".poema");
        const ajustar = () => escalonar(caja, partidos);
        ajustar();
        document.fonts.ready.then(ajustar);
        window.addEventListener("resize", ajustar);
      }

      if (p.lectura) main.append(lectura(p.lectura));
      if (p.historia) main.append(el("section", { class: "historia" }, el("h2", {}, T("historia")), ...p.historia.split(/\n\n/).map(t => el("p", {}, t))));
      // Comentario de la forma: prosa con **negritas**
      const negritas = t => t.split(/\*\*(.+?)\*\*/).map((x, k) => k % 2 ? el("b", {}, x) : x);
      if (p.comentario_forma) main.append(el("section", { class: "comentario-forma" }, el("h2", {}, T("comentarioForma")), ...p.comentario_forma.split(/\n\n/).map(t => el("p", {}, ...negritas(t)))));
      if (p.explicacion) {
        const s = el("section", {}, el("h2", {}, T("explicacion")));
        if (p.explicacion_estado) s.append(el("p", { class: "aviso" }, p.explicacion_estado));
        p.explicacion.split(/\n\n/).forEach(t => s.append(el("p", {}, t)));
        main.append(s);
      }
      // Un poema revisado no repite la forma en prosa: basta con lo que se ve en el poema
      // El bloque de texto de Forma ya no se pinta: quedan el margen (sílabas y rima), los colores y las notas de verso
      if (p.temas) main.append(temas(p.temas));
      if (p.valoraciones.length) {
        const s = el("section", {}, el("h2", {}, T("valoracion")));
        const bloque = v => el("div", { class: "valoracion" },
          el("p", { class: "cab" }, fechaLarga(v.fecha), v.nota ? " · " : "", v.nota ? el("span", { class: "nota-num" }, `${v.nota}/10`) : ""),
          el("p", {}, v.texto));
        s.append(bloque(p.valoraciones[0]));
        if (p.valoraciones.length > 1) {
          const d = el("details", {}, el("summary", {}, T("anteriores")(p.valoraciones.length - 1)));
          p.valoraciones.slice(1).forEach(v => d.append(bloque(v)));
          s.append(d);
        }
        main.append(s);
      }

      const nav = el("nav", { class: "navegacion" });
      nav.append(i > 0 ? el("a", { href: `poema.html?c=${piezas[i - 1].codigo}` }, "← " + piezas[i - 1].titulo) : el("span"));
      nav.append(i < piezas.length - 1 ? el("a", { href: `poema.html?c=${piezas[i + 1].codigo}` }, piezas[i + 1].titulo + " →") : el("span"));
      main.append(nav);
      // En el móvil, deslizar el poema hacia un lado lleva al anterior o al siguiente
      let x0 = null, y0 = 0;
      main.addEventListener("touchstart", e => {
        const t = e.touches[0];
        x0 = e.touches.length === 1 && !e.target.closest("input, select, .nota") ? t.clientX : null;
        y0 = t.clientY;
      }, { passive: true });
      main.addEventListener("touchend", e => {
        if (x0 === null) return;
        const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
        x0 = null;
        if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
        const destino = dx < 0 ? piezas[i + 1] : piezas[i - 1];
        if (destino) location.href = `poema.html?c=${destino.codigo}`;
      }, { passive: true });
      };
      selectorIdioma(pintar);
      pintar();
    });
  }

  return { indice, poema };
})();

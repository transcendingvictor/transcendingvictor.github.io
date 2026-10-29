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

  // Idioma de la interfaz (los poemas no se traducen). Misma clave 'lang' y atributo
  // html[data-lang] que el resto de la web, para que la elección se comparta.
  const TEXTOS = {
    es: {
      titulo: "Obra completa", volver: "← Obra completa",
      entradilla: "Poemas y textos desde 2016, ordenados por fecha. Se publicaron primero en", y: "y en",
      buscar: "Buscar un título o un verso…", todo: "Todo", poemas: "Poemas", banales: "Mentiras banales",
      cualquier: "Cualquier tema", vacio: "Nada por aquí.", banalesMeta: "mentiras banales · ", comentado: " · comentado",
      noEncuentro: "No encuentro esa pieza.", publicado: f => ` (publicado el ${f})`, verComentarios: "Ver comentarios",
      explicacion: "Explicación", valoracion: "Valoración del autor", anteriores: n => `Valoraciones anteriores (${n})`,
      meses: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      fechaLarga: (d, m, a) => d ? `${d} de ${m} de ${a}` : m ? `${m} de ${a}` : a,
    },
    en: {
      titulo: "Complete works", volver: "← Complete works",
      entradilla: "Poems and texts since 2016, in date order, mostly in Spanish. They first appeared on", y: "and",
      buscar: "Search a title or a line…", todo: "All", poemas: "Poems", banales: "Mentiras banales",
      cualquier: "Any theme", vacio: "Nothing here.", banalesMeta: "mentiras banales · ", comentado: " · annotated",
      noEncuentro: "I can't find that piece.", publicado: f => ` (published ${f})`, verComentarios: "Show comments",
      explicacion: "Explanation", valoracion: "Author's rating", anteriores: n => `Earlier ratings (${n})`,
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
    cargar().then(piezas => {
      [...new Set(piezas.flatMap(p => p.etiquetas))].sort().forEach(e => etiqueta.append(el("option", { value: e }, e.replace(/-/g, " "))));
      const pintar = () => {
        const q = buscar.value.trim().toLowerCase();
        const lista = piezas.filter(p =>
          (!formato.value || p.formato === formato.value) &&
          (!etiqueta.value || p.etiquetas.includes(etiqueta.value)) &&
          (!q || (p.titulo + "\n" + p.texto).toLowerCase().includes(q)));
        caja.replaceChildren();
        if (!lista.length) { caja.append(el("p", { class: "vacio" }, T("vacio"))); return; }
        let anio = null, ul = null;
        for (const p of lista) {
          const a = fecha(p).slice(0, 4);
          if (a !== anio) { anio = a; caja.append(el("h2", { class: "anio" }, a)); ul = caja.appendChild(el("ul", { class: "lista" })); }
          const marca = p.anotaciones.length || p.valoraciones.length ? T("comentado") : "";
          ul.append(el("li", {}, el("a", { href: `poema.html?c=${p.codigo}` },
            el("span", { class: "t" }, p.titulo),
            el("span", { class: "m" }, (p.formato === "poema" ? "" : T("banalesMeta")) + fechaLarga(fecha(p)) + marca))));
        }
      };
      [buscar, formato, etiqueta].forEach(c => c.addEventListener("input", pintar));
      selectorIdioma(pintar);
      pintar();
    });
  }

  function versos(p) {
    // Cada línea del poema; las vacías son separación de estrofa.
    const lineas = p.texto.split("\n");
    const caja = el("div", { class: "poema" });
    const nodos = [];
    let n = 0;
    for (const l of lineas) {
      if (!l.trim()) { caja.append(el("span", { class: "estrofa" })); continue; }
      const v = el("span", { class: "verso" }, l);
      v.dataset.v = ++n;
      caja.append(v);
      nodos.push(v);
    }
    p.anotaciones.forEach((a, i) => {
      const nota = el("div", { class: "nota" }, a.texto);
      let marcados = [];
      if (a.fragmento) {
        const v = nodos.find(x => x.textContent.includes(a.fragmento));
        if (!v) return;
        const t = v.textContent, k = t.indexOf(a.fragmento);
        const s = el("span", { class: "anotado" }, a.fragmento);
        v.replaceChildren(t.slice(0, k), s, t.slice(k + a.fragmento.length));
        marcados = [s];
        v.after(nota);
      } else {
        marcados = nodos.slice(a.desde - 1, a.hasta).map(v => { v.classList.add("anotado"); return v; });
        if (!marcados.length) return;
        marcados[marcados.length - 1].after(nota);
      }
      const abrir = () => {
        if (!caja.parentNode.classList.contains("con-notas")) return;
        const abierta = nota.classList.toggle("abierta");
        marcados.forEach(m => m.classList.toggle("activo", abierta));
      };
      marcados.forEach(m => m.addEventListener("click", abrir));
    });
    return caja;
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
      main.append(el("h1", {}, p.titulo));
      const meta = el("p", { class: "meta" }, fechaLarga(fecha(p)));
      if (p.fecha_escritura) meta.append(T("publicado")(fechaLarga(p.fecha_publicacion)));
      meta.append(" · ", el("a", { href: p.url, target: "_blank", rel: "noopener" }, p.fuente));
      main.append(meta);

      const cuerpo = el("div");
      if (p.anotaciones.length) {
        const chk = el("input", { type: "checkbox" });
        chk.checked = guardado("obra-notas") === "1";
        const aplicar = () => {
          cuerpo.classList.toggle("con-notas", chk.checked);
          if (!chk.checked) cuerpo.querySelectorAll(".abierta, .activo").forEach(n => n.classList.remove("abierta", "activo"));
          guardado("obra-notas", chk.checked ? "1" : "0");
        };
        chk.addEventListener("change", aplicar);
        main.append(el("label", { class: "interruptor" }, chk, T("verComentarios")));
        aplicar();
      }
      cuerpo.append(versos(p));
      main.append(cuerpo);

      if (p.explicacion) main.append(el("section", {}, el("h2", {}, T("explicacion")), el("p", {}, p.explicacion)));
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
      };
      selectorIdioma(pintar);
      pintar();
    });
  }

  return { indice, poema };
})();

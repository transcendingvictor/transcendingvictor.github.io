"""Genera datos/obra.json a partir de datos/catalogo.csv y anotaciones/*.md.

    python obra-completa/generar.py

Formato de las anotaciones (ver anotaciones/_PLANTILLA.md):
  - v3-4: texto                anota los versos 3 y 4 (se cuentan solo las líneas con texto)
  - "fragmento": texto         anota ese trozo exacto del poema
  - v3 [forma]: texto          capa de la nota: forma, sentido (por defecto) o referencia
  ## Historia                  cuándo y dónde se escribió (va antes de la explicación)
  ## Explicación               «Estado: …» en la primera línea si es un borrador
  ## Forma                     esquema, rimas (- a: …) y cada verso (- v1: 11 A · nota);
                               ### Figuras (notas por verso, capa forma) y ### Personas verbales (tabla)
                               «Escalonado: v15» = verso partido que empieza donde acaba el anterior
  ## Temas                     - Tema › subtema (y «Estado: …» si es una propuesta)
  ## Análisis del autor        fecha, nota, rasgos sobre 5 (Profundidad, Dureza, Pintar conceptos, Sonoridad),
                               párrafo y notas («Estado: provisional» mientras sea un borrador)
  - v1 y v5: texto             la misma nota en dos versos sueltos
  - v3 [sentido] (aviso): texto  el paréntesis sale como aviso pequeño en la nota

Imagen del poema (opcional) en imagenes/CODIGO.svg, .png o .jpg: sale bajo el poema.

Traducciones al inglés en traducciones/CODIGO.txt: primera línea el título y después el
poema línea a línea, con las mismas líneas (y huecos) que el original.
"""
import csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def secciones(md):
    cuerpo = re.sub(r"^---\n.*?\n---\n", "", md, flags=re.S)
    partes = re.split(r"^## +(.+)$", cuerpo, flags=re.M)
    return {partes[i].strip().lower(): partes[i + 1].strip() for i in range(1, len(partes), 2)}


CAPAS = ("forma", "sentido", "referencia")


def notas_por_verso(texto, autor):
    """- v3-4 [capa]: texto  ·  - "fragmento" [capa]: texto  (sin capa = sentido)"""
    notas = []
    for linea in texto.splitlines():
        m = re.match(r'^- *(?:v(\d+)(?:-(\d+))?(?: +y +v(\d+))?|"(.+?)") *(?:\[(\w+)\])? *(?:\(([^)]*)\))? *: *(.+)$', linea)
        if not m:
            continue
        capa = (m[5] or "sentido").lower()
        n = dict(capa=capa if capa in CAPAS else "sentido", autor=autor, texto=m[7].strip())
        if m[6]:
            n["aviso"] = m[6].strip()
        if m[4]:
            n["fragmento"] = m[4]
        else:
            n.update(desde=int(m[1]), hasta=int(m[2] or m[1]))
            if m[3]:
                # «v1 y v5»: la misma nota en los dos versos
                notas.append(dict(n, desde=int(m[3]), hasta=int(m[3])))
        notas.append(n)
    return notas


def claves(texto):
    """Líneas «Clave: valor» al principio de una sección."""
    d = {}
    for linea in texto.splitlines():
        m = re.match(r"^([A-ZÁÉÍÓÚ][\wáéíóúñ ]*): *(.+)$", linea)
        if m:
            d[m[1].strip().lower()] = m[2].strip()
    return d


def subsecciones(texto):
    """Lo que va antes del primer «### » y cada subsección por su título."""
    partes = re.split(r"^### +(.+)$", texto, flags=re.M)
    return partes[0], {partes[i].strip().lower(): partes[i + 1].strip() for i in range(1, len(partes), 2)}


def leer_tabla(texto):
    """Una tabla markdown y los párrafos de alrededor: {antes, filas (la primera es la cabecera), despues}."""
    antes, filas, despues = [], [], []
    for bloque in re.split(r"\n\s*\n", texto.strip()):
        lineas = [l for l in bloque.splitlines() if l.strip()]
        if lineas and all(l.strip().startswith("|") for l in lineas):
            for l in lineas:
                celdas = [c.strip() for c in l.strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", c) for c in celdas):
                    filas.append(celdas)
        else:
            (despues if filas else antes).append(" ".join(l.strip() for l in lineas))
    return dict(antes="\n\n".join(antes), filas=filas, despues="\n\n".join(despues)) if filas or antes else None


def leer_forma(texto):
    if not texto:
        return None
    texto, subs = subsecciones(texto)
    c = claves(texto)
    forma = dict(estado=c.get("estado", ""), estrofa=c.get("estrofa", ""), medida=c.get("medida", ""),
                 esquema=c.get("esquema", ""), rimas={}, versos={},
                 escalonados=[int(n) for n in re.findall(r"v(\d+)", c.get("escalonado", ""))])
    for linea in texto.splitlines():
        m = re.match(r"^- *v(\d+): *(\d+) +([A-Za-z-])(?: *· *(.+))?$", linea)
        if m:
            forma["versos"][m[1]] = dict(silabas=int(m[2]), rima=m[3], nota=m[4] or "")
            continue
        m = re.match(r"^- *([A-Za-z]): *(.+)$", linea)
        if m:
            forma["rimas"][m[1].lower()] = m[2].strip()
    forma["figuras"] = notas_por_verso(subs.get("figuras", ""), "claude")
    forma["personas"] = leer_tabla(subs.get("personas verbales", "")) if subs.get("personas verbales") else None
    return forma


RASGOS = ("profundidad", "dureza", "pintar conceptos", "sonoridad")
# «Interés» pasó a llamarse «Pintar conceptos» (Víctor, 2026-11-03); las fichas antiguas se leen igual
ALIAS_RASGOS = {"pintar conceptos": ("pintar conceptos", "interés")}


def leer_lectura(texto):
    """Análisis del autor: fecha, estado, nota, rasgos sobre 5, un párrafo y notas por verso."""
    if not texto:
        return None
    c = claves(texto)
    parrafos = [p.strip() for p in re.split(r"\n\s*\n", texto)
                if p.strip() and not re.match(r"^(- |[A-ZÁÉÍÓÚ][\wáéíóúñ ]*: )", p.strip())]
    nota = re.match(r"([\d.,]+)", c.get("nota", ""))
    rasgos = {}
    for r in RASGOS:
        valor = next((c[k] for k in ALIAS_RASGOS.get(r, (r,)) if k in c), "")
        m = re.match(r"(\d)", valor)
        if m:
            rasgos[r] = int(m[1])
    return dict(fecha=c.get("fecha", ""), estado=c.get("estado", ""), nota=nota[1] if nota else "", rasgos=rasgos,
                texto="\n\n".join(parrafos), anotaciones=notas_por_verso(texto, "provisional" if c.get("estado") else "autor"))


def leer_anotaciones(ruta):
    s = secciones(open(ruta, encoding="utf-8").read())
    notas = notas_por_verso(s.get("anotaciones por verso", ""), "victor")
    valoraciones = []
    for bloque in re.split(r"^### +", s.get("valoraciones", ""), flags=re.M)[1:]:
        cab, _, txt = bloque.partition("\n")
        m = re.match(r"(\d{4}-\d{2}-\d{2})(?:.*?nota: *([\d.,]+) */ *10)?", cab)
        if m:
            valoraciones.append(dict(fecha=m[1], nota=m[2], texto=txt.strip()))
    valoraciones.sort(key=lambda v: v["fecha"], reverse=True)
    explicacion = s.get("explicación", "")
    if explicacion.startswith("(Objetiva."):
        explicacion = ""
    # «Estado: borrador…» en la primera línea: aviso aparte, no texto
    m = re.match(r"^Estado: *(.+)\n+", explicacion)
    explicacion_estado = m[1].strip() if m else ""
    if m:
        explicacion = explicacion[m.end():].strip()
    temas_txt = s.get("temas", "")
    m = re.match(r"^Estado: *(.+)$", temas_txt, flags=re.M)
    temas = [dict(tema=t.strip(), sub=(sub or "").strip()) for t, sub in
             re.findall(r"^- *(.+?)(?: *[›>] *(.+))?$", temas_txt, flags=re.M)]
    forma = leer_forma(s.get("forma", ""))
    if forma:
        notas += forma.pop("figuras")
        # Las observaciones de cada verso también se ven como notas de la capa de forma
        notas += [dict(capa="forma", autor="claude", desde=int(v), hasta=int(v), texto=d["nota"], metro=True)
                  for v, d in forma["versos"].items() if d["nota"]]
    lectura = leer_lectura(s.get("análisis del autor", ""))
    return dict(historia=s.get("historia", ""), explicacion=explicacion, explicacion_estado=explicacion_estado,
                temas=dict(estado=re.sub(r" *\(ver [^)]*\)", "", m[1]).strip() if m else "", lista=temas) if temas else None,
                anotaciones=notas, valoraciones=valoraciones, forma=forma, lectura=lectura)


PUBLICOS = ["codigo", "titulo", "formato", "forma", "fecha_publicacion", "fecha_escritura", "fuente", "url",
            "idioma", "epoca", "tema", "etiquetas", "dedicatoria_pista", "subtitulo", "texto"]

piezas = []
for r in csv.DictReader(open(os.path.join(HERE, "datos", "catalogo.csv"), encoding="utf-8")):
    if r["formato"] == "otro" or not r["texto"]:
        continue
    p = {k: r.get(k, "") for k in PUBLICOS}
    p["etiquetas"] = [e for e in p["etiquetas"].split(";") if e]
    ruta = os.path.join(HERE, "anotaciones", r["codigo"] + ".md")
    p.update(leer_anotaciones(ruta) if os.path.exists(ruta) else dict(historia="", explicacion="", explicacion_estado="", temas=None, anotaciones=[], valoraciones=[], forma=None, lectura=None))
    # Imagen del poema, si la hay: imagenes/CODIGO.svg (o .png / .jpg)
    p["imagen"] = next((f"imagenes/{r['codigo']}.{ext}" for ext in ("svg", "png", "jpg")
                        if os.path.exists(os.path.join(HERE, "imagenes", f"{r['codigo']}.{ext}"))), "")
    trad = os.path.join(HERE, "traducciones", r["codigo"] + ".txt")
    if os.path.exists(trad):
        lineas = open(trad, encoding="utf-8").read().rstrip("\n").split("\n")
        if len(lineas) - 1 != len(p["texto"].split("\n")):
            raise SystemExit(f"{trad}: no tiene las mismas líneas que el original")
        p["titulo_en"], p["texto_en"] = lineas[0], "\n".join(lineas[1:])
    piezas.append(p)

def sin_autoria(x):
    """La web no nombra a Claude: «calculada por Claude el…» se queda en «calculada el…»."""
    if isinstance(x, str):
        return re.sub(r" +por Claude\b", "", x)
    if isinstance(x, list):
        return [sin_autoria(v) for v in x]
    if isinstance(x, dict):
        return {k: (sin_autoria(v) if k in ("estado", "aviso", "explicacion_estado") or not isinstance(v, str) else v)
                for k, v in x.items()}
    return x


piezas = [sin_autoria(p) for p in piezas]
piezas.sort(key=lambda p: p["fecha_escritura"] or p["fecha_publicacion"])
with open(os.path.join(HERE, "datos", "obra.json"), "w", encoding="utf-8") as fh:
    json.dump(piezas, fh, ensure_ascii=False, indent=1)
print(len(piezas), "piezas")

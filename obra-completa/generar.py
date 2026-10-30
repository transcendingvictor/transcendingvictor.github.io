"""Genera datos/obra.json a partir de datos/catalogo.csv y anotaciones/*.md.

    python obra-completa/generar.py

Formato de las anotaciones (ver anotaciones/_PLANTILLA.md):
  - v3-4: texto                anota los versos 3 y 4 (se cuentan solo las líneas con texto)
  - "fragmento": texto         anota ese trozo exacto del poema
  - v3 [forma]: texto          capa de la nota: forma, sentido (por defecto) o referencia
  ## Forma                     esquema, rimas (- a: …) y cada verso (- v1: 11 A · nota);
                               «Escalonado: v15» = verso partido que empieza donde acaba el anterior
  ## Lectura de Claude         borrador de Claude: nota, rasgos sobre 5, párrafo y notas
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
        m = re.match(r'^- *(?:v(\d+)(?:-(\d+))?|"(.+?)") *(?:\[(\w+)\])? *: *(.+)$', linea)
        if not m:
            continue
        capa = (m[4] or "sentido").lower()
        n = dict(capa=capa if capa in CAPAS else "sentido", autor=autor, texto=m[5].strip())
        if m[3]:
            n["fragmento"] = m[3]
        else:
            n.update(desde=int(m[1]), hasta=int(m[2] or m[1]))
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


def leer_forma(texto):
    if not texto:
        return None
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
    return forma


RASGOS = ("profundidad", "dureza", "interés", "sonoridad")


def leer_lectura(texto):
    """Lectura de Claude: estado, nota, rasgos sobre 5, un párrafo y notas por verso."""
    if not texto:
        return None
    c = claves(texto)
    parrafos = [p.strip() for p in re.split(r"\n\s*\n", texto)
                if p.strip() and not re.match(r"^(- |[A-ZÁÉÍÓÚ][\wáéíóúñ ]*: )", p.strip())]
    nota = re.match(r"([\d.,]+)", c.get("nota", ""))
    rasgos = {}
    for r in RASGOS:
        m = re.match(r"(\d)", c.get(r, ""))
        if m:
            rasgos[r] = int(m[1])
    return dict(estado=c.get("estado", ""), nota=nota[1] if nota else "", rasgos=rasgos,
                texto="\n\n".join(parrafos), anotaciones=notas_por_verso(texto, "claude"))


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
    forma = leer_forma(s.get("forma", ""))
    if forma:
        # Las observaciones de cada verso también se ven como notas de la capa de forma
        notas += [dict(capa="forma", autor="claude", desde=int(v), hasta=int(v), texto=d["nota"], metro=True)
                  for v, d in forma["versos"].items() if d["nota"]]
    lectura = leer_lectura(s.get("lectura de claude", ""))
    return dict(explicacion=explicacion, anotaciones=notas, valoraciones=valoraciones, forma=forma, lectura=lectura)


PUBLICOS = ["codigo", "titulo", "formato", "forma", "fecha_publicacion", "fecha_escritura", "fuente", "url",
            "idioma", "epoca", "tema", "etiquetas", "dedicatoria_pista", "subtitulo", "texto"]

piezas = []
for r in csv.DictReader(open(os.path.join(HERE, "datos", "catalogo.csv"), encoding="utf-8")):
    if r["formato"] == "otro" or not r["texto"]:
        continue
    p = {k: r.get(k, "") for k in PUBLICOS}
    p["etiquetas"] = [e for e in p["etiquetas"].split(";") if e]
    ruta = os.path.join(HERE, "anotaciones", r["codigo"] + ".md")
    p.update(leer_anotaciones(ruta) if os.path.exists(ruta) else dict(explicacion="", anotaciones=[], valoraciones=[], forma=None, lectura=None))
    piezas.append(p)

piezas.sort(key=lambda p: p["fecha_escritura"] or p["fecha_publicacion"])
with open(os.path.join(HERE, "datos", "obra.json"), "w", encoding="utf-8") as fh:
    json.dump(piezas, fh, ensure_ascii=False, indent=1)
print(len(piezas), "piezas")

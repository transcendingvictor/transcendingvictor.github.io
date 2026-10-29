"""Genera datos/obra.json a partir de datos/catalogo.csv y anotaciones/*.md.

    python obra-completa/generar.py

Formato de las anotaciones (ver anotaciones/_PLANTILLA.md):
  - v3-4: texto        anota los versos 3 y 4 (se cuentan solo las líneas con texto)
  - "fragmento": texto anota ese trozo exacto del poema
"""
import csv, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def secciones(md):
    cuerpo = re.sub(r"^---\n.*?\n---\n", "", md, flags=re.S)
    partes = re.split(r"^## +(.+)$", cuerpo, flags=re.M)
    return {partes[i].strip().lower(): partes[i + 1].strip() for i in range(1, len(partes), 2)}


def leer_anotaciones(ruta):
    s = secciones(open(ruta, encoding="utf-8").read())
    notas = []
    for linea in s.get("anotaciones por verso", "").splitlines():
        m = re.match(r'^- *v(\d+)(?:-(\d+))? *: *(.+)$', linea)
        if m:
            notas.append(dict(desde=int(m[1]), hasta=int(m[2] or m[1]), texto=m[3].strip()))
            continue
        m = re.match(r'^- *"(.+?)" *: *(.+)$', linea)
        if m:
            notas.append(dict(fragmento=m[1], texto=m[2].strip()))
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
    return dict(explicacion=explicacion, anotaciones=notas, valoraciones=valoraciones)


PUBLICOS = ["codigo", "titulo", "formato", "forma", "fecha_publicacion", "fecha_escritura", "fuente", "url",
            "idioma", "epoca", "tema", "etiquetas", "dedicatoria_pista", "subtitulo", "texto"]

piezas = []
for r in csv.DictReader(open(os.path.join(HERE, "datos", "catalogo.csv"), encoding="utf-8")):
    if r["formato"] == "otro" or not r["texto"]:
        continue
    p = {k: r.get(k, "") for k in PUBLICOS}
    p["etiquetas"] = [e for e in p["etiquetas"].split(";") if e]
    ruta = os.path.join(HERE, "anotaciones", r["codigo"] + ".md")
    p.update(leer_anotaciones(ruta) if os.path.exists(ruta) else dict(explicacion="", anotaciones=[], valoraciones=[]))
    piezas.append(p)

piezas.sort(key=lambda p: p["fecha_escritura"] or p["fecha_publicacion"])
with open(os.path.join(HERE, "datos", "obra.json"), "w", encoding="utf-8") as fh:
    json.dump(piezas, fh, ensure_ascii=False, indent=1)
print(len(piezas), "piezas")

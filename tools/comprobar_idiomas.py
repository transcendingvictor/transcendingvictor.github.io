"""Comprueba que cada texto en español (data-l="es") tiene su gemelo en inglés (data-l="en").

Uso: python tools/comprobar_idiomas.py spectator.html
"""
import sys
from html.parser import HTMLParser

VACIOS = {"img", "br", "meta", "link", "input", "hr", "source"}


class Comprobador(HTMLParser):
    def __init__(self):
        super().__init__()
        self.pila = [[]]
        self.errores = 0

    def handle_starttag(self, tag, attrs):
        self.pila[-1].append(dict(attrs).get("data-l"))
        if tag not in VACIOS:
            self.pila.append([])

    def handle_endtag(self, tag):
        if tag in VACIOS:
            return
        hijos = self.pila.pop()
        if hijos.count("es") != hijos.count("en"):
            linea, _ = self.getpos()
            print(f"línea {linea}: <{tag}> tiene {hijos.count('es')} es y {hijos.count('en')} en")
            self.errores += 1


for ruta in sys.argv[1:]:
    c = Comprobador()
    c.feed(open(ruta, encoding="utf-8").read())
    print(f"{ruta}: {'OK' if not c.errores else str(c.errores) + ' desajustes'}")

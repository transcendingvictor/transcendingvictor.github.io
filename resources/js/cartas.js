/* Baraja española en SVG, dibujada a mano para esta web (sin imágenes externas).
 * Con el aire de la baraja clásica tipo Fournier: palos en rojo, amarillo, azul y verde con
 * contorno negro, el marco con «pausas» (oros 0, copas 1, espadas 2, bastos 3) y las figuras
 * (sota 10, caballo 11, rey 12) dibujadas como figuras.
 *
 * Uso:
 *   Cartas.svg('12c')                    -> '<svg ...>' (rey de copas)
 *   Cartas.svg('9o', {estrella: true})   -> con estrellita (p. ej. la manilla)
 *   Cartas.svg('xb')                     -> hueco tachado (no tener bastos)
 *   Cartas.pintar(raiz, {estrella: [9]}) -> rellena cada [data-cards="9o 1c 12e"] dentro de raiz
 * Códigos: número (1-12) + palo (o oros, c copas, e espadas, b bastos). Un «*» final pone estrella.
 */
(function (w) {
    'use strict';
    var K = '#2b2118', R = '#c8312b', Y = '#f2c230', B = '#2f5fa8', G = '#3f8f4a', P = '#f6d3ad', BG = '#fffdf7';
    var NOMBRE = { o: 'oros', c: 'copas', e: 'espadas', b: 'bastos' };
    var FIG = { 1: 'as', 10: 'sota', 11: 'caballo', 12: 'rey' };
    var SW = 'stroke="' + K + '" stroke-width="1.2" stroke-linejoin="round"';

    // Cada palo, centrado en (0,0), unas 22 unidades de alto (espadas y bastos, 30).
    var PIP = {
        o: '<circle r="10" fill="' + Y + '" ' + SW + '/><circle r="6.2" fill="none" stroke="' + R + '" stroke-width="1.6"/><circle r="2.3" fill="' + B + '"/>',
        c: '<path d="M-8-9H8Q8 1 0 2Q-8 1-8-9Z" fill="' + Y + '" ' + SW + '/><rect x="-8.6" y="-11.5" width="17.2" height="3.4" rx="1" fill="' + R + '" ' + SW + '/>' +
           '<rect x="-1.4" y="2" width="2.8" height="6" fill="' + Y + '" ' + SW + '/><ellipse cy="4.6" rx="3" ry="1.5" fill="' + B + '" ' + SW + '/><path d="M-6.5 11Q0 5 6.5 11Z" fill="' + R + '" ' + SW + '/>',
        e: '<path d="M0-15L2.3-11V5H-2.3V-11Z" fill="#9fc0ea" ' + SW + '/><line x1="0" y1="-10" x2="0" y2="4" stroke="' + B + '" stroke-width="1"/>' +
           '<rect x="-6.5" y="5" width="13" height="2.8" rx="1.2" fill="' + Y + '" ' + SW + '/><rect x="-1.4" y="7.8" width="2.8" height="5.6" fill="' + R + '" ' + SW + '/><circle cy="14.4" r="1.9" fill="' + Y + '" ' + SW + '/>',
        b: '<path d="M-1.8 15L-3.6-9Q0-17 3.6-9L1.8 15Z" fill="' + G + '" ' + SW + '/><path d="M-3.4-4l-2.6-2M3.2 2l2.6-2M-2.6 8l-2.4-1.6" stroke="' + K + '" stroke-width="1.2" stroke-linecap="round"/>' +
           '<rect x="-2.4" y="9" width="4.8" height="2.4" fill="' + R + '" ' + SW + '/><circle cy="-11" r="1.2" fill="' + Y + '"/>'
    };
    function pip(s, x, y, k, rot) {
        return '<g transform="translate(' + x + ' ' + y + ')' + (rot ? ' rotate(' + rot + ')' : '') + (k !== 1 ? ' scale(' + k + ')' : '') + '">' + PIP[s] + '</g>';
    }

    // Dónde va cada oro / copa (x, y) según el número. Columnas 33/67 (o 29/50/71), filas en 150 de alto.
    var L = 33, Rr = 67;
    var REJ = {
        2: [[50, 47], [50, 105]],
        3: [[50, 42], [50, 76], [50, 110]],
        4: [[L, 48], [Rr, 48], [L, 104], [Rr, 104]],
        5: [[L, 45], [Rr, 45], [50, 76], [L, 107], [Rr, 107]],
        6: [[L, 43], [Rr, 43], [L, 76], [Rr, 76], [L, 109], [Rr, 109]],
        7: [[L, 40], [Rr, 40], [50, 58], [L, 76], [Rr, 76], [L, 112], [Rr, 112]],
        8: [[L, 40], [Rr, 40], [50, 58], [L, 76], [Rr, 76], [50, 94], [L, 112], [Rr, 112]],
        9: [[29, 43], [50, 43], [71, 43], [29, 76], [50, 76], [71, 76], [29, 109], [50, 109], [71, 109]]
    };
    function pips(s, n) {
        if (n === 1) {
            // El as: un palo grande en el centro (la espada y el basto, algo inclinados).
            return s === 'o' ? pip(s, 50, 76, 3) : s === 'c' ? pip(s, 50, 76, 2.9) : pip(s, 50, 76, 2.5, s === 'e' ? 0 : -14);
        }
        if (s === 'e' || s === 'b') {
            // Espadas y bastos: el 2 y el 3 cruzados en aspa, como en la baraja; del 4 al 9, en rejilla, inclinados.
            if (n === 2) return pip(s, 50, 76, 2.1, 32) + pip(s, 50, 76, 2.1, -32);
            if (n === 3) return pip(s, 50, 76, 2.1, 32) + pip(s, 50, 76, 2.1, -32) + pip(s, 50, 76, 2.1, 0);
            return REJ[n].map(function (p, i) {
                var k = n === 9 ? 0.95 : n >= 7 ? 1.05 : n >= 5 ? 1.2 : 1.35;
                return pip(s, p[0], p[1], k, p[0] < 50 ? 14 : p[0] > 50 ? -14 : 0);
            }).join('');
        }
        var k = n === 9 ? 0.98 : n >= 7 ? 0.98 : n >= 4 || n === 3 ? 1.3 : 1.5;
        return REJ[n].map(function (p) { return pip(s, p[0], p[1], k); }).join('');
    }

    // Color del traje según el palo, para que cada figura se distinga un poco.
    var ROPA = { o: [B, R], c: [R, B], e: [B, Y], b: [R, G] };

    function sota(s) {
        var c = ROPA[s];
        var mano = s === 'o' || s === 'c' ? pip(s, 29, 64, 1.05) : pip(s, 29, 74, 1.7, s === 'e' ? 0 : -8);
        return '<path d="M43 96h5v24h-5zM52 96h5v24h-5z" fill="' + c[1] + '" ' + SW + '/>' +
            '<ellipse cx="45" cy="121" rx="4.6" ry="2.2" fill="' + K + '"/><ellipse cx="55" cy="121" rx="4.6" ry="2.2" fill="' + K + '"/>' +
            '<path d="M40 49Q50 45 60 49L65 97H35Z" fill="' + c[0] + '" ' + SW + '/>' +
            '<rect x="37.6" y="70" width="25" height="3.4" fill="' + Y + '" ' + SW + '/>' +
            '<path d="M60 50L66 75" stroke="' + c[0] + '" stroke-width="5" stroke-linecap="round"/><circle cx="66" cy="77" r="2.6" fill="' + P + '" ' + SW + '/>' +
            '<path d="M41 51L32 66" stroke="' + c[0] + '" stroke-width="5" stroke-linecap="round"/>' +
            '<circle cx="50" cy="38" r="8" fill="' + P + '" ' + SW + '/>' +
            '<path d="M42 39Q41 30 50 30Q59 30 58 39Q55 34 50 34Q45 34 42 39Z" fill="#8a5426" ' + SW + '/>' +
            '<path d="M38 31Q50 23 62 31Q50 28 38 31Z" fill="' + c[1] + '" ' + SW + '/>' + mano;
    }
    function caballo(s) {
        var c = ROPA[s];
        var mano = s === 'o' || s === 'c' ? pip(s, 41, 52, 0.95) : pip(s, 39, 56, 1.3, -30);
        return '<path d="M78 95Q90 104 84 122" fill="none" stroke="#7a4a22" stroke-width="4" stroke-linecap="round"/>' +
            '<path d="M38 106h4.5v22H38zM46 106h4.5v22H46zM64 106h4.5v22H64zM72 106h4.5v22H72z" fill="#b9783f" ' + SW + '/>' +
            '<path d="M36 128h8M44 128h8M62 128h8M70 128h8" stroke="' + K + '" stroke-width="2.6"/>' +
            '<ellipse cx="57" cy="98" rx="23" ry="12" fill="#b9783f" ' + SW + '/>' +
            '<path d="M34 98L27 77L39 73L46 94Z" fill="#b9783f" ' + SW + '/>' +
            '<path d="M39 73L25 74L16 84L20 89L31 84L35 84Z" fill="#b9783f" ' + SW + '/><circle cx="27" cy="78" r="1.2" fill="' + K + '"/>' +
            '<path d="M36 72l2-6 3 6z" fill="#b9783f" ' + SW + '/><path d="M39 73Q46 80 46 94" fill="none" stroke="' + K + '" stroke-width="3"/>' +
            '<path d="M47 88h22l3 14H50Z" fill="' + c[1] + '" ' + SW + '/>' +
            '<path d="M55 86l-3 22h5l3-20z" fill="' + c[1] + '" ' + SW + '/><ellipse cx="54" cy="109" rx="4" ry="2" fill="' + K + '"/>' +
            '<path d="M52 62Q58 58 64 62L66 89H50Z" fill="' + c[0] + '" ' + SW + '/>' +
            '<path d="M53 65L42 54" stroke="' + c[0] + '" stroke-width="4.6" stroke-linecap="round"/>' +
            '<circle cx="58" cy="52" r="7" fill="' + P + '" ' + SW + '/>' +
            '<path d="M50 49Q58 39 66 49Q58 46 50 49Z" fill="' + Y + '" ' + SW + '/>' + mano;
    }
    function rey(s) {
        var c = ROPA[s];
        var mano = s === 'o' || s === 'c' ? pip(s, 71, 70, 1.15) : pip(s, 71, 78, 1.75, s === 'e' ? 0 : 8);
        return '<path d="M38 50Q50 45 62 50L71 122H29Z" fill="' + c[0] + '" ' + SW + '/>' +
            '<path d="M45 52h10v70H45z" fill="' + c[1] + '" ' + SW + '/>' +
            '<path d="M38 49Q50 55 62 49L63 54Q50 60 37 54Z" fill="#fff" ' + SW + '/>' +
            '<circle cx="44" cy="53" r=".9" fill="' + K + '"/><circle cx="50" cy="56" r=".9" fill="' + K + '"/><circle cx="56" cy="53" r=".9" fill="' + K + '"/>' +
            '<ellipse cx="42" cy="124" rx="5" ry="2.2" fill="' + K + '"/><ellipse cx="58" cy="124" rx="5" ry="2.2" fill="' + K + '"/>' +
            '<path d="M61 56L68 72" stroke="' + c[0] + '" stroke-width="5" stroke-linecap="round"/><circle cx="69" cy="75" r="2.6" fill="' + P + '" ' + SW + '/>' +
            '<circle cx="50" cy="37" r="8" fill="' + P + '" ' + SW + '/>' +
            '<path d="M42 38Q43 50 50 52Q57 50 58 38Q54 43 50 43Q46 43 42 38Z" fill="#efe9dd" ' + SW + '/>' +
            '<path d="M41 31V21L45.5 26L50 18L54.5 26L59 21V31Z" fill="' + Y + '" ' + SW + '/>' +
            '<circle cx="50" cy="27" r="1.5" fill="' + R + '"/><circle cx="44" cy="28.5" r="1.1" fill="' + B + '"/><circle cx="56" cy="28.5" r="1.1" fill="' + B + '"/>' + mano;
    }

    // Marco con pausas: huecos arriba y abajo según el palo.
    var PAUSAS = { o: [], c: [50], e: [38, 62], b: [30, 50, 70] };
    function marco(s) {
        var g = PAUSAS[s].map(function (x) {
            return '<rect x="' + (x - 3.5) + '" y="4" width="7" height="4" fill="' + BG + '"/><rect x="' + (x - 3.5) + '" y="142" width="7" height="4" fill="' + BG + '"/>';
        }).join('');
        return '<rect x="6" y="6" width="88" height="138" rx="4" fill="none" stroke="' + K + '" stroke-width="1.3"/>' + g;
    }

    function svg(code, o) {
        o = o || {};
        code = String(code).trim();
        var star = code.slice(-1) === '*';
        if (star) code = code.slice(0, -1);
        var s = code.slice(-1), r = code.slice(0, -1), cls = o.clase || 'bt-card';
        if (!PIP[s]) return '';
        if (r === 'x') {
            return '<svg class="' + cls + '" viewBox="0 0 100 150" aria-hidden="true"><rect x="2" y="2" width="96" height="146" rx="9" fill="#fffbea" stroke="#b89a3a" stroke-width="2.6" stroke-dasharray="8 6"/>' +
                '<g opacity=".25">' + pip(s, 50, 75, 1.8) + '</g><line x1="20" y1="128" x2="80" y2="22" stroke="#c0392b" stroke-width="5" stroke-linecap="round"/></svg>';
        }
        var n = parseInt(r, 10);
        if (!(n >= 1 && n <= 12)) return '';
        if (o.estrella === true || star || (Array.isArray(o.estrella) && o.estrella.indexOf(n) >= 0)) star = true;
        var cuerpo = n === 10 ? sota(s) : n === 11 ? caballo(s) : n === 12 ? rey(s) : pips(s, n);
        if (n >= 10) cuerpo = '<g transform="' + (n === 11 ? 'translate(50 70) scale(1.03)' : 'translate(50 76) scale(1.12)') + ' translate(-50 -76)">' + cuerpo + '</g>';
        var idx = '<text x="10" y="25" font-size="19" font-weight="700" font-family="Georgia,serif" fill="' + K + '">' + n + '</text>' +
            '<text x="90" y="140" font-size="19" font-weight="700" font-family="Georgia,serif" fill="' + K + '" text-anchor="end">' + n + '</text>';
        var est = star ? '<path d="M83 9l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="#e2b53b" stroke="#a87c12" stroke-width=".8"/>' : '';
        return '<svg class="' + cls + '" viewBox="0 0 100 150" aria-hidden="true"><rect x="1" y="1" width="98" height="148" rx="9" fill="' + BG + '" stroke="#c9bfa8" stroke-width="2"/>' +
            marco(s) + cuerpo + idx + est + '</svg>';
    }

    function nombre(code, lang) {
        code = String(code).trim().replace(/\*$/, '');
        var s = code.slice(-1), r = code.slice(0, -1), n = parseInt(r, 10);
        if (lang === 'en') {
            var EN = { o: 'coins', c: 'cups', e: 'swords', b: 'clubs' }, FEN = { 1: 'ace', 10: 'jack', 11: 'knight', 12: 'king' };
            return r === 'x' ? 'no ' + EN[s] : (FEN[n] || n) + ' of ' + EN[s];
        }
        return r === 'x' ? 'sin ' + NOMBRE[s] : (FIG[n] || n) + ' de ' + NOMBRE[s];
    }

    function pintar(raiz, o) {
        (raiz || document).querySelectorAll('[data-cards]').forEach(function (el) {
            var codes = el.dataset.cards.trim().split(/\s+/);
            el.innerHTML = codes.map(function (c) { return svg(c, o); }).join('');
            if (!el.closest('[role="img"]')) {
                el.setAttribute('role', 'img');
                el.setAttribute('aria-label', codes.map(function (c) { return nombre(c); }).join(', '));
            }
        });
    }

    w.Cartas = { svg: svg, pintar: pintar, nombre: nombre };
})(window);

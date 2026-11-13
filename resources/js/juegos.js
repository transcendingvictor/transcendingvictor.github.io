// Juegos de «Ven a jugar conmigo»: el metro de Madrid y la parábola.
(function () {
    var NS = 'http://www.w3.org/2000/svg';
    function es() { return document.documentElement.dataset.lang !== 'en'; }
    function mk(svg, tag, at, txt) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; }
    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

    /* ---------- Metro de Madrid ---------- */
    var LINEAS = {
        '1': ['#2DBEF0', 'Pinar de Chamartín|Bambú|Chamartín|Plaza de Castilla|Valdeacederas|Tetuán|Estrecho|Alvarado|Cuatro Caminos|Ríos Rosas|Iglesia|Bilbao|Tribunal|Gran Vía|Sol|Tirso de Molina|Antón Martín|Estación del Arte|Atocha|Menéndez Pelayo|Pacífico|Puente de Vallecas|Nueva Numancia|Portazgo|Buenos Aires|Alto del Arenal|Miguel Hernández|Sierra de Guadalupe|Villa de Vallecas|Congosto|La Gavia|Las Suertes|Valdecarros'],
        '2': ['#ED1C24', 'Las Rosas|Avenida de Guadalajara|Alsacia|La Almudena|La Elipa|Ventas|Manuel Becerra|Goya|Príncipe de Vergara|Retiro|Banco de España|Sevilla|Sol|Ópera|Santo Domingo|Noviciado|San Bernardo|Quevedo|Canal|Cuatro Caminos'],
        '3': ['#FFD000', 'Moncloa|Argüelles|Ventura Rodríguez|Plaza de España|Callao|Sol|Lavapiés|Embajadores|Palos de la Frontera|Delicias|Legazpi|Almendrales|Hospital 12 de Octubre|San Fermín-Orcasur|Ciudad de los Ángeles|Villaverde Bajo-Cruce|San Cristóbal|Villaverde Alto|El Casar'],
        '4': ['#B65518', 'Argüelles|San Bernardo|Bilbao|Alonso Martínez|Colón|Serrano|Velázquez|Goya|Lista|Diego de León|Avenida de América|Prosperidad|Alfonso XIII|Avenida de la Paz|Arturo Soria|Esperanza|Canillas|Mar de Cristal|San Lorenzo|Parque de Santa María|Hortaleza|Manoteras|Pinar de Chamartín'],
        '5': ['#8FD400', 'Alameda de Osuna|El Capricho|Canillejas|Torre Arias|Suanzes|Ciudad Lineal|Pueblo Nuevo|Quintana|El Carmen|Ventas|Diego de León|Núñez de Balboa|Rubén Darío|Alonso Martínez|Chueca|Gran Vía|Callao|Ópera|La Latina|Puerta de Toledo|Acacias|Pirámides|Marqués de Vadillo|Urgel|Oporto|Vista Alegre|Carabanchel|Eugenia de Montijo|Aluche|Empalme|Campamento|Casa de Campo'],
        '6': ['#98989B', 'Laguna|Carpetana|Oporto|Opañel|Plaza Elíptica|Usera|Legazpi|Arganzuela-Planetario|Méndez Álvaro|Pacífico|Conde de Casal|Sainz de Baranda|O\'Donnell|Manuel Becerra|Diego de León|Avenida de América|República Argentina|Nuevos Ministerios|Cuatro Caminos|Guzmán el Bueno|Vicente Aleixandre|Ciudad Universitaria|Moncloa|Argüelles|Príncipe Pío|Puerta del Ángel|Alto de Extremadura|Lucero|Laguna'],
        '7': ['#EE7518', 'Estadio Metropolitano|Las Musas|San Blas|Simancas|García Noblejas|Ascao|Pueblo Nuevo|Barrio de la Concepción|Parque de las Avenidas|Cartagena|Avenida de América|Gregorio Marañón|Alonso Cano|Canal|Islas Filipinas|Guzmán el Bueno|Francos Rodríguez|Valdezarza|Antonio Machado|Peñagrande|Avenida de la Ilustración|Lacoma|Arroyofresno|Pitis'],
        '8': ['#EC82B1', 'Nuevos Ministerios|Colombia|Pinar del Rey|Mar de Cristal|Feria de Madrid|Aeropuerto T1-T2-T3|Barajas|Aeropuerto T4'],
        '9': ['#A60084', 'Paco de Lucía|Mirasierra|Herrera Oria|Barrio del Pilar|Ventilla|Plaza de Castilla|Duque de Pastrana|Pío XII|Colombia|Concha Espina|Cruz del Rayo|Avenida de América|Núñez de Balboa|Príncipe de Vergara|Ibiza|Sainz de Baranda|Estrella|Vinateros|Artilleros|Pavones|Valdebernardo|Vicálvaro|San Cipriano|Puerta de Arganda'],
        '10': ['#005AA9', 'Tres Olivos|Fuencarral|Begoña|Chamartín|Plaza de Castilla|Cuzco|Santiago Bernabéu|Nuevos Ministerios|Gregorio Marañón|Alonso Martínez|Tribunal|Plaza de España|Príncipe Pío|Lago|Batán|Casa de Campo|Colonia Jardín|Aviación Española|Cuatro Vientos|Joaquín Vilumbrales|Puerta del Sur'],
        '11': ['#009B3A', 'Plaza Elíptica|Abrantes|Pan Bendito|San Francisco|Carabanchel Alto|La Peseta|La Fortuna']
    };
    // Posición aproximada (km desde Sol: x al este, y al norte) de cruces y cabeceras; el resto se reparte entre ellas.
    var POS = {
        'Sol': [0, 0], 'Ópera': [-0.8, 0.1], 'Callao': [-0.4, 0.5], 'Gran Vía': [0.1, 0.6], 'Tribunal': [0.2, 1.3], 'Bilbao': [0.5, 1.7], 'Alonso Martínez': [0.9, 1.3],
        'Banco de España': [1, 0.3], 'Plaza de España': [-1, 1], 'San Bernardo': [-0.1, 1.8], 'Argüelles': [-1, 1.9], 'Moncloa': [-1.3, 2.5], 'Príncipe Pío': [-1.6, 0.7],
        'Canal': [0, 2.6], 'Cuatro Caminos': [0.3, 3.1], 'Guzmán el Bueno': [-0.5, 3.1], 'Nuevos Ministerios': [1.4, 3.4], 'Gregorio Marañón': [1.3, 2.4],
        'Núñez de Balboa': [2.1, 1.9], 'Diego de León': [2.4, 2.4], 'Avenida de América': [2.3, 3], 'Goya': [2.4, 1.1], 'Príncipe de Vergara': [2.2, 0.8],
        'Manuel Becerra': [3, 1.4], 'Ventas': [3.7, 1.5], 'Pueblo Nuevo': [5.6, 2.6], 'Mar de Cristal': [6, 5.8], 'Pinar de Chamartín': [3.5, 7.2], 'Colombia': [2.8, 4.6],
        'Plaza de Castilla': [1.4, 6], 'Chamartín': [2.4, 6.6], 'Tres Olivos': [1.6, 9.5], 'Paco de Lucía': [-1.8, 8.1], 'Pitis': [-3.5, 7.5],
        'Estación del Arte': [0.9, -0.9], 'Atocha': [1.3, -1.2], 'Pacífico': [2.6, -1.2], 'Valdecarros': [6.5, -6.5], 'Sainz de Baranda': [3.3, 0.2],
        'Legazpi': [0.6, -2.4], 'Plaza Elíptica': [-0.4, -3.3], 'Oporto': [-1.7, -3], 'Laguna': [-3, -2.2], 'Casa de Campo': [-5, -1.6], 'Puerta del Sur': [-6.5, -6],
        'El Casar': [0.5, -7.5], 'La Fortuna': [-5.5, -5], 'Las Rosas': [7, 0.5], 'Alameda de Osuna': [8.5, 6], 'Estadio Metropolitano': [8, 3],
        'Aeropuerto T4': [9, 9], 'Puerta de Arganda': [8, -1.5], 'Retiro': [1.7, 0.5], 'La Latina': [-0.5, -0.3], 'Embajadores': [0, -1]
    };
    var EST = {}, TRAZOS = {};
    Object.keys(LINEAS).forEach(function (n) {
        var st = LINEAS[n][1].split('|'), pts = [], i, j;
        var anc = []; st.forEach(function (s, k) { if (POS[s]) anc.push(k); });
        for (i = 0; i < st.length; i++) {
            if (POS[st[i]]) pts[i] = POS[st[i]];
            else { var a = anc.filter(function (k) { return k < i; }).pop(), b = anc.filter(function (k) { return k > i; })[0], t = (i - a) / (b - a);
                pts[i] = [POS[st[a]][0] + t * (POS[st[b]][0] - POS[st[a]][0]), POS[st[a]][1] + t * (POS[st[b]][1] - POS[st[a]][1])]; }
            (EST[st[i]] = EST[st[i]] || { p: pts[i], l: {} }).l[n] = true;
        }
        TRAZOS[n] = pts;
    });
    var NOMBRES = Object.keys(EST).sort(function (a, b) { return a.localeCompare(b, 'es'); });
    function cruces(a, b) { return NOMBRES.filter(function (s) { return EST[s].l[a] && EST[s].l[b]; }); }

    var mt = document.getElementById('mt'); if (mt) {
        var svgM = document.getElementById('mt-svg'), q = document.getElementById('mt-q'), lista = document.getElementById('mt-res'),
            elegidas = document.getElementById('mt-sel'), ok = document.getElementById('mt-ok'), sig = document.getElementById('mt-next'),
            msgM = document.getElementById('mt-msg'), pregunta = document.getElementById('mt-preg'), PREG = 5;
        var ronda = 0, aciertos = 0, par = null, sel = [], hecho = false;
        // x: -7..10, y: -8..10 (km) → viewBox 0..340 × 0..360
        function X(p) { return 20 + (p[0] + 7) * 18; } function Y(p) { return 20 + (10 - p[1]) * 18; }
        function chip(n) { return '<span class="mt-l" style="--c:' + LINEAS[n][0] + '">' + n + '</span>'; }
        function mapa(resaltar) {
            svgM.innerHTML = '';
            Object.keys(TRAZOS).forEach(function (n) {
                var on = !resaltar || resaltar.indexOf(n) >= 0;
                mk(svgM, 'polyline', { points: TRAZOS[n].map(function (p) { return X(p).toFixed(1) + ',' + Y(p).toFixed(1); }).join(' '), fill: 'none', stroke: LINEAS[n][0],
                    'stroke-width': on ? 5 : 3, opacity: on ? 1 : (resaltar ? 0.12 : 0.85), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
            });
            if (resaltar) resaltar.forEach(function (n) { TRAZOS[n].forEach(function (p) { mk(svgM, 'circle', { cx: X(p), cy: Y(p), r: 2.2, fill: '#fff', stroke: LINEAS[n][0], 'stroke-width': 1.2 }); }); });
        }
        function nueva() {
            var ks = Object.keys(LINEAS), a = ks[Math.floor(Math.random() * ks.length)], b;
            do { b = ks[Math.floor(Math.random() * ks.length)]; } while (b === a);
            par = [a, b].sort(function (x, y) { return x - y; }); sel = []; hecho = false; q.value = ''; q.disabled = false; lista.innerHTML = '';
            pregunta.innerHTML = (es() ? 'Pregunta ' : 'Question ') + (ronda + 1) + '/' + PREG + ': ' + (es() ? '¿en qué estaciones se cruzan las líneas ' : 'at which stations do lines ') + chip(par[0]) + (es() ? ' y ' : ' and ') + chip(par[1]) + (es() ? '?' : ' cross?');
            msgM.textContent = es() ? 'Escribe y elige las estaciones. Si crees que no se cruzan, dale directamente a «Ya está».' : 'Type and pick the stations. If you think they never cross, just press «Done».';
            ok.hidden = false; sig.hidden = true; pintarSel(); mapa(null);
        }
        function pintarSel() {
            elegidas.innerHTML = '';
            sel.forEach(function (s) { var b = document.createElement('button'); b.type = 'button'; b.className = 'mt-chip'; b.textContent = s + ' ×';
                b.onclick = function () { if (hecho) return; sel.splice(sel.indexOf(s), 1); pintarSel(); }; elegidas.appendChild(b); });
        }
        q.addEventListener('input', function () {
            lista.innerHTML = ''; var t = norm(q.value.trim()); if (t.length < 3) return;
            var m = NOMBRES.filter(function (s) { return norm(s).indexOf(t) >= 0 && sel.indexOf(s) < 0; });
            m.sort(function (a, b) { return (norm(b) === t) - (norm(a) === t) || (norm(b).indexOf(t) === 0) - (norm(a).indexOf(t) === 0); });
            m.slice(0, 6).forEach(function (s) { var li = document.createElement('li'); var b = document.createElement('button'); b.type = 'button'; b.textContent = s;
                b.onclick = function () { sel.push(s); q.value = ''; lista.innerHTML = ''; pintarSel(); q.focus(); }; li.appendChild(b); lista.appendChild(li); });
        });
        ok.addEventListener('click', function () {
            if (hecho) return; hecho = true; q.disabled = true; lista.innerHTML = '';
            var bien = cruces(par[0], par[1]), acert = sel.filter(function (s) { return bien.indexOf(s) >= 0; }), mal = sel.filter(function (s) { return bien.indexOf(s) < 0; });
            var perfecto = acert.length === bien.length && !mal.length; if (perfecto) aciertos++;
            mapa(par);
            bien.forEach(function (s) { var p = EST[s].p; mk(svgM, 'circle', { cx: X(p), cy: Y(p), r: 6, fill: '#fff', stroke: '#1c1c1c', 'stroke-width': 2.5 });
                var t = mk(svgM, 'text', { x: X(p) + 9, y: Y(p) + 4, 'font-size': 11, 'font-weight': 700, fill: '#1c1c1c', stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' }, s); });
            var txt = (bien.length === 0 ? (es() ? 'No se cruzan nunca.' : 'They never cross.') :
                (es() ? 'Se cruzan ' + (bien.length === 1 ? 'una vez: ' : bien.length + ' veces: ') : 'They cross ' + (bien.length === 1 ? 'once: ' : bien.length + ' times: ') ) + bien.join(', ') + '.');
            txt = (perfecto ? (es() ? '¡Perfecto! ' : 'Perfect! ') : (es() ? 'Casi. ' : 'Not quite. ')) + txt;
            if (mal.length) txt += ' ' + (es() ? 'Sobraban: ' : 'Not crossings: ') + mal.join(', ') + '.';
            ronda++;
            if (ronda >= PREG) { txt += ' ' + (es() ? 'Partida terminada: ' + aciertos + ' de ' + PREG + ' perfectas.' : 'Game over: ' + aciertos + ' of ' + PREG + ' perfect.'); ronda = 0; aciertos = 0; }
            msgM.textContent = txt; ok.hidden = true; sig.hidden = false;
        });
        sig.addEventListener('click', nueva);
        nueva();
    }

    /* ---------- La parábola ---------- */
    var pb = document.getElementById('pb'); if (pb) {
        var svgP = document.getElementById('pb-svg'), msgP = document.getElementById('pb-msg'), sigP = document.getElementById('pb-next'), preP = document.getElementById('pb-preg');
        var X0 = -10, X1 = 10, Y0 = -3, Y1 = 15, W = 300, H = 260, tiros = 0, sumaP = 0, P = null, listo = false;
        function sx(x) { return (x - X0) / (X1 - X0) * W; } function sy(y) { return H - (y - Y0) / (Y1 - Y0) * H; }
        function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
        function fmt(v) { return (Math.round(v * 10) / 10).toString().replace('.', es() ? ',' : '.'); }
        function nuevaP() {
            svgP.innerHTML = ''; listo = false; sigP.hidden = true;
            var h = ri(-3, 3), k = ri(-2, 3), lado = Math.random() < 0.5 ? 1 : -1, d = ri(1, 3), a = [0.5, 1, 1.5, 2][ri(0, 3)];
            while (k + a * d * d > 12) d--;
            var yObj; do { yObj = ri(k + 1, 13); } while (Math.abs(yObj - (k + a * d * d)) < 1);
            var xObj = h + lado * Math.sqrt((yObj - k) / a);
            if (Math.abs(xObj) > 9.5) return nuevaP();
            P = { h: h, k: k, a: a, px: h + lado * d, py: k + a * d * d, y: yObj, x: xObj, lado: lado };
            for (var g = X0; g <= X1; g++) mk(svgP, 'line', { x1: sx(g), x2: sx(g), y1: 0, y2: H, stroke: g === 0 ? '#1c1c1c' : '#e4e2d8', 'stroke-width': g === 0 ? 1.2 : 0.6 });
            for (g = Y0; g <= Y1; g++) mk(svgP, 'line', { y1: sy(g), y2: sy(g), x1: 0, x2: W, stroke: g === 0 ? '#1c1c1c' : '#e4e2d8', 'stroke-width': g === 0 ? 1.2 : 0.6 });
            mk(svgP, 'line', { x1: 0, x2: W, y1: sy(yObj), y2: sy(yObj), stroke: '#8a4fa8', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
            mk(svgP, 'circle', { cx: sx(h), cy: sy(k), r: 4.5, fill: '#1c1c1c' });
            mk(svgP, 'text', { x: sx(h) + 6, y: sy(k) + 14, 'font-size': 11, fill: '#1c1c1c' }, 'V(' + h + ', ' + k + ')');
            mk(svgP, 'circle', { cx: sx(P.px), cy: sy(P.py), r: 4.5, fill: '#2d7fb8' });
            mk(svgP, 'text', { x: sx(P.px) + (lado > 0 ? 6 : -6), y: sy(P.py) - 6, 'font-size': 11, fill: '#2d7fb8', 'text-anchor': lado > 0 ? 'start' : 'end' }, 'P(' + P.px + ', ' + fmt(P.py) + ')');
            preP.innerHTML = es() ? 'Una parábola que mira hacia arriba tiene el vértice en <b>V</b> y pasa por <b>P</b>. ¿Dónde corta la línea morada <b>y = ' + yObj + '</b>, ' + (lado > 0 ? 'a la derecha' : 'a la izquierda') + ' del vértice? Toca ese punto.'
                : 'An upward parabola has its vertex at <b>V</b> and passes through <b>P</b>. Where does it meet the purple line <b>y = ' + yObj + '</b>, to the ' + (lado > 0 ? 'right' : 'left') + ' of the vertex? Tap that point.';
            msgP.textContent = '';
        }
        svgP.addEventListener('click', function (ev) {
            if (listo) return; listo = true;
            var pt = svgP.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; var m = pt.matrixTransform(svgP.getScreenCTM().inverse());
            var xu = X0 + m.x / W * (X1 - X0), dx = Math.abs(xu - P.x), ancho = Math.abs(P.x - P.h);
            var pts = Math.max(0, Math.round(100 * (1 - dx / ancho)));
            var dd = ''; for (var x = X0; x <= X1; x += 0.1) { var y = P.k + P.a * (x - P.h) * (x - P.h); if (y <= Y1 + 1) dd += (dd ? ' L' : 'M') + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1); }
            mk(svgP, 'path', { d: dd, fill: 'none', stroke: '#2d7fb8', 'stroke-width': 2 });
            mk(svgP, 'line', { x1: sx(xu), x2: sx(P.x), y1: sy(P.y), y2: sy(P.y), stroke: '#d14b4b', 'stroke-width': 3 });
            mk(svgP, 'circle', { cx: sx(P.x), cy: sy(P.y), r: 5, fill: '#1c1c1c' });
            mk(svgP, 'circle', { cx: sx(xu), cy: sy(P.y), r: 5, fill: '#d14b4b', stroke: '#fff', 'stroke-width': 1.5 });
            tiros++; sumaP += pts;
            var ec = 'y = ' + fmt(P.a) + '(x ' + (P.h < 0 ? '+ ' + (-P.h) : '− ' + P.h) + ')² ' + (P.k < 0 ? '− ' + (-P.k) : '+ ' + P.k);
            msgP.textContent = (es() ? 'Era x = ' + fmt(P.x) + ' y has dicho ' + fmt(xu) + ': +' + pts + ' puntos. La parábola: ' : 'It was x = ' + fmt(P.x) + ' and you said ' + fmt(xu) + ': +' + pts + ' points. The parabola: ') + ec + '. ' +
                (es() ? 'Media: ' : 'Average: ') + Math.round(sumaP / tiros) + (es() ? ' en ' + tiros + (tiros === 1 ? ' tiro.' : ' tiros.') : ' over ' + tiros + (tiros === 1 ? ' throw.' : ' throws.'));
            sigP.hidden = false;
        });
        sigP.addEventListener('click', nuevaP);
        nuevaP();
    }
})();

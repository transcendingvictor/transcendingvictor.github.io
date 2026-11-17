# -*- coding: utf-8 -*-
"""Genera veganismo.html (Recursos → Veganismo) a partir de los datos de este archivo.

Uso: python3 tools/generar_veganismo.py
Para añadir un plato: añade una entrada a PLATOS (con "foto" cuando la haya, en resources/img/veganismo/platos/).
"""
import html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
e = html.escape

def L(es, en, tag="span"):
    return f'<{tag} data-l="es">{es}</{tag}><{tag} data-l="en">{en}</{tag}>'

NR = L('<span class="tc-nr">No revisado</span>', '<span class="tc-nr">Not reviewed</span>')

# ---------------------------------------------------------------- Para empezar
SI = [
    (("De tapas", "Tapas"), [
        ("Aceitunas", "Olives"),
        ("Patatas bravas <small>(la brava suele ser pimentón, aceite y harina; ojo si la mezclan con alioli de bote)</small>", "Patatas bravas <small>(the brava sauce is usually paprika, oil and flour; watch out if it's mixed with jarred aioli)</small>"),
        ("Pimientos de Padrón", "Padrón peppers"),
        ("Pan con tomate y aceite", "Bread with tomato and olive oil"),
        ("Champiñones al ajillo", "Garlic mushrooms"),
        ("Berenjenas fritas con miel de caña <small>(es de caña de azúcar, no de abeja)</small>", "Fried aubergine with cane honey <small>(it's sugar cane molasses, nothing to do with bees)</small>"),
        ("Hummus", "Hummus"),
        ("Almendras, cacahuetes y frutos secos", "Almonds, peanuts and other nuts"),
        ("Patatas fritas de bolsa <small>(casi todas: patata, aceite y sal)</small>", "Crisps <small>(most of them: potato, oil and salt)</small>"),
    ]),
    (("Platos", "Dishes"), [
        ("Gazpacho", "Gazpacho"),
        ("Salmorejo <small>(sin el huevo ni el jamón de encima)</small>", "Salmorejo <small>(without the egg and ham on top)</small>"),
        ("Ajoblanco", "Ajoblanco (cold almond and garlic soup)"),
        ("Paella de verduras <small>(con caldo de verduras)</small>", "Vegetable paella <small>(made with vegetable stock)</small>"),
        ("Lentejas estofadas <small>(sin chorizo)</small>", "Lentil stew <small>(without chorizo)</small>"),
        ("Garbanzos con espinacas", "Chickpeas with spinach"),
        ("Pisto", "Pisto (Spanish ratatouille)"),
        ("Escalivada", "Escalivada (roasted peppers, aubergine and onion)"),
        ("Patatas a lo pobre", "Patatas a lo pobre (slow-fried potatoes, onion and pepper)"),
        ("Espinacas a la catalana <small>(con pasas y piñones)</small>", "Catalan spinach <small>(with raisins and pine nuts)</small>"),
        ("Calçots con salsa romesco", "Calçots with romesco sauce"),
        ("Migas <small>(sin chorizo ni panceta)</small>", "Migas <small>(without chorizo or bacon)</small>"),
        ("Espaguetis con tomate <small>(la pasta seca de siempre es harina y agua)</small>", "Spaghetti with tomato sauce <small>(ordinary dried pasta is just flour and water)</small>"),
        ("Menestra de verduras <small>(sin jamón)</small>", "Menestra, mixed vegetable stew <small>(without ham)</small>"),
    ]),
    (("Desayunos y dulces", "Breakfast and sweet things"), [
        ("Tostada con aceite y tomate", "Toast with olive oil and tomato"),
        ("Churros <small>(la masa es harina, agua y sal; el chocolate a la taza suele llevar leche)</small>", "Churros <small>(the dough is flour, water and salt; the thick hot chocolate usually has milk)</small>"),
        ("Fruta, membrillo, dátiles", "Fruit, quince paste, dates"),
        ("Chocolate negro <small>(muchos; mira que no ponga leche en los ingredientes)</small>", "Dark chocolate <small>(many are; check milk isn't in the ingredients)</small>"),
        ("Galletas Oreo <small>(por receta; «puede contener leche» es por trazas)</small>", "Oreo biscuits <small>(by recipe; “may contain milk” is about traces)</small>"),
        ("Café solo, o con bebida de avena o soja", "Black coffee, or with oat or soya milk"),
    ]),
    (("Bebidas", "Drinks"), [
        ("Cerveza", "Beer"),
        ("Vino y sangría <small>(casi siempre; mira las preguntas)</small>", "Wine and sangria <small>(nearly always; see the questions)</small>"),
        ("Tinto de verano", "Tinto de verano"),
        ("Horchata <small>(chufa, agua y azúcar)</small>", "Horchata <small>(tiger nut, water and sugar)</small>"),
        ("Zumos y refrescos", "Juices and soft drinks"),
    ]),
]

NO = [
    ("Carne y embutido, también el taquito de jamón por encima", "Meat and cured meats, including the little cubes of ham sprinkled on top"),
    ("Pescado y marisco, también el atún y las anchoas de la ensalada", "Fish and seafood, including the tuna and anchovies in the salad"),
    ("Huevo: tortilla de patatas, mayonesa, alioli de bote, rebozados con huevo", "Egg: Spanish omelette, mayonnaise, jarred aioli, egg batter"),
    ("Leche, queso, mantequilla, nata y yogur", "Milk, cheese, butter, cream and yoghurt"),
    ("Bechamel, y por tanto las croquetas de siempre", "Béchamel, so ordinary croquetas too"),
    ("Miel", "Honey"),
    ("Caldos de pollo o de pescado: muchos arroces, sopas y cocidos de restaurante", "Chicken or fish stock: many restaurant rice dishes, soups and stews"),
    ("Manteca de cerdo: polvorones, mantecados, algunas masas", "Lard: polvorones, mantecados, some pastry"),
    ("Gelatina: gominolas, nubes, panna cotta", "Gelatine: gummy sweets, marshmallows, panna cotta"),
    ("Pasta fresca al huevo", "Fresh egg pasta"),
    ("Bollería con mantequilla o huevo: cruasanes, magdalenas", "Pastries made with butter or egg: croissants, magdalenas"),
]

FACIL = [
    ("Tortilla de patatas → con harina de garbanzo en vez de huevo", "Spanish omelette → chickpea flour instead of egg"),
    ("Croquetas → bechamel con bebida de avena y aceite", "Croquetas → béchamel made with oat milk and olive oil"),
    ("Mayonesa → «mayonesa» de bebida de soja y aceite (se monta igual)", "Mayonnaise → soya milk and oil “mayo” (it emulsifies the same way)"),
    ("Alioli → el tradicional, solo ajo y aceite, ya es vegano", "Aioli → the traditional one, just garlic and oil, is already vegan"),
]

# ---------------------------------------------------------------- Preguntas
FAQ = [
    ("¿Y las proteínas?", "What about protein?",
     "Lentejas, garbanzos, alubias, tofu, soja texturizada, seitán, frutos secos y cereales. Con legumbres casi todos los días va sobrado. No hace falta combinarlas en el mismo plato.",
     "Lentils, chickpeas, beans, tofu, textured soya, seitan, nuts and grains. Pulses most days is more than enough. There's no need to combine them in the same meal."),
    ("¿Y la vitamina B12?", "What about vitamin B12?",
     "Esta es la importante: hay que tomarla en suplemento, sí o sí. Es una pastilla o unas gotas, diaria o semanal según la dosis. Es barata y se compra en cualquier farmacia; el farmacéutico o el médico te dicen la pauta.",
     "This is the important one: you have to take it as a supplement, no exceptions. It's a pill or a few drops, daily or weekly depending on the dose. It's cheap and every chemist sells it; the pharmacist or your GP will tell you how much."),
    ("¿Y el hierro, el calcio, el omega 3?", "And iron, calcium, omega-3?",
     "Hierro: legumbres, frutos secos y verdura de hoja; con algo de vitamina C (un poco de limón, pimiento, fruta) se absorbe mejor. Calcio: bebidas vegetales enriquecidas, tofu, almendras, sésamo. Omega 3: nueces, lino y chía. Yodo: sal yodada. Vitamina D: el sol, como todo el mundo.",
     "Iron: pulses, nuts and leafy greens; a bit of vitamin C (lemon, peppers, fruit) helps you absorb it. Calcium: fortified plant milks, tofu, almonds, sesame. Omega-3: walnuts, flax and chia. Iodine: iodised salt. Vitamin D: the sun, same as everyone."),
    ("¿Es sano?", "Is it healthy?",
     'La Academia de Nutrición y Dietética de Estados Unidos, la asociación de dietistas más grande del mundo, dice que una alimentación vegana bien planificada es saludable y suficiente en todas las etapas de la vida, también en el embarazo, en niños y en deportistas (<a href="https://pubmed.ncbi.nlm.nih.gov/27886704/" target="_blank" rel="noopener">su postura, 2016</a>). «Bien planificada» quiere decir, sobre todo, con B12.',
     'The Academy of Nutrition and Dietetics, the largest dietitians\' association in the world, says a well-planned vegan diet is healthy and adequate at every stage of life, including pregnancy, childhood and for athletes (<a href="https://pubmed.ncbi.nlm.nih.gov/27886704/" target="_blank" rel="noopener">their position paper, 2016</a>). “Well-planned” mostly means: with B12.'),
    ("¿No es caro?", "Isn't it expensive?",
     "Lo básico (legumbres, arroz, pasta, pan, verdura, fruta, aceite) es de lo más barato del súper. Lo caro son las hamburguesas vegetales y los sustitutos, y no hacen falta.",
     "The basics (pulses, rice, pasta, bread, vegetables, fruit, olive oil) are some of the cheapest things in the supermarket. The pricey bits are the plant-based burgers and substitutes, and you don't need them."),
    ("¿Y el pescado? ¿Y la miel? ¿Y los huevos de mis gallinas?", "What about fish? Honey? Eggs from my own hens?",
     "Tampoco. Vegano es no usar nada que salga de un animal, y peces, abejas y gallinas lo son.",
     "Those aren't either. Vegan means using nothing that comes from an animal, and fish, bees and hens are animals."),
    ("¿Se puede comer fuera?", "Can you eat out?",
     "Sí. Casi cualquier bar tiene algo: bravas, pimientos, pan con tomate, ensalada sin atún ni huevo. Pide «sin queso» o «sin jamón», y en los arroces pregunta por el caldo. Los restaurantes indios, libaneses, asiáticos e italianos (pasta con tomate, pizza sin queso) lo ponen muy fácil.",
     "Yes. Almost any Spanish bar has something: bravas, padrón peppers, pan con tomate, a salad without tuna or egg. Ask for it “without cheese” or “without ham”, and with rice dishes ask what stock they used. Indian, Lebanese, Asian and Italian places (tomato pasta, pizza without cheese) make it really easy."),
    ("¿Y si pone «puede contener trazas de leche»?", "What if it says “may contain traces of milk”?",
     "Es un aviso para alérgicos: en la fábrica se usa leche en otras cosas. El producto no la lleva como ingrediente, así que cuenta como vegano.",
     "That's a warning for people with allergies: the factory handles milk for other products. It isn't an ingredient, so it counts as vegan."),
    ("¿El vino y la cerveza son veganos?", "Are wine and beer vegan?",
     "Casi siempre. Algunos vinos se clarifican con clara de huevo, caseína (de la leche) o cola de pescado; al final apenas queda nada, pero si quieres afinar, busca el sello vegano en la botella. La cerveza normal, sí.",
     "Nearly always. Some wines are fined with egg white, casein (from milk) or isinglass (from fish); almost none of it is left at the end, but if you want to be thorough, look for a vegan label on the bottle. Ordinary beer is fine."),
    ("¿Y el azúcar?", "And sugar?",
     "Sí. En algunos países se blanquea con carbón de hueso, pero en Europa no se hace así, y aquí se da por vegano.",
     "Yes. Some countries whiten it with bone char, but that isn't how it's done in Europe, so here it counts as vegan."),
    ("¿Cómo sé si algo es vegano en el súper?", "How do I tell in the supermarket?",
     "Lee los ingredientes buscando leche, huevo, miel, gelatina y los pocos aditivos de la pestaña «Aditivos (E)». Atajo: el sello V-Label (una V amarilla) o el girasol de The Vegan Society.",
     "Read the ingredients for milk, egg, honey, gelatine and the handful of additives in the “Additives (E)” tab. Shortcut: the V-Label (a yellow V) or The Vegan Society's sunflower."),
    ("¿Y la ropa y lo demás?", "What about clothes and everything else?",
     "Lo mismo: ni cuero, ni lana, ni seda, ni plumas; y cosmética sin ingredientes animales ni pruebas en animales. Pero para empezar, la comida es lo que más cuenta.",
     "Same idea: no leather, wool, silk or down; and cosmetics without animal ingredients or animal testing. But to start with, food is what matters most."),
    ("¿Y si un día como algo sin querer?", "What if I slip up by accident?",
     "No pasa nada. No es un examen: se trata de hacerlo lo mejor que puedas.",
     "That's fine. It's not an exam: it's about doing it as well as you can."),
]

# ---------------------------------------------------------------- Aditivos (E)
# (código, nombre es, nombre en, veredicto si|no|dep, nota es, nota en)
ADITIVOS = [
    ("E120", "Carmín, cochinilla", "Carmine, cochineal", "no", "Rojo hecho con insectos. Típico en chuches rojas, embutido y bebidas.", "Red dye made from insects. Common in red sweets, cured meats and drinks."),
    ("—", "Gelatina", "Gelatine", "no", "Sale de huesos y piel de cerdo o vaca. En la etiqueta va con su nombre, sin número.", "Made from pig or cow bones and skin. Labels name it in words, with no number."),
    ("E542", "Fosfato de huesos", "Bone phosphate", "no", "De huesos.", "From bones."),
    ("E901", "Cera de abejas", "Beeswax", "no", "Para dar brillo a chuches, grageas y fruta.", "Used to make sweets, coated chocolates and fruit shiny."),
    ("E904", "Goma laca", "Shellac", "no", "Resina de un insecto. Da brillo a grageas y algunas frutas.", "A resin from an insect. Makes coated sweets and some fruit shiny."),
    ("E913", "Lanolina", "Lanolin", "no", "Grasa de la lana de oveja. Más en chicles y cosmética.", "Grease from sheep's wool. Mostly in chewing gum and cosmetics."),
    ("E966", "Lactitol", "Lactitol", "no", "Edulcorante hecho con lactosa, de la leche.", "A sweetener made from lactose, from milk."),
    ("E1105", "Lisozima", "Lysozyme", "no", "De la clara de huevo. Sobre todo en quesos.", "From egg white. Mostly in cheese."),
    ("E1000", "Ácido cólico", "Cholic acid", "no", "De bilis animal. Raro.", "From animal bile. Rare."),
    ("E322", "Lecitina", "Lecithin", "dep", "Casi siempre de soja o girasol (sí). Muy rara vez de huevo.", "Almost always from soya or sunflower (fine). Very rarely from egg."),
    ("E422", "Glicerol, glicerina", "Glycerol", "dep", "Casi siempre vegetal, pero puede ser de grasa animal.", "Usually plant-based, but can come from animal fat."),
    ("E470–E495", "Sales y ésteres de ácidos grasos", "Fatty acid salts and esters", "dep", "Incluye E471 y E472 (mono y diglicéridos). Casi siempre de palma o soja; pueden ser de grasa animal.", "Includes E471 and E472 (mono- and diglycerides). Usually from palm or soya; can be from animal fat."),
    ("E570", "Ácido esteárico", "Stearic acid", "dep", "Vegetal o animal; la etiqueta no lo dice.", "Plant or animal; the label won't say."),
    ("E627, E631, E635", "Guanilato, inosinato, ribonucleótidos", "Guanylate, inosinate, ribonucleotides", "dep", "Potenciadores del sabor de patatas y snacks. Pueden salir de carne o pescado, o de fermentación.", "Flavour enhancers in crisps and snacks. Can come from meat or fish, or from fermentation."),
    ("E920", "L-cisteína", "L-cysteine", "dep", "En algo de pan industrial. Puede salir de plumas o pelo, o ser sintética.", "In some industrial bread. Can come from feathers or hair, or be synthetic."),
    ("E153", "Carbón vegetal", "Vegetable carbon", "dep", "Casi siempre vegetal, como dice el nombre.", "Almost always plant-based, as the name says."),
    ("E100", "Curcumina", "Curcumin", "si", "Cúrcuma.", "Turmeric."),
    ("E140, E141", "Clorofila", "Chlorophyll", "si", "Verde de las plantas.", "Green from plants."),
    ("E150a–d", "Caramelo", "Caramel colour", "si", "Azúcar tostado.", "Toasted sugar."),
    ("E160a", "Betacaroteno", "Beta-carotene", "si", "", ""),
    ("E160c", "Pimentón (extracto)", "Paprika extract", "si", "", ""),
    ("E162", "Rojo de remolacha", "Beetroot red", "si", "El rojo vegano que sustituye al carmín.", "The vegan red that replaces carmine."),
    ("E163", "Antocianos", "Anthocyanins", "si", "Morado de uvas y frutos rojos.", "Purple from grapes and berries."),
    ("E170", "Carbonato cálcico", "Calcium carbonate", "si", "Mineral.", "A mineral."),
    ("E200–E203", "Ácido sórbico y sorbatos", "Sorbic acid and sorbates", "si", "Conservantes.", "Preservatives."),
    ("E210–E213", "Benzoatos", "Benzoates", "si", "Conservantes.", "Preservatives."),
    ("E220–E228", "Sulfitos", "Sulphites", "si", "Los del vino.", "The ones in wine."),
    ("E260", "Ácido acético", "Acetic acid", "si", "Vinagre.", "Vinegar."),
    ("E270", "Ácido láctico", "Lactic acid", "si", "Asusta por el nombre, pero no viene de la leche: es de fermentar azúcares.", "The name sounds dairy, but it isn't: it comes from fermenting sugars."),
    ("E290", "Dióxido de carbono", "Carbon dioxide", "si", "Las burbujas.", "The bubbles."),
    ("E296", "Ácido málico", "Malic acid", "si", "El ácido de las chuches ácidas.", "The sour in sour sweets."),
    ("E300–E302", "Vitamina C", "Vitamin C", "si", "", ""),
    ("E306–E309", "Tocoferoles (vitamina E)", "Tocopherols (vitamin E)", "si", "", ""),
    ("E325–E327", "Lactatos", "Lactates", "si", "Igual que el E270: no son de leche.", "Like E270: not from milk."),
    ("E330–E333", "Ácido cítrico y citratos", "Citric acid and citrates", "si", "", ""),
    ("E338", "Ácido fosfórico", "Phosphoric acid", "si", "El de los refrescos de cola.", "The one in cola."),
    ("E392", "Extracto de romero", "Rosemary extract", "si", "", ""),
    ("E400–E405", "Alginatos", "Alginates", "si", "De algas.", "From seaweed."),
    ("E406", "Agar-agar", "Agar", "si", "De algas. La «gelatina» vegana.", "From seaweed. Vegan “gelatine”."),
    ("E407", "Carragenano", "Carrageenan", "si", "De algas.", "From seaweed."),
    ("E410", "Goma garrofín", "Locust bean gum", "si", "De algarroba.", "From carob."),
    ("E412", "Goma guar", "Guar gum", "si", "", ""),
    ("E414", "Goma arábiga", "Gum arabic", "si", "Resina de acacia.", "Acacia resin."),
    ("E415", "Goma xantana", "Xanthan gum", "si", "", ""),
    ("E440", "Pectina", "Pectin", "si", "De fruta. La de las gominolas veganas.", "From fruit. What vegan gummies use."),
    ("E460–E466", "Celulosa", "Cellulose", "si", "", ""),
    ("E500", "Bicarbonato", "Bicarbonate of soda", "si", "", ""),
    ("E621", "Glutamato", "Glutamate (MSG)", "si", "Se hace por fermentación.", "Made by fermentation."),
    ("E1400–E1452", "Almidones modificados", "Modified starches", "si", "", ""),
    ("E420", "Sorbitol", "Sorbitol", "si", "Edulcorante.", "Sweetener."),
    ("E950", "Acesulfamo K", "Acesulfame K", "si", "Edulcorante.", "Sweetener."),
    ("E951", "Aspartamo", "Aspartame", "si", "Edulcorante.", "Sweetener."),
    ("E952", "Ciclamato", "Cyclamate", "si", "Edulcorante.", "Sweetener."),
    ("E953", "Isomalt", "Isomalt", "si", "Edulcorante.", "Sweetener."),
    ("E954", "Sacarina", "Saccharin", "si", "Edulcorante.", "Sweetener."),
    ("E955", "Sucralosa", "Sucralose", "si", "Edulcorante.", "Sweetener."),
    ("E960", "Estevia", "Stevia", "si", "Edulcorante.", "Sweetener."),
    ("E965", "Maltitol", "Maltitol", "si", "Edulcorante.", "Sweetener."),
    ("E967", "Xilitol", "Xylitol", "si", "Edulcorante.", "Sweetener."),
    ("E968", "Eritritol", "Erythritol", "si", "Edulcorante.", "Sweetener."),
]
VERED = {"si": ("Sí", "Yes"), "no": ("No", "No"), "dep": ("Depende", "Depends")}

# ---------------------------------------------------------------- Chuches
# img → resources/img/veganismo/<img>.jpg ; créditos en CREDITOS
CHUCHES = [
    ("ositos", "Ositos y gominolas", "Gummy bears and jelly sweets", "no",
     "Llevan gelatina, que es de cerdo.", "They contain gelatine, which comes from pigs.",
     'Hay gominolas que se venden como veganas, hechas con pectina o almidón: la línea Smoofree de Fini (100 % vegana, <a href="https://www.alimarket.es/alimentacion/noticia/357476/fini-presenta-una-nueva-linea-de-chuches-vegana--gluten-free-y-con-zumo-de-frutas" target="_blank" rel="noopener">2022</a>) y la gama Vegan de Trolli, con sello vegano (<a href="https://www.alimarket.es/alimentacion/noticia/335406/trolli-lanza-sus-primeros-caramelos-veganos-en-espana" target="_blank" rel="noopener">2021</a>).',
     'Some gummies are sold as vegan, made with pectin or starch: Fini\'s Smoofree line (100% vegan, <a href="https://www.alimarket.es/alimentacion/noticia/357476/fini-presenta-una-nueva-linea-de-chuches-vegana--gluten-free-y-con-zumo-de-frutas" target="_blank" rel="noopener">2022</a>) and Trolli\'s Vegan range, with a vegan label (<a href="https://www.alimarket.es/alimentacion/noticia/335406/trolli-lanza-sus-primeros-caramelos-veganos-en-espana" target="_blank" rel="noopener">2021</a>).'),
    ("huevos", "Huevos fritos, fresas, besitos", "Fried eggs, strawberries and other jelly shapes", "no",
     "Son gominola: también gelatina.", "They're jelly sweets too: gelatine again.",
     "Las mismas de arriba (Fini Smoofree, Trolli Vegan).", "The same as above (Fini Smoofree, Trolli Vegan)."),
    ("regaliz-azucar", "Regaliz pica pica y relleno <small>(con azúcar por fuera o crema por dentro)</small>", "Sugar-coated and filled liquorice", "no",
     'Aunque parezca solo azúcar, el de Fini lleva gelatina: el Amazonia pica pica y el relleno Sahara la tienen en la lista (<a href="https://world.openfoodfacts.org/product/8410525228377" target="_blank" rel="noopener">1</a>, <a href="https://world.openfoodfacts.org/product/8410525228315" target="_blank" rel="noopener">2</a>).',
     'It looks like plain sugar, but Fini\'s has gelatine: both the Amazonia sour mix and the Sahara filled liquorice list it (<a href="https://world.openfoodfacts.org/product/8410525228377" target="_blank" rel="noopener">1</a>, <a href="https://world.openfoodfacts.org/product/8410525228315" target="_blank" rel="noopener">2</a>).',
     "Las tiras y gominolas ácidas de Fini Smoofree o Trolli Vegan.", "The sour belts and gummies from Fini Smoofree or Trolli Vegan."),
    ("regaliz-rojo", "Regaliz rojo <small>(ruedas, torcidas)</small>", "Red liquorice <small>(wheels, twists)</small>", "dep",
     'Muchos no llevan gelatina: la torcida Teide de Fini no la tiene en la lista (<a href="https://world.openfoodfacts.org/product/8410525228360" target="_blank" rel="noopener">ingredientes</a>). Pero no se vende como vegana y no detalla los colorantes: si el rojo es E120 (carmín), es de insecto.',
     'Lots of them have no gelatine: Fini\'s Teide twist doesn\'t list it (<a href="https://world.openfoodfacts.org/product/8410525228360" target="_blank" rel="noopener">ingredients</a>). But it isn\'t sold as vegan and doesn\'t name its colourings: if the red is E120 (carmine), it comes from an insect.',
     "", ""),
    ("nubes", "Nubes", "Marshmallows", "no",
     "Las de siempre se hacen con gelatina.", "Ordinary ones are made with gelatine.",
     "Las nubes Dandies se venden como veganas; se encuentran en tiendas veganas y por internet.", "Dandies marshmallows are sold as vegan; you'll find them in vegan shops and online."),
    ("chocolate-leche", "Chocolate con leche", "Milk chocolate", "no",
     "Lleva leche.", "It has milk in it.",
     'Nestlé Vegan, tableta con harina de almendra y certificado vegano (<a href="https://www.alimarket.es/alimentacion/noticia/350361/nestle-lleva-a-los-chocolates-su-estrategia-veggie" target="_blank" rel="noopener">2022</a>). Y mucho chocolate negro ya es vegano, como el Nestlé Negro 70 %.',
     'Nestlé Vegan, a bar made with almond flour and certified vegan (<a href="https://www.alimarket.es/alimentacion/noticia/350361/nestle-lleva-a-los-chocolates-su-estrategia-veggie" target="_blank" rel="noopener">2022</a>). And lots of dark chocolate is already vegan, like Nestlé Negro 70%.'),
    ("crema-cacao", "Crema de cacao <small>(Nutella, Nocilla)</small>", "Chocolate spread <small>(Nutella, Nocilla)</small>", "no",
     "Lleva leche.", "It has milk in it.",
     'Nutella Plant-Based, con certificado de The Vegan Society, en supermercados de España desde <a href="https://www.alimarket.es/alimentacion/noticia/408128/-nutella--plant-based-llega-a-espana" target="_blank" rel="noopener">2025</a>. Y la Nocilla Noir: mira «Para untar».',
     'Nutella Plant-Based, certified by The Vegan Society, in Spanish supermarkets since <a href="https://www.alimarket.es/alimentacion/noticia/408128/-nutella--plant-based-llega-a-espana" target="_blank" rel="noopener">2025</a>. And Nocilla Noir: see “Spreads”.'),
    ("grageas", "Lacasitos y grageas de chocolate", "Lacasitos and other sugar-coated chocolates", "no",
     "Chocolate con leche por dentro, y el brillo de fuera suele ser goma laca (E904) o cera.", "Milk chocolate inside, and the shine outside is usually shellac (E904) or wax.",
     "Por buscar.", "Still to find."),
    ("piruletas", "Piruletas y Chupa Chups", "Lollipops and Chupa Chups", "dep",
     "Los de fruta suelen ser sí; los de nata, leche o yogur llevan leche. Mira la etiqueta del sabor.", "Fruit flavours are usually fine; cream, milk or yoghurt flavours have milk. Check the flavour's label.",
     "", ""),
    ("polvorones", "Polvorones y mantecados", "Polvorones and mantecados", "no",
     "Los de siempre se hacen con manteca de cerdo.", "The traditional ones are made with lard.",
     "Hay polvorones hechos con aceite de oliva o grasa vegetal; marca concreta por buscar.", "Some polvorones are made with olive oil or vegetable fat; a specific brand still to find."),
    ("turron", "Turrón de Jijona y de Alicante", "Jijona and Alicante turrón", "no",
     "Llevan miel, y el de Alicante también clara de huevo. El de chocolate suele llevar leche.", "They contain honey, and Alicante turrón also has egg white. Chocolate turrón usually has milk.",
     "Por buscar.", "Still to find."),
    ("palomitas", "Palomitas", "Popcorn", "si",
     "Maíz, aceite y sal. Ojo solo con las de microondas «sabor mantequilla».", "Corn, oil and salt. Just watch out for “butter flavour” microwave ones.",
     "", ""),
    ("pipas", "Pipas", "Sunflower seeds", "si",
     "Pipas y sal.", "Seeds and salt.", "", ""),
    ("oreo", "Galletas Oreo", "Oreo biscuits", "si",
     "Por receta no llevan leche ni huevo; el «puede contener» es por trazas.", "By recipe they have no milk or egg; the “may contain” is about traces.",
     "", ""),
]

# ---------------------------------------------------------------- Para untar
# (img en resources/img/veganismo/untar/, nombre es, nombre en, veredicto, texto es, texto en, provisional, fuente OFF)
OFF = "https://world.openfoodfacts.org/product/"
UNTAR = [
    (("Dulces", "Sweet"), [
        ("nocilla-noir", "Nocilla Noir", "Nocilla Noir", "si",
         "La crema de cacao negra de Nocilla, sin leche. Es la primera que enseño cuando me preguntan qué como.",
         "Nocilla's dark cocoa spread, made without milk. It's the first thing I show when people ask what I eat.",
         True, "8410052486097"),
        ("nutella-pb", "Nutella Plant-Based", "Nutella Plant-Based", "si",
         'La Nutella vegana: garbanzo y sirope de arroz en vez de leche, con certificado de The Vegan Society. En España desde <a href="https://www.alimarket.es/alimentacion/noticia/408128/-nutella--plant-based-llega-a-espana" target="_blank" rel="noopener">2025</a>.',
         'Vegan Nutella: chickpea and rice syrup instead of milk, certified by The Vegan Society. In Spain since <a href="https://www.alimarket.es/alimentacion/noticia/408128/-nutella--plant-based-llega-a-espana" target="_blank" rel="noopener">2025</a>.',
         False, "8000500426494"),
        ("biscoff", "Crema Lotus Biscoff", "Lotus Biscoff spread", "si",
         "La crema de las galletas Lotus, de sabor a galleta caramelizada. La marca la vende como 100 % vegana.",
         "The spread made from Lotus biscuits, tasting of caramelised biscuit. The brand sells it as 100% vegan.",
         False, "5410126116953"),
    ]),
    (("Saladas", "Savoury"), [
        ("philadelphia", "Philadelphia Vegetal", "Philadelphia Vegetal (plant-based)", "si",
         "Crema para untar de almendra y avena, como el Philadelphia de siempre pero sin lácteos. Vegana según la etiqueta; se vende en Carrefour y Alcampo.",
         "A cream-cheese-style spread made from almond and oat, like regular Philadelphia but dairy-free. Labelled vegan; sold at Carrefour and Alcampo.",
         False, "7622201745752"),
    ]),
]
PENDIENTE_UNTAR = [
    ("Otra crema de cacao negra de marca blanca (Hacendado, Carrefour, Lidl…): por comprobar cuál es vegana.",
     "A supermarket own-brand dark cocoa spread (Hacendado, Carrefour, Lidl…): still to check which one is vegan."),
    ("La otra dulce que está muy buena: por apuntar.", "The other really good sweet one: still to write down."),
]

# ---------------------------------------------------------------- Mis platos
# estado: "probar" (sugerido, aún no lo he cocinado) | "mio" (cocinado por mí, con foto)
PLATOS = [
    dict(es="Lentejas estofadas", en="Lentil stew", estado="probar",
         ing_es="Lentejas, cebolla, zanahoria, pimiento, ajo, patata, tomate, pimentón, laurel, aceite.",
         ing_en="Lentils, onion, carrot, pepper, garlic, potato, tomato, paprika, bay leaf, olive oil.",
         pasos_es=["Sofríe la cebolla, el ajo, el pimiento y la zanahoria.", "Añade el tomate y, fuera del fuego, el pimentón.", "Echa las lentejas, la patata en trozos, el laurel y agua que las cubra.", "Cuécelas a fuego lento unos 40 minutos (con lentejas pardinas no hace falta remojo)."],
         pasos_en=["Fry the onion, garlic, pepper and carrot.", "Add the tomato and, off the heat, the paprika.", "Add the lentils, chunks of potato, the bay leaf and water to cover.", "Simmer for about 40 minutes (small brown pardina lentils need no soaking)."]),
    dict(es="Garbanzos con espinacas", en="Chickpeas with spinach", estado="probar",
         ing_es="Garbanzos cocidos (de bote vale), espinacas, ajo, pan, comino, pimentón, vinagre, aceite.",
         ing_en="Cooked chickpeas (tinned is fine), spinach, garlic, bread, cumin, paprika, vinegar, olive oil.",
         pasos_es=["Fríe ajo y una rebanada de pan; májalos con comino, pimentón y un chorrito de vinagre.", "Saltea las espinacas.", "Junta todo con los garbanzos y un poco de agua, y deja que espese 10 minutos."],
         pasos_en=["Fry garlic and a slice of bread; pound them with cumin, paprika and a splash of vinegar.", "Sauté the spinach.", "Put it all together with the chickpeas and a little water and let it thicken for 10 minutes."]),
    dict(es="Pisto", en="Pisto", estado="probar",
         ing_es="Cebolla, pimiento verde y rojo, calabacín, berenjena, tomate, aceite, sal.",
         ing_en="Onion, green and red pepper, courgette, aubergine, tomato, olive oil, salt.",
         pasos_es=["Pocha la cebolla y los pimientos.", "Añade calabacín y berenjena en dados.", "Termina con el tomate y deja que se haga despacio, 30–40 minutos."],
         pasos_en=["Soften the onion and peppers.", "Add diced courgette and aubergine.", "Finish with the tomato and cook it slowly for 30–40 minutes."]),
    dict(es="Gazpacho", en="Gazpacho", estado="probar",
         ing_es="Tomate maduro, pepino, pimiento verde, ajo, aceite, vinagre, sal (y pan, si quieres).",
         ing_en="Ripe tomatoes, cucumber, green pepper, garlic, olive oil, vinegar, salt (and bread, if you like).",
         pasos_es=["Tritura todo.", "Cuélalo si lo quieres fino.", "Al frigorífico."],
         pasos_en=["Blend everything.", "Sieve it if you like it smooth.", "Chill it."]),
    dict(es="Tortilla de patatas sin huevo", en="Egg-free Spanish omelette", estado="probar",
         ing_es="Patatas, cebolla, aceite, sal, harina de garbanzo y agua.",
         ing_en="Potatoes, onion, olive oil, salt, chickpea flour and water.",
         pasos_es=["Confita patata y cebolla en aceite, como siempre.", "Mezcla harina de garbanzo y agua a partes iguales (unos 150 g de cada para 4 patatas), con sal.", "Junta con las patatas escurridas y cuájala en la sartén por los dos lados."],
         pasos_en=["Slow-fry potato and onion in oil, as usual.", "Whisk equal parts chickpea flour and water (about 150 g of each for 4 potatoes) with salt.", "Mix in the drained potatoes and set it in the pan on both sides."]),
    dict(es="Paella de verduras", en="Vegetable paella", estado="probar",
         ing_es="Arroz bomba, judía verde, garrofón, alcachofa, pimiento, tomate, pimentón, azafrán, caldo de verduras, aceite.",
         ing_en="Bomba rice, green beans, butter beans, artichoke, pepper, tomato, paprika, saffron, vegetable stock, olive oil.",
         pasos_es=["Sofríe las verduras en la paella.", "Añade tomate, pimentón y el arroz; remueve un minuto.", "Echa el caldo caliente con azafrán (el doble que de arroz, y algo más) y no lo toques más: 18 minutos."],
         pasos_en=["Fry the vegetables in the paella pan.", "Add tomato, paprika and the rice; stir for a minute.", "Pour in hot stock with saffron (a bit more than twice the rice) and don't stir again: 18 minutes."]),
    dict(es="Espaguetis con tomate", en="Spaghetti with tomato", estado="probar",
         ing_es="Espaguetis, tomate triturado, ajo, aceite, albahaca u orégano, sal.",
         ing_en="Spaghetti, crushed tomatoes, garlic, olive oil, basil or oregano, salt.",
         pasos_es=["Dora el ajo laminado en aceite.", "Añade el tomate y deja que reduzca 15 minutos.", "Mézclalo con la pasta recién escurrida."],
         pasos_en=["Brown sliced garlic in olive oil.", "Add the tomato and reduce for 15 minutes.", "Toss with the freshly drained pasta."]),
    dict(es="Hummus", en="Hummus", estado="probar",
         ing_es="Garbanzos cocidos, tahini, limón, ajo, comino, aceite, sal.",
         ing_en="Cooked chickpeas, tahini, lemon, garlic, cumin, olive oil, salt.",
         pasos_es=["Tritura todo con un poco del agua de los garbanzos hasta que quede cremoso."],
         pasos_en=["Blend everything with a little of the chickpea water until creamy."]),
]

# ---------------------------------------------------------------- Créditos de imágenes
CRED = json.load(open(ROOT / "resources/img/veganismo/creditos.json", encoding="utf-8"))


def lst(items, cls=""):
    return f'<ul class="vg-list {cls}">' + "".join(f"<li>{L(a, b)}</li>" for a, b in items) + "</ul>"


def build():
    tpl = (ROOT / "butifarra.html").read_text(encoding="utf-8")
    head, rest = tpl.split('<div class="mainbody spectator">', 1)
    tail = rest[rest.index("    <script>"):]
    head = head.replace("<title>Recursos | Víctor Abia Alonso</title>", "<title>Veganismo | Víctor Abia Alonso</title>")
    head = head.replace('</head>', '    <link href="./resources/css/veganismo.css?v=20261117a" type="text/css" rel="stylesheet">\n    </head>', 1)
    tail = tail.replace("document.title = 'La butifarra'", "document.title = (l === 'es' ? 'Veganismo' : 'Veganism')")

    o = []
    o.append('<div class="mainbody spectator">\n')
    o.append('''        <div class="sp-langswitch" role="group" aria-label="Idioma / Language">
            <button type="button" data-set-lang="es">Español</button>
            <button type="button" data-set-lang="en">English</button>
        </div>
''')
    o.append(f'        <p class="bt-back"><a href="recursos.html">← {L("Recursos", "Resources")}</a></p>\n')
    o.append(f'        <h1 class="bt-h1">{L("Veganismo", "Veganism")}</h1>\n')
    o.append(f'        <p class="bt-sub">{L("Lo que suelen preguntarme, resumido. <span class=\'tc-nr\'>No revisado</span>", "What people usually ask me, in short. <span class=\'tc-nr\'>Not reviewed</span>")}</p>\n')
    tabs = [("empezar", "Para empezar", "Getting started"), ("untar", "Para untar", "Spreads"), ("preguntas", "Preguntas", "Questions"),
            ("aditivos", "Aditivos (E)", "Additives (E)"), ("chuches", "Chuches", "Sweets"), ("platos", "Mis platos", "My dishes")]
    o.append('        <div class="rs-tabs vg-tabs" role="tablist">\n')
    for i, (k, a, b) in enumerate(tabs):
        o.append(f'            <button type="button" role="tab" data-tab="{k}" aria-selected="{str(i == 0).lower()}">{L(a, b)}</button>\n')
    o.append('        </div>\n')

    # Para empezar
    o.append('        <section class="vg-panel" id="empezar" role="tabpanel">\n')
    o.append(f'<p class="vg-lead">{L("Vegano quiere decir no comer nada que venga de un animal: ni carne ni pescado, pero tampoco leche, huevo ni miel. Todo lo demás, sí. Y en la cocina de aquí es muchísimo.", "Vegan means eating nothing that comes from an animal: no meat or fish, but no milk, eggs or honey either. Everything else is fine. And in Spanish cooking that is a lot.")}</p>\n')
    o.append(f'<h2 class="vg-h vg-si-h">{L("Sí", "Yes")}</h2>\n<div class="vg-si-grid">\n')
    for (a, b), items in SI:
        o.append(f'<div class="vg-box vg-si"><h3>{L(a, b)}</h3>{lst(items)}</div>\n')
    o.append('</div>\n')
    o.append(f'<h2 class="vg-h vg-no-h">{L("No", "No")}</h2>\n<div class="vg-box vg-no">{lst(NO)}</div>\n')
    o.append(f'<h2 class="vg-h">{L("Fácil de cambiar", "Easy swaps")}</h2>\n<div class="vg-box vg-swap">{lst(FACIL)}</div>\n')
    o.append('        </section>\n')

    # Para untar
    o.append('        <section class="vg-panel" id="untar" role="tabpanel" hidden>\n')
    for (ga, gb), items in UNTAR:
        o.append(f'<h2 class="vg-h">{L(ga, gb)}</h2>\n<div class="vg-chuches vg-untar">\n')
        for img, na, nb, v, ta, tb, prov, code in items:
            a, b = VERED[v]
            pv = L('<span class="vg-prov">Provisional</span>', '<span class="vg-prov">Provisional</span>') if prov else ""
            star = " vg-star" if img == "nocilla-noir" else ""
            o.append(f'<article class="vg-ch{star}"><img src="resources/img/veganismo/untar/{img}.jpg" alt="" class="vg-prod"><div class="vg-ch-b"><span class="vg-badge vg-v-{v}">{L(a, b)}</span>{pv}<h3>{L(na, nb)}</h3><p>{L(ta, tb)}</p></div></article>\n')
        o.append('</div>\n')
    o.append(f'<div class="vg-box vg-swap"><h3>{L("Por añadir", "Still to add")}</h3>{lst(PENDIENTE_UNTAR)}</div>\n')
    o.append(f'<details class="vg-cred"><summary>{L("Créditos de las fotos", "Photo credits")}</summary><ul>\n')
    for _, items in UNTAR:
        for img, na, nb, v, ta, tb, prov, code in items:
            o.append(f'<li>{e(na)}: <a href="{OFF}{code}" target="_blank" rel="noopener">Open Food Facts</a>, {L("colaboradores", "contributors")}, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a>.</li>\n')
    o.append('</ul></details>\n        </section>\n')

    # Preguntas
    o.append('        <section class="vg-panel" id="preguntas" role="tabpanel" hidden>\n<div class="vg-faq">\n')
    for qa, qb, ra, rb in FAQ:
        o.append(f'<details><summary>{L(qa, qb)}</summary><p>{L(ra, rb)}</p></details>\n')
    o.append('</div>\n        </section>\n')

    # Aditivos
    o.append('        <section class="vg-panel" id="aditivos" role="tabpanel" hidden>\n')
    o.append(f'<p class="vg-lead">{L("Casi todos los aditivos son vegetales o sintéticos. Los que de verdad hay que mirar son pocos: los rojos (E120), los brillos (E901, E904) y la gelatina. Los «depende» casi siempre son vegetales.", "Nearly all additives are plant-based or synthetic. The ones you really need to watch for are few: the reds (E120), the shiny coatings (E901, E904) and gelatine. The “depends” ones are nearly always plant-based.")}</p>\n')
    o.append('<div class="vg-filters">')
    o.append('<input class="rs-q vg-q" type="search" placeholder="Buscar E o nombre…" data-ph-en="Search E number or name…" aria-label="Buscar / Search">')
    for k in ("no", "dep", "si"):
        a, b = VERED[k]
        o.append(f'<button type="button" class="vg-f vg-v-{k}" data-v="{k}" aria-pressed="false">{L(a, b)}</button>')
    o.append('</div>\n<table class="vg-tabla"><thead><tr>')
    o.append(f'<th>E</th><th>{L("Nombre", "Name")}</th><th></th><th>{L("Nota", "Note")}</th></tr></thead><tbody>\n')
    for cod, na, nb, v, ta, tb in ADITIVOS:
        a, b = VERED[v]
        o.append(f'<tr data-v="{v}"><td class="vg-cod">{cod}</td><td>{L(na, nb)}</td><td><span class="vg-badge vg-v-{v}">{L(a, b)}</span></td><td class="vg-nota">{L(ta, tb) if ta else ""}</td></tr>\n')
    o.append('</tbody></table>\n        </section>\n')

    # Chuches
    o.append('        <section class="vg-panel" id="chuches" role="tabpanel" hidden>\n')
    o.append(f'<p class="vg-lead">{L("Las chuches son donde más se cuela lo animal, sobre todo la gelatina. Las fotos son del tipo de chuche, no de una marca concreta.", "Sweets are where animal stuff sneaks in most, especially gelatine. The photos show the kind of sweet, not a specific brand.")}</p>\n<div class="vg-chuches">\n')
    for img, na, nb, v, wa, wb, aa, ab in CHUCHES:
        a, b = VERED[v]
        alt = f'<p class="vg-alt"><b>{L("Alternativa vegana:", "Vegan alternative:")}</b> {L(aa, ab)}</p>' if aa else ""
        o.append(f'<article class="vg-ch"><img src="resources/img/veganismo/{img}.jpg" alt="" width="640" height="427"><div class="vg-ch-b"><span class="vg-badge vg-v-{v}">{L(a, b)}</span><h3>{L(na, nb)}</h3><p>{L(wa, wb)}</p>{alt}</div></article>\n')
    o.append('</div>\n')
    o.append(f'<details class="vg-cred"><summary>{L("Créditos de las fotos", "Photo credits")}</summary><ul>\n')
    for img, na, nb, *_ in CHUCHES:
        c = CRED[img]
        nombre = re.sub(r"<[^>]+>", "", na).strip()
        lic = f'<a href="{e(c["licurl"])}" target="_blank" rel="noopener">{e(c["license"])}</a>' if c.get("licurl") else e(c["license"])
        o.append(f'<li>{e(nombre)}: <a href="{e(c["page"])}" target="_blank" rel="noopener">{e(c["title"].replace("File:", ""))}</a>, {e(c["artist"])}, {lic}{L(", reducida", ", resized")}.</li>\n')
    o.append(f'</ul><p>{L("Todas de Wikimedia Commons.", "All from Wikimedia Commons.")}</p></details>\n')
    o.append('        </section>\n')

    # Mis platos
    o.append('        <section class="vg-panel" id="platos" role="tabpanel" hidden>\n')
    o.append(f'<p class="vg-lead">{L("Mi recetario. Empieza con platos fáciles de aquí; cuando cocine uno, le pongo mi foto y cómo lo hice.", "My recipe book. It starts with easy Spanish dishes; when I cook one, it gets my photo and how I made it.")}</p>\n<div class="vg-platos">\n')
    for p in PLATOS:
        foto = f'<img src="resources/img/veganismo/platos/{p["foto"]}" alt="">' if p.get("foto") else f'<div class="vg-sinfoto">{L("Foto pendiente", "Photo to come")}</div>'
        est = L("Lo he cocinado", "I've cooked this") if p["estado"] == "mio" else L("Por probar", "To try")
        pasos = f'<ol data-l="es">{"".join(f"<li>{x}</li>" for x in p["pasos_es"])}</ol><ol data-l="en">{"".join(f"<li>{x}</li>" for x in p["pasos_en"])}</ol>'
        o.append(f'<article class="vg-plato vg-e-{p["estado"]}">{foto}<span class="vg-estado">{est}</span><h3>{L(p["es"], p["en"])}</h3><p class="vg-ing">{L(p["ing_es"], p["ing_en"])}</p><details><summary>{L("Cómo se hace", "How to make it")}</summary>{pasos}</details></article>\n')
    o.append('</div>\n        </section>\n')
    o.append('    </div>\n\n')

    script = '''    <script>
    (function () {
        var tabs = document.querySelectorAll('.vg-tabs [data-tab]');
        function show(id) {
            tabs.forEach(function (t) {
                var on = t.dataset.tab === id;
                t.setAttribute('aria-selected', String(on));
                document.getElementById(t.dataset.tab).hidden = !on;
            });
        }
        tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); }); });
        var h = location.hash.slice(1);
        if (h && document.querySelector('.vg-tabs [data-tab="' + h + '"]')) show(h);

        var norm = function (x) { return x.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase(); };
        var q = document.querySelector('.vg-q'), rows = document.querySelectorAll('.vg-tabla tbody tr'), sel = [];
        function apply() {
            var w = norm(q.value.trim()).replace(/\\s+/g, '');
            rows.forEach(function (r) {
                var txt = norm(r.textContent).replace(/\\s+/g, '');
                r.hidden = !((!w || txt.indexOf(w) > -1) && (!sel.length || sel.indexOf(r.dataset.v) > -1));
            });
        }
        q.addEventListener('input', apply);
        document.querySelectorAll('.vg-f').forEach(function (b) {
            b.addEventListener('click', function () {
                var i = sel.indexOf(b.dataset.v);
                if (i > -1) sel.splice(i, 1); else sel.push(b.dataset.v);
                b.setAttribute('aria-pressed', String(i < 0));
                apply();
            });
        });
        function ph(l) { q.placeholder = l === 'en' ? q.dataset.phEn : 'Buscar E o nombre…'; }
        document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.addEventListener('click', function () { ph(b.dataset.setLang); }); });
        ph(document.documentElement.dataset.lang);
    })();
    </script>
'''
    tail = tail.replace("</body>", script + "</body>", 1)
    out = head + "".join(o) + tail
    (ROOT / "veganismo.html").write_text(out, encoding="utf-8")
    print("veganismo.html", len(out))


if __name__ == "__main__":
    build()

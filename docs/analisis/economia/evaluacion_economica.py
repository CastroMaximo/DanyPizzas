"""
Evaluación económico-financiera del proyecto Dany Pizzas Web.

Simulación Monte Carlo (10.000 iteraciones) + tres escenarios deterministas.
Horizonte: 12 meses (flujos mensuales). Moneda: pesos argentinos de octubre 2026.

Uso:  python3 evaluacion_economica.py
Genera en esta carpeta: resultados.json, montecarlo_van.png, flujo_acumulado.png, tornado.png

Todos los supuestos están en PARAMS. Cada distribución es triangular (mínimo, más probable, máximo).
Fuente de cada valor: ver evaluacion-economica.md, sección 2.
"""
import json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

AQUI = Path(__file__).parent
SEMILLA = 2026
N = 10_000
MESES = 12
SEMANAS_POR_MES = 52 / 12
SMVM_HORA = 1956          # Salario Mínimo Vital y Móvil por hora, oct-2026 (Res. 4/2026 CNEPSMVM)
TNA = 0.175               # Plazo fijo 30 días Banco Nación (referencia oct-2026)
TASA_MENSUAL = TNA / 12   # tasa efectiva a 30 días

# (mínimo, más probable, máximo)
PARAMS = {
    # --- Demanda actual (respuestas del negocio) ---
    "pedidos_dia_semana":   (5, 7, 9),        # promedio 7 (mar a vie: 4 noches)
    "pedidos_fin_semana":   (9, 11, 13),      # promedio 11 (sáb y dom: 2 noches)
    "pizzas_por_pedido":    (1, 2, 3),        # "entre 1 y 3"
    "precio_promedio":      (9500, 9500, 9500),  # promedio de la carta (7 variedades)
    "margen":               (0.35, 0.40, 0.45),  # "ganancia del 40 %"
    # --- Situación actual por chat ---
    "min_chat_antes":       (2, 5, 10),       # "2 a 10 minutos"
    "tasa_error_antes":     (0.05, 0.10, 0.15),  # "1 de cada 10"
    "perdidos_semana":      (3, 6, 9),        # "aprox. 1 por día" (6 noches)
    # --- Supuestos del proyecto (a medir en el primer mes) ---
    "min_chat_despues":     (0.5, 1, 2),      # solo confirmar pago
    "tasa_error_despues":   (0.01, 0.03, 0.05),
    "adopcion":             (0.20, 0.40, 0.60),  # % de pedidos que entran por la web
    "recupero_perdidos":    (0.10, 0.30, 0.50),  # % de pedidos perdidos que la web rescata
    "costo_error_pizzas":   (0.25, 0.50, 1.00),  # costo de un error, en "pizzas de insumos"
    "valor_hora_atencion":  (SMVM_HORA, SMVM_HORA * 1.25, SMVM_HORA * 1.5),
    # --- Costos del proyecto ---
    "horas_desarrollo":     (40, 48, 60),     # "48 horas aprox."
    "valor_hora_desarrollo": (SMVM_HORA, SMVM_HORA * 2.5, SMVM_HORA * 5),
    "horas_mant_mes":       (1, 2, 4),
}
# Rampa de adopción: mes 1 al 50 %, mes 2 al 75 %, desde el mes 3 al 100 % del valor estable
RAMPA = np.array([0.50, 0.75] + [1.0] * (MESES - 2))


def tri(nombre, n, rng):
    a, m, b = PARAMS[nombre]
    if a == b:
        return np.full(n, float(a))
    return rng.triangular(a, m, b, n)


def punto(nombre, cual):
    a, m, b = PARAMS[nombre]
    return {"pes": a, "base": m, "opt": b}[cual]


def modelo(p):
    """p: dict de arrays (o escalares). Devuelve flujos (n, MESES+1) y componentes mensuales estables."""
    pedidos_mes = (4 * p["pedidos_dia_semana"] + 2 * p["pedidos_fin_semana"]) * SEMANAS_POR_MES
    ganancia_pizza = p["precio_promedio"] * p["margen"]
    costo_insumos_pizza = p["precio_promedio"] * (1 - p["margen"])
    web = pedidos_mes * p["adopcion"]

    b_tiempo = web * np.maximum(p["min_chat_antes"] - p["min_chat_despues"], 0) / 60 * p["valor_hora_atencion"]
    b_errores = web * np.maximum(p["tasa_error_antes"] - p["tasa_error_despues"], 0) \
        * p["costo_error_pizzas"] * costo_insumos_pizza
    b_recupero = p["perdidos_semana"] * SEMANAS_POR_MES * p["recupero_perdidos"] \
        * p["pizzas_por_pedido"] * ganancia_pizza
    beneficio_estable = b_tiempo + b_errores + b_recupero

    inversion = p["horas_desarrollo"] * p["valor_hora_desarrollo"]
    mant = p["horas_mant_mes"] * p["valor_hora_desarrollo"]

    beneficio = np.outer(np.atleast_1d(beneficio_estable), RAMPA)
    costo = np.repeat(np.atleast_1d(mant)[:, None], MESES, axis=1)
    flujos = np.concatenate([-np.atleast_1d(inversion)[:, None], beneficio - costo], axis=1)
    comp = {"tiempo": b_tiempo, "errores": b_errores, "recupero": b_recupero,
            "inversion": inversion, "mantenimiento": mant}
    return flujos, beneficio, costo, np.atleast_1d(inversion), comp


DESC = 1 / (1 + TASA_MENSUAL) ** np.arange(0, MESES + 1)


def indicadores(flujos, beneficio, costo, inversion):
    van = flujos @ DESC
    vp_benef = beneficio @ DESC[1:]
    vp_cost = inversion + costo @ DESC[1:]
    bc = vp_benef / vp_cost
    roi = (beneficio.sum(1) - costo.sum(1) - inversion) / (costo.sum(1) + inversion)
    acum = np.cumsum(flujos * DESC, axis=1)
    recupero = np.where((acum >= 0).any(1), (acum >= 0).argmax(1), np.nan).astype(float)
    # interpolación lineal dentro del mes en que se recupera
    for i in range(len(recupero)):
        k = recupero[i]
        if not np.isnan(k) and k > 0:
            k = int(k)
            recupero[i] = k - 1 + (-acum[i, k - 1]) / (acum[i, k] - acum[i, k - 1])
    tir = np.array([tir_mensual(f) for f in flujos])
    return {"van": van, "bc": bc, "roi": roi, "recupero": recupero, "tir": tir,
            "vp_benef": vp_benef, "vp_cost": vp_cost}


def tir_mensual(f, lo=-0.99, hi=10.0):
    v = lambda r: np.sum(f / (1 + r) ** np.arange(len(f)))
    if v(lo) * v(hi) > 0:
        return np.nan
    for _ in range(200):
        mid = (lo + hi) / 2
        if v(lo) * v(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


MALOS_ALTOS = {"min_chat_despues", "tasa_error_despues", "horas_desarrollo",
               "valor_hora_desarrollo", "horas_mant_mes"}


def escenario(cual, intensidad=0.5):
    """base: valor más probable de cada variable.
    pes / opt: cada variable se mueve desde el valor más probable hacia su extremo
    desfavorable / favorable una fracción `intensidad` (0,5 = mitad de camino).
    intensidad=1 es el caso extremo (todo sale mal o todo sale bien a la vez)."""
    p = {}
    for k, (a, m, b) in PARAMS.items():
        if cual == "base":
            p[k] = m
            continue
        alto_es_malo = k in MALOS_ALTOS
        hacia_alto = alto_es_malo == (cual == "pes")
        extremo = b if hacia_alto else a
        p[k] = m + intensidad * (extremo - m)
    return {k: np.array([v], dtype=float) for k, v in p.items()}


def main():
    rng = np.random.default_rng(SEMILLA)
    muestras = {k: tri(k, N, rng) for k in PARAMS}
    fl, be, co, inv, comp = modelo(muestras)
    ind = indicadores(fl, be, co, inv)

    def resumen(x):
        x = x[~np.isnan(x)]
        return {"media": float(x.mean()), "p5": float(np.percentile(x, 5)),
                "p50": float(np.percentile(x, 50)), "p95": float(np.percentile(x, 95))}

    res = {
        "semilla": SEMILLA, "iteraciones": N, "horizonte_meses": MESES,
        "tna": TNA, "tasa_mensual": TASA_MENSUAL, "smvm_hora": SMVM_HORA,
        "montecarlo": {
            "van": resumen(ind["van"]),
            "prob_van_positivo": float((ind["van"] > 0).mean()),
            "bc": resumen(ind["bc"]),
            "roi": resumen(ind["roi"]),
            "tir_mensual": resumen(ind["tir"]),
            "recupero_meses": resumen(ind["recupero"]),
            "prob_recupero_12m": float((~np.isnan(ind["recupero"])).mean()),
            "beneficio_mensual_estable": resumen(comp["tiempo"] + comp["errores"] + comp["recupero"]),
            "inversion": resumen(comp["inversion"]),
            "componentes_media": {k: float(np.mean(v)) for k, v in comp.items()},
        },
        "escenarios": {},
    }
    for cual in ("pes", "base", "opt"):
        f, b, c, i, cp = modelo(escenario(cual))
        r = indicadores(f, b, c, i)
        res["escenarios"][cual] = {
            "van": float(r["van"][0]), "bc": float(r["bc"][0]), "roi": float(r["roi"][0]),
            "tir_mensual": float(r["tir"][0]) if not np.isnan(r["tir"][0]) else None,
            "recupero_meses": float(r["recupero"][0]) if not np.isnan(r["recupero"][0]) else None,
            "inversion": float(cp["inversion"][0]) if np.ndim(cp["inversion"]) else float(cp["inversion"]),
            "beneficio_mensual_estable": float((cp["tiempo"] + cp["errores"] + cp["recupero"])[0]),
            "componentes": {k: float(np.atleast_1d(v)[0]) for k, v in cp.items()},
            "flujos": [float(x) for x in f[0]],
        }

    f, b, c, i, cp = modelo(escenario("pes", intensidad=1.0))
    r = indicadores(f, b, c, i)
    res["estres_todo_mal"] = {"van": float(r["van"][0]), "bc": float(r["bc"][0]),
                              "beneficio_mensual_estable": float((cp["tiempo"] + cp["errores"] + cp["recupero"])[0]),
                              "inversion": float(cp["inversion"][0])}

    # --- Sensibilidad (tornado): VAN base moviendo una variable a su mínimo y a su máximo ---
    base_van = res["escenarios"]["base"]["van"]
    tornado = []
    for k in PARAMS:
        a, m, b = PARAMS[k]
        if a == b:
            continue
        vals = []
        for v in (a, b):
            p = escenario("base")
            p[k] = np.array([v], dtype=float)
            f, bb, c, i, _ = modelo(p)
            vals.append(float(indicadores(f, bb, c, i)["van"][0]))
        tornado.append((k, vals[0], vals[1]))
    tornado.sort(key=lambda t: abs(t[2] - t[1]), reverse=True)
    res["tornado"] = [{"variable": k, "van_con_min": lo, "van_con_max": hi} for k, lo, hi in tornado]
    res["van_base"] = base_van

    (AQUI / "resultados.json").write_text(json.dumps(res, indent=2, ensure_ascii=False))
    graficos(ind, res)
    imprimir(res)


ROJO, VERDE, GRIS, TINTA = "#E83030", "#309880", "#9A8F84", "#2B2420"


def miles(x, _=None):
    if round(x / 1000) == 0:
        return "$0"
    signo = "−" if x < 0 else ""
    return f"{signo}${abs(x)/1000:,.0f} mil".replace(",", ".")


def estilo(ax):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.spines["left"].set_color(GRIS)
    ax.spines["bottom"].set_color(GRIS)
    ax.tick_params(colors=TINTA, labelsize=10)


def graficos(ind, res):
    plt.rcParams["font.family"] = "DejaVu Sans"
    # 1. Histograma del VAN
    fig, ax = plt.subplots(figsize=(10, 5.2), dpi=150)
    van = ind["van"]
    ax.hist(van[van >= 0], bins=60, color=VERDE, alpha=0.9, label="VAN > 0")
    ax.hist(van[van < 0], bins=10, color=ROJO, alpha=0.9, label="VAN < 0")
    p5, p50, p95 = (res["montecarlo"]["van"][k] for k in ("p5", "p50", "p95"))
    for v, t in ((p5, "P5"), (p50, "Mediana"), (p95, "P95")):
        ax.axvline(v, color=TINTA, lw=1, ls="--")
        ax.text(v, ax.get_ylim()[1] * 0.95, f" {t}\n {miles(v)}", color=TINTA, fontsize=9, va="top")
    ax.xaxis.set_major_formatter(miles)
    ax.set_xlabel("VAN a 12 meses (pesos de oct-2026)", color=TINTA)
    ax.set_ylabel("Iteraciones", color=TINTA)
    ax.set_title(f"Simulación Monte Carlo del VAN ({N:,} iteraciones) · "
                 f"P(VAN > 0) = {res['montecarlo']['prob_van_positivo']:.1%}".replace(",", "."),
                 color=TINTA, fontsize=12, loc="left")
    estilo(ax)
    fig.tight_layout()
    fig.savefig(AQUI / "montecarlo_van.png")
    plt.close(fig)

    # 2. Flujo acumulado descontado por escenario
    fig, ax = plt.subplots(figsize=(10, 5.2), dpi=150)
    nombres = {"pes": ("Pesimista", ROJO), "base": ("Base", TINTA), "opt": ("Optimista", VERDE)}
    for k, (n, c) in nombres.items():
        acum = np.cumsum(np.array(res["escenarios"][k]["flujos"]) * DESC)
        ax.plot(range(MESES + 1), acum, color=c, lw=2.2, marker="o", ms=4, label=n)
    ax.axhline(0, color=GRIS, lw=1)
    ax.yaxis.set_major_formatter(miles)
    ax.set_xticks(range(MESES + 1))
    ax.set_xlabel("Mes (0 = desarrollo)", color=TINTA)
    ax.set_ylabel("Flujo descontado acumulado", color=TINTA)
    ax.set_title("Recupero de la inversión por escenario", color=TINTA, fontsize=12, loc="left")
    ax.legend(frameon=False)
    estilo(ax)
    fig.tight_layout()
    fig.savefig(AQUI / "flujo_acumulado.png")
    plt.close(fig)

    # 3. Tornado
    etiquetas = {
        "recupero_perdidos": "% de pedidos perdidos que se recuperan",
        "perdidos_semana": "Pedidos perdidos por semana",
        "pizzas_por_pedido": "Pizzas por pedido",
        "margen": "Margen de ganancia",
        "valor_hora_desarrollo": "Valor de la hora de desarrollo",
        "adopcion": "% de pedidos por la web",
        "min_chat_antes": "Minutos de chat por pedido (hoy)",
        "costo_error_pizzas": "Costo de un error",
        "tasa_error_antes": "Tasa de error hoy",
        "horas_desarrollo": "Horas de desarrollo",
        "horas_mant_mes": "Horas de mantenimiento por mes",
        "tasa_error_despues": "Tasa de error con la web",
        "min_chat_despues": "Minutos de atención con la web",
        "valor_hora_atencion": "Valor de la hora de atención",
        "pedidos_dia_semana": "Pedidos por noche (mar a vie)",
        "pedidos_fin_semana": "Pedidos por noche (sáb y dom)",
    }
    top = res["tornado"][:8][::-1]
    fig, ax = plt.subplots(figsize=(10, 5.2), dpi=150)
    base = res["van_base"]
    for i, t in enumerate(top):
        lo, hi = sorted((t["van_con_min"], t["van_con_max"]))
        ax.barh(i, lo - base, left=base, color=ROJO, height=0.6)
        ax.barh(i, hi - base, left=base, color=VERDE, height=0.6)
    ax.axvline(base, color=TINTA, lw=1)
    ax.set_yticks(range(len(top)))
    ax.set_yticklabels([etiquetas.get(t["variable"], t["variable"]) for t in top])
    ax.xaxis.set_major_formatter(miles)
    ax.set_xlabel("VAN a 12 meses", color=TINTA)
    ax.set_title(f"Sensibilidad del VAN (escenario base = {miles(base)})", color=TINTA,
                 fontsize=12, loc="left")
    estilo(ax)
    fig.tight_layout()
    fig.savefig(AQUI / "tornado.png")
    plt.close(fig)


def imprimir(res):
    mc = res["montecarlo"]
    print(json.dumps({k: mc[k] for k in ("van", "prob_van_positivo", "bc", "roi", "tir_mensual",
                                          "recupero_meses", "prob_recupero_12m",
                                          "beneficio_mensual_estable", "inversion",
                                          "componentes_media")}, indent=1))
    for k, v in res["escenarios"].items():
        print(k, {x: v[x] for x in ("van", "bc", "roi", "tir_mensual", "recupero_meses",
                                    "inversion", "beneficio_mensual_estable", "componentes")})
    print("tornado:", [(t["variable"], round(t["van_con_min"]), round(t["van_con_max"]))
                       for t in res["tornado"][:8]])


if __name__ == "__main__":
    main()

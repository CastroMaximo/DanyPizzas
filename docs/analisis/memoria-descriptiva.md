# Memoria descriptiva — Dany Pizzas

> Versión 1.0 · 07/10/2026 · Fuente: cuestionario del negocio y respuestas del 07/10.
> Misión, visión y valores redactados por el estudiante y **aprobados por el dueño el 07/10/2026**.

## 1. Datos generales

| Dato | Valor |
|---|---|
| Nombre comercial | **Dany Pizzas** (Instagram: @dany.pizzeria) |
| Rubro | Gastronomía: elaboración y venta de pizzas con envío a domicilio |
| Inicio de actividades | 2024 |
| Forma jurídica | **Emprendimiento familiar informal** (sin inscripción en monotributo) |
| Ubicación | Chilecito, provincia de La Rioja, Argentina |
| Modalidad | “Puertas cerradas”: solo envío a domicilio, sin salón ni retiro |
| Horario | Martes a domingo, 21:00 a 00:30 (lunes cerrado) |
| Canal de venta | WhatsApp (número común) e Instagram para difusión |
| Medios de cobro | Mercado Pago, transferencia y efectivo contra entrega |
| Producto | Carta de 7 variedades, pizza entera (8 porciones) o mitad (4 porciones), mitad y mitad permitida; precios de $8.500 a $10.500 |
| Volumen actual | ≈ 7 pedidos por noche entre semana y ≈ 11 los fines de semana (≈ 50 por semana), de 1 a 3 pizzas por pedido |

## 2. Organización

Tres personas, más un repartidor externo.

```
                 Cocinero (dueño)
                 Responsable del negocio
                        │
          ┌─────────────┴─────────────┐
     Ayudante de cocina        Encargado de atención
                                al cliente
                                      │
                             Repartidor (externo)
```

| Puesto | Personas | Funciones |
|---|---:|---|
| **Cocinero (dueño)** | 1 | Dirige el negocio, elabora las pizzas, define la carta y los precios. En el sistema: administrador de la hoja `Catalogo` (precios y disponibilidad). |
| **Ayudante** | 1 | Preparación de masas e ingredientes, armado y horneado junto al cocinero, empaque. |
| **Encargado de atención al cliente** | 1 | Atiende WhatsApp, toma los pedidos, valida pagos y comprobantes, coordina con el repartidor. En el sistema: recibe el recibo, marca los estados en la planilla. |
| **Repartidor** | externo | Lleva el pedido; el costo del envío se arregla entre el cliente y el repartidor (no lo cobra el negocio). |

**Implicancia para el proyecto:** toda la toma de pedidos depende de **una sola persona** (atención al cliente). En las noches fuertes es el cuello de botella: de ahí salen las demoras, los errores y los pedidos perdidos que ataca el sistema (ver `ishikawa.md`).

## 3. Misión, visión y valores ✅

El negocio no tenía misión ni visión escritas. Las redactó el estudiante y el dueño las **aprobó sin cambios el 07/10/2026**:

**Misión.** Llevar a las casas de Chilecito pizzas caseras, abundantes y a buen precio, hechas en familia, con un pedido simple y una atención cercana cada noche.

**Visión.** Ser, para 2028, la pizzería de envío a domicilio de referencia en Chilecito por su sabor casero y por lo fácil que es pedir, creciendo de forma ordenada y formalizando el emprendimiento.

**Valores.** Calidad casera · Precio justo · Trato cercano · Cumplimiento con el horario de entrega.

## 4. Infraestructura

| Recurso | Detalle |
|---|---|
| Lugar de elaboración | Cocina de la vivienda familiar |
| Equipamiento | 1 horno pizzero de **6 moldes** (6 pizzas por tanda) |
| Capacidad en una noche fuerte | 11 pedidos × 2 pizzas = 22 pizzas ≈ **4 tandas** de horno |
| Reparto | Repartidor externo (motoquero) |
| Tecnología antes del proyecto | Celular con WhatsApp común, Instagram, cuenta de Mercado Pago |
| Tecnología después del proyecto | Sitio web en GitHub Pages ($0), planilla de pedidos en Google Sheets con Apps Script ($0), código QR para difundir el enlace |

## 5. Posición estratégica (resumen)

Ver `foda.md` (validado por el negocio el 07/10/2026). EFI = 2,45 y EFE = 2,32 → **cuadrante V, “Conservar y mantener”**: estrategias de penetración de mercado y desarrollo de producto. El sistema web es una estrategia de ese tipo: ordena la venta por el canal que el cliente ya usa, sin cambiar el producto.

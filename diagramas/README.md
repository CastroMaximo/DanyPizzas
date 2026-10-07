# Diagramas — Dany Pizzas

Fuente en Mermaid (`.mmd`): GitHub los dibuja directamente en esta página. Las imágenes `.png` (para presentaciones) y `.svg` (para documentos, escalan sin perder calidad) se generan desde la misma fuente.

Para regenerar las imágenes después de editar un `.mmd`:

```bash
npx -p @mermaid-js/mermaid-cli mmdc -i diagramas/clases.mmd -o diagramas/clases.png -b white -s 2
```

## 1. Casos de uso

Qué puede hacer cada actor con el sistema. CU-04 *Confirmar pedido* incluye calcular el total, asignar el N° de pedido y registrarlo en la planilla.

Imagen: [`casos-de-uso.png`](casos-de-uso.png) · [`casos-de-uso.svg`](casos-de-uso.svg)

```mermaid
flowchart LR
  cliente["<b>Cliente</b><br/>(actor)"]:::actor

  subgraph SIS["Sistema web de pedidos — Dany Pizzas"]
    CU01(["CU-01 Ver carta, precios y horario"])
    CU02(["CU-02 Armar pedido<br/>(entera / mitad / mitad y mitad)"])
    CU03(["CU-03 Completar datos de entrega y pago"])
    CU04(["CU-04 Confirmar pedido"])
    CU05(["CU-05 Enviar pedido por WhatsApp"])
    CU06(["CU-06 Enviar comprobante de pago"])
    CU04a(["Calcular total"]):::inc
    CU04b(["Asignar N° de pedido"]):::inc
    CU04c(["Registrar en planilla"]):::inc
    CU07(["CU-07 Recibir y validar pedido"])
    CU08(["CU-08 Actualizar estado del pedido"])
    CU09(["CU-09 Cambiar precios y disponibilidad"])
    CU10(["CU-10 Consultar pedidos del mes"])
    CU11(["CU-11 Pausar registro web"])
  end

  atencion["<b>Atención</b><br/>(encargado del celular)"]:::actor
  duenio["<b>Dueño</b><br/>(administrador)"]:::actor
  wsp["<b>WhatsApp</b><br/>(sistema externo)"]:::externo

  cliente --- CU01 & CU02 & CU03 & CU04 & CU05 & CU06
  CU04 -. "«include»" .-> CU04a & CU04b & CU04c
  CU05 --- wsp
  CU06 --- wsp
  CU07 --- atencion
  CU08 --- atencion
  CU07 --- duenio
  CU08 --- duenio
  CU09 --- duenio
  CU10 --- duenio
  CU11 --- duenio
  wsp --- CU07

  classDef actor fill:#C42A24,stroke:#8E1C18,color:#FFF8EE
  classDef externo fill:#1F6E5D,stroke:#154D41,color:#FFF8EE
  classDef inc fill:#FFF8EE,stroke:#B9A28C,stroke-dasharray:4 3,color:#5A463C
  style SIS fill:#FBF5EC,stroke:#C42A24,stroke-width:2px,color:#2A1A15
```

## 2. Clases (modelo de dominio y módulos)

Entidades del negocio (Pedido, ItemPedido, Pizza, Cliente, MedioPago, EstadoPedido) y los módulos del código que las usan (`app.js`, `lib.js`, `Code.gs`) y las hojas de Google Sheets donde se guardan.

Imagen: [`clases.png`](clases.png) · [`clases.svg`](clases.svg)

```mermaid
classDiagram
  direction LR
  class Configuracion {
    +negocio: nombre, whatsapp, tiempoEstimado
    +pago: alias, titular, minutosComprobante
    +horarios: dia → [apertura, cierre]
    +redondeoMitad = 500
    +backendUrl
  }
  class Pizza {
    +id: string
    +nombre: string
    +ingredientes: string
    +precio: int  «entera»
    +disponible: bool
    +imagen: string
  }
  class ItemPedido {
    +id: string  «de Pizza»
    +tam: E | M
    +cant: int
  }
  class Pedido {
    +id: DP-AAMMDD-NNN
    +fecha: Date
    +items: ItemPedido[]
    +total: int
    +porciones: int
    +entrega: asap | hora
    +estado: EstadoPedido
    +fueraDeHorario: bool
  }
  class EstadoPedido {
    <<enumeration>>
    Nuevo
    Pagado
    En preparación
    Entregado
    Cancelado
    Descartado
  }
  class Cliente {
    +nombre
    +telefono
    +direccion
    +referencia
  }
  class MedioPago {
    +id: mp | transferencia | efectivo
    +label
    +requiereComprobante: bool
  }
  class DanyLib {
    <<módulo lib.js>>
    +precioMitad(precio, paso) int
    +calcularCarrito(items, catalogo, cfg) Resumen
    +estadoLocal(fecha, cfg) Estado
    +validarPedido(datos, cfg) Resultado
    +generarId(fecha, cfg) string
    +armarRecibo(pedido, cfg) string
    +urlWhatsApp(texto, cfg) string
  }
  class InterfazApp {
    <<módulo app.js>>
    -carrito: ItemPedido[]
    +pintarCatalogo()
    +agregar(id, tam)
    +onSubmit(evento)
    +registrarPedido(payload) Promise
    +mostrarConfirmacion(datos)
  }
  class BackendAppsScript {
    <<Code.gs>>
    +doGet(action=catalogo) JSON
    +doPost(pedido) JSON
    -filtrarBots(datos)
    -validar(datos)
    -controlarLimites(pedido)
    -calcular(items, catalogo)
    -siguienteId(hoja, fecha)
  }
  class HojaCatalogo {
    <<Google Sheets>>
    id, nombre, ingredientes, precio_entera, disponible
  }
  class HojaPedidosMes {
    <<Google Sheets>>
    una fila por Pedido (15 columnas)
  }

  Pedido "1" *-- "1..30" ItemPedido : contiene
  ItemPedido "*" --> "1" Pizza : refiere a
  Pedido "*" --> "1" Cliente : para
  Pedido "*" --> "1" MedioPago : se paga con
  Pedido --> EstadoPedido : estado
  InterfazApp ..> DanyLib : usa
  InterfazApp ..> Configuracion : lee
  InterfazApp ..> BackendAppsScript : HTTPS (GET / POST)
  DanyLib ..> Configuracion : lee
  BackendAppsScript --> HojaCatalogo : lee precios
  BackendAppsScript --> HojaPedidosMes : agrega filas
  HojaCatalogo ..> Pizza : persiste
  HojaPedidosMes ..> Pedido : persiste
```

## 3. C4 — Nivel 1: Contexto

El sistema como una caja negra: quiénes lo usan (cliente y equipo) y con qué sistemas externos se relaciona (WhatsApp, Mercado Pago / banco, Instagram).

Imagen: [`c4-contexto.png`](c4-contexto.png) · [`c4-contexto.svg`](c4-contexto.svg)

```mermaid
flowchart TB
  cliente["<b>Cliente</b><br/>[Persona]<br/>Vecino de Chilecito que pide<br/>pizza con envío a domicilio"]:::persona
  equipo["<b>Equipo de Dany Pizzas</b><br/>[Persona]<br/>Atención, cocina y dueño<br/>(3 personas)"]:::persona

  sistema["<b>Sistema web de pedidos</b><br/>[Sistema de software]<br/>Muestra la carta, arma el pedido,<br/>calcula el total, asigna N° y lo registra"]:::sistema

  wsp["<b>WhatsApp</b><br/>[Sistema externo]<br/>Canal donde llega el pedido<br/>y el comprobante"]:::externo
  pago["<b>Mercado Pago / banco</b><br/>[Sistema externo]<br/>Cobro por transferencia<br/>al alias del negocio"]:::externo
  ig["<b>Instagram</b><br/>[Sistema externo]<br/>Difusión del enlace y del QR"]:::externo

  cliente -- "Ve la carta y confirma su pedido<br/>[HTTPS]" --> sistema
  sistema -- "Abre el chat con el recibo listo<br/>[enlace wa.me]" --> wsp
  cliente -- "Envía el recibo y el comprobante" --> wsp
  wsp -- "Recibe pedidos y comprobantes" --> equipo
  cliente -- "Paga" --> pago
  equipo -- "Cambia precios, consulta y<br/>marca estados de pedidos" --> sistema
  ig -- "Lleva clientes al sitio" --> cliente

  classDef persona fill:#C42A24,stroke:#8E1C18,color:#FFF8EE
  classDef sistema fill:#1F6E5D,stroke:#154D41,color:#FFF8EE
  classDef externo fill:#8C7B70,stroke:#6B5A50,color:#FFF8EE
```

## 4. C4 — Nivel 2: Contenedores

Las piezas desplegables dentro del sistema: sitio web (GitHub Pages), almacenamiento local del navegador, backend (Google Apps Script) y planilla (Google Sheets), más la publicación automática con GitHub Actions.

Imagen: [`c4-contenedores.png`](c4-contenedores.png) · [`c4-contenedores.svg`](c4-contenedores.svg)

```mermaid
flowchart TB
  cliente["<b>Cliente</b><br/>[Persona]"]:::persona
  atencion["<b>Atención / Dueño</b><br/>[Persona]"]:::persona

  subgraph SIS["Sistema web de pedidos — Dany Pizzas"]
    direction TB
    web["<b>Sitio web</b><br/>[HTML + CSS + JavaScript, GitHub Pages]<br/>Carta, carrito, validación, recibo<br/>y apertura de WhatsApp"]:::contenedor
    local[("<b>Almacenamiento local</b><br/>[localStorage del navegador]<br/>Carrito y datos del cliente")]:::datos
    api["<b>Backend</b><br/>[Google Apps Script, aplicación web]<br/>Recalcula total, asigna N° secuencial,<br/>filtra pedidos falsos, sirve el catálogo"]:::contenedor
    hoja[("<b>Planilla</b><br/>[Google Sheets]<br/>Hoja Catalogo + hoja Pedidos AAAA-MM")]:::datos
  end

  wsp["<b>WhatsApp</b><br/>[Sistema externo]"]:::externo
  gh["<b>GitHub Actions</b><br/>[CI/CD]<br/>44 pruebas y publicación"]:::externo

  cliente -- "Usa<br/>[HTTPS]" --> web
  web -- "Guarda / lee" --> local
  web -- "GET catálogo · POST pedido<br/>[HTTPS, JSON]" --> api
  api -- "Lee precios · agrega filas" --> hoja
  web -- "Abre chat con el recibo<br/>[wa.me]" --> wsp
  wsp -- "Pedido y comprobante" --> atencion
  atencion -- "Edita precios y estados<br/>[Google Sheets]" --> hoja
  gh -- "Prueba y publica<br/>en cada cambio" --> web

  classDef persona fill:#C42A24,stroke:#8E1C18,color:#FFF8EE
  classDef contenedor fill:#1F6E5D,stroke:#154D41,color:#FFF8EE
  classDef datos fill:#2E8B74,stroke:#154D41,color:#FFF8EE
  classDef externo fill:#8C7B70,stroke:#6B5A50,color:#FFF8EE
  style SIS fill:#FBF5EC,stroke:#1F6E5D,stroke-width:2px,stroke-dasharray:6 4,color:#2A1A15
```

## 5. Secuencia — Hacer un pedido

El flujo completo de un pedido, incluido qué pasa si los datos están incompletos o si el backend no responde (el pedido sigue igual por WhatsApp).

Imagen: [`secuencia-pedido.png`](secuencia-pedido.png) · [`secuencia-pedido.svg`](secuencia-pedido.svg)

```mermaid
sequenceDiagram
  autonumber
  actor C as Cliente
  participant W as Sitio web<br/>(app.js + lib.js)
  participant B as Backend<br/>(Apps Script)
  participant P as Planilla<br/>(Google Sheets)
  participant Z as WhatsApp
  actor N as Negocio

  C->>W: Abre el sitio (enlace o QR)
  W->>B: GET ?action=catalogo
  B->>P: leerCatalogo()
  P-->>B: precios y disponibilidad
  B-->>W: catálogo vigente
  C->>W: Agrega pizzas (entera / mitad)
  W->>W: calcularCarrito() → total y porciones
  C->>W: Completa datos y medio de pago → Confirmar
  W->>W: validarPedido()
  alt datos incompletos
    W-->>C: Marca los campos con error
  else datos válidos
    W->>B: POST pedido (items, datos, campo trampa, tiempo, nonce)
    B->>B: filtrarBots() · validar() · controlarLimites()
    B->>P: leerCatalogo() y calcular() (recalcula el total)
    B->>P: siguienteId() y agrega la fila (Estado = Nuevo)
    alt registro correcto
      B-->>W: { id: DP-AAMMDD-NNN, total, líneas }
    else backend rechaza o no responde
      W->>W: generarId() local (el pedido sigue igual)
    end
    W->>W: armarRecibo()
    W-->>C: N° de pedido + datos de pago
    C->>Z: Abre wa.me con el recibo y lo envía
    Z->>N: Recibo completo del pedido
    opt Mercado Pago o transferencia
      C->>Z: Comprobante (dentro de 5 min)
      Z->>N: Comprobante
    end
    N->>N: Valida el pago y prepara
    N->>P: Estado: Pagado → En preparación → Entregado
  end
```

/* ============================================================
   CONFIGURACIÓN DEL NEGOCIO — Dany Pizzas
   Todo lo que puede cambiar (teléfono, alias, horarios) está acá.
   No hace falta tocar ningún otro archivo para esos cambios.
   ============================================================ */
(function (root) {
  var CONFIG = {
    negocio: {
      nombre: 'Dany Pizzas',
      lugar: 'Chilecito, La Rioja',
      instagram: 'https://www.instagram.com/dany.pizzeria/',
      // Número de WhatsApp que recibe los pedidos: código de país + área + número, SIN "+" ni espacios.
      whatsapp: '5493825620508',
      whatsappVisible: '+54 9 3825 62-0508',
      tiempoEstimado: '20–30 min'
    },

    pago: {
      alias: 'castro.md',
      titular: 'Castro Maximo Daniel',
      banco: 'Mercado Pago',
      // Minutos que tiene el cliente para mandar el comprobante (transferencia / Mercado Pago)
      minutosComprobante: 5,
      medios: [
        { id: 'mp', label: 'Mercado Pago', requiereComprobante: true },
        { id: 'transferencia', label: 'Transferencia bancaria', requiereComprobante: true },
        { id: 'efectivo', label: 'Efectivo (pago al recibir)', requiereComprobante: false }
      ]
    },

    // Horarios por día de la semana (0 = domingo … 6 = sábado). [apertura, cierre] o null si no abre.
    // Si el cierre es menor que la apertura, el cierre cae después de medianoche.
    horarios: {
      0: ['21:00', '00:30'],
      1: null,
      2: ['21:00', '00:30'],
      3: ['21:00', '00:30'],
      4: ['21:00', '00:30'],
      5: ['21:00', '00:30'],
      6: ['21:00', '00:30']
    },
    zonaHoraria: 'America/Argentina/Buenos_Aires',

    // true  = fuera de horario se puede armar el pedido igual (se avisa que está cerrado).
    // false = fuera de horario se bloquea el envío.
    permitirFueraDeHorario: true,

    // Pizzas: una sola medida. Entera = 8 porciones, mitad = 4.
    porciones: { E: 8, M: 4 },
    // La mitad cuesta la mitad del precio, redondeada HACIA ARRIBA a este múltiplo (en pesos).
    redondeoMitad: 500,

    // Prefijo del ID de pedido: DP-AAMMDD-001
    prefijoId: 'DP',

    // URL del backend (Google Apps Script). Vacío = el sitio funciona igual, sin registrar en la planilla.
    backendUrl: '',
    backendTimeoutMs: 6000
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = CONFIG; }
  else { root.DANY_CONFIG = CONFIG; }
})(typeof window !== 'undefined' ? window : this);

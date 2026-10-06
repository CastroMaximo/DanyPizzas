/* ============================================================
   CATÁLOGO — precio de la pizza ENTERA en pesos argentinos.
   - disponible: false → no se muestra.
   - imagen: ruta de la foto (null = ilustración genérica).
   Si el backend está configurado, el catálogo se lee de la hoja "Catalogo"
   del Google Sheet y este archivo queda como respaldo.
   ============================================================ */
(function (root) {
  var CATALOGO = [
    { id: 'muzza', nombre: 'Muzza', precio: 8500, disponible: true,
      ingredientes: 'Salsa de tomate, mozzarella, orégano y olivas verdes', imagen: 'assets/img/muzza.jpg' },
    { id: 'fugazzeta', nombre: 'Fugazzeta', precio: 9500, disponible: true,
      ingredientes: 'Salsa de tomate, mozzarella, cebolla rebosada, orégano y olivas verdes', imagen: 'assets/img/fugazzeta.jpg' },
    { id: 'napolitana', nombre: 'Napolitana', precio: 9500, disponible: true,
      ingredientes: 'Salsa de tomate, mozzarella, tomate, provenzal, orégano y aceitunas verdes', imagen: 'assets/img/napolitana.jpg' },
    { id: 'especial', nombre: 'Especial', precio: 9500, disponible: true,
      ingredientes: 'Salsa de tomate, mozzarella, jamón, morrón, huevo, orégano y aceituna verde', imagen: 'assets/img/especial.jpg' },
    { id: 'doble-muzza', nombre: 'Doble Muzza', precio: 9500, disponible: true,
      ingredientes: 'Salsa de tomate, abundante mozzarella, orégano y olivas verdes', imagen: 'assets/img/muzza.jpg' },
    { id: 'calabresa', nombre: 'Calabresa', precio: 9500, disponible: true,
      ingredientes: 'Salsa de tomate, mozzarella, salame picado grueso, orégano y olivas verdes', imagen: 'assets/img/calabresa.jpg' },
    { id: 'de-la-casa', nombre: 'De la Casa', precio: 10500, disponible: true,
      ingredientes: 'Salsa de tomate, mozzarella, carne picada, huevo y olivas verdes', imagen: 'assets/img/de-la-casa.jpg' }
  ];

  if (typeof module !== 'undefined' && module.exports) { module.exports = CATALOGO; }
  else { root.DANY_CATALOGO = CATALOGO; }
})(typeof window !== 'undefined' ? window : this);

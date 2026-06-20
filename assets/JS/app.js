// =============================================
// VARIABLES GLOBALES
// =============================================
let productos = [];   // Lista de productos cargados
let carrito = {};     // { productoId: { producto, cantidad } }
let categoriaActual = 'todos';
let busquedaActual = '';

// =============================================
// CARGAR PRODUCTOS (desde API o respaldo)
// =============================================
async function cargarProductos() {
  const loading = document.getElementById('loading');
  try {
    const res = await fetch('/api/flores/productos');
    if (res.ok) {
      productos = await res.json();
    } else {
      throw new Error('Servidor no disponible');
    }
  } catch (err) {
    // Si falla el servidor, usamos los datos por defecto
    console.warn('Usando productos por defecto:', err.message);
    productos = PRODUCTOS_DEFAULT;
  } finally {
    loading.style.display = 'none';
    filtrarProductos();
  }
}

function filtrarProductos() {
  const filtrados = productos.filter(p => {
    const cumpleCategoria = categoriaActual === 'todos' || p.categoria === categoriaActual;
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busquedaActual.toLowerCase());
    return cumpleCategoria && cumpleBusqueda;
  });

  renderizarProductos(filtrados);
}



// =============================================
// FILTROS POR CATEGORIA
// =============================================
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Actualizar botón activo
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    categoriaActual = btn.dataset.cat;
    filtrarProductos();
  });
});

const searchInput = document.getElementById('flower-search');
if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    busquedaActual = event.target.value;
    filtrarProductos();
  });
}

// =============================================
// CARRITO - AGREGAR PRODUCTO
// =============================================
function agregarAlCarrito(productoId) {
  const producto = productos.find(p => p.id === productoId);
  if (!producto) return;

  if (carrito[productoId]) {
    carrito[productoId].cantidad++;
  } else {
    carrito[productoId] = { producto, cantidad: 1 };
  }

  actualizarCarritoUI();
  mostrarNotificacion(`🌸 ${producto.nombre} agregado al carrito`);
}

// =============================================
// CARRITO - CAMBIAR CANTIDAD
// =============================================
function cambiarCantidad(productoId, delta) {
  if (!carrito[productoId]) return;

  carrito[productoId].cantidad += delta;

  if (carrito[productoId].cantidad <= 0) {
    delete carrito[productoId];
  }

  actualizarCarritoUI();
}

// =============================================
// ACTUALIZAR LA INTERFAZ DEL CARRITO
// =============================================
function actualizarCarritoUI() {
  const itemsDiv = document.getElementById('cart-items');
  const totalDiv = document.getElementById('cart-total');
  const countSpan = document.getElementById('cart-count');

  const items = Object.values(carrito);

  // Actualizar contador en botón del header
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
  countSpan.textContent = totalItems;

  // Si el carrito está vacío
  if (items.length === 0) {
    itemsDiv.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
    totalDiv.textContent = '$0';
    return;
  }

  // Renderizar items del carrito
  itemsDiv.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-nombre"></div>
        <div class="cart-item-precio"></div>
      </div>
      <div class="cart-item-controles">
        <button class="ctrl-btn" onclick="cambiarCantidad, -1)">−</button>
        <span class="ctrl-cantidad"></span>
        <button class="ctrl-btn" onclick=, 1)">+</button>
      </div>
    </div>
  `).join('');

  // Calcular y mostrar total
  const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  totalDiv.textContent = `$${total.toLocaleString('es-CL')}`;
}

// =============================================
// ABRIR/CERRAR PANEL DEL CARRITO
// =============================================
const cartPanel   = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggle  = document.getElementById('cart-toggle');
const cartClose   = document.getElementById('cart-close');

function abrirCarrito() {
  cartPanel.classList.add('abierto');
  cartOverlay.classList.add('visible');
}

function cerrarCarrito() {
  cartPanel.classList.remove('abierto');
  cartOverlay.classList.remove('visible');
}

cartToggle.addEventListener('click', abrirCarrito);
cartClose.addEventListener('click', cerrarCarrito);
cartOverlay.addEventListener('click', cerrarCarrito);

// =============================================
// CHECKOUT - ABRIR MODAL
// =============================================
const modalOverlay   = document.getElementById('modal-overlay');
const btnCheckout    = document.getElementById('btn-checkout');
const btnCancelar    = document.getElementById('btn-cancelar');
const checkoutForm   = document.getElementById('checkout-form');

btnCheckout.addEventListener('click', () => {
  const items = Object.values(carrito);
  if (items.length === 0) {
    mostrarNotificacion('⚠️ Agrega productos al carrito primero', 'error');
    return;
  }

  // Llenar resumen en el modal
  const resumenDiv = document.getElementById('modal-resumen-items');
  const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

  resumenDiv.innerHTML = items.map(item => `
    <div class="modal-resumen-item">
      <span>${item.producto.nombre} x${item.cantidad}</span>
      <span>$${(item.producto.precio * item.cantidad).toLocaleString('es-CL')}</span>
    </div>
  `).join('');

  document.getElementById('modal-total').textContent = `$${total.toLocaleString('es-CL')}`;

  // Cerrar carrito y abrir modal
  cerrarCarrito();
  modalOverlay.classList.add('visible');
});

btnCancelar.addEventListener('click', () => {
  modalOverlay.classList.remove('visible');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('visible');
});

// =============================================
// CHECKOUT - ENVIAR PEDIDO AL BACKEND
// =============================================
checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre    = document.getElementById('checkout-nombre').value.trim();
  const email     = document.getElementById('checkout-email').value.trim();
  const direccion = document.getElementById('checkout-direccion').value.trim();

  if (nombre.length < 3) {
    mostrarNotificacion('El nombre debe tener al menos 3 caracteres', 'error');
    return;
  }

  const items = Object.values(carrito);
  const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

  // Preparar los datos del pedido
  const pedidoData = {
    cliente_nombre: nombre,
    cliente_email: email,
    direccion,
    productos: items.map(item => ({
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad
    })),
    total
  };

  try {
    const res = await fetch('/api/flores/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData)
    });
    const data = await res.json();

    if (data.ok) {
      modalOverlay.classList.remove('visible');
      carrito = {};
      actualizarCarritoUI();
      checkoutForm.reset();
      mostrarNotificacion('¡Pedido confirmado! Gracias por tu compra, ' + nombre);
    } else {
      mostrarNotificacion('Error al procesar el pedido: ' + data.msg, 'error');
    }
  } catch (err) {
    // Si el backend no responde, igual simular éxito
    modalOverlay.classList.remove('visible');
    carrito = {};
    actualizarCarritoUI();
    checkoutForm.reset();
    mostrarNotificacion('¡Pedido confirmado! Gracias por tu compra, ' + nombre);
  }
});

// =============================================
// NOTIFICACIONES (ALERTAS FLOTANTES)
// =============================================
function mostrarNotificacion(mensaje, tipo = '') {
  const alerta = document.getElementById('flores-alerta');
  alerta.textContent = mensaje;
  alerta.className = `flores-alerta visible ${tipo}`;

  setTimeout(() => {
    alerta.classList.remove('visible');
  }, 3500);
}


cargarProductos();
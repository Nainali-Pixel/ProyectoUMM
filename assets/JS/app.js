let productos = [];
let carrito = {};
let categoriaActual = 'todos';
let busquedaActual = '';

// ─── localStorage ───────────────────────────────────────────────────────────

function cargarCarritoDesdeLocalStorage() {
  try {
    const raw = localStorage.getItem('carrito');
    if (raw) carrito = JSON.parse(raw);
  } catch (err) {
    console.error('Error al cargar el carrito:', err);
    carrito = {};
  }
}

function guardarCarritoEnLocalStorage() {
  try {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  } catch (err) {
    console.error('Error al guardar el carrito:', err);
  }
}

// ─── Productos ───────────────────────────────────────────────────────────────

async function cargarProductos() {
  const loading = document.getElementById('loading');
  try {
    const res = await fetch('./assets/data/productos.json');
    if (!res.ok) throw new Error('No se pudo obtener productos');
    const text = await res.text();
    if (!text.trim()) throw new Error('productos.json vacío');
    productos = JSON.parse(text);
  } catch (err) {
    console.error('Error al cargar productos:', err.message);
    productos = [];
  } finally {
    if (loading) loading.style.display = 'none';
    if (productos.length > 0) filtrarProductos();
    cargarCarritoDesdeLocalStorage();
    actualizarCarritoUI();
  }
}

function renderizarProductos(lista) {
  const grid = document.getElementById('productos-grid');
  if (!grid) return;
  if (lista.length === 0) {
    grid.innerHTML = '<p class="loading-msg">No se encontraron productos en esta categoría o búsqueda.</p>';
    return;
  }
  grid.innerHTML = lista.map(p => `
    <div class="producto-card" data-id="${p.id}">
      <div class="producto-imagen">
        <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='./assets/img/images.jpg'" />
      </div>
      <div class="producto-info">
        <span class="producto-categoria">${p.categoria}</span>
        <h3 class="producto-nombre">${p.nombre}</h3>
        <p class="producto-descripcion">${p.descripcion}</p>
        <div class="producto-footer">
          <span class="producto-precio">$${p.precio.toLocaleString('es-CL')}</span>
          <button class="btn-agregar" onclick="agregarAlCarrito(${p.id})">+ Agregar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filtrarProductos() {
  const filtrados = productos.filter(p => {
    const cat = categoriaActual === 'todos' || p.categoria.toLowerCase() === categoriaActual.toLowerCase();
    const busq = p.nombre.toLowerCase().includes(busquedaActual.toLowerCase()) ||
                 p.descripcion.toLowerCase().includes(busquedaActual.toLowerCase());
    return cat && busq;
  });
  renderizarProductos(filtrados);
}

// Filtros por categoría
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaActual = btn.dataset.cat;
    filtrarProductos();
  });
});

// Búsqueda
const searchInput = document.getElementById('flower-search');
if (searchInput) {
  searchInput.addEventListener('input', e => {
    busquedaActual = e.target.value;
    filtrarProductos();
  });
}

// ─── Carrito ─────────────────────────────────────────────────────────────────

function agregarAlCarrito(productoId) {
  const producto = productos.find(p => p.id === productoId);
  if (!producto) return;
  if (carrito[productoId]) {
    carrito[productoId].cantidad++;
  } else {
    carrito[productoId] = { producto, cantidad: 1 };
  }
  guardarCarritoEnLocalStorage();
  actualizarCarritoUI();
  mostrarNotificacion(`🌸 ${producto.nombre} agregado al carrito`);
}

function cambiarCantidad(productoId, delta) {
  if (!carrito[productoId]) return;
  carrito[productoId].cantidad += delta;
  if (carrito[productoId].cantidad <= 0) delete carrito[productoId];
  guardarCarritoEnLocalStorage();
  actualizarCarritoUI();
}

function actualizarCarritoUI() {
  const itemsDiv  = document.getElementById('cart-items');
  const totalDiv  = document.getElementById('cart-total');
  const countSpan = document.getElementById('cart-count');
  if (!itemsDiv || !totalDiv || !countSpan) return;

  const items = Object.values(carrito);
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  countSpan.textContent = totalItems;

  if (items.length === 0) {
    itemsDiv.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
    totalDiv.textContent = '$0';
    return;
  }

  itemsDiv.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">🌸</div>
      <div class="cart-item-info">
        <div class="cart-item-nombre">${item.producto.nombre}</div>
        <div class="cart-item-precio">$${item.producto.precio.toLocaleString('es-CL')}</div>
      </div>
      <div class="cart-item-controles">
        <button class="ctrl-btn" onclick="cambiarCantidad(${item.producto.id}, -1)">−</button>
        <span class="ctrl-cantidad">${item.cantidad}</span>
        <button class="ctrl-btn" onclick="cambiarCantidad(${item.producto.id}, 1)">+</button>
      </div>
    </div>
  `).join('');

  const total = items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  totalDiv.textContent = `$${total.toLocaleString('es-CL')}`;
}

// Panel carrito: abrir / cerrar
const cartPanel   = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggle  = document.getElementById('cart-toggle');
const cartClose   = document.getElementById('cart-close');

function abrirCarrito() {
  cartPanel?.classList.add('abierto');
  cartOverlay?.classList.add('visible');
}
function cerrarCarrito() {
  cartPanel?.classList.remove('abierto');
  cartOverlay?.classList.remove('visible');
}

if (cartToggle)  cartToggle.addEventListener('click', abrirCarrito);
if (cartClose)   cartClose.addEventListener('click', cerrarCarrito);
if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);

// ─── Modal de pedido ─────────────────────────────────────────────────────────

const modalPedido = document.getElementById('modal-pedido');
const modalClose  = document.getElementById('modal-close');
const btnCheckout = document.getElementById('btn-checkout');

function abrirModal() {
  // Renderizar resumen dentro del modal
  const items = Object.values(carrito);
  const listEl    = document.getElementById('summary-items-list');
  const subtotEl  = document.getElementById('summary-subtotal');
  const totalEl   = document.getElementById('summary-total-price');

  listEl.innerHTML = items.map(item => `
    <div class="summary-row">
      <span>${item.producto.nombre} x${item.cantidad}</span>
      <span>$${(item.producto.precio * item.cantidad).toLocaleString('es-CL')}</span>
    </div>
  `).join('');

  const total = items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  subtotEl.textContent = `$${total.toLocaleString('es-CL')}`;
  totalEl.textContent  = `$${total.toLocaleString('es-CL')}`;

  // Fecha mínima = mañana
  const fechaInput = document.getElementById('c-fecha');
  if (fechaInput) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1);
    fechaInput.min = hoy.toISOString().split('T')[0];
  }

  // URL de redirección para FormSubmit
  document.getElementById('form-next-url').value =
    window.location.origin + window.location.pathname.replace('index.html', '') + 'gracias.html';

  modalPedido.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  modalPedido.style.display = 'none';
  document.body.style.overflow = '';
}

if (btnCheckout) {
  btnCheckout.addEventListener('click', () => {
    if (Object.keys(carrito).length === 0) {
      mostrarNotificacion('⚠️ Agrega productos al carrito primero', 'error');
      return;
    }
    cerrarCarrito();
    abrirModal();
  });
}

if (modalClose) modalClose.addEventListener('click', cerrarModal);

// Cerrar modal al hacer clic fuera del contenido
if (modalPedido) {
  modalPedido.addEventListener('click', e => {
    if (e.target === modalPedido) cerrarModal();
  });
}

// ─── Formulario: pre-llenar campos ocultos antes de enviar ──────────────────

const formPedido = document.getElementById('form-pedido');
if (formPedido) {
  formPedido.addEventListener('submit', () => {
    const items = Object.values(carrito);

    // Detalle legible para el correo
    const detalle = items.map(i =>
      `${i.producto.nombre} x${i.cantidad} = $${(i.producto.precio * i.cantidad).toLocaleString('es-CL')}`
    ).join(' | ');
    const total = items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);

    document.getElementById('detalle-pedido').value = detalle;
    document.getElementById('total-pedido').value   = `$${total.toLocaleString('es-CL')}`;

    // Guardar carrito para que gracias.html lo lea, luego FormSubmit redirige
    guardarCarritoEnLocalStorage();
  });
}

// ─── Notificaciones ──────────────────────────────────────────────────────────

function mostrarNotificacion(mensaje, tipo = '') {
  const alerta = document.getElementById('flores-alerta');
  if (!alerta) return;
  alerta.textContent = mensaje;
  alerta.className = `flores-alerta visible ${tipo}`;
  setTimeout(() => alerta.classList.remove('visible'), 3500);
}

// ─── Inicio ──────────────────────────────────────────────────────────────────

cargarProductos();

// Guardar datos del cliente en sessionStorage para que gracias.html los muestre
// (FormSubmit redirige a _next sin reenviar los campos al navegador)
if (formPedido) {
  formPedido.addEventListener('submit', () => {
    const pedidoCliente = {
      nombre:    document.getElementById('c-nombre')?.value    || '',
      email:     document.getElementById('c-email')?.value     || '',
      telefono:  document.getElementById('c-telefono')?.value  || '',
      direccion: document.getElementById('c-direccion')?.value || '',
      comuna:    document.getElementById('c-comuna')?.value    || '',
      fecha:     document.getElementById('c-fecha')?.value     || '',
      tarjeta:   document.getElementById('c-tarjeta')?.value   || '',
    };
    sessionStorage.setItem('pedido_cliente', JSON.stringify(pedidoCliente));
  });
}

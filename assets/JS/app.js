let productos = [];   
let carrito = {};    
let categoriaActual = 'todos';
let busquedaActual = '';

// Cargar el carrito desde localStorage si existe
function cargarCarritoDesdeLocalStorage() {
  try {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      carrito = JSON.parse(carritoGuardado);
    }
  } catch (err) {
    console.error('Error al cargar el carrito desde localStorage:', err);
    carrito = {};
  }
}

// Guardar el carrito en localStorage
function guardarCarritoEnLocalStorage() {
  try {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  } catch (err) {
    console.error('Error al guardar el carrito en localStorage:', err);
  }
}

// Cargar productos desde data/productos.json
async function cargarProductos() {
  const loading = document.getElementById('loading');
  try {
    const localRes = await fetch('./assets/data/productos.json');
    if (localRes.ok) {
      const text = await localRes.text();
      if (text && text.trim().length > 0) {
        productos = JSON.parse(text);
      } else {
        throw new Error('Archivo productos.json vacío');
      }
    } else {
      throw new Error('No se pudo obtener productos locales');
    }
  } catch (err) {
    console.error('Error al cargar los productos:', err.message);
    productos = [];    
  } finally {
    if (loading) {
      loading.style.display = 'none';
    }
    // Si no falló la carga, se filtran y renderizan
    if (productos.length > 0) {
      filtrarProductos();
    }
    cargarCarritoDesdeLocalStorage();
    actualizarCarritoUI();
  }
}

// Renderizar productos
function renderizarProductos(productosFiltrados) {
  const grid = document.getElementById('productos-grid');
  if (!grid) return;

  if (productosFiltrados.length === 0) {
    grid.innerHTML = '<p class="loading-msg">No se encontraron productos en esta categoría o búsqueda.</p>';
    return;
  }

  grid.innerHTML = productosFiltrados.map(p => `
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
          <button class="btn-agregar" onclick="agregarAlCarrito(${p.id})">
            + Agregar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function filtrarProductos() {
  const filtrados = productos.filter(p => {
    const cumpleCategoria = categoriaActual === 'todos' || p.categoria.toLowerCase() === categoriaActual.toLowerCase();
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busquedaActual.toLowerCase()) || 
                           p.descripcion.toLowerCase().includes(busquedaActual.toLowerCase());
    return cumpleCategoria && cumpleBusqueda;
  });

  renderizarProductos(filtrados);
}

// Filtros por categoría y búsqueda
document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
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

// Carrito, agregar producto
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

// Carrito, cambiar cantidad
function cambiarCantidad(productoId, delta) {
  if (!carrito[productoId]) return;

  carrito[productoId].cantidad += delta;

  if (carrito[productoId].cantidad <= 0) {
    delete carrito[productoId];
  }

  guardarCarritoEnLocalStorage();
  actualizarCarritoUI();
}

// Actualizar la interfaz del carrito
function actualizarCarritoUI() {
  const itemsDiv = document.getElementById('cart-items');
  const totalDiv = document.getElementById('cart-total');
  const countSpan = document.getElementById('cart-count');

  if (!itemsDiv || !totalDiv || !countSpan) return;

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

  // Calcular y mostrar total
  const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  totalDiv.textContent = `$${total.toLocaleString('es-CL')}`;
}

// Panel del carrito, abrir y cerrar
const cartPanel   = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggle  = document.getElementById('cart-toggle');
const cartClose   = document.getElementById('cart-close');

function abrirCarrito() {
  if (cartPanel && cartOverlay) {
    cartPanel.classList.add('abierto');
    cartOverlay.classList.add('visible');
  }
}

function cerrarCarrito() {
  if (cartPanel && cartOverlay) {
    cartPanel.classList.remove('abierto');
    cartOverlay.classList.remove('visible');
  }
}

if (cartToggle) cartToggle.addEventListener('click', abrirCarrito);
if (cartClose) cartClose.addEventListener('click', cerrarCarrito);
if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);

// Checkout, redirección a página de formulario
const btnCheckout = document.getElementById('btn-checkout');
if (btnCheckout) {
  btnCheckout.addEventListener('click', () => {
    const items = Object.values(carrito);
    if (items.length === 0) {
      mostrarNotificacion('⚠️ Agrega productos al carrito primero', 'error');
      return;
    }
    // Guardar para asegurar consistencia
    guardarCarritoEnLocalStorage();
    // Redirigir a la nueva página de formulario
    window.location.href = 'checkout.html';
  });
}

// Notificaciones (alertas flotantes)
function mostrarNotificacion(mensaje, tipo = '') {
  const alerta = document.getElementById('flores-alerta');
  if (!alerta) return;
  
  alerta.textContent = mensaje;
  alerta.className = `flores-alerta visible ${tipo}`;

  setTimeout(() => {
    alerta.classList.remove('visible');
  }, 3500);
}

// Inicio de la app

cargarProductos();
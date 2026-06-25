/* ══════════════════════════════════════════════════════
   FLORERÍA BLOOM — app.js
   Maneja: catálogo, carrito, modal de checkout y envío
   por correo via FormSubmit.
   ══════════════════════════════════════════════════════ */

/* ─── CORREO RECEPTOR ────────────────────────────────
   Todos los pedidos llegan SOLO a este correo.
   El email que escribe el cliente es solo informativo. */
const CORREO_RECEPTOR_PEDIDOS = 'bahumadaormazabal2003@gmail.com';

/* ─── ESTADO GLOBAL ──────────────────────────────── */
let productos = [];
let carrito = {};
let categoriaActual = 'todos';
let busquedaActual = '';

/* ════════════════════════════════════════════════════
   UTILIDADES
   ════════════════════════════════════════════════════ */
function mostrarNotificacion(mensaje, tipo = '') {
    const alerta = document.getElementById('flores-alerta');
    if (!alerta) return;
    alerta.textContent = mensaje;
    alerta.className = `flores-alerta visible ${tipo}`;
    setTimeout(() => alerta.classList.remove('visible'), 3500);
}

function esCorreoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

/* ════════════════════════════════════════════════════
   CARRITO — localStorage
   ════════════════════════════════════════════════════ */
function cargarCarritoDesdeLocalStorage() {
    try {
        const guardado = localStorage.getItem('carrito');
        if (guardado) carrito = JSON.parse(guardado);
    } catch (err) {
        console.error('Error al cargar carrito:', err);
        carrito = {};
    }
}

function guardarCarritoEnLocalStorage() {
    try {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    } catch (err) {
        console.error('Error al guardar carrito:', err);
    }
}

/* ════════════════════════════════════════════════════
   CATÁLOGO — carga y renderizado
   ════════════════════════════════════════════════════ */
async function cargarProductos() {
    const loading = document.getElementById('loading');
    try {
        const res = await fetch('./assets/data/productos.json');
        if (res.ok) {
            const text = await res.text();
            if (text && text.trim().length > 0) {
                productos = JSON.parse(text);
            } else {
                throw new Error('productos.json vacío');
            }
        } else {
            throw new Error('No se pudo obtener productos');
        }
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
                    <button class="btn-agregar" onclick="agregarAlCarrito(${p.id})">+ Agregar</button>
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
    searchInput.addEventListener('input', (e) => {
        busquedaActual = e.target.value;
        filtrarProductos();
    });
}

/* ════════════════════════════════════════════════════
   CARRITO — acciones y UI
   ════════════════════════════════════════════════════ */
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
    const itemsDiv   = document.getElementById('cart-items');
    const totalDiv   = document.getElementById('cart-total');
    const countSpan  = document.getElementById('cart-count');
    if (!itemsDiv || !totalDiv || !countSpan) return;

    const items = Object.values(carrito);
    const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
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

    const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    totalDiv.textContent = `$${total.toLocaleString('es-CL')}`;
}

// Panel carrito abrir/cerrar
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

if (cartToggle)  cartToggle.addEventListener('click', abrirCarrito);
if (cartClose)   cartClose.addEventListener('click', cerrarCarrito);
if (cartOverlay) cartOverlay.addEventListener('click', cerrarCarrito);

/* ════════════════════════════════════════════════════
   MODAL CHECKOUT
   ════════════════════════════════════════════════════ */
const modalOverlay = document.getElementById('checkout-modal-overlay');
const modalClose   = document.getElementById('checkout-modal-close');

function abrirModalCheckout() {
    if (Object.values(carrito).length === 0) {
        mostrarNotificacion('⚠️ Agrega productos al carrito primero', 'error');
        return;
    }
    cerrarCarrito();
    renderizarResumenModal();
    configurarFechaMinima();
    modalOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function cerrarModalCheckout() {
    modalOverlay.classList.remove('visible');
    document.body.style.overflow = '';
}

if (modalClose) modalClose.addEventListener('click', cerrarModalCheckout);

// Cierra al hacer clic fuera del modal
modalOverlay && modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cerrarModalCheckout();
});

// Botón "Proceder al Pago" del carrito
const btnCheckout = document.getElementById('btn-checkout');
if (btnCheckout) {
    btnCheckout.addEventListener('click', abrirModalCheckout);
}

// Renderizar resumen dentro del modal
function renderizarResumenModal() {
    const listDiv       = document.getElementById('summary-items-list');
    const subtotalSpan  = document.getElementById('summary-subtotal');
    const totalSpan     = document.getElementById('summary-total-price');
    if (!listDiv) return;

    const items = Object.values(carrito);

    if (items.length === 0) {
        listDiv.innerHTML = '<p class="summary-empty">Tu carrito está vacío</p>';
        if (subtotalSpan) subtotalSpan.textContent = '$0';
        if (totalSpan)    totalSpan.textContent    = '$0';
        return;
    }

    listDiv.innerHTML = items.map(item => `
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:.92rem;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span>🌸</span>
                <div>
                    <div style="font-weight:700;color:#2c2c2c;">${item.producto.nombre}</div>
                    <div style="font-size:.8rem;color:#666;">Cant: ${item.cantidad} × $${item.producto.precio.toLocaleString('es-CL')}</div>
                </div>
            </div>
            <span style="font-weight:700;color:#e63e6d;align-self:center;">
                $${(item.producto.precio * item.cantidad).toLocaleString('es-CL')}
            </span>
        </div>
    `).join('');

    const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    if (subtotalSpan) subtotalSpan.textContent = `$${total.toLocaleString('es-CL')}`;
    if (totalSpan)    totalSpan.textContent    = `$${total.toLocaleString('es-CL')}`;
}

function configurarFechaMinima() {
    const dateInput = document.getElementById('c-fecha');
    if (dateInput) {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm   = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd   = String(hoy.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }
}

/* ════════════════════════════════════════════════════
   VALIDACIÓN Y ENVÍO DEL FORMULARIO
   ════════════════════════════════════════════════════ */
function validarFormulario() {
    const nombre    = document.getElementById('c-nombre').value.trim();
    const email     = document.getElementById('c-email').value.trim();
    const telefono  = document.getElementById('c-telefono').value.trim();
    const direccion = document.getElementById('c-direccion').value.trim();
    const comuna    = document.getElementById('c-comuna').value;
    const fecha     = document.getElementById('c-fecha').value;
    const tarjeta   = document.getElementById('c-tarjeta').value.trim();
    const dateInput = document.getElementById('c-fecha');

    if (nombre.length < 3 || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,}$/.test(nombre)) {
        mostrarNotificacion('⚠️ Ingresa un nombre válido (solo letras, mínimo 3 caracteres).', 'error');
        return null;
    }
    if (!esCorreoValido(email)) {
        mostrarNotificacion('⚠️ Ingresa un correo electrónico válido.', 'error');
        return null;
    }
    if (!/^[+0-9\s-]{8,15}$/.test(telefono)) {
        mostrarNotificacion('⚠️ Ingresa un teléfono válido. Ej: +56 9 1234 5678.', 'error');
        return null;
    }
    if (direccion.length < 5) {
        mostrarNotificacion('⚠️ Ingresa una dirección válida (mínimo 5 caracteres).', 'error');
        return null;
    }
    if (!comuna) {
        mostrarNotificacion('⚠️ Selecciona una comuna de entrega.', 'error');
        return null;
    }
    if (!fecha) {
        mostrarNotificacion('⚠️ Selecciona una fecha de entrega.', 'error');
        return null;
    }
    if (dateInput.min && fecha < dateInput.min) {
        mostrarNotificacion('⚠️ La fecha de entrega no puede ser anterior a hoy.', 'error');
        return null;
    }
    if (tarjeta.length > 250) {
        mostrarNotificacion('⚠️ La dedicatoria no puede superar los 250 caracteres.', 'error');
        return null;
    }

    return { nombre, email, telefono, direccion, comuna, fecha, tarjeta };
}

function generarDetallePedido(datos, items, total) {
    const detalleProductos = items.map((item, i) => {
        const precio   = item.producto.precio.toLocaleString('es-CL');
        const subtotal = (item.producto.precio * item.cantidad).toLocaleString('es-CL');
        return `${i + 1}. ${item.producto.nombre} | Cant: ${item.cantidad} | Precio: $${precio} | Subtotal: $${subtotal}`;
    }).join('\n');

    return `PEDIDO FLORERÍA BLOOM\n\n` +
        `DATOS DEL CLIENTE\n` +
        `Nombre: ${datos.nombre}\n` +
        `Correo del cliente: ${datos.email}\n` +
        `Teléfono: ${datos.telefono}\n\n` +
        `DATOS DE ENTREGA\n` +
        `Dirección: ${datos.direccion}\n` +
        `Comuna: ${datos.comuna}\n` +
        `Fecha de entrega: ${datos.fecha}\n\n` +
        `DEDICATORIA\n${datos.tarjeta || 'Sin dedicatoria'}\n\n` +
        `PRODUCTOS\n${detalleProductos}\n\n` +
        `TOTAL: $${total.toLocaleString('es-CL')}`;
}

// Botón confirmar pedido
const btnConfirmar = document.getElementById('btn-confirmar-pedido');
if (btnConfirmar) {
    btnConfirmar.addEventListener('click', () => {
        const datos = validarFormulario();
        if (!datos) return;

        const items = Object.values(carrito);
        if (items.length === 0) {
            mostrarNotificacion('⚠️ Tu carrito está vacío.', 'error');
            return;
        }

        const total        = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
        const fechaCreacion = new Date().toLocaleString('es-CL');
        const detalle      = generarDetallePedido(datos, items, total);

        // Guardar para la página de gracias
        const pedidoCompleto = {
            cliente:         { nombre: datos.nombre, email: datos.email, telefono: datos.telefono },
            despacho:        { direccion: datos.direccion, comuna: datos.comuna, fecha: datos.fecha },
            personalizacion: { tarjeta: datos.tarjeta },
            productos:       items.map(item => ({
                id:       item.producto.id,
                nombre:   item.producto.nombre,
                cantidad: item.cantidad,
                precio:   item.producto.precio,
                subtotal: item.producto.precio * item.cantidad
            })),
            total,
            fechaCreacion
        };
        localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoCompleto));

        // Deshabilitar botón mientras se envía
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Enviando pedido... 🌸';

        // Construir y enviar formulario via FormSubmit
        const urlGracias = new URL('gracias.html', window.location.href).href;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `https://formsubmit.co/${CORREO_RECEPTOR_PEDIDOS}`;
        form.style.display = 'none';

        const campos = {
            '_subject':              'Nueva solicitud de compra - Florería Bloom',
            '_template':             'table',
            '_captcha':              'false',
            '_next':                 urlGracias,
            'nombre_cliente':        datos.nombre,
            'correo_cliente':        datos.email,
            'telefono_cliente':      datos.telefono,
            'direccion_entrega':     datos.direccion,
            'comuna_entrega':        datos.comuna,
            'fecha_entrega':         datos.fecha,
            'mensaje_tarjeta':       datos.tarjeta || 'Sin dedicatoria',
            'detalle_pedido':        detalle,
            'total_pedido':          `$${total.toLocaleString('es-CL')}`,
            'fecha_pedido':          fechaCreacion,
            'correo_cliente_informado': datos.email
        };

        Object.entries(campos).forEach(([name, value]) => {
            const input = document.createElement('input');
            input.type  = 'hidden';
            input.name  = name;
            input.value = value;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    });
}

/* ════════════════════════════════════════════════════
   INICIO
   ════════════════════════════════════════════════════ */
cargarProductos();

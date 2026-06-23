// Variables globales y estado
let carrito = {};

// Correo fijo que recibirá todos los pedidos.
// IMPORTANTE: este es el único correo receptor.
// El correo que escribe el cliente en el formulario solo viaja como dato informativo.
const CORREO_RECEPTOR_PEDIDOS = 'bahumadaormazabal2003@gmail.com';

// Cargar carrito desde localStorage
function cargarCarrito() {
    try {
        const carritoGuardado = localStorage.getItem('carrito');
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
        }
    } catch (err) {
        console.error('Error al parsear el carrito:', err);
        carrito = {};
    }
}

// Mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = '') {
    const alerta = document.getElementById('flores-alerta');
    if (!alerta) return;

    alerta.textContent = mensaje;
    alerta.className = `flores-alerta visible ${tipo}`;

    setTimeout(() => {
        alerta.classList.remove('visible');
    }, 3500);
}

// Renderizar resumen del pedido
function renderizarResumen() {
    const listDiv = document.getElementById('summary-items-list');
    const subtotalSpan = document.getElementById('summary-subtotal');
    const totalSpan = document.getElementById('summary-total-price');

    if (!listDiv || !subtotalSpan || !totalSpan) return;

    const items = Object.values(carrito);

    if (items.length === 0) {
        // Si no hay productos, redirige a index.html después de avisar
        listDiv.innerHTML = '<p class="summary-empty">Tu carrito está vacío</p>';
        mostrarNotificacion('⚠️ Tu carrito está vacío. Redirigiendo a la tienda...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2500);
        return;
    }

    // Renderizar cada elemento en la columna lateral
    listDiv.innerHTML = items.map(item => `
    <div class="summary-item" style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.2rem;">🌸</span>
        <div>
          <div style="font-weight: 700; color: #2c2c2c;">${item.producto.nombre}</div>
          <div style="font-size: 0.8rem; color: #666;">Cant: ${item.cantidad} x $${item.producto.precio.toLocaleString('es-CL')}</div>
        </div>
      </div>
      <span style="font-weight: 700; color: #e63e6d; align-self: center;">
        $${(item.producto.precio * item.cantidad).toLocaleString('es-CL')}
      </span>
    </div>
  `).join('');

    // Calcular totales
    const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    subtotalSpan.textContent = `$${total.toLocaleString('es-CL')}`;
    totalSpan.textContent = `$${total.toLocaleString('es-CL')}`;
}

// Validar fecha mínima (Hoy en adelante)
function configurarFechaMinima() {
    const dateInput = document.getElementById('c-fecha');
    if (dateInput) {
        const hoy = new Date();
        // Ajustar a zona horaria local de Chile (Santiago)
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }
}

// Configurar FormSubmit para enviar el pedido solo al correo fijo definido en el código.
function configurarEnvioCorreo() {
    const checkoutForm = document.getElementById('checkout-complete-form');
    if (!checkoutForm) return;

    checkoutForm.action = `https://formsubmit.co/${CORREO_RECEPTOR_PEDIDOS}`;
    checkoutForm.method = 'POST';

    // FormSubmit necesita una URL completa para redirigir después del envío.
    // Esto funcionará correctamente cuando el proyecto esté publicado en GitHub Pages u otro hosting.
    const nextInput = document.getElementById('form-next-url');
    if (nextInput) {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            const graciasUrl = new URL('gracias.html', window.location.href).href;
            nextInput.value = graciasUrl;
        } else {
            // En modo archivo local no se envía _next, porque FormSubmit no acepta rutas locales.
            nextInput.removeAttribute('name');
        }
    }
}

// Generar detalle del pedido para que llegue ordenado al correo
function generarDetallePedido(nombre, email, telefono, direccion, comuna, fecha, tarjeta, items, total) {
    const detalleProductos = items.map((item, index) => {
        const precio = item.producto.precio.toLocaleString('es-CL');
        const subtotal = (item.producto.precio * item.cantidad).toLocaleString('es-CL');
        return `${index + 1}. ${item.producto.nombre} | Cantidad: ${item.cantidad} | Precio: $${precio} | Subtotal: $${subtotal}`;
    }).join('\n');

    return `PEDIDO FLORERÍA BLOOM\n\n` +
        `DATOS DEL CLIENTE\n` +
        `Nombre: ${nombre}\n` +
        `Correo: ${email}\n` +
        `Teléfono: ${telefono}\n\n` +
        `DATOS DE ENTREGA\n` +
        `Dirección: ${direccion}\n` +
        `Comuna: ${comuna}\n` +
        `Fecha de entrega: ${fecha}\n\n` +
        `DEDICATORIA\n` +
        `${tarjeta || 'Sin dedicatoria'}\n\n` +
        `PRODUCTOS\n` +
        `${detalleProductos}\n\n` +
        `TOTAL: $${total.toLocaleString('es-CL')}`;
}

// Procesar formulario de checkout y enviarlo por correo con FormSubmit
const checkoutForm = document.getElementById('checkout-complete-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!checkoutForm.checkValidity()) {
            checkoutForm.reportValidity();
            return;
        }

        if (CORREO_RECEPTOR_PEDIDOS === 'correo.destino@ejemplo.com') {
            mostrarNotificacion('⚠️ Debes cambiar el correo receptor en assets/JS/checkout.js antes de enviar.', 'error');
            return;
        }

        const items = Object.values(carrito);
        if (items.length === 0) {
            mostrarNotificacion('⚠️ Tu carrito está vacío. Agrega productos antes de confirmar.', 'error');
            return;
        }

        const btnSubmit = checkoutForm.querySelector('.btn-confirmar-pedido');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Enviando pedido por correo... 🌸';
        }

        // Obtener valores del formulario
        const nombre = document.getElementById('c-nombre').value.trim();
        const email = document.getElementById('c-email').value.trim();
        const telefono = document.getElementById('c-telefono').value.trim();
        const direccion = document.getElementById('c-direccion').value.trim();
        const comuna = document.getElementById('c-comuna').value;
        const fecha = document.getElementById('c-fecha').value;
        const tarjeta = document.getElementById('c-tarjeta').value.trim();

        const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
        const fechaCreacion = new Date().toLocaleString('es-CL');

        // Objeto con la información del pedido completo para gracias.html
        const pedidoCompleto = {
            cliente: { nombre, email, telefono },
            despacho: { direccion, comuna, fecha },
            personalizacion: { tarjeta },
            productos: items.map(item => ({
                id: item.producto.id,
                nombre: item.producto.nombre,
                cantidad: item.cantidad,
                precio: item.producto.precio,
                subtotal: item.producto.precio * item.cantidad
            })),
            total,
            fechaCreacion
        };

        // Completar campos ocultos que se enviarán por correo
        const detallePedido = document.getElementById('detallePedido');
        const totalPedido = document.getElementById('totalPedido');
        const fechaPedido = document.getElementById('fechaPedido');

        if (detallePedido) {
            detallePedido.value = generarDetallePedido(nombre, email, telefono, direccion, comuna, fecha, tarjeta, items, total);
        }

        if (totalPedido) {
            totalPedido.value = `$${total.toLocaleString('es-CL')}`;
        }

        if (fechaPedido) {
            fechaPedido.value = fechaCreacion;
        }

        // Guardar último pedido para mostrarlo en gracias.html
        localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoCompleto));

        // Enviar el formulario real a FormSubmit
        checkoutForm.submit();
    });
}

// Ejecución al cargar la página
cargarCarrito();
renderizarResumen();
configurarFechaMinima();
configurarEnvioCorreo();

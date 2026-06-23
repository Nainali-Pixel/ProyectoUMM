// Variables globales y estado
let carrito = {};

/*
  CORREO FIJO DEL RECEPTOR
  ------------------------------------------------------------
  Todos los pedidos se envían SOLO a este correo.
  El correo que escribe el cliente en el formulario NO cambia el destinatario;
  solo se envía como dato informativo dentro del pedido.
*/
const CORREO_RECEPTOR_PEDIDOS = 'bahumadaormazabal2003@gmail.com'; // <-- Cambiar por el correo real que recibirá TODOS los pedidos
const CORREO_EJEMPLO = 'correo.destino@ejemplo.com';

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

function esCorreoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

// Renderizar resumen del pedido
function renderizarResumen() {
    const listDiv = document.getElementById('summary-items-list');
    const subtotalSpan = document.getElementById('summary-subtotal');
    const totalSpan = document.getElementById('summary-total-price');

    if (!listDiv || !subtotalSpan || !totalSpan) return;

    const items = Object.values(carrito);

    if (items.length === 0) {
        listDiv.innerHTML = '<p class="summary-empty">Tu carrito está vacío</p>';
        mostrarNotificacion('⚠️ Tu carrito está vacío. Redirigiendo a la tienda...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2500);
        return;
    }

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

    const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    subtotalSpan.textContent = `$${total.toLocaleString('es-CL')}`;
    totalSpan.textContent = `$${total.toLocaleString('es-CL')}`;
}

// Validar fecha mínima: hoy en adelante
function configurarFechaMinima() {
    const dateInput = document.getElementById('c-fecha');
    if (dateInput) {
        const hoy = new Date();
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

    // El action se arma con la constante. No se lee desde ningún input del formulario.
    checkoutForm.action = `https://formsubmit.co/${CORREO_RECEPTOR_PEDIDOS}`;
    checkoutForm.method = 'POST';

    const nextInput = document.getElementById('form-next-url');
    if (nextInput) {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            nextInput.value = new URL('gracias.html', window.location.href).href;
        } else {
            // En modo archivo local, FormSubmit no acepta file:/// como redirección.
            nextInput.removeAttribute('name');
        }
    }
}

// Validaciones extra del formulario sin cambiar el correo receptor.
function validarFormularioCheckout(formulario) {
    const nombre = document.getElementById('c-nombre');
    const email = document.getElementById('c-email');
    const telefono = document.getElementById('c-telefono');
    const direccion = document.getElementById('c-direccion');
    const comuna = document.getElementById('c-comuna');
    const fecha = document.getElementById('c-fecha');
    const tarjeta = document.getElementById('c-tarjeta');

    // Reiniciar mensajes personalizados
    [nombre, email, telefono, direccion, comuna, fecha, tarjeta].forEach(campo => {
        if (campo) campo.setCustomValidity('');
    });

    if (!esCorreoValido(CORREO_RECEPTOR_PEDIDOS) || CORREO_RECEPTOR_PEDIDOS === CORREO_EJEMPLO) {
        mostrarNotificacion('⚠️ Debes cambiar el correo receptor fijo en assets/JS/checkout.js.', 'error');
        return false;
    }

    if (!nombre.value.trim() || nombre.value.trim().length < 3) {
        nombre.setCustomValidity('Ingresa un nombre válido de al menos 3 caracteres.');
    }

    if (!esCorreoValido(email.value.trim())) {
        email.setCustomValidity('Ingresa un correo de cliente válido.');
    }

    if (!/^[+0-9\s-]{8,15}$/.test(telefono.value.trim())) {
        telefono.setCustomValidity('Ingresa un teléfono válido. Ejemplo: +56 9 1234 5678.');
    }

    if (!direccion.value.trim() || direccion.value.trim().length < 5) {
        direccion.setCustomValidity('Ingresa una dirección válida de al menos 5 caracteres.');
    }

    if (!comuna.value) {
        comuna.setCustomValidity('Selecciona una comuna.');
    }

    if (!fecha.value) {
        fecha.setCustomValidity('Selecciona una fecha de entrega.');
    } else if (fecha.min && fecha.value < fecha.min) {
        fecha.setCustomValidity('La fecha de entrega no puede ser anterior a hoy.');
    }

    if (tarjeta.value.trim().length > 250) {
        tarjeta.setCustomValidity('La dedicatoria no puede superar los 250 caracteres.');
    }

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        mostrarNotificacion('⚠️ Revisa los campos marcados antes de enviar.', 'error');
        return false;
    }

    return true;
}

// Generar detalle del pedido para que llegue ordenado al correo
function generarDetallePedido(nombre, email, telefono, direccion, comuna, fecha, tarjeta, items, total) {
    const detalleProductos = items.map((item, index) => {
        const precio = item.producto.precio.toLocaleString('es-CL');
        const subtotal = (item.producto.precio * item.cantidad).toLocaleString('es-CL');
        return `${index + 1}. ${item.producto.nombre} | Cantidad: ${item.cantidad} | Precio: $${precio} | Subtotal: $${subtotal}`;
    }).join('\n');

    return `PEDIDO FLORERÍA BLOOM\n\n` +
        `DESTINATARIO DEL FORMULARIO\n` +
        `Este pedido fue enviado al correo fijo configurado en el código: ${CORREO_RECEPTOR_PEDIDOS}\n\n` +
        `DATOS DEL CLIENTE\n` +
        `Nombre: ${nombre}\n` +
        `Correo escrito por el cliente: ${email}\n` +
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

        // Siempre se vuelve a configurar el action antes de enviar.
        // Así se asegura que el destinatario sea únicamente el correo fijo del código.
        configurarEnvioCorreo();

        if (!validarFormularioCheckout(checkoutForm)) {
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

        const nombre = document.getElementById('c-nombre').value.trim();
        const email = document.getElementById('c-email').value.trim();
        const telefono = document.getElementById('c-telefono').value.trim();
        const direccion = document.getElementById('c-direccion').value.trim();
        const comuna = document.getElementById('c-comuna').value;
        const fecha = document.getElementById('c-fecha').value;
        const tarjeta = document.getElementById('c-tarjeta').value.trim();

        const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
        const fechaCreacion = new Date().toLocaleString('es-CL');

        const pedidoCompleto = {
            receptor: CORREO_RECEPTOR_PEDIDOS,
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

        const detallePedido = document.getElementById('detallePedido');
        const totalPedido = document.getElementById('totalPedido');
        const fechaPedido = document.getElementById('fechaPedido');
        const correoClientePedido = document.getElementById('correoClientePedido');

        if (detallePedido) {
            detallePedido.value = generarDetallePedido(nombre, email, telefono, direccion, comuna, fecha, tarjeta, items, total);
        }

        if (totalPedido) {
            totalPedido.value = `$${total.toLocaleString('es-CL')}`;
        }

        if (fechaPedido) {
            fechaPedido.value = fechaCreacion;
        }

        if (correoClientePedido) {
            correoClientePedido.value = email;
        }

        localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoCompleto));

        // Envío real: el destino sale desde checkoutForm.action,
        // que fue armado con CORREO_RECEPTOR_PEDIDOS, no con el correo del cliente.
        checkoutForm.submit();
    });
}

// Ejecución al cargar la página
cargarCarrito();
renderizarResumen();
configurarFechaMinima();
configurarEnvioCorreo();

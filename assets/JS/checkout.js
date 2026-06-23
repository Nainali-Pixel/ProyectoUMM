// Variables globales y estado 
let carrito = {};

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

// Procesar formulario de checkout
const checkoutForm = document.getElementById('checkout-complete-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const btnSubmit = checkoutForm.querySelector('.btn-confirmar-pedido');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Procesando tu pedido... 🌸';
        }

        // Obtener valores del formulario
        const nombre = document.getElementById('c-nombre').value.trim();
        const email = document.getElementById('c-email').value.trim();
        const telefono = document.getElementById('c-telefono').value.trim();
        const direccion = document.getElementById('c-direccion').value.trim();
        const comuna = document.getElementById('c-comuna').value;
        const fecha = document.getElementById('c-fecha').value;
        const tarjeta = document.getElementById('c-tarjeta').value.trim();

        const items = Object.values(carrito);
        const total = items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);

        // Objeto con la información del pedido completo
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
            fechaCreacion: new Date().toISOString()
        };

        // Guardar último pedido en localStorage para usarlo en la vista de confirmación (gracias.html)
        localStorage.setItem('ultimo_pedido', JSON.stringify(pedidoCompleto));

        // Simular procesamiento del pago y registro del pedido
        setTimeout(() => {
            // Limpiar el carrito de compras
            localStorage.removeItem('carrito');

            // Mostrar mensaje de éxito
            mostrarNotificacion('¡Pedido procesado con éxito! Redirigiendo...', 'exito');

            // Redirigir a gracias.html
            setTimeout(() => {
                window.location.href = 'gracias.html';
            }, 1500);
        }, 1500);
    });
}

// Ejecución al cargar la página
cargarCarrito();
renderizarResumen();
configurarFechaMinima();
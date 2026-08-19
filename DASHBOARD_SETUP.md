# CELICOR Dashboard

El panel está disponible en `/admin/`.

## Edición de productos y contenido

Para guardar cambios desde el navegador, crea un **Fine-grained Personal Access Token** de GitHub limitado al repositorio `javiermorenoz30/celicor` con permiso **Contents: Read and write**. Pégalo en `Dashboard → Configuración`. El token se almacena únicamente en `sessionStorage` y se elimina al cerrar la pestaña.

## Pedidos y tráfico en Cloudflare Pages

El repositorio incluye Pages Functions en `functions/api/` y el esquema D1 en `schema.sql`.

1. Crea una base D1 para CELICOR.
2. Ejecuta `schema.sql` en la base.
3. Vincula la base al proyecto de Cloudflare Pages con el nombre de binding **DB**.
4. Crea un secret/variable **ADMIN_KEY** con una clave larga y privada.
5. Despliega de nuevo el proyecto.
6. En `/admin/ → Configuración`, introduce esa misma ADMIN_KEY.

Con esto se activan:

- registro central de pedidos;
- estados de pedidos;
- visitas y visitantes;
- eventos de agregar al carrito;
- aperturas de checkout;
- ventas estimadas y resumen de 30 días.

El checkout por WhatsApp continúa funcionando aunque el backend todavía no esté configurado.

# VEXIA Financial Core

Núcleo financiero compartido de VEXIA.

## Flujo principal

Cliente / Paciente
→ Servicio / Producto / Orden
→ Venta
→ Pago
→ Movimiento financiero
→ Caja / Banco
→ Inventario / Costos
→ Resultado
→ Reportes

## Principios

- Cada movimiento pertenece a un businessId.
- Cada operación tiene origen y sourceId.
- Los movimientos tienen estado.
- Los saldos pendientes se calculan a partir del total y lo pagado.
- Caja se calcula mediante movimientos de entrada y salida.
- Los reportes deben consumir este núcleo, no inventar cifras independientes.

## Próximas capas

1. Ventas
2. Productos e inventario
3. Compras
4. Gastos
5. Caja
6. Cuentas por cobrar
7. Cuentas por pagar
8. Reportes
9. Contabilidad avanzada

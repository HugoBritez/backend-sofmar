"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = function (dbInyectada) {
    let db = dbInyectada;
    if (!db) {
        db = require("../DB/mysql.js");
    }
    function getFacturas(deposito, sucursal, nro_proveedor, fecha_desde, fecha_hasta, nro_factura, verificado) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('verificado', verificado);
            let where = "";
            if (nro_factura) {
                // Si hay número de factura, solo aplicamos ese filtro
                where += ` AND co.co_factura = '${nro_factura}'`;
            }
            else {
                // Si no hay número de factura, aplicamos los demás filtros
                if (nro_proveedor && nro_proveedor != 0) {
                    where += ` AND oc.proveedor = ${nro_proveedor}`;
                }
                if (fecha_desde && fecha_hasta) {
                    where += ` AND oc.fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`;
                }
                if (fecha_desde && !fecha_hasta) {
                    where += ` AND oc.fecha >= '${fecha_desde}'`;
                }
                if (!fecha_desde && fecha_hasta) {
                    where += ` AND oc.fecha <= '${fecha_hasta}'`;
                }
                if (verificado != -1 || verificado != '-1') {
                    where += ` AND co.co_verificado = ${verificado}`;
                }
                if (deposito) {
                    where += ` AND co.co_deposito = ${deposito}`;
                }
                if (sucursal) {
                    where += ` AND co.co_sucursal = ${sucursal}`;
                }
            }
            const query = `
        SELECT
          co.co_codigo as id_compra,
          date_format(co.co_fecha, '%d/%m/%Y') as fecha_compra,
          co.co_deposito as deposito,
          dep.dep_descripcion as deposito_descripcion,
          co.co_factura as nro_factura,
          oc.id as id_orden,
          oc.proveedor as nro_proveedor,
          pr.pro_razon as proveedor,
          oc.proveedor as proveedor_id,
          co.co_verificado as verificado,
          co.co_responsable_ubicacion as responsable_ubicacion,
          case
            when co.co_verificado = 0 then 'SIN VERIFICAR'
            when co.co_verificado = 1 then 'VERIFICADO'
            when co.co_verificado = 2 then 'CONFIRMADO'
          end as estado
        FROM ordenes_compra oc 
        INNER JOIN compras co ON oc.id = co.co_orden
        INNER JOIN depositos dep ON co.co_deposito = dep.dep_codigo
        INNER JOIN proveedores pr ON oc.proveedor = pr.pro_codigo
        WHERE co.co_estado = 1
        ${where}
        GROUP BY co.co_codigo, co.co_fecha, co.co_deposito, co.co_factura
        ORDER BY co.co_fecha DESC
        `;
            console.log(query);
            return db.sql(query);
        });
    }
    function getItems(id_compra) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
    SELECT
      dc.dc_id as detalle_compra,
      dc.dc_articulo as articulo_id,
      ar.ar_descripcion as articulo_descripcion,
      ar.ar_codbarra as articulo_codigo_barras,
      FLOOR(dc.dc_cantidad) as cantidad,
      dc.dc_cantidad_verificada as cantidad_verificada,
      dc.dc_lote as lote,
      date_format(dc.dc_vence, '%d/%m/%Y') as vencimiento,
      op.op_nombre as responsable
    FROM detalle_compras dc
    INNER JOIN articulos ar ON dc.dc_articulo = ar.ar_codigo
    INNER JOIN compras co ON dc.dc_compra = co.co_codigo
    LEFT JOIN operadores op ON co.co_responsable_ubicacion = op.op_codigo
    WHERE dc.dc_compra = ${id_compra}
    `;
            console.log(query);
            return db.sql(query);
        });
    }
    function getItemsAEscanear(id_compra, busqueda) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = "";
            if (busqueda) {
                where += ` AND ar.ar_descripcion LIKE '%${busqueda}%'`;
            }
            const query = `
    SELECT
      dc.dc_id as detalle_compra,
      dc.dc_articulo as articulo_id,
      ar.ar_descripcion as articulo_descripcion,
      FLOOR(dc.dc_cantidad) as cantidad,
      dc.dc_lote as lote,
      date_format(dc.dc_vence, '%d/%m/%Y') as vencimiento
    FROM detalle_compras dc
    INNER JOIN articulos ar ON dc.dc_articulo = ar.ar_codigo
    WHERE dc.dc_compra = ${id_compra}
    AND dc.dc_cantidad_verificada = 0
    ${where}
    `;
            console.log(query);
            return db.sql(query);
        });
    }
    function verificarCompra(id_compra, user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(id_compra);
            const query = `
      UPDATE compras
        SET co_verificado = 1,
            co_verificador = ${user_id}
        WHERE co_codigo = ${id_compra}
    `;
            console.log(query);
            return db.sql(query);
        });
    }
    function verificarItem(id_detalle, cantidad) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      UPDATE detalle_compras
      SET dc_cantidad_verificada = ${cantidad}
      WHERE dc_id = ${id_detalle}
    `;
            console.log(query);
            return db.sql(query);
        });
    }
    function confirmarVerificacion(id_compra, factura_compra, deposito_transitorio, deposito_destino, items, user_id, operador_id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            console.log('=== INICIANDO PROCESO DE CONFIRMACIÓN DE VERIFICACIÓN ===');
            console.log(`Parámetros recibidos:`, {
                id_compra,
                factura_compra,
                deposito_transitorio,
                deposito_destino,
                cantidad_items: items.length,
                user_id
            });
            yield db.sql("START TRANSACTION");
            console.log('Transacción principal iniciada');
            try {
                // 1. Actualizar estado de la compra
                const updateCompra = `
        UPDATE compras
        SET co_verificado = 2,
        co_responsable_ubicacion = ${operador_id},
        co_confirmador = ${user_id}
        WHERE co_codigo = ${id_compra}
      `;
                console.log(`[1/3] Actualizando estado de compra ${id_compra} a verificado=2`);
                yield db.sql(updateCompra);
                // 2. Crear cabecera de transferencia
                const registrarTransferenciaCabecera = `
        INSERT INTO transferencias (
          tr_fecha, tr_operador, tr_origen, tr_destino, tr_comprobante,
          tr_estado, tr_motivo, tr_fechaOP, tr_idmaestro, tr_estado_transf,
          tr_user_autorizador, tr_talle, tr_solicitud
        )
        VALUES (
          NOW(), ${user_id}, ${deposito_transitorio}, ${deposito_destino}, ${factura_compra},
          1, 'TRANSFERENCIA ENTRE DEPOSITOS POR VERIFICACION DE COMPRAS', NOW(), 0, 1,
          0, 0, 0
        )
      `;
                console.log('[2/3] Creando cabecera de transferencia');
                yield db.sql(registrarTransferenciaCabecera);
                const id_transferencia = yield db.sql("SELECT LAST_INSERT_ID() as id");
                console.log(`Transferencia creada con ID: ${id_transferencia[0].id}`);
                // 3. Procesar cada item
                for (const item of items) {
                    console.log(`\n=== Procesando item ${item.id_articulo} ===`);
                    yield db.sql("START TRANSACTION");
                    console.log('Subtransacción iniciada para el item');
                    // 3.1 Verificar existencia de lotes y sus cantidades actuales
                    const [existeLoteTransitorio, existeLoteDestino] = yield Promise.all([
                        db.sql(`
            SELECT al.al_codigo, al.al_cantidad, ar.ar_vencimiento
            FROM articulos_lotes al
            INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
            WHERE al.al_deposito = ${deposito_transitorio}
            AND al.al_articulo = ${item.id_articulo}
            AND (
              (ar.ar_vencimiento = 0) OR 
              (ar.ar_vencimiento = 1 AND al.al_lote = '${item.lote}')
            )
          `),
                        db.sql(`
            SELECT al.al_codigo, al.al_cantidad, ar.ar_vencimiento
            FROM articulos_lotes al
            INNER JOIN articulos ar ON al.al_articulo = ar.ar_codigo
            WHERE al.al_deposito = ${deposito_destino}
            AND al.al_articulo = ${item.id_articulo}
            AND (
              (ar.ar_vencimiento = 0) OR 
              (ar.ar_vencimiento = 1 AND al.al_lote = '${item.lote}')
            )
          `)
                    ]);
                    const id_lote_transitorio = (_a = existeLoteTransitorio[0]) === null || _a === void 0 ? void 0 : _a.al_codigo;
                    const cantidadActualTransitorio = ((_b = existeLoteTransitorio[0]) === null || _b === void 0 ? void 0 : _b.al_cantidad) || 0;
                    const id_lote_destino = (_c = existeLoteDestino[0]) === null || _c === void 0 ? void 0 : _c.al_codigo;
                    const cantidadActualDestino = ((_d = existeLoteDestino[0]) === null || _d === void 0 ? void 0 : _d.al_cantidad) || 0;
                    const tieneControlVencimiento = ((_e = existeLoteTransitorio[0]) === null || _e === void 0 ? void 0 : _e.ar_vencimiento) === 1;
                    console.log('Estado actual de lotes:', {
                        lote_transitorio: id_lote_transitorio ? 'Encontrado' : 'No encontrado',
                        cantidad_transitorio: cantidadActualTransitorio,
                        lote_destino: existeLoteDestino.length > 0 ? 'Encontrado' : 'No encontrado',
                        cantidad_destino: cantidadActualDestino,
                        tiene_control_vencimiento: tieneControlVencimiento,
                        lote_item: item.lote || 'Sin lote'
                    });
                    if (!id_lote_transitorio) {
                        console.log(`ADVERTENCIA: No se encontró lote transitorio para artículo ${item.id_articulo} en deposito ${deposito_transitorio}, saltando...`);
                        yield db.sql("COMMIT");
                        continue;
                    }
                    let id_lote_destino_final;
                    // 3.2 Procesar cantidades según caso
                    if (existeLoteDestino.length > 0) {
                        console.log('Actualizando lotes existentes');
                        // Convertir a números para asegurar operaciones numéricas
                        const cantidadActualTransitorioNum = parseFloat(cantidadActualTransitorio) || 0;
                        const cantidadActualDestinoNum = parseFloat(cantidadActualDestino) || 0;
                        const cantidadIngresoNum = parseFloat(item.cantidad_ingreso) || 0;
                        // El transitorio siempre se reduce por la cantidad que se transfiere
                        const cantidad_transitorio = cantidadActualTransitorioNum - cantidadIngresoNum;
                        // El destino suma la cantidad que ingresa a su cantidad actual
                        const cantidad_destino = cantidadActualDestinoNum + cantidadIngresoNum;
                        console.log('Cantidades calculadas para lote existente del articulo:' + item.id_articulo + ' con lote ' + item.lote + ' en deposito ' + deposito_transitorio + ' y vencimiento ' + item.vencimiento, {
                            cantidad_actual_transitorio: cantidadActualTransitorioNum,
                            cantidad_actual_destino: cantidadActualDestinoNum,
                            cantidad_ingreso: cantidadIngresoNum,
                            cantidad_final_transitorio: cantidad_transitorio,
                            cantidad_final_destino: cantidad_destino
                        });
                        yield db.sql(`
            UPDATE articulos_lotes
            SET al_cantidad = ${cantidad_transitorio}
            WHERE al_codigo = ${id_lote_transitorio}
          `);
                        yield db.sql(`
            UPDATE articulos_lotes
            SET al_cantidad = ${cantidad_destino}
            WHERE al_codigo = ${id_lote_destino}
          `);
                        id_lote_destino_final = id_lote_destino;
                    }
                    else {
                        console.log('Creando nuevo lote en destino');
                        // Convertir a números para asegurar operaciones numéricas
                        const cantidadActualTransitorioNum = parseFloat(cantidadActualTransitorio) || 0;
                        const cantidadIngresoNum = parseFloat(item.cantidad_ingreso) || 0;
                        // El transitorio se reduce por la cantidad que se transfiere
                        const cantidad_transitorio = cantidadActualTransitorioNum - cantidadIngresoNum;
                        // Al ser nuevo lote, la cantidad es directamente la que ingresa
                        const cantidad_destino = cantidadIngresoNum;
                        console.log('Cantidades calculadas para nuevo lote:', {
                            cantidad_actual_transitorio: cantidadActualTransitorioNum,
                            cantidad_ingreso: cantidadIngresoNum,
                            cantidad_final_transitorio: cantidad_transitorio,
                            cantidad_final_destino: cantidad_destino
                        });
                        yield db.sql(`
            UPDATE articulos_lotes
            SET al_cantidad = ${cantidad_transitorio}
            WHERE al_codigo = ${id_lote_transitorio}
          `);
                        const lote_destino_query = yield db.sql(`
            INSERT INTO articulos_lotes (
              al_articulo, al_lote, al_deposito, al_cantidad, al_vencimiento
            )
            SELECT 
              al_articulo, al_lote,
              ${deposito_destino} as al_deposito,
              ${cantidad_destino} as al_cantidad,
              al_vencimiento
            FROM articulos_lotes 
            WHERE al_codigo = ${id_lote_transitorio}
          `);
                        const nuevo_id_lote_destino = yield db.sql("SELECT LAST_INSERT_ID() as id");
                        id_lote_destino_final = nuevo_id_lote_destino[0].id;
                    }
                    // 3.3 Registrar transferencia del item
                    yield db.sql(`
          INSERT INTO transferencias_items (
            ti_transferencia, ti_articulo, ti_cantidad, ti_stock_actuald
          )
          VALUES (
            ${id_transferencia[0].id},
            ${item.id_articulo},
            ${item.cantidad_ingreso},
            ${item.cantidad_ingreso}
          )
        `);
                    const id_transferencia_item = yield db.sql("SELECT LAST_INSERT_ID() as id");
                    // 3.4 Registrar la transferencia del vencimiento del item solo si tiene control de vencimiento
                    if (tieneControlVencimiento) {
                        yield db.sql(`
            INSERT INTO transferencias_items_vencimiento (
              tiv_id_ti,
              tiv_lote,
              date_lote,
              loteid,
              loteidd
            )
            SELECT
              ${id_transferencia_item[0].id},
              al_lote,
              al_vencimiento,
              al_codigo,
              al_codigo
            FROM articulos_lotes
            WHERE al_codigo = ${id_lote_destino_final}
          `);
                    }
                    yield db.sql("COMMIT");
                    console.log('Subtransacción completada exitosamente');
                }
                yield db.sql("COMMIT");
                console.log('=== PROCESO COMPLETADO EXITOSAMENTE ===');
                return true;
            }
            catch (error) {
                console.error('=== ERROR EN PROCESO DE CONFIRMACIÓN ===');
                console.error('Detalles del error:', error);
                yield db.sql("ROLLBACK");
                throw error;
            }
        });
    }
    function reporteIngresos(deposito, sucursal, nro_proveedor, fecha_desde, fecha_hasta, nro_factura, verificado) {
        return __awaiter(this, void 0, void 0, function* () {
            let where = "";
            if (nro_factura) {
                // Si hay número de factura, solo aplicamos ese filtro
                where += ` AND co.co_factura = '${nro_factura}'`;
            }
            else {
                // Si no hay número de factura, aplicamos los demás filtros
                if (nro_proveedor && nro_proveedor != 0) {
                    where += ` AND oc.proveedor = ${nro_proveedor}`;
                }
                if (fecha_desde && fecha_hasta) {
                    where += ` AND oc.fecha BETWEEN '${fecha_desde}' AND '${fecha_hasta}'`;
                }
                if (fecha_desde && !fecha_hasta) {
                    where += ` AND oc.fecha >= '${fecha_desde}'`;
                }
                if (!fecha_desde && fecha_hasta) {
                    where += ` AND oc.fecha <= '${fecha_hasta}'`;
                }
                if (verificado != -1 || verificado != "-1") {
                    where += ` AND co.co_verificado = ${verificado}`;
                }
                if (deposito) {
                    where += ` AND co.co_deposito = ${deposito}`;
                }
                if (sucursal) {
                    where += ` AND co.co_sucursal = ${sucursal}`;
                }
            }
            const query = `
        SELECT
          co.co_codigo as id_compra,
          date_format(co.co_fecha, '%d/%m/%Y') as fecha_compra,
          co.co_deposito as deposito,
          dep.dep_descripcion as deposito_descripcion,
          co.co_factura as nro_factura,
          oc.id as id_orden,
          oc.proveedor as nro_proveedor,
          pr.pro_razon as proveedor,
          oc.proveedor as proveedor_id,
          co.co_verificado as verificado,
          op.op_nombre as responsable_ubicacion,
          op2.op_nombre as responsable_verificacion,
          op3.op_nombre as responsable_confirmacion,
          case
            when co.co_verificado = 0 then 'SIN VERIFICAR'
            when co.co_verificado = 1 then 'VERIFICADO'
            when co.co_verificado = 2 then 'CONFIRMADO'
          end as estado,
          (
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'detalle_compra', dc.dc_id,
                'articulo_id', dc.dc_articulo,
                'articulo_descripcion', ar.ar_descripcion,
                'articulo_codigo_barras', ar.ar_codbarra,
                'cantidad', dc.dc_cantidad,
                'cantidad_verificada', dc.dc_cantidad_verificada,
                'lote', dc.dc_lote,
                'vencimiento', date_format(al.al_vencimiento, '%d/%m/%Y')
              )
            )
          ) as items
        FROM ordenes_compra oc 
        INNER JOIN compras co ON oc.id = co.co_orden
        INNER JOIN depositos dep ON co.co_deposito = dep.dep_codigo
        INNER JOIN proveedores pr ON oc.proveedor = pr.pro_codigo
        INNER JOIN detalle_compras dc ON co.co_codigo = dc.dc_compra
        INNER JOIN detalle_compras_vencimineto d ON dc.dc_id = d.dv_detalle_compra
        INNER JOIN articulos ar ON dc.dc_articulo = ar.ar_codigo
        INNER JOIN articulos_lotes al ON d.loteid = al.al_codigo
        LEFT JOIN operadores op ON co.co_responsable_ubicacion = op.op_codigo
        LEFT JOIN operadores op2 ON co.co_verificador = op2.op_codigo
        LEFT JOIN operadores op3 ON co.co_confirmador = op3.op_codigo
        WHERE co.co_estado = 1
        ${where}
        GROUP BY co.co_codigo, co.co_fecha, co.co_deposito, co.co_factura
        ORDER BY co.co_fecha DESC
        `;
            return db.sql(query);
        });
    }
    return {
        getFacturas,
        getItems,
        verificarCompra,
        verificarItem,
        confirmarVerificacion,
        getItemsAEscanear,
        reporteIngresos
    };
};

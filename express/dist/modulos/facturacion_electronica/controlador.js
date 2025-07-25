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
const TABLA = "configuraciones";
module.exports = function (dbInyectada) {
    let db = dbInyectada;
    if (!db) {
        db = require("../../DB/mysql.js");
    }
    function getParametrosFE() {
        const query = `
          SELECT
            c.c_codigo,
            c.c_desc_nombre,
            c.c_desc_fantasia,
            c.c_ruc,
            c.c_direccion,
            c.c_telefono,
            c.c_ciudad,
            c.c_sucursal,
            c.c_correo,
            c.c_descr_establecimiento,
            c.c_dato_establecimiento,
            c.c_dato2_establecimiento,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'api_key', f.c_apikey,
                'api_url_crear', f.c_url,
                'api_url_cancelar', f.c_url_cancelar,
                'api_url_inutilizar', f.c_url_inutilizar,
                'report', f.c_report
              )
            ) AS parametros
        FROM config_factura_electronica c
        INNER JOIN config_sistema_factura_electronica f
        WHERE c.c_estado = 1
        GROUP BY c.c_codigo
        ORDER BY c.c_codigo
        LIMIT 1
        `;
        return db.sql(query);
    }
    function consultarConfiguracionFE(sucursal_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
       SELECT 1 FROM config_recibo_electronica WHERE c_sucursal = ${sucursal_id} AND c_estado = 1
    `;
            console.log(query);
            return db.sql(query);
        });
    }
    return {
        getParametrosFE,
        consultarConfiguracionFE
    };
};

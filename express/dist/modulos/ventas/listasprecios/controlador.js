"use strict";
const TABLA = 'listasprecios';
module.exports = function (dbInyectada) {
    let db = dbInyectada;
    if (!db) {
        db = require('../../DB/mysql.js');
    }
    function todos() {
        const campos = " * ";
        const where = ` lp_estado = 1 `;
        return db.todos(TABLA, campos, where);
    }
    function agregar(datos) {
        const primary_key_value = datos.lp_codigo;
        const primary_key_name = "lp_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }
    function uno(id) {
        const primary_key = `lp_codigo = ${id} `;
        const campos = " * ";
        return db.uno(TABLA, primary_key, campos);
    }
    function eliminar(id) {
        const where_update = "lp_codigo = " + id;
        const set_campo = " lp_estado = 0 ";
        return db.eliminar(TABLA, where_update, set_campo);
    }
    return {
        todos, agregar, uno, eliminar
    };
};

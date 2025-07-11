"use strict";
const TABLA = 'nacionalidades';
module.exports = function (dbInyectada) {
    let db = dbInyectada;
    if (!db) {
        db = require('../../DB/mysql.js');
    }
    function todos() {
        const campos = "*";
        const where = `1 = 1 ORDER BY nac_codigo`;
        return db.todos(TABLA, campos, where);
    }
    function agregar(datos) {
        const primary_key_value = datos.nac_codigo;
        const primary_key_name = "nac_codigo";
        return db.agregar(TABLA, datos, primary_key_value, primary_key_name);
    }
    function uno(id) {
        const primary_key = `nac_codigo = ${id} `;
        const campos = " * ";
        return db.uno(TABLA, primary_key, campos);
    }
    return {
        todos, agregar, uno
    };
};

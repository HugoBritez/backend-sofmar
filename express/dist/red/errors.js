"use strict";
const respuesta = require('./respuestas');
function errors(err, req, res, next) {
    console.error('[error]', err);
    const message = err.message || 'Error Interno';
    const status = err.statusCode || 500;
    respuesta.error(req, res, message, status);
    next();
}
module.exports = errors;

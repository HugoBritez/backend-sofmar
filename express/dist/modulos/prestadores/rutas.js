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
const express = require('express');
const seguridad = require('../../middleware/seguridad');
const router = express.Router();
const respuesta = require('../../red/respuestas.js');
const controlador = require('./index.js');
const auth = require('../../auth/index.js');
//Prestadores
router.get('/', seguridad(), todos);
//Operador-Prestadores
router.get('/operador', seguridad(), operador);
router.get('/ope-pres', seguridad(), getOperadoresPrestadores);
router.get('/ope-pres/:id', seguridad(), unoOperadoresPrestadores);
router.post('/ope-pres/', seguridad(), agregarOperadoresPrestadores);
router.put('/ope-pres/:id', seguridad(), eliminarOperadoresPrestadores);
function todos(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield controlador.todos();
            respuesta.success(req, res, items, 200);
        }
        catch (err) {
            next(err);
        }
    });
}
function operador(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield controlador.operador(req.query.user);
            respuesta.success(req, res, items, 200);
        }
        catch (err) {
            next(err);
        }
    });
}
function getOperadoresPrestadores(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const items = yield controlador.getOperadoresPrestadores(req.query.buscar);
            respuesta.success(req, res, items, 200);
        }
        catch (err) {
            next(err);
        }
    });
}
function unoOperadoresPrestadores(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield controlador.unoOperadoresPrestadores(req.params.id);
            respuesta.success(req, res, item, 200);
        }
        catch (err) {
            /*respuesta.error(req, res, err, 500)*/
            next(err);
        }
    });
}
function agregarOperadoresPrestadores(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let message = '';
            if (req.body.opre_prestador == -1) { //TODOS
                let prestadores = yield controlador.todos();
                for (p in prestadores) {
                    let estaCargado = yield controlador.operador(req.body.opre_operador, prestadores[p].pr_codigo);
                    if (estaCargado.length < 1) {
                        yield controlador.agregarOperadoresPrestadores({ opre_codigo: 0, opre_operador: req.body.opre_operador, opre_prestador: prestadores[p].pr_codigo });
                    }
                }
            }
            else { //Uno en específico, agregar
                let estaCargado = yield controlador.operador(req.body.opre_operador, req.body.opre_prestador);
                if (estaCargado.length < 1) {
                    yield controlador.agregarOperadoresPrestadores(req.body);
                }
                else {
                    message = `Operador ya se encuentra vinculado con este prestador`;
                }
            }
            if (message === '') {
                if (req.body.opre_codigo == 0) {
                    message = 'Guardado con éxito';
                }
            }
            respuesta.success(req, res, message, 201);
        }
        catch (error) {
            next(error);
        }
    });
}
function eliminarOperadoresPrestadores(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield controlador.eliminarOperadoresPrestadores(req.params.id);
            respuesta.success(req, res, 'Item eliminado satisfactoriamente!', 200);
        }
        catch (err) {
            next(err);
        }
    });
}
module.exports = router;

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
const seguridad = require('../../../middleware/seguridad');
const router = express.Router();
const respuesta = require('../../../red/respuestas.js');
const controlador = require('./index.js');
const auth = require('../../../auth/index.js');
router.put('/', seguridad(), getVenta);
router.post('/update', seguridad(), updateVenta);
router.get('/rol', seguridad(), verifRol);
router.get('/vendedor', seguridad(), getVendedor);
function getVenta(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cabecera = yield controlador.cabeceraFecha(req.query.fch);
            let items = [];
            if (cabecera.nuevo === false) { //Si ya existe, recuperamos
                items = yield controlador.getDetalles(cabecera.av_codigo);
                for (registro in items) { //Necesitamos cargar los nombres
                    let usuario = yield controlador.vendedores(items[registro].dav_vendedor, req.query.suc);
                    items[registro].op_nombre = usuario[0].op_nombre;
                    if (items[registro].dav_estado === 0) {
                        items[registro].activo = 1;
                        items[registro].atendiendo = 0;
                    }
                    else if (items[registro].dav_estado === 1) {
                        items[registro].activo = 1;
                        items[registro].atendiendo = 1;
                    }
                    else if (items[registro].dav_estado === 2) {
                        items[registro].activo = 0;
                        items[registro].atendiendo = 0;
                    }
                    if (items[registro].op_estado === 0) { //En caso de que se haya dado de baja
                        items[registro].activo = 0;
                        items[registro].atendiendo = 0;
                    }
                    items[registro].segundos = 0;
                }
            }
            else {
                items = yield controlador.vendedores(0, req.query.suc);
                let orden = 0;
                let nombre_aux = '';
                for (registro in items) {
                    orden += 1;
                    nombre_aux = items[registro].op_nombre;
                    delete items[registro].op_nombre;
                    //Cabecera
                    items[registro].dav_codigo = 0;
                    items[registro].dav_atencion = cabecera.av_codigo;
                    //Orden
                    items[registro].dav_orden = orden;
                    //Contadores y demás atributos
                    items[registro].dav_observacion = "";
                    items[registro].dav_cantidad = 0;
                    items[registro].dav_estado = 0; //0 libre, 1 atendiendo, 2 inactivo
                    let nuevo_dav = yield controlador.agregarDetalle(items[registro]);
                    //Completamos
                    items[registro].dav_codigo = nuevo_dav.insertId;
                    items[registro].op_nombre = nombre_aux;
                    items[registro].activo = 1;
                    items[registro].atendiendo = 0;
                    items[registro].segundos = 0;
                }
            }
            respuesta.success(req, res, items, 200);
        }
        catch (err) {
            next(err);
        }
    });
}
function verifRol(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let items = yield controlador.verifRol(req.query.user, req.query.rol);
            let si_es = 0;
            if (items.length > 0) {
                si_es = 1;
            }
            respuesta.success(req, res, si_es, 200);
        }
        catch (err) {
            next(err);
        }
    });
}
function getVendedor(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let item = yield controlador.vendedores(req.query.id, req.query.suc);
            respuesta.success(req, res, item, 200);
        }
        catch (err) {
            next(err);
        }
    });
}
function updateVenta(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let items = req.body;
            let orden = 0;
            for (registro in items) {
                orden += 1;
                delete items[registro].op_nombre;
                delete items[registro].segundos;
                delete items[registro].atendiendo;
                delete items[registro].activo;
                items[registro].dav_orden = orden;
                yield controlador.agregarDetalle(items[registro]);
            }
            respuesta.success(req, res, "OK", 200);
        }
        catch (err) {
            next(err);
        }
    });
}
module.exports = router;

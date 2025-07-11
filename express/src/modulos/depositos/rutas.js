const express = require('express');
const seguridad = require('../../middleware/seguridad')
const router = express.Router();
const respuesta = require('../../red/respuestas.js') 
const controlador = require('./index.js')
const auth = require('../../auth/index.js')


router.get('/filtro/:id/:operador', todos_filtro)
router.get('/sucursal/:id', todos_sucursal)
router.get('/', todos)

async function todos_filtro (req, res, next){
    try {
        const items = await controlador.todos_filtro(req.params.id, req.params.operador);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function todos_sucursal (req, res, next){
    try {
        const items = await controlador.todos_sucursal(req.params.id);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

async function todos (req, res, next){
    try {

        const sucursal =  req.query.sucursal;
        const usuario = req.query.usuario;
        const items = await controlador.todos(sucursal, usuario);
        respuesta.success(req, res, items, 200); 
    } catch (err) {
        next(err);
    }
}

module.exports = router;
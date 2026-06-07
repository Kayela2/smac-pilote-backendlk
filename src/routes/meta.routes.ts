import {Router} from 'express'
import {metaController} from '../controllers/meta.controller.js'

export const metaRouter = Router()

metaRouter.get('/ip', metaController.getClientIp)
metaRouter.get('/server-ip', metaController.getServerIp)
metaRouter.get('/headers', metaController.getHeaders)
metaRouter.post('/headers', metaController.logHeaders)

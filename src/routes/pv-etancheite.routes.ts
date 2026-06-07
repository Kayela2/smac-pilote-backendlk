import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {pvEtancheiteController} from '../controllers/pv-etancheite.controller.js'

export const pvEtancheiteRouter = Router()
pvEtancheiteRouter.use(requireAuth)

pvEtancheiteRouter.get('/', pvEtancheiteController.getAll)
pvEtancheiteRouter.get('/:id', pvEtancheiteController.getById)
pvEtancheiteRouter.post('/', pvEtancheiteController.create)
pvEtancheiteRouter.post('/:id/versions', pvEtancheiteController.createVersion)
pvEtancheiteRouter.put('/:id', pvEtancheiteController.update)
pvEtancheiteRouter.delete('/:id', pvEtancheiteController.delete)

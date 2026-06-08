import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {pvEtancheiteController, uploadPvPdf} from '../controllers/pv-etancheite.controller.js'

export const pvEtancheiteRouter = Router()
pvEtancheiteRouter.use(requireAuth)

pvEtancheiteRouter.get('/', pvEtancheiteController.getAll)
pvEtancheiteRouter.get('/:id', pvEtancheiteController.getById)
pvEtancheiteRouter.post('/', pvEtancheiteController.create)
pvEtancheiteRouter.post('/:id/versions', uploadPvPdf.single('file'), pvEtancheiteController.createVersion)
pvEtancheiteRouter.get('/:id/versions/:docId/stream', pvEtancheiteController.streamVersion)
pvEtancheiteRouter.put('/:id', pvEtancheiteController.update)
pvEtancheiteRouter.delete('/:id', pvEtancheiteController.delete)

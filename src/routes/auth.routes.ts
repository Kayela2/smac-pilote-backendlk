import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {authController} from '../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/authenticate', authController.authenticate)
authRouter.post('/logout', authController.logout)
authRouter.post('/register', authController.register)
authRouter.post('/register/mass', authController.registerMass)

authRouter.get('/check-token-validity/:token', authController.checkTokenValidity)
authRouter.get('/me', requireAuth, authController.me)

authRouter.get('/microsoft', authController.microsoftLogin)
authRouter.get('/microsoft/callback', authController.microsoftCallback)

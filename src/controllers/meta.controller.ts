import {metaService} from '../services/meta.service.js'
import {ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'

export const metaController = {
    getClientIp: (req: import('express').Request, res: import('express').Response) => {
        const ip = metaService.getClientIp(req)
        res.json(ok(ip, `Client IP Address: ${ip}`))
    },

    getServerIp: (_req: import('express').Request, res: import('express').Response) => {
        const ip = metaService.getServerIp()
        res.json(ok(ip, `Server IP Address: ${ip}`))
    },

    getHeaders: (req: import('express').Request, res: import('express').Response) => {
        res.json(ok(metaService.getHeaders(req), 'Client headers'))
    },

    logHeaders: asyncHandler(async (req, res) => {
        const log = await metaService.logRequest(req)
        res.json(ok(log, `Client IP Address: ${metaService.getClientIp(req)}`))
    }),
}

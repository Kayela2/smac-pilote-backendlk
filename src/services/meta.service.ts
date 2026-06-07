import os from 'os'
import {type Request} from 'express'
import {prisma} from '../db/prisma.js'

export const metaService = {
    getClientIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for']
        if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
        return req.socket?.remoteAddress ?? 'unknown'
    },

    getServerIp(): string {
        const nets = os.networkInterfaces()
        for (const list of Object.values(nets)) {
            for (const net of list ?? []) {
                if (net.family === 'IPv4' && !net.internal) return net.address
            }
        }
        return '127.0.0.1'
    },

    getHeaders(req: Request) {
        const LOGGED = [
            'Host', 'User', 'Accept', 'Accept-Language', 'Accept-Encoding',
            'Referer', 'Authorization', 'Origin', 'Connection',
            'Sec-Fetch-Dest', 'Sec-Fetch-Mode', 'Sec-Fetch-Site', 'Priority',
        ]
        return LOGGED.map(h => req.headers[h.toLowerCase()]).filter(Boolean)
    },

    async logRequest(req: Request) {
        const ip = metaService.getClientIp(req)
        return prisma.requestLog.create({
            data: {
                clientIp: ip, method: req.method, uri: req.originalUrl,
                protocol: req.protocol, userAgent: req.headers['user-agent'] ?? null,
            },
        })
    },
}

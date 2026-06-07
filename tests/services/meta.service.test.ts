import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {Request} from 'express'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {metaService} = await import('../../src/services/meta.service.js')

function req(overrides: Partial<Request> = {}): Request {
    return {headers: {}, socket: {remoteAddress: '1.2.3.4'}, ...overrides} as unknown as Request
}

beforeEach(resetPrismaMock)

describe('metaService.getClientIp', () => {
    it('uses x-forwarded-for first IP when present', () => {
        expect(metaService.getClientIp(req({headers: {'x-forwarded-for': '9.9.9.9, 5.5.5.5'}}))).toBe('9.9.9.9')
    })

    it('falls back to socket.remoteAddress', () => {
        expect(metaService.getClientIp(req())).toBe('1.2.3.4')
    })

    it("returns 'unknown' when no source is available", () => {
        expect(metaService.getClientIp(req({socket: undefined as never}))).toBe('unknown')
    })
})

describe('metaService.getHeaders', () => {
    it('returns only the LOGGED headers that are present', () => {
        const result = metaService.getHeaders(req({headers: {
            host: 'example.com',
            accept: '*/*',
            'sec-fetch-dest': 'document',
            'x-not-logged': 'noise',
        } as never}))
        expect(result).toEqual(['example.com', '*/*', 'document'])
    })
})

describe('metaService.getServerIp', () => {
    it('returns a string IP-like value', () => {
        const ip = metaService.getServerIp()
        expect(typeof ip).toBe('string')
        expect(ip).toMatch(/\d+\.\d+\.\d+\.\d+/)
    })
})

describe('metaService.logRequest', () => {
    it('writes a row with the IP, method, uri, protocol, userAgent', async () => {
        prismaMock.requestLog.create.mockResolvedValueOnce({id: 1})
        await metaService.logRequest(req({
            method: 'GET', originalUrl: '/api/v1/health', protocol: 'http',
            headers: {'user-agent': 'vitest', 'x-forwarded-for': '8.8.8.8'},
        }) as never)
        expect(prismaMock.requestLog.create).toHaveBeenCalledWith({
            data: {clientIp: '8.8.8.8', method: 'GET', uri: '/api/v1/health', protocol: 'http', userAgent: 'vitest'},
        })
    })
})

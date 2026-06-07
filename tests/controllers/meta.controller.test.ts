import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    getClientIp: vi.fn(() => '1.2.3.4'),
    getServerIp: vi.fn(() => '10.0.0.1'),
    getHeaders: vi.fn(() => ['vitest']),
    logRequest: vi.fn(async () => ({id: 1})),
}

vi.mock('../../src/services/meta.service.js', () => ({metaService: serviceMock}))

const {metaController} = await import('../../src/controllers/meta.controller.js')

beforeEach(() => {
    for (const fn of Object.values(serviceMock)) fn.mockReset()
    serviceMock.getClientIp.mockImplementation(() => '1.2.3.4')
    serviceMock.getServerIp.mockImplementation(() => '10.0.0.1')
    serviceMock.getHeaders.mockImplementation(() => ['vitest'])
    serviceMock.logRequest.mockImplementation(async () => ({id: 1}))
})

describe('metaController.getClientIp', () => {
    it('returns the IP from the service', async () => {
        const res = mockRes()
        await invoke(metaController.getClientIp, mockReq(), res)
        expect(res.body).toMatchObject({data: '1.2.3.4'})
    })
})

describe('metaController.getServerIp', () => {
    it('returns the IP from the service', async () => {
        const res = mockRes()
        await invoke(metaController.getServerIp, mockReq(), res)
        expect(res.body).toMatchObject({data: '10.0.0.1'})
    })
})

describe('metaController.getHeaders', () => {
    it('returns the headers from the service', async () => {
        const res = mockRes()
        await invoke(metaController.getHeaders, mockReq(), res)
        expect(res.body).toMatchObject({data: ['vitest']})
    })
})

describe('metaController.logHeaders', () => {
    it('logs the request and returns the row', async () => {
        const res = mockRes()
        await invoke(metaController.logHeaders, mockReq(), res)
        expect(serviceMock.logRequest).toHaveBeenCalledOnce()
        expect(res.body).toMatchObject({data: {id: 1}})
    })
})

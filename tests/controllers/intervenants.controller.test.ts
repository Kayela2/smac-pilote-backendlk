import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(), createMass: vi.fn(),
    update: vi.fn(), delete: vi.fn(),
}

vi.mock('../../src/services/intervenants.service.js', () => ({intervenantsService: serviceMock}))

const {intervenantsController} = await import('../../src/controllers/intervenants.controller.js')

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('intervenantsController.create', () => {
    it('returns 406 when typePole/numSAP/fullName missing', async () => {
        const res = mockRes()
        await invoke(intervenantsController.create, mockReq({body: {nom: 'X'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 201 on success', async () => {
        serviceMock.create.mockResolvedValueOnce({id: 's1'})
        const res = mockRes()
        await invoke(intervenantsController.create, mockReq({body: {typePole: 'OPX', numSAP: 1, fullName: 'A B'}}), res)
        expect(res.statusCode).toBe(201)
    })

    it('returns 409 when service throws', async () => {
        serviceMock.create.mockRejectedValueOnce(new Error('dup'))
        const res = mockRes()
        await invoke(intervenantsController.create, mockReq({body: {typePole: 'OPX', numSAP: 1, fullName: 'A B'}}), res)
        expect(res.statusCode).toBe(409)
    })
})

describe('intervenantsController.createMass', () => {
    it('returns 406 for empty body', async () => {
        const res = mockRes()
        await invoke(intervenantsController.createMass, mockReq({body: []}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 201 with the results', async () => {
        serviceMock.createMass.mockResolvedValueOnce([{id: 's1'}])
        const res = mockRes()
        await invoke(intervenantsController.createMass, mockReq({body: [{typeIntervenant: 'INTERNE'}]}), res)
        expect(res.statusCode).toBe(201)
    })
})

describe('intervenantsController.update', () => {
    it('returns 404 for NOT_FOUND', async () => {
        serviceMock.update.mockResolvedValueOnce('NOT_FOUND')
        const res = mockRes()
        await invoke(intervenantsController.update, mockReq({params: {id: 'x'}, body: {}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 409 for CONFLICT', async () => {
        serviceMock.update.mockResolvedValueOnce('CONFLICT')
        const res = mockRes()
        await invoke(intervenantsController.update, mockReq({params: {id: 's1'}, body: {}}), res)
        expect(res.statusCode).toBe(409)
    })

    it('returns 200 on success', async () => {
        serviceMock.update.mockResolvedValueOnce({id: 's1'})
        const res = mockRes()
        await invoke(intervenantsController.update, mockReq({params: {id: 's1'}, body: {}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('intervenantsController.getById', () => {
    it('returns 404 when service returns null', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(intervenantsController.getById, mockReq({params: {id: 's1'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 on hit', async () => {
        serviceMock.findById.mockResolvedValueOnce({id: 's1'})
        const res = mockRes()
        await invoke(intervenantsController.getById, mockReq({params: {id: 's1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('intervenantsController.getAll', () => {
    it('passes query-param filters to the service', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: [], totalElements: 0, totalPages: 0, size: 20, page: 0})
        const res = mockRes()
        await invoke(intervenantsController.getAll, mockReq({query: {numSAP: '42', mail: 'a@b', typePole: 'OPX'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({numSAP: 42, mail: 'a@b', typePole: 'OPX'}),
            expect.any(Number), expect.any(Number), expect.any(Number), expect.anything(),
        )
    })
})

describe('intervenantsController.delete', () => {
    it('returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(intervenantsController.delete, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('returns 200 on success', async () => {
        serviceMock.delete.mockResolvedValueOnce(true)
        const res = mockRes()
        await invoke(intervenantsController.delete, mockReq({params: {id: 's1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

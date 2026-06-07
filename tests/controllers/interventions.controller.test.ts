import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
}

vi.mock('../../src/services/interventions.service.js', () => ({interventionsService: serviceMock}))

const {interventionsController} = await import('../../src/controllers/interventions.controller.js')

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('interventionsController.create', () => {
    it('returns 406 when idIntervenant/idChantier/dateAssignation missing', async () => {
        const res = mockRes()
        await invoke(interventionsController.create, mockReq({body: {idChantier: 'c1'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 201 on success', async () => {
        serviceMock.create.mockResolvedValueOnce({id: 1})
        const res = mockRes()
        await invoke(interventionsController.create, mockReq({body: {idIntervenant: 'i1', idChantier: 'c1', dateAssignation: '2026-05-29'}}), res)
        expect(res.statusCode).toBe(201)
    })

    it('returns 409 when service throws', async () => {
        serviceMock.create.mockRejectedValueOnce(new Error('fk'))
        const res = mockRes()
        await invoke(interventionsController.create, mockReq({body: {idIntervenant: 'i1', idChantier: 'c1', dateAssignation: '2026-05-29'}}), res)
        expect(res.statusCode).toBe(409)
    })
})

describe('interventionsController.update', () => {
    it('returns 406 for a non-numeric id', async () => {
        const res = mockRes()
        await invoke(interventionsController.update, mockReq({params: {id: 'abc'}, body: {}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 404 for NOT_FOUND', async () => {
        serviceMock.update.mockResolvedValueOnce('NOT_FOUND')
        const res = mockRes()
        await invoke(interventionsController.update, mockReq({params: {id: '1'}, body: {}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 409 for CONFLICT', async () => {
        serviceMock.update.mockResolvedValueOnce('CONFLICT')
        const res = mockRes()
        await invoke(interventionsController.update, mockReq({params: {id: '1'}, body: {}}), res)
        expect(res.statusCode).toBe(409)
    })

    it('returns 200 on success', async () => {
        serviceMock.update.mockResolvedValueOnce({id: 1})
        const res = mockRes()
        await invoke(interventionsController.update, mockReq({params: {id: '1'}, body: {}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('interventionsController.getById', () => {
    it('returns 406 for a non-numeric id', async () => {
        const res = mockRes()
        await invoke(interventionsController.getById, mockReq({params: {id: 'abc'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 404 when service returns null', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(interventionsController.getById, mockReq({params: {id: '99'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 on hit', async () => {
        serviceMock.findById.mockResolvedValueOnce({id: 1})
        const res = mockRes()
        await invoke(interventionsController.getById, mockReq({params: {id: '1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('interventionsController.getAll', () => {
    it('returns 200 with no filters', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: []})
        const res = mockRes()
        await invoke(interventionsController.getAll, mockReq({query: {}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalled()
    })

    it('maps chantierId query-param to the idChantier filter', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: []})
        const res = mockRes()
        await invoke(interventionsController.getAll, mockReq({query: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({idChantier: 'c1'}),
            expect.any(Number), expect.any(Number), expect.any(Number), expect.anything(),
        )
    })

    it('maps intervenantId query-param to the idIntervenant filter', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: []})
        const res = mockRes()
        await invoke(interventionsController.getAll, mockReq({query: {intervenantId: 'i1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({idIntervenant: 'i1'}),
            expect.any(Number), expect.any(Number), expect.any(Number), expect.anything(),
        )
    })
})

describe('interventionsController.delete', () => {
    it('returns 406 for a non-numeric id', async () => {
        const res = mockRes()
        await invoke(interventionsController.delete, mockReq({params: {id: 'abc'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(interventionsController.delete, mockReq({params: {id: '99'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 on success', async () => {
        serviceMock.delete.mockResolvedValueOnce(true)
        const res = mockRes()
        await invoke(interventionsController.delete, mockReq({params: {id: '1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

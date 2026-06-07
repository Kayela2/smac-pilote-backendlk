import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
}

vi.mock('../../src/services/fiches.service.js', () => ({fichesService: serviceMock}))

const {fichesController} = await import('../../src/controllers/fiches.controller.js')

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('fichesController.getAll', () => {
    it('returns 200 with no filters', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: []})
        const res = mockRes()
        await invoke(fichesController.getAll, mockReq({query: {}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith({type: undefined}, expect.any(Number), expect.any(Number), expect.any(Number), expect.anything())
    })

    it('returns 406 for an invalid type query', async () => {
        const res = mockRes()
        await invoke(fichesController.getAll, mockReq({query: {type: 'nope'}}), res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.findAll).not.toHaveBeenCalled()
    })

    it('resolves a lowercase type query to the enum and returns 200', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: []})
        const res = mockRes()
        await invoke(fichesController.getAll, mockReq({query: {type: 'pv'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith({type: 'PV'}, expect.any(Number), expect.any(Number), expect.any(Number), expect.anything())
    })
})

describe('fichesController.getById', () => {
    it('returns 404 when service returns null', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(fichesController.getById, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 on hit', async () => {
        serviceMock.findById.mockResolvedValueOnce({id: 'f1'})
        const res = mockRes()
        await invoke(fichesController.getById, mockReq({params: {id: 'f1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('fichesController.create', () => {
    it('returns 406 when code/name/type missing', async () => {
        const res = mockRes()
        await invoke(fichesController.create, mockReq({body: {code: 'ACC'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 201 on success', async () => {
        serviceMock.create.mockResolvedValueOnce({id: 'f1'})
        const res = mockRes()
        await invoke(fichesController.create, mockReq({body: {code: 'ACC', name: 'Fiche Accueil', type: 'FICHE'}}), res)
        expect(res.statusCode).toBe(201)
    })

    it('returns 409 when service throws', async () => {
        serviceMock.create.mockRejectedValueOnce(new Error('dup'))
        const res = mockRes()
        await invoke(fichesController.create, mockReq({body: {code: 'ACC', name: 'Fiche Accueil', type: 'FICHE'}}), res)
        expect(res.statusCode).toBe(409)
    })
})

describe('fichesController.update', () => {
    it('returns 404 for NOT_FOUND', async () => {
        serviceMock.update.mockResolvedValueOnce('NOT_FOUND')
        const res = mockRes()
        await invoke(fichesController.update, mockReq({params: {id: 'x'}, body: {}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 409 for CONFLICT', async () => {
        serviceMock.update.mockResolvedValueOnce('CONFLICT')
        const res = mockRes()
        await invoke(fichesController.update, mockReq({params: {id: 'f1'}, body: {}}), res)
        expect(res.statusCode).toBe(409)
    })

    it('returns 200 on success', async () => {
        serviceMock.update.mockResolvedValueOnce({id: 'f1'})
        const res = mockRes()
        await invoke(fichesController.update, mockReq({params: {id: 'f1'}, body: {}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('fichesController.delete', () => {
    it('returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(fichesController.delete, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 on success', async () => {
        serviceMock.delete.mockResolvedValueOnce(true)
        const res = mockRes()
        await invoke(fichesController.delete, mockReq({params: {id: 'f1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

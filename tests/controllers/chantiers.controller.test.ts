import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    create: vi.fn(),
    createMass: vi.fn(),
    addActionsToChantier: vi.fn(),
    updateStatus: vi.fn(),
    getIntervenantsPaginated: vi.fn(),
    getIntervenantsAll: vi.fn(),
    update: vi.fn(),
    updateDetails: vi.fn(),
    addIntervenantIds: vi.fn(),
    createAndAddIntervenants: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
}

vi.mock('../../src/services/chantiers.service.js', () => ({chantiersService: serviceMock}))

const {chantiersController} = await import('../../src/controllers/chantiers.controller.js')

beforeEach(() => {
    for (const fn of Object.values(serviceMock)) fn.mockReset()
})

describe('chantiersController.create', () => {
    it('returns 406 when codeOTP is missing', async () => {
        const req = mockReq({body: {}})
        const res = mockRes()
        await invoke(chantiersController.create, req, res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.create).not.toHaveBeenCalled()
    })

    it('returns 201 with the created chantier on success', async () => {
        serviceMock.create.mockResolvedValueOnce({id: 'c1'})
        const req = mockReq({body: {codeOTP: 12345}})
        const res = mockRes()
        await invoke(chantiersController.create, req, res)
        expect(res.statusCode).toBe(201)
        expect(res.body).toMatchObject({data: {id: 'c1'}, type: 'SUCCESS'})
    })

    it('returns 409 when the service throws (duplicate OTP)', async () => {
        serviceMock.create.mockRejectedValueOnce(new Error('unique'))
        const req = mockReq({body: {codeOTP: 12345}})
        const res = mockRes()
        await invoke(chantiersController.create, req, res)
        expect(res.statusCode).toBe(409)
        expect(res.body).toMatchObject({type: 'ERROR'})
    })
})

describe('chantiersController.createMass', () => {
    it('returns 406 for empty or non-array bodies', async () => {
        const res1 = mockRes()
        await invoke(chantiersController.createMass, mockReq({body: []}), res1)
        expect(res1.statusCode).toBe(406)
        const res2 = mockRes()
        await invoke(chantiersController.createMass, mockReq({body: {}}), res2)
        expect(res2.statusCode).toBe(406)
    })

    it('delegates to the service and returns 201', async () => {
        serviceMock.createMass.mockResolvedValueOnce([{id: 'c1'}, null])
        const res = mockRes()
        await invoke(chantiersController.createMass, mockReq({body: [{codeOTP: 1}, {codeOTP: 2}]}), res)
        expect(res.statusCode).toBe(201)
        expect(serviceMock.createMass).toHaveBeenCalledOnce()
    })
})

describe('chantiersController.getById', () => {
    it('returns 404 when not found', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(chantiersController.getById, mockReq({params: {chantierId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 with the chantier when found', async () => {
        serviceMock.findById.mockResolvedValueOnce({id: 'c1'})
        const res = mockRes()
        await invoke(chantiersController.getById, mockReq({params: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({data: {id: 'c1'}})
    })
})

describe('chantiersController.getAll', () => {
    it('returns 204 when no results', async () => {
        serviceMock.findAll.mockResolvedValueOnce({totalElements: 0, content: [], totalPages: 0, page: 0, size: 20})
        const res = mockRes()
        await invoke(chantiersController.getAll, mockReq({query: {page: '0', size: '20'}}), res)
        expect(res.statusCode).toBe(204)
        expect(res.ended).toBe(true)
    })

    it('returns 200 with the page when results exist', async () => {
        serviceMock.findAll.mockResolvedValueOnce({totalElements: 1, content: [{id: 'c1'}], totalPages: 1, page: 0, size: 20})
        const res = mockRes()
        await invoke(chantiersController.getAll, mockReq({query: {page: '0', size: '20'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith({}, 0, 20, expect.objectContaining({field: '', dir: 'asc'}))
    })

    it('passes query-param filters to the service', async () => {
        serviceMock.findAll.mockResolvedValueOnce({totalElements: 1, content: [{id: 'c1'}], totalPages: 1, page: 0, size: 20})
        const res = mockRes()
        await invoke(chantiersController.getAll, mockReq({query: {codeOTP: '12345', name: 'Te', status: 'IN_PROGRESS'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({codeOTP: 12345, name: 'Te', status: 'IN_PROGRESS'}),
            0, 20, expect.anything(),
        )
    })

    it('rejects out-of-range progress with 406', async () => {
        const res = mockRes()
        await invoke(chantiersController.getAll, mockReq({query: {progress: '150'}}), res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.findAll).not.toHaveBeenCalled()
    })

    it('rejects invalid progress ranges with 406', async () => {
        const res = mockRes()
        await invoke(chantiersController.getAll, mockReq({query: {progressFrom: '80', progressTo: '20'}}), res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.findAll).not.toHaveBeenCalled()
    })

    it('accepts a valid progress range and delegates', async () => {
        serviceMock.findAll.mockResolvedValueOnce({totalElements: 1, content: [{id: 'c1'}], totalPages: 1, page: 0, size: 20})
        const res = mockRes()
        await invoke(chantiersController.getAll, mockReq({query: {progressFrom: '10', progressTo: '90'}}), res)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({progressFrom: 10, progressTo: 90}),
            0, 20, expect.anything(),
        )
    })
})

describe('chantiersController.updateStatus', () => {
    it('returns 404 when service returns null', async () => {
        serviceMock.updateStatus.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(chantiersController.updateStatus, mockReq({params: {chantierId: 'x', status: 'CLOSED'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns the updated chantier on success', async () => {
        serviceMock.updateStatus.mockResolvedValueOnce({id: 'c1', status: 'CLOSED'})
        const res = mockRes()
        await invoke(chantiersController.updateStatus, mockReq({params: {chantierId: 'c1', status: 'CLOSED'}}), res)
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({data: {id: 'c1', status: 'CLOSED'}})
    })
})

describe('chantiersController.update', () => {
    it('maps P2025 to 404', async () => {
        serviceMock.update.mockRejectedValueOnce(Object.assign(new Error('not found'), {code: 'P2025'}))
        const res = mockRes()
        await invoke(chantiersController.update, mockReq({params: {chantierId: 'x'}, body: {}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('maps other errors to 409', async () => {
        serviceMock.update.mockRejectedValueOnce(Object.assign(new Error('unique'), {code: 'P2002'}))
        const res = mockRes()
        await invoke(chantiersController.update, mockReq({params: {chantierId: 'c1'}, body: {name: 'dup'}}), res)
        expect(res.statusCode).toBe(409)
    })
})

describe('chantiersController.delete', () => {
    it('returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(chantiersController.delete, mockReq({params: {chantierId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 on success', async () => {
        serviceMock.delete.mockResolvedValueOnce(true)
        const res = mockRes()
        await invoke(chantiersController.delete, mockReq({params: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('chantiersController.addIntervenantIds', () => {
    it('returns 406 for empty array', async () => {
        const res = mockRes()
        await invoke(chantiersController.addIntervenantIds, mockReq({body: [], params: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 404 when the chantier does not exist', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(chantiersController.addIntervenantIds, mockReq({body: ['s1'], params: {chantierId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
        expect(serviceMock.addIntervenantIds).not.toHaveBeenCalled()
    })

    it('adds intervenants and returns the chantier when it exists', async () => {
        serviceMock.findById.mockResolvedValueOnce({id: 'c1'})
        serviceMock.addIntervenantIds.mockResolvedValueOnce(undefined)
        const res = mockRes()
        await invoke(chantiersController.addIntervenantIds, mockReq({body: ['s1', 's2'], params: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.addIntervenantIds).toHaveBeenCalledWith('c1', ['s1', 's2'])
    })
})

describe('chantiersController.getIntervenants', () => {
    it('returns 204 when there are no intervenants', async () => {
        serviceMock.getIntervenantsPaginated.mockResolvedValueOnce({total: 0, page: {content: [], totalElements: 0, totalPages: 0, page: 0, size: 20}})
        const res = mockRes()
        await invoke(chantiersController.getIntervenants, mockReq({params: {chantierId: 'c1'}, query: {}}), res)
        expect(res.statusCode).toBe(204)
    })

    it('returns the page when present', async () => {
        serviceMock.getIntervenantsPaginated.mockResolvedValueOnce({total: 1, page: {content: [{id: 's1'}], totalElements: 1, totalPages: 1, page: 0, size: 20}})
        const res = mockRes()
        await invoke(chantiersController.getIntervenants, mockReq({params: {chantierId: 'c1'}, query: {}}), res)
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({data: {content: [{id: 's1'}]}})
    })
})

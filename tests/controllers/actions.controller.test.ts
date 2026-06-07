import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    create: vi.fn(), addChild: vi.fn(), addChildren: vi.fn(),
    update: vi.fn(), delete: vi.fn(),
    findById: vi.fn(), findAll: vi.fn(),
}

vi.mock('../../src/services/actions.service.js', () => ({actionsService: serviceMock}))

const {actionsController} = await import('../../src/controllers/actions.controller.js')

const emptyPage = {total: 0, page: {content: [], totalElements: 0, totalPages: 0, page: 0, size: 20}}
const onePage = {total: 1, page: {content: [{id: 'a1'}], totalElements: 1, totalPages: 1, page: 0, size: 20}}

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('actionsController.create', () => {
    it('returns 406 when responsible is missing', async () => {
        const res = mockRes()
        await invoke(actionsController.create, mockReq({body: {}}), res)
        expect(res.statusCode).toBe(406)
    })
    it('returns 201 on success', async () => {
        serviceMock.create.mockResolvedValueOnce({id: 'a1'})
        const res = mockRes()
        await invoke(actionsController.create, mockReq({body: {responsible: 'Z'}}), res)
        expect(res.statusCode).toBe(201)
    })
})

describe('actionsController.addChild', () => {
    it('returns 406 when responsible is missing', async () => {
        const res = mockRes()
        await invoke(actionsController.addChild, mockReq({body: {}, params: {actionId: 'a1'}}), res)
        expect(res.statusCode).toBe(406)
    })
    it('returns 404 when parent missing', async () => {
        serviceMock.addChild.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(actionsController.addChild, mockReq({body: {responsible: 'Z'}, params: {actionId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('returns 201 on success', async () => {
        serviceMock.addChild.mockResolvedValueOnce({id: 'a1'})
        const res = mockRes()
        await invoke(actionsController.addChild, mockReq({body: {responsible: 'Z'}, params: {actionId: 'a1'}}), res)
        expect(res.statusCode).toBe(201)
    })
})

describe('actionsController.addChildren', () => {
    it('returns 406 for empty/non-array body', async () => {
        const res = mockRes()
        await invoke(actionsController.addChildren, mockReq({body: [], params: {actionId: 'a1'}}), res)
        expect(res.statusCode).toBe(406)
    })
    it('returns 404 when service returns null', async () => {
        serviceMock.addChildren.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(actionsController.addChildren, mockReq({body: [{responsible: 'Z'}], params: {actionId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
})

describe('actionsController.getAll (filters)', () => {
    it('returns 406 when only one due-date range bound is given', async () => {
        const res = mockRes()
        await invoke(actionsController.getAll, mockReq({query: {dueDateAfter: '2026-01-01'}}), res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.findAll).not.toHaveBeenCalled()
    })

    it('passes filters through to the service', async () => {
        serviceMock.findAll.mockResolvedValueOnce(onePage)
        const res = mockRes()
        await invoke(actionsController.getAll, mockReq({query: {site: 'A', responsible: 'R', status: 'S'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({site: 'A', responsible: 'R', status: 'S'}),
            expect.any(Number), expect.any(Number), expect.any(Number), expect.anything(),
        )
    })

    it('returns 204 when no results', async () => {
        serviceMock.findAll.mockResolvedValueOnce(emptyPage)
        const res = mockRes()
        await invoke(actionsController.getAll, mockReq({query: {site: 'A'}}), res)
        expect(res.statusCode).toBe(204)
    })
})

describe('actionsController.update / delete / getById / getAll', () => {
    it('update returns 404 when service returns NOT_FOUND', async () => {
        serviceMock.update.mockResolvedValueOnce('NOT_FOUND')
        const res = mockRes()
        await invoke(actionsController.update, mockReq({params: {actionId: 'x'}, body: {}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('delete returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(actionsController.delete, mockReq({params: {actionId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('getById returns 404 when missing', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(actionsController.getById, mockReq({params: {actionId: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('getAll returns 204 when empty', async () => {
        serviceMock.findAll.mockResolvedValueOnce(emptyPage)
        const res = mockRes()
        await invoke(actionsController.getAll, mockReq({query: {}}), res)
        expect(res.statusCode).toBe(204)
    })
})

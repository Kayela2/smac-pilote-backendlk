import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const requiredMock = {getKeys: vi.fn(), setKeys: vi.fn()}
const sharedMock = {getKeys: vi.fn(), setKeys: vi.fn()}

vi.mock('../../src/services/required-docs.service.js', () => ({requiredDocsService: requiredMock}))
vi.mock('../../src/services/shared-docs.service.js', () => ({sharedDocsService: sharedMock}))

const {docsPermissionController} = await import('../../src/controllers/docs-permission.controller.js')

beforeEach(() => {
    for (const fn of Object.values(requiredMock)) fn.mockReset()
    for (const fn of Object.values(sharedMock)) fn.mockReset()
})

describe.each([
    ['required', 'getRequired', 'setRequired', requiredMock],
    ['shared', 'getShared', 'setShared', sharedMock],
] as const)('docsPermissionController %s', (_label, getFn, setFn, serviceMock) => {
    it('GET returns 200 with the keys', async () => {
        serviceMock.getKeys.mockResolvedValueOnce(['A::x'])
        const res = mockRes()
        await invoke(docsPermissionController[getFn], mockReq({params: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.getKeys).toHaveBeenCalledWith('c1')
        expect(res.body).toMatchObject({data: ['A::x']})
    })

    it('SET returns 406 when keys is not an array', async () => {
        const res = mockRes()
        await invoke(docsPermissionController[setFn], mockReq({params: {chantierId: 'c1'}, body: {keys: 'nope'}}), res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.setKeys).not.toHaveBeenCalled()
    })

    it('SET filters non-strings and delegates', async () => {
        serviceMock.setKeys.mockResolvedValueOnce(['A::x', 'B::y'])
        const res = mockRes()
        await invoke(docsPermissionController[setFn], mockReq({params: {chantierId: 'c1'}, body: {keys: ['A::x', 'B::y', 5, null]}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.setKeys).toHaveBeenCalledWith('c1', ['A::x', 'B::y'])
    })
})

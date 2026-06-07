import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {actionsService} = await import('../../src/services/actions.service.js')

const baseAction = {
    id: 'a1', site: 'S', anomalyRef: 'AR', correctiveAction: 'CA',
    responsible: 'Alice', startDate: null, dueDate: new Date('2026-06-01'),
    status: 'Initialisé', progress: null, childIndex: 0,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    children: [], previousOf: [],
}

beforeEach(resetPrismaMock)

describe('actionsService.create', () => {
    it('persists and reloads the action', async () => {
        prismaMock.action.create.mockResolvedValueOnce({id: 'a1'})
        prismaMock.action.findUnique.mockResolvedValueOnce(baseAction)
        const result = await actionsService.create({responsible: 'Alice'})
        expect(prismaMock.action.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({responsible: 'Alice', status: 'Initialisé'}),
        }))
        expect(result).toMatchObject({id: 'a1', responsible: 'Alice'})
    })
})

describe('actionsService.addChild', () => {
    it('returns null when parent not found', async () => {
        prismaMock.action.findUnique.mockResolvedValueOnce(null)
        await expect(actionsService.addChild('missing', {responsible: 'Alice'})).resolves.toBeNull()
        expect(prismaMock.action.create).not.toHaveBeenCalled()
    })

    it('creates a child with the next index', async () => {
        prismaMock.action.findUnique.mockResolvedValueOnce({id: 'a1'})
        prismaMock.actionChild.count.mockResolvedValueOnce(2)
        prismaMock.action.create.mockResolvedValueOnce({id: 'a2'})
        prismaMock.action.findUnique.mockResolvedValueOnce(baseAction)
        await actionsService.addChild('a1', {responsible: 'Bob'})
        expect(prismaMock.action.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({childIndex: 2, childOf: {create: {actionId: 'a1'}}}),
        }))
    })
})

describe('actionsService.addChildren', () => {
    it('returns null when parent not found', async () => {
        prismaMock.action.findUnique.mockResolvedValueOnce(null)
        await expect(actionsService.addChildren('missing', [{responsible: 'Alice'}])).resolves.toBeNull()
    })

    it('skips items without responsible and increments childIndex', async () => {
        prismaMock.action.findUnique.mockResolvedValueOnce({id: 'a1'})
        prismaMock.actionChild.count.mockResolvedValueOnce(0)
        prismaMock.action.create.mockResolvedValue({id: 'a2'})
        prismaMock.action.findUnique.mockResolvedValue(baseAction)
        await actionsService.addChildren('a1', [
            {responsible: 'Alice'},
            {responsible: ''} as never,
            {responsible: 'Bob'},
        ])
        expect(prismaMock.action.create).toHaveBeenCalledTimes(2)
        expect(prismaMock.action.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
            data: expect.objectContaining({childIndex: 0}),
        }))
        expect(prismaMock.action.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
            data: expect.objectContaining({childIndex: 1}),
        }))
    })
})

describe('actionsService.findAll', () => {
    it('runs count+findMany in a transaction with default orderBy', async () => {
        prismaMock.action.count.mockResolvedValueOnce(1)
        prismaMock.action.findMany.mockResolvedValueOnce([baseAction])
        const {total, page} = await actionsService.findAll({}, 0, 10, 0)
        expect(prismaMock.$transaction).toHaveBeenCalledOnce()
        expect(prismaMock.action.findMany).toHaveBeenCalledWith(expect.objectContaining({
            orderBy: expect.arrayContaining([expect.objectContaining({childIndex: {sort: 'asc', nulls: 'first'}})]),
        }))
        expect(total).toBe(1)
        expect(page.content).toHaveLength(1)
    })

    it('falls back to createdAt for unknown sort field', async () => {
        prismaMock.action.count.mockResolvedValueOnce(0)
        prismaMock.action.findMany.mockResolvedValueOnce([])
        await actionsService.findAll({}, 0, 10, 0, {field: 'nope', dir: 'desc'})
        expect(prismaMock.action.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {createdAt: 'asc'}}))
    })

    it('builds a where from site/responsible/status filters', async () => {
        prismaMock.action.count.mockResolvedValueOnce(0)
        prismaMock.action.findMany.mockResolvedValueOnce([])
        await actionsService.findAll({site: 'A', responsible: 'Al', status: 'Initialisé'}, 0, 10, 0)
        expect(prismaMock.action.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                site: {contains: 'A', mode: 'insensitive'},
                responsible: {contains: 'Al', mode: 'insensitive'},
                status: 'Initialisé',
            },
        }))
    })

    it('builds a single-day dueDate range', async () => {
        prismaMock.action.count.mockResolvedValueOnce(0)
        prismaMock.action.findMany.mockResolvedValueOnce([])
        await actionsService.findAll({dueDate: new Date('2026-06-01')}, 0, 10, 0)
        expect(prismaMock.action.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {dueDate: {gte: new Date('2026-06-01'), lt: new Date('2026-06-02')}},
        }))
    })

    it('builds a dueDate range from after/before', async () => {
        prismaMock.action.count.mockResolvedValueOnce(0)
        prismaMock.action.findMany.mockResolvedValueOnce([])
        await actionsService.findAll({dueDateAfter: new Date('2026-01-01'), dueDateBefore: new Date('2026-12-31')}, 0, 10, 0)
        expect(prismaMock.action.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {dueDate: {gte: new Date('2026-01-01'), lte: new Date('2026-12-31')}},
        }))
    })
})

describe('actionsService.update', () => {
    it("returns 'NOT_FOUND' on prisma P2025", async () => {
        prismaMock.action.update.mockRejectedValueOnce(Object.assign(new Error('x'), {code: 'P2025'}))
        await expect(actionsService.update('a1', {responsible: 'Z'})).resolves.toBe('NOT_FOUND')
    })

    it('rethrows non-P2025 errors', async () => {
        prismaMock.action.update.mockRejectedValueOnce(Object.assign(new Error('boom'), {code: 'OTHER'}))
        await expect(actionsService.update('a1', {responsible: 'Z'})).rejects.toThrow('boom')
    })

    it('returns the mapped action on success', async () => {
        prismaMock.action.update.mockResolvedValueOnce({})
        prismaMock.action.findUnique.mockResolvedValueOnce(baseAction)
        await expect(actionsService.update('a1', {responsible: 'Z'})).resolves.toMatchObject({id: 'a1'})
    })
})

describe('actionsService.delete', () => {
    it('returns true on success and false on error', async () => {
        prismaMock.action.delete.mockResolvedValueOnce(baseAction)
        await expect(actionsService.delete('a1')).resolves.toBe(true)
        prismaMock.action.delete.mockRejectedValueOnce(new Error('x'))
        await expect(actionsService.delete('a1')).resolves.toBe(false)
    })
})

describe('actionsService.findById (recursion guard)', () => {
    it('handles cycles without infinite recursion', async () => {
        prismaMock.action.findUnique
            .mockResolvedValueOnce({...baseAction, id: 'a1', children: [{childrenId: 'a2'}], previousOf: []})
            .mockResolvedValueOnce({...baseAction, id: 'a2', children: [{childrenId: 'a1'}], previousOf: []})
        const result = await actionsService.findById('a1')
        expect(result?.id).toBe('a1')
        expect(result?.children?.[0]?.id).toBe('a2')
    })
})

import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {chantiersService} = await import('../../src/services/chantiers.service.js')

const baseChantier = {
    id: 'c1', codeOTP: 12345, name: 'Test', team: 'A', client: 'Acme',
    address: 'Somewhere', progress: 50, status: 'IN_PROGRESS',
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'),
    chantierDetails: null,
}

beforeEach(resetPrismaMock)

describe('chantiersService.create', () => {
    it('persists with defaults and returns the mapped chantier', async () => {
        prismaMock.chantier.create.mockResolvedValueOnce(baseChantier)
        const result = await chantiersService.create({codeOTP: 12345, name: 'Test'})
        expect(prismaMock.chantier.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({codeOTP: 12345, name: 'Test', progress: 0, status: 'Initialisé'}),
            include: {chantierDetails: true},
        }))
        expect(result).toMatchObject({id: 'c1', codeOTP: 12345, name: 'Test', progress: 50})
    })

    it('lets prisma errors bubble (controller catches duplicates)', async () => {
        prismaMock.chantier.create.mockRejectedValueOnce(new Error('unique'))
        await expect(chantiersService.create({codeOTP: 1})).rejects.toThrow('unique')
    })
})

describe('chantiersService.createMass', () => {
    it('skips items with no codeOTP and returns null for them', async () => {
        prismaMock.chantier.create.mockResolvedValueOnce(baseChantier)
        const result = await chantiersService.createMass([{codeOTP: 1}, {codeOTP: 0}, {codeOTP: undefined as unknown as number}])
        expect(prismaMock.chantier.create).toHaveBeenCalledTimes(1)
        expect(result).toEqual([expect.objectContaining({id: 'c1'}), null, null])
    })

    it('catches individual failures and returns null for them', async () => {
        prismaMock.chantier.create
            .mockResolvedValueOnce(baseChantier)
            .mockRejectedValueOnce(new Error('dup'))
        const result = await chantiersService.createMass([{codeOTP: 1}, {codeOTP: 2}])
        expect(result).toEqual([expect.objectContaining({id: 'c1'}), null])
    })
})

describe('chantiersService.findById', () => {
    it('returns null when prisma returns nothing', async () => {
        prismaMock.chantier.findUnique.mockResolvedValueOnce(null)
        expect(await chantiersService.findById('missing')).toBeNull()
    })

    it('maps the chantier when found', async () => {
        prismaMock.chantier.findUnique.mockResolvedValue(baseChantier)
        await expect(chantiersService.findById('c1')).resolves.toMatchObject({id: 'c1'})
    })
})

describe('chantiersService.findAll (pagination + filters)', () => {
    it('runs count + findMany in a transaction and builds a Page', async () => {
        prismaMock.chantier.count.mockResolvedValueOnce(3)
        prismaMock.chantier.findMany.mockResolvedValueOnce([baseChantier, baseChantier, baseChantier])
        const page = await chantiersService.findAll({}, 0, 10)
        expect(prismaMock.$transaction).toHaveBeenCalledOnce()
        expect(page).toMatchObject({totalElements: 3, totalPages: 1, page: 0, size: 10})
        expect(page.content).toHaveLength(3)
    })

    it('passes orderBy when sort is provided', async () => {
        prismaMock.chantier.count.mockResolvedValueOnce(0)
        prismaMock.chantier.findMany.mockResolvedValueOnce([])
        await chantiersService.findAll({}, 0, 10, {field: 'name', dir: 'desc'})
        expect(prismaMock.chantier.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {name: 'desc'}}))
    })

    it('falls back to codeOTP ordering for unknown sort fields', async () => {
        prismaMock.chantier.count.mockResolvedValueOnce(0)
        prismaMock.chantier.findMany.mockResolvedValueOnce([])
        await chantiersService.findAll({}, 0, 10, {field: 'unknown', dir: 'asc'})
        expect(prismaMock.chantier.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {codeOTP: 'asc'}}))
    })

    it('builds a where from codeOTP/name/client/progress filters', async () => {
        prismaMock.chantier.count.mockResolvedValueOnce(0)
        prismaMock.chantier.findMany.mockResolvedValueOnce([])
        await chantiersService.findAll({codeOTP: 12345, name: 'Te', client: 'Ac', progress: 50}, 0, 10)
        expect(prismaMock.chantier.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                codeOTP: 12345,
                name: {contains: 'Te', mode: 'insensitive'},
                client: {contains: 'Ac', mode: 'insensitive'},
                progress: {gte: 50, lte: 50},
            },
        }))
    })

    it('builds a progress range from progressFrom/progressTo', async () => {
        prismaMock.chantier.count.mockResolvedValueOnce(0)
        prismaMock.chantier.findMany.mockResolvedValueOnce([])
        await chantiersService.findAll({progressFrom: 10, progressTo: 90}, 0, 10)
        expect(prismaMock.chantier.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {progress: {gte: 10, lte: 90}},
        }))
    })
})

describe('chantiersService.updateStatus', () => {
    it('returns the mapped chantier on success', async () => {
        prismaMock.chantier.update.mockResolvedValueOnce(baseChantier)
        const result = await chantiersService.updateStatus('c1', 'CLOSED')
        expect(prismaMock.chantier.update).toHaveBeenCalledWith(expect.objectContaining({
            where: {id: 'c1'}, data: expect.objectContaining({status: 'CLOSED'}),
        }))
        expect(result).toMatchObject({id: 'c1'})
    })

    it('returns null when prisma throws (e.g. record not found)', async () => {
        prismaMock.chantier.update.mockRejectedValueOnce(new Error('P2025'))
        await expect(chantiersService.updateStatus('missing', 'CLOSED')).resolves.toBeNull()
    })
})

describe('chantiersService.delete', () => {
    it('returns true on success', async () => {
        prismaMock.chantier.delete.mockResolvedValueOnce(baseChantier)
        await expect(chantiersService.delete('c1')).resolves.toBe(true)
    })

    it('returns false when prisma throws', async () => {
        prismaMock.chantier.delete.mockRejectedValueOnce(new Error('P2025'))
        await expect(chantiersService.delete('missing')).resolves.toBe(false)
    })
})

describe('chantiersService.addActionsToChantier', () => {
    it('returns null when the chantier does not exist', async () => {
        prismaMock.chantier.findUnique.mockResolvedValueOnce(null)
        await expect(chantiersService.addActionsToChantier('missing', [{responsible: 'Alice'}])).resolves.toBeNull()
        expect(prismaMock.action.create).not.toHaveBeenCalled()
    })

    it('creates actions and links them, skipping items without responsible', async () => {
        prismaMock.chantier.findUnique.mockResolvedValue(baseChantier)
        prismaMock.action.create.mockResolvedValue({id: 'a1'})
        prismaMock.chantierAction.create.mockResolvedValue({})
        await chantiersService.addActionsToChantier('c1', [
            {responsible: 'Alice'},
            {responsible: ''} as never,
            {responsible: 'Bob'},
        ])
        expect(prismaMock.action.create).toHaveBeenCalledTimes(2)
        expect(prismaMock.chantierAction.create).toHaveBeenCalledTimes(2)
    })
})

describe('chantiersService.addIntervenantIds', () => {
    it('upserts each link', async () => {
        prismaMock.chantierIntervenant.upsert.mockResolvedValue({})
        await chantiersService.addIntervenantIds('c1', ['s1', 's2'])
        expect(prismaMock.chantierIntervenant.upsert).toHaveBeenCalledTimes(2)
        expect(prismaMock.chantierIntervenant.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
            where: {chantierId_intervenantId: {chantierId: 'c1', intervenantId: 's1'}},
        }))
    })
})

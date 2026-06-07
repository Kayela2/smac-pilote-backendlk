import {beforeEach, describe, expect, it, vi} from 'vitest'
import {TypeFiche} from '../../src/generated/prisma/enums.js'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {fichesService} = await import('../../src/services/fiches.service.js')

const baseFiche = {
    id: 'f1',
    code: 'ACC',
    name: 'Fiche Accueil',
    type: TypeFiche.FICHE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
}

beforeEach(resetPrismaMock)

describe('fichesService.findAll (sort fallback + filters)', () => {
    it('defaults to name asc on unknown sort field', async () => {
        prismaMock.fiche.count.mockResolvedValueOnce(0)
        prismaMock.fiche.findMany.mockResolvedValueOnce([])
        await fichesService.findAll({}, 0, 10, 0, {field: 'nope', dir: 'desc'})
        expect(prismaMock.fiche.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {name: 'asc'}}))
    })

    it('applies a known sort field', async () => {
        prismaMock.fiche.count.mockResolvedValueOnce(0)
        prismaMock.fiche.findMany.mockResolvedValueOnce([])
        await fichesService.findAll({}, 0, 10, 0, {field: 'code', dir: 'desc'})
        expect(prismaMock.fiche.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {code: 'desc'}}))
    })

    it('maps rows', async () => {
        prismaMock.fiche.count.mockResolvedValueOnce(1)
        prismaMock.fiche.findMany.mockResolvedValueOnce([baseFiche])
        const page = await fichesService.findAll({}, 0, 10, 0)
        expect(page.content[0]).toMatchObject({id: 'f1', code: 'ACC', name: 'Fiche Accueil', type: TypeFiche.FICHE})
    })

    it('filters by type', async () => {
        prismaMock.fiche.count.mockResolvedValueOnce(0)
        prismaMock.fiche.findMany.mockResolvedValueOnce([])
        await fichesService.findAll({type: TypeFiche.PV}, 0, 10, 0)
        expect(prismaMock.fiche.findMany).toHaveBeenCalledWith(expect.objectContaining({where: {type: TypeFiche.PV}}))
    })
})

describe('fichesService.findById', () => {
    it('returns null when missing', async () => {
        prismaMock.fiche.findUnique.mockResolvedValueOnce(null)
        await expect(fichesService.findById('x')).resolves.toBeNull()
    })

    it('maps when found', async () => {
        prismaMock.fiche.findUnique.mockResolvedValueOnce(baseFiche)
        await expect(fichesService.findById('f1')).resolves.toMatchObject({id: 'f1'})
    })
})

describe('fichesService.create', () => {
    it('persists and returns the mapped fiche', async () => {
        prismaMock.fiche.create.mockResolvedValueOnce(baseFiche)
        const result = await fichesService.create({code: 'ACC', name: 'Fiche Accueil', type: TypeFiche.FICHE})
        expect(prismaMock.fiche.create).toHaveBeenCalledWith({
            data: {code: 'ACC', name: 'Fiche Accueil', type: TypeFiche.FICHE},
        })
        expect(result).toMatchObject({id: 'f1'})
    })
})

describe('fichesService.update', () => {
    it("returns 'NOT_FOUND' on P2025", async () => {
        prismaMock.fiche.update.mockRejectedValueOnce(Object.assign(new Error('x'), {code: 'P2025'}))
        await expect(fichesService.update('x', {name: 'X'})).resolves.toBe('NOT_FOUND')
    })

    it("returns 'CONFLICT' on other errors", async () => {
        prismaMock.fiche.update.mockRejectedValueOnce(Object.assign(new Error('e'), {code: 'P2002'}))
        await expect(fichesService.update('f1', {name: 'X'})).resolves.toBe('CONFLICT')
    })

    it('returns the mapped fiche on success', async () => {
        prismaMock.fiche.update.mockResolvedValueOnce(baseFiche)
        await expect(fichesService.update('f1', {name: 'Fiche Accueil'})).resolves.toMatchObject({id: 'f1'})
    })
})

describe('fichesService.delete', () => {
    it('returns true / false', async () => {
        prismaMock.fiche.delete.mockResolvedValueOnce(baseFiche)
        await expect(fichesService.delete('f1')).resolves.toBe(true)
        prismaMock.fiche.delete.mockRejectedValueOnce(new Error('x'))
        await expect(fichesService.delete('f1')).resolves.toBe(false)
    })
})

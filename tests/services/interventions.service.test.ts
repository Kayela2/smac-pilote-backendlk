import {beforeEach, describe, expect, it, vi} from 'vitest'
import {TypeIntervenantEnum} from '../../src/generated/prisma/enums.js'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {interventionsService} = await import('../../src/services/interventions.service.js')

const baseIntervention = {
    id: 1,
    idIntervenant: 'i1',
    idChantier: 'c1',
    dateAssignation: new Date('2026-05-29'),
    description: '["Fiche Accueil"]',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    intervenant: {id: 'i1', fullName: 'Jane Doe', typeIntervenant: TypeIntervenantEnum.CompagnonResponsable},
    chantier: {id: 'c1', name: 'Chantier A'},
}

beforeEach(resetPrismaMock)

describe('interventionsService.findAll (sort fallback + filters)', () => {
    it('defaults to dateAssignation desc on unknown sort field', async () => {
        prismaMock.intervention.count.mockResolvedValueOnce(0)
        prismaMock.intervention.findMany.mockResolvedValueOnce([])
        await interventionsService.findAll({}, 0, 10, 0, {field: 'nope', dir: 'asc'})
        expect(prismaMock.intervention.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {dateAssignation: 'desc'}}))
    })

    it('applies a known sort field', async () => {
        prismaMock.intervention.count.mockResolvedValueOnce(0)
        prismaMock.intervention.findMany.mockResolvedValueOnce([])
        await interventionsService.findAll({}, 0, 10, 0, {field: 'createdAt', dir: 'asc'})
        expect(prismaMock.intervention.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {createdAt: 'asc'}}))
    })

    it('maps rows with nested intervenant/chantier', async () => {
        prismaMock.intervention.count.mockResolvedValueOnce(1)
        prismaMock.intervention.findMany.mockResolvedValueOnce([baseIntervention])
        const page = await interventionsService.findAll({}, 0, 10, 0)
        expect(page.content[0]).toMatchObject({
            id: 1, idIntervenant: 'i1', idChantier: 'c1',
            intervenant: {fullName: 'Jane Doe'}, chantier: {name: 'Chantier A'},
        })
    })

    it('filters by chantier', async () => {
        prismaMock.intervention.count.mockResolvedValueOnce(0)
        prismaMock.intervention.findMany.mockResolvedValueOnce([])
        await interventionsService.findAll({idChantier: 'c1'}, 0, 10, 0)
        expect(prismaMock.intervention.findMany).toHaveBeenCalledWith(expect.objectContaining({where: {idChantier: 'c1'}}))
    })

    it('filters by intervenant', async () => {
        prismaMock.intervention.count.mockResolvedValueOnce(0)
        prismaMock.intervention.findMany.mockResolvedValueOnce([])
        await interventionsService.findAll({idIntervenant: 'i1'}, 0, 10, 0)
        expect(prismaMock.intervention.findMany).toHaveBeenCalledWith(expect.objectContaining({where: {idIntervenant: 'i1'}}))
    })
})

describe('interventionsService.findById', () => {
    it('returns null when missing', async () => {
        prismaMock.intervention.findUnique.mockResolvedValueOnce(null)
        await expect(interventionsService.findById(99)).resolves.toBeNull()
    })

    it('maps when found', async () => {
        prismaMock.intervention.findUnique.mockResolvedValueOnce(baseIntervention)
        await expect(interventionsService.findById(1)).resolves.toMatchObject({id: 1})
    })
})

describe('interventionsService.create', () => {
    it('converts dateAssignation to a Date and defaults description to null', async () => {
        prismaMock.intervention.create.mockResolvedValueOnce(baseIntervention)
        await interventionsService.create({idIntervenant: 'i1', idChantier: 'c1', dateAssignation: '2026-05-29'})
        expect(prismaMock.intervention.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                idIntervenant: 'i1', idChantier: 'c1',
                dateAssignation: new Date('2026-05-29'), description: null,
            }),
        }))
    })

    it('passes the description through and returns the mapped row', async () => {
        prismaMock.intervention.create.mockResolvedValueOnce(baseIntervention)
        const result = await interventionsService.create({
            idIntervenant: 'i1', idChantier: 'c1', dateAssignation: '2026-05-29', description: '["Fiche APR"]',
        })
        expect(prismaMock.intervention.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({description: '["Fiche APR"]'}),
        }))
        expect(result).toMatchObject({id: 1})
    })
})

describe('interventionsService.update', () => {
    it("returns 'NOT_FOUND' on P2025", async () => {
        prismaMock.intervention.update.mockRejectedValueOnce(Object.assign(new Error('x'), {code: 'P2025'}))
        await expect(interventionsService.update(1, {description: '[]'})).resolves.toBe('NOT_FOUND')
    })

    it("returns 'CONFLICT' on other errors", async () => {
        prismaMock.intervention.update.mockRejectedValueOnce(Object.assign(new Error('fk'), {code: 'P2003'}))
        await expect(interventionsService.update(1, {idIntervenant: 'nope'})).resolves.toBe('CONFLICT')
    })

    it('converts dateAssignation when provided and returns the mapped row', async () => {
        prismaMock.intervention.update.mockResolvedValueOnce(baseIntervention)
        await expect(interventionsService.update(1, {dateAssignation: '2026-06-01'})).resolves.toMatchObject({id: 1})
        expect(prismaMock.intervention.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({dateAssignation: new Date('2026-06-01')}),
        }))
    })

    it('leaves dateAssignation undefined when not provided', async () => {
        prismaMock.intervention.update.mockResolvedValueOnce(baseIntervention)
        await interventionsService.update(1, {description: '[]'})
        expect(prismaMock.intervention.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({dateAssignation: undefined}),
        }))
    })
})

describe('interventionsService.delete', () => {
    it('returns true / false', async () => {
        prismaMock.intervention.delete.mockResolvedValueOnce(baseIntervention)
        await expect(interventionsService.delete(1)).resolves.toBe(true)
        prismaMock.intervention.delete.mockRejectedValueOnce(new Error('x'))
        await expect(interventionsService.delete(1)).resolves.toBe(false)
    })
})

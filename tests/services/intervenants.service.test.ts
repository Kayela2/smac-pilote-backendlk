import {beforeEach, describe, expect, it, vi} from 'vitest'
import {IntervenantPole} from '../../src/enums.js'
import {TypeIntervenantEnum} from '../../src/generated/prisma/enums.js'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {intervenantsService} = await import('../../src/services/intervenants.service.js')

const baseInterv = {
    id: 's1', typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: 'Doe', prenom: 'Jane',
    fullName: 'Jane Doe', typePole: IntervenantPole.OPX, numSAP: 4242,
    matricule: null, phone: null, qualification: null,
    mail: null, address: null, idAgence: 1,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
}

beforeEach(resetPrismaMock)

describe('intervenantsService.create', () => {
    it('builds defaults (typePole, numSAP, fullName)', async () => {
        prismaMock.intervenant.create.mockResolvedValueOnce(baseInterv)
        await intervenantsService.create({typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: 'Doe', prenom: 'Jane', idAgence: 1})
        expect(prismaMock.intervenant.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                typePole: '',
                numSAP: 0,
                fullName: 'Jane Doe',
            }),
        })
    })

    it('uses provided values when given', async () => {
        prismaMock.intervenant.create.mockResolvedValueOnce(baseInterv)
        await intervenantsService.create({
            typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: 'Doe', prenom: 'Jane', idAgence: 1,
            typePole: IntervenantPole.OPX, numSAP: 99, fullName: 'Override',
        })
        expect(prismaMock.intervenant.create).toHaveBeenCalledWith({
            data: expect.objectContaining({typePole: IntervenantPole.OPX, numSAP: 99, fullName: 'Override'}),
        })
    })
})

describe('intervenantsService.createMass', () => {
    it('returns null for invalid rows (missing required fields)', async () => {
        prismaMock.intervenant.create.mockResolvedValue(baseInterv)
        const result = await intervenantsService.createMass([
            {typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: 'Doe', prenom: 'Jane', idAgence: 1},
            {typeIntervenant: undefined as never, nom: 'X', prenom: 'Y', idAgence: 1},
            {typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: '', prenom: 'Y', idAgence: 1},
        ])
        expect(result).toEqual([expect.objectContaining({id: 's1'}), null, null])
        expect(prismaMock.intervenant.create).toHaveBeenCalledTimes(1)
    })

    it('catches per-row failures', async () => {
        prismaMock.intervenant.create
            .mockResolvedValueOnce(baseInterv)
            .mockRejectedValueOnce(new Error('dup'))
        const result = await intervenantsService.createMass([
            {typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: 'A', prenom: 'B', idAgence: 1},
            {typeIntervenant: TypeIntervenantEnum.ConducteurTravaux, nom: 'C', prenom: 'D', idAgence: 1},
        ])
        expect(result).toEqual([expect.objectContaining({id: 's1'}), null])
    })
})

describe('intervenantsService.findById', () => {
    it('returns null when not found', async () => {
        prismaMock.intervenant.findUnique.mockResolvedValue(null)
        await expect(intervenantsService.findById('x')).resolves.toBeNull()
    })

    it('maps when found', async () => {
        prismaMock.intervenant.findUnique.mockResolvedValue(baseInterv)
        await expect(intervenantsService.findById('s1')).resolves.toMatchObject({id: 's1'})
    })
})

describe('intervenantsService.findAll (filters)', () => {
    it('builds an empty where with no filters', async () => {
        prismaMock.intervenant.count.mockResolvedValueOnce(0)
        prismaMock.intervenant.findMany.mockResolvedValueOnce([])
        await intervenantsService.findAll({}, 0, 10, 0)
        expect(prismaMock.intervenant.findMany).toHaveBeenCalledWith(expect.objectContaining({where: {}}))
    })

    it('builds a where from numSAP/mail/typePole filters', async () => {
        prismaMock.intervenant.count.mockResolvedValueOnce(0)
        prismaMock.intervenant.findMany.mockResolvedValueOnce([])
        await intervenantsService.findAll({numSAP: 42, mail: 'a@b', typePole: 'OPX'}, 0, 10, 0)
        expect(prismaMock.intervenant.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                numSAP: 42,
                mail: {contains: 'a@b', mode: 'insensitive'},
                typePole: 'OPX',
            },
        }))
    })
})

describe('intervenantsService.update', () => {
    it("returns 'NOT_FOUND' on P2025", async () => {
        prismaMock.intervenant.update.mockRejectedValueOnce(Object.assign(new Error('x'), {code: 'P2025'}))
        await expect(intervenantsService.update('x', {nom: 'X'})).resolves.toBe('NOT_FOUND')
    })

    it("returns 'CONFLICT' on other errors", async () => {
        prismaMock.intervenant.update.mockRejectedValueOnce(Object.assign(new Error('dup'), {code: 'P2002'}))
        await expect(intervenantsService.update('s1', {nom: 'X'})).resolves.toBe('CONFLICT')
    })

    it('returns the mapped intervenant on success', async () => {
        prismaMock.intervenant.update.mockResolvedValueOnce(baseInterv)
        await expect(intervenantsService.update('s1', {nom: 'Doe'})).resolves.toMatchObject({id: 's1'})
    })
})

describe('intervenantsService.findAll (sort fallback)', () => {
    it('uses fullName asc when unknown sort field', async () => {
        prismaMock.intervenant.count.mockResolvedValueOnce(0)
        prismaMock.intervenant.findMany.mockResolvedValueOnce([])
        await intervenantsService.findAll({}, 0, 10, 0, {field: 'nope', dir: 'desc'})
        expect(prismaMock.intervenant.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {fullName: 'asc'}}))
    })

    it('applies a known sort field', async () => {
        prismaMock.intervenant.count.mockResolvedValueOnce(0)
        prismaMock.intervenant.findMany.mockResolvedValueOnce([])
        await intervenantsService.findAll({}, 0, 10, 0, {field: 'numSAP', dir: 'desc'})
        expect(prismaMock.intervenant.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {numSAP: 'desc'}}))
    })
})

describe('intervenantsService.delete', () => {
    it('returns true / false', async () => {
        prismaMock.intervenant.delete.mockResolvedValueOnce(baseInterv)
        await expect(intervenantsService.delete('s1')).resolves.toBe(true)
        prismaMock.intervenant.delete.mockRejectedValueOnce(new Error('x'))
        await expect(intervenantsService.delete('s1')).resolves.toBe(false)
    })
})

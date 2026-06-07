import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {requiredDocsService} = await import('../../src/services/required-docs.service.js')

beforeEach(resetPrismaMock)

describe('requiredDocsService.getKeys', () => {
    it('returns the persisted keys', async () => {
        prismaMock.chantierRequiredDoc.findMany.mockResolvedValueOnce([{docKey: 'A::x'}, {docKey: 'B::y'}])
        await expect(requiredDocsService.getKeys('c1')).resolves.toEqual(['A::x', 'B::y'])
        expect(prismaMock.chantierRequiredDoc.findMany).toHaveBeenCalledWith({
            where: {chantierId: 'c1'}, select: {docKey: true}, orderBy: {docKey: 'asc'},
        })
    })
})

describe('requiredDocsService.setKeys', () => {
    it('replaces the selection (delete all + createMany unique) in a transaction', async () => {
        prismaMock.chantierRequiredDoc.deleteMany.mockResolvedValueOnce({count: 2})
        prismaMock.chantierRequiredDoc.createMany.mockResolvedValueOnce({count: 2})
        const result = await requiredDocsService.setKeys('c1', ['A::x', 'B::y', 'A::x', '', 'B::y'])
        expect(result).toEqual(['A::x', 'B::y'])
        expect(prismaMock.$transaction).toHaveBeenCalledOnce()
        expect(prismaMock.chantierRequiredDoc.deleteMany).toHaveBeenCalledWith({where: {chantierId: 'c1'}})
        expect(prismaMock.chantierRequiredDoc.createMany).toHaveBeenCalledWith({
            data: [{chantierId: 'c1', docKey: 'A::x'}, {chantierId: 'c1', docKey: 'B::y'}],
        })
    })

    it('only deletes when the new selection is empty', async () => {
        prismaMock.chantierRequiredDoc.deleteMany.mockResolvedValueOnce({count: 3})
        const result = await requiredDocsService.setKeys('c1', [])
        expect(result).toEqual([])
        expect(prismaMock.chantierRequiredDoc.deleteMany).toHaveBeenCalledWith({where: {chantierId: 'c1'}})
        expect(prismaMock.chantierRequiredDoc.createMany).not.toHaveBeenCalled()
    })
})

import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {sharedDocsService} = await import('../../src/services/shared-docs.service.js')

beforeEach(resetPrismaMock)

describe('sharedDocsService.getKeys', () => {
    it('returns the persisted keys', async () => {
        prismaMock.chantierSharedDoc.findMany.mockResolvedValueOnce([{docKey: 'A::x'}, {docKey: 'B::y'}])
        await expect(sharedDocsService.getKeys('c1')).resolves.toEqual(['A::x', 'B::y'])
        expect(prismaMock.chantierSharedDoc.findMany).toHaveBeenCalledWith({
            where: {chantierId: 'c1'}, select: {docKey: true}, orderBy: {docKey: 'asc'},
        })
    })
})

describe('sharedDocsService.setKeys', () => {
    it('replaces the selection (delete all + createMany unique) in a transaction', async () => {
        prismaMock.chantierSharedDoc.deleteMany.mockResolvedValueOnce({count: 1})
        prismaMock.chantierSharedDoc.createMany.mockResolvedValueOnce({count: 2})
        const result = await sharedDocsService.setKeys('c1', ['A::x', 'B::y', 'A::x', '', 'B::y'])
        expect(result).toEqual(['A::x', 'B::y'])
        expect(prismaMock.$transaction).toHaveBeenCalledOnce()
        expect(prismaMock.chantierSharedDoc.deleteMany).toHaveBeenCalledWith({where: {chantierId: 'c1'}})
        expect(prismaMock.chantierSharedDoc.createMany).toHaveBeenCalledWith({
            data: [{chantierId: 'c1', docKey: 'A::x'}, {chantierId: 'c1', docKey: 'B::y'}],
        })
    })

    it('only deletes when the new selection is empty', async () => {
        prismaMock.chantierSharedDoc.deleteMany.mockResolvedValueOnce({count: 2})
        const result = await sharedDocsService.setKeys('c1', [])
        expect(result).toEqual([])
        expect(prismaMock.chantierSharedDoc.deleteMany).toHaveBeenCalledWith({where: {chantierId: 'c1'}})
        expect(prismaMock.chantierSharedDoc.createMany).not.toHaveBeenCalled()
    })
})

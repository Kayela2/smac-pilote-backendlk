import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Motif} from '../../src/enums.js'

const fsMock = {
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn(() => [] as string[]),
    statSync: vi.fn(() => ({isFile: () => true})),
}

vi.mock('fs', () => ({default: fsMock, ...fsMock}))

const {fileStorageService} = await import('../../src/services/file-storage.service.js')

beforeEach(() => {
    for (const fn of Object.values(fsMock)) (fn as ReturnType<typeof vi.fn>).mockReset?.()
    fsMock.readdirSync.mockReturnValue([] as never)
    fsMock.statSync.mockReturnValue({isFile: () => true} as never)
})

describe('fileStorageService.storeFile', () => {
    it('rejects unsupported extensions', () => {
        const result = fileStorageService.storeFile(
            {buffer: Buffer.from('x'), originalName: 'a.exe'},
            'c1',
            Motif.TRANSFERT_AFFAIRE,
        )
        expect(result).toMatch(/File type not accepted/)
        expect(fsMock.writeFileSync).not.toHaveBeenCalled()
    })

    it('rejects invalid motifs', () => {
        const result = fileStorageService.storeFile(
            {buffer: Buffer.from('x'), originalName: 'a.pdf'},
            'c1',
            'not-a-motif' as never,
        )
        expect(result).toMatch(/Invalid motif/)
    })

    it('writes a uniquely numbered file when accepted', () => {
        fsMock.readdirSync.mockReturnValueOnce(['existing.pdf'] as never)
        fsMock.statSync.mockReturnValue({isFile: () => true} as never)
        const result = fileStorageService.storeFile(
            {buffer: Buffer.from('hi'), originalName: 'My Doc!.pdf'},
            'c1',
            Motif.TRANSFERT_AFFAIRE,
        )
        expect(typeof result).toBe('object')
        if (typeof result === 'object') {
            expect(result.path).toMatch(/transfert-affaire.*My_Doc_-2\.pdf$/)
            expect(result.url).toMatch(/\/uploads\/c1\//)
        }
        expect(fsMock.writeFileSync).toHaveBeenCalledOnce()
    })

    it('returns an error string when fs throws', () => {
        fsMock.mkdirSync.mockImplementationOnce(() => { throw new Error('boom') })
        const result = fileStorageService.storeFile(
            {buffer: Buffer.from('hi'), originalName: 'a.pdf'},
            'c1',
            Motif.TRANSFERT_AFFAIRE,
        )
        expect(result).toMatch(/Could not store file/)
    })
})

describe('fileStorageService.storeFiles', () => {
    it('delegates to storeFile for each entry', () => {
        const spy = vi.spyOn(fileStorageService, 'storeFile').mockReturnValue('err')
        const out = fileStorageService.storeFiles(
            [
                {buffer: Buffer.from('a'), originalName: 'a.pdf'},
                {buffer: Buffer.from('b'), originalName: 'b.pdf'},
            ],
            'c1',
            Motif.TRANSFERT_AFFAIRE,
        )
        expect(spy).toHaveBeenCalledTimes(2)
        expect(out).toEqual(['err', 'err'])
        spy.mockRestore()
    })
})

describe('fileStorageService.init', () => {
    it('creates the upload directory', () => {
        fileStorageService.init()
        expect(fsMock.mkdirSync).toHaveBeenCalled()
    })

    it('throws when mkdir fails', () => {
        fsMock.mkdirSync.mockImplementationOnce(() => { throw new Error('eperm') })
        expect(() => fileStorageService.init()).toThrow(/Could not create upload directory/)
    })
})

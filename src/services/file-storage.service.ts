import path from 'path'
import { Readable } from 'node:stream'
import { BlobServiceClient } from '@azure/storage-blob'
import { config } from '../config.js'
import { StoreResult } from '../types.js'
import { DocumentExtension, Motif } from '../enums.js'

const ALLOWED_DOCUMENT_EXTENSIONS = new Set(Object.values(DocumentExtension))
const VALID_MOTIFS = new Set(Object.values(Motif))

function sanitizeFileName(fileName: string): string {
    let clean = fileName.replace(/[^a-zA-Z0-9.\-]/g, '_')
    clean = clean.replace(/\.+/g, '.')
    if (clean.startsWith('.')) clean = `file${clean}`
    return clean.length > 255 ? clean.substring(0, 255) : clean
}

function getExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > -1 ? fileName.substring(lastDot + 1) : ''
}

function getMimeType(ext: string): string {
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    return map[ext] ?? 'application/octet-stream'
}

function getContainerClient() {
    if (!config.azureStorage.connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING non configurée')
    }
    return BlobServiceClient
        .fromConnectionString(config.azureStorage.connectionString)
        .getContainerClient(config.azureStorage.containerName)
}

export const fileStorageService = {
    async init(): Promise<void> {
        if (!config.azureStorage.connectionString) {
            console.warn('[FileStorage] Azure Storage non configuré — upload de fichiers désactivé')
            return
        }
        await getContainerClient().createIfNotExists()
    },

    async storeFile(file: { buffer: Buffer; originalName: string }, chantierId: string, motif: Motif): Promise<StoreResult> {
        try {
            const sanitized = sanitizeFileName(path.basename(file.originalName))
            const extension = getExtension(sanitized).toLowerCase()

            if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension as DocumentExtension)) {
                return `File type not accepted :: Provided file type: [.${extension}] :: Accepted file types: [.doc][.docx][.pdf]`
            }
            if (!VALID_MOTIFS.has(motif)) {
                return `Invalid motif :: Provided mode: [${motif}]`
            }

            const baseName = sanitized.substring(0, sanitized.lastIndexOf('.')) || sanitized
            const blobName = `${chantierId}/${motif}/${baseName}-${Date.now()}.${extension}`

            const blobClient = getContainerClient().getBlockBlobClient(blobName)
            await blobClient.upload(file.buffer, file.buffer.length, {
                blobHTTPHeaders: { blobContentType: getMimeType(extension) },
            })

            return { path: blobName, url: blobClient.url }
        } catch (e) {
            console.error(`Could not store file ${file.originalName}:`, e)
            return `Could not store file ${file.originalName}`
        }
    },

    async storeFiles(files: Array<{ buffer: Buffer; originalName: string }>, chantierId: string, motif: Motif): Promise<StoreResult[]> {
        return Promise.all(files.map(f => fileStorageService.storeFile(f, chantierId, motif)))
    },

    async deleteFile(blobName: string): Promise<void> {
        try {
            await getContainerClient().getBlockBlobClient(blobName).deleteIfExists()
        } catch (e) {
            console.error(`Could not delete blob ${blobName}:`, e)
        }
    },

    /** Upload d'un buffer avec un chemin Azure prédéfini (ex: versioning PV). */
    async storeBlob(buffer: Buffer, blobPath: string, mimeType: string): Promise<string> {
        const blobClient = getContainerClient().getBlockBlobClient(blobPath)
        await blobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: mimeType },
        })
        return blobPath
    },

    async getDownloadStream(blobName: string): Promise<Readable | null> {
        try {
            const response = await getContainerClient().getBlockBlobClient(blobName).download()
            return response.readableStreamBody ? Readable.from(response.readableStreamBody) : null
        } catch {
            return null
        }
    },
}

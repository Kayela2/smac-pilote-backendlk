/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import {
    DocumentExtension,
    MarketType,
    MessageType,
    Motif,
    ProcessStatus,
    ChantierTechnicity,
    ChantierType,
    Role,
    IntervenantPole
} from './enums.js'
import {ChantierDocumentationStatus, TypeDocEnum, TypeFiche, TypeIntervenantEnum} from "./generated/prisma/enums.js";
import {Intervenant} from "./generated/prisma/client.js";

export type {MessageType}

/** Shared response / DTO types */

export type ApiResponse<T = unknown> = {
    data: T
    message: string
    type: MessageType
}

export type UserProfile = {
    role: Role
    matricule: number
    lastName: string
    firstName: string
    profilePicture: string | null
    agence: { id: string; codeAgence: string; nomAgence: string } | null
    etablissement: { id: string; adresse1: string; codeSap: string | null } | null
}

/** Paginated list — same shape the React frontend expects */
export type Page<T> = {
    content: T[],
    totalElements: number,
    totalPages: number,
    size: number,
    page: number
}

// ── Request DTOs ────────────────────────────────────────────────────────────

export type AuthenticateRequest = {
    login: string | number
    password: string
}

export type RegisterRequest = {
    matricule?: number
    firstName?: string
    lastName?: string
    password?: string
    role?: Role
}

export type UpdateProfileRequest = {
    firstName?: string
    lastName?: string
    role?: Role
}

export type UpdatePasswordRequest = {
    oldPassword: string
    newPassword: string
}

export type CreateChantierRequest = {
    codeOTP: number
    name?: string
    team?: string
    client?: string
    address?: string
    progress?: number
    status?: ProcessStatus
}

export type UpdateChantierRequest = {
    name?: string
    team?: string
    address?: string
    progress?: number
    status?: ProcessStatus
}

export type UpdateChantierDetailsRequest = {
    client?: string
    finalClient?: string
    address?: string
    contact?: string
    responsible?: string
    architecturalDesign?: string
    startDate?: string
    expectedEndDate?: string
    offerSubmissionDate?: string
    responseDeadline?: string
    targetDateSMACWork?: string
    marketType?: MarketType
    chantierType?: ChantierType
    siteVisit?: boolean
    clusterQuote?: string
    needDelegatedAuthority?: boolean
    technicity?: keyof typeof ChantierTechnicity
    linkToAo?: string
    technicalDescription?: string
}

export type CreateIntervenantRequest = {
    typeIntervenant: TypeIntervenantEnum
    nom: string
    prenom: string
    idAgence: string
    typePole?: IntervenantPole
    numSAP?: number
    fullName?: string
    matricule?: string
    qualification?: string
    mail?: string
    phone?: string
    address?: string
}

export type UpdateIntervenantRequest = {
    typePole?: IntervenantPole
    typeIntervenant?: TypeIntervenantEnum
    nom?: string
    prenom?: string
    fullName?: string
    matricule?: string
    qualification?: string
    mail?: string
    phone?: string
    address?: string
}

export type CreateFicheRequest = {
    code: string
    name: string
    type: TypeFiche
}

export type UpdateFicheRequest = {
    code?: string
    name?: string
    type?: TypeFiche
}

export type CreateFolderRequest = {
    name: string
    parentId?: string | null
}

export type UpdateFolderRequest = {
    name?: string
    parentId?: string | null
}

export type CreateInterventionRequest = {
    idIntervenant: string
    idChantier: string
    typeDoc: TypeDocEnum
    dateAssignation: string
    description?: string
}

export type UpdateInterventionRequest = {
    idIntervenant?: string
    idChantier?: string
    dateAssignation?: string
    description?: string
    status?: string
}

export type PvConformite = 'conforme' | 'non-conforme' | 'SO'

export type CreatePvEtancheiteRequest = {
    idChantier: string
    zoneBatiment: string
    dateInspection: string
    responsableChantier: string
    planReperage: 'oui' | 'non'
    natureTravaux: 'etancheite-beton' | 'autre-support'
    regulariteSupport: PvConformite
    propreteSupport: PvConformite
    pente: PvConformite
    hauteurEngravure: PvConformite
    profondeurEngravure: PvConformite
    protectionTeteReleves: PvConformite
    propreteSupportReleves: PvConformite
    tremiesLanterneaux: PvConformite
    eauxPluviales: PvConformite
    ventilation: PvConformite
    tropPleins: PvConformite
    jointsDialatation: PvConformite
    autresEcartsObservations?: string
    nomSmac: string
    signatureSmac: unknown
    status: ProcessStatus
    receptionAcceptee: boolean
    miseEnConformiteLe: string
    envoyerEmail: boolean
    emailDestinataire?: string
    participants?: Array<{titre?: string; nom: string; signature: unknown}>
    reserves?: Array<{localisation?: string; details: string; images?: unknown[]}>
}

export type UpdatePvEtancheiteRequest = Partial<Omit<CreatePvEtancheiteRequest, 'idChantier'>>

export type CreateActionRequest = {
    idChantier: string
    anomalyRef?: string
    correctiveAction?: string
    responsible?: string
    startDate?: string
    dueDate?: string
    status?: ProcessStatus
}

export type UpdateActionRequest = {
    idChantier?: string
    anomalyRef?: string
    correctiveAction?: string
    responsible?: string
    dueDate?: string
    status?: ProcessStatus
}

export type UserWithRelations = {
    id: string;
    matricule: number;
    role: Role;
    person: {
        lastName: string;
        firstName: string | null;
        etablissement: {
            id: string;
            adresse1: string;
            codeSap: string | null;
            agence: { id: string; codeAgence: string; nomAgence: string } | null;
        } | null;
    } | null;
    photo: { profilePicture: string | null } | null
}

export type MappedAction = {
    id: string
    chantier: {id: string; name: string | null; codeOTP: number}
    anomalyRef: string | null
    correctiveAction: string | null
    responsible: {id: string; fullName: string}
    startDate: Date | null
    dueDate: Date | null
    status: ProcessStatus
    progress: number | null
    childIndex: number | null
    children: MappedAction[] | null
    previous: MappedAction[] | null
    createdAt: Date
    updatedAt: Date
}

export type File = { buffer: Buffer; originalName: string }
export type StoredFile = { path: string; url: string }
export type StoreResult = StoredFile | string  // string = error message

export type MappedDocumentation = {
    id: string
    chantierId: string
    folderId: string | null
    status: ChantierDocumentationStatus
    motif: Motif
    path: string
    fileName: string
    fileNameWithExtension: string
    author: UserWithRelations
    type: DocumentExtension
    size: number
    version: number | null
    validateur: string | null
    commentaire: string | null
    createdAt: Date
    updatedAt: Date
}

export type CreateDocumentationRequest = {
    motif: Motif
}

export type CreateDossierExpertiseRequest = {
    idChantier: string
    typeGarantie: 'gpa' | 'decennale'
    objet: string
    expertDesigne?: string
    avocatSmac?: string
    dateOuverture: string
    juridiction?: string
    dateAssignation?: string
    demandeur?: string
    defendeurs?: string
    griefs?: string
}

export type UpdateDossierExpertiseRequest = {
    typeGarantie?: 'gpa' | 'decennale'
    objet?: string
    expertDesigne?: string
    avocatSmac?: string
    dateOuverture?: string
    juridiction?: string
    dateAssignation?: string
    demandeur?: string
    defendeurs?: string
    griefs?: string
    statut?: 'en_cours' | 'cloture'
}
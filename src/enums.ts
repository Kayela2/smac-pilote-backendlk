/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

export enum MarketType {
    PUBLIC = "Public",
    PRIVATE = "Private",
}

export enum ChantierType {
    NEW = "Neuf",
    REFURBISHED = "Refection",
}

export enum ProcessStatus {
    PLANNED = "Planifié",
    INITIALIZED = "Initialisé",
    IN_PROGRESS = "En cours",
    PENDING = "En attente",
    NOT_STARTED = "Pas commencé",
    COMPLETE = "Terminé",
    CANCELED = "Annulé",
    ACCEPTED = "Accepté",
    REFUSED = "Refusé",
}

export enum ImageExtension {
    PNG = "png",
    JPG = "jpg",
    JPEG = "jpeg",
    WEBP = "webp",
}

export enum ChantierTechnicity {
    BASSE = 0,
    MOYENNE = 1,
    HAUTE = 2,
}

export enum DocumentExtension {
    DOC = "doc",
    PDF = "pdf",
    DOCX = "docx",
}

export enum Gender {
    MALE = "M",
    FEMALE = "F",
}

export enum IntervenantPole {
    BUREAU_DE_CONTROLE = "BUREAU DE CONTRÔLE",
    OPX = "OPX",
    COORDINATEUR = "COORDINATEUR",
    DESTINATAIRE = "DESTINATAIRE",
    MOE_EXE = "MOE EXE",
    ENTREPRISE_GENERALE = "ENTREPRISE GENERALE",
    BE_ETUDES = "BE ETUDES",
    ECONOMISTE = "ECONOMISTE",
}

export enum MessageType {
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    WARNING = "WARNING",
    INFO = "INFO",
}

/*export enum ChantierDocumentationStatus {
    ToDeposit = "À Déposer",
    Deposited = "Déposé",
    InProgress = "En cours",
    Archived = "Archivé"
}*/

export enum Motif {
    TRANSFERT_AFFAIRE = "transfert-affaire",
    ETUDE_EXECUTION = "etude-execution",
    DOCUMENT_ETUDE = "document-etude",
    SUIVI_VISA = "suivi-visa",
    VISA = "visa",
    BTE_OBJECTIF = "bte-objectif",
    BTE_VERSION = "bte-version",
    DOCUMENTAIRE_LANCEMENT = "documentaire-lancement",
    DOCUMENT_LANCEMENT = "document-lancement",
    EXECUTION = "execution",
    DOCUMENT_RECEPTION = "document-reception",
    CLOTURE_AFFAIRE = "cloture-affaire",
    FINANCIAL_MONITORING = "financial-monitoring",
    FINANCIAL_MONITORING_CAUTION = "financial-monitoring/caution",
    FINANCIAL_MONITORING_FACTURATION = "financial-monitoring/facturation",
    GUARANTEE_GPA = "guarantee-gpa",
    GUARANTEE_DECENNALE = "guarantee-decennale"
}

export enum Permission {
    ADMIN_SUDO_READ = "admin.sudo::read",
    ADMIN_SUDO_CREATE = "admin.sudo::create",
    ADMIN_SUDO_UPDATE = "admin.sudo::update",
    ADMIN_SUDO_DELETE = "admin.sudo::delete",
    ADMIN_SUDO_PATCH = "admin.sudo::patch",
    ADMIN_SUDO_OPTIONS = "admin.sudo::options",
    ADMIN_SUDO_TRACE = "admin.sudo::trace",

    ADMIN_READ = "admin::read",
    ADMIN_CREATE = "admin::create",
    ADMIN_UPDATE = "admin::update",
    ADMIN_DELETE = "admin::delete",
    ADMIN_PATCH = "admin::patch",
    ADMIN_OPTIONS = "admin::options",
    ADMIN_TRACE = "admin::trace",

    MANAGER_USERS_READ = "manager.users::read",
    MANAGER_USERS_CREATE = "manager.users::create",
    MANAGER_USERS_UPDATE = "manager.users::update",
    MANAGER_USERS_DELETE = "manager.users::delete",
    MANAGER_USERS_PATCH = "manager.users::patch",
    MANAGER_USERS_OPTIONS = "manager.users::options",
    MANAGER_USERS_TRACE = "manager.users::trace",

    MANAGER_SECURITY_READ = "manager.security::read",
    MANAGER_SECURITY_CREATE = "manager.security::create",
    MANAGER_SECURITY_UPDATE = "manager.security::update",
    MANAGER_SECURITY_DELETE = "manager.security::delete",
    MANAGER_SECURITY_PATCH = "manager.security::patch",
    MANAGER_SECURITY_OPTIONS = "manager.security::options",
    MANAGER_SECURITY_TRACE = "manager.security::trace",

    USER_READ = "user::read",
    USER_CREATE = "user::create",
    USER_UPDATE = "user::update",
    USER_DELETE = "user::delete",
    USER_PATCH = "user::patch",
    USER_OPTIONS = "user::options",
    USER_TRACE = "user::trace",
}

export const RolePermissions: Record<string, Permission[]> = {
    ADMIN_SUDO: [
        Permission.ADMIN_SUDO_READ,
        Permission.ADMIN_SUDO_CREATE,
        Permission.ADMIN_SUDO_UPDATE,
        Permission.ADMIN_SUDO_DELETE,
        Permission.ADMIN_SUDO_PATCH,
        Permission.ADMIN_SUDO_OPTIONS,
        Permission.ADMIN_SUDO_TRACE,
    ],
    ADMIN: [
        Permission.ADMIN_READ,
        Permission.ADMIN_CREATE,
        Permission.ADMIN_UPDATE,
        Permission.ADMIN_DELETE,
        Permission.ADMIN_PATCH,
        Permission.ADMIN_OPTIONS,
        Permission.ADMIN_TRACE,
    ],
    MANAGER_USERS: [
        Permission.MANAGER_USERS_READ,
        Permission.MANAGER_USERS_CREATE,
        Permission.MANAGER_USERS_UPDATE,
        Permission.MANAGER_USERS_DELETE,
        Permission.MANAGER_USERS_PATCH,
        Permission.MANAGER_USERS_OPTIONS,
        Permission.MANAGER_USERS_TRACE,
    ],
    MANAGER_SECURITY: [
        Permission.MANAGER_SECURITY_READ,
        Permission.MANAGER_SECURITY_CREATE,
        Permission.MANAGER_SECURITY_UPDATE,
        Permission.MANAGER_SECURITY_DELETE,
        Permission.MANAGER_SECURITY_PATCH,
        Permission.MANAGER_SECURITY_OPTIONS,
        Permission.MANAGER_SECURITY_TRACE,
    ],
    USER: [
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_PATCH,
        Permission.USER_OPTIONS,
        Permission.USER_TRACE,
    ],
};

export enum Role {
    ADMIN_SUDO = "ADMIN_SUDO",
    ADMIN = "ADMIN",
    MANAGER_USERS = "MANAGER_USERS",
    MANAGER_SECURITY = "MANAGER_SECURITY",
    USER = "USER",
}

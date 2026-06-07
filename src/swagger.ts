/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import swaggerJsdoc from 'swagger-jsdoc'
import {DocumentExtension, Motif, ProcessStatus, Role, IntervenantPole} from './enums.js'

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'SMAC-PILOTE API',
            version: '1.0.0',
            description: 'REST API for SMAC-PILOTE — chantier management platform.',
            contact: {name: 'Bruno NDUWARUGIRA', url: 'https://github.com/nduwarugirabruno'},
        },
        servers: [{url: '/api/v1', description: 'Current server'}],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'jwtToken',
                },
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                // ── Generic ──────────────────────────────────────────────────
                ApiResponse: {
                    type: 'object',
                    properties: {
                        data: {},
                        message: {type: 'string'},
                        type: {type: 'string', enum: ['SUCCESS', 'ERROR', 'WARNING', 'INFO']},
                    },
                },
                Page: {
                    type: 'object',
                    properties: {
                        content: {type: 'array', items: {}},
                        totalElements: {type: 'integer'},
                        totalPages: {type: 'integer'},
                        size: {type: 'integer'},
                        page: {type: 'integer'},
                    },
                },
                // ── Auth ─────────────────────────────────────────────────────
                AuthRequest: {
                    type: 'object',
                    required: ['login', 'password'],
                    properties: {
                        login: {type: 'string', example: '10001'},
                        password: {type: 'string', example: 'pass01'},
                    },
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['matricule', 'firstName', 'lastName', 'password'],
                    properties: {
                        matricule: {type: 'integer', example: 10006},
                        firstName: {type: 'string', example: 'Jean'},
                        lastName: {type: 'string', example: 'Dupont'},
                        password: {type: 'string', example: 'secret'},
                        role: {type: 'string', enum: Object.values(Role), example: Role.USER},
                    },
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        role: {type: 'string', enum: Object.values(Role)},
                        matricule: {type: 'integer'},
                        lastName: {type: 'string'},
                        firstName: {type: 'string'},
                        profilePicture: {type: 'string', nullable: true},
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        token: {type: 'string'},
                        refreshToken: {type: 'string'},
                        user: {$ref: '#/components/schemas/UserProfile'},
                    },
                },
                // ── Chantier ───────────────────────────────────────────────────
                Chantier: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', format: 'uuid'},
                        codeOTP: {type: 'integer'},
                        name: {type: 'string', nullable: true},
                        team: {type: 'string', nullable: true},
                        client: {type: 'string', nullable: true},
                        address: {type: 'string', nullable: true},
                        progress: {type: 'number'},
                        status: {type: 'string', enum: Object.values(ProcessStatus)},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                    },
                },
                CreateChantierRequest: {
                    type: 'object',
                    required: ['codeOTP'],
                    properties: {
                        codeOTP: {type: 'integer', example: 201},
                        name: {type: 'string', example: 'Projet Alpha'},
                        team: {type: 'string', example: 'Team A'},
                        client: {type: 'string'},
                        address: {type: 'string'},
                        progress: {type: 'number', example: 0},
                        status: {type: 'string', enum: Object.values(ProcessStatus)},
                    },
                },
                // ── Intervenant ───────────────────────────────────────────────
                Intervenant: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', format: 'uuid'},
                        typePole: {type: 'string', enum: Object.values(IntervenantPole)},
                        numSAP: {type: 'integer'},
                        fullName: {type: 'string'},
                        mail: {type: 'string', nullable: true},
                        phone: {type: 'string', nullable: true},
                        address: {type: 'string', nullable: true},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                    },
                },
                CreateIntervenantRequest: {
                    type: 'object',
                    required: ['typePole', 'numSAP', 'fullName'],
                    properties: {
                        typePole: {type: 'string', enum: Object.values(IntervenantPole)},
                        numSAP: {type: 'integer', example: 200001},
                        fullName: {type: 'string', example: 'Alice Martin'},
                        mail: {type: 'string'},
                        phone: {type: 'string'},
                        address: {type: 'string'},
                    },
                },
                // ── Action ──────────────────────────────────────────────────────
                Action: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', format: 'uuid'},
                        site: {type: 'string', nullable: true},
                        anomalyRef: {type: 'string', nullable: true},
                        correctiveAction: {type: 'string', nullable: true},
                        responsible: {type: 'string'},
                        startDate: {type: 'string', format: 'date-time', nullable: true},
                        dueDate: {type: 'string', format: 'date-time', nullable: true},
                        status: {type: 'string', enum: Object.values(ProcessStatus)},
                        progress: {type: 'integer', nullable: true},
                        childIndex: {type: 'integer', nullable: true},
                        children: {type: 'array', items: {$ref: '#/components/schemas/Action'}, nullable: true},
                        previous: {type: 'array', items: {$ref: '#/components/schemas/Action'}, nullable: true},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                    },
                },
                CreateActionRequest: {
                    type: 'object',
                    required: ['responsible'],
                    properties: {
                        site: {type: 'string'},
                        anomalyRef: {type: 'string'},
                        correctiveAction: {type: 'string'},
                        responsible: {type: 'string', example: 'Jean Dupont'},
                        startDate: {type: 'string', format: 'date-time'},
                        dueDate: {type: 'string', format: 'date-time'},
                        status: {type: 'string', enum: Object.values(ProcessStatus)},
                    },
                },
                // ── Documentation ─────────────────────────────────────────────
                ChantierDocumentation: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', format: 'uuid'},
                        chantierId: {type: 'string', format: 'uuid'},
                        motif: {type: 'string', enum: Object.values(Motif)},
                        path: {type: 'string'},
                        fileName: {type: 'string'},
                        fileNameWithExtension: {type: 'string'},
                        type: {type: 'string', enum: Object.values(DocumentExtension)},
                        size: {type: 'integer', description: 'Size in bytes'},
                        author: {$ref: '#/components/schemas/UserProfile'},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                    },
                },
            },
        },
        security: [{cookieAuth: []}, {bearerAuth: []}],
        tags: [
            {name: 'Auth', description: 'Authentication & session'},
            {name: 'Users', description: 'User management'},
            {name: 'Chantiers', description: 'Chantier CRUD & search'},
            {name: 'Actions', description: 'Action management'},
            {name: 'Intervenants', description: 'Intervenant management'},
            {name: 'Documents', description: 'Chantier document uploads'},
            {name: 'Meta', description: 'Server & request metadata'},
        ],
        paths: {
            // ── Auth ──────────────────────────────────────────────────────────
            '/auth/authenticate': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login',
                    requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/AuthRequest'}}}},
                    responses: {
                        200: {description: 'Login successful', content: {'application/json': {schema: {$ref: '#/components/schemas/AuthResponse'}}}},
                        401: {description: 'Invalid credentials'},
                    },
                },
            },
            '/auth/logout': {
                post: {tags: ['Auth'], summary: 'Logout (clears cookie)', responses: {200: {description: 'Logged out'}}},
            },
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register a user',
                    requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/RegisterRequest'}}}},
                    responses: {200: {description: 'Registered'}, 409: {description: 'Already exists'}},
                },
            },
            '/auth/register/mass': {
                post: {
                    tags: ['Auth'],
                    summary: 'Bulk register',
                    requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {$ref: '#/components/schemas/RegisterRequest'}}}}},
                    responses: {200: {description: 'Results array'}},
                },
            },
            '/auth/me': {
                get: {tags: ['Auth'], summary: 'Get authenticated user profile', security: [{cookieAuth: []}, {bearerAuth: []}], responses: {200: {description: 'Profile'}, 401: {description: 'Unauthenticated'}}},
            },
            '/auth/check-token-validity/{token}': {
                get: {
                    tags: ['Auth'], summary: 'Check token validity',
                    parameters: [{in: 'path', name: 'token', required: true, schema: {type: 'string'}}],
                    responses: {200: {description: 'Valid'}, 401: {description: 'Invalid'}},
                },
            },
            // ── Users ─────────────────────────────────────────────────────────
            '/users': {
                get: {tags: ['Users'], summary: 'List users (paginated, filterable)', security: [{cookieAuth: []}], parameters: [{in: 'query', name: 'page', schema: {type: 'integer', default: 0}}, {in: 'query', name: 'size', schema: {type: 'integer', default: 10}}, {in: 'query', name: 'matricule', schema: {type: 'integer'}, description: 'Filter by matricule'}], responses: {200: {description: 'Page of users'}}},
                put: {tags: ['Users'], summary: 'Update own profile', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', properties: {firstName: {type: 'string'}, lastName: {type: 'string'}, role: {type: 'string'}}}}}}, responses: {200: {description: 'Updated'}}},
            },
            '/users/me': {
                get: {tags: ['Users'], summary: 'Get own user record', security: [{cookieAuth: []}], responses: {200: {description: 'User'}}},
            },
            '/users/password': {
                put: {tags: ['Users'], summary: 'Change password', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', required: ['oldPassword', 'newPassword'], properties: {oldPassword: {type: 'string'}, newPassword: {type: 'string'}}}}}}, responses: {200: {description: 'Updated'}, 400: {description: 'Wrong current password'}}},
            },
            '/users/{id}': {
                get: {tags: ['Users'], summary: 'Find user by ID', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'User'}, 404: {description: 'Not found'}}},
                delete: {tags: ['Users'], summary: 'Delete user', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Deleted'}}},
            },
            '/users/lock/{id}': {
                patch: {tags: ['Users'], summary: 'Lock user account', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Locked'}}},
            },
            '/users/{id}/photo': {
                get: {tags: ['Users'], summary: 'Get profile picture', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Photo URL'}}},
                post: {tags: ['Users'], summary: 'Upload profile picture', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'multipart/form-data': {schema: {type: 'object', properties: {file: {type: 'string', format: 'binary'}}}}}}, responses: {200: {description: 'Uploaded'}, 406: {description: 'No file or wrong type'}}},
            },
            // ── Chantiers ──────────────────────────────────────────────────────
            '/chantiers': {
                get: {tags: ['Chantiers'], summary: 'List chantiers (paginated, filterable)', security: [{cookieAuth: []}], parameters: [{in: 'query', name: 'page', schema: {type: 'integer', default: 0}}, {in: 'query', name: 'size', schema: {type: 'integer', default: 10}}, {in: 'query', name: 'codeOTP', schema: {type: 'integer'}, description: 'Filter by OTP code'}, {in: 'query', name: 'name', schema: {type: 'string'}, description: 'Filter by name (contains)'}, {in: 'query', name: 'team', schema: {type: 'string'}, description: 'Filter by team'}, {in: 'query', name: 'status', schema: {type: 'string', enum: Object.values(ProcessStatus)}, description: 'Filter by status'}, {in: 'query', name: 'client', schema: {type: 'string'}, description: 'Filter by client (contains)'}, {in: 'query', name: 'progress', schema: {type: 'number'}, description: 'Filter by exact progress (0-100)'}, {in: 'query', name: 'progressFrom', schema: {type: 'number'}, description: 'Progress range lower bound'}, {in: 'query', name: 'progressTo', schema: {type: 'number'}, description: 'Progress range upper bound'}], responses: {200: {description: 'Page of chantiers'}, 406: {description: 'Invalid progress range'}}},
                post: {tags: ['Chantiers'], summary: 'Create chantier', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/CreateChantierRequest'}}}}, responses: {201: {description: 'Created'}, 409: {description: 'Duplicate OTP'}}},
            },
            '/chantiers/mass': {
                post: {tags: ['Chantiers'], summary: 'Bulk create chantiers', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {$ref: '#/components/schemas/CreateChantierRequest'}}}}}, responses: {201: {description: 'Results array'}}},
            },
            '/chantiers/{chantierId}': {
                get: {tags: ['Chantiers'], summary: 'Get chantier by ID', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Chantier'}, 404: {description: 'Not found'}}},
                put: {tags: ['Chantiers'], summary: 'Update chantier', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/CreateChantierRequest'}}}}, responses: {200: {description: 'Updated'}}},
                delete: {tags: ['Chantiers'], summary: 'Delete chantier', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Deleted'}}},
            },
            '/chantiers/{chantierId}/details': {
                put: {tags: ['Chantiers'], summary: 'Upsert chantier details', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object'}}}}, responses: {200: {description: 'Updated'}}},
            },
            '/chantiers/update/{chantierId}/status/{status}': {
                patch: {tags: ['Chantiers'], summary: 'Update chantier status', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'status', required: true, schema: {type: 'string', enum: Object.values(ProcessStatus)}}], responses: {200: {description: 'Updated'}}},
            },
            '/chantiers/{chantierId}/action': {
                post: {tags: ['Chantiers'], summary: 'Add actions to chantier', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {$ref: '#/components/schemas/CreateActionRequest'}}}}}, responses: {201: {description: 'Actions added'}}},
            },
            '/chantiers/{chantierId}/intervenants': {
                get: {tags: ['Chantiers'], summary: 'Get chantier intervenants (paginated)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'query', name: 'page', schema: {type: 'integer', default: 0}}, {in: 'query', name: 'size', schema: {type: 'integer', default: 10}}], responses: {200: {description: 'Page'}}},
            },
            '/chantiers/{chantierId}/intervenants-2': {
                get: {tags: ['Chantiers'], summary: 'Get all chantier intervenants (no pagination)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Array'}}},
            },
            '/chantiers/{chantierId}/intervenants/ids': {
                patch: {tags: ['Chantiers'], summary: 'Link existing intervenants to chantier', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {type: 'string', format: 'uuid'}}}}}, responses: {200: {description: 'Linked'}}},
            },
            '/chantiers/{chantierId}/intervenants/create': {
                patch: {tags: ['Chantiers'], summary: 'Create & link intervenants to chantier', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {$ref: '#/components/schemas/CreateIntervenantRequest'}}}}}, responses: {200: {description: 'Linked'}}},
            },
            // ── Actions ─────────────────────────────────────────────────────────
            '/actions': {
                get: {tags: ['Actions'], summary: 'List actions (paginated, filterable)', security: [{cookieAuth: []}], parameters: [{in: 'query', name: 'page', schema: {type: 'integer', default: 0}}, {in: 'query', name: 'size', schema: {type: 'integer', default: 10}}, {in: 'query', name: 'site', schema: {type: 'string'}, description: 'Filter by site (contains)'}, {in: 'query', name: 'anomalyRef', schema: {type: 'string'}, description: 'Filter by anomaly ref (contains)'}, {in: 'query', name: 'correctiveAction', schema: {type: 'string'}, description: 'Filter by corrective action (contains)'}, {in: 'query', name: 'responsible', schema: {type: 'string'}, description: 'Filter by responsible (contains)'}, {in: 'query', name: 'status', schema: {type: 'string', enum: Object.values(ProcessStatus)}, description: 'Filter by status'}, {in: 'query', name: 'dueDate', schema: {type: 'string', format: 'date'}, description: 'Filter by exact due date'}, {in: 'query', name: 'dueDateAfter', schema: {type: 'string', format: 'date'}, description: 'Due date range start (requires dueDateBefore)'}, {in: 'query', name: 'dueDateBefore', schema: {type: 'string', format: 'date'}, description: 'Due date range end (requires dueDateAfter)'}], responses: {200: {description: 'Page'}, 406: {description: 'Incomplete due-date range'}}},
                post: {tags: ['Actions'], summary: 'Create action', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/CreateActionRequest'}}}}, responses: {201: {description: 'Created'}}},
            },
            '/actions/{id}': {
                get: {tags: ['Actions'], summary: 'Get action by ID (with nested children)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Action'}, 404: {description: 'Not found'}}},
                put: {tags: ['Actions'], summary: 'Update action', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/CreateActionRequest'}}}}, responses: {200: {description: 'Updated'}}},
                delete: {tags: ['Actions'], summary: 'Delete action', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Deleted'}}},
            },
            '/actions/{id}/children': {
                post: {tags: ['Actions'], summary: 'Add child actions', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {$ref: '#/components/schemas/CreateActionRequest'}}}}}, responses: {201: {description: 'Children added'}}},
            },
            // ── Intervenants ──────────────────────────────────────────────────
            '/intervenants': {
                get: {tags: ['Intervenants'], summary: 'List intervenants (paginated, filterable)', security: [{cookieAuth: []}], parameters: [{in: 'query', name: 'page', schema: {type: 'integer', default: 0}}, {in: 'query', name: 'size', schema: {type: 'integer', default: 10}}, {in: 'query', name: 'numSAP', schema: {type: 'integer'}, description: 'Filter by SAP number'}, {in: 'query', name: 'mail', schema: {type: 'string'}, description: 'Filter by mail (contains)'}, {in: 'query', name: 'phone', schema: {type: 'string'}, description: 'Filter by phone (contains)'}, {in: 'query', name: 'fullName', schema: {type: 'string'}, description: 'Filter by full name (contains)'}, {in: 'query', name: 'typePole', schema: {type: 'string'}, description: 'Filter by pole'}, {in: 'query', name: 'address', schema: {type: 'string'}, description: 'Filter by address (contains)'}], responses: {200: {description: 'Page'}}},
                post: {tags: ['Intervenants'], summary: 'Create intervenant', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/CreateIntervenantRequest'}}}}, responses: {201: {description: 'Created'}, 409: {description: 'Duplicate'}}},
            },
            '/intervenants/mass': {
                post: {tags: ['Intervenants'], summary: 'Bulk create intervenants', security: [{cookieAuth: []}], requestBody: {required: true, content: {'application/json': {schema: {type: 'array', items: {$ref: '#/components/schemas/CreateIntervenantRequest'}}}}}, responses: {201: {description: 'Results array'}}},
            },
            '/intervenants/{id}': {
                get: {tags: ['Intervenants'], summary: 'Get by ID', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Intervenant'}}},
                put: {tags: ['Intervenants'], summary: 'Update intervenant', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {$ref: '#/components/schemas/CreateIntervenantRequest'}}}}, responses: {200: {description: 'Updated'}}},
                delete: {tags: ['Intervenants'], summary: 'Delete intervenant', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Deleted'}}},
            },
            // ── Documents ─────────────────────────────────────────────────────
            '/chantiers/{chantierId}/documents': {
                get: {tags: ['Documents'], summary: 'List chantier documents (optionally filtered by motif / folder)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'query', name: 'page', schema: {type: 'integer', default: 0}}, {in: 'query', name: 'size', schema: {type: 'integer', default: 10}}, {in: 'query', name: 'motif', schema: {type: 'string', enum: Object.values(Motif)}, description: 'Filter by motif'}, {in: 'query', name: 'folderId', schema: {type: 'string'}, description: 'Filter by folder; use "root" for unfiled documents'}], responses: {200: {description: 'Page of documents'}, 400: {description: 'Invalid motif'}}},
                post: {tags: ['Documents'], summary: 'Upload a document', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'query', name: 'motif', required: true, schema: {type: 'string', enum: Object.values(Motif)}}], requestBody: {required: true, content: {'multipart/form-data': {schema: {type: 'object', required: ['file'], properties: {file: {type: 'string', format: 'binary'}}}}}}, responses: {201: {description: 'Uploaded', content: {'application/json': {schema: {$ref: '#/components/schemas/ChantierDocumentation'}}}}, 406: {description: 'No file or wrong type'}, 422: {description: 'Storage error'}}},
            },
            '/chantiers/{chantierId}/documents/{id}': {
                get: {tags: ['Documents'], summary: 'Get document by ID', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Document'}, 404: {description: 'Not found'}}},
                delete: {tags: ['Documents'], summary: 'Delete document', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Deleted'}}},
            },
            '/chantiers/{chantierId}/documents/{id}/folder': {
                patch: {tags: ['Documents'], summary: 'Move a document to a folder (folderId null → root)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', properties: {folderId: {type: 'string', format: 'uuid', nullable: true}}}}}}, responses: {200: {description: 'Moved'}, 404: {description: 'Not found'}}},
            },
            // ── Folders ───────────────────────────────────────────────────────
            '/chantiers/{chantierId}/folders': {
                get: {tags: ['Folders'], summary: 'List a chantier\'s folders (flat; client builds the tree)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Folders'}}},
                post: {tags: ['Folders'], summary: 'Create a folder or sub-folder', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', required: ['name'], properties: {name: {type: 'string'}, parentId: {type: 'string', format: 'uuid', nullable: true}}}}}}, responses: {201: {description: 'Created'}, 406: {description: 'Name required'}, 409: {description: 'Invalid parent'}}},
            },
            '/chantiers/{chantierId}/folders/{id}': {
                get: {tags: ['Folders'], summary: 'Get a folder by ID', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Folder'}, 404: {description: 'Not found'}}},
                put: {tags: ['Folders'], summary: 'Rename or move a folder', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', properties: {name: {type: 'string'}, parentId: {type: 'string', format: 'uuid', nullable: true}}}}}}, responses: {200: {description: 'Updated'}, 404: {description: 'Not found'}}},
                delete: {tags: ['Folders'], summary: 'Delete a folder (sub-folders cascade, documents detached)', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}, {in: 'path', name: 'id', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Deleted'}, 404: {description: 'Not found'}}},
            },
            // ── Required documents (Phase 1 obligatoires) ─────────────────────
            '/chantiers/{chantierId}/required-docs': {
                get: {tags: ['Chantiers'], summary: 'List the selected obligatoire-piece keys', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Array of keys'}}},
                put: {tags: ['Chantiers'], summary: 'Replace the obligatoire-piece selection', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', required: ['keys'], properties: {keys: {type: 'array', items: {type: 'string'}}}}}}}, responses: {200: {description: 'Updated keys'}, 406: {description: 'keys must be an array'}}},
            },
            '/chantiers/{chantierId}/shared-docs': {
                get: {tags: ['Chantiers'], summary: 'List the document keys shared with collaborators', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], responses: {200: {description: 'Array of keys'}}},
                put: {tags: ['Chantiers'], summary: 'Replace the shared-document selection', security: [{cookieAuth: []}], parameters: [{in: 'path', name: 'chantierId', required: true, schema: {type: 'string', format: 'uuid'}}], requestBody: {required: true, content: {'application/json': {schema: {type: 'object', required: ['keys'], properties: {keys: {type: 'array', items: {type: 'string'}}}}}}}, responses: {200: {description: 'Updated keys'}, 406: {description: 'keys must be an array'}}},
            },
            // ── Meta ──────────────────────────────────────────────────────────
            '/meta-data/client-ip': {
                get: {tags: ['Meta'], summary: 'Get client IP', responses: {200: {description: 'IP address'}}},
            },
            '/meta-data/server-ip': {
                get: {tags: ['Meta'], summary: 'Get server IP', responses: {200: {description: 'IP address'}}},
            },
            '/meta-data/headers': {
                get: {tags: ['Meta'], summary: 'Inspect request headers', responses: {200: {description: 'Headers'}}},
            },
            '/meta-data/log': {
                post: {tags: ['Meta'], summary: 'Log current request to DB', responses: {200: {description: 'Log entry'}}},
            },
        },
    },
    apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)

/*
* Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
*/

/**
 * Database schema
 * Running this drops and recreates every table (destructive).
 */
export const SCHEMA_SQL = `
    DROP TABLE IF EXISTS chantier_documentation CASCADE;
    DROP TABLE IF EXISTS fiches CASCADE;
    DROP TABLE IF EXISTS action_children CASCADE;
    DROP TABLE IF EXISTS action_previous CASCADE;
    DROP TABLE IF EXISTS chantier_intervenants CASCADE;
    DROP TABLE IF EXISTS chantier_actions CASCADE;
    DROP TABLE IF EXISTS request_log CASCADE;
    DROP TABLE IF EXISTS user_photo CASCADE;
    DROP TABLE IF EXISTS action CASCADE;
    DROP TABLE IF EXISTS intervenant CASCADE;
    DROP TABLE IF EXISTS chantier_details CASCADE;
    DROP TABLE IF EXISTS chantier CASCADE;
    DROP TABLE IF EXISTS person CASCADE;
    DROP TABLE IF EXISTS user_table CASCADE;

-- Base user entity
    CREATE TABLE user_table
    (
        id         uuid PRIMARY KEY        DEFAULT gen_random_uuid(),
        matricule  integer UNIQUE NOT NULL,
        password   text           NOT NULL,
        role       text           NOT NULL,
        phone      text,
        enabled    boolean        NOT NULL DEFAULT true,
        locked     boolean        NOT NULL DEFAULT false,
        created_at timestamptz    NOT NULL DEFAULT now(),
        updated_at timestamptz    NOT NULL DEFAULT now()
    );

-- Person extends User via JOINED inheritance
    CREATE TABLE person
    (
        id         uuid PRIMARY KEY REFERENCES user_table (id) ON DELETE CASCADE,
        last_name  text NOT NULL,
        first_name text,
        gender     text
    );

-- Chantier details
    CREATE TABLE chantier_details
    (
        id                       uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
        client                   text,
        final_client             text,
        address                  text,
        contact                  text,
        responsible              text,
        architectural_design     text,
        start_date               timestamp,
        expected_end_date        timestamp,
        offer_submission_date    timestamp,
        response_deadline        time,
        target_date_smac_work    timestamp,
        market_type              text,
        chantier_type            text,
        site_visit               boolean     NOT NULL DEFAULT false,
        cluster_quote            text,
        need_delegated_authority boolean     NOT NULL DEFAULT false,
        technicity               text,
        link_to_ao               text,
        technical_description    text,
        created_at               timestamptz NOT NULL DEFAULT now(),
        updated_at               timestamptz NOT NULL DEFAULT now()
    );

-- Chantier
    CREATE TABLE chantier
    (
        id                  uuid PRIMARY KEY        DEFAULT gen_random_uuid(),
        code_otp            integer UNIQUE NOT NULL,
        name                text UNIQUE,
        team                text,
        client              text,
        address             text,
        progress            numeric(7, 2)  NOT NULL DEFAULT 0,
        status              text           NOT NULL,
        chantier_details_id uuid           REFERENCES chantier_details (id) ON DELETE SET NULL,
        created_at          timestamptz    NOT NULL DEFAULT now(),
        updated_at          timestamptz    NOT NULL DEFAULT now()
    );

-- Intervenant
    CREATE TABLE intervenant
    (
        id         uuid PRIMARY KEY        DEFAULT gen_random_uuid(),
        type_pole  text           NOT NULL,
        num_sap    integer UNIQUE NOT NULL,
        full_name  text           NOT NULL,
        mail       text UNIQUE,
        phone      text UNIQUE,
        address    text,
        created_at timestamptz    NOT NULL DEFAULT now(),
        updated_at timestamptz    NOT NULL DEFAULT now()
    );

-- Action
    CREATE TABLE action
    (
        id                uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
        site              text,
        anomaly_ref       text,
        corrective_action text,
        responsible       text        NOT NULL,
        start_date        timestamp,
        due_date          timestamp,
        status            text        NOT NULL,
        progress          integer,
        child_index       integer,
        created_at        timestamptz NOT NULL DEFAULT now(),
        updated_at        timestamptz NOT NULL DEFAULT now()
    );

-- Chantier ↔ Action 
    CREATE TABLE chantier_actions
    (
        chantier_id uuid NOT NULL REFERENCES chantier (id) ON DELETE CASCADE,
        actions_id  uuid NOT NULL REFERENCES action (id) ON DELETE CASCADE,
        PRIMARY KEY (chantier_id, actions_id)
    );

-- Chantier ↔ Intervenant 
    CREATE TABLE chantier_intervenants
    (
        chantier_id     uuid NOT NULL REFERENCES chantier (id) ON DELETE CASCADE,
        intervenants_id uuid NOT NULL REFERENCES intervenant (id) ON DELETE CASCADE,
        PRIMARY KEY (chantier_id, intervenants_id)
    );

-- Action ↔ predecessor actions 
    CREATE TABLE action_previous
    (
        action_id   uuid NOT NULL REFERENCES action (id) ON DELETE CASCADE,
        previous_id uuid NOT NULL REFERENCES action (id) ON DELETE CASCADE,
        PRIMARY KEY (action_id, previous_id)
    );

-- Action ↔ child actions 
    CREATE TABLE action_children
    (
        action_id   uuid NOT NULL REFERENCES action (id) ON DELETE CASCADE,
        children_id uuid NOT NULL REFERENCES action (id) ON DELETE CASCADE,
        PRIMARY KEY (action_id, children_id)
    );

-- User profile picture
    CREATE TABLE user_photo
    (
        id              uuid PRIMARY KEY REFERENCES user_table (id) ON DELETE CASCADE,
        matricule       integer UNIQUE,
        profile_picture text,
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now()
    );

-- HTTP request log
    CREATE TABLE request_log
    (
        id         uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
        client_ip  text,
        method     text,
        uri        text,
        protocol   text,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX ON chantier (status);
    CREATE INDEX ON chantier (team);
    CREATE INDEX ON chantier (client);
    CREATE INDEX ON action (status);
    CREATE INDEX ON action (responsible);
    CREATE INDEX ON intervenant (type_pole);

-- Chantier documentation (documents liés à un projet)
    CREATE TABLE chantier_documentation
    (
        id                       uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
        chantier_id              uuid        NOT NULL REFERENCES chantier (id) ON DELETE CASCADE,
        author_id                uuid        NOT NULL REFERENCES user_table (id),
        motif                    text        NOT NULL,
        path                     text        NOT NULL,
        file_name                text        NOT NULL,
        file_name_with_extension text        NOT NULL,
        type                     text        NOT NULL,
        size                     integer     NOT NULL,
        created_at               timestamptz NOT NULL DEFAULT now(),
        updated_at               timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX ON chantier_documentation (chantier_id);
    CREATE INDEX ON chantier_documentation (motif);

-- Fiches / PV (référentiel des documents affectables aux compagnons)
    CREATE TABLE fiche
    (
        id         uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
        code       text        NOT NULL,
        name       text        NOT NULL,
        type       text        NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX ON fiches (type);
`

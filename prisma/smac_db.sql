-- DropTables
DROP TABLE IF EXISTS "chantier_objectif" CASCADE;
DROP TABLE IF EXISTS "chantier_organisation" CASCADE;
DROP TABLE IF EXISTS "reserve" CASCADE;
DROP TABLE IF EXISTS "document" CASCADE;
DROP TABLE IF EXISTS "participant" CASCADE;
DROP TABLE IF EXISTS "pv_terrasse" CASCADE;
DROP TABLE IF EXISTS "etat_lieux" CASCADE;
DROP TABLE IF EXISTS "feuille_emargement" CASCADE;
DROP TABLE IF EXISTS "fiche_starter" CASCADE;
DROP TABLE IF EXISTS "verif_fourg" CASCADE;
DROP TABLE IF EXISTS "notice_epi" CASCADE;
DROP TABLE IF EXISTS "pv_mise_eau" CASCADE;
DROP TABLE IF EXISTS "pv_recep_beton_charp_couv" CASCADE;
DROP TABLE IF EXISTS "pv_recep_beton_charp_bard" CASCADE;
DROP TABLE IF EXISTS "pv_recep_beton_fac" CASCADE;
DROP TABLE IF EXISTS "pv_recep_charp_met_bois_bard" CASCADE;
DROP TABLE IF EXISTS "pv_recep_charp_met_bois_couv" CASCADE;
DROP TABLE IF EXISTS "pv_recep_etan" CASCADE;
DROP TABLE IF EXISTS "pv_recep_ouv_art" CASCADE;
DROP TABLE IF EXISTS "pv_recep_sup_beton_voir" CASCADE;
DROP TABLE IF EXISTS "pv_recep_ouv_sous_traites" CASCADE;
DROP TABLE IF EXISTS "visite_prev" CASCADE;
DROP TABLE IF EXISTS "verif_journ_echaf" CASCADE;
DROP TABLE IF EXISTS "verif_avant_mise_serv_echaf" CASCADE;
DROP TABLE IF EXISTS "ppsps" CASCADE;
DROP TABLE IF EXISTS "mmt" CASCADE;
DROP TABLE IF EXISTS "fiche_apri" CASCADE;
DROP TABLE IF EXISTS "fiche_pv" CASCADE;
DROP TABLE IF EXISTS "documentation" CASCADE;
DROP TABLE IF EXISTS "fiches" CASCADE;
DROP TABLE IF EXISTS "fiche" CASCADE;
DROP TABLE IF EXISTS "intervention" CASCADE;
DROP TABLE IF EXISTS "action_previous" CASCADE;
DROP TABLE IF EXISTS "action_children" CASCADE;
DROP TABLE IF EXISTS "chantier_actions" CASCADE;
DROP TABLE IF EXISTS "action" CASCADE;
DROP TABLE IF EXISTS "chantier_intervenants" CASCADE;
DROP TABLE IF EXISTS "intervenant" CASCADE;
DROP TABLE IF EXISTS "chantier_required_doc" CASCADE;
DROP TABLE IF EXISTS "chantier_shared_doc" CASCADE;
DROP TABLE IF EXISTS "chantier_documentation" CASCADE;
DROP TABLE IF EXISTS "folder" CASCADE;
DROP TABLE IF EXISTS "chantier" CASCADE;
DROP TABLE IF EXISTS "chantier_details" CASCADE;
DROP TABLE IF EXISTS "ao" CASCADE;
DROP TABLE IF EXISTS "user_photo" CASCADE;
DROP TABLE IF EXISTS "person" CASCADE;
DROP TABLE IF EXISTS "user_table" CASCADE;
DROP TABLE IF EXISTS "etablissement" CASCADE;
DROP TABLE IF EXISTS "agence" CASCADE;
DROP TABLE IF EXISTS "request_log" CASCADE;

-- DropEnums
DROP TYPE IF EXISTS "chantier_documentation_status" CASCADE;
DROP TYPE IF EXISTS "chantier_documentation_motif" CASCADE;
DROP TYPE IF EXISTS "type_intervenant_enum" CASCADE;
DROP TYPE IF EXISTS "type_doc_enum" CASCADE;
DROP TYPE IF EXISTS "statut_ao_enum" CASCADE;
DROP TYPE IF EXISTS "type_fiche" CASCADE;
DROP TYPE IF EXISTS "plan_reperage" CASCADE;
DROP TYPE IF EXISTS "nature_travaux" CASCADE;
DROP TYPE IF EXISTS "conformite_value" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- ============================================================
--  0. EXTENSIONS & TYPES ENUM
-- ============================================================

CREATE TYPE "chantier_documentation_status" AS ENUM ('À Déposer', 'Déposé', 'En cours', 'Archivé');

CREATE TYPE "chantier_documentation_motif" AS ENUM ('transfert-affaire', 'etude-execution', 'document-etude', 'suivi-visa', 'visa', 'bte-objectif', 'bte-version', 'documentaire-lancement', 'document-lancement', 'execution', 'document-reception', 'cloture-affaire', 'financial-monitoring', 'financial-monitoring/caution', 'financial-monitoring/facturation', 'guarantee-gpa', 'guarantee-decennale');

CREATE TYPE "type_intervenant_enum" AS ENUM ('conducteur_travaux', 'compagnon_responsable');

CREATE TYPE "type_doc_enum" AS ENUM (
    'fiche-apri',
    'mmt',
    'ppsps',
    'etat-lieux',
    'feuille-emargement',
    'starter',
    'verif-fourg',
    'notice-epi',
    'pv-mise-eau',
    'pv-recep-beton-charp-couv',
    'pv-recep-beton-charp-bard',
    'pv-recep-beton-fac',
    'pv-recep-charp-met-bois-bard',
    'pv-recep-charp-met-bois-couv',
    'pv-recep-etan',
    'pv-recep-ouv-art',
    'pv-recep-sup-beton-voir',
    'pv-recep-ouv-sous-traites',
    'visite-prev',
    'verif-journ-echaf',
    'verif-avant-mise-serv-echaf',
    'pv-recep-beton-ter'
);

CREATE TYPE "statut_ao_enum" AS ENUM ('en_cours', 'gagne', 'perdu', 'annule');

CREATE TYPE "type_fiche" AS ENUM ('fiche', 'pv');

CREATE TYPE "plan_reperage" AS ENUM ('oui', 'non');

CREATE TYPE "nature_travaux" AS ENUM ('etancheite-beton', 'autre-support');

CREATE TYPE "conformite_value" AS ENUM ('conforme', 'non-conforme', 'SO');

CREATE TABLE "user_table" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "matricule" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "microsoft_id" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_table_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "person" (
    "id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT,
    "gender" TEXT,
    "id_etablissement" UUID,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_photo" (
    "id" UUID NOT NULL,
    "matricule" INTEGER,
    "profile_picture" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chantier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "otp" INTEGER NOT NULL,
    "name" TEXT,
    "description_otp" VARCHAR(255),
    "code_agence_sap" VARCHAR(20),
    "team" TEXT,
    "client" TEXT,
    "address" TEXT,
    "progress" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "chantier_details_id" UUID,
    "matr_responsable" VARCHAR(20),
    "nom_responsable" VARCHAR(150),
    "matr_demandeur" VARCHAR(20),
    "nom_demandeur" VARCHAR(150),
    "adresse_chantier" TEXT,
    "id_client" VARCHAR(20),
    "nom_client" VARCHAR(150),
    "contact_site" VARCHAR(150),
    "date_debut" DATE,
    "facturation_ini" DECIMAL(15,2),
    "autres_depenses_ini" DECIMAL(15,2),
    "materiel_ini" DECIMAL(15,2),
    "fournitures_ini" DECIMAL(15,2),
    "main_oeuvre_ini" DECIMAL(15,2),
    "facturation_vld" DECIMAL(15,2),
    "autres_depenses_vld" DECIMAL(15,2),
    "materiel_vld" DECIMAL(15,2),
    "fournitures_vld" DECIMAL(15,2),
    "main_oeuvre_vld" DECIMAL(15,2),
    "type_projet" VARCHAR(100),
    "segment_neu" VARCHAR(10),
    "segment_ffb" VARCHAR(10),
    "zone_otp" VARCHAR(10),
    "num_devis" VARCHAR(50),
    "date_synchro_sap" TIMESTAMP(6),
    "id_agence" UUID,
    "id_ao" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chantier_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client" TEXT,
    "final_client" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "responsible" TEXT,
    "architectural_design" TEXT,
    "start_date" TIMESTAMP(6),
    "expected_end_date" TIMESTAMP(6),
    "offer_submission_date" TIMESTAMP(6),
    "response_deadline" TIME(6),
    "target_date_smac_work" TIMESTAMP(6),
    "market_type" TEXT,
    "chantier_type" TEXT,
    "site_visit" BOOLEAN NOT NULL DEFAULT false,
    "cluster_quote" TEXT,
    "need_delegated_authority" BOOLEAN NOT NULL DEFAULT false,
    "technicity" TEXT,
    "link_to_ao" TEXT,
    "technical_description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_details_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "intervenant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type_pole" TEXT NOT NULL,
    "num_sap" INTEGER NOT NULL,
    "type_intervenant" "type_intervenant_enum" NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "full_name" TEXT NOT NULL,
    "matricule" VARCHAR(50),
    "telephone" VARCHAR(20),
    "qualification" VARCHAR(100),
    "email" TEXT,
    "id_agence" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,

    CONSTRAINT "intervenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chantier_intervenants" (
    "chantier_id" UUID NOT NULL,
    "intervenants_id" UUID NOT NULL,

    CONSTRAINT "chantier_intervenants_pkey" PRIMARY KEY ("chantier_id","intervenants_id")
);

CREATE TABLE "action" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site" TEXT,
    "anomaly_ref" TEXT,
    "corrective_action" TEXT,
    "idResponsible" UUID NOT NULL,
    "start_date" TIMESTAMP(6),
    "due_date" TIMESTAMP(6),
    "status" TEXT NOT NULL,
    "progress" INTEGER,
    "child_index" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chantier_actions" (
    "chantier_id" UUID NOT NULL,
    "actions_id" UUID NOT NULL,

    CONSTRAINT "chantier_actions_pkey" PRIMARY KEY ("chantier_id","actions_id")
);

CREATE TABLE "action_children" (
    "action_id" UUID NOT NULL,
    "children_id" UUID NOT NULL,

    CONSTRAINT "action_children_pkey" PRIMARY KEY ("action_id","children_id")
);

CREATE TABLE "action_previous" (
    "action_id" UUID NOT NULL,
    "previous_id" UUID NOT NULL,

    CONSTRAINT "action_previous_pkey" PRIMARY KEY ("action_id","previous_id")
);

CREATE TABLE "chantier_documentation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chantier_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "motif" "chantier_documentation_motif" NOT NULL,
    "status" "chantier_documentation_status" NOT NULL,
    "path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_name_with_extension" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "folder_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_documentation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chantier_required_doc" (
    "chantier_id" UUID NOT NULL,
    "doc_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_required_doc_pkey" PRIMARY KEY ("chantier_id","doc_key")
);

CREATE TABLE "chantier_shared_doc" (
    "chantier_id" UUID NOT NULL,
    "doc_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_shared_doc_pkey" PRIMARY KEY ("chantier_id","doc_key")
);

CREATE TABLE "chantier_objectif" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chantier_id" UUID NOT NULL,
    "objectif" TEXT NOT NULL,
    "tache" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_objectif_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chantier_organisation" (
    "chantier_id" UUID NOT NULL,
    "conditions_acces" JSONB NOT NULL DEFAULT '[]',
    "conditions_stockage" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chantier_organisation_pkey" PRIMARY KEY ("chantier_id")
);

CREATE TABLE "folder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "chantier_id" UUID NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "request_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_ip" TEXT,
    "method" TEXT,
    "uri" TEXT,
    "protocol" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agence" (
    "id_agence" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code_agence" VARCHAR(20) NOT NULL,
    "nom_agence" VARCHAR(150) NOT NULL,
    "adresse_responsable" TEXT,
    "adresse_directeur" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agence_pkey" PRIMARY KEY ("id_agence")
);

CREATE TABLE "etablissement" (
    "id_etablissement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "adresse_1" VARCHAR(255) NOT NULL,
    "adresse_2" VARCHAR(255),
    "code_postal" VARCHAR(10),
    "ville" VARCHAR(100),
    "telephone" VARCHAR(20),
    "email" VARCHAR(150),
    "code_sap" VARCHAR(50),
    "id_agence" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etablissement_pkey" PRIMARY KEY ("id_etablissement")
);

CREATE TABLE "ao" (
    "id_ao" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference_ao" VARCHAR(100) NOT NULL,
    "intitule" VARCHAR(255),
    "date_emission" DATE,
    "date_limite" DATE,
    "montant_estime" DECIMAL(15,2),
    "statut" "statut_ao_enum" NOT NULL DEFAULT 'en_cours',
    "id_vecteur" VARCHAR(100),
    "date_synchro" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ao_pkey" PRIMARY KEY ("id_ao")
);

CREATE TABLE "intervention" (
    "id_intervention" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_intervenant" UUID NOT NULL,
    "id_chantier" UUID NOT NULL,
    "id_documentation" UUID NOT NULL,
    "date_assignation" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_pkey" PRIMARY KEY ("id_intervention")
);

CREATE TABLE "fiches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" "type_doc_enum" NOT NULL,
    "name" TEXT NOT NULL,
    "type" "type_fiche" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documentation" (
    "id_documentation" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_chantier" UUID NOT NULL,
    "type_doc" "type_doc_enum" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentation_pkey" PRIMARY KEY ("id_documentation")
);

CREATE TABLE "participant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_documentation" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "signature" JSONB NOT NULL,

    CONSTRAINT "participant_pkey" PRIMARY KEY ("id")
);

-- ── Documentation type tables (Table Per Type) ────────────────────────────────

CREATE TABLE "fiche_apri" (
    "id_fiche_apri" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiche_apri_pkey" PRIMARY KEY ("id_fiche_apri")
);

CREATE TABLE "mmt" (
    "id_mmt" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mmt_pkey" PRIMARY KEY ("id_mmt")
);

CREATE TABLE "ppsps" (
    "id_ppsps" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppsps_pkey" PRIMARY KEY ("id_ppsps")
);

CREATE TABLE "pv_terrasse" (
    "id_pv_terrasse" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_terrasse_pkey" PRIMARY KEY ("id_pv_terrasse")
);

CREATE TABLE "etat_lieux" (
    "id_etat_lieux" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etat_lieux_pkey" PRIMARY KEY ("id_etat_lieux")
);

CREATE TABLE "feuille_emargement" (
    "id_feuille_emargement" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feuille_emargement_pkey" PRIMARY KEY ("id_feuille_emargement")
);

CREATE TABLE "fiche_starter" (
    "id_fiche_starter" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiche_starter_pkey" PRIMARY KEY ("id_fiche_starter")
);

CREATE TABLE "verif_fourg" (
    "id_verif_fourg" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verif_fourg_pkey" PRIMARY KEY ("id_verif_fourg")
);

CREATE TABLE "notice_epi" (
    "id_notice_epi" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_epi_pkey" PRIMARY KEY ("id_notice_epi")
);

CREATE TABLE "pv_mise_eau" (
    "id_pv_mise_eau" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_mise_eau_pkey" PRIMARY KEY ("id_pv_mise_eau")
);

CREATE TABLE "pv_recep_beton_charp_couv" (
    "id_pv_recep_beton_charp_couv" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_beton_charp_couv_pkey" PRIMARY KEY ("id_pv_recep_beton_charp_couv")
);

CREATE TABLE "pv_recep_beton_charp_bard" (
    "id_pv_recep_beton_charp_bard" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_beton_charp_bard_pkey" PRIMARY KEY ("id_pv_recep_beton_charp_bard")
);

CREATE TABLE "pv_recep_beton_fac" (
    "id_pv_recep_beton_fac" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_beton_fac_pkey" PRIMARY KEY ("id_pv_recep_beton_fac")
);

CREATE TABLE "pv_recep_charp_met_bois_bard" (
    "id_pv_recep_charp_met_bois_bard" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_charp_met_bois_bard_pkey" PRIMARY KEY ("id_pv_recep_charp_met_bois_bard")
);

CREATE TABLE "pv_recep_charp_met_bois_couv" (
    "id_pv_metal_bois_couv" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_charp_met_bois_couv_pkey" PRIMARY KEY ("id_pv_metal_bois_couv")
);

CREATE TABLE "pv_recep_etan" (
    "id_pv_recep_etan" UUID NOT NULL,
    "zone_batiment" TEXT NOT NULL,
    "date_inspection" TEXT NOT NULL,
    "responsable_chantier" TEXT NOT NULL,
    "plan_reperage" "plan_reperage" NOT NULL,
    "nature_travaux" "nature_travaux" NOT NULL,
    "regularite_support" "conformite_value" NOT NULL,
    "proprete_support" "conformite_value" NOT NULL,
    "pente" "conformite_value" NOT NULL,
    "hauteur_engravure" "conformite_value" NOT NULL,
    "profondeur_engravure" "conformite_value" NOT NULL,
    "protection_tete_releves" "conformite_value" NOT NULL,
    "proprete_support_releves" "conformite_value" NOT NULL,
    "tremies_lanterneaux" "conformite_value" NOT NULL,
    "eaux_pluviales" "conformite_value" NOT NULL,
    "trop_pleins" "conformite_value" NOT NULL,
    "joints_dialatation" "conformite_value" NOT NULL,
    "autres_ecarts_observations" TEXT,
    "nom_smac" TEXT NOT NULL,
    "signature_smac" JSONB NOT NULL,
    "reception_acceptee" BOOLEAN NOT NULL,
    "date_mise_en_conformite" TIMESTAMP(6) NOT NULL,
    "envoyer_email" BOOLEAN NOT NULL,
    "email_destinataire" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_etan_pkey" PRIMARY KEY ("id_pv_recep_etan")
);

CREATE TABLE "pv_recep_ouv_art" (
    "id_pv_recep_ouv_art" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_ouv_art_pkey" PRIMARY KEY ("id_pv_recep_ouv_art")
);

CREATE TABLE "pv_recep_sup_beton_voir" (
    "id_pv_recep_sup_beton_voir" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_sup_beton_voir_pkey" PRIMARY KEY ("id_pv_recep_sup_beton_voir")
);

CREATE TABLE "pv_recep_ouv_sous_traites" (
    "id_pv_recep_ouv_sous_traites" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_recep_ouv_sous_traites_pkey" PRIMARY KEY ("id_pv_recep_ouv_sous_traites")
);

CREATE TABLE "visite_prev" (
    "id_visite_prev" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visite_prev_pkey" PRIMARY KEY ("id_visite_prev")
);

CREATE TABLE "verif_journ_echaf" (
    "id_verif_journ_echaf" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verif_journ_echaf_pkey" PRIMARY KEY ("id_verif_journ_echaf")
);

CREATE TABLE "verif_avant_mise_serv_echaf" (
    "id_verif_avant_mise_serv_echaf" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verif_avant_mise_serv_echaf_pkey" PRIMARY KEY ("id_verif_avant_mise_serv_echaf")
);

CREATE TABLE "document" (
    "id_document" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_documentation" UUID NOT NULL,
    "url_pdf" TEXT NOT NULL,
    "date_generation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id_document")
);

CREATE TABLE "reserve" (
    "id_reserve" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_documentation" UUID NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "localisation" TEXT,
    "details" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserve_pkey" PRIMARY KEY ("id_reserve")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_table_matricule_key" ON "user_table"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "user_table_email_key" ON "user_table"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_table_microsoft_id_key" ON "user_table"("microsoft_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_photo_matricule_key" ON "user_photo"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "chantier_otp_key" ON "chantier"("otp");

-- CreateIndex
CREATE UNIQUE INDEX "chantier_name_key" ON "chantier"("name");

-- CreateIndex
CREATE INDEX "chantier_client_idx" ON "chantier"("client");

-- CreateIndex
CREATE INDEX "chantier_status_idx" ON "chantier"("status");

-- CreateIndex
CREATE INDEX "chantier_team_idx" ON "chantier"("team");

-- CreateIndex
CREATE UNIQUE INDEX "intervenant_num_sap_key" ON "intervenant"("num_sap");

-- CreateIndex
CREATE UNIQUE INDEX "intervenant_email_key" ON "intervenant"("email");

-- CreateIndex
CREATE INDEX "intervenant_type_pole_idx" ON "intervenant"("type_pole");

-- CreateIndex
CREATE INDEX "intervenant_id_agence_idx" ON "intervenant"("id_agence");

-- CreateIndex
CREATE INDEX "intervenant_type_intervenant_idx" ON "intervenant"("type_intervenant");

-- CreateIndex
CREATE INDEX "intervenant_matricule_idx" ON "intervenant"("matricule");

-- CreateIndex
CREATE INDEX "action_idResponsible_idx" ON "action"("idResponsible");

-- CreateIndex
CREATE INDEX "action_status_idx" ON "action"("status");

-- CreateIndex
CREATE INDEX "chantier_documentation_chantier_id_idx" ON "chantier_documentation"("chantier_id");

-- CreateIndex
CREATE INDEX "chantier_documentation_motif_idx" ON "chantier_documentation"("motif");

-- CreateIndex
CREATE INDEX "chantier_documentation_folder_id_idx" ON "chantier_documentation"("folder_id");

-- CreateIndex
CREATE INDEX "folder_chantier_id_idx" ON "folder"("chantier_id");

-- CreateIndex
CREATE INDEX "folder_parent_id_idx" ON "folder"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "agence_code_agence_key" ON "agence"("code_agence");

-- CreateIndex
CREATE INDEX "etablissement_id_agence_idx" ON "etablissement"("id_agence");

-- CreateIndex
CREATE UNIQUE INDEX "ao_reference_ao_key" ON "ao"("reference_ao");

-- CreateIndex
CREATE INDEX "ao_statut_idx" ON "ao"("statut");

-- CreateIndex
CREATE INDEX "ao_id_vecteur_idx" ON "ao"("id_vecteur");

-- CreateIndex
CREATE INDEX "intervention_id_intervenant_idx" ON "intervention"("id_intervenant");

-- CreateIndex
CREATE INDEX "intervention_id_chantier_idx" ON "intervention"("id_chantier");

-- CreateIndex
CREATE INDEX "documentation_id_chantier_idx" ON "documentation"("id_chantier");

-- CreateIndex
CREATE INDEX "documentation_type_doc_idx" ON "documentation"("type_doc");

-- CreateIndex
CREATE INDEX "documentation_id_chantier_type_doc_idx" ON "documentation"("id_chantier", "type_doc");

-- CreateIndex
CREATE INDEX "document_id_documentation_idx" ON "document"("id_documentation");

-- CreateIndex
CREATE INDEX "reserve_id_documentation_idx" ON "reserve"("id_documentation");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_id_fkey" FOREIGN KEY ("id") REFERENCES "user_table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_id_etablissement_fkey" FOREIGN KEY ("id_etablissement") REFERENCES "etablissement"("id_etablissement") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photo" ADD CONSTRAINT "user_photo_id_fkey" FOREIGN KEY ("id") REFERENCES "user_table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier" ADD CONSTRAINT "chantier_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "agence"("id_agence") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier" ADD CONSTRAINT "chantier_id_ao_fkey" FOREIGN KEY ("id_ao") REFERENCES "ao"("id_ao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier" ADD CONSTRAINT "chantier_chantier_details_id_fkey" FOREIGN KEY ("chantier_details_id") REFERENCES "chantier_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervenant" ADD CONSTRAINT "intervenant_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "agence"("id_agence") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_intervenants" ADD CONSTRAINT "chantier_intervenants_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_intervenants" ADD CONSTRAINT "chantier_intervenants_intervenants_id_fkey" FOREIGN KEY ("intervenants_id") REFERENCES "intervenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_idResponsible_fkey" FOREIGN KEY ("idResponsible") REFERENCES "intervenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_actions" ADD CONSTRAINT "chantier_actions_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_actions" ADD CONSTRAINT "chantier_actions_actions_id_fkey" FOREIGN KEY ("actions_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_children" ADD CONSTRAINT "action_children_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_children" ADD CONSTRAINT "action_children_children_id_fkey" FOREIGN KEY ("children_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_previous" ADD CONSTRAINT "action_previous_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_previous" ADD CONSTRAINT "action_previous_previous_id_fkey" FOREIGN KEY ("previous_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_documentation" ADD CONSTRAINT "chantier_documentation_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_documentation" ADD CONSTRAINT "chantier_documentation_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user_table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_documentation" ADD CONSTRAINT "chantier_documentation_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_required_doc" ADD CONSTRAINT "chantier_required_doc_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_shared_doc" ADD CONSTRAINT "chantier_shared_doc_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_organisation" ADD CONSTRAINT "chantier_organisation_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_objectif" ADD CONSTRAINT "chantier_objectif_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "chantier_objectif_chantier_id_idx" ON "chantier_objectif"("chantier_id");

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etablissement" ADD CONSTRAINT "etablissement_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "agence"("id_agence") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_id_intervenant_fkey" FOREIGN KEY ("id_intervenant") REFERENCES "intervenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_id_chantier_fkey" FOREIGN KEY ("id_chantier") REFERENCES "chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_id_documentation_fkey" FOREIGN KEY ("id_documentation") REFERENCES "documentation"("id_documentation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentation" ADD CONSTRAINT "documentation_id_chantier_fkey" FOREIGN KEY ("id_chantier") REFERENCES "chantier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_id_documentation_fkey" FOREIGN KEY ("id_documentation") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_apri" ADD CONSTRAINT "fiche_apri_id_fiche_apri_fkey" FOREIGN KEY ("id_fiche_apri") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mmt" ADD CONSTRAINT "mmt_id_mmt_fkey" FOREIGN KEY ("id_mmt") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppsps" ADD CONSTRAINT "ppsps_id_ppsps_fkey" FOREIGN KEY ("id_ppsps") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_terrasse" ADD CONSTRAINT "pv_terrasse_id_pv_terrasse_fkey" FOREIGN KEY ("id_pv_terrasse") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etat_lieux" ADD CONSTRAINT "etat_lieux_id_etat_lieux_fkey" FOREIGN KEY ("id_etat_lieux") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feuille_emargement" ADD CONSTRAINT "feuille_emargement_id_fkey" FOREIGN KEY ("id_feuille_emargement") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_starter" ADD CONSTRAINT "fiche_starter_id_fkey" FOREIGN KEY ("id_fiche_starter") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verif_fourg" ADD CONSTRAINT "verif_fourg_id_fkey" FOREIGN KEY ("id_verif_fourg") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_epi" ADD CONSTRAINT "notice_epi_id_fkey" FOREIGN KEY ("id_notice_epi") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_mise_eau" ADD CONSTRAINT "pv_mise_eau_id_fkey" FOREIGN KEY ("id_pv_mise_eau") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_beton_charp_couv" ADD CONSTRAINT "pv_recep_beton_charp_couv_id_fkey" FOREIGN KEY ("id_pv_recep_beton_charp_couv") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_beton_charp_bard" ADD CONSTRAINT "pv_recep_beton_charp_bard_id_fkey" FOREIGN KEY ("id_pv_recep_beton_charp_bard") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_beton_fac" ADD CONSTRAINT "pv_recep_beton_fac_id_fkey" FOREIGN KEY ("id_pv_recep_beton_fac") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_charp_met_bois_bard" ADD CONSTRAINT "pv_recep_charp_met_bois_bard_id_fkey" FOREIGN KEY ("id_pv_recep_charp_met_bois_bard") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_charp_met_bois_couv" ADD CONSTRAINT "pv_recep_charp_met_bois_couv_id_fkey" FOREIGN KEY ("id_pv_metal_bois_couv") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_etan" ADD CONSTRAINT "pv_recep_etan_id_fkey" FOREIGN KEY ("id_pv_recep_etan") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_ouv_art" ADD CONSTRAINT "pv_recep_ouv_art_id_fkey" FOREIGN KEY ("id_pv_recep_ouv_art") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_sup_beton_voir" ADD CONSTRAINT "pv_recep_sup_beton_voir_id_fkey" FOREIGN KEY ("id_pv_recep_sup_beton_voir") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_recep_ouv_sous_traites" ADD CONSTRAINT "pv_recep_ouv_sous_traites_id_fkey" FOREIGN KEY ("id_pv_recep_ouv_sous_traites") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visite_prev" ADD CONSTRAINT "visite_prev_id_fkey" FOREIGN KEY ("id_visite_prev") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verif_journ_echaf" ADD CONSTRAINT "verif_journ_echaf_id_fkey" FOREIGN KEY ("id_verif_journ_echaf") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verif_avant_mise_serv_echaf" ADD CONSTRAINT "verif_avant_mise_serv_echaf_id_fkey" FOREIGN KEY ("id_verif_avant_mise_serv_echaf") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_documentation_fkey" FOREIGN KEY ("id_documentation") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserve" ADD CONSTRAINT "reserve_id_documentation_fkey" FOREIGN KEY ("id_documentation") REFERENCES "documentation"("id_documentation") ON DELETE CASCADE ON UPDATE CASCADE;

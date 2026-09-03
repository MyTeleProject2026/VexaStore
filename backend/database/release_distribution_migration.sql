-- VexaStore release distribution metadata
-- Safe additive migration for existing installations.
ALTER TABLE app_versions ADD COLUMN sha256 VARCHAR(64) NULL;
ALTER TABLE app_versions ADD COLUMN package_name VARCHAR(255) NULL;
ALTER TABLE app_versions ADD COLUMN version_code BIGINT NULL;
ALTER TABLE app_versions ADD COLUMN minimum_sdk INT NULL;
ALTER TABLE app_versions ADD COLUMN signing_certificate_sha256 VARCHAR(64) NULL;
ALTER TABLE app_versions ADD COLUMN release_status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX idx_app_versions_package ON app_versions (package_name);
CREATE INDEX idx_app_versions_status ON app_versions (release_status);

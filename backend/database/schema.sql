-- SkillUp Lab Database Schema
-- Designed for PlanetScale (MySQL compatible)
-- Note: PlanetScale doesn't support foreign key constraints, so we use indexes instead

-- Users table for authentication and role management
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    last_login_at TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    -- Indexes for performance and security
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_email_verified (email_verified),
    INDEX idx_last_login (last_login_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forms table for storing form definitions
CREATE TABLE forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    settings JSON, -- Store form settings like deadline, max_submissions, etc.
    view_count INT DEFAULT 0 NOT NULL,
    submission_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    -- Indexes for performance (PlanetScale doesn't support FK constraints)
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_title (title),
    INDEX idx_status_active (status, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Form fields table for dynamic form structure
CREATE TABLE form_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type ENUM('text', 'textarea', 'email', 'number', 'select', 'radio', 'checkbox', 'date', 'file') NOT NULL,
    is_required BOOLEAN DEFAULT FALSE NOT NULL,
    field_order INT NOT NULL DEFAULT 0,
    options JSON, -- Store select/radio/checkbox options
    validation_rules JSON, -- Store validation rules (min, max, pattern, etc.)
    placeholder VARCHAR(200),
    help_text TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    -- Indexes for performance
    INDEX idx_form_id (form_id),
    INDEX idx_field_order (field_order),
    INDEX idx_field_type (field_type),
    INDEX idx_form_order (form_id, field_order),
    INDEX idx_field_name (field_name),
    UNIQUE KEY unique_form_field_name (form_id, field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Form submissions table for storing user responses
CREATE TABLE form_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    submitted_by INT NOT NULL,
    submission_data JSON NOT NULL, -- Store all form field responses
    status ENUM('draft', 'submitted', 'reviewed', 'graded') NOT NULL DEFAULT 'submitted',
    score DECIMAL(5,2) NULL, -- For graded forms (0.00 to 100.00)
    max_score DECIMAL(5,2) NULL, -- Maximum possible score
    feedback TEXT,
    graded_by INT NULL, -- Who graded this submission
    graded_at TIMESTAMP NULL,
    submission_ip VARCHAR(45), -- Store IP for audit trail
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    -- Indexes for performance
    INDEX idx_form_id (form_id),
    INDEX idx_submitted_by (submitted_by),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_graded_by (graded_by),
    INDEX idx_form_status (form_id, status),
    INDEX idx_user_submissions (submitted_by, submitted_at),

    -- Allow multiple submissions per user per form (configurable via form settings)
    INDEX idx_user_form (form_id, submitted_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table for JWT token management
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE, -- Increased size for security
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
    device_info VARCHAR(500), -- Store device/browser info for security
    ip_address VARCHAR(45), -- Store IP for audit trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,

    -- Indexes for performance and security
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_active (user_id, is_revoked),
    INDEX idx_cleanup (expires_at, is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Form permissions table for granular access control
CREATE TABLE form_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    user_id INT NOT NULL,
    permission_type ENUM('view', 'submit', 'edit', 'manage') NOT NULL,
    granted_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,

    -- Indexes for performance
    INDEX idx_form_id (form_id),
    INDEX idx_user_id (user_id),
    INDEX idx_permission_type (permission_type),
    INDEX idx_active (is_active),
    INDEX idx_form_user (form_id, user_id),

    -- Ensure unique permission per user per form
    UNIQUE KEY unique_user_form_permission (form_id, user_id, permission_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log table for security and compliance
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at),
    INDEX idx_user_action (user_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings table for application configuration
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE NOT NULL, -- Whether setting can be read by non-admins
    updated_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

    -- Indexes for performance
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public),
    INDEX idx_updated_by (updated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

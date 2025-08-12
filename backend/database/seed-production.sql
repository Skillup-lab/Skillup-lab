-- Production Seed Data for SkillUp Lab
-- Creates essential system configuration and initial admin user
-- This file is designed for production deployment

-- System Settings Configuration
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by) VALUES
('app_name', 'SkillUp Lab', 'string', 'Application name displayed to users', TRUE, 1),
('app_version', '1.0.0', 'string', 'Current application version', TRUE, 1),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode to restrict access', FALSE, 1),
('max_file_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', FALSE, 1),
('session_timeout', '3600', 'number', 'User session timeout in seconds (1 hour)', FALSE, 1),
('password_min_length', '8', 'number', 'Minimum required password length', TRUE, 1),
('password_require_uppercase', 'true', 'boolean', 'Require uppercase letters in passwords', TRUE, 1),
('password_require_lowercase', 'true', 'boolean', 'Require lowercase letters in passwords', TRUE, 1),
('password_require_numbers', 'true', 'boolean', 'Require numbers in passwords', TRUE, 1),
('password_require_symbols', 'false', 'boolean', 'Require special symbols in passwords', TRUE, 1),
('registration_enabled', 'true', 'boolean', 'Allow new user registration', TRUE, 1),
('email_verification_required', 'false', 'boolean', 'Require email verification for new accounts', TRUE, 1),
('max_login_attempts', '5', 'number', 'Maximum failed login attempts before account lock', FALSE, 1),
('account_lock_duration', '900', 'number', 'Account lock duration in seconds (15 minutes)', FALSE, 1),
('form_submission_rate_limit', '10', 'number', 'Maximum form submissions per user per hour', FALSE, 1),
('backup_retention_days', '30', 'number', 'Number of days to retain database backups', FALSE, 1),
('audit_log_retention_days', '90', 'number', 'Number of days to retain audit logs', FALSE, 1),
('default_form_status', 'draft', 'string', 'Default status for new forms', FALSE, 1),
('allow_anonymous_submissions', 'false', 'boolean', 'Allow form submissions without authentication', FALSE, 1),
('timezone', 'UTC', 'string', 'Default application timezone', TRUE, 1),
('date_format', 'YYYY-MM-DD', 'string', 'Default date format for display', TRUE, 1),
('time_format', '24h', 'string', 'Time format preference (12h or 24h)', TRUE, 1),
('pagination_default_limit', '10', 'number', 'Default number of items per page', TRUE, 1),
('pagination_max_limit', '100', 'number', 'Maximum allowed items per page', FALSE, 1),
('api_rate_limit_window', '900000', 'number', 'API rate limit window in milliseconds (15 minutes)', FALSE, 1),
('api_rate_limit_max', '100', 'number', 'Maximum API requests per window', FALSE, 1),
('jwt_access_token_expiry', '3600', 'number', 'JWT access token expiry in seconds (1 hour)', FALSE, 1),
('jwt_refresh_token_expiry', '604800', 'number', 'JWT refresh token expiry in seconds (7 days)', FALSE, 1),
('cors_allowed_origins', 'https://yourdomain.com', 'string', 'Comma-separated list of allowed CORS origins', FALSE, 1),
('smtp_enabled', 'false', 'boolean', 'Enable SMTP email sending', FALSE, 1),
('smtp_host', '', 'string', 'SMTP server hostname', FALSE, 1),
('smtp_port', '587', 'number', 'SMTP server port', FALSE, 1),
('smtp_secure', 'true', 'boolean', 'Use secure SMTP connection', FALSE, 1),
('smtp_user', '', 'string', 'SMTP username', FALSE, 1),
('smtp_from_email', 'noreply@skilluplab.com', 'string', 'Default from email address', FALSE, 1),
('smtp_from_name', 'SkillUp Lab', 'string', 'Default from name', FALSE, 1),
('file_storage_type', 'local', 'string', 'File storage type (local, s3, etc.)', FALSE, 1),
('file_storage_path', './uploads', 'string', 'Local file storage path', FALSE, 1),
('enable_audit_logging', 'true', 'boolean', 'Enable comprehensive audit logging', FALSE, 1),
('enable_performance_monitoring', 'true', 'boolean', 'Enable performance monitoring', FALSE, 1),
('slow_query_threshold', '1000', 'number', 'Slow query threshold in milliseconds', FALSE, 1),
('security_headers_enabled', 'true', 'boolean', 'Enable security headers', FALSE, 1),
('content_security_policy', 'default-src ''self''', 'string', 'Content Security Policy header', FALSE, 1),
('feature_form_templates', 'true', 'boolean', 'Enable form templates feature', TRUE, 1),
('feature_form_analytics', 'true', 'boolean', 'Enable form analytics feature', TRUE, 1),
('feature_bulk_operations', 'true', 'boolean', 'Enable bulk operations feature', TRUE, 1),
('feature_export_data', 'true', 'boolean', 'Enable data export feature', TRUE, 1),
('feature_api_access', 'true', 'boolean', 'Enable API access for integrations', TRUE, 1),
('welcome_message', 'Welcome to SkillUp Lab! Start creating and managing forms to enhance your learning experience.', 'string', 'Welcome message for new users', TRUE, 1),
('support_email', 'support@skilluplab.com', 'string', 'Support contact email', TRUE, 1),
('privacy_policy_url', '', 'string', 'Privacy policy URL', TRUE, 1),
('terms_of_service_url', '', 'string', 'Terms of service URL', TRUE, 1);

-- Create initial audit log entry for system initialization
INSERT IGNORE INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, created_at) VALUES
(NULL, 'system_initialized', 'system', NULL, '{"version": "1.0.0", "environment": "production"}', '127.0.0.1', NOW());

-- Note: Admin user will be created during migration with secure random password
-- The migration script will generate a secure password and display it once

-- Seed data for SkillUp Lab Database
-- This file contains initial data for testing and development

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role, first_name, last_name) VALUES
('admin', 'admin@skilluplab.com', '$2a$12$LQv3c1yqBwEHxPjjxU/Uy.VM6.tw3ub3R.dDjaTGvJ7BjbBNB.Ciu', 'admin', 'System', 'Administrator'),
('teacher1', 'teacher1@skilluplab.com', '$2a$12$LQv3c1yqBwEHxPjjxU/Uy.VM6.tw3ub3R.dDjaTGvJ7BjbBNB.Ciu', 'teacher', 'John', 'Smith'),
('teacher2', 'teacher2@skilluplab.com', '$2a$12$LQv3c1yqBwEHxPjjxU/Uy.VM6.tw3ub3R.dDjaTGvJ7BjbBNB.Ciu', 'teacher', 'Jane', 'Doe'),
('student1', 'student1@skilluplab.com', '$2a$12$LQv3c1yqBwEHxPjjxU/Uy.VM6.tw3ub3R.dDjaTGvJ7BjbBNB.Ciu', 'student', 'Alice', 'Johnson'),
('student2', 'student2@skilluplab.com', '$2a$12$LQv3c1yqBwEHxPjjxU/Uy.VM6.tw3ub3R.dDjaTGvJ7BjbBNB.Ciu', 'student', 'Bob', 'Wilson');

-- Insert sample forms
INSERT INTO forms (title, description, created_by, status, settings) VALUES
('Course Feedback Form', 'Please provide feedback about the course content and delivery', 2, 'published', '{"deadline": "2024-12-31", "max_submissions": 1, "allow_anonymous": false}'),
('Student Registration Form', 'New student registration form for the upcoming semester', 2, 'published', '{"deadline": "2024-09-15", "max_submissions": 1, "allow_anonymous": false}'),
('Assignment Submission', 'Submit your completed assignment here', 3, 'published', '{"deadline": "2024-08-20", "max_submissions": 3, "allow_anonymous": false}');

-- Insert form fields for Course Feedback Form (form_id: 1)
INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, field_order, options, validation_rules, placeholder) VALUES
(1, 'course_name', 'Course Name', 'text', true, 1, null, '{"min_length": 2, "max_length": 100}', 'Enter course name'),
(1, 'instructor_rating', 'Instructor Rating', 'select', true, 2, '["Excellent", "Good", "Average", "Poor"]', null, null),
(1, 'course_content_rating', 'Course Content Rating', 'radio', true, 3, '["5 - Excellent", "4 - Good", "3 - Average", "2 - Below Average", "1 - Poor"]', null, null),
(1, 'feedback_comments', 'Additional Comments', 'textarea', false, 4, null, '{"max_length": 500}', 'Share your thoughts about the course'),
(1, 'recommend_course', 'Would you recommend this course?', 'radio', true, 5, '["Yes", "No", "Maybe"]', null, null);

-- Insert form fields for Student Registration Form (form_id: 2)
INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, field_order, options, validation_rules, placeholder) VALUES
(2, 'student_id', 'Student ID', 'text', true, 1, null, '{"pattern": "^[A-Z]{2}[0-9]{6}$"}', 'e.g., ST123456'),
(2, 'full_name', 'Full Name', 'text', true, 2, null, '{"min_length": 2, "max_length": 100}', 'Enter your full name'),
(2, 'email', 'Email Address', 'email', true, 3, null, null, 'your.email@example.com'),
(2, 'phone', 'Phone Number', 'text', true, 4, null, '{"pattern": "^[0-9]{10}$"}', '1234567890'),
(2, 'date_of_birth', 'Date of Birth', 'date', true, 5, null, null, null),
(2, 'program', 'Program of Study', 'select', true, 6, '["Computer Science", "Information Technology", "Data Science", "Cybersecurity", "Software Engineering"]', null, null),
(2, 'previous_education', 'Previous Education', 'textarea', false, 7, null, '{"max_length": 300}', 'Describe your educational background');

-- Insert form fields for Assignment Submission (form_id: 3)
INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, field_order, options, validation_rules, placeholder) VALUES
(3, 'assignment_title', 'Assignment Title', 'text', true, 1, null, '{"min_length": 5, "max_length": 100}', 'Enter assignment title'),
(3, 'student_name', 'Student Name', 'text', true, 2, null, '{"min_length": 2, "max_length": 100}', 'Your full name'),
(3, 'submission_type', 'Submission Type', 'select', true, 3, '["Individual", "Group"]', null, null),
(3, 'description', 'Assignment Description', 'textarea', true, 4, null, '{"min_length": 10, "max_length": 1000}', 'Describe your assignment'),
(3, 'completion_date', 'Completion Date', 'date', true, 5, null, null, null);

-- Insert sample form submissions
INSERT INTO form_submissions (form_id, submitted_by, submission_data, status) VALUES
(1, 4, '{"course_name": "Web Development Fundamentals", "instructor_rating": "Excellent", "course_content_rating": "5 - Excellent", "feedback_comments": "Great course with practical examples", "recommend_course": "Yes"}', 'submitted'),
(1, 5, '{"course_name": "Database Design", "instructor_rating": "Good", "course_content_rating": "4 - Good", "feedback_comments": "Could use more hands-on exercises", "recommend_course": "Yes"}', 'submitted'),
(2, 4, '{"student_id": "ST123456", "full_name": "Alice Johnson", "email": "alice.johnson@example.com", "phone": "1234567890", "date_of_birth": "2000-05-15", "program": "Computer Science", "previous_education": "High school graduate with honors"}', 'submitted');

-- Insert form permissions (optional - for granular access control)
INSERT INTO form_permissions (form_id, user_id, permission_type, granted_by) VALUES
(1, 4, 'submit', 2),
(1, 5, 'submit', 2),
(2, 4, 'submit', 2),
(2, 5, 'submit', 2),
(3, 4, 'submit', 3),
(3, 5, 'submit', 3);

/**
 * Model Tests
 * Tests for database models and their methods
 */

const User = require('../models/User');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const FormSubmission = require('../models/FormSubmission');

describe('User Model', () => {
  let testUserId;

  const testUser = {
    username: 'modeltest',
    email: 'modeltest@example.com',
    password: 'TestPassword123',
    firstName: 'Model',
    lastName: 'Test',
    role: 'student'
  };

  describe('User Creation', () => {
    it('should create a new user', async () => {
      const user = await User.create(testUser);
      
      expect(user).toHaveProperty('id');
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
      expect(user.role).toBe(testUser.role);
      expect(user.first_name).toBe(testUser.firstName);
      expect(user.last_name).toBe(testUser.lastName);
      
      testUserId = user.id;
    });

    it('should hash password during creation', async () => {
      const userWithPassword = await User.findByUsername(testUser.username);
      expect(userWithPassword.password_hash).toBeDefined();
      expect(userWithPassword.password_hash).not.toBe(testUser.password);
    });
  });

  describe('User Retrieval', () => {
    it('should find user by ID', async () => {
      const user = await User.findById(testUserId);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
      expect(user.username).toBe(testUser.username);
    });

    it('should find user by username', async () => {
      const user = await User.findByUsername(testUser.username);
      
      expect(user).toBeDefined();
      expect(user.username).toBe(testUser.username);
      expect(user).toHaveProperty('password_hash');
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail(testUser.email);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
    });

    it('should return null for non-existent user', async () => {
      const user = await User.findById(99999);
      expect(user).toBeNull();
    });
  });

  describe('User Validation', () => {
    it('should verify correct password', async () => {
      const user = await User.findByUsername(testUser.username);
      const isValid = await User.verifyPassword(testUser.password, user.password_hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.findByUsername(testUser.username);
      const isValid = await User.verifyPassword('wrongpassword', user.password_hash);
      
      expect(isValid).toBe(false);
    });

    it('should check if username exists', async () => {
      const exists = await User.usernameExists(testUser.username);
      expect(exists).toBe(true);
      
      const notExists = await User.usernameExists('nonexistentuser');
      expect(notExists).toBe(false);
    });

    it('should check if email exists', async () => {
      const exists = await User.emailExists(testUser.email);
      expect(exists).toBe(true);
      
      const notExists = await User.emailExists('nonexistent@example.com');
      expect(notExists).toBe(false);
    });
  });

  describe('User Updates', () => {
    it('should update user information', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'User'
      };
      
      const updatedUser = await User.update(testUserId, updateData);
      
      expect(updatedUser.first_name).toBe(updateData.first_name);
      expect(updatedUser.last_name).toBe(updateData.last_name);
    });

    it('should update user password', async () => {
      const newPassword = 'NewPassword123';
      const success = await User.updatePassword(testUserId, newPassword);
      
      expect(success).toBe(true);
      
      // Verify new password works
      const user = await User.findByUsername(testUser.username);
      const isValid = await User.verifyPassword(newPassword, user.password_hash);
      expect(isValid).toBe(true);
    });
  });
});

describe('Form Model', () => {
  let testFormId;
  let testUserId;

  beforeAll(async () => {
    // Create a test user for form creation
    const user = await User.create({
      username: 'formtestuser',
      email: 'formtest@example.com',
      password: 'TestPassword123',
      role: 'teacher'
    });
    testUserId = user.id;
  });

  const testForm = {
    title: 'Test Form',
    description: 'A test form for unit testing',
    status: 'draft',
    settings: {
      maxSubmissions: 1,
      deadline: '2024-12-31'
    }
  };

  describe('Form Creation', () => {
    it('should create a new form', async () => {
      const form = await Form.create({
        ...testForm,
        createdBy: testUserId
      });
      
      expect(form).toHaveProperty('id');
      expect(form.title).toBe(testForm.title);
      expect(form.description).toBe(testForm.description);
      expect(form.created_by).toBe(testUserId);
      expect(form.status).toBe(testForm.status);
      
      testFormId = form.id;
    });
  });

  describe('Form Retrieval', () => {
    it('should find form by ID', async () => {
      const form = await Form.findById(testFormId);
      
      expect(form).toBeDefined();
      expect(form.id).toBe(testFormId);
      expect(form.title).toBe(testForm.title);
      expect(form.settings).toEqual(testForm.settings);
    });

    it('should find form with fields', async () => {
      const form = await Form.findWithFields(testFormId);
      
      expect(form).toBeDefined();
      expect(form).toHaveProperty('fields');
      expect(Array.isArray(form.fields)).toBe(true);
    });
  });

  describe('Form Access Control', () => {
    it('should allow admin to access any form', async () => {
      const canAccess = await Form.canUserAccess(testFormId, 999, 'admin');
      expect(canAccess).toBe(true);
    });

    it('should allow teacher to access their own form', async () => {
      const canAccess = await Form.canUserAccess(testFormId, testUserId, 'teacher');
      expect(canAccess).toBe(true);
    });

    it('should not allow teacher to access other teacher\'s form', async () => {
      const canAccess = await Form.canUserAccess(testFormId, 999, 'teacher');
      expect(canAccess).toBe(false);
    });
  });
});

describe('FormField Model', () => {
  let testFormId;
  let testFieldId;
  let testUserId;

  beforeAll(async () => {
    // Create test user and form
    const user = await User.create({
      username: 'fieldtestuser',
      email: 'fieldtest@example.com',
      password: 'TestPassword123',
      role: 'teacher'
    });
    testUserId = user.id;

    const form = await Form.create({
      title: 'Field Test Form',
      description: 'Form for testing fields',
      createdBy: testUserId
    });
    testFormId = form.id;
  });

  const testField = {
    fieldName: 'test_field',
    fieldLabel: 'Test Field',
    fieldType: 'text',
    isRequired: true,
    fieldOrder: 1,
    placeholder: 'Enter test value',
    helpText: 'This is a test field'
  };

  describe('Field Creation', () => {
    it('should create a new form field', async () => {
      const field = await FormField.create({
        ...testField,
        formId: testFormId
      });
      
      expect(field).toHaveProperty('id');
      expect(field.field_name).toBe(testField.fieldName);
      expect(field.field_label).toBe(testField.fieldLabel);
      expect(field.field_type).toBe(testField.fieldType);
      expect(field.is_required).toBe(testField.isRequired);
      expect(field.form_id).toBe(testFormId);
      
      testFieldId = field.id;
    });
  });

  describe('Field Retrieval', () => {
    it('should find field by ID', async () => {
      const field = await FormField.findById(testFieldId);
      
      expect(field).toBeDefined();
      expect(field.id).toBe(testFieldId);
      expect(field.field_name).toBe(testField.fieldName);
    });

    it('should find fields by form ID', async () => {
      const fields = await FormField.findByFormId(testFormId);
      
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
      expect(fields[0].form_id).toBe(testFormId);
    });
  });

  describe('Field Validation', () => {
    it('should check if field name exists in form', async () => {
      const exists = await FormField.fieldNameExists(testFormId, testField.fieldName);
      expect(exists).toBe(true);
      
      const notExists = await FormField.fieldNameExists(testFormId, 'nonexistent_field');
      expect(notExists).toBe(false);
    });

    it('should get next field order', async () => {
      const nextOrder = await FormField.getNextOrder(testFormId);
      expect(typeof nextOrder).toBe('number');
      expect(nextOrder).toBeGreaterThan(0);
    });
  });
});

describe('FormSubmission Model', () => {
  let testFormId;
  let testUserId;
  let testSubmissionId;

  beforeAll(async () => {
    // Create test user and form
    const user = await User.create({
      username: 'submissiontestuser',
      email: 'submissiontest@example.com',
      password: 'TestPassword123',
      role: 'student'
    });
    testUserId = user.id;

    const teacher = await User.create({
      username: 'submissionteacher',
      email: 'submissionteacher@example.com',
      password: 'TestPassword123',
      role: 'teacher'
    });

    const form = await Form.create({
      title: 'Submission Test Form',
      description: 'Form for testing submissions',
      createdBy: teacher.id,
      status: 'published'
    });
    testFormId = form.id;
  });

  const testSubmission = {
    submissionData: {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test submission'
    },
    status: 'submitted'
  };

  describe('Submission Creation', () => {
    it('should create a new form submission', async () => {
      const submission = await FormSubmission.create({
        formId: testFormId,
        submittedBy: testUserId,
        submissionData: testSubmission.submissionData,
        status: testSubmission.status
      });
      
      expect(submission).toHaveProperty('id');
      expect(submission.form_id).toBe(testFormId);
      expect(submission.submitted_by).toBe(testUserId);
      expect(submission.submission_data).toEqual(testSubmission.submissionData);
      expect(submission.status).toBe(testSubmission.status);
      
      testSubmissionId = submission.id;
    });
  });

  describe('Submission Retrieval', () => {
    it('should find submission by ID', async () => {
      const submission = await FormSubmission.findById(testSubmissionId);
      
      expect(submission).toBeDefined();
      expect(submission.id).toBe(testSubmissionId);
      expect(submission.submission_data).toEqual(testSubmission.submissionData);
    });

    it('should find submissions by form ID', async () => {
      const result = await FormSubmission.findByFormId(testFormId);
      
      expect(result).toHaveProperty('submissions');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.submissions)).toBe(true);
      expect(result.submissions.length).toBeGreaterThan(0);
    });

    it('should find submissions by user ID', async () => {
      const result = await FormSubmission.findByUserId(testUserId);
      
      expect(result).toHaveProperty('submissions');
      expect(Array.isArray(result.submissions)).toBe(true);
      expect(result.submissions.length).toBeGreaterThan(0);
      expect(result.submissions[0].submitted_by).toBe(testUserId);
    });
  });

  describe('Submission Statistics', () => {
    it('should get form statistics', async () => {
      const stats = await FormSubmission.getFormStats(testFormId);
      
      expect(stats).toHaveProperty('total_submissions');
      expect(stats).toHaveProperty('submitted_count');
      expect(stats).toHaveProperty('draft_count');
      expect(stats.total_submissions).toBeGreaterThan(0);
    });

    it('should get user statistics', async () => {
      const stats = await FormSubmission.getUserStats(testUserId);
      
      expect(stats).toHaveProperty('total_submissions');
      expect(stats).toHaveProperty('submitted_count');
      expect(stats.total_submissions).toBeGreaterThan(0);
    });
  });
});

/**
 * FormField Model
 * Handles form field operations
 */

const { executeQuery } = require('../config/database');

class FormField {
  /**
   * Create a new form field
   * @param {Object} fieldData - Field data
   * @returns {Promise<Object>} Created field
   */
  static async create(fieldData) {
    const { 
      formId, 
      fieldName, 
      fieldLabel, 
      fieldType, 
      isRequired = false, 
      fieldOrder = 0,
      options = null,
      validationRules = null,
      placeholder = null,
      helpText = null
    } = fieldData;
    
    const query = `
      INSERT INTO form_fields (
        form_id, field_name, field_label, field_type, is_required, 
        field_order, options, validation_rules, placeholder, help_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      formId,
      fieldName,
      fieldLabel,
      fieldType,
      isRequired,
      fieldOrder,
      options ? JSON.stringify(options) : null,
      validationRules ? JSON.stringify(validationRules) : null,
      placeholder,
      helpText
    ]);
    
    return await this.findById(result.insertId);
  }

  /**
   * Find field by ID
   * @param {number} id - Field ID
   * @returns {Promise<Object|null>} Field object or null
   */
  static async findById(id) {
    const query = 'SELECT * FROM form_fields WHERE id = ?';
    const results = await executeQuery(query, [id]);
    
    if (results.length === 0) return null;
    
    const field = results[0];
    
    // Parse JSON fields
    if (field.options) {
      field.options = JSON.parse(field.options);
    }
    if (field.validation_rules) {
      field.validation_rules = JSON.parse(field.validation_rules);
    }
    
    return field;
  }

  /**
   * Get all fields for a form
   * @param {number} formId - Form ID
   * @returns {Promise<Array>} Array of fields
   */
  static async findByFormId(formId) {
    const query = `
      SELECT * FROM form_fields 
      WHERE form_id = ? 
      ORDER BY field_order ASC, id ASC
    `;
    
    const fields = await executeQuery(query, [formId]);
    
    // Parse JSON fields for each field
    fields.forEach(field => {
      if (field.options) {
        field.options = JSON.parse(field.options);
      }
      if (field.validation_rules) {
        field.validation_rules = JSON.parse(field.validation_rules);
      }
    });
    
    return fields;
  }

  /**
   * Update form field
   * @param {number} id - Field ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated field
   */
  static async update(id, updateData) {
    const allowedFields = [
      'field_name', 'field_label', 'field_type', 'is_required', 
      'field_order', 'options', 'validation_rules', 'placeholder', 'help_text'
    ];
    
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'options' || key === 'validation_rules') {
          updates.push(`${key} = ?`);
          params.push(value ? JSON.stringify(value) : null);
        } else {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    params.push(id);
    
    const query = `
      UPDATE form_fields 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(query, params);
    return await this.findById(id);
  }

  /**
   * Delete form field
   * @param {number} id - Field ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const query = 'DELETE FROM form_fields WHERE id = ?';
    await executeQuery(query, [id]);
    return true;
  }

  /**
   * Delete all fields for a form
   * @param {number} formId - Form ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteByFormId(formId) {
    const query = 'DELETE FROM form_fields WHERE form_id = ?';
    await executeQuery(query, [formId]);
    return true;
  }

  /**
   * Reorder form fields
   * @param {number} formId - Form ID
   * @param {Array} fieldOrders - Array of {id, order} objects
   * @returns {Promise<boolean>} Success status
   */
  static async reorderFields(formId, fieldOrders) {
    const connection = await require('../config/database').getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const { id, order } of fieldOrders) {
        await connection.execute(
          'UPDATE form_fields SET field_order = ? WHERE id = ? AND form_id = ?',
          [order, id, formId]
        );
      }
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Bulk create form fields
   * @param {number} formId - Form ID
   * @param {Array} fieldsData - Array of field data objects
   * @returns {Promise<Array>} Created fields
   */
  static async bulkCreate(formId, fieldsData) {
    const connection = await require('../config/database').getConnection();
    
    try {
      await connection.beginTransaction();
      
      const createdFields = [];
      
      for (let i = 0; i < fieldsData.length; i++) {
        const fieldData = { ...fieldsData[i], formId, fieldOrder: i };
        const field = await this.create(fieldData);
        createdFields.push(field);
      }
      
      await connection.commit();
      return createdFields;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if field name exists in form
   * @param {number} formId - Form ID
   * @param {string} fieldName - Field name
   * @param {number} excludeId - Field ID to exclude from check
   * @returns {Promise<boolean>} Exists status
   */
  static async fieldNameExists(formId, fieldName, excludeId = null) {
    let query = 'SELECT id FROM form_fields WHERE form_id = ? AND field_name = ?';
    let params = [formId, fieldName];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await executeQuery(query, params);
    return results.length > 0;
  }

  /**
   * Get next field order for a form
   * @param {number} formId - Form ID
   * @returns {Promise<number>} Next order number
   */
  static async getNextOrder(formId) {
    const query = `
      SELECT COALESCE(MAX(field_order), -1) + 1 as next_order 
      FROM form_fields 
      WHERE form_id = ?
    `;
    
    const results = await executeQuery(query, [formId]);
    return results[0].next_order;
  }
}

module.exports = FormField;

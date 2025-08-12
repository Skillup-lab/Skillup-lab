/**
 * Student Dashboard JavaScript
 * Handles student-specific functionality
 */

class StudentDashboard {
  constructor() {
    this.api = window.skillUpAPI;
    this.authManager = window.authManager;
    this.init();
  }

  init() {
    // Check authentication
    if (!this.authManager.requireAuth('student')) {
      return;
    }

    this.loadDashboardData();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Form modal close
    const modal = document.getElementById('formModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  async loadDashboardData() {
    await Promise.all([
      this.loadAvailableForms(),
      this.loadMySubmissions(),
      this.loadStatistics()
    ]);
  }

  async loadAvailableForms() {
    try {
      const response = await this.api.getForms({ status: 'published' });
      const container = document.getElementById('availableForms');

      if (response.success && response.data.forms.length > 0) {
        container.innerHTML = response.data.forms.map(form => `
          <div class="form-item" onclick="studentDashboard.viewForm(${form.id})">
            <h4>${form.title}</h4>
            <p>${form.description || 'No description available'}</p>
            <span class="form-status status-published">Available</span>
          </div>
        `).join('');
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <p>No forms available at the moment</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      document.getElementById('availableForms').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading forms</p>
        </div>
      `;
    }
  }

  async loadMySubmissions() {
    try {
      const response = await this.api.getSubmissions();
      const container = document.getElementById('mySubmissions');

      if (response.success && response.data.submissions.length > 0) {
        container.innerHTML = response.data.submissions.map(submission => `
          <div class="form-item" onclick="studentDashboard.viewSubmission(${submission.id})">
            <h4>${submission.form_title}</h4>
            <p>Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}</p>
            <span class="form-status status-submitted">${submission.status}</span>
            ${submission.score ? `<span class="form-status" style="background: #d1ecf1; color: #0c5460;">Score: ${submission.score}</span>` : ''}
          </div>
        `).join('');
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-paper-plane"></i>
            <p>No submissions yet</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      document.getElementById('mySubmissions').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading submissions</p>
        </div>
      `;
    }
  }

  async loadStatistics() {
    try {
      const response = await this.api.request('/submissions/stats');
      const container = document.getElementById('studentStats');

      if (response.success) {
        const stats = response.data.stats;
        container.innerHTML = `
          <div class="stat-card">
            <div class="stat-number">${stats.total_submissions || 0}</div>
            <div class="stat-label">Total Submissions</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.submitted_count || 0}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.draft_count || 0}</div>
            <div class="stat-label">Drafts</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.average_score ? stats.average_score.toFixed(1) : 'N/A'}</div>
            <div class="stat-label">Average Score</div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-chart-bar"></i>
            <p>No statistics available</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      document.getElementById('studentStats').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading statistics</p>
        </div>
      `;
    }
  }

  async viewForm(formId) {
    try {
      const response = await this.api.getForm(formId);
      
      if (response.success) {
        const form = response.data.form;
        this.showFormModal(form);
      } else {
        this.authManager.showMessage('Error loading form', 'error');
      }
    } catch (error) {
      console.error('Error viewing form:', error);
      this.authManager.showMessage('Error loading form', 'error');
    }
  }

  showFormModal(form) {
    const modal = document.getElementById('formModal');
    const content = document.getElementById('formContent');
    
    content.innerHTML = `
      <h2>${form.title}</h2>
      <p>${form.description || ''}</p>
      
      <form id="submissionForm" data-form-id="${form.id}">
        ${form.fields.map(field => this.renderFormField(field)).join('')}
        
        <div style="margin-top: 20px; text-align: center;">
          <button type="submit" class="btn">Submit Form</button>
          <button type="button" class="btn btn-outline" onclick="document.getElementById('formModal').style.display='none'">Cancel</button>
        </div>
      </form>
    `;

    // Add form submission handler
    document.getElementById('submissionForm').addEventListener('submit', (e) => {
      this.handleFormSubmission(e);
    });

    modal.style.display = 'block';
  }

  renderFormField(field) {
    const required = field.is_required ? 'required' : '';
    const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : '';
    
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
        return `
          <div class="form-group">
            <label for="${field.field_name}">${field.field_label} ${field.is_required ? '*' : ''}</label>
            <input type="${field.field_type}" id="${field.field_name}" name="${field.field_name}" ${required} ${placeholder}>
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
      
      case 'textarea':
        return `
          <div class="form-group">
            <label for="${field.field_name}">${field.field_label} ${field.is_required ? '*' : ''}</label>
            <textarea id="${field.field_name}" name="${field.field_name}" ${required} ${placeholder}></textarea>
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
      
      case 'select':
        return `
          <div class="form-group">
            <label for="${field.field_name}">${field.field_label} ${field.is_required ? '*' : ''}</label>
            <select id="${field.field_name}" name="${field.field_name}" ${required}>
              <option value="">Select an option</option>
              ${field.options ? field.options.map(option => `<option value="${option}">${option}</option>`).join('') : ''}
            </select>
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
      
      case 'radio':
        return `
          <div class="form-group">
            <label>${field.field_label} ${field.is_required ? '*' : ''}</label>
            ${field.options ? field.options.map(option => `
              <label class="radio-label">
                <input type="radio" name="${field.field_name}" value="${option}" ${required}>
                ${option}
              </label>
            `).join('') : ''}
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
      
      case 'checkbox':
        return `
          <div class="form-group">
            <label>${field.field_label} ${field.is_required ? '*' : ''}</label>
            ${field.options ? field.options.map(option => `
              <label class="checkbox-label">
                <input type="checkbox" name="${field.field_name}" value="${option}">
                ${option}
              </label>
            `).join('') : ''}
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
      
      case 'date':
        return `
          <div class="form-group">
            <label for="${field.field_name}">${field.field_label} ${field.is_required ? '*' : ''}</label>
            <input type="date" id="${field.field_name}" name="${field.field_name}" ${required}>
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
      
      default:
        return `
          <div class="form-group">
            <label for="${field.field_name}">${field.field_label} ${field.is_required ? '*' : ''}</label>
            <input type="text" id="${field.field_name}" name="${field.field_name}" ${required} ${placeholder}>
            ${field.help_text ? `<small>${field.help_text}</small>` : ''}
          </div>
        `;
    }
  }

  async handleFormSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formId = form.dataset.formId;
    const formData = new FormData(form);
    
    // Convert form data to submission object
    const submissionData = {};
    
    for (const [key, value] of formData.entries()) {
      if (submissionData[key]) {
        // Handle multiple values (checkboxes)
        if (Array.isArray(submissionData[key])) {
          submissionData[key].push(value);
        } else {
          submissionData[key] = [submissionData[key], value];
        }
      } else {
        submissionData[key] = value;
      }
    }

    try {
      this.authManager.showLoading(true);
      
      const response = await this.api.submitForm(formId, submissionData);
      
      if (response.success) {
        this.authManager.showMessage('Form submitted successfully!', 'success');
        document.getElementById('formModal').style.display = 'none';
        
        // Reload submissions
        await this.loadMySubmissions();
        await this.loadStatistics();
      } else {
        this.authManager.showMessage(response.message || 'Submission failed', 'error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      this.authManager.showMessage('Submission failed. Please try again.', 'error');
    } finally {
      this.authManager.showLoading(false);
    }
  }

  async viewSubmission(submissionId) {
    try {
      const response = await this.api.getSubmission(submissionId);
      
      if (response.success) {
        const submission = response.data.submission;
        this.showSubmissionDetails(submission);
      } else {
        this.authManager.showMessage('Error loading submission', 'error');
      }
    } catch (error) {
      console.error('Error viewing submission:', error);
      this.authManager.showMessage('Error loading submission', 'error');
    }
  }

  showSubmissionDetails(submission) {
    const modal = document.getElementById('formModal');
    const content = document.getElementById('formContent');
    
    content.innerHTML = `
      <h2>Submission Details</h2>
      <h3>${submission.form_title}</h3>
      
      <div class="submission-info">
        <p><strong>Status:</strong> ${submission.status}</p>
        <p><strong>Submitted:</strong> ${new Date(submission.submitted_at).toLocaleString()}</p>
        ${submission.score ? `<p><strong>Score:</strong> ${submission.score}/100</p>` : ''}
        ${submission.feedback ? `<p><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
      </div>
      
      <div class="submission-data">
        <h4>Your Responses:</h4>
        ${Object.entries(submission.submission_data).map(([key, value]) => `
          <div class="response-item">
            <strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
            <span>${Array.isArray(value) ? value.join(', ') : value}</span>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button type="button" class="btn" onclick="document.getElementById('formModal').style.display='none'">Close</button>
      </div>
    `;

    modal.style.display = 'block';
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.studentDashboard = new StudentDashboard();
});

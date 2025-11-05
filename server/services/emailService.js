/**
 * Email Service for CSE Mail Platform
 * Handles SMTP configuration, email sending, and template processing
 */
const nodemailer = require("nodemailer");
const Template = require("../models/Template");
const AuditLog = require("../models/AuditLog");
const Settings = require("../models/Settings");
const path = require("path");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

/**
 * Email service class for handling email operations
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter with database settings or environment fallback
   */
  async initializeTransporter() {
    try {
      // Try to get settings from database first, but don't wait too long
      let settings = null;
      try {
        // Check if mongoose is connected before trying to query
        if (require("mongoose").connection.readyState === 1) {
          settings = await Settings.findOne().maxTimeMS(2000); // 2 second timeout
        }
      } catch (dbError) {
        // Database not ready, fallback to environment variables
      }

      const smtpConfig = {
        host: settings?.smtpHost || process.env.SMTP_HOST,
        port: parseInt(settings?.smtpPort || process.env.SMTP_PORT) || 587,
        secure: false, // Use STARTTLS instead of SSL
        requireTLS: true, // Force TLS upgrade
        auth: {
          user: settings?.smtpUser || process.env.SMTP_USER,
          pass: settings?.smtpPassword || process.env.SMTP_PASS,
        },
        // Additional SMTP options for Gmail compatibility
        tls: {
          rejectUnauthorized: false,
          ciphers: "SSLv3",
        },
        // Optimized for serverless/Vercel environment
        pool: false, // Disable pooling for serverless
        maxConnections: 1,
        connectionTimeout: 10000, // 10 seconds (reduced for serverless)
        greetingTimeout: 8000, // 8 seconds
        socketTimeout: 10000, // 10 seconds
        logger: false,
        debug: false,
      };

      // Configure SMTP transporter
      this.transporter = nodemailer.createTransport(smtpConfig);

      // Log successful SMTP connection
      console.log(
        `SMTP transporter connected successfully to ${smtpConfig.host} on port ${smtpConfig.port}`
      );

      // Don't verify on startup to avoid blocking initialization
      // Verification will happen when actually sending emails
    } catch (error) {
      console.error("Failed to initialize SMTP transporter:", error);
      // Fallback to environment variables with optimized settings
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: "SSLv3",
        },
        pool: false,
        connectionTimeout: 10000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });
    }
  }

  /**
   * Refresh transporter configuration (call when settings are updated)
   */
  async refreshTransporter() {
    await this.initializeTransporter();
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("SMTP connection failed:", error.message);
      return false;
    }
  }

  /**
   * Process template variables by replacing {{variable}} placeholders
   * @param {string} content - Template content with variables
   * @param {object} variables - Key-value pairs for replacement
   * @param {object} contact - Contact information for personalization
   * @returns {string} Processed content
   */
  processTemplateVariables(content, variables = {}, contact = {}) {
    let processedContent = content;

    // Process custom variables first
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedContent = processedContent.replace(regex, value || "");
    });

    // Process contact-specific variables
    const contactVariables = {
      first_name: contact.firstName || contact.first_name || "",
      last_name: contact.lastName || contact.last_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      ...(contact.customFields || {}),
    };

    Object.entries(contactVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedContent = processedContent.replace(regex, value || "");
    });

    // Process system variables
    const systemVariables = {
      current_date: new Date().toLocaleDateString(),
      current_year: new Date().getFullYear().toString(),
      current_month: new Date().toLocaleDateString("en-US", { month: "long" }),
      unsubscribe_url: `${
        process.env.FRONTEND_URL
      }/unsubscribe?email=${encodeURIComponent(contact.email)}`,
      company_name: process.env.COMPANY_NAME || "Your Company",
      support_email: process.env.SUPPORT_EMAIL || "support@example.com",
      website_url: process.env.WEBSITE_URL || "https://example.com",
    };

    Object.entries(systemVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  }

  /**
   * Send email using template
   * @param {object} options - Email options
   * @returns {Promise} Send result
   */
  async sendTemplateEmail({
    templateId,
    to,
    variables = {},
    contact = {},
    fromName,
    fromEmail,
    replyTo,
    userId,
    campaignId = null,
    customTemplate = null, // NEW: Support for custom templates
  }) {
    try {
      let template;

      if (customTemplate) {
        // Use provided custom template
        template = customTemplate;
      } else if (templateId) {
        // Get template from database
        template = await Template.findById(templateId);
        if (!template) {
          throw new Error("Template not found");
        }
      } else {
        throw new Error("Either templateId or customTemplate must be provided");
      }

      // Process template content and subject
      const processedContent = this.processTemplateVariables(
        template.content,
        variables,
        contact
      );
      const processedSubject = this.processTemplateVariables(
        template.subject,
        variables,
        contact
      );

      // Email options
      const mailOptions = {
        from: `"${fromName || process.env.DEFAULT_FROM_NAME}" <${
          fromEmail || process.env.DEFAULT_FROM_EMAIL
        }>`,
        to: to,
        replyTo: replyTo || fromEmail || process.env.DEFAULT_FROM_EMAIL,
        subject: processedSubject,
        html: processedContent,
        // Add tracking headers if needed
        headers: {
          "X-Campaign-ID": campaignId,
          "X-Template-ID": templateId || "custom",
          "X-Contact-Email": contact.email,
        },
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      // Log successful send
      if (userId) {
        await AuditLog.create({
          userId: userId,
          action: "email_sent",
          targetType: "email",
          targetId: result.messageId,
          details: {
            templateId: templateId || "custom",
            templateName: template.name || "Custom Template",
            recipient: to,
            subject: processedSubject,
            campaignId: campaignId,
            variables: Object.keys(variables),
          },
        });
      }

      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
        subject: processedSubject,
      };
    } catch (error) {
      console.error("Email send error:", error);

      // Log failed send
      if (userId) {
        await AuditLog.create({
          userId: userId,
          action: "email_send_failed",
          targetType: "email",
          details: {
            templateId: templateId || "custom",
            recipient: to,
            error: error.message,
            campaignId: campaignId,
          },
        });
      }

      throw error;
    }
  }

  /**
   * Send bulk emails using template
   * @param {object} options - Bulk email options
   * @returns {Promise} Bulk send results
   */
  async sendBulkTemplateEmails({
    templateId,
    customTemplate, // NEW: Support for custom templates
    contacts,
    variables = {},
    fromName,
    fromEmail,
    replyTo,
    userId,
    campaignId = null,
    batchSize = 1, // Send one at a time to avoid connection issues
    delay = 2000, // Increased delay between emails
  }) {
    const results = {
      successful: [],
      failed: [],
      total: contacts.length,
    };

    // Send emails one by one with delays to avoid connection issues
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      try {
        const result = await this.sendTemplateEmail({
          templateId,
          customTemplate, // Pass custom template through
          to: contact.email,
          variables,
          contact,
          fromName,
          fromEmail,
          replyTo,
          userId,
          campaignId,
        });

        results.successful.push({
          contact: contact.email,
          messageId: result.messageId,
          subject: result.subject,
        });
      } catch (error) {
        console.error(
          `Failed to send email to ${contact.email}:`,
          error.message
        );
        results.failed.push({
          contact: contact.email,
          error: error.message,
        });
      }

      // Add delay between emails to avoid overwhelming SMTP
      if (i < contacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  /**
   * Test template by sending to specific emails
   * @param {object} options - Test email options
   * @returns {Promise} Test results
   */
  async testTemplate({ templateId, testEmails, variables = {}, userId }) {
    const results = [];

    for (const email of testEmails) {
      try {
        const result = await this.sendTemplateEmail({
          templateId,
          to: email,
          variables,
          contact: { email, first_name: "Test", last_name: "User" },
          fromName: "Test Sender",
          fromEmail: process.env.DEFAULT_FROM_EMAIL,
          userId,
        });

        results.push({
          email,
          success: true,
          messageId: result.messageId,
          subject: result.subject,
        });
      } catch (error) {
        results.push({
          email,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Preview template with variables processed
   * @param {object} options - Preview options
   * @returns {Promise} Processed template
   */
  async previewTemplate({ templateId, variables = {}, contact = {} }) {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const processedContent = this.processTemplateVariables(
      template.content,
      variables,
      contact
    );
    const processedSubject = this.processTemplateVariables(
      template.subject,
      variables,
      contact
    );

    return {
      subject: processedSubject,
      content: processedContent,
      originalSubject: template.subject,
      originalContent: template.content,
      variables: template.variables || [],
    };
  }
}

module.exports = new EmailService();

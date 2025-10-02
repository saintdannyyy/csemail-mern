const nodemailer = require("nodemailer");
const Template = require("../models/Template");
const AuditLog = require("../models/AuditLog");
const Settings = require("../models/Settings");

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
      // Try to get settings from database first
      const settings = await Settings.findOne();

      const smtpConfig = {
        host: settings?.smtpHost || process.env.SMTP_HOST,
        port: parseInt(settings?.smtpPort || process.env.SMTP_PORT) || 587,
        secure:
          settings?.smtpSecure !== undefined
            ? settings.smtpSecure
            : process.env.SMTP_SECURE === "true",
        auth: {
          user: settings?.smtpUser || process.env.SMTP_USER,
          pass: settings?.smtpPassword || process.env.SMTP_PASS,
        },
        // Additional SMTP options
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
      };

      // Configure SMTP transporter
      this.transporter = nodemailer.createTransport(smtpConfig);

      // Verify SMTP connection on startup
      this.verifyConnection();
    } catch (error) {
      console.error("Failed to initialize SMTP transporter:", error);
      // Fallback to environment variables only
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
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
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (error) {
      console.error("SMTP connection failed:", error.message);
      console.error(
        "Please check your SMTP configuration in environment variables"
      );
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
    contacts,
    variables = {},
    fromName,
    fromEmail,
    replyTo,
    userId,
    campaignId = null,
    batchSize = 10,
    delay = 1000, // Delay between batches in ms
  }) {
    const results = {
      successful: [],
      failed: [],
      total: contacts.length,
    };

    // Process contacts in batches to avoid overwhelming the email service
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      const batchPromises = batch.map(async (contact) => {
        try {
          const result = await this.sendTemplateEmail({
            templateId,
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
          results.failed.push({
            contact: contact.email,
            error: error.message,
          });
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches if not the last batch
      if (i + batchSize < contacts.length) {
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

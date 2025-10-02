const express = require("express");
const multer = require("multer");
const Template = require("../models/Template");
const Campaign = require("../models/Campaign");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  seedTemplates,
  getTemplatesByCategory,
  getAllPredefinedTemplates,
} = require("../services/templateSeeder");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/json", "text/html", "application/zip"];
    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.endsWith(".html")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JSON, HTML, and ZIP files are allowed."
        )
      );
    }
  },
});

// Get all templates
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { search } = req.query;

      let query = {};

      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { description: new RegExp(search, "i") },
        ];
      }

      const templates = await Template.find(query).sort({
        isDefault: -1,
        createdAt: -1,
      });

      // Map content to htmlContent for frontend compatibility
      const mappedTemplates = templates.map((template) => {
        const templateObj = template.toObject();
        templateObj.htmlContent = templateObj.content;
        return templateObj;
      });

      res.json(mappedTemplates || []);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  }
);

// Seed predefined templates
router.post(
  "/seed",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { force } = req.body;
      const result = await seedTemplates(force);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error("Template seeding error:", error);
      res.status(500).json({ error: "Failed to seed templates" });
    }
  }
);

// Get predefined template library (MUST be before /:id route)
router.get("/library", authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;

    let result;
    if (category) {
      result = await getTemplatesByCategory(category);
    } else {
      result = await getAllPredefinedTemplates();
    }

    console.log("Library result:", result); // Debug log

    if (result.success) {
      let templates;

      if (category) {
        // Category-specific request returns array
        templates = result.templates;
      } else {
        // All templates request returns grouped object, flatten it
        if (Array.isArray(result.templates)) {
          templates = result.templates;
        } else {
          templates = Object.values(result.templates).flat();
        }
      }

      console.log("Templates to map:", templates.length); // Debug log

      // Map content to htmlContent for frontend compatibility
      const mappedTemplates = templates.map((template) => {
        const templateObj = template.toObject ? template.toObject() : template;
        templateObj.htmlContent = templateObj.content;
        return templateObj;
      });

      res.json(mappedTemplates);
    } else {
      console.error("Library error:", result.error); // Debug log
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Get template library error:", error);
    res.status(500).json({ error: "Failed to fetch template library" });
  }
});

// Get single template by ID
router.get(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await Template.findById(id);

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Map content to htmlContent for frontend compatibility
      const templateObj = template.toObject();
      templateObj.htmlContent = templateObj.content;

      res.json(templateObj);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  }
);

// Clone a predefined template to user's templates
router.post(
  "/library/:templateId/clone",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const { name, customizations } = req.body;

      // Find the predefined template
      const sourceTemplate = await Template.findById(templateId);
      if (!sourceTemplate || !sourceTemplate.isPredefined) {
        return res.status(404).json({ error: "Predefined template not found" });
      }

      // Create a new template based on the predefined one
      const clonedTemplate = new Template({
        name: name || `${sourceTemplate.name} (Copy)`,
        description: sourceTemplate.description,
        category: sourceTemplate.category,
        tags: sourceTemplate.tags,
        subject: sourceTemplate.subject,
        content: sourceTemplate.content,
        variables: sourceTemplate.variables,
        isTemplate: false,
        isPredefined: false,
        clonedFrom: sourceTemplate._id,
        createdBy: req.user.userId,
        metadata: {
          ...sourceTemplate.metadata,
          clonedAt: new Date(),
          customizations: customizations || {},
        },
      });

      await clonedTemplate.save();

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_cloned",
        targetType: "template",
        targetId: clonedTemplate._id,
        details: {
          sourceTemplateId: sourceTemplate._id,
          sourceName: sourceTemplate.name,
          newName: clonedTemplate.name,
        },
      });

      res.status(201).json(clonedTemplate);
    } catch (error) {
      console.error("Clone template error:", error);
      res.status(500).json({ error: "Failed to clone template" });
    }
  }
);

// Send test email
router.post(
  "/:templateId/test",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const { testEmails, variables = {} } = req.body;

      if (
        !testEmails ||
        !Array.isArray(testEmails) ||
        testEmails.length === 0
      ) {
        return res.status(400).json({ error: "Test emails are required" });
      }

      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Process template variables
      let processedContent = template.content;
      let processedSubject = template.subject;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        processedContent = processedContent.replace(regex, value);
        processedSubject = processedSubject.replace(regex, value);
      });

      // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate sending
      console.log(`Sending test email to: ${testEmails.join(", ")}`);
      console.log(`Subject: ${processedSubject}`);

      // Log test email send
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_test_sent",
        targetType: "template",
        targetId: template._id,
        details: {
          testEmails,
          templateName: template.name,
          variablesUsed: Object.keys(variables),
        },
      });

      res.json({
        success: true,
        message: `Test email sent to ${testEmails.length} recipient(s)`,
        sentTo: testEmails,
      });
    } catch (error) {
      console.error("Send test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  }
);

// Analyze template for spam score
router.post(
  "/:templateId/analyze",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const { variables = {} } = req.body;

      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Process template variables
      let processedContent = template.content;
      let processedSubject = template.subject;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        processedContent = processedContent.replace(regex, value);
        processedSubject = processedSubject.replace(regex, value);
      });

      // Perform spam analysis (this would integrate with SpamAssassin, MailTester, etc.)
      const analysis = await performSpamAnalysis(
        processedContent,
        processedSubject
      );

      // Log analysis
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_analyzed",
        targetType: "template",
        targetId: template._id,
        details: {
          templateName: template.name,
          spamScore: analysis.spamScore,
          overallScore: analysis.score,
        },
      });

      res.json(analysis);
    } catch (error) {
      console.error("Template analysis error:", error);
      res.status(500).json({ error: "Failed to analyze template" });
    }
  }
);

// Get template compatibility report
router.get(
  "/:templateId/compatibility",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { templateId } = req.params;

      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Analyze template for email client compatibility
      const compatibility = analyzeCompatibility(template.content);

      res.json(compatibility);
    } catch (error) {
      console.error("Template compatibility error:", error);
      res
        .status(500)
        .json({ error: "Failed to analyze template compatibility" });
    }
  }
);

// Helper function for spam analysis
async function performSpamAnalysis(content, subject) {
  // This is a simplified version - in production you'd integrate with actual spam testing services
  const issues = [];
  let spamScore = 0;

  // Check subject line
  if (subject.match(/free|buy now|act now|limited time/i)) {
    spamScore += 2;
    issues.push({
      type: "warning",
      message: "Subject line contains promotional language",
      suggestion:
        "Consider using more neutral language to improve deliverability",
    });
  }

  // Check for unsubscribe link
  if (!content.match(/unsubscribe/i)) {
    spamScore += 3;
    issues.push({
      type: "error",
      message: "Missing unsubscribe link",
      suggestion: "Add an unsubscribe link to comply with regulations",
    });
  }

  // Check HTML to text ratio
  const textContent = content.replace(/<[^>]*>/g, "").trim();
  const htmlLength = content.length;
  const textLength = textContent.length;
  const ratio = textLength / htmlLength;

  if (ratio < 0.1) {
    spamScore += 2;
    issues.push({
      type: "warning",
      message: "Low text to HTML ratio",
      suggestion: "Add more text content to improve deliverability",
    });
  } else {
    issues.push({
      type: "info",
      message: "HTML to text ratio is good",
    });
  }

  // Check for excessive links
  const linkMatches = content.match(/<a[^>]*href/gi);
  const linkCount = linkMatches ? linkMatches.length : 0;

  if (linkCount > 10) {
    spamScore += 1;
    issues.push({
      type: "warning",
      message: "High number of links detected",
      suggestion: "Consider reducing the number of links",
    });
  }

  const overallScore = Math.max(0, 100 - spamScore * 10);
  const deliverability = Math.max(70, 100 - spamScore * 5);

  return {
    score: overallScore,
    issues,
    details: {
      spamScore,
      deliverability,
      compatibility: {
        gmail: true,
        outlook: spamScore < 3,
        apple: true,
        yahoo: spamScore < 2,
        thunderbird: true,
        aol: spamScore < 2,
      },
      performance: {
        loadTime: Math.floor(Math.random() * 1000) + 500,
        size: Math.round((content.length / 1024) * 100) / 100, // Size in KB
      },
    },
  };
}

// Helper function for compatibility analysis
function analyzeCompatibility(content) {
  const issues = [];
  const support = {
    gmail: true,
    outlook: true,
    apple: true,
    yahoo: true,
    thunderbird: true,
    aol: true,
  };

  // Check for CSS features that may not be supported
  if (content.match(/display:\s*flex/i)) {
    support.outlook = false;
    issues.push("Flexbox not supported in Outlook");
  }

  if (content.match(/background-image/i)) {
    support.outlook = false;
    support.gmail = false;
    issues.push("Background images have limited support");
  }

  if (content.match(/position:\s*(absolute|fixed)/i)) {
    support.outlook = false;
    support.gmail = false;
    issues.push("Absolute/fixed positioning not widely supported");
  }

  return {
    support,
    issues,
    recommendations: [
      "Use table-based layouts for better compatibility",
      "Test in multiple email clients before sending",
      "Provide fallback fonts for custom fonts",
      "Use inline CSS for better support",
    ],
  };
}

// Create template
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const {
        name,
        subject,
        content,
        htmlContent, // Support both field names
        description,
        category = "other",
        tags = [],
        variables = [],
        thumbnailUrl,
        isDefault = false,
      } = req.body;

      // Use content if provided, otherwise use htmlContent
      const templateContent = content || htmlContent;

      if (!name || !subject || !templateContent) {
        return res
          .status(400)
          .json({ error: "Name, subject, and content are required" });
      }

      const template = new Template({
        name,
        subject,
        content: templateContent, // Always save to content field
        description,
        category,
        tags,
        variables,
        thumbnailUrl,
        isDefault,
        createdBy: req.user.userId,
      });

      await template.save();

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_created",
        targetType: "template",
        targetId: template._id,
        details: { name, description, category },
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  }
);

// Update template
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        subject,
        content,
        htmlContent, // Support both field names
        description,
        category,
        tags,
        variables,
        thumbnailUrl,
        isDefault,
      } = req.body;

      // Use content if provided, otherwise use htmlContent
      const templateContent = content || htmlContent;

      const template = await Template.findByIdAndUpdate(
        id,
        {
          name,
          subject,
          content: templateContent, // Always save to content field
          description,
          category,
          tags,
          variables,
          thumbnailUrl,
          isDefault,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Map content to htmlContent for frontend compatibility
      const templateObj = template.toObject();
      templateObj.htmlContent = templateObj.content;

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_updated",
        targetType: "template",
        targetId: template._id,
        details: { name, description, category },
      });

      res.json(templateObj);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  }
);

// Delete template
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if template is being used in campaigns
      const campaigns = await Campaign.find({ template: id }).limit(1);

      if (campaigns && campaigns.length > 0) {
        return res.status(400).json({
          error: "Template is being used by campaigns and cannot be deleted",
        });
      }

      const template = await Template.findByIdAndDelete(id);

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_deleted",
        targetType: "template",
        targetId: template._id,
        details: { name: template.name },
      });

      res.json({ message: "Template deleted successfully", template });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  }
);

// Duplicate template
router.post(
  "/:id/duplicate",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get original template
      const originalTemplate = await Template.findById(id);

      if (!originalTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Create duplicate
      const newTemplate = new Template({
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        htmlContent: originalTemplate.htmlContent,
        thumbnailUrl: originalTemplate.thumbnailUrl,
        isDefault: false,
        createdBy: req.user.userId,
      });

      await newTemplate.save();

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_duplicated",
        targetType: "template",
        targetId: newTemplate._id,
        details: { originalId: id, originalName: originalTemplate.name },
      });

      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Duplicate template error:", error);
      res.status(500).json({ error: "Failed to duplicate template" });
    }
  }
);

// Import template from various formats
router.post(
  "/import",
  authenticateToken,
  requireRole(["admin", "editor"]),
  upload.single("template"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const fileExtension = fileName.split(".").pop().toLowerCase();

      let templateData;

      if (fileExtension === "json") {
        const jsonData = JSON.parse(fileBuffer.toString());
        templateData = {
          name: jsonData.name || `Imported Template - ${Date.now()}`,
          description: jsonData.description || "Imported template",
          htmlContent: jsonData.htmlContent || jsonData.content || "",
          thumbnailUrl: jsonData.thumbnailUrl || "",
          isDefault: false,
          createdBy: req.user.userId,
        };
      } else if (fileExtension === "html") {
        const htmlContent = fileBuffer.toString();
        templateData = {
          name: `Imported HTML Template - ${Date.now()}`,
          description: "Imported HTML template",
          htmlContent: htmlContent,
          thumbnailUrl: "",
          isDefault: false,
          createdBy: req.user.userId,
        };
      } else {
        return res
          .status(400)
          .json({ error: "Unsupported file format. Use JSON or HTML files." });
      }

      const template = new Template(templateData);
      await template.save();

      // Log the import activity
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_imported",
        targetType: "template",
        targetId: template._id,
        details: { fileName, fileSize: req.file.size },
      });

      res.json({
        message: "Template imported successfully",
        template: {
          id: template._id,
          name: template.name,
          description: template.description,
        },
      });
    } catch (error) {
      console.error("Template import error:", error);
      res.status(500).json({ error: "Failed to import template" });
    }
  }
);

// Export template in various formats
router.get(
  "/:id/export",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { format = "json" } = req.query;

      const template = await Template.findById(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const exportData = {
        name: template.name,
        description: template.description,
        htmlContent: template.htmlContent,
        thumbnailUrl: template.thumbnailUrl,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: "1.0.0",
          format,
        },
      };

      let responseData, contentType, fileName;

      switch (format) {
        case "json":
          responseData = JSON.stringify(exportData, null, 2);
          contentType = "application/json";
          fileName = `${template.name.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
          break;

        case "html":
          responseData = template.htmlContent;
          contentType = "text/html";
          fileName = `${template.name.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
          break;

        default:
          return res.status(400).json({ error: "Unsupported export format" });
      }

      // Log the export activity
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_exported",
        targetType: "template",
        targetId: template._id,
        details: { format, fileName },
      });

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.send(responseData);
    } catch (error) {
      console.error("Template export error:", error);
      res.status(500).json({ error: "Failed to export template" });
    }
  }
);

// Create a new version of a template
router.post(
  "/:id/versions",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { changes, htmlContent, description } = req.body;

      const originalTemplate = await Template.findById(id);
      if (!originalTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Get the current version number
      const currentVersion = originalTemplate.version || 1;
      const newVersion = currentVersion + 1;

      // Create version history entry if it doesn't exist
      if (!originalTemplate.versionHistory) {
        originalTemplate.versionHistory = [];
      }

      // Save current state as a version
      originalTemplate.versionHistory.push({
        version: currentVersion,
        htmlContent: originalTemplate.htmlContent,
        description: originalTemplate.description,
        changes: changes || "Version created",
        createdAt: new Date(),
        createdBy: req.user.userId,
      });

      // Update template with new content
      originalTemplate.htmlContent =
        htmlContent || originalTemplate.htmlContent;
      originalTemplate.description =
        description || originalTemplate.description;
      originalTemplate.version = newVersion;
      originalTemplate.updatedAt = new Date();

      await originalTemplate.save();

      // Log the version creation
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_version_created",
        targetType: "template",
        targetId: originalTemplate._id,
        details: { version: newVersion, changes },
      });

      res.json({
        message: "Template version created successfully",
        version: newVersion,
        template: originalTemplate,
      });
    } catch (error) {
      console.error("Version creation error:", error);
      res.status(500).json({ error: "Failed to create template version" });
    }
  }
);

// Get version history for a template
router.get(
  "/:id/versions",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const template = await Template.findById(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const versionHistory = template.versionHistory || [];

      // Include current version
      const versions = [
        ...versionHistory,
        {
          version: template.version || 1,
          htmlContent: template.htmlContent,
          description: template.description,
          changes: "Current version",
          createdAt: template.updatedAt,
          createdBy: template.createdBy,
          isCurrent: true,
        },
      ].sort((a, b) => b.version - a.version);

      res.json({ versions });
    } catch (error) {
      console.error("Version history error:", error);
      res.status(500).json({ error: "Failed to retrieve version history" });
    }
  }
);

// Share template with other users
router.post(
  "/:id/share",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email, permission = "view" } = req.body;

      const template = await Template.findById(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Initialize shares array if it doesn't exist
      if (!template.shares) {
        template.shares = [];
      }

      // Check if already shared with this email
      const existingShare = template.shares.find(
        (share) => share.email === email
      );
      if (existingShare) {
        existingShare.permission = permission;
        existingShare.updatedAt = new Date();
      } else {
        template.shares.push({
          email,
          permission,
          sharedAt: new Date(),
          sharedBy: req.user.userId,
        });
      }

      await template.save();

      // Log the sharing activity
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_shared",
        targetType: "template",
        targetId: template._id,
        details: { sharedWith: email, permission },
      });

      res.json({
        message: "Template shared successfully",
        shares: template.shares,
      });
    } catch (error) {
      console.error("Template sharing error:", error);
      res.status(500).json({ error: "Failed to share template" });
    }
  }
);

// Remove template share
router.delete(
  "/:id/share/:shareId",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id, shareId } = req.params;

      const template = await Template.findById(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (!template.shares) {
        return res.status(404).json({ error: "Share not found" });
      }

      template.shares = template.shares.filter(
        (share) => share._id.toString() !== shareId
      );
      await template.save();

      // Log the unsharing activity
      await AuditLog.create({
        userId: req.user.userId,
        action: "template_unshared",
        targetType: "template",
        targetId: template._id,
        details: { shareId },
      });

      res.json({ message: "Template share removed successfully" });
    } catch (error) {
      console.error("Template unsharing error:", error);
      res.status(500).json({ error: "Failed to remove template share" });
    }
  }
);

// Get shared templates for current user
router.get("/shared", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email || req.query.email;

    if (!userEmail) {
      return res
        .status(400)
        .json({ error: "Email required to fetch shared templates" });
    }

    const sharedTemplates = await Template.find({
      "shares.email": userEmail,
      isActive: { $ne: false },
    }).select("name description thumbnailUrl shares createdAt updatedAt");

    res.json({ templates: sharedTemplates });
  } catch (error) {
    console.error("Shared templates error:", error);
    res.status(500).json({ error: "Failed to retrieve shared templates" });
  }
});

module.exports = router;

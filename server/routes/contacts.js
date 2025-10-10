const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const Contact = require("../models/Contact");
const ContactList = require("../models/ContactList");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "server/uploads/" });

// Get all contacts
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, search, status, listId } = req.query;
      const offset = (page - 1) * limit;

      let query = {};

      if (search) {
        query.$or = [
          { email: new RegExp(search, "i") },
          { firstName: new RegExp(search, "i") },
          { lastName: new RegExp(search, "i") },
        ];
      }

      if (status && status !== "all") {
        query.status = status;
      }

      if (listId) {
        query.lists = listId;
      }

      const contacts = await Contact.find(query)
        .populate("lists", "name")
        .skip(offset)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const count = await Contact.countDocuments(query);

      res.json({
        contacts: contacts || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  }
);

// Create contact
router.post(
  "/",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const {
        email,
        firstName,
        lastName,
        phone,
        tags = [],
        customFields = {},
        listIds = [],
      } = req.body;
      console.log("Request Body:", req.body);

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if contact already exists
      const existingContact = await Contact.findOne({
        email: email.toLowerCase(),
      });

      if (existingContact) {
        return res
          .status(409)
          .json({ error: "Contact with this email already exists" });
      }

      // Parse tags if they come as a string
      let parsedTags = [];
      if (tags) {
        if (typeof tags === 'string') {
          try {
            parsedTags = JSON.parse(tags);
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          }
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      }

      // Create contact
      const contact = new Contact({
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone,
        tags:["order", "confirmation", "receipt", "newsletter", "promotion", "ecommerce"],
        customFields,
        status: "active",
        lists: listIds,
        createdBy: req.user._id,
      });

      await contact.save();
      console.log("Created Contact:", contact);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_created",
        targetType: "contact",
        targetId: contact._id,
      });

      res.status(201).json(contact);
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  }
);

// Update contact
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        email,
        firstName,
        lastName,
        phone,
        tags = [],
        customFields = {},
        status,
        listIds = [],
      } = req.body;

      console.log("Update Contact Request:", { id, body: req.body });

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find existing contact
      const existingContact = await Contact.findById(id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // If email is being updated, check for duplicates
      if (email && email.toLowerCase() !== existingContact.email) {
        const emailExists = await Contact.findOne({
          email: email.toLowerCase(),
          _id: { $ne: id },
        });

        if (emailExists) {
          return res.status(409).json({
            error: "Contact with this email already exists",
          });
        }
      }

      // Parse tags if they come as a string
      let parsedTags = tags;
      if (tags) {
        if (typeof tags === 'string') {
          try {
            parsedTags = JSON.parse(tags);
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          }
        }
      }

      // Prepare update data
      const updateData = {
        ...(email && { email: email.toLowerCase() }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(tags !== undefined && { tags: parsedTags }),
        ...(customFields && { customFields }),
        ...(status && { status }),
        ...(listIds && { lists: listIds }),
        updatedAt: new Date(),
        updatedBy: req.user._id,
      };

      // Update contact
      const updatedContact = await Contact.findByIdAndUpdate(id, updateData, {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
      }).populate("lists", "name");

      // console.log("Updated Contact:", updatedContact);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_updated",
        targetType: "contact",
        targetId: updatedContact._id,
        details: {
          changes: updateData,
          previousValues: {
            email: existingContact.email,
            firstName: existingContact.firstName,
            lastName: existingContact.lastName,
            status: existingContact.status,
          },
        },
      });

      res.json(updatedContact);
    } catch (error) {
      console.error("Update contact error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors,
        });
      }

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to update contact" });
    }
  }
);

// Delete contact
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Delete Contact Request:", { id });

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find and delete contact
      const deletedContact = await Contact.findByIdAndDelete(id);

      if (!deletedContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      console.log("Deleted Contact:", deletedContact._id);

      // Log audit event
      await AuditLog.create({
        userId: req.user._id,
        action: "contact_deleted",
        targetType: "contact",
        targetId: deletedContact._id,
        details: {
          deletedContact: {
            email: deletedContact.email,
            firstName: deletedContact.firstName,
            lastName: deletedContact.lastName,
          },
        },
      });

      res.json({
        message: "Contact deleted successfully",
        deletedContact: {
          id: deletedContact._id,
          email: deletedContact.email,
          firstName: deletedContact.firstName,
          lastName: deletedContact.lastName,
        },
      });
    } catch (error) {
      console.error("Delete contact error:", error);

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to delete contact" });
    }
  }
);

// Get contact lists
router.get(
  "/lists",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      console.log("GET /api/contacts/lists - Fetching contact lists");

      const lists = await ContactList.find().sort({ createdAt: -1 });

      console.log(`Found ${lists.length} contact lists`);

      // Format the response
      const formattedLists = lists.map((list) => ({
        _id: list._id,
        name: list.name,
        description: list.description,
        contactCount: list.contactCount || 0,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      }));

      res.json({ lists: formattedLists });
    } catch (error) {
      console.error("Get lists error:", error);
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  }
);

// Get single contact
router.get(
  "/:id",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("Get Contact Request:", { id });

      // Validate contact ID
      if (!id) {
        return res.status(400).json({ error: "Contact ID is required" });
      }

      // Find contact
      const contact = await Contact.findById(id).populate("lists", "name");

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);

      // Handle cast errors (invalid ObjectId)
      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid contact ID format" });
      }

      res.status(500).json({ error: "Failed to fetch contact" });
    }
  }
);

// Import contacts from CSV/Excel
router.post(
  "/import",
  authenticateToken,
  requireRole(["admin", "editor"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const { listId, mapping } = req.body;
      const file = req.file;
      // console.log("Uploaded File:", file);

      if (!file) {
        return res.status(400).json({ error: "File is required" });
      }

      const contacts = [];
      const errors = [];
      let processed = 0;
      let imported = 0;
      let skipped = 0;

      // Parse file based on extension
      if (file.originalname.endsWith(".csv")) {
        // Parse CSV
        console.log("file is csv");
        const results = [];
        
        await new Promise((resolve, reject) => {
          fs.createReadStream(file.path)
            .pipe(csv())
            .on("data", (data) => {
              console.log("CSV Row:", data);
              results.push(data);
            })
            .on("end", () => {
              console.log("CSV parsing completed, total rows:", results.length);
              resolve();
            })
            .on("error", reject);
        });
        
        await processContacts(results);
      } else if (
        file.originalname.endsWith(".xlsx") ||
        file.originalname.endsWith(".xls")
      ) {
        // Parse Excel
        console.log("file is excel");
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const results = XLSX.utils.sheet_to_json(worksheet);
        await processContacts(results);
      } else {
        return res.status(400).json({ error: "Unsupported file format" });
      }

      async function processContacts(data) {
        const mappingObj = JSON.parse(mapping || "{}");

        for (const row of data) {
          processed++;

          try {
            // Extract fields with proper fallbacks
            const email = row[mappingObj.email || "email"] || row["Email"] || row["EMAIL"];
            let firstName = row[mappingObj.firstName || "firstName"] || row["First Name"] || row["first_name"] || row["FIRST_NAME"];
            let lastName = row[mappingObj.lastName || "lastName"] || row["Last Name"] || row["last_name"] || row["LAST_NAME"];
            const company = row[mappingObj.company || "company"] || row["Company"] || row["COMPANY"];
            const position = row[mappingObj.position || "position"] || row["Position"] || row["POSITION"];

            // Validate email
            if (!email || !email.includes("@")) {
              errors.push(`Row ${processed}: Invalid or missing email`);
              skipped++;
              continue;
            }

            // Handle missing required fields
            if (!firstName) {
              firstName = "Unknown";
            }
            if (!lastName) {
              lastName = "Contact";
            }

            console.log("Processing email:", email);

            // Check if contact exists
            const existingContact = await Contact.findOne({
              email: email.toLowerCase(),
            });

            if (existingContact) {
              console.log("Contact already exists, skipping:", email);
              skipped++;
              continue; // Add continue to skip to next iteration
            }

            // Create contact
            const contact = new Contact({
              email: email.toLowerCase(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              status: "active",
              lists: listId ? [listId] : [],
              customFields: {
                ...(company && { company: company.trim() }),
                ...(position && { position: position.trim() })
              },
              createdBy: req.user._id,
            });

            const savedContact = await contact.save();
            
            if (savedContact) {
              console.log("Successfully imported contact:", savedContact.email);
              imported++; // Increment the imported counter
            } else {
              console.log("Failed to save contact:", email);
              errors.push(`Row ${processed}: Failed to save contact`);
              skipped++;
            }

          } catch (error) {
            console.error(`Error processing row ${processed}:`, error.message);
            errors.push(`Row ${processed}: ${error.message}`);
            skipped++;
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // Log audit event
        await AuditLog.create({
          userId: req.user._id,
          action: "contacts_imported",
          targetType: "contact",
          details: { processed, imported, skipped, errors: errors.length },
        });

        res.json({
          message: "Import completed",
          summary: {
            processed,
            imported,
            skipped,
            errors: errors.length,
          },
          errors: errors.slice(0, 10), // Return first 10 errors
          importedCount: imported, // Add this for frontend compatibility
          totalCount: processed,
        });
      }
    } catch (error) {
      console.error("Import contacts error:", error);
      res.status(500).json({ error: "Failed to import contacts" });
    }
  }
);

// Create contact list
router.post(
  "/lists",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      console.log("POST /api/contacts/lists - Creating contact list");
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "List name is required" });
      }

      const list = new ContactList({
        name,
        description,
        createdBy: req.user.userId,
        contactCount: 0,
      });

      await list.save();

      console.log("Contact list created:", list._id);

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "list_created",
        targetType: "list",
        targetId: list._id,
        details: { name, description },
      });

      res.status(201).json(list);
    } catch (error) {
      console.error("Create list error:", error);
      res.status(500).json({ error: "Failed to create list" });
    }
  }
);

// Export contacts
router.get(
  "/export",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const {
        format = "csv",
        fields = "firstName,lastName,email,phone,company,position,tags,status,createdAt",
        filterType = "all",
      } = req.query;

      console.log("Export Contacts Request:", { format, fields, filterType });

      // Parse fields
      const includeFields = fields.split(",").filter((field) => field.trim());

      // Build query based on filterType
      let query = {};
      // For now, we'll export all contacts. In the future, you can add filter logic here

      // Fetch contacts
      const contacts = await Contact.find(query).sort({ createdAt: -1 });

      if (!contacts || contacts.length === 0) {
        return res.status(404).json({ error: "No contacts found" });
      }

      console.log(`Exporting ${contacts.length} contacts in ${format} format`);

      // Map contacts to include only requested fields
      const mappedContacts = contacts.map((contact) => {
        const contactObj = {};

        includeFields.forEach((field) => {
          switch (field.trim()) {
            case "firstName":
              contactObj["First Name"] = contact.firstName || "";
              break;
            case "lastName":
              contactObj["Last Name"] = contact.lastName || "";
              break;
            case "email":
              contactObj["Email"] = contact.email || "";
              break;
            case "phone":
              contactObj["Phone"] = contact.phone || "";
              break;
            case "company":
              contactObj["Company"] = contact.customFields?.company || "";
              break;
            case "position":
              contactObj["Position"] = contact.customFields?.position || "";
              break;
            case "tags":
              contactObj["Tags"] = contact.tags ? contact.tags.join(", ") : "";
              break;
            case "status":
              contactObj["Status"] = contact.status || "";
              break;
            case "createdAt":
              contactObj["Date Added"] = contact.createdAt
                ? new Date(contact.createdAt).toLocaleDateString()
                : "";
              break;
            case "lastActivity":
              contactObj["Last Activity"] = contact.lastActivity
                ? new Date(contact.lastActivity).toLocaleDateString()
                : "";
              break;
          }
        });

        return contactObj;
      });

      // Generate export based on format
      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contacts_${Date.now()}.json`
        );
        return res.json(mappedContacts);
      } else if (format === "csv") {
        // Generate CSV
        const csv = require("csv-parser");
        let csvContent = "";

        // Headers
        if (mappedContacts.length > 0) {
          csvContent = Object.keys(mappedContacts[0]).join(",") + "\n";

          // Data rows
          mappedContacts.forEach((contact) => {
            const row = Object.values(contact)
              .map((value) => {
                // Escape commas and quotes in CSV
                if (
                  typeof value === "string" &&
                  (value.includes(",") || value.includes('"'))
                ) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(",");
            csvContent += row + "\n";
          });
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contacts_${Date.now()}.csv`
        );
        return res.send(csvContent);
      } else if (format === "xlsx") {
        const XLSX = require("xlsx");

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(mappedContacts);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contacts_${Date.now()}.xlsx`
        );
        return res.send(excelBuffer);
      } else {
        return res.status(400).json({ error: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Export contacts error:", error);
      res.status(500).json({ error: "Failed to export contacts" });
    }
  }
);

module.exports = router;

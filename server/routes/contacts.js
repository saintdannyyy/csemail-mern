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
        tags = [],
        customFields = {},
        listIds = [],
      } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

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
              tags = [],
              customFields = {},
              listIds = [],
            } = req.body;

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

            // Create contact
            const contact = new Contact({
              email: email.toLowerCase(),
              firstName,
              lastName,
              tags,
              customFields,
              status: "active",
              lists: listIds,
              createdBy: req.user.userId,
            });

            await contact.save();

            // Log audit event
            await AuditLog.create({
              userId: req.user.userId,
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
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Failed to create contact" });
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
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on("data", (data) => results.push(data))
          .on("end", async () => {
            await processContacts(results);
          });
      } else if (
        file.originalname.endsWith(".xlsx") ||
        file.originalname.endsWith(".xls")
      ) {
        // Parse Excel
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
            const email = row[mappingObj.email || "email"];
            const firstName = row[mappingObj.firstName || "first_name"];
            const lastName = row[mappingObj.lastName || "last_name"];

            if (!email || !email.includes("@")) {
              errors.push(`Row ${processed}: Invalid email`);
              skipped++;
              continue;
            }

            // Check if contact exists
            const existingContact = await Contact.findOne({
              email: email.toLowerCase(),
            });

            if (existingContact) {
              skipped++;
              continue;
            }

            // Create contact
            const contact = new Contact({
              email: email.toLowerCase(),
              firstName,
              lastName,
              status: "active",
              customFields: row,
              lists: listId ? [listId] : [],
              createdBy: req.user.userId,
            });

            await contact.save();

            imported++;
          } catch (error) {
            errors.push(`Row ${processed}: ${error.message}`);
            skipped++;
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // Log audit event
        await AuditLog.create({
          userId: req.user.userId,
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
        });
      }
    } catch (error) {
      console.error("Import contacts error:", error);
      res.status(500).json({ error: "Failed to import contacts" });
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
      const lists = await ContactList.find()
        .populate("contacts", "_id")
        .sort({ createdAt: -1 });

      // Add contact count to each list
      const listsWithCount = lists.map((list) => ({
        ...list.toObject(),
        contact_lists: [{ count: list.contacts.length }],
      }));

      res.json(listsWithCount || []);
    } catch (error) {
      console.error("Get lists error:", error);
      res.status(500).json({ error: "Failed to fetch lists" });
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
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "List name is required" });
      }

      // Create contact list
      router.post(
        "/lists",
        authenticateToken,
        requireRole(["admin", "editor"]),
        async (req, res) => {
          try {
            const { name, description } = req.body;

            if (!name) {
              return res.status(400).json({ error: "List name is required" });
            }

            const list = new ContactList({
              name,
              description,
              createdBy: req.user.userId,
            });

            await list.save();

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
    } catch (error) {
      console.error("Create list error:", error);
      res.status(500).json({ error: "Failed to create list" });
    }
  }
);

module.exports = router;

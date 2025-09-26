const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
// const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'server/uploads/' });

// Get all contacts
router.get('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, listId } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('contacts')
      .select(`
        *,
        contact_lists!inner(list_id, lists!inner(name))
      `)
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (listId) {
      query = query.eq('contact_lists.list_id', listId);
    }

    const { data: contacts, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get total count
    let countQuery = supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    res.json({
      contacts: contacts || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Create contact
router.post('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { email, firstName, lastName, tags = [], customFields = {}, listIds = [] } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingContact) {
      return res.status(409).json({ error: 'Contact with this email already exists' });
    }

    // Create contact
    const contactId = uuidv4();
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        id: contactId,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        tags,
        custom_fields: customFields,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Add to lists
    if (listIds.length > 0) {
      const listAssociations = listIds.map(listId => ({
        contact_id: contactId,
        list_id: listId
      }));

      await supabase.from('contact_lists').insert(listAssociations);
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'contact_created',
      target_type: 'contact',
      target_id: contactId,
      details: { email, firstName, lastName }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Import contacts from CSV/Excel
router.post('/import', authenticateToken, requireRole(['admin', 'editor']), upload.single('file'), async (req, res) => {
  try {
    const { listId, mapping } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const contacts = [];
    const errors = [];
    let processed = 0;
    let imported = 0;
    let skipped = 0;

    // Parse file based on extension
    if (file.originalname.endsWith('.csv')) {
      // Parse CSV
      const results = [];
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          await processContacts(results);
        });
    } else if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      // Parse Excel
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const results = XLSX.utils.sheet_to_json(worksheet);
      await processContacts(results);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    async function processContacts(data) {
      const mappingObj = JSON.parse(mapping || '{}');
      
      for (const row of data) {
        processed++;
        
        try {
          const email = row[mappingObj.email || 'email'];
          const firstName = row[mappingObj.firstName || 'first_name'];
          const lastName = row[mappingObj.lastName || 'last_name'];

          if (!email || !email.includes('@')) {
            errors.push(`Row ${processed}: Invalid email`);
            skipped++;
            continue;
          }

          // Check if contact exists
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

          if (existingContact) {
            skipped++;
            continue;
          }

          // Create contact
          const contactId = uuidv4();
          const { error } = await supabase
            .from('contacts')
            .insert({
              id: contactId,
              email: email.toLowerCase(),
              first_name: firstName,
              last_name: lastName,
              status: 'active',
              custom_fields: row
            });

          if (error) throw error;

          // Add to list if specified
          if (listId) {
            await supabase.from('contact_lists').insert({
              contact_id: contactId,
              list_id: listId
            });
          }

          imported++;
        } catch (error) {
          errors.push(`Row ${processed}: ${error.message}`);
          skipped++;
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      // Log audit event
      await supabase.from('audit_logs').insert({
        user_id: req.user.id,
        action: 'contacts_imported',
        target_type: 'contact',
        details: { processed, imported, skipped, errors: errors.length }
      });

      res.json({
        message: 'Import completed',
        summary: {
          processed,
          imported,
          skipped,
          errors: errors.length
        },
        errors: errors.slice(0, 10) // Return first 10 errors
      });
    }
  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
});

// Get contact lists
router.get('/lists', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { data: lists, error } = await supabase
      .from('lists')
      .select(`
        *,
        contact_lists(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(lists || []);
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Create contact list
router.post('/lists', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'List name is required' });
    }

    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        id: uuidv4(),
        name,
        description
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'list_created',
      target_type: 'list',
      target_id: list.id,
      details: { name, description }
    });

    res.status(201).json(list);
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

module.exports = router;
const express = require('express');
// const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all templates
router.get('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('email_templates')
      .select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: templates, error } = await query.order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(templates || []);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
router.post('/', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { name, description, htmlContent, thumbnailUrl, isDefault = false } = req.body;

    if (!name || !htmlContent) {
      return res.status(400).json({ error: 'Name and HTML content are required' });
    }

    const templateId = uuidv4();
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        id: templateId,
        name,
        description,
        html_content: htmlContent,
        thumbnail_url: thumbnailUrl,
        is_default: isDefault,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'template_created',
      target_type: 'template',
      target_id: templateId,
      details: { name, description }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, htmlContent, thumbnailUrl, isDefault } = req.body;

    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        name,
        description,
        html_content: htmlContent,
        thumbnail_url: thumbnailUrl,
        is_default: isDefault,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'template_updated',
      target_type: 'template',
      target_id: id,
      details: { name, description }
    });

    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template is being used in campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('template_id', id)
      .limit(1);

    if (campaigns && campaigns.length > 0) {
      return res.status(400).json({ error: 'Template is being used by campaigns and cannot be deleted' });
    }

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'template_deleted',
      target_type: 'template',
      target_id: id
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Duplicate template
router.post('/:id/duplicate', authenticateToken, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get original template
    const { data: originalTemplate, error: getError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !originalTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create duplicate
    const newTemplateId = uuidv4();
    const { data: newTemplate, error: createError } = await supabase
      .from('email_templates')
      .insert({
        id: newTemplateId,
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        html_content: originalTemplate.html_content,
        thumbnail_url: originalTemplate.thumbnail_url,
        is_default: false,
        created_by: req.user.id
      })
      .select()
      .single();

    if (createError) throw createError;

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'template_duplicated',
      target_type: 'template',
      target_id: newTemplateId,
      details: { originalId: id, originalName: originalTemplate.name }
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

module.exports = router;
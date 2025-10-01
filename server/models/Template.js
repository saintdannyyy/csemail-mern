const mongoose = require("mongoose");

const variableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["text", "email", "url", "date", "number"], default: "text" },
  defaultValue: { type: String, default: "" },
  required: { type: Boolean, default: false },
  description: { type: String }
});

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    description: { type: String },
    category: { 
      type: String, 
      enum: ["welcome", "newsletter", "promotional", "transactional", "announcement", "reminder", "survey", "other"], 
      default: "other" 
    },
    tags: [{ type: String }],
    type: { type: String, enum: ["html", "text"], default: "html" },
    variables: [variableSchema],
    thumbnailUrl: { type: String },
    previewImages: {
      desktop: { type: String },
      mobile: { type: String }
    },
    isDefault: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    parentTemplate: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date },
    metadata: {
      estimatedSize: { type: Number }, // Email size in KB
      wordCount: { type: Number },
      imageCount: { type: Number },
      linkCount: { type: Number }
    }
  },
  { timestamps: true }
);

// Index for better search performance
templateSchema.index({ name: 'text', description: 'text', tags: 'text' });
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ createdBy: 1, isActive: 1 });

// Virtual for formatted creation date
templateSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to increment usage count
templateSchema.methods.recordUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to create a new version
templateSchema.methods.createVersion = function(updates) {
  const newTemplate = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    name: updates.name || `${this.name} (v${this.version + 1})`,
    content: updates.content || this.content,
    subject: updates.subject || this.subject,
    version: this.version + 1,
    parentTemplate: this.parentTemplate || this._id,
    createdAt: undefined,
    updatedAt: undefined
  });
  return newTemplate;
};

// Static method to get template by category
templateSchema.statics.getByCategory = function(category, isActive = true) {
  return this.find({ category, isActive }).sort({ usageCount: -1, createdAt: -1 });
};

const Template = mongoose.model("Template", templateSchema);
module.exports = Template;

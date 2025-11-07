import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "./ui/select"
import { Contact } from "../../types";

interface ContactFormDialogProps {
  contact?: Contact;
  onSave: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ContactFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  tags: string[];
  customFields: {
    company?: string;
    position?: string;
    // [key: string]: string | undefined
  };
  status: "active" | "unsubscribed" | "bounced" | "complained";
  listIds: string[];
}

export function ContactFormDialog({
  contact,
  onSave,
  onCancel,
  trigger,
  open,
  onOpenChange,
}: ContactFormDialogProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    email: contact?.email || "",
    firstName: contact?.firstName || "",
    lastName: contact?.lastName || "",
    phone: contact?.phone || "",
    tags: contact?.tags || [],
    customFields: contact?.customFields || {},
    status: contact?.status || "active",
    listIds: contact?.listIds || [],
  });
  // const [newTag, setNewTag] = useState('')
  const [newCustomField, setNewCustomField] = useState({ key: "", value: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email) {
      alert("Email is required");
      return;
    }

    onSave(formData);

    // Reset form if creating new contact
    if (!contact) {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        tags: [],
        customFields: {},
        status: "active",
        listIds: [],
      });
    }
  };

  // const addTag = () => {
  //   if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
  //     setFormData(prev => ({
  //       ...prev,
  //       tags: [...prev.tags, newTag.trim()]
  //     }))
  //     setNewTag('')
  //   }
  // }

  // const removeTag = (tagToRemove: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     tags: prev.tags.filter(tag => tag !== tagToRemove)
  //   }))
  // }

  const addCustomField = () => {
    if (newCustomField.key.trim() && newCustomField.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [newCustomField.key.trim()]: newCustomField.value.trim(),
        },
      }));
      setNewCustomField({ key: "", value: "" });
    }
  };

  const removeCustomField = (keyToRemove: string) => {
    setFormData((prev) => {
      const newCustomFields = { ...prev.customFields };
      // delete newCustomFields[keyToRemove];
      return {
        ...prev,
        customFields: newCustomFields,
      };
    });
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Contact
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? "Update the contact information below."
              : "Fill in the details to create a new contact."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Enter phone number"
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'unsubscribed' | 'bounced' | 'complained') =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complained">Complained</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* Company and Position Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.customFields.company || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customFields: {
                      ...prev.customFields,
                      company: e.target.value,
                    },
                  }))
                }
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.customFields.position || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customFields: {
                      ...prev.customFields,
                      position: e.target.value,
                    },
                  }))
                }
                placeholder="Enter job position"
              />
            </div>
          </div>

          {/* Tags Section */}
          {/* <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Custom Fields Section */}
          {/* <div className="space-y-2">
            <Label>Custom Fields</Label>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Input
                  value={newCustomField.key}
                  onChange={(e) =>
                    setNewCustomField((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }))
                  }
                  placeholder="Field name"
                />
              </div>
              <div className="col-span-2">
                <Input
                  value={newCustomField.value}
                  onChange={(e) =>
                    setNewCustomField((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  placeholder="Field value"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomField();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addCustomField} size="sm">
                Add
              </Button>
            </div>
            {Object.keys(formData.customFields).length > 0 && (
              <div className="space-y-2 mt-2">
                {Object.entries(formData.customFields).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-muted p-2 rounded-md"
                  >
                    <span className="text-sm">
                      <strong>{key}:</strong> {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCustomField(key)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Reset form to original state when canceling
                if (contact) {
                  setFormData({
                    email: contact.email || "",
                    firstName: contact.firstName || "",
                    lastName: contact.lastName || "",
                    phone: contact.phone || "",
                    tags: contact.tags || [],
                    customFields: contact.customFields || {},
                    status: contact.status || "active",
                    listIds: contact.listIds || [],
                  });
                } else {
                  setFormData({
                    email: "",
                    firstName: "",
                    lastName: "",
                    phone: "",
                    tags: [],
                    customFields: {},
                    status: "active",
                    listIds: [],
                  });
                }
                onCancel?.();
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {contact ? "Update Contact" : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

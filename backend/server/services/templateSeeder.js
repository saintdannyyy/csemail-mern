const Template = require("../models/Template");

const predefinedTemplates = [
  {
    name: "Welcome Email",
    category: "welcome",
    tags: ["onboarding", "welcome", "introduction"],
    subject: "Welcome to {{company_name}}! 🎉",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
  <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to {{company_name}}!</h1>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
        Hi {{first_name}},
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
        We're thrilled to have you join our community! Your account has been successfully created, and you're now ready to explore all the amazing features we have to offer.
      </p>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Getting Started:</h3>
      <ul style="color: #374151; line-height: 1.6; margin: 0; padding-left: 20px;">
        <li>Complete your profile setup</li>
        <li>Explore our documentation</li>
        <li>Join our community forum</li>
        <li>Connect with our support team if you need help</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{dashboard_url}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        Get Started
      </a>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>Need help? Contact us at <a href="mailto:{{support_email}}" style="color: #2563eb;">{{support_email}}</a></p>
    </div>
  </div>
</div>
    `,
    variables: [
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Name of your company",
      },
      {
        name: "first_name",
        type: "text",
        defaultValue: "User",
        required: true,
        description: "User's first name",
      },
      {
        name: "dashboard_url",
        type: "url",
        defaultValue: "/dashboard",
        required: true,
        description: "Link to user dashboard",
      },
      {
        name: "support_email",
        type: "email",
        defaultValue: "support@company.com",
        required: true,
        description: "Support email address",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Newsletter Template",
    category: "newsletter",
    tags: ["newsletter", "updates", "monthly"],
    subject: "{{newsletter_title}} - {{month}} {{year}}",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background-color: #1f2937; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">{{newsletter_title}}</h1>
    <p style="color: #d1d5db; margin: 10px 0 0 0;">{{month}} {{year}} Edition</p>
  </div>
  
  <div style="padding: 30px;">
    <div style="margin-bottom: 30px;">
      <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">{{main_headline}}</h2>
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">{{main_content}}</p>
      <a href="{{main_article_url}}" style="color: #2563eb; text-decoration: none; font-weight: bold;">Read More →</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Quick Updates</h3>
      <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
        <li>{{update_1}}</li>
        <li>{{update_2}}</li>
        <li>{{update_3}}</li>
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 30px;">
      <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">Featured This Month</h3>
      <p style="color: #1e40af; margin: 0; line-height: 1.6;">{{featured_content}}</p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{website_url}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        Visit Our Website
      </a>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">© {{year}} {{company_name}}. All rights reserved.</p>
    <p style="margin: 0;">
      <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | 
      <a href="{{preferences_url}}" style="color: #6b7280;">Update Preferences</a>
    </p>
  </div>
</div>
    `,
    variables: [
      {
        name: "newsletter_title",
        type: "text",
        defaultValue: "Monthly Newsletter",
        required: true,
        description: "Title of the newsletter",
      },
      {
        name: "month",
        type: "text",
        defaultValue: "January",
        required: true,
        description: "Current month",
      },
      {
        name: "year",
        type: "text",
        defaultValue: "2024",
        required: true,
        description: "Current year",
      },
      {
        name: "main_headline",
        type: "text",
        defaultValue: "This Month's Highlights",
        required: true,
        description: "Main article headline",
      },
      {
        name: "main_content",
        type: "textarea",
        defaultValue: "Lorem ipsum dolor sit amet...",
        required: true,
        description: "Main article content",
      },
      {
        name: "main_article_url",
        type: "url",
        defaultValue: "/blog/article",
        required: false,
        description: "Link to full article",
      },
      {
        name: "update_1",
        type: "text",
        defaultValue: "First update",
        required: false,
        description: "First quick update",
      },
      {
        name: "update_2",
        type: "text",
        defaultValue: "Second update",
        required: false,
        description: "Second quick update",
      },
      {
        name: "update_3",
        type: "text",
        defaultValue: "Third update",
        required: false,
        description: "Third quick update",
      },
      {
        name: "featured_content",
        type: "textarea",
        defaultValue: "Featured content description",
        required: false,
        description: "Featured section content",
      },
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Company name",
      },
      {
        name: "website_url",
        type: "url",
        defaultValue: "https://yourwebsite.com",
        required: true,
        description: "Company website URL",
      },
      {
        name: "unsubscribe_url",
        type: "url",
        defaultValue: "/unsubscribe",
        required: true,
        description: "Unsubscribe link",
      },
      {
        name: "preferences_url",
        type: "url",
        defaultValue: "/preferences",
        required: true,
        description: "Email preferences link",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Promotional Sale",
    category: "promotional",
    tags: ["sale", "discount", "promotion", "marketing"],
    subject: "🔥 {{discount_percentage}}% OFF - Limited Time Offer!",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">{{discount_percentage}}% OFF</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 18px;">{{sale_title}}</p>
  </div>
  
  <div style="padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">{{main_headline}}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">{{sale_description}}</p>
    </div>
    
    <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">Use Promo Code:</h3>
      <div style="background-color: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; display: inline-block; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
        {{promo_code}}
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{shop_url}}" style="background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
        Shop Now
      </a>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
      <p style="color: #991b1b; margin: 0; font-weight: bold;">⏰ Hurry! Offer expires {{expiry_date}}</p>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">{{terms_conditions}}</p>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">© {{year}} {{company_name}}. All rights reserved.</p>
    <p style="margin: 0;">
      <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
    </p>
  </div>
</div>
    `,
    variables: [
      {
        name: "discount_percentage",
        type: "number",
        defaultValue: "25",
        required: true,
        description: "Discount percentage",
      },
      {
        name: "sale_title",
        type: "text",
        defaultValue: "Flash Sale",
        required: true,
        description: "Sale event title",
      },
      {
        name: "main_headline",
        type: "text",
        defaultValue: "Don't Miss Out!",
        required: true,
        description: "Main promotional headline",
      },
      {
        name: "sale_description",
        type: "textarea",
        defaultValue:
          "Limited time offer on all products. Save big on your favorite items!",
        required: true,
        description: "Sale description",
      },
      {
        name: "promo_code",
        type: "text",
        defaultValue: "SAVE25",
        required: true,
        description: "Promotional discount code",
      },
      {
        name: "shop_url",
        type: "url",
        defaultValue: "/shop",
        required: true,
        description: "Link to shop/store",
      },
      {
        name: "expiry_date",
        type: "text",
        defaultValue: "December 31st",
        required: true,
        description: "Sale expiry date",
      },
      {
        name: "terms_conditions",
        type: "text",
        defaultValue:
          "Terms and conditions apply. Cannot be combined with other offers.",
        required: false,
        description: "Terms and conditions text",
      },
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Company name",
      },
      {
        name: "year",
        type: "text",
        defaultValue: "2024",
        required: true,
        description: "Current year",
      },
      {
        name: "unsubscribe_url",
        type: "url",
        defaultValue: "/unsubscribe",
        required: true,
        description: "Unsubscribe link",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Order Confirmation",
    category: "transactional",
    tags: ["order", "confirmation", "receipt", "ecommerce"],
    subject: "Order Confirmed - #{{order_number}}",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background-color: #059669; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed!</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0;">Thank you for your purchase</p>
  </div>
  
  <div style="padding: 30px;">
    <div style="margin-bottom: 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
        Hi {{customer_name}},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Great news! We've received your order and it's being processed. Here are the details:
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Number:</td>
          <td style="padding: 8px 0; color: #1f2937; text-align: right;">#{{order_number}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Order Date:</td>
          <td style="padding: 8px 0; color: #1f2937; text-align: right;">{{order_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Total Amount:</td>
          <td style="padding: 8px 0; color: #1f2937; text-align: right; font-weight: bold;">${{
            total_amount,
          }}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Payment Method:</td>
          <td style="padding: 8px 0; color: #1f2937; text-align: right;">{{payment_method}}</td>
        </tr>
      </table>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">Shipping Information</h3>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px;">
        <p style="margin: 0; color: #374151; line-height: 1.6;">
          {{shipping_address}}
        </p>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
          Estimated delivery: {{estimated_delivery}}
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{tracking_url}}" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
        Track Order
      </a>
      <a href="{{account_url}}" style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        View Account
      </a>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>Questions? Contact us at <a href="mailto:{{support_email}}" style="color: #059669;">{{support_email}}</a></p>
    </div>
  </div>
</div>
    `,
    variables: [
      {
        name: "customer_name",
        type: "text",
        defaultValue: "Customer",
        required: true,
        description: "Customer's name",
      },
      {
        name: "order_number",
        type: "text",
        defaultValue: "ORD123456",
        required: true,
        description: "Order number",
      },
      {
        name: "order_date",
        type: "text",
        defaultValue: "January 15, 2024",
        required: true,
        description: "Order date",
      },
      {
        name: "total_amount",
        type: "text",
        defaultValue: "99.99",
        required: true,
        description: "Total order amount",
      },
      {
        name: "payment_method",
        type: "text",
        defaultValue: "Credit Card",
        required: true,
        description: "Payment method used",
      },
      {
        name: "shipping_address",
        type: "textarea",
        defaultValue: "123 Main St\nCity, State 12345",
        required: true,
        description: "Shipping address",
      },
      {
        name: "estimated_delivery",
        type: "text",
        defaultValue: "3-5 business days",
        required: true,
        description: "Estimated delivery time",
      },
      {
        name: "tracking_url",
        type: "url",
        defaultValue: "/track",
        required: true,
        description: "Order tracking URL",
      },
      {
        name: "account_url",
        type: "url",
        defaultValue: "/account",
        required: true,
        description: "Customer account URL",
      },
      {
        name: "support_email",
        type: "email",
        defaultValue: "support@company.com",
        required: true,
        description: "Support email address",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Password Reset",
    category: "transactional",
    tags: ["password", "reset", "security", "authentication"],
    subject: "Reset Your Password - {{company_name}}",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background-color: #1f2937; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
  </div>
  
  <div style="padding: 30px;">
    <div style="margin-bottom: 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
        Hi {{user_name}},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        We received a request to reset your password for your {{company_name}} account. If you didn't make this request, you can safely ignore this email.
      </p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">🔒 Security Notice</h3>
      <p style="color: #92400e; margin: 0; line-height: 1.6;">
        This password reset link will expire in {{expiry_hours}} hours for your security.
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{reset_url}}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Reset My Password
      </a>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
      <p style="color: #374151; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
        If the button above doesn't work, you can copy and paste this link into your browser:
      </p>
      <p style="color: #2563eb; margin: 0; word-break: break-all; font-size: 14px;">
        {{reset_url}}
      </p>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>If you need help, contact us at <a href="mailto:{{support_email}}" style="color: #2563eb;">{{support_email}}</a></p>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">© {{year}} {{company_name}}. All rights reserved.</p>
  </div>
</div>
    `,
    variables: [
      {
        name: "user_name",
        type: "text",
        defaultValue: "User",
        required: true,
        description: "User's name",
      },
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Company name",
      },
      {
        name: "expiry_hours",
        type: "number",
        defaultValue: "24",
        required: true,
        description: "Hours until reset link expires",
      },
      {
        name: "reset_url",
        type: "url",
        defaultValue: "/reset-password?token=abc123",
        required: true,
        description: "Password reset URL with token",
      },
      {
        name: "support_email",
        type: "email",
        defaultValue: "support@company.com",
        required: true,
        description: "Support email address",
      },
      {
        name: "year",
        type: "text",
        defaultValue: "2024",
        required: true,
        description: "Current year",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Event Invitation",
    category: "announcement",
    tags: ["event", "invitation", "webinar", "conference"],
    subject: "You're Invited: {{event_name}} - {{event_date}}",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">You're Invited!</h1>
    <p style="color: #c7d2fe; margin: 10px 0 0 0; font-size: 16px;">{{event_type}}</p>
  </div>
  
  <div style="padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">{{event_name}}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">{{event_description}}</p>
    </div>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; text-align: center;">📅 Event Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-weight: bold; width: 30%;">📅 Date:</td>
          <td style="padding: 10px 0; color: #1f2937;">{{event_date}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">⏰ Time:</td>
          <td style="padding: 10px 0; color: #1f2937;">{{event_time}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">📍 Location:</td>
          <td style="padding: 10px 0; color: #1f2937;">{{event_location}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">🎯 Topics:</td>
          <td style="padding: 10px 0; color: #1f2937;">{{event_topics}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; margin-bottom: 30px;">
      <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">🎁 What You'll Get:</h3>
      <ul style="color: #1e40af; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>{{benefit_1}}</li>
        <li>{{benefit_2}}</li>
        <li>{{benefit_3}}</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{registration_url}}" style="background-color: #6366f1; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">
        Register Now
      </a>
    </div>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
      <p style="color: #dc2626; margin: 0; font-weight: bold;">⏰ Limited Seats Available! Register by {{registration_deadline}}</p>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #6366f1;">{{contact_email}}</a></p>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">© {{year}} {{company_name}}. All rights reserved.</p>
  </div>
</div>
    `,
    variables: [
      {
        name: "event_name",
        type: "text",
        defaultValue: "Annual Conference 2024",
        required: true,
        description: "Name of the event",
      },
      {
        name: "event_type",
        type: "text",
        defaultValue: "Conference",
        required: true,
        description: "Type of event (webinar, conference, workshop, etc.)",
      },
      {
        name: "event_description",
        type: "textarea",
        defaultValue: "Join us for an exciting day of learning and networking!",
        required: true,
        description: "Event description",
      },
      {
        name: "event_date",
        type: "text",
        defaultValue: "March 15, 2024",
        required: true,
        description: "Event date",
      },
      {
        name: "event_time",
        type: "text",
        defaultValue: "9:00 AM - 5:00 PM EST",
        required: true,
        description: "Event time",
      },
      {
        name: "event_location",
        type: "text",
        defaultValue: "Virtual Event",
        required: true,
        description: "Event location or platform",
      },
      {
        name: "event_topics",
        type: "text",
        defaultValue: "Technology, Innovation, Future Trends",
        required: true,
        description: "Main topics/agenda",
      },
      {
        name: "benefit_1",
        type: "text",
        defaultValue: "Expert insights from industry leaders",
        required: false,
        description: "First benefit/feature",
      },
      {
        name: "benefit_2",
        type: "text",
        defaultValue: "Networking opportunities",
        required: false,
        description: "Second benefit/feature",
      },
      {
        name: "benefit_3",
        type: "text",
        defaultValue: "Certificate of completion",
        required: false,
        description: "Third benefit/feature",
      },
      {
        name: "registration_url",
        type: "url",
        defaultValue: "/register",
        required: true,
        description: "Registration/RSVP URL",
      },
      {
        name: "registration_deadline",
        type: "text",
        defaultValue: "March 10, 2024",
        required: true,
        description: "Registration deadline",
      },
      {
        name: "contact_email",
        type: "email",
        defaultValue: "events@company.com",
        required: true,
        description: "Event contact email",
      },
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Company name",
      },
      {
        name: "year",
        type: "text",
        defaultValue: "2024",
        required: true,
        description: "Current year",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Account Suspension Notice",
    category: "transactional",
    tags: ["account", "suspension", "security", "violation"],
    subject: "Important: Account Suspension Notice - {{company_name}}",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background-color: #dc2626; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Account Suspended</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0;">Immediate Action Required</p>
  </div>
  
  <div style="padding: 30px;">
    <div style="margin-bottom: 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
        Dear {{user_name}},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        We regret to inform you that your {{company_name}} account has been temporarily suspended due to {{suspension_reason}}.
      </p>
    </div>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 15px;">⚠️ Suspension Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Account:</td>
          <td style="padding: 8px 0; color: #991b1b;">{{user_email}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0; color: #991b1b;">{{suspension_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Reason:</td>
          <td style="padding: 8px 0; color: #991b1b;">{{suspension_reason}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Reference ID:</td>
          <td style="padding: 8px 0; color: #991b1b;">{{reference_id}}</td>
        </tr>
      </table>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Next Steps</h3>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px;">
        <ol style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review our Terms of Service and Community Guidelines</li>
          <li>Prepare any relevant documentation or evidence</li>
          <li>Contact our support team using the information below</li>
          <li>Wait for our review team to process your appeal</li>
        </ol>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{appeal_url}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
        Submit Appeal
      </a>
      <a href="{{guidelines_url}}" style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        View Guidelines
      </a>
    </div>
    
    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">📞 Need Help?</h3>
      <p style="color: #1e40af; margin: 0; line-height: 1.6;">
        Contact our support team at <a href="mailto:{{support_email}}" style="color: #1e40af;">{{support_email}}</a> or call {{support_phone}} (Mon-Fri, 9AM-5PM).
      </p>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">© {{year}} {{company_name}}. All rights reserved.</p>
  </div>
</div>
    `,
    variables: [
      {
        name: "user_name",
        type: "text",
        defaultValue: "User",
        required: true,
        description: "User's name",
      },
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Company name",
      },
      {
        name: "user_email",
        type: "email",
        defaultValue: "user@example.com",
        required: true,
        description: "User's email address",
      },
      {
        name: "suspension_date",
        type: "text",
        defaultValue: "January 15, 2024",
        required: true,
        description: "Date of suspension",
      },
      {
        name: "suspension_reason",
        type: "text",
        defaultValue: "violation of terms of service",
        required: true,
        description: "Reason for suspension",
      },
      {
        name: "reference_id",
        type: "text",
        defaultValue: "REF123456",
        required: true,
        description: "Reference/case ID",
      },
      {
        name: "appeal_url",
        type: "url",
        defaultValue: "/appeal",
        required: true,
        description: "Appeal submission URL",
      },
      {
        name: "guidelines_url",
        type: "url",
        defaultValue: "/guidelines",
        required: true,
        description: "Community guidelines URL",
      },
      {
        name: "support_email",
        type: "email",
        defaultValue: "support@company.com",
        required: true,
        description: "Support email address",
      },
      {
        name: "support_phone",
        type: "text",
        defaultValue: "1-800-123-4567",
        required: false,
        description: "Support phone number",
      },
      {
        name: "year",
        type: "text",
        defaultValue: "2024",
        required: true,
        description: "Current year",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },

  {
    name: "Product Launch Announcement",
    category: "announcement",
    tags: ["product", "launch", "announcement", "new"],
    subject: "🚀 Introducing {{product_name}} - Now Available!",
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🚀 Now Live!</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 18px;">Introducing {{product_name}}</p>
  </div>
  
  <div style="padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">{{headline}}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">{{product_description}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1f2937; margin-bottom: 20px; text-align: center;">✨ Key Features</h3>
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 25px;">
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1; min-width: 250px; margin-bottom: 20px;">
            <h4 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">🎯 {{feature_1_title}}</h4>
            <p style="color: #374151; margin: 0; line-height: 1.5; font-size: 14px;">{{feature_1_description}}</p>
          </div>
          <div style="flex: 1; min-width: 250px; margin-bottom: 20px;">
            <h4 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">⚡ {{feature_2_title}}</h4>
            <p style="color: #374151; margin: 0; line-height: 1.5; font-size: 14px;">{{feature_2_description}}</p>
          </div>
          <div style="flex: 1; min-width: 250px; margin-bottom: 20px;">
            <h4 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">🔒 {{feature_3_title}}</h4>
            <p style="color: #374151; margin: 0; line-height: 1.5; font-size: 14px;">{{feature_3_description}}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">🎉 Launch Special</h3>
      <p style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">{{special_offer}}</p>
      <p style="color: #92400e; margin: 0; font-size: 14px;">Valid until {{offer_expiry}}</p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{product_url}}" style="background-color: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); margin-right: 10px;">
        Get Started
      </a>
      <a href="{{demo_url}}" style="background-color: #6b7280; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
        View Demo
      </a>
    </div>
    
    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">💬 What Our Beta Users Say</h3>
      <blockquote style="color: #1e40af; margin: 0; font-style: italic; line-height: 1.6;">
        "{{testimonial}}"
        <footer style="margin-top: 10px; font-weight: bold;">— {{testimonial_author}}</footer>
      </blockquote>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">© {{year}} {{company_name}}. All rights reserved.</p>
    <p style="margin: 0;">
      <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
    </p>
  </div>
</div>
    `,
    variables: [
      {
        name: "product_name",
        type: "text",
        defaultValue: "ProductX",
        required: true,
        description: "Name of the new product",
      },
      {
        name: "headline",
        type: "text",
        defaultValue: "The future of productivity is here",
        required: true,
        description: "Main headline",
      },
      {
        name: "product_description",
        type: "textarea",
        defaultValue:
          "Revolutionary new product that will transform how you work and collaborate.",
        required: true,
        description: "Product description",
      },
      {
        name: "feature_1_title",
        type: "text",
        defaultValue: "Smart Integration",
        required: true,
        description: "First feature title",
      },
      {
        name: "feature_1_description",
        type: "text",
        defaultValue: "Seamlessly connects with your existing tools",
        required: true,
        description: "First feature description",
      },
      {
        name: "feature_2_title",
        type: "text",
        defaultValue: "Lightning Fast",
        required: true,
        description: "Second feature title",
      },
      {
        name: "feature_2_description",
        type: "text",
        defaultValue: "Built for speed and performance",
        required: true,
        description: "Second feature description",
      },
      {
        name: "feature_3_title",
        type: "text",
        defaultValue: "Enterprise Security",
        required: true,
        description: "Third feature title",
      },
      {
        name: "feature_3_description",
        type: "text",
        defaultValue: "Bank-level security and compliance",
        required: true,
        description: "Third feature description",
      },
      {
        name: "special_offer",
        type: "text",
        defaultValue: "50% off for the first 3 months",
        required: false,
        description: "Launch special offer",
      },
      {
        name: "offer_expiry",
        type: "text",
        defaultValue: "March 31, 2024",
        required: false,
        description: "Special offer expiry date",
      },
      {
        name: "product_url",
        type: "url",
        defaultValue: "/product",
        required: true,
        description: "Product page URL",
      },
      {
        name: "demo_url",
        type: "url",
        defaultValue: "/demo",
        required: false,
        description: "Demo/trial URL",
      },
      {
        name: "testimonial",
        type: "textarea",
        defaultValue:
          "This product has completely transformed our workflow. Highly recommended!",
        required: false,
        description: "Customer testimonial",
      },
      {
        name: "testimonial_author",
        type: "text",
        defaultValue: "Jane Smith, CEO",
        required: false,
        description: "Testimonial author",
      },
      {
        name: "company_name",
        type: "text",
        defaultValue: "Your Company",
        required: true,
        description: "Company name",
      },
      {
        name: "year",
        type: "text",
        defaultValue: "2024",
        required: true,
        description: "Current year",
      },
      {
        name: "unsubscribe_url",
        type: "url",
        defaultValue: "/unsubscribe",
        required: true,
        description: "Unsubscribe link",
      },
    ],
    isTemplate: true,
    isPredefined: true,
  },
];

const seedTemplates = async () => {
  try {
    console.log("🌱 Starting template seeding...");

    // Check if templates already exist
    const existingCount = await Template.countDocuments({ isPredefined: true });
    if (existingCount > 0) {
      console.log(
        `ℹ️  Found ${existingCount} existing predefined templates. Skipping seed.`
      );
      return {
        success: true,
        message: `${existingCount} predefined templates already exist`,
      };
    }

    // Create templates
    const createdTemplates = [];
    for (const templateData of predefinedTemplates) {
      try {
        // Add default metadata
        templateData.metadata = {
          createdBy: "system",
          industry: "general",
          difficulty: "beginner",
          estimatedTime: "5 minutes",
        };

        const template = new Template(templateData);
        const savedTemplate = await template.save();
        createdTemplates.push(savedTemplate);
        console.log(`✅ Created template: ${savedTemplate.name}`);
      } catch (error) {
        console.error(
          `❌ Error creating template ${templateData.name}:`,
          error.message
        );
      }
    }

    console.log(`🎉 Successfully seeded ${createdTemplates.length} templates!`);
    return {
      success: true,
      message: `Successfully created ${createdTemplates.length} predefined templates`,
      templates: createdTemplates.map((t) => ({
        id: t._id,
        name: t.name,
        category: t.category,
      })),
    };
  } catch (error) {
    console.error("❌ Template seeding failed:", error);
    return { success: false, error: error.message };
  }
};

const getTemplatesByCategory = async (category) => {
  try {
    const templates = await Template.find({
      category,
      isPredefined: true,
    }).select("name category tags subject variables thumbnail");

    return { success: true, templates };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getAllPredefinedTemplates = async () => {
  try {
    const templates = await Template.find({
      isPredefined: true,
    }).select("name category tags subject variables thumbnail metadata");

    // Group by category
    const groupedTemplates = templates.reduce((acc, template) => {
      const category = template.category || "uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {});

    return { success: true, templates: groupedTemplates };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  seedTemplates,
  getTemplatesByCategory,
  getAllPredefinedTemplates,
  predefinedTemplates,
};

# CSE Mail Platform

A modern email marketing and campaign management platform built with the MERN stack (MongoDB, Express.js, React, Node.js). CSE Mail provides a comprehensive solution for managing email campaigns, contacts, and analytics with a clean, intuitive interface.

## Project Structure

```
CSEMail/
├── backend/server/
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication & authorization
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   └── index.js        # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages
│   │   ├── contexts/   # React contexts
│   │   └── utils/      # Utility functions
│   └── public/
└── README.md
```

## Key Features

### 📧 Email Campaign Management

- **Template Editor**: Rich email template creation with drag-and-drop interface
- **Campaign Scheduling**: Schedule campaigns for optimal delivery times
- **Bulk Email Sending**: Efficient processing of large contact lists
- **Variable Substitution**: Personalize emails with dynamic content

### 👥 Contact & List Management

- **Contact Database**: Comprehensive contact management system
- **List Segmentation**: Organize contacts into targeted groups
- **Import/Export**: Bulk contact operations with CSV support
- **Contact Analytics**: Track engagement and interaction history

### 📊 Analytics & Reporting

- **Campaign Performance**: Detailed metrics and success rates
- **Real-time Dashboard**: Live statistics and recent activity monitoring
- **Export Reports**: Generate detailed campaign reports
- **Audit Trail**: Complete action logging for compliance

### ⚙️ Administration

- **User Management**: Role-based access control (Admin, Editor, User)
- **Settings Configuration**: Customizable system settings
- **Queue Monitoring**: Email queue status and management
- **System Health**: Built-in monitoring and diagnostics

## Technical Highlights

### Architecture

- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **TypeScript**: Type-safe development with React frontend
- **RESTful API**: Clean, documented API endpoints
- **Responsive Design**: Mobile-friendly interface using modern CSS

### Security & Performance

- **Authentication**: Secure user authentication and session management
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive data validation and sanitization
- **Optimized Queries**: Efficient database operations with pagination
- **Rate Limiting**: Protection against abuse and overload

### Developer Experience

- **Clean Code**: Well-documented, maintainable codebase
- **Error Handling**: Comprehensive error management and logging
- **Development Tools**: Hot reload, debugging support
- **Scalable Structure**: Modular architecture for easy expansion

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- SMTP email service

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Configure environment variables
4. Initialize the database
5. Start the development servers

### Development

- **Frontend**: React + TypeScript + Vite for fast development
- **Backend**: Express.js + MongoDB with Mongoose ODM
- **API**: RESTful endpoints with comprehensive documentation

## Use Cases

CSE Mail is perfect for:

- **Small to Medium Businesses**: Manage customer communications and marketing campaigns
- **Marketing Teams**: Create, schedule, and track email campaigns
- **E-commerce**: Send order confirmations, newsletters, and promotional emails
- **Organizations**: Internal communications and member outreach
- **Developers**: Self-hosted email marketing solution with full control

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests to help improve the platform.

## License

MIT License - see the LICENSE file for details.

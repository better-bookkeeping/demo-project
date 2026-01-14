# Better Bookkeeping Onboarding App

A comprehensive client onboarding application for Better Bookkeeping built with modern React tooling. This application guides users through uploading tax returns, entering business details, and connecting financial accounts.

## Features

- **Multi-step Onboarding Flow**: Guided step-by-step process including:
  - Tax return document upload and parsing
  - Personal and business details collection
  - Business information management
  - Bank account linking via Plaid
  - Stripe subscription setup (conditional)
  - Completion confirmation

- **Document Processing**: Advanced tax document parsing with real-time progress tracking
- **Financial Integration**: Plaid Link integration for secure bank account connections
- **Google Drive Integration**: Secure document storage and retrieval
- **Auth0 Authentication**: Enterprise-grade user authentication
- **Responsive UI**: Modern interface built with Better Bookkeeping UI components

## Tech Stack

- **Framework**: TanStack Start (React SSR)
- **Router**: TanStack Router (file-based routing)
- **State Management**: TanStack Query + TanStack Form
- **Authentication**: Auth0
- **Database**: Better Bookkeeping DB layer
- **Styling**: Tailwind CSS v4 + Better Bookkeeping UI
- **Runtime**: Bun
- **Testing**: Vitest + React Testing Library

## Development

### Prerequisites

- Bun runtime installed
- Better Bookkeeping database access
- Auth0 configuration
- Google Drive API credentials
- Plaid API keys
- Document parsing service running locally
- Stripe sync service running locally (for webhook processing)

### Local Development

```bash
# Install dependencies
bun install

# Start development server (port 3000)
bun run dev

# Run with Docker (port 3200)
bun run dev:docker
```

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run test` - Run tests with Vitest
- `bun run typecheck` - Run TypeScript type checking
- `bun run format` - Format code with Prettier

### Docker Development

For full development environment with all services:

```bash
# Start all services
bun run dev:docker

# Stop services
bun run dev:docker:down
```

The Docker setup includes volume mounts for hot reloading and runs on port 3200.

## Project Structure

```
src/
├── routes/                    # File-based routing
│   ├── __index/              # Onboarding flow routes
│   │   ├── _layout.upload-returns/
│   │   ├── _layout.basic-details/
│   │   ├── _layout.businesses/
│   │   ├── _layout.business-details/
│   │   ├── _layout.link-accounts/
│   │   ├── _layout.billing/     # Stripe subscription setup (conditional)
│   │   └── _layout.success/
│   ├── auth/                 # Authentication routes
│   └── __root.tsx           # Root layout
├── components/               # Reusable components
├── hooks/                   # Custom React hooks (includes useTotalSteps)
├── lib/                     # Business logic
│   ├── onboarding/          # Onboarding-specific logic
│   ├── document-parser/     # Document processing
│   ├── plaid/              # Financial integration
│   └── stripe/             # Stripe subscription management
├── stores/                  # Client state management
└── integrations/           # Third-party integrations
```

## Key Integrations

### Authentication (Auth0)

- User authentication and session management
- Secure token handling
- Role-based access control

### Document Processing

- Google Drive file storage
- Automated tax return parsing
- Real-time processing status updates

### Financial Services (Plaid)

- Bank account verification
- Secure account linking
- Institution data retrieval

### Billing Integration (Stripe)

- Conditional subscription setup step
- Embedded Stripe Checkout for payment collection
- Support for recurring subscriptions and one-time invoices
- Dynamic step indicator based on payment requirements
- Test mode utilities for development

### Database Integration

- Better Bookkeeping DB integration
- Form data persistence
- Business entity management
- Stripe subscription and payment tracking

## Development Tools

- **TanStack DevTools**: Router and Query debugging panel
- **Dev Navigator**: Development-only navigation shortcuts
- **TypeScript**: Full type safety with path aliases (`@/*`)
- **Hot Reload**: Instant development feedback

## Environment Variables

Required environment variables (see `.env.example`):

- Auth0 configuration
- Google Drive API credentials
- Plaid API keys
- Stripe API keys (secret key and public key)
- Better Bookkeeping DB connection
- Document parser service URLs

## Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test --watch
```

## Deployment

```bash
# Build for production
bun run build

# Start production server
bun run start
```

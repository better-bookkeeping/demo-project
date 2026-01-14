---
name: m-implement-stripe-onboarding-step
branch: feature/m-implement-stripe-onboarding-step
status: completed
created: 2025-12-02
---

# Implement Stripe Subscription Step in Onboarding

## Problem/Goal
When a user being onboarded already has a subscription (created by an admin but not yet linked to a Stripe subscriptionId), we need an additional step for them to set up and activate their subscription via Stripe Checkout.

This ties into an invite flow where admins can:
1. Add a user before they create their account
2. Create a subscription with amount and payment info
3. Give them a link to claim the account and complete subscription setup

The subscription step should show the Stripe embedded checkout UI (similar to the main app's Billing page) to activate their `awaiting_initial_payment` subscription, then display subscription details once active.

## Success Criteria
- [x] New `/billing` route added as conditional step in onboarding flow
- [x] Server functions to fetch user's subscriptions and create Stripe checkout sessions
- [x] SubscriptionCard component showing subscription details and "Complete Payment" action
- [x] CheckoutModal with Stripe embedded checkout (adapted from main app)
- [x] Step only shows when user has subscriptions with `awaiting_initial_payment` status
- [x] After payment completion, shows active subscription details
- [x] Step indicator updated to handle conditional billing step
- [x] Navigation flow: link-accounts → billing (if subscriptions) → success
- [x] Typecheck passes

## Context Manifest

### How the Onboarding Flow Currently Works

The onboarding application uses TanStack Router with file-based routing and SSR. Each step is a separate route under the `__index/_layout` pattern, creating a consistent layout wrapper with authentication and document parser setup.

**Route Structure and Navigation:**

The onboarding routes are structured as:
- `/upload-returns` (Step 1) - Upload tax documents
- `/basic-details` (Step 2) - Personal information
- `/businesses` (Step 3) - Select/add businesses to service
- `/business-details` (Step 4) - Detailed business configuration
- `/link-accounts` (Step 5) - Connect bank accounts via Plaid
- `/success` (Final) - Completion screen with redirect to main app

All authenticated routes exist under the `__index/_layout.tsx` file, which provides:
1. Authentication check via `beforeLoad` - redirects to `/sign-in` if no user or docParserJWT
2. Document parser client provider
3. Parsing overlay component for file uploads
4. Dev navigation dropdown (in dev/test environments only)

The root `/` route (`src/routes/__index/index.tsx`) immediately redirects to `/upload-returns` to start the flow.

**Step Indicator Component:**

The `StepIndicator` component (`src/components/step-indicator.tsx`) displays progress with numbered circles:
- Takes `currentStep`, `steps` (array of step numbers, defaults to `[1, 2, 3, 4, 5]`), and optional `previousStep`
- Completed steps show checkmarks with animation
- Active steps (including current) are highlighted in primary color
- Uses motion/react for smooth animations on newly completed steps

**OnboardingStepLayout Component:**

Every onboarding step uses the `OnboardingStepLayout` component (`src/components/onboarding-step-layout.tsx`):
- Two-column layout: left side is the form/content, right side (desktop only) shows title and description
- Fixed header with StepIndicator
- Scrollable content area
- Fixed footer with Back/Continue buttons
- Props include:
  - `currentStep`, `previousStep` - for step indicator
  - `mobileTitle`, `desktopTitle`, `desktopDescription`, `mobileBottomText` - content text
  - `onBack`, `onContinue` - navigation handlers
  - `continueDisabled`, `isSubmitting` - button states
  - `maxWidth` - Tailwind class for content width (defaults to "max-w-4xl")
  - `hideBackButton` - optional flag to hide back button

**Data Loading Pattern:**

Each route follows this pattern:
1. Loader function uses `context.queryClient.ensureQueryData(getOnboardingFormQueryOptions)` to prefetch user data
2. Component uses `useSuspenseQuery(getOnboardingFormQueryOptions)` to access data
3. Query options are defined in `src/lib/onboarding-form.query.ts` with key `["onboarding-form"]`
4. Server function `getOnboardingFormServerFn` fetches the full onboarding form with all relations

**Navigation Between Steps:**

Steps navigate using `useNavigate()` from TanStack Router:
- Forward navigation happens in `onContinue` after form submission succeeds
- Back navigation happens in `onBack` with simple `navigate({ to: "/previous-step" })`
- The link-accounts step navigates to `/success` on completion (final step currently)

**Form Submission Pattern:**

Most steps use TanStack Form:
1. Form initialized with `useForm()` with `defaultValues` from query data
2. `onSubmit` calls a server function (e.g., `saveOnboardingFormServerFn`)
3. Server functions use `createServerFn()` with `.middleware([authMiddleware])` for auth
4. After successful save, form navigates to next step
5. Form state tracks `isSubmitting` to disable buttons during save

### How Stripe Works in the Main Application

**Billing Page Architecture (Main App):**

The main app's billing page (`/home/dalton/dev/bbk/abacus/App/FrontEnd/src/@PagesLeftBar/Billing/index.tsx`) displays both subscriptions and one-time payments. It uses a query to fetch payment data with 5-second refetch interval.

**Data Flow:**

1. Component uses `useStripePaymentsQuery(5000)` which calls `api.user.stripe.getPayments.query()`
2. Backend endpoint `getPayments` (in `/home/dalton/dev/bbk/abacus/App/Shared/src/_LEGACY_ORGANIZATION/ServerEndpoints/@Endpoints/0-Users/Stripe/getSubscriptionsForClient.ts`) fetches:
   - All `StripeSubscription` records where user is owner OR user has billing access to related business units
   - All `StripeOneTimePayment` records with same criteria
   - Returns subscriptions with `canEditBilling` flag (true only if user has billing access to ALL business units on the subscription)
3. Subscriptions are filtered by `startDate < now` to show only active ones
4. Each subscription/payment is rendered in a card

**SubscriptionCard Component:**

The `SubscriptionCard` component (`SubscriptionCard.tsx`) handles different subscription statuses:
- For `awaiting_initial_payment` status:
  - Shows message "Please complete your payment to activate this subscription"
  - Renders "Complete Payment" button that calls `api.user.stripe.getCheckoutSession.query({ subscriptionId })`
  - On click, creates checkout session and passes `client_secret` to parent via `onCompletePayment` callback
  - Special handling for test subscriptions with FAKE_STRIPE_ID
- For active/other statuses:
  - Shows payment method details (card brand/bank name + last 4 digits)
  - Shows current billing period dates
  - Shows latest invoice status with link to view receipt/invoice
  - Shows trial end date if applicable
  - "Update Payment Method" button creates portal session via `api.user.stripe.createPortalSession.query()`

**CheckoutModal Component:**

The `CheckoutModal` component (`CheckoutModal.tsx`) handles the embedded Stripe checkout flow:
- Uses `loadStripe()` from `@stripe/stripe-js` with public key from environment
- Wraps Stripe's `EmbeddedCheckout` component in `EmbeddedCheckoutProvider`
- Takes `clientSecret` from checkout session
- On completion:
  - Waits 2.5 seconds (for webhook to process)
  - Invalidates `["stripe-payments"]` query to refetch updated data
  - Closes modal
- Stripe webhook server handles updating subscription status in background

**Backend Stripe Endpoints:**

The main app has three key Stripe endpoints (`index.ts`):

1. `getCheckoutSession` - Creates embedded checkout session:
   - Validates user owns the subscription
   - Creates line items for subscription price + optional one-time fee
   - Sets trial period if configured
   - Mode is "subscription"
   - UI mode is "embedded" with redirect "never"
   - Stores subscriptionId in metadata for webhook handling

2. `createPortalSession` - Creates Stripe customer portal session:
   - User can update payment method
   - Returns portal URL that opens in new tab

3. `getPayments` - Fetches all subscriptions and one-time payments for user:
   - Checks user has billing access via `userUnitRelation` with `canAccessBilling: true` and `unitPermissionLevel: Editor`
   - Returns subscriptions/payments with `canEditBilling` flag

**Stripe Schema (Database):**

The `StripeSubscription` model (`/home/dalton/dev/bbk/abacus-database/src/prisma/models/stripe.prisma`) contains:
- `id` - Primary key (auto-increment)
- `subscriptionId` - Stripe subscription ID (nullable until activated)
- `customerId`, `customerEmail` - Stripe customer info
- `paymentMethodId`, `paymentMethodType`, `paymentMethodCardBrand`, `paymentMethodBankName`, `paymentMethodLast4`, `paymentMethodAccountType` - Payment method details
- `latestInvoiceId`, `latestInvoiceStatus`, `latestInvoiceHostedURL`, `latestInvoiceCreatedAt`, etc. - Latest invoice data
- `price`, `priceId` - Recurring price amount and Stripe price ID
- `oneTimeFeePrice`, `oneTimeFeePriceId` - Optional one-time fee
- `status` - Enum including `awaiting_initial_payment`, `active`, `trialing`, `past_due`, `canceled`, etc.
- `interval`, `intervalCount` - Billing interval (day/week/month/year)
- `currentPeriodStart`, `currentPeriodEnd` - Current billing period
- `trialStart`, `trialEnd`, `cancelAt`, `canceledAt`, `endedAt` - Various dates
- `startDate` - When to alert user to set up subscription
- `trialPeriodDays` - Number of trial days
- `description` - Subscription description
- `userId` - Foreign key to User
- `stripeSubscriptionToBusinessUnits` - Many-to-many relation to business units

Key insight: `awaiting_initial_payment` is NOT a Stripe status - it's a custom status used before the subscription becomes real in Stripe. The subscription gets initialized with this status when an admin creates it before the user activates it.

**StripeCard Styling Component:**

The `StripeCard` component (`StripeCard.tsx`) is a compound component with sub-components:
- `StripeCard` - Base card wrapper (white background, border, rounded, shadow)
- `StripeCard.Header` - Header section with title and status chip (light background, border-bottom)
- `StripeCard.Title` - Title text (text-lg, font-semibold)
- `StripeCard.Subtitle` - Subtitle text (text-gray-500)
- `StripeCard.StatusChip` - Status badge (rounded-full, colored based on status)
- `StripeCard.Content` - Content area (grid layout, padding)
- `StripeCard.Field` - Field with label and value (label uppercase, small text)
- `StripeCard.BusinessUnitSection` - Shows related business units (main app only, not needed for onboarding)

The main app also has utility functions in `utils.ts`:
- `getStatusColor()` - Returns Tailwind classes for status badges
- `formatInterval()` - Formats billing interval (e.g., "month", "3 months")
- `formatPaymentMethod()` - Formats payment method display text
- `getInvoiceStatusColor()` - Returns Tailwind classes for invoice status badges

### Server Function Pattern in Onboarding App

**Creating Server Functions:**

Server functions use TanStack Start's `createServerFn()` API:

```typescript
export const exampleServerFn = createServerFn({ method: "POST" }) // method optional
  .middleware([authMiddleware])  // Auth middleware ensures user is logged in
  .inputValidator(SomeZodSchema)  // Optional: validates input data
  .handler(async ({ data, context }) => {
    // data: validated input
    // context: { user } from auth middleware
    const prisma = await getServerSidePrismaClient();
    // ... perform operations
    return { success: true, data: result };
  });
```

**Auth Middleware:**

The `authMiddleware` (`src/lib/auth.server.ts`):
- Calls `getUserServerFn()` to get current user
- If no user, throws redirect to `/sign-in`
- Returns `next({ context: { user } })` to pass user to handler
- User object includes Auth0 info (sub, email, name, picture) + database user data (id, displayName, driveFolderId, onboardingForm)

**Calling Server Functions:**

From client/component:
```typescript
const result = await serverFunctionName({
  data: { ...inputData },
  signal // optional: for query cancellation
});
```

**Query Options Pattern:**

Query options are defined in separate files (e.g., `onboarding-form.query.ts`):
```typescript
export const getSomeDataQueryOptions = queryOptions({
  queryKey: ["some-key"],
  queryFn: ({ signal }) => serverFunctionName({ signal }),
  // optional: enabled, staleTime, gcTime
});
```

Used in components:
```typescript
const query = useSuspenseQuery(getSomeDataQueryOptions);
const data = query.data;
```

Used in loaders:
```typescript
loader: async ({ context }) => {
  await context.queryClient.ensureQueryData(getSomeDataQueryOptions);
}
```

**Example Server Functions:**

Looking at `plaid/link.server.ts`:
- `getPlaidLinkTokenServerFn` - Creates Plaid link token for user
- `exchangePublicTokenServerFn` - Exchanges public token for access token, fetches accounts, saves to DB via `savePlaidBankAccountsServerFn`

Looking at `onboarding/bank-accounts.server.ts`:
- `savePlaidBankAccountsServerFn` - Saves multiple bank accounts, auto-assigns businessId if only one business
- `saveBankAccountAssignmentsServerFn` - Updates business assignments for accounts with validation

**Security Pattern:**

All server functions that modify data:
1. Use `authMiddleware` to ensure user is logged in
2. Validate ownership of resources (e.g., `ensureUserOwnsOnboardingForm()`)
3. Validate input with Zod schemas
4. Use Prisma transactions for multi-step operations

### Configuration Setup

**Server Configuration (`src/lib/config.server.ts`):**

Uses `@better-bookkeeping/app-config` service to load secrets from OpenBao Vault:
- Environment determined by `process.env.ENVIRONMENT` (development/test/staging/production)
- Secret paths follow pattern: `abacus/kv/data/app/{env}/{service}`
- Secrets mapped to config object with zod schema validation
- Current config includes:
  - `database.url` - PostgreSQL connection string
  - `auth0.clientId`, `auth0.clientSecret` - Auth0 credentials
  - `plaid.clientId`, `plaid.secret`, `plaid.webhookUri` - Plaid integration
  - `documentParser.port`, `documentParser.apiKey`, `documentParser.webhookSecret` - Document parser service
  - `googleDrive.clientFilesFolder`, `googleDrive.credentialsJson` - Google Drive integration
  - `googleMaps.apiKey` - Google Maps for address autocomplete

**Adding Stripe Configuration:**

To add Stripe support, config schema needs expansion:
```typescript
stripe: z.object({
  secretKey: z.string(),
  publicKey: z.string(),
  webhookSecret: z.string(),
})
```

Secret path would be: `abacus/kv/data/app/{env}/stripe`

Environment variables for local development (`.env.local`):
```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Client Configuration (`src/lib/config.client.ts`):**

Client config resolves environment variables prefixed with `VITE_`:
- Variables accessible via `import.meta.env` in browser
- Falls back to `process.env` on server
- Uses `window.APP_CONFIG` for injected config in production
- Hook `useClientConfig()` provides memoized access
- Current config includes:
  - `environment` - Current environment
  - `auth0.domain`, `auth0.clientId` - Auth0 client setup
  - `documentParser.apiUrl` - Document parser API endpoint

Stripe public key would be added as:
```typescript
stripe: {
  publicKey: resolveClientEnv("VITE_STRIPE_PUBLIC_KEY"),
}
```

### Integration Points for New Billing Step

**Where the Billing Step Fits:**

The billing step should be inserted between link-accounts (step 5) and success:
1. After user links accounts, check if they have subscriptions with `awaiting_initial_payment` status
2. If yes, show billing step (step 6) with conditional step indicator
3. If no, skip directly to success

**Conditional Step Logic:**

The routing can handle conditional steps in multiple ways:

Option A - Route loader redirect:
```typescript
// In link-accounts route's onContinue
const hasAwaitingSubscriptions = checkForAwaitingSubscriptions();
if (hasAwaitingSubscriptions) {
  navigate({ to: "/billing" });
} else {
  navigate({ to: "/success" });
}
```

Option B - Billing route loader redirect:
```typescript
// In billing route's beforeLoad/loader
const subscriptions = await getUserSubscriptions();
const needsBilling = subscriptions.some(s => s.status === 'awaiting_initial_payment');
if (!needsBilling) {
  throw redirect({ to: "/success" });
}
```

**Step Indicator Adjustment:**

The StepIndicator component accepts a custom `steps` array:
```typescript
// For users with billing step
<StepIndicator currentStep={6} steps={[1, 2, 3, 4, 5, 6]} />

// For users without billing step
<StepIndicator currentStep={5} steps={[1, 2, 3, 4, 5]} />
```

Pass this as a prop to OnboardingStepLayout or calculate in the component based on whether billing is needed.

**Data Requirements:**

New server functions needed:
1. `getUserSubscriptionsServerFn` - Fetch subscriptions for current user
2. `createCheckoutSessionServerFn` - Create Stripe checkout session for subscription
3. `getStripePublicKeyServerFn` - Get Stripe public key from server config (or include in client config)

Query options:
```typescript
export const getUserSubscriptionsQueryOptions = queryOptions({
  queryKey: ["user-subscriptions"],
  queryFn: ({ signal }) => getUserSubscriptionsServerFn({ signal }),
});
```

**Component Structure:**

The billing route will need:
- Loader to fetch subscriptions
- Component to display subscription cards
- Conditional rendering: show checkout UI if `awaiting_initial_payment`, show details if active
- CheckoutModal adapted from main app
- Navigation to /success after payment completion

**Stripe SDK Integration:**

Install packages:
```bash
bun install stripe @stripe/stripe-js @stripe/react-stripe-js
```

Server-side Stripe client initialization:
```typescript
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

async function getStripeClient() {
  if (!stripeClient) {
    const config = await getServerConfigServerFn();
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: "2024-11-20.acacia", // use latest version
    });
  }
  return stripeClient;
}
```

Client-side Stripe initialization in CheckoutModal:
```typescript
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = useMemo(
  () => loadStripe(clientConfig.stripe.publicKey),
  [clientConfig.stripe.publicKey]
);
```

### Implementation Checklist Reference

**File Locations:**

New files to create:
- `src/routes/__index/_layout.billing/index.tsx` - Main billing route
- `src/routes/__index/_layout.billing/-components/subscription-card.tsx` - Subscription display card
- `src/routes/__index/_layout.billing/-components/checkout-modal.tsx` - Stripe checkout modal
- `src/lib/stripe/subscriptions.server.ts` - Server functions for Stripe operations
- `src/lib/stripe/subscriptions.query.ts` - Query options for subscriptions
- `src/lib/stripe/utils.ts` - Utility functions (status colors, formatters)

Files to modify:
- `src/lib/config.server.ts` - Add Stripe config to schema and mapSecrets
- `src/lib/config.client.ts` - Add Stripe public key to client config
- `src/routes/__index/_layout.tsx` - Add "Billing" to dev navigator steps
- `src/routes/__index/_layout.link-accounts/index.tsx` - Update navigation to check for billing step
- `.env.local` - Add Stripe environment variables (for local dev)

**Component Adaptations:**

From main app's billing page, adapt:
1. `SubscriptionCard.tsx` - Simplify to remove business unit features not needed in onboarding
2. `CheckoutModal.tsx` - Change imports to use onboarding's config pattern
3. `utils.ts` - Copy utility functions for status/payment formatting

Key differences for onboarding version:
- No business unit relations to display (user hasn't completed onboarding yet)
- Only show subscriptions with `awaiting_initial_payment` status
- Simpler navigation flow (just activate and continue)
- No "Update Payment Method" needed (first-time setup only)

**Query Invalidation:**

After successful payment:
```typescript
await queryClient.invalidateQueries({
  queryKey: ["user-subscriptions"]
});
```

This triggers refetch, component sees subscription is now active, navigation continues to /success.

**Error Handling:**

Handle Stripe errors gracefully:
- Network failures: show retry button
- Payment failures: Stripe embedded checkout handles automatically
- Missing subscription: redirect to /success (subscription may have been handled elsewhere)
- Invalid checkout session: log error, show contact support message

### Discovered During Implementation
[Date: 2025-12-02]

During implementation, several important deviations from the original context manifest were discovered:

**1. Server Config Method Name Discovery**

The context manifest documented using `getServerConfigServerFn()`, but the actual method is `configService.getAppConfig()`. The AppConfigService pattern uses a different method naming convention than anticipated. This affects how configuration is accessed in server functions.

**2. Stripe API Version is Environment-Specific**

The context manifest suggested using API version `"2024-11-20.acacia"`, but the actual Stripe SDK requires `"2025-11-17.clover"` to match current type definitions. Using an incorrect API version causes TypeScript compilation errors with the Stripe SDK. Future implementations should use the latest stable version that matches the installed Stripe package types.

**3. Server Config Only Needs secretKey**

The original context showed both `secretKey` and `publicKey` in the server config. However, during implementation it was discovered that **only `secretKey` is needed in server config** - the `publicKey` is exclusively a client-side concern and should only exist in client config (via `VITE_STRIPE_PUBLIC_KEY`). Including `publicKey` in server config was redundant and removed.

**4. cn Utility Import Path**

The context manifest didn't specify the exact import path for the `cn` utility function. Implementation revealed it must be imported from `"@better-bookkeeping/ui/lib/utils"` (not `"@better-bookkeeping/utils"` which doesn't exist). This is critical for proper classname merging in components.

#### Updated Technical Details

**Correct Stripe Client Initialization:**
```typescript
import Stripe from "stripe";
import { configService } from "../config.server";

let stripeClient: Stripe | null = null;

async function getStripeClient(): Promise<Stripe> {
  if (!stripeClient) {
    const config = await configService.getAppConfig(); // NOT getServerConfigServerFn()
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: "2025-11-17.clover", // Match your installed Stripe package version
    });
  }
  return stripeClient;
}
```

**Correct Server Config Schema:**
```typescript
stripe: z.object({
  secretKey: z.string(),
  // publicKey NOT needed in server config - client-only
}),
```

**Correct cn Import:**
```typescript
import { cn } from "@better-bookkeeping/ui/lib/utils";
```

These discoveries prevent future developers from experiencing the same compilation errors and configuration issues.

### Discovered During Implementation - Session 2
[Date: 2025-12-03]

During the second implementation session, several critical architectural patterns and dependencies were discovered that significantly affect how the billing step functions:

**1. Webhook/Sync Service Dependency (Critical)**

The onboarding app **does not have its own Stripe webhook handler**. Instead, it relies entirely on the main Abacus app's Stripe sync service to update subscription status in the database after checkout completion. This architectural dependency was not documented in the original context.

The checkout modal (`CheckoutModal.tsx`) includes this code:
```typescript
const handleComplete = async () => {
  // Wait for webhook to process the payment
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
  onClose();
};
```

This 2.5-second wait assumes that a webhook will have processed the payment and updated the database by then. However, if the main app's Stripe sync service is not configured to handle subscriptions created in the onboarding context, the subscription status will remain `awaiting_initial_payment` even after successful payment.

**Impact:** The billing step will appear complete from the user's perspective (Stripe shows success), but the database won't reflect the payment, preventing the user from proceeding. This is a cross-application dependency that requires coordination with the main Abacus app's webhook configuration.

**Future Work Needed:** Either (a) add a dedicated webhook endpoint to the onboarding app, or (b) verify and document that the main app's sync service is configured to process onboarding subscription events.

**2. One-Time Payments Support (StripeOneTimePayment)**

The billing step was extended beyond the original scope to support **both subscriptions and one-time payments**. This was not in the original context manifest but emerged as a natural extension of the billing functionality.

One-time payments have different characteristics:
- Use `invoiceStatus` field (`open`, `paid`, `void`, `uncollectible`) instead of subscription `status`
- Link to Stripe-hosted invoice URLs instead of embedded checkout
- No recurring billing period or trial concepts
- Simpler payment flow (single transaction)

The `getUserSubscriptionsServerFn` now returns:
```typescript
{
  subscriptions: SubscriptionData[],
  oneTimePayments: OneTimePaymentData[]
}
```

The billing page conditionally shows both types, and the continue button is disabled until ALL payments (both types) are complete. This pattern allows admins to set up either recurring billing or one-time invoices for onboarding users.

**3. Dynamic Step Indicator Pattern**

The step indicator was designed to be static (showing 5 or 6 steps), but implementation revealed it needs to be **dynamically calculated based on user context**. A `useTotalSteps` hook was created that reads Stripe relations from the root route context to determine if step 6 (billing) is needed.

This pattern requires:
- `stripeSubscriptions` and `stripeOneTimePayments` included in user queries at the auth middleware level
- Root route context to expose these relations
- All step routes to use `useTotalSteps()` hook to get consistent step counts
- Logic to check for `awaiting_initial_payment` subscriptions OR `open` invoices

The hook implementation:
```typescript
export function useTotalSteps() {
  const { user } = Route.useRouteContext({ from: "__root__" });

  const hasAwaitingSubscriptions = user.stripeSubscriptions?.some(
    (sub) => sub.status === "awaiting_initial_payment"
  );
  const hasOpenInvoices = user.stripeOneTimePayments?.some(
    (payment) => payment.invoiceStatus === "open"
  );

  return hasAwaitingSubscriptions || hasOpenInvoices ? 6 : 5;
}
```

This pattern prevents step count mismatches across the onboarding flow and ensures the step indicator accurately reflects whether the billing step will appear.

#### Updated Technical Details

**Correct User Context with Stripe Relations:**
```typescript
// In auth.server.ts
const user = await prisma.user.findUnique({
  where: { auth0Sub: userAuth0.sub },
  include: {
    onboardingForm: { /* ... */ },
    stripeSubscriptions: {
      select: {
        id: true,
        status: true,
        // ... other fields
      },
    },
    stripeOneTimePayments: {
      select: {
        id: true,
        invoiceStatus: true,
        // ... other fields
      },
    },
  },
});
```

**Server Function Returns Both Payment Types:**
```typescript
export const getUserSubscriptionsServerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const [subscriptions, oneTimePayments] = await Promise.all([
      // Fetch subscriptions
      // Fetch one-time payments
    ]);
    return { subscriptions, oneTimePayments };
  });
```

**Billing Route Checks Both Types:**
```typescript
const needsBilling = data.subscriptions.some(
  (sub) => sub.status === "awaiting_initial_payment"
) || data.oneTimePayments.some(
  (payment) => payment.invoiceStatus === "open"
);
```

These discoveries represent significant architectural decisions that affect how the billing step integrates with the broader system and will be critical for maintaining and extending this functionality.

## User Notes
- Linear issue: ONB-4
- Stripe API keys will be configured once code is laid out
- The main app already has a working Billing page at `/home/dalton/dev/bbk/abacus/App/FrontEnd/src/@PagesLeftBar/Billing/` - adapt components from there
- Stripe schema is at `/home/dalton/dev/bbk/abacus-database/src/prisma/models/stripe.prisma`
- Subscriptions can be created by admin with `awaiting_initial_payment` status before user activates them

## Work Log

### 2025-12-02

#### Completed
- **Planning Phase**:
  - Retrieved Linear issue ONB-4 details
  - Created comprehensive context manifest covering all integration points
  - Created stripe-integration.md task index
  - Set up feature branch: dalton/onb-4-stripe-integration-when-a-user-already-has-a-subscription

- **Dependencies & Configuration**:
  - Installed Stripe packages: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`
  - Added Stripe config to `src/lib/config.server.ts` (secretKey only)
  - Added Stripe config to `src/lib/config.client.ts` (publicKey via VITE_STRIPE_PUBLIC_KEY)

- **Server Functions** (`src/lib/stripe/subscriptions.server.ts`):
  - `getUserSubscriptionsServerFn` - Fetches user's subscriptions with all relevant fields
  - `createCheckoutSessionServerFn` - Creates Stripe embedded checkout session
  - `markTestSubscriptionAsPaidServerFn` - Test utility for development/testing
  - Singleton Stripe client with proper API version (2025-11-17.clover)

- **Query & Utilities**:
  - Created query options in `subscriptions.query.ts`
  - Created utility functions in `utils.ts` (status colors, formatters, interval formatting)

- **Billing Route** (`src/routes/__index/_layout.billing/`):
  - Main route with loader that redirects to /success if no awaiting subscriptions
  - SubscriptionCard component showing subscription details and "Complete Payment" button
  - CheckoutModal component with Stripe embedded checkout
  - Proper step 6 integration with OnboardingStepLayout

- **Navigation Updates**:
  - Updated link-accounts route to conditionally navigate to /billing or /success
  - Changed continue button label based on whether billing step is needed
  - Added "Billing" to dev navigator

- **Typecheck Fixes**:
  - Fixed `getConfig` → `getAppConfig` method call
  - Updated Stripe API version to match SDK types
  - Fixed cn import path: `@better-bookkeeping/utils` → `@better-bookkeeping/ui/lib/utils`

#### Decisions
- Server config only needs secretKey (publicKey is client-side concern)
- Billing route uses conditional loader redirect pattern for clean routing
- Adapted components from main app but simplified (removed business unit features)
- Test subscription support via FAKE_STRIPE_ID for development

#### Next Steps
- Add Stripe environment variables to `.env.local`
- Test the flow with a test subscription
- Consider adding webhook handling for subscription updates

### 2025-12-03

#### Completed

1. **Dynamic Step Indicator**:
   - Created `useTotalSteps` hook that calculates total steps based on user's subscriptions and one-time payments
   - Updated `OnboardingStepLayout` to accept `totalSteps` prop
   - Updated all 6 step routes to use the `useTotalSteps` hook and pass `totalSteps` to layout
   - Added `stripeSubscriptions` to user context in `auth.server.ts`
   - Step indicator now dynamically shows 5 or 6 steps based on payment needs

2. **One-Time Payments Support**:
   - Added `OneTimePaymentData` type to server functions
   - Updated `getUserSubscriptionsServerFn` to fetch both subscriptions and one-time payments
   - Created `OneTimePaymentCard` component showing invoice details with "Pay Invoice" button
   - Updated billing page to display both subscriptions and one-time payments in separate sections
   - Updated navigation logic to check for both awaiting subscriptions AND open invoices
   - Added `stripeOneTimePayments` to user context in `auth.server.ts`
   - Updated `useTotalSteps` hook to account for open invoices

3. **Files Modified**:
   - `src/lib/auth.server.ts` - Added stripeSubscriptions and stripeOneTimePayments to user queries
   - `src/lib/stripe/subscriptions.server.ts` - Added OneTimePaymentData type and oneTimePayments fetch
   - `src/lib/stripe/utils.ts` - Utility functions for invoice status colors
   - `src/hooks/use-total-steps.ts` - New hook for dynamic step calculation
   - `src/components/onboarding-step-layout.tsx` - Added totalSteps prop
   - `src/routes/__index/_layout.upload-returns/index.tsx` - Added useTotalSteps
   - `src/routes/__index/_layout.basic-details/index.tsx` - Added useTotalSteps
   - `src/routes/__index/_layout.businesses/index.tsx` - Added useTotalSteps
   - `src/routes/__index/_layout.business-details/index.tsx` - Added useTotalSteps
   - `src/routes/__index/_layout.link-accounts/index.tsx` - Added useTotalSteps, updated needsBillingStep logic
   - `src/routes/__index/_layout.billing/index.tsx` - Added one-time payments display
   - `src/routes/__index/_layout.billing/-components/one-time-payment-card.tsx` - New component

#### Discovered

**Issue: Subscription Status Not Updating After Checkout**
- After a user completes checkout via Stripe embedded checkout, the subscription status doesn't update in the database
- The checkout modal waits 2.5 seconds for webhook processing, but there's no webhook handler in the onboarding app
- The database update relies on the main Abacus app's Stripe sync service to process webhook events
- Investigation needed: Either add webhook handler to onboarding app OR verify sync service is processing events for onboarding subscriptions

4. **Docker Watch Mode Migration**:
   - Updated `docker-compose.dev.yml` to use sync mode instead of bind volumes
   - Removed volume mounts (`- .:/app` and `/app/node_modules`)
   - Updated `develop.watch` to sync `./src` to `/app/src`
   - Updated `scripts/dev.sh` to run `bunx tsr watch` in background for local route type generation
   - Added trap to kill tsr watch process on script exit
   - Simplified `Dockerfile` development stage by removing USER_ID/GROUP_ID args and chown command

5. **Issue Resolution**:
   - Subscription status not updating after checkout was resolved - sync service needed to be running correctly
   - All success criteria now verified working
   - Typecheck passes

#### Status
All success criteria met - task ready for completion

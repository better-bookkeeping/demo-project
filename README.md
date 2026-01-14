# Better Bookkeeping Demo App

This repo is meant to be representative of how we're building features in the better bookkeeping ecosystem. We're going all in on the TanStack world and dockerizing our apps. In reality the UI components and Database connection logic is installed from external packages, but it's all bundled here for easy access and getting started

This repo is scaffolded as a simple workout tracking app. The user configures the movements in their workouts (e.g. bench-press, dumbbell curls etc.)

In the "Current Workout" section the user will create a new workout, and add "sets" to that workout. Each set includes a selected movement, a weight for that movement and a number of reps

Once the user hits "complete workout" that workout will be added to their history and can be viewed in the "workout history" section

## Feature Request

1. Add weight tracking section where a user can input their weight. This should be something they can track over time. Add a chart showing the history of that

2. The current setup doesn't support body-weight movements very well (e.g. pullups / pushups) update the "movements page" so a user can flag a movement as "body-weight" when they create it. When a "body-weight" movement is added to the current workout the weight field should default to the most recent user-inputted weight

3. The Workout history should give the user a sense of progression. One way to do this is to show certain summary metrics for each movement and their progression over time. Please implement a chart where a user can select a movement and a corresponding metric and see that metric plotted against time.
   metrics:
   - maximium weight (the maximum weight for that movement on a given day)
   - total volume (volume of a set is weight \* reps total volume for a movement is total volume of all sets in a workout)
   - total reps

4. There are no tests! Please create some unit tests for the following core behaviors:
   Movements: create / read / delete
   Sets: create / read / delete
   Workouts: create / read / delete

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
│   │   ├── _layout.current-workout/
│   │   ├── _layout.workout-history/
│   │   └── _layout.movements/
│   ├── auth/                 # Authentication routes
│   └── __root.tsx           # Root layout
├── components/               # Reusable components
└── lib/                     # Business logic
```

## Development Tools

- **TanStack DevTools**: Router and Query debugging panel
- **Dev Navigator**: Development-only navigation shortcuts
- **TypeScript**: Full type safety with path aliases (`@/*`)
- **Hot Reload**: Instant development feedback

## Environment Variables

Required environment variables (see `.env.example`):

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

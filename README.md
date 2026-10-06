# cmp-connect-client

Cash My Property (CMP Connect) agency portal frontend client built with React, Vite, and modular design system.

## Branches
- `main`: Production branch (reserved for production deployment upon backend integration).
- `staging`: Active development & staging branch with full portal UI and feature implementations.

## Features
- **Home Hub**: Dashboard ("Today") & Activity Log audit feed.
- **Properties Hub**: Portfolio listings (grid/list view), circular Quality Score, management toolbar & Add Property flow.
- **Clients Hub**: CRM Lead pipeline, Enquiries table with channel integrations (WhatsApp, Call, Email).
- **Growth Hub**: Performance analytics, Smart Boost, and Community Spotlight.
- **Wallet Hub**: Balance, credit packs, and transaction invoicing.
- **Real Time Offer (RTO) Desk**: Live auction lots and real-time bidder management.

## Tech Stack
- React 18 + Vite
- Lucide React Icons
- Custom Tokens & CSS System (Light & Dark theme, Listings & Auctions platform support)
- Modular UI Primitives (`CountBadge`, `Chip`, `SearchInput`, `Avatar`, `Dropdown`, `EmptyState`, `QualityScoreCircle`)

## Getting Started
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

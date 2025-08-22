# Khanya Store - React Business Website

Khanya Store is a React 18 + TypeScript business website for a South African bulk clothing retailer. Built with Vite, Tailwind CSS, Shadcn/ui components, and Supabase backend integration.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, build, and test the repository:
- `npm install` -- takes 30 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
- `npm run build` -- takes 5 seconds, builds to `dist/` folder. NEVER CANCEL. Set timeout to 30+ minutes.
- `npm run lint` -- takes 10 seconds but has 15 known issues (8 errors, 7 warnings). These are code quality issues that do not prevent builds or deployment. NEVER CANCEL. Set timeout to 30+ minutes.

### Run the application:
- **Development server**: `npm run dev` -- starts immediately on http://localhost:8080
- **Preview server** (serves built files): `npm run preview` -- starts immediately on http://localhost:4173

### Additional build modes:
- `npm run build:dev` -- development build mode

## Validation

**CRITICAL**: Always manually validate any changes by running through complete user scenarios:

1. **Always test the full user journey**:
   - Navigate to home page (/)
   - Test navigation to all routes: /contact, /location, /brand  
   - Verify forms render correctly (contact form with delivery/collect options)
   - Check responsive design and Tailwind styling
   - Verify all images and assets load properly

2. **Required validation after changes**:
   - Run `npm run build` to ensure production build works
   - Start `npm run dev` and manually test changed functionality
   - Test navigation between all pages
   - Always run `npm run lint` -- ignore the 15 known issues but watch for new ones

3. **Manual testing scenarios**:
   - Test contact form UI (backend needs Supabase environment variables to function)
   - Verify location page displays collection details and payment methods
   - Check responsive behavior on different screen sizes
   - Validate all external links (WhatsApp, email, maps) are properly formatted

## Technology Stack & Key Files

### Core Technologies:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom theme configuration
- **Components**: Shadcn/ui component library
- **Routing**: React Router v6
- **Backend**: Supabase (database + edge functions)  
- **Deployment**: GitHub Actions to FTP server

### Important Configuration Files:
- `package.json` -- npm scripts and dependencies
- `vite.config.ts` -- Vite build configuration (dev server on port 8080)
- `tailwind.config.ts` -- Tailwind theming and styling
- `components.json` -- Shadcn/ui configuration
- `eslint.config.js` -- ESLint rules (has known issues)
- `tsconfig.json` -- TypeScript configuration
- `.github/workflows/deploy.yml` -- GitHub Actions CI/CD pipeline

### Key Project Structure:
```
src/
├── App.tsx                 -- Main app with React Router setup
├── main.tsx               -- React app entry point  
├── pages/                 -- Route components (Index, Contact, Location, Brand)
├── components/            -- Reusable React components
│   └── ui/               -- Shadcn/ui components
├── integrations/supabase/ -- Supabase client and types
└── lib/                  -- Utility functions

supabase/
└── functions/
    └── send-contact-email/ -- Edge function for contact form (needs env vars)
```

## Common Issues & Solutions

### Linting Issues (Expected):
`npm run lint` reports 15 problems (8 errors, 7 warnings). These are known code quality issues:
- TypeScript `any` types usage
- Empty interface definitions  
- React refresh warnings
- **These do NOT prevent builds or deployment** - continue with development

### Package Management:
- **Use npm** as primary package manager (not bun)
- Both `package-lock.json` and `bun.lockb` exist, but bun is not available in most environments
- Always run `npm install`, not `bun install`

### Supabase Integration:
- Contact form submits to `/send-contact-email.php` endpoint  
- Supabase edge function exists but requires environment variables:
  - `RELAY_URL` -- SMTP relay endpoint
  - `RELAY_TOKEN` -- Authentication token
- **Without these env vars, contact form will fail gracefully with error message**

### Build & Deployment:
- `npm run build` creates production files in `dist/` folder
- GitHub Actions automatically deploys to FTP server on push to main branch
- **No environment variables needed for builds** - Supabase credentials are hardcoded for this public demo

## Development Workflow

### Making Changes:
1. Run `npm install` if dependencies changed
2. Start development with `npm run dev`  
3. Make your changes
4. Test manually in browser (http://localhost:8080)
5. Run `npm run build` to verify production build works
6. Run `npm run lint` (ignore the 15 known issues)
7. Commit changes

### Adding New Pages:
1. Create new component in `src/pages/`
2. Add route to `src/App.tsx` in the Routes section
3. Update navigation in relevant components
4. Test all navigation paths

### Styling Changes:
- Uses Tailwind CSS with custom theme in `tailwind.config.ts`
- Shadcn/ui components provide consistent design system
- Responsive design with mobile-first approach
- Custom CSS variables for theming

## Common Commands Reference

### Development:
```bash
npm install          # Install dependencies (30s)
npm run dev         # Start dev server (immediate)  
npm run build       # Production build (5s)
npm run preview     # Preview built files (immediate)
npm run lint        # Run ESLint (10s, has known issues)
```

### Validation Commands:
```bash
# Always run these after changes:
npm run build       # Ensure production build works
npm run lint        # Check for new linting issues (ignore existing 15)

# Manual testing checklist:
# 1. Visit http://localhost:8080 
# 2. Navigate to /contact, /location, /brand
# 3. Test form interactions
# 4. Verify responsive design
```

## Timeout Settings

**CRITICAL - NEVER CANCEL COMMANDS:**
- `npm install` -- Set 60+ minute timeout (usually 30s)
- `npm run build` -- Set 30+ minute timeout (usually 5s)  
- `npm run lint` -- Set 30+ minute timeout (usually 10s)
- `npm run dev` -- Starts immediately, no timeout needed
- `npm run preview` -- Starts immediately, no timeout needed

## Project Context

**Business Purpose**: 
Khanya Store sells 35kg bales of mixed secondhand clothing to entrepreneurs in South Africa who resell individual items to their communities at affordable prices (~R130 per item vs R250+ for new clothing).

**Target Users**:
- Potential customers researching bulk clothing purchases
- Entrepreneurs wanting to start clothing resale businesses  
- Existing customers checking location/payment details

**Key Features**:
- Product information and business model explanation
- Contact form for enquiries (delivery vs collection)
- Location and payment method details
- WhatsApp and email integration for direct contact
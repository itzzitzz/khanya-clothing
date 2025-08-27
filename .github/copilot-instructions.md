# Khanya Store - React E-commerce Application

Khanya Store is a modern React-based e-commerce web application for selling bulk secondhand clothing bales in South Africa. The application is built with React 18, TypeScript, Vite, Tailwind CSS, and shadcn/ui components, with Supabase as the backend service.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, Build, and Test Repository
1. **Install Dependencies**:
   ```bash
   npm install
   ```
   - Takes ~30 seconds to complete
   - Uses Node.js 20+ (as per GitHub Actions workflow)
   - May show 3 moderate vulnerabilities - this is expected and does not prevent functionality
   - **Note**: Project has both package-lock.json and bun.lockb, but use npm (Bun not available in CI environment)

2. **Development Server**:
   ```bash
   npm run dev
   ```
   - Starts in ~430ms
   - Runs on http://localhost:8080 (configured in vite.config.ts)
   - Includes hot module replacement (HMR)
   - NEVER CANCEL - server runs indefinitely in development

3. **Build Commands**:
   ```bash
   # Production build (used in CI/CD)
   npm run build
   ```
   - Takes ~5.5 seconds. NEVER CANCEL. Set timeout to 60+ seconds for safety.
   - Creates optimized dist/ folder with minified assets
   - Build succeeds despite linting warnings
   
   ```bash
   # Development build (for debugging)
   npm run build:dev
   ```
   - Takes ~5.1 seconds. NEVER CANCEL. Set timeout to 60+ seconds for safety.
   - Creates unminified dist/ folder for debugging

4. **Preview Built Application**:
   ```bash
   npm run preview
   ```
   - Serves the built dist/ folder on http://localhost:4173
   - Used to test production build locally
   - NEVER CANCEL - server runs indefinitely

5. **Linting**:
   ```bash
   npm run lint
   ```
   - Takes ~2.3 seconds
   - Currently has warnings and errors but does NOT fail the build
   - Expected issues: React Fast Refresh warnings, TypeScript empty interface warnings, @typescript-eslint/no-explicit-any errors
   - **CRITICAL**: Always run before committing - the CI pipeline depends on this

## Validation

### Manual Testing Requirements
- **ALWAYS manually test the application after making changes by running it and navigating through all pages**
- **Test all user scenarios**: Navigate to Home (/), Our Brand (/brand), Location & Payments (/location), and Contact (/contact)
- **Test the contact form**: Fill out the form fields (Name, Phone, Email, Number of bales, Delivery/Collect options, Delivery address)
- **Verify navigation**: Click between pages using the top navigation menu
- **Check responsive design**: The application should work on different screen sizes
- Always run `npm run lint` before you are done or the CI (.github/workflows/deploy.yml) will fail

### Expected Functionality
- Home page displays hero section with business information and product gallery
- Brand page shows company story and brand messaging  
- Location page shows location/payment details
- Contact page has a functional form for customer enquiries
- All pages have consistent navigation header
- Contact form integrates with Supabase backend via edge function

## Repository Structure

### Key Directories and Files
```
/src/                          # Main source code
  /components/                 # Reusable React components
    /ui/                      # shadcn/ui component library
  /pages/                     # Main page components (Index, Brand, Location, Contact, NotFound)
  /integrations/supabase/     # Supabase client and types
  /lib/                       # Utility functions
  /hooks/                     # Custom React hooks
  /assets/                    # Images and static assets
  index.css                   # Global CSS with Tailwind and custom styles
  main.tsx                    # Application entry point
  App.tsx                     # Root component with routing

/public/                      # Static assets served directly
/dist/                        # Built application (generated, not in git)
/.github/workflows/deploy.yml # CI/CD pipeline for deployment
/supabase/                    # Supabase configuration and functions
package.json                  # Dependencies and scripts
vite.config.ts               # Vite bundler configuration
tailwind.config.ts           # Tailwind CSS configuration
tsconfig.json                # TypeScript configuration (shared)
tsconfig.app.json            # TypeScript config for application code
components.json              # shadcn/ui configuration
```

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Routing**: React Router DOM
- **State Management**: TanStack React Query
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: FTP deployment via GitHub Actions

## Common Tasks

### Adding New Components
- Use shadcn/ui components when possible: `npx shadcn@latest add <component-name>`
- New UI components go in `/src/components/ui/`
- Page-specific components go in `/src/components/`
- Always import from `@/components/ui/component-name` using the alias

### Styling Guidelines
- Use Tailwind CSS classes for styling
- Custom CSS variables are defined in `/src/index.css` with the Khanya brand palette
- Colors use HSL format and CSS custom properties
- The design system includes custom gradients and animations

### Working with Supabase
- Client is configured in `/src/integrations/supabase/client.ts`
- Database types are auto-generated in `/src/integrations/supabase/types.ts`
- Edge functions are in `/supabase/functions/`
- Contact form uses the `send-contact-email` edge function

### Route Management
- Routes are defined in `/src/App.tsx`
- Available routes: `/` (Home), `/brand`, `/location`, `/contact`
- 404 handling via `NotFound` component
- Navigation is in `src/components/Header.tsx`

## Troubleshooting

### Common Issues
1. **Build warnings about @import CSS**: Expected warning, does not affect functionality
2. **Linting errors with @typescript-eslint/no-explicit-any**: Present in Contact form and Index page, but application works correctly  
3. **React Router warnings**: Future flag warnings in console, but navigation works properly
4. **Supabase credentials**: Already configured for development/production use

### Development Tips
- Use `npm run dev` for development with hot reload
- Use browser DevTools for debugging React components
- Check browser console for runtime errors
- Use `npm run build && npm run preview` to test production builds locally

### CI/CD Pipeline
- Automatic deployment on push to main branch
- Uses Node.js 20, runs `npm install` then `npm run build`
- Deploys to FTP server (credentials in GitHub Secrets)
- Build artifacts are in `/dist/` folder

## File Output References
Quick access to commonly viewed files and their contents:

### Repository Root Structure
```
.git/
.github/workflows/deploy.yml
.gitignore
README.md
bun.lockb
components.json
dist/
eslint.config.js
index.html
node_modules/
package.json
package-lock.json
postcss.config.js
public/
src/
supabase/
tailwind.config.ts
tsconfig.app.json
tsconfig.json  
tsconfig.node.json
vite.config.ts
```

### Key Configuration Files
**package.json scripts:**
- `"dev": "vite"` - Development server
- `"build": "vite build"` - Production build  
- `"build:dev": "vite build --mode development"` - Development build
- `"lint": "eslint ."` - Linting
- `"preview": "vite preview"` - Preview built app

**Vite server config (vite.config.ts):**
```typescript
server: {
  host: "::",
  port: 8080,
}
```

This ensures the coding agent can work efficiently in the Khanya Store codebase with all the essential information about build processes, testing requirements, and common development tasks.
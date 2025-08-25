# Khanya Store - React E-commerce Application

Khanya Store is a React-based e-commerce website selling secondhand clothing bales in South Africa. Built with React 18, TypeScript, Vite, Tailwind CSS, and Shadcn/ui components.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build Process
- Install dependencies: `npm install` -- takes 30-70 seconds depending on network
- Build production bundle: `npm run build` -- takes 5 seconds, NEVER CANCEL
- Start development server: `npm run dev` -- runs on http://localhost:8080, starts in ~400ms
- Preview production build: `npm run preview` -- runs on http://localhost:4173
- Run linting: `npm run lint` -- takes 2-3 seconds, currently has 8 errors/7 warnings but builds successfully

### Build Times and Expectations
- **NEVER CANCEL**: All builds complete quickly but allow adequate timeout for network conditions
- npm install: 30-70 seconds (depends on network)
- npm run build: 5 seconds
- npm run lint: 3 seconds
- npm run dev startup: under 1 second

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Main navigation component
│   └── ui/            # Shadcn/ui component library
├── pages/             # Route components
│   ├── Index.tsx      # Homepage with business info
│   ├── Brand.tsx      # Brand story and values  
│   ├── Location.tsx   # Location and payment details
│   ├── Contact.tsx    # Contact form
│   └── NotFound.tsx   # 404 page
├── lib/
│   └── utils.ts       # Utility functions (cn, etc.)
├── assets/            # Images (hero, bales, clothing)
├── App.tsx           # Main app with routing
└── main.tsx          # Entry point
```

## Validation

### Required Manual Testing Scenarios
After making any changes, always manually validate by running through these complete scenarios:

1. **Navigation flow**: Test all pages (Home → Brand → Location → Contact) using both navigation links and direct URLs
2. **Contact form**: Fill out the form completely and submit (expect backend error but UI should handle gracefully with error toast)
3. **Responsive design**: Test on mobile viewport (resize browser or use dev tools)
4. **External links**: Verify WhatsApp and email links work (should open appropriate applications)
5. **SEO metadata**: Check page titles change correctly between routes

### Validation Commands
- Always run `npm run lint` before committing (ignore existing errors, only fix new ones you introduce)
- Always run `npm run build` to ensure production build works
- Always start `npm run dev` and manually test your changes in browser
- **CRITICAL**: Take screenshots of any UI changes to verify they work as expected

## Technology Stack

### Core Technologies
- **React 18** with TypeScript
- **Vite 5.4.19** as build tool (NOT Create React App)  
- **React Router 6** for client-side routing
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library

### Key Dependencies
- `@tanstack/react-query` for state management
- `react-helmet-async` for SEO meta tags
- `lucide-react` for icons
- `class-variance-authority` for component variants
- `@supabase/supabase-js` for backend (contact form)

## Development Workflow

### Making Changes
- **ALWAYS** run `npm run dev` and test changes in browser
- Check console for any new errors or warnings
- Test navigation between pages
- Verify responsive design works on mobile
- Take screenshots of UI changes for documentation

### Build Process
- Development: `npm run dev` (with HMR on port 8080)
- Production build: `npm run build` (outputs to dist/)
- Production preview: `npm run preview` (serves dist/ on port 4173)

### Deployment
- Automatic deployment via GitHub Actions (`.github/workflows/deploy.yml`)  
- Builds with Node.js 20
- Deploys to FTP server on push to main branch
- Build artifacts in `dist/` folder

## Common Tasks

### Adding New Pages
1. Create component in `src/pages/`
2. Add route to `src/App.tsx` in the Routes section
3. Update navigation in `src/components/Header.tsx` if needed
4. Test navigation and update ActiveKey type if needed

### Working with Components
- Use existing Shadcn/ui components from `src/components/ui/`
- Import utilities from `@/lib/utils` for className merging
- Follow existing patterns for props and TypeScript types
- Components use `cn()` function for conditional styling

### Styling Guidelines
- Use Tailwind CSS classes for styling
- Follow mobile-first responsive design patterns
- Use existing color variables and theme from `tailwind.config.ts`
- Maintain consistency with existing component styles

### State Management
- Use React Query for server state
- Local component state with React hooks
- No global state management currently implemented

## Known Issues

### Linting
Current linting issues (safe to ignore unless you modify these files):
- TypeScript `any` types in Contact.tsx and Index.tsx
- Empty interfaces in ui/command.tsx and ui/textarea.tsx  
- Fast refresh warnings in ui components (Shadcn/ui standard)
- Tailwind config uses `require()` import style

### Backend Integration
- Contact form submits to Supabase function
- Form submission will fail in local development (expected)
- Error handling is implemented and shows user-friendly messages

## File Reference

### Key Configuration Files
```
package.json           # npm scripts and dependencies
vite.config.ts        # Vite configuration (port 8080)
tailwind.config.ts    # Tailwind CSS configuration  
tsconfig.json         # TypeScript configuration
components.json       # Shadcn/ui configuration
```

### Repository Root Contents
```
.github/workflows/deploy.yml  # CI/CD pipeline
public/                      # Static assets
src/                        # Application source
dist/                       # Build output (generated)
node_modules/               # Dependencies (generated)
```

## Troubleshooting

### Common Issues
- **Build fails**: Check for TypeScript errors, run `npm run lint`
- **Dev server won't start**: Check port 8080 is available, restart with `npm run dev`
- **Routing issues**: Verify React Router configuration in App.tsx
- **Styling issues**: Check Tailwind class names and component structure
- **Form submission**: Contact form requires backend setup, errors are expected locally

### Performance Notes  
- Build is very fast (5 seconds) due to Vite
- Development server has hot module reload
- Images are optimized during build process
- Bundle size is reasonable (~360KB JS + ~64KB CSS gzipped)
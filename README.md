# Laravel Shadcn Base Template

A production-ready Laravel 12 starter template with Inertia.js, React, Tailwind CSS v4, and shadcn/ui — built as a reusable base for future projects.

## Stack

- **Laravel 12** — PHP 8.4
- **Inertia.js** — SPA routing without an API
- **React 19** — Frontend framework
- **Vite** — Asset bundling
- **Tailwind CSS v4** — Utility-first CSS
- **shadcn/ui** — Unstyled, accessible component library
- **Laravel Sail** — Docker-based local development

## Features

- Collapsible sidebar with active nav highlight
- Dark mode toggle (follows system preference, manual override saved to localStorage)
- Full auth flow — Login, Register, Forgot Password, Reset Password, Confirm Password, Email Verification
- User profile — Update info, change password, delete account
- Toast notifications wired to Laravel flash messages (Sonner)
- Error pages — 403, 404, 500 (theme-aware)
- Breadcrumb navigation
- Page transition progress bar
- User dropdown with profile, billing, notifications, dark mode toggle, logout

## Requirements

- Docker Desktop
- Node.js & npm (for local frontend dev)
- No local PHP required (uses Laravel Sail)

## Installation

### 1. Clone the repo
```bash
git clone https://github.com/ashranhelmi/laravel-shadcn-base.git
cd laravel-shadcn-base
```

### 2. Copy environment file
```bash
cp .env.example .env
```

### 3. Install PHP dependencies via Docker
```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs
```

### 4. Start Sail
```bash
./vendor/bin/sail up -d
```

### 5. Generate app key
```bash
./vendor/bin/sail artisan key:generate
```

### 6. Run migrations
```bash
./vendor/bin/sail artisan migrate
```

### 7. Install Node dependencies
```bash
npm install
```

### 8. Start the dev server
```bash
npm run dev
```

### 9. Visit the app
```
http://localhost
```

## Adding shadcn Components
```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

Browse all components at [ui.shadcn.com/components](https://ui.shadcn.com/components).

## Flash Messages (Toast)

In any Laravel controller or route:
```php
return redirect('/dashboard')->with('success', 'Saved successfully.');
return redirect()->back()->with('error', 'Something went wrong.');
return redirect()->back()->with('warning', 'Please verify your email.');
return redirect()->back()->with('info', 'Your session will expire soon.');
```

Manual toast in JSX:
```jsx
import { toast } from 'sonner'

toast.success('Done!')
toast.error('Failed.')
```

## Project Structure
```
resources/js/
├── Layouts/
│   ├── AuthenticatedLayout.jsx   # Bridges Breeze routes to AppLayout
│   └── GuestLayout.jsx           # Centered card layout for auth pages
├── Pages/
│   ├── Auth/
│   │   ├── ConfirmPassword.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   └── VerifyEmail.jsx
│   ├── Profile/
│   │   ├── Edit.jsx
│   │   └── Partials/
│   │       ├── DeleteUserForm.jsx
│   │       ├── UpdatePasswordForm.jsx
│   │       └── UpdateProfileInformationForm.jsx
│   ├── Dashboard.jsx
│   └── Welcome.jsx
├── components/
│   ├── layout/
│   │   ├── AppHeader.jsx         # Top bar with sidebar trigger and breadcrumbs
│   │   └── AppLayout.jsx         # Main authenticated layout with sidebar
│   ├── ui/                       # shadcn/ui components
│   │   ├── avatar.jsx
│   │   ├── badge.jsx
│   │   ├── breadcrumb.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── chart.jsx
│   │   ├── checkbox.jsx
│   │   ├── collapsible.jsx
│   │   ├── dialog.jsx
│   │   ├── drawer.jsx
│   │   ├── dropdown-menu.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   ├── select.jsx
│   │   ├── separator.jsx
│   │   ├── sheet.jsx
│   │   ├── sidebar.jsx
│   │   ├── skeleton.jsx
│   │   ├── sonner.jsx
│   │   ├── table.jsx
│   │   ├── tabs.jsx
│   │   ├── toggle-group.jsx
│   │   ├── toggle.jsx
│   │   └── tooltip.jsx
│   ├── AppToaster.jsx            # Theme-aware Sonner toast wrapper
│   ├── app-sidebar.jsx           # Sidebar with nav data
│   ├── nav-main.jsx              # Sidebar nav with collapsible groups and active highlight
│   └── nav-user.jsx              # User dropdown with dark mode toggle and logout
├── hooks/
│   ├── use-mobile.js             # Detects mobile viewport
│   ├── useFlash.js               # Reads Laravel flash messages and triggers toasts
│   └── useTheme.js               # Dark mode toggle with localStorage persistence
├── lib/
│   └── utils.js                  # cn() utility for merging Tailwind classes
├── app.jsx                       # Inertia app entry point
└── bootstrap.js                  # Axios setup
```

## Dark Mode

Dark mode is toggled via the user dropdown menu in the sidebar footer. The preference is saved to `localStorage` and applied on page load. System preference is used as the default when no manual override exists.

## License

MIT

## Notes

### Laravel Breeze
This template is built on top of Laravel Breeze (Inertia + React stack). The default Breeze UI components have been fully replaced with shadcn/ui. Do not re-run `php artisan breeze:install` as it will overwrite the customised files.

### Laravel Sail Alias
To avoid typing `./vendor/bin/sail` every time, add this alias to your shell:
```bash
alias sail='./vendor/bin/sail'
```

Then you can just run `sail up -d`, `sail artisan migrate` etc.

### tsconfig.json
A `tsconfig.json` is included at the project root even though this project uses `.jsx` (not TypeScript). This is required for the shadcn CLI to correctly resolve the `@` path alias when adding new components. Do not delete it.

### Adding shadcn Components
The `components.json` is configured with:
- **Style**: `new-york`
- **Base color**: `neutral`
- **Path alias**: `@` → `resources/js`
- **Components path**: `@/components/ui`

When adding new components via CLI, files will be placed in `resources/js/components/ui/` automatically.

# Mobtech Synergies Ltd — Website

## Tech Stack
- React 18 + Vite
- React Router v6
- Supabase (database + auth)
- TipTap (rich text blog editor)
- CSS Modules

---

## GitHub Codespaces Setup

Run every command below in the terminal, in order.

### 1. Create the project
```bash
# From your desired directory
mkdir mobtech-site && cd mobtech-site
```

### 2. Initialise Vite + React
```bash
npm create vite@latest . -- --template react
```
> When prompted: select "React" then "JavaScript"

### 3. Clear the Vite boilerplate
```bash
rm -rf src
```

### 4. Copy all project files into src/
> Upload or paste all the files from this project into the correct paths.

### 5. Install dependencies
```bash
npm install
npm install @supabase/supabase-js react-router-dom @tiptap/react @tiptap/core @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

### 6. Set up environment variables
```bash
cp .env.example .env.local
```
Then open `.env.local` and fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=your_strong_password_here
```

### 7. Set up Supabase
1. Go to https://supabase.com → create a new project
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the SQL block from `src/lib/supabase.js` (everything between the comment markers)
4. Paste and run it — this creates your tables and seeds the team members

### 8. Run the dev server
```bash
npm run dev
```
> In Codespaces, click "Open in Browser" when prompted

### 9. Build for production
```bash
npm run build
```

---

## Project Structure
```
src/
├── components/
│   ├── admin/
│   │   ├── AdminGuard.jsx       # Protects admin routes
│   │   ├── AdminTeam.jsx        # Team CRUD
│   │   ├── AdminBlog.jsx        # Blog post list
│   │   └── AdminBlogEdit.jsx    # Rich text editor
│   ├── layout/
│   │   ├── Navbar.jsx / .module.css
│   │   └── Footer.jsx / .module.css
│   └── sections/
│       ├── Hero.jsx             # Ink bleed canvas background
│       ├── About.jsx
│       ├── Products.jsx
│       ├── Services.jsx
│       ├── Team.jsx             # Live from Supabase
│       └── Contact.jsx
├── lib/
│   └── supabase.js             # DB client + SQL schema
├── pages/
│   ├── Home.jsx
│   ├── Blog.jsx
│   ├── BlogPost.jsx
│   ├── Admin.jsx               # Dashboard shell
│   └── AdminLogin.jsx
├── App.jsx                     # Router
├── main.jsx
└── index.css                   # Global styles + CSS variables
```

---

## Admin Dashboard
- URL: `/admin/login`
- Password: set in `VITE_ADMIN_PASSWORD` env var
- Features:
  - **Team tab** — Add, edit, delete, reorder team members. Upload photo URLs.
  - **Blog tab** — Create posts with rich text editor (TipTap). Draft/publish toggle. Cover images.

## Adding Your Logo
In `Navbar.jsx` and `Footer.jsx`, replace the text brand with:
```jsx
<img src="/logo.png" alt="Mobtech" className={styles.logo} />
```
Drop your logo file into the `public/` folder.

## Adding Social Links
In `Footer.jsx`, add to the Connect column:
```jsx
<a href="https://linkedin.com/company/mobtech-synergies-ltd" target="_blank">LinkedIn</a>
<a href="https://twitter.com/mobtechng" target="_blank">Twitter</a>
```

## Deployment
Recommended: **Vercel**
```bash
npm install -g vercel
vercel
```
Set environment variables in Vercel dashboard under Project → Settings → Environment Variables.

---

## Routes
| Route | Page |
|-------|------|
| `/` | Home (all sections) |
| `/blog` | Blog listing |
| `/blog/:slug` | Single blog post |
| `/admin/login` | Admin login |
| `/admin` | Team management |
| `/admin/blog` | Blog management |
| `/admin/blog/new` | New post editor |
| `/admin/blog/edit/:id` | Edit post |

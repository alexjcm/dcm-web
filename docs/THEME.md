# Theme System (Dark/Light Mode)

The application implements a native and persistent theme system that allows seamlessly toggling between dark and light modes.

## Key Features

- **Persistence**: User preference is saved in `localStorage` (`theme`).
- **Auto-Detection**: On first use, the system detects the operating system's color preference (`prefers-color-scheme`).
- **Zero Flash of Unstyled Content (FOUC)**: Includes a blocking script in the `head` of `index.html` that applies the theme before the content becomes visible.

## Technical Implementation

### 1. `useTheme` Hook
Located in `src/hooks/use-theme.ts`, this hook orchestrates the theme state and synchronizes the `dark` class on the root `<html>` element.

### 2. Semantic Tokens (CSS Variables)
The design uses CSS variables in `src/styles.css` to centralize colors and effects:

```css
@theme {
  --color-background: #f7f9fc;
  --color-foreground: #0f172a;
  /* ... semantic tokens (detected by Tailwind v4) ... */
}

.dark {
  --color-background: #0f172a;
  --color-foreground: #f1f5f9;
  /* ... dark mode overrides ... */
}
```

### 3. Tailwind v4 Integration
We use Tailwind v4, which automatically detects the `.dark` class using the native variant `@variant dark (&:where(.dark, .dark *))`.

## Developer Guidelines

To maintain consistency, always use semantic variables or Tailwind classes with the `dark:` variant:

- **Background colors**: Use `bg-card` (semantic) or `bg-white dark:bg-neutral-800`.
- **Text colors**: Use `text-neutral-900 dark:text-neutral-100`.
- **Borders**: Use `border-border` or `border-neutral-200 dark:border-neutral-700`.

### Glassmorphism in Dark Mode
For "premium" elements like badges and modals in dark mode, we prefer the glass style:
- `dark:bg-primary-500/10 dark:border-primary-500/20 dark:text-primary-300`

---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile interfaces. Use when designing, building, reviewing, or fixing interfaces, pages, components, design systems, micro-interactions (toasts, alerts, loaders), responsive layout, accessibility, typography, color palettes, and Material UI / Tailwind implementation."
---

# UI/UX Pro Max - Design Intelligence

UI/UX guidance for building accessible, visually consistent, intuitive, and responsive interfaces.

## When to Apply
Use this skill when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**:
- Designing or redesigning pages and layout sections.
- Creating or refactoring UI components and design systems.
- Choosing color palettes, typography, spacing, and styling conventions.
- Reviewing UI for accessibility (WCAG AA), contrast, and consistency.
- Implementing micro-interactions, responsive behaviors, toast feedback (`react-toastify`), and Material UI components.

Skip it for pure backend logic, database schema design, and non-visual infrastructure tasks.

---

## Priority Rules & Guidelines

### 1. Accessibility (CRITICAL - Priority 1)
- **Contrast**: Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text / UI elements against backgrounds.
- **Keyboard Navigation & Focus**: Never remove focus outlines without providing visible custom focus rings (`focus:ring-2 focus:ring-emerald-500`).
- **Semantic Labels**: Every interactive element and icon button must have an accessible label (`aria-label`, `title`, or visible text).
- **Alt Text**: All meaningful images require descriptive `alt` tags; decorative images should use `alt=""` or `aria-hidden="true"`.

### 2. Touch, Micro-Interactions & Feedback (CRITICAL - Priority 2)
- **Immediate User Feedback**: Every user action (Add to Cart, Delete, Update, Save, Submit, Toggle) must provide immediate visible feedback.
- **Toast Notifications**: Use lightweight toast alerts (`react-toastify`) for non-intrusive status updates:
  - `toast.success`: Item added to cart, profile updated, order placed.
  - `toast.warning`: Stock limit reached, validation boundary hit.
  - `toast.info`: Selection changed, financing term toggled.
  - `toast.error`: Network failure, request rejected.
- **Touch Targets**: Minimum interactive target size is 44×44px for primary controls.
- **Loading States**: Display explicit loading skeletons, spinners, or button progress states during asynchronous actions.

### 3. Layout & Responsiveness (HIGH - Priority 3)
- **Mobile-First Breakpoints**: Ensure seamless fluid layouts across mobile, tablet, and desktop (`sm:`, `md:`, `lg:`, `xl:`).
- **Prevent Cumulative Layout Shift (CLS)**: Always reserve space for images, banners, and asynchronous elements with aspect ratios or min-heights.
- **No Unintended Horizontal Scroll**: Containers must constrain overflow (`max-w-6xl mx-auto px-4`, `overflow-x-hidden` on roots).

### 4. Style, Color & Component Architecture (HIGH - Priority 4)
- **Semantic Color Tokens**: Avoid arbitrary raw hex values. Stick to deliberate palette systems (e.g., zinc/slate neutrals, emerald accent for dealership action, amber for warnings, red for destructive actions).
- **MUI + Tailwind Integration**:
  - Combine Material UI components (`Slider`, `Rating`, `Chip`, `Alert`, `CircularProgress`, `Button`) with clean utility-first layout classes.
  - Maintain consistent border radii (`rounded-md`, `rounded-lg`) and borders (`border-zinc-200`).
- **Typography Hierarchy**:
  - Strict typography scale: Hero/Display (`text-3xl sm:text-5xl font-extrabold`), Section Headings (`text-xl sm:text-2xl font-bold`), Body (`text-sm` or `text-xs leading-relaxed`), Meta/Badges (`text-[10px]` or `text-[11px] font-mono uppercase`).

### 5. Forms, Validation & Error States (MEDIUM - Priority 5)
- **Error Placement**: Display error messages directly adjacent to the relevant input field, not just clustered at the top of the form.
- **Clear Empty States**: Every empty list, cart, or search result must show a helpful, visually engaging empty state illustration with a clear call-to-action to proceed or reset filters.
- **Prevent Accidental Actions**: Destructive actions (empty cart, delete account, cancel application) must provide confirmation dialogs or undo mechanisms.

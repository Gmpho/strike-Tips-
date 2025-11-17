# 🎨 UI & Styling Guide

This document outlines the design system and styling conventions for the Horse Racing Analytics AI application. Adhering to these guidelines ensures a consistent, accessible, and high-quality user interface.

## Core Philosophy

-   **Clean & Modern**: The UI should be uncluttered, with a focus on typography, whitespace, and clear visual hierarchy.
-   **Data-First**: Visual design should enhance data presentation, not distract from it. Key metrics and insights must be immediately scannable.
-   **Accessible**: All components must meet WCAG AA standards. Use semantic HTML and proper ARIA attributes.
-   **Responsive**: The application must provide an excellent experience on all screen sizes, from mobile phones to large desktops.

---

## 🛠️ Primary Framework: Tailwind CSS

We use [Tailwind CSS](https://tailwindcss.com/) as our primary styling framework.

-   **Utility-First**: Style elements by applying pre-existing classes directly in the markup.
-   **No Custom CSS**: Avoid writing custom CSS files. All styling should be achievable with Tailwind utilities.
-   **JIT Compiler**: The Just-In-Time compiler generates only the styles you use, keeping the final CSS bundle small and performant.
-   **Theme Configuration**: Colors, fonts, and spacing are configured within the `tailwind.config.js` file (as configured in `index.html` for this project).

---

## 🎨 Color Palette

We use a carefully selected color palette that supports both light and dark modes.

### Primary Colors

| Color   | Light Mode (Class)            | Dark Mode (Class)               | Usage                                  |
| :------ | :---------------------------- | :------------------------------ | :------------------------------------- |
| Brand   | `bg-blue-600`, `text-blue-600`  | `bg-blue-500`, `text-blue-400`    | CTAs, links, active states, highlights |
| Success | `bg-green-500`, `text-green-600` | `bg-green-500`, `text-green-400` | Positive indicators, confidence bars |
| Warning | `bg-yellow-500`, `text-yellow-600`| `bg-yellow-400`, `text-yellow-400`| Medium confidence, alerts          |
| Danger  | `bg-red-600`, `text-red-700`    | `bg-red-600`, `text-red-400`      | Errors, destructive actions          |

### Neutral Colors (Backgrounds & Text)

| Element             | Light Mode (Class)                                 | Dark Mode (Class)                                    |
| :------------------ | :------------------------------------------------- | :--------------------------------------------------- |
| **Page Background** | `bg-white`                                         | `bg-[#0D1117]` (Off-black)                           |
| **Card/Element Bg** | `bg-gray-50`, `bg-white`, `bg-gray-100`              | `bg-[#161B22]` (Dark Gray)                           |
| **Borders**         | `border-gray-200`                                  | `border-gray-800`                                    |
| **Primary Text**    | `text-gray-900`                                    | `text-white`                                         |
| **Secondary Text**  | `text-gray-600`                                    | `text-gray-400`                                      |
| **Subtle Text**     | `text-gray-500`                                    | `text-gray-500`                                      |

---

##  typography

-   **Font Family**: `Inter`, imported from Google Fonts.
-   **Base Font Size**: `16px`.

### Headings

| Element | Class                                                     | Notes                               |
| :------ | :-------------------------------------------------------- | :---------------------------------- |
| H1      | `text-5xl md:text-6xl font-black tracking-tighter`        | For main page titles (e.g., Hero).  |
| H2      | `text-4xl font-black tracking-tighter`                    | For major section titles.           |
| H3      | `text-xl font-bold`                                       | For card titles and sub-sections.   |
| H4      | `font-semibold tracking-wider uppercase`                  | For footer links and minor headings.|

### Body Text

-   **Standard Paragraph**: `text-base text-gray-600 dark:text-gray-400`
-   **Large Paragraph**: `text-lg md:text-xl`
-   **Small/Subtle Text**: `text-sm text-gray-500`

---

## 📐 Layout & Spacing

-   **Spacing Unit**: We use Tailwind's default spacing scale, which is based on `rem` units where `1 unit = 0.25rem = 4px`.
-   **Container**: The main content is wrapped in a container with a `max-w-7xl` class, with horizontal padding: `px-4 sm:px-6 lg:px-8`.
-   **Gaps**: Use `gap-8` for major grid layouts and `gap-4` for smaller component layouts.
-   **Padding**: Use `p-6` or `p-8` for cards and content sections.

---

## 🧩 Component Styles

### Buttons

| Type        | Classes                                                                                                                  | Notes                                                               |
| :---------- | :----------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| **Primary** | `bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700`                                                          | For primary calls-to-action (e.g., Get Started).                    |
| **Secondary**| `bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md`     | For secondary actions (e.g., Sign In).                              |
| **Destructive**| `bg-red-600/80 text-white border border-red-700 rounded-md hover:bg-red-700`                                            | For actions that have significant consequences (e.g., Sign Out).    |

**States**: All buttons must have clear `hover:`, `focus:`, and `disabled:` states. Disabled buttons should use `disabled:opacity-50 disabled:cursor-not-allowed`.

### Cards

-   **Base**: `bg-white dark:bg-[#161B22] rounded-lg border border-gray-200 dark:border-gray-800`
-   **Hover Effect**: Apply a subtle shadow and/or border color change on hover to indicate interactivity. Example: `hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/20`

### Form Inputs

-   **Base**: `bg-gray-200 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700`
-   **Focus State**: Use `focus:outline-none focus:ring-2 focus:ring-blue-500`. This provides a clear, accessible focus indicator.

---

## 📱 Responsiveness

-   **Approach**: Mobile-first. Styles should be written for the smallest viewport first, then overridden at larger breakpoints.
-   **Breakpoints**: Use Tailwind's default breakpoints:
    -   `sm`: `640px`
    -   `md`: `768px`
    -   `lg`: `1024px`
    -   `xl`: `1280px`
    -   `2xl`: `1536px`

---

## 🌓 Dark Mode

-   **Implementation**: Use the `dark:` variant for all relevant utility classes.
-   **Requirement**: Every component must be tested in both light and dark modes to ensure readability and aesthetic consistency.
-   **Toggle**: The theme is managed by `ThemeContext` and toggled via the `ThemeToggle` component. The `dark` class is applied to the `<html>` element.
# AGENTS.md

Welcome, AI Agents and Large Language Models! This file contains critical instructions, design principles, and coding standards for contributing to the `package-json-gui` project.

The scope of this file is the entire repository. You **must** strictly adhere to the guidelines outlined below.

---

## 1. Code Preservation and Refactoring Rules

- **Do Not Re-create Existing Structures:** Always check the codebase thoroughly using search and listing tools. Keep current patterns of the code completely untouched. Do not re-create any function, utility, class, module, or UI component that already exists.
- **Confirm Before Proceeding:** If you are unsure whether a function, module, or component exists, or if you are planning to modify major structures or refactor existing paths, **you must confirm with the user first** before continuing.
- **Incremental Changes:** Prefer small, targeted, and well-tested changes over large refactors.

---

## 2. Dependency Management and Minimalism

- **Keep It Lite and Minimal:** Use as few third-party npm packages installed in this repository as possible. The repository itself should remain highly optimized and lightweight.
- **Prefer Web Standards:** Always prefer native web platform features over external utility libraries.
  - **Example:** Always use the standard global `fetch` API for network requests. **Never** install or use `axios`.
  - Prefer standard DOM APIs or built-in Electron/Node.js utilities instead of pulling in third-party utility packages (e.g., lodash, ramda) unless absolutely necessary and agreed upon.

---

## 3. TypeScript Guidelines & Best Practices

To maintain code safety, consistency, and clear compile-time checks, adhere to the following TypeScript rules:

- **Do Not Use Interfaces:** Always use `type` declarations instead of `interface`. Interfaces in TypeScript merge automatically when declared multiple times, which can lead to accidental name collisions and harder-to-debug type errors.
- **No `any` Types:** Never use `any` in your code. Ensure every variable, parameter, and function return is fully typed. If a type is dynamic or unknown, use `unknown` combined with type guards, custom narrowing functions, or schemas.
- **Avoid Dangerous Assertions:** Never use `as unknown as TYPE` (or similar double assertions) to force types unless it is physically impossible to type-narrow otherwise. Rely on proper type guards, Discriminated Unions, or standard runtime validation to safely handle type casting.
- **Strict Typing:** Ensure strict mode is supported. Keep type annotations precise and robust.

---

## 4. Multi-language/RTL Readiness & CSS Guidelines

- **No `right` and `left` in CSS/SX:** This app may be multi-language later (supporting both LTR and RTL layouts). To ensure seamless compatibility, **do not** use `right`, `left`, `marginRight`, `marginLeft`, `paddingRight`, `paddingLeft`, `borderLeft`, `borderRight`, etc., in CSS or MUI `sx` objects.
- **Use Logical Properties:** Instead, use logical properties and values:
  - Use `inlineStart` and `inlineEnd` instead of `left` and `right`.
  - Use `marginInlineStart` (or `ms` in MUI), `marginInlineEnd` (or `me`), `paddingInlineStart` (or `ps`), `paddingInlineEnd` (or `pe`), `borderInlineStart`, `borderInlineEnd`, etc.
  - When positioning elements (e.g. `position: 'absolute'`), use `insetInlineStart` instead of `left`, and `insetInlineEnd` instead of `right`.

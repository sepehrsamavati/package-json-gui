# package-json-gui

An Electron-powered helper GUI application to elegantly manage your Node.js project's `package.json` and lockfiles.

## Overview

Managing dependencies, scanning for vulnerabilities, and maintaining lockfiles across multiple package managers can be tedious. `package-json-gui` provides a unified, intuitive visual interface designed to simplify these tasks. While it offers full support for major package managers, it prioritizes **npm** as its primary supported package manager.

## Key Features

- **Electron-Powered GUI:** A sleek, lightweight desktop interface built specifically for package management.
- **`package.json` Viewing & Editing:** Inspect and manage dependencies, devDependencies, peerDependencies, scripts, and other package metadata seamlessly.
- **Multi-Package Manager Support:** Supports **npm**, **pnpm**, **yarn**, and **bun** (with **npm** being the main/primary supported manager).
- **Dependency Updates:** Scan, view, and safely update your project dependencies directly from the interface.
- **Security Audit & Fixes:** Easily run audits (e.g., `npm audit`) and apply fixes (`npm audit fix`) to patch security vulnerabilities in your dependencies and lockfiles.
- **LLM-Powered Tips & Maintenance:**
  - Receive AI-driven suggestions to update packages.
  - Get recommendations to replace obsolete or insecure dependencies with better alternatives.
  - Obtain tailored maintenance tips to keep your application modern, secure, and lean.

## Tech Stack & Architecture

- **Frontend/Shell:** Electron, HTML/CSS/TypeScript.
- **Core Principle:** Highly performant, minimal, and lightweight. We favor built-in features (like native `fetch`) over external libraries (like `axios`) to keep the bundle size minimal.

# 🚀 Next-Gen Visual IDE & Component Installer Roadmap

This document outlines the long-term vision and step-by-step implementation plan for transforming this software into the "Holy Grail" all-in-one Visual IDE. 

The core goal: **Enable developers to visually select and install entire logic scripts (like OTP Auth) and UI components directly into their existing codebases, with automatic code mapping and global styling upgrades.**

---

## �️ Architectural Strategy: Remote Templates & Tokenization
*To prevent app bloat and the "combinatorial explosion" of supporting every framework combination, the system will use a Remote Template Registry.*
- **Remote Storage:** Do not store actual component template files inside the desktop app. Store them in a remote GitHub repository (e.g., `deped-templates` with folders like `/react/Auth.tsx`).
- **Dynamic Fetching:** The Rust backend fetches the exact raw file from GitHub at build time, keeping the desktop app size extremely small (under 15MB).
- **String Tokenization:** Use placeholder tokens (e.g., `{{AUTH_LOGIC}}`, `{{CONTAINER_STYLES}}`) in master templates. The app compiles these in-memory based on the user's selected stack (e.g., injecting Supabase logic vs Firebase logic) before saving to the user's disk.
- **Opinionated Standards:** Enforce a specific standard (e.g., Tailwind CSS + React for UI pages) to keep template maintenance sane and infinitely scalable.

---

## �🎯 Phase 1: The Code Injection Engine (AST Parsing)
*Before we can visually place components, we need the backend engine that can safely break open existing files, inject code, and save them without breaking the user's app.*

- [ ] **1.1 Build File Parser:** Implement an Abstract Syntax Tree (AST) parser (using tools like Babel/TSESTree) or advanced regex patterns capable of reading an existing React component file and understanding its imports, state, and return JSX.
- [ ] **1.2 Safe Injector:** Build functions to safely inject new imports (e.g., `import { useState } from 'react'`) and context providers without duplicating existing code.
- [ ] **1.3 Logic Scaffolders:** Create the scripts that can write complete backend logic pieces (e.g., placing the OTP verification API route in the correct folder structure based on NextJS/Express).

## 🎨 Phase 2: The Component & Logic Marketplace
*We need a database/structure of installable building blocks that contain both UI and Logic.*

- [ ] **2.1 Component Registry:** Expand `TEMPLATES_DATA` into a deeper `COMPONENT_REGISTRY` that stores complex modules (e.g., `OTP_AuthFlow`, `Stripe_Checkout`, `Accordion_Styled`).
- [ ] **2.2 Package Installer Automation:** Build the automation that runs `npm install` for required dependencies instantly when a component is selected (e.g., choosing Stripe installs `@stripe/stripe-js` automatically).
- [ ] **2.3 Sidebar Component Browser:** Create a UI panel where users can search, preview, and select these modular components.

## 👁️ Phase 3: The Visual Edit Canvas
*The core of the visual interface—letting users point exactly where the code should go.*

- [ ] **3.1 Visual Code Map:** Implement a system that runs the user's development server in an iframe, mapping visual elements on the screen back to line numbers in their source code.
- [ ] **3.2 "Select Target" Mode:** Build the UI overlay where clicking a box on the screen highlights it and says "Install Component Here."
- [ ] **3.3 Merge Engine:** When the user selects the component and the visual target, trigger the Phase 1 Injector to append the component precisely at that location in the code.

## ✨ Phase 4: Global Theme & Style Override System
*Allowing users to install a new style (like a button) and having it globally reflect across the entire app.*

- [ ] **4.1 Design Token Hub:** Implement a central CSS variable or Tailwind config manager that tracks primary colors, border radiuses, and fonts.
- [ ] **4.2 Global Find-and-Replace:** If the user upgrades their "Button Style," build a script that traverses the codebase and replaces old button classes/imports with the new styling standard.
- [ ] **4.3 UI Library Swapper:** Capability to upgrade from standard CSS to a library like Shadcn or Chakra visually across all files.

## 🛠️ Phase 5: The "All-in-One" Polish
*Combining everything into a smooth, finalized application.*

- [ ] **5.1 Seamless Dashboard:** Ensure the UX transitions perfectly from Project Initialization -> Visual Component Adding -> Code Previewing.
- [ ] **5.2 Rollback System (Safety Net):** If an intelligent injection fails or breaks their codebase, provide a smooth "Undo / Rollback" history so users trust the tool modifying their code.
- [ ] **5.3 Market Release Formatting:** Setup licensing, auto-updates for the app, and prepare for distribution.

---

## 🔌 Phase 6: Ecosystem & IDE Integration (MCP & Plugins)
*Making the software completely interoperable with existing IDEs (VS Code, Cursor) and allowing AI assistants to hook into your engine via Model Context Protocol (MCP).*

- [ ] **6.1 In-IDE Native Software View (WebView Extension):** Build a VS Code / Cursor extension that perfectly embeds your entire Visual Component Installer UI *directly inside an IDE tab*. Developers can open, interact, and drag-and-drop components without ever leaving their code editor.
- [ ] **6.2 MCP Server Implementation:** Build a local MCP (Model Context Protocol) server so that AI models (inside Cursor, Antigravity, or other chat tools) can directly query your software (e.g., "What templates are available?" or "Inject the OTP component").
- [ ] **6.3 Bi-directional Terminal Sync:** Allow users or AI to run a command in the IDE terminal (e.g., `pkg-gui open`) which instantly launches your software interface directly into an active IDE panel.
- [ ] **6.4 AI Autonomy Mode:** Allow internal IDE AIs to request project architecture states from your software, utilizing your clean template definitions as a ground-truth context for writing new logic.

---

> **How to use this file:**
> We will implement these checklist items one by one. Check off items `[x]` as they complete. Whenever we start a new session, we will refer back to this document to see what our next major target is.

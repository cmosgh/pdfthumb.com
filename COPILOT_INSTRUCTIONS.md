# GitHub Copilot Instruction File for pdfthumb.com

## Project Overview

This project is a React application using Vite as the build tool and TypeScript for type safety. It leverages Tailwind CSS for styling and uses @tanstack/react-router for routing. The repository enforces conventional commit messages using Commitlint and Commitizen.

## Technologies Used

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- @tanstack/react-router
- Commitlint (Conventional Commits)
- Commitizen

## Copilot Instructions

### General Coding Guidelines

- Use TypeScript for all new code.
- Prefer functional React components and hooks.
- Use Tailwind CSS utility classes for styling.
- Use Vite conventions for configuration and build scripts.
- Organize components in the `components/` directory and hooks in the `hooks/` directory.
- Follow the existing file and folder structure for new features.

### Commit Message Strategy

- All commit messages must follow the Conventional Commits specification.
- Use Commitizen for creating commit messages when possible.
- Example commit message: `feat(component): add new pricing card`

### Best Practices

- Write clear, concise, and self-explanatory code.
- Add JSDoc comments for complex functions or utilities.
- Prefer named exports over default exports.
- Keep components small and focused.
- Use TypeScript interfaces/types for props and state.
- Validate all changes with `npm run build` before committing.

### Testing & Validation

- Ensure the app builds successfully with `npm run build`.
- Lint and type-check code before submitting pull requests.

### Pull Request Guidelines

- Reference related issues in pull requests.
- Provide a clear description of changes and testing steps.

---

## Example Commit Message

```
feat(router): add support for dynamic routes
```

## Example Component Structure

```
components/
  MyComponent.tsx
hooks/
  useMyHook.ts
```

---

## Additional Notes

- Use the latest Node.js LTS version (currently 22) for all development and CI tasks.
- Keep dependencies up to date and use exact versions as specified in `package.json`.
- For configuration changes, update the relevant config files (e.g., `vite.config.ts`, `tsconfig.json`).

# Refactored Plan: Login Page with TanStack Router

This plan is updated to leverage the features of `tanstack/react-router`, including its file-based routing capabilities.

## Phase 1: File-based Route Creation

- [x] **Task 1.1: Create the Login Route File**
    - Create a new file at `src/routes/login.tsx`.
    - This file will automatically be picked up by the TanStack Router's file-based routing system.
    - The file will export a `Route` component that defines the route's properties.

- [x] **Task 1.2: Define the Login Route Component**
    - Within `src/routes/login.tsx`, define the component to be rendered for this route.
    - This component will contain the UI for the login page.
    - Start with a basic implementation, similar to the previous plan.

## Phase 2: Navbar Integration

- [x] **Task 2.1: Update the Navbar Component**
    - Open `components/Navbar.tsx`.
    - Import the `Link` component from `@tanstack/react-router`.
    - Wrap the "Login" button with the `<Link>` component.
    - The `<Link>` component will have a `to="/login"` prop.
    - Ensure that the `Link` component is type-safe and that the `/login` route is recognized by the router.

## Phase 3: Login Form and State

- [x] **Task 3.1: Build the Login Form**
    - In `src/routes/login.tsx`, create the login form with email and password fields.
    - Use Tailwind CSS for styling, as in the previous plan.

- [x] **Task 3.2: Manage Form State**
    - Use React's `useState` hook to manage the form's state.

## Phase 4: Form Submission and Actions

- [x] **Task 4.1: Implement Form Submission**
    - Add an `onSubmit` handler to the form.
    - With TanStack Router, you can use the `useNavigate` hook to programmatically navigate after a successful login.
    - For now, the form will log the credentials to the console.

## Phase 5: Type Safety and Code Generation

- [x] **Task 5.1: Leverage Type Safety**
    - TanStack Router is fully type-safe. Ensure that all route definitions, links, and navigations are type-checked.
    - Use the generated route tree to ensure that all links are valid.

- [x] **Task 5.2: Code Generation**
    - Make sure that the TanStack Router Vite plugin is configured correctly to automatically generate the route tree.
    - This will provide autocompletion and type safety for routes.

## Phase 6: Refinement and Review

- [x] **Task 6.1: Code Review and Linting**
    - Run the project's linter to ensure the new code conforms to the coding standards.
    - Review the changes for any potential issues, such as accessibility problems or inconsistent styling.
    - Add comments where necessary to clarify complex logic.

## Phase 7: E2E Testing with Playwright

- [x] **Task 7.1: Create a New Test File**
    - Create a new test file at `tests/login.spec.ts`.
    - This file will contain the Playwright tests for the login page.

- [x] **Task 7.2: Write a Test for Navigation**
    - Write a test that clicks on the "Login" button in the navbar and verifies that the URL changes to `/login`.
    - Assert that the login page contains the expected heading.

- [x] **Task 7.3: Write a Test for Form Submission**
    - Write a test that fills in the email and password fields and clicks the "Submit" button.
    - For now, this test can simply check that the form can be submitted without errors.

- [x] **Task 7.4: Run the Playwright Tests**
    - Run the Playwright test suite to ensure that the new tests pass and that existing tests are not broken.
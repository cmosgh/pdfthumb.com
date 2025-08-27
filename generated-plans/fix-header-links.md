# Plan: Fix Header Links for Cross-Page Anchor Navigation

## Phase 1: Update Navigation Constants

- [ ] **Task 1.1: Modify `NAV_LINKS` in `constants.ts`**
    - Open `constants.ts`.
    - Update the `href` values in the `NAV_LINKS` array to be absolute paths with hashes.
        - `#features` will become `/#features`.
        - `#pricing` will become `/#pricing`.
        - The "Docs" link currently points to `#features`, it should also be updated to `/#features`.

## Phase 2: Refactor Navbar Component

- [ ] **Task 2.1: Use `Link` component for Navigation**
    - Open `components/Navbar.tsx`.
    - Import the `Link` component from `@tanstack/react-router` if it's not already there (it is).
    - In the `nav` section, replace the `<a>` tags with the `Link` component for rendering the `NAV_LINKS`.
    - The `to` prop of the `Link` component will be set to the `href` value from the `NAV_LINKS` object.
    - Ensure the styling is preserved.

## Phase 3: E2E Testing with Playwright

- [ ] **Task 3.1: Create a New Test File for Navigation**
    - Create a new test file at `tests/navigation.spec.ts`.
    - This file will contain tests for the navigation functionality.

- [ ] **Task 3.2: Write a Test for Header Links from Index Page**
    - Write a test that starts on the index page (`/`).
    - Clicks on each of the header links (`Features`, `Pricing`, `Docs`).
    - Verifies that the URL is updated with the correct hash (e.g., `/#features`).
    - Asserts that the page has scrolled to the correct section by checking for the visibility of the section's heading.

- [ ] **Task 3.3: Write a Test for Header Links from Login Page**
    - Write a test that starts on the login page (`/login`).
    - Clicks on each of the header links (`Features`, `Pricing`, 'Docs').
    - Verifies that the URL changes to the index page with the correct hash (e.g., `/#features`).
    - Asserts that the corresponding section is visible on the index page.

- [ ] **Task 3.4: Run the Playwright Tests**
    - Run the entire Playwright test suite to ensure that the new tests pass and that existing tests are not broken.

## Phase 4: Refinement and Review

- [ ] **Task 4.1: Code Review and Linting**
    - Run the project's linter to ensure the new code conforms to the coding standards.
    - Review the changes for any potential issues.

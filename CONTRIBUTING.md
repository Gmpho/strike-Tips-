# Contributing to Horse Racing Analytics AI

First off, thank you for considering contributing! Your help is invaluable in making this project better.

This document provides guidelines for contributing to this project. Please read it to ensure a smooth and effective contribution process for everyone.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

-   **Check Existing Issues**: Before creating a new issue, please check if the bug has already been reported.
-   **Provide Details**: If you're reporting a new bug, please provide a clear and descriptive title, a step-by-step description of how to reproduce the bug, and what you expected to happen versus what actually happened.

### Suggesting Enhancements

-   **Use an Issue**: Open a new issue to suggest an enhancement. Provide a clear and detailed explanation of the feature, why it's needed, and any potential implementation ideas.

### Pull Requests

We welcome pull requests! Please follow these steps to make your contribution:

1.  **Fork the Repository**: Create your own fork of the project.
2.  **Clone Your Fork**: `git clone https://github.com/YOUR_USERNAME/horse-racing-analytics-ai.git`
3.  **Create a Branch**: Create a new branch for your feature or bug fix.
    ```bash
    git checkout -b feature/amazing-new-feature
    ```
4.  **Install Dependencies**: `npm install`
5.  **Make Your Changes**: Write your code, following the coding standards below.
6.  **Commit Your Changes**: Use a clear and descriptive commit message. We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
    -   `feat`: A new feature
    -   `fix`: A bug fix
    -   `docs`: Documentation only changes
    -   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
    -   `refactor`: A code change that neither fixes a bug nor adds a feature
    -   `chore`: Changes to the build process or auxiliary tools
    ```bash
    git commit -m "feat: Add voice command for sorting races"
    ```
7.  **Push to Your Branch**: `git push origin feature/amazing-new-feature`
8.  **Open a Pull Request**: Open a pull request from your forked repository to the main branch of the original repository. Provide a clear description of the changes you have made.

## Coding Standards

-   **Language**: All code should be written in TypeScript.
-   **Style**: We use Prettier for code formatting. Please ensure your code is formatted before committing.
-   **React**:
    -   Use functional components with hooks.
    -   Keep components small and focused on a single responsibility.
    -   Use descriptive prop names.
    -   Ensure all components have appropriate accessibility (ARIA attributes, semantic HTML).
-   **Tailwind CSS**:
    -   Utilize theme values where possible.
    -   Keep class lists readable.
    -   Use dark mode variants (`dark:`) for all relevant styles.
-   **Gemini API**:
    -   All interactions with the Gemini API should be centralized in the `lib/gemini.ts` file.
    -   Ensure robust error handling for all API calls.

Thank you for your contribution!
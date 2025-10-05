# Agent Guidelines - LazyLearners Platform

## Build & Test Commands
- **Build**: `npm run build` (includes Prisma generate)
- **Lint**: `npm run lint` (Next.js ESLint with jsx-a11y)
- **Test All**: `npm test` (Jest with 70% coverage threshold)
- **Test Single**: `npm test -- path/to/file.test.ts` or `jest path/to/file.test.ts`
- **Test Watch**: `npm run test:watch`
- **Test Coverage**: `npm run test:coverage`
- **E2E Tests**: `npm run test:e2e` (Playwright)
- **Critical Tests**: `npm run test:critical` (fast feedback)

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, target ES2017
- **Imports**: Use path aliases `@/*` for `src/*`, absolute imports preferred
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for constants
- **Error Handling**: Use try/catch with descriptive error messages, log errors appropriately
- **Types**: Define interfaces for API responses, use union types for variants, avoid `any`
- **Components**: Functional components with hooks, proper TypeScript props
- **Testing**: React Testing Library for components, Jest for utilities, focus on user behavior
- **Formatting**: ESLint auto-fixable, consistent spacing and semicolons
- **Security**: Input validation, CSRF protection, file upload security checks
- **Performance**: Lazy loading, memoization for expensive operations, optimize re-renders

## Cursor Rules Integration
- Follow [cursor_rules.mdc](.cursor/rules/cursor_rules.mdc) for rule creation standards
- Use [taskmaster.mdc](.cursor/rules/taskmaster/taskmaster.mdc) for task management
- Apply [dev_workflow.mdc](.cursor/rules/taskmaster/dev_workflow.mdc) for development processes
- Reference [self_improve.mdc](.cursor/rules/self_improve.mdc) for continuous improvement
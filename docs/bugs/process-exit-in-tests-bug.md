# Bug: Unexpected process.exit Call During Test Execution

## Title

Tests failing due to actual process.exit invocation in test environment

## Background

When executing the CI/CD pipeline in GitHub Actions (Job: "Add permission to write comments #574"), an error occurs in the workers/main module tests. Tests for the handleRunError function fail with the error "process.exit unexpectedly called with '1'".

## Actual Behavior

- Tests for the handleRunError function execute
- At the end of the test suite execution, a real process.exit(1) call occurs
- Vitest detects the unexpected process.exit call and terminates testing with an error
- All three tests in src/index.test.ts file fail with the same error
- CI/CD pipeline stops at the "Run tests with coverage" step

## Expected Behavior

- Tests should completely isolate the process.exit call through mocks
- Real process.exit should not be invoked in the test environment
- All tests should complete successfully
- CI/CD pipeline should pass without errors

## Detailed Description

### Technical Problem

The handleRunError function uses a deferred process.exit call via setTimeout with a 100ms delay. In the current test implementation:

1. A mock is created for process.exit that throws an error when called
2. The test executes, calling handleRunError
3. handleRunError starts a setTimeout that should call process.exit after 100ms
4. The test completes before the timer expires
5. After test completion, mocks are restored
6. After 100ms, the real process.exit fires since the mock has been removed
7. Vitest intercepts the unexpected process.exit call and fails with an error

### Root Cause

The asynchronous nature of setTimeout combined with synchronous test execution creates a race condition. The test does not wait for the deferred call to complete before restoring mocks.

### Impact

- All tests in src/index.test.ts fail
- CI/CD pipeline is blocked
- Pull Request #574 cannot be merged
- Development is blocked until fixed

## Acceptance Criteria

- [ ] All tests in src/index.test.ts execute successfully locally
- [ ] Tests pass successfully in GitHub Actions CI/CD
- [ ] No real process.exit calls occur during test execution
- [ ] Mocks correctly isolate side effects of the handleRunError function
- [ ] Test coverage does not degrade

## Additional Information

### Affected Files

- workers/main/src/index.ts (line 47: process.exit call in setTimeout)
- workers/main/src/index.test.ts (tests for handleRunError function)

### GitHub Actions

- Job: Add permission to write comments #574
- Failed at step: Run tests with coverage
- Error count: 4 identical errors

### Tech Stack

- Test Framework: Vitest
- Runtime: Node.js
- CI/CD: GitHub Actions

## Priority

**HIGH** - blocks CI/CD and Pull Request merge

## Labels

- bug
- testing
- CI/CD
- vitest
- process-exit
- race-condition

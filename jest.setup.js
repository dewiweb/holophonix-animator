// Global setup for Jest tests

// Increase timeout for async operations
jest.setTimeout(10000);

// Ensure process exits
afterAll(async () => {
  // Add a small delay to allow any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Clear mocks and timers after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});

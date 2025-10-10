# Contributing to Holophonix Animator

Thank you for your interest in contributing to Holophonix Animator! This guide will help you get started with contributing to the project.

## Development Process

### 1. Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/ORGANIZATION/holophonix-animator.git
cd holophonix-animator

# Install dependencies
npm install

# Build Rust components (for computation engine)
cd rust
cargo build
cd ..
```

### 2. Test-Driven Development

We follow a strict TDD approach:

1. Write failing tests first
2. Implement the minimum code to pass tests
3. Refactor while keeping tests green

See our [TDD Implementation Plan](tdd-implementation-plan.md) for details.

### 3. Code Style

- Follow our [Code Style Guide](code-style.md)
- Use TypeScript for Node.js and React code
- Use Rust for computation engine
- Document your code thoroughly
- Write meaningful commit messages

### 4. Project Structure

```
src/
├── core/                 # Node.js core
│   ├── osc/             # OSC implementation
│   └── state/           # State management
├── rust/                # Rust computation engine
├── electron/            # Desktop app layer
└── frontend/            # React application
```

### 5. Testing

- Write tests before implementation
- Maintain high test coverage
- Run the full test suite before submitting PR
- Include both unit and integration tests

### 6. Git Workflow

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following TDD
3. Commit with clear messages
4. Push and create a PR

See our [Git Workflow](git-workflow.md) for details.

## Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation
   - Add tests for new features
   - Follow code style guidelines

2. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Test Coverage
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] E2E tests (if applicable)

   ## Documentation
   - [ ] Updated relevant docs
   - [ ] Added inline comments
   ```

3. **Review Process**
   - Two approvals required
   - Address review comments
   - Keep PR scope focused

## Documentation

- Update relevant documentation
- Follow markdown style guide
- Include code examples
- Update API references

## Community

- Join our [Discord](https://discord.gg/ORGANIZATION)
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Participate in discussions
- Help other contributors

## Questions?

- Check existing documentation
- Ask in Discord
- Open a discussion issue
- Contact maintainers

## Related Documents

- [TDD Implementation Plan](tdd-implementation-plan.md)
- [Code Style Guide](code-style.md)
- [Git Workflow](git-workflow.md)
- [Architecture Overview](../architecture/common/architecture-overview.md)

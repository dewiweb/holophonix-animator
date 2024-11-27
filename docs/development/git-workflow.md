# Git Workflow

## Overview

This document outlines our Git workflow and best practices for the Holophonix Animator project.

## Branch Structure

```
main
  └── develop
       ├── feature/add-new-motion-model
       ├── feature/improve-ui-performance
       ├── bugfix/fix-osc-connection
       └── release/v2.1.0
```

### Main Branches

- `main`: Production-ready code
- `develop`: Integration branch for features

### Supporting Branches

1. Feature Branches
   - Branch from: `develop`
   - Merge back into: `develop`
   - Naming: `feature/descriptive-name`

2. Bugfix Branches
   - Branch from: `develop`
   - Merge back into: `develop`
   - Naming: `bugfix/issue-description`

3. Release Branches
   - Branch from: `develop`
   - Merge back into: `main` and `develop`
   - Naming: `release/vX.Y.Z`

4. Hotfix Branches
   - Branch from: `main`
   - Merge back into: `main` and `develop`
   - Naming: `hotfix/critical-issue`

## Workflow Steps

### 1. Starting New Work

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create new feature branch
git checkout -b feature/new-feature
```

### 2. During Development

```bash
# Make small, focused commits
git add <files>
git commit -m "feat: add new motion model implementation"

# Keep branch updated
git fetch origin
git rebase origin/develop
```

### 3. Preparing for Review

```bash
# Clean up commits
git rebase -i origin/develop

# Push to remote
git push origin feature/new-feature
```

### 4. After Review

```bash
# Update with review changes
git add <files>
git commit -m "fix: address review comments"

# Rebase if needed
git rebase -i origin/develop

# Push changes
git push origin feature/new-feature --force-with-lease
```

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples
```
feat(motion): add circular motion model

Implement circular motion model with configurable radius and speed.
Includes:
- Basic circular movement
- Speed control
- Radius adjustment
- Direction control

Closes #123
```

```
fix(osc): resolve connection timeout issues

- Increase timeout threshold
- Add retry mechanism
- Improve error handling

Fixes #456
```

## Pull Requests

### Title Format
```
[Type] Brief description
```

Example: `[Feature] Add circular motion model`

### Description Template
```markdown
## Description
Brief description of changes

## Changes
- Detailed change 1
- Detailed change 2

## Testing
- [ ] Test case 1
- [ ] Test case 2

## Related Issues
Closes #123

## Screenshots
If applicable
```

## Best Practices

### 1. Commits
- Make focused commits
- Write clear messages
- Reference issues
- Keep history clean

### 2. Branches
- Keep up to date
- Delete after merge
- Use descriptive names
- One feature per branch

### 3. Pull Requests
- Keep them focused
- Include tests
- Update documentation
- Respond to reviews

### 4. Code Review
- Review thoroughly
- Be constructive
- Test changes
- Approve explicitly

## Release Process

1. Create Release Branch
   ```bash
   git checkout -b release/v2.1.0 develop
   ```

2. Prepare Release
   - Update version numbers
   - Update changelog
   - Final testing

3. Complete Release
   ```bash
   git checkout main
   git merge release/v2.1.0
   git tag -a v2.1.0 -m "Version 2.1.0"
   git checkout develop
   git merge release/v2.1.0
   ```

4. Clean Up
   ```bash
   git branch -d release/v2.1.0
   git push origin main develop --tags
   ```

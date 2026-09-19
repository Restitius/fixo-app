### Git Branching Strategy

We will use **only three permanent branches** in the repository:

1. **`dev`** — Active development and integration branch.
2. **`staging`** — Pre-production testing and user acceptance branch.
3. **`main`** — Production-ready code only.

### Development and Merge Flow

All implementation work must follow a controlled progression before reaching production.

**Implementation → Fix → Page → Module → Dev → Staging → Main**

#### 1. Fix / Feature Development

* Every implementation, bug fix, enhancement, or technical change must be developed in a dedicated temporary working branch.
* Do **not** create permanent branches for individual fixes, pages, or modules.
* Working branches should be created from the current `dev` branch.
* Use clear branch names such as:

  * `fix/category-validation`
  * `feature/category-management`
  * `feature/account-module`
  * `feature/transaction-page`

#### 2. Fix-Level Validation

Every individual fix or implementation must first be completed and tested independently.

Once the fix is confirmed:

* Review the code.
* Validate functionality.
* Ensure there are no regressions.
* Merge the completed work into the appropriate **page** implementation.

#### 3. Page-Level Integration

Related fixes and implementations should be integrated into their corresponding page.

For example:

```text
Fixes
 ├── category-validation
 ├── category-modal
 ├── category-permissions
 └── category-table
          ↓
Categories Page
```

The page must be tested as a complete unit before moving forward.

#### 4. Module-Level Integration

Once all required pages belonging to a module are completed and tested, they must be integrated into the complete module.

Example:

```text
Categories Page
Accounts Page
Transactions Page
Reports Page
        ↓
Finance & Accounts Module
```

The module must undergo functional, integration, security, authorization, validation, and regression testing.

#### 5. Merge into `dev`

Only **completed and tested modules** should be merged into `dev`.

`dev` therefore represents the latest integrated development version of the entire system.

```text
Fix
 ↓
Page
 ↓
Module
 ↓
dev
```

Nothing should be merged directly into `dev` without passing through the appropriate implementation, page, and module integration process.

### Staging

When the `dev` branch reaches a stable milestone:

```text
dev → staging
```

The `staging` branch is used for:

* Full-system integration testing
* QA
* User acceptance testing
* Regression testing
* Security testing
* Performance validation
* Deployment verification

No unfinished feature should be promoted to `staging`.

### Production

Only code that has successfully passed staging validation may be promoted:

```text
staging → main
```

The `main` branch must always contain **production-ready and deployable code**.

No developer should merge directly into `main`.

### Required Branch Hierarchy

The repository must maintain this simple permanent branch structure:

```text
main
  ↑
staging
  ↑
dev
```

Temporary working branches exist only for implementation and are removed after their changes have been successfully integrated.

### Important Rules

* Do not create additional permanent branches such as `qa`, `production`, `release`, `testing`, or `uat`.
* `dev` is the primary integration branch during development.
* `staging` is the pre-production validation environment.
* `main` is production.
* Never bypass the integration process.
* Never merge unfinished work into `dev`.
* Never merge directly from a feature/fix branch into `staging` or `main`.
* Never merge directly into `main` from a developer working branch.
* Every merge must be reviewed and tested before proceeding to the next level.
* Temporary branches must be deleted after successful integration.
* Keep commits small, meaningful, and traceable to the specific fix, page, or module being implemented.

### Overall Workflow

```text
                    ┌──────────────┐
                    │  Fix / Work  │
                    │    Branch    │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │     Page     │
                    │  Integration │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │    Module    │
                    │  Integration │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │     dev      │
                    │ Development  │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   staging    │
                    │ QA / UAT     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │     main     │
                    │ Production   │
                    └──────────────┘
```

The objective is to maintain a **simple three-branch Git strategy** while still enforcing a disciplined progression of **fix → page → module → dev → staging → main**.



For new implementations, keep it simple:

Every new implementation must follow this flow:

New Implementation → Fixes → Page → Module → dev → staging → main

All work must first be developed and validated at the fix/page level, integrated into its module, and only then merged into dev. After full testing, dev moves to staging, and approved releases move to main.

Only three permanent branches: dev, staging, main.
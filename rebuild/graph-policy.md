# Historical graph policy

The rebuilt history follows the repository staging standard at page level:

```text
fix/<surface>/<module>/<page>
        ↓
page/<surface>/<module>/<page>
        ↓
module/<surface>/<module>/<release-batch>
        ↓
dev
```

Page changes are retained as individual commits. Pages belonging to one module
are collected on one temporary module branch and merged once into `dev`. A new
module release batch starts only when the source history reaches the next module
integration boundary. The four client surfaces remain explicit: `user-web`,
`user-mobile`, `provider-web`, and `provider-mobile`.

Backend, shared libraries, CI, and repository governance use their own module
scope and never get folded into a client page. Temporary branches are deleted
after their merge; only `dev`, `staging`, and `main` remain permanent.

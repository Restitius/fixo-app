# infra/

Terraform/Kubernetes manifests for FIXO-APP's cloud resources go here once
a cloud provider is chosen (staging/production compute, per the pending
blocks in `.github/workflows/deploy-staging.yml` and `deploy-production.yml`).

`.github/workflows/security.yml`'s `iac` job scans this directory with
Checkov once it contains real IaC files — see that job for the exact
condition (`find infra -type f -not -name '.gitkeep'`).

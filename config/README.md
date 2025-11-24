# Autonomy Configuration

This directory contains configuration for the OneSeek Autonomy Engine v3.3.

## autonomy.json

Default configuration for the autonomy engine.

### Security Note

**The autonomy engine is disabled by default for safety.**

Administrators must explicitly enable it after:
1. Reviewing the configuration
2. Configuring API keys for external reviewers
3. Generating Ed25519 key pairs
4. Understanding the approval process

### Configuration Parameters

- `enabled`: Master switch (default: `false` for safety)
- `schedule`: When to run ("manual", "nightly", "continuous")
- `scheduleTime`: Time for nightly runs (24h format)
- `minFidelityThreshold`: Minimum quality score (0.0-1.0)
- `maxDatasetSize`: Maximum training examples
- `minDatasetSize`: Minimum training examples
- `verificationQuestions`: Number of test questions
- `externalReviewers`: AI reviewers to use
- `approvalThreshold`: Required approvals (2-4)
- `loraSteps`: Training steps (1-2)

### Production Checklist

Before enabling in production:

- [ ] API keys configured (OPENAI_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY)
- [ ] Ed25519 keys generated and stored securely
- [ ] Admin authentication implemented
- [ ] Thresholds reviewed and adjusted
- [ ] First cycle tested manually
- [ ] Audit logging verified
- [ ] Backup procedures in place

### Monitoring

After enabling, monitor:
- Cycle success/failure rates
- Fidelity scores over time
- External reviewer approval rates
- Dataset quality metrics
- System resource usage

See [AUTONOMY_ENGINE_V3.3.md](../AUTONOMY_ENGINE_V3.3.md) for complete documentation.

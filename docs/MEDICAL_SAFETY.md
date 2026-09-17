# Medical Safety

These rules are non-negotiable and are enforced in code, not just in prompts.

- **No diagnostic claims.** The system never states or implies a diagnosis. All output is framed as a pattern worth discussing with a professional.
- **No discontinuing medication.** The system never advises stopping, starting, or changing a medication or prescribed treatment.
- **No invented remedies.** The LLM may only explain remedies retrieved from the curated `remedy_entries` library. It must never generate a remedy outside that set.
- **No unsourced claims.** Every remedy shown must carry a non-null `source` and `evidence_level` ("strong" | "moderate" | "early").
- **Every output must carry source + evidence level + disclaimer.** A remedy object is not allowed to render to the user unless all three are present. This check happens in code as a hard gate, not as a prompt instruction the model could ignore.

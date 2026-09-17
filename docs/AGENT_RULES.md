# Agent Rules

Rules for any coding agent or LLM working on this project.

## Voice preservation (from PRODUCT.md, section 4)

Not clinical. Not a patient portal. Not homework. Think Glossier meets functional medicine: warm, validating, confident, dark background, clean typography. She opens the app feeling like she's about to understand herself, not feeling sick.

Examples:
- "select your symptoms" → "let's figure out what your body is saying"
- "diagnosis result" → "here's what your body might be dealing with"
- "treatment options" → "here is your next step"

**Critical rule:** the pattern insight sentence and every remedy explanation must render the human-authored copy exactly as written, not an LLM paraphrase generated at runtime. The written voice is the product's actual differentiator today; do not let the model rewrite it live.

## Safety enforcement (from ARCHITECTURE.md)

Enforced in code, not just prompted. Every remedy object rendered to the user must have a non-null `source`, `evidence_level`, and a disclaimer attached before it's allowed to display. The LLM's job is to explain retrieved content, never to invent remedies or add unsourced claims. See [MEDICAL_SAFETY.md](./MEDICAL_SAFETY.md).

## Ordering rule

Always run pattern detection **before** retrieval. The detected pattern informs which symptom tag gets queried in the RAG step.

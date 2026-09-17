import type { RemedyEntry } from '../lib/types.js';

/**
 * PLACEHOLDER FIXTURES — NOT CLINICALLY REVIEWED.
 *
 * These exist so retrieval, ranking, evals and the golden-path test can run before
 * the content lead's spreadsheet lands. Sources point at real guideline bodies but
 * the wording is written to exercise the pipeline, not to be shown to a user.
 * Replace this file wholesale on handoff; nothing downstream imports it except
 * tests, evals and the fixture embedder.
 */
export const REMEDY_FIXTURES: RemedyEntry[] = [
  {
    id: '11111111-1111-4111-8111-000000000001',
    name: 'Heat therapy',
    symptom_tags: ['pelvic_pain', 'back_pain'],
    explanation_text:
      'A heating pad or hot water bottle on your lower abdomen relaxes the muscle that is cramping. It works about as well as over-the-counter painkillers for a lot of people, and you can use both together.',
    source: 'Cochrane Database of Systematic Reviews — topical heat for dysmenorrhoea',
    evidence_level: 'moderate',
    caution: 'Avoid falling asleep on a high setting; skin burns are the main risk.',
  },
  {
    id: '11111111-1111-4111-8111-000000000002',
    name: 'NSAIDs (ibuprofen or naproxen)',
    symptom_tags: ['pelvic_pain', 'heavy_bleeding'],
    explanation_text:
      'Anti-inflammatories bring down the prostaglandins driving both the cramping and the bleeding. Timing matters more than dose: starting a day before your period usually beats waiting until the pain arrives.',
    source: 'ACOG — Dysmenorrhea and Endometriosis in the Adolescent (Committee Opinion 760)',
    evidence_level: 'strong',
    caution: 'Not for people with stomach ulcers, kidney disease, or an NSAID allergy.',
  },
  {
    id: '11111111-1111-4111-8111-000000000003',
    name: 'Combined hormonal contraception',
    symptom_tags: ['pelvic_pain', 'heavy_bleeding'],
    explanation_text:
      'The pill, patch or ring thins the tissue that bleeds and can make periods lighter and less painful. Taken continuously it can skip the bleed altogether, which is often the point rather than a side effect.',
    source: 'NICE guideline NG73 — Endometriosis: diagnosis and management',
    evidence_level: 'strong',
    caution: 'Prescription only. Not suitable with migraine with aura or a clotting history.',
  },
  {
    id: '11111111-1111-4111-8111-000000000004',
    name: 'Pelvic floor physical therapy',
    symptom_tags: ['pelvic_pain', 'painful_sex'],
    explanation_text:
      'Months of guarding against pain leave the pelvic floor muscles clenched, and that clenching becomes its own pain source. A pelvic floor therapist works on releasing it, which is a different problem from the one causing the original pain.',
    source: 'NICE guideline NG73 — Endometriosis: diagnosis and management',
    evidence_level: 'moderate',
    caution: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000005',
    name: 'TENS unit',
    symptom_tags: ['pelvic_pain'],
    explanation_text:
      'A small device that sends a low electrical pulse through pads on your skin, which interrupts the pain signal on its way to your brain. Cheap, drug-free, and you can wear it under clothes at work.',
    source: 'Cochrane Database of Systematic Reviews — TENS for primary dysmenorrhoea',
    evidence_level: 'early',
    caution: 'Not for use with a pacemaker or during pregnancy.',
  },
  {
    id: '11111111-1111-4111-8111-000000000006',
    name: 'Low-impact movement',
    symptom_tags: ['pelvic_pain', 'fatigue'],
    explanation_text:
      'Walking, swimming or gentle yoga on the days you can manage it. This is not about pushing through — it is about not letting the deconditioning from bad weeks make the next bad week worse.',
    source: 'Cochrane Database of Systematic Reviews — exercise for dysmenorrhoea',
    evidence_level: 'early',
    caution: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000007',
    name: 'Acupuncture',
    symptom_tags: ['pelvic_pain'],
    explanation_text:
      'Studies are small and mixed, but several show a real drop in pelvic pain scores over a course of sessions. Worth knowing the evidence is thin so you can weigh the cost honestly.',
    source: 'NIH National Center for Complementary and Integrative Health — acupuncture',
    evidence_level: 'early',
    caution: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000008',
    name: 'Magnesium',
    symptom_tags: ['pelvic_pain', 'fatigue'],
    explanation_text:
      'Magnesium relaxes smooth muscle, which is the tissue doing the cramping. The effect is modest and builds over weeks rather than working the day you take it.',
    source: 'Cochrane Database of Systematic Reviews — dietary supplements for dysmenorrhoea',
    evidence_level: 'early',
    caution: 'High doses cause diarrhoea; check with a clinician if you have kidney problems.',
  },
  {
    id: '11111111-1111-4111-8111-000000000009',
    name: 'Low-FODMAP trial',
    symptom_tags: ['bloating', 'painful_bowel_movements'],
    explanation_text:
      'A structured short-term elimination of certain fermentable carbohydrates. A meaningful share of people with pelvic pain and bloating see the bloating drop, and it also tells you whether food is a factor at all.',
    source: 'Monash University FODMAP programme; Mayo Clinic — irritable bowel syndrome diet',
    evidence_level: 'moderate',
    caution: 'Meant as a time-limited trial with reintroduction, not a permanent diet.',
  },
  {
    id: '11111111-1111-4111-8111-000000000010',
    name: 'Peppermint oil capsules',
    symptom_tags: ['bloating', 'painful_bowel_movements'],
    explanation_text:
      'Enteric-coated peppermint oil relaxes the gut wall and eases the trapped-gas feeling that makes the bloating painful rather than just uncomfortable.',
    source: 'Mayo Clinic — peppermint oil for IBS symptoms',
    evidence_level: 'moderate',
    caution: 'Can worsen reflux; the enteric coating matters.',
  },
  {
    id: '11111111-1111-4111-8111-000000000011',
    name: 'Iron and ferritin check',
    symptom_tags: ['fatigue', 'heavy_bleeding'],
    explanation_text:
      'Heavy periods drain iron stores long before a standard blood count looks abnormal, and low ferritin on its own causes the bone-deep tiredness. Ask for ferritin specifically, not just haemoglobin.',
    source: 'NIH Office of Dietary Supplements — Iron fact sheet',
    evidence_level: 'strong',
    caution: 'Do not start iron supplements without testing first; excess iron is harmful.',
  },
  {
    id: '11111111-1111-4111-8111-000000000012',
    name: 'Sleep regularity and pacing',
    symptom_tags: ['fatigue'],
    explanation_text:
      'Same wake time daily, and spreading demanding tasks across the week instead of cramming them into the days you feel able. Pacing sounds like the least interesting thing on this list and tends to move fatigue the most.',
    source: 'NIH National Heart, Lung, and Blood Institute — healthy sleep guidance',
    evidence_level: 'early',
    caution: null,
  },
  {
    id: '11111111-1111-4111-8111-000000000013',
    name: 'Tranexamic acid',
    symptom_tags: ['heavy_bleeding'],
    explanation_text:
      'A non-hormonal tablet taken only on your heaviest days that reduces blood loss by roughly a third to a half. Useful if you want your periods lighter without changing anything hormonal.',
    source: 'NICE guideline NG88 — Heavy menstrual bleeding: assessment and management',
    evidence_level: 'strong',
    caution: 'Prescription only. Not suitable with a history of blood clots.',
  },
  {
    id: '11111111-1111-4111-8111-000000000014',
    name: 'Levonorgestrel IUD',
    symptom_tags: ['heavy_bleeding', 'pelvic_pain'],
    explanation_text:
      'A hormonal coil that releases progestogen directly into the uterus, thinning the lining. Many people stop bleeding almost entirely after the first few months, and the cramping often eases with it.',
    source: 'NICE guideline NG88 — Heavy menstrual bleeding: assessment and management',
    evidence_level: 'strong',
    caution: 'Insertion can be painful; ask what pain relief is offered beforehand.',
  },
  {
    id: '11111111-1111-4111-8111-000000000015',
    name: 'Lubricants and positioning changes',
    symptom_tags: ['painful_sex'],
    explanation_text:
      'Deep pain during sex often tracks with position and depth rather than arousal. A generous lubricant plus positions that let you control depth is the first thing to try, before anything more involved.',
    source: 'ACOG — When Sex Is Painful (FAQ 020)',
    evidence_level: 'moderate',
    caution: 'Oil-based lubricants degrade latex condoms.',
  },
  {
    id: '11111111-1111-4111-8111-000000000016',
    name: 'Stool softening and bowel timing',
    symptom_tags: ['painful_bowel_movements'],
    explanation_text:
      'Keeping stools soft with fibre and fluid means less straining against tissue that is already sore, especially in the days around your period when the pain usually spikes.',
    source: 'Mayo Clinic — constipation management',
    evidence_level: 'moderate',
    caution: 'Increase fibre gradually or bloating gets worse before it gets better.',
  },
  {
    id: '11111111-1111-4111-8111-000000000017',
    name: 'Ginger',
    symptom_tags: ['nausea', 'pelvic_pain'],
    explanation_text:
      'Ginger settles period-related nausea and has a small effect on cramping too. Capsules give a more reliable dose than tea if you are actually trying to test whether it helps.',
    source: 'NIH National Center for Complementary and Integrative Health — ginger',
    evidence_level: 'moderate',
    caution: 'High doses may interact with blood thinners.',
  },
  {
    id: '11111111-1111-4111-8111-000000000018',
    name: 'Mobility work for referred pain',
    symptom_tags: ['back_pain', 'leg_pain'],
    explanation_text:
      'Pelvic pain frequently refers into the lower back and down the legs, and the surrounding muscles tighten in response. Targeted hip and lower back mobility work loosens the knock-on tension.',
    source: 'Mayo Clinic — low back pain self-care',
    evidence_level: 'early',
    caution: 'New or one-sided leg weakness needs same-day medical review, not stretching.',
  },
];

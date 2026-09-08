# CANAGI OaSIS exposure index v1.0

An experimental, judgment based relative index for software based generative AI assistance. Not an official ESDC, Statistics Canada or ILO measure. Not validated against productivity, adoption, layoffs or occupational outcomes.

## Inputs

OaSIS 2025 supplies 900 occupational sub profiles mapping to all 516 five digit NOC 2021 groups. Each profile has 39 work activity ratings from 0 to 5. These are proficiency or complexity levels, not time spent, frequency, importance, or task shares. Treating them as weights is a CANAGI modeling assumption.

The explicit rubric in `scripts/exposure_model.py` assigns each activity a capability coefficient between 0 and 1, with a written rationale. These are qualitative capability assumptions, not measured task-completion rates. Document processing and recording are assigned more potential assistance than physical manipulation, vehicle operation or bodily activity. Robotics is excluded.

Wage, employment, education, job title, demographic traits and outlook do not enter an individual occupation’s score. Employment is used later only in aggregate summaries.

## Calculation

For profile p with activity levels L and capability assumptions C:

`raw(p) = 10 × sum(L[a] × C[a]) / sum(L[a])`

An all zero or incomplete profile fails the build instead of receiving an invented score. Sub profile raw scores are averaged equally within a NOC, because employment weights for sub profiles are unavailable.

The relative index uses the NOC’s midrank across the fixed 516-occupation cohort:

`index = 10 × (midrank − 1) / 515`

Ties receive the same midrank. Scores are rounded to one decimal. Raw scores are also inspectable. The scale represents relative model position: 0 does not mean no exposure; 10 does not mean complete automation. Raw differences may be small even when index differences look large. Relative ranks can change when the cohort or rubric changes.

## Sensitivity, not statistical confidence

Six scenarios combine linear or squared activity weights with three coefficient settings: −0.15, unchanged, +0.15. Coefficients stay within [0,1]; physical only zero coefficients remain zero. Each scenario re ranks all 516 occupations. The displayed range is the minimum and maximum resulting relative index.

This is a limited robustness check. It does not capture all plausible rubric choices, uncertainty in OaSIS ratings, alternative weighting schemes, real AI performance, intra occupation task variation or future capabilities. It is not a confidence interval. A narrow range does not validate the model.

## Explanations and human context

Each profile shows the three largest positive raw score contributions and the three highest rated activities whose capability assumptions are at most 0.25. Written rationales explain the software assistance and human/physical constraints. The expandable audit includes all 39 coefficients, mean levels, contributions, formula, source sub profiles and downloadable original input levels.

Human oversight context is the maximum of mean consequence of error and mean health and safety responsibility, on the source’s 0 to 5 scale. It is presented separately, not subtracted from the score and not called a validated complementarity adjustment. Responsibility for outcomes and face to face discussion ratings are retained in the evidence.

## Interpretation and research

Higher exposure can involve assistance, changed tasks or substitution. Actual effects depend on adoption, demand, regulation, organizational design, complementary skills and accountable human judgment. This index neither ranks the best careers nor predicts a career’s security.

The distinction between exposure and displacement is informed by [Statistics Canada’s experimental AI exposure research](https://www150.statcan.gc.ca/n1/pub/11f0019m/11f0019m2024005-eng.htm) and the [ILO’s 2025 refined occupational exposure study](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure). CANAGI does not reproduce either study’s scores or claim that they endorse this rubric.

## Reproduce

Review the pinned releases and use the explicit source cache:

```sh
python scripts/refresh data.py --cache dir /path/to/official downloads --checked 2026-09-07
```

Download URLs and input hashes are retained in `public/data/release.json`. All calculation code is deterministic. There are no runtime model calls, per-visitor inference charges or hidden prompts.

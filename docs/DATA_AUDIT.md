# CANAGI data audit

Source review: 2026-09-07. This is a verification date, not a new observation period.

## Coverage and vintages

| Measure | Coverage | Source and interpretation |
| --- | --- | --- |
| Occupations | 516/516 | NOC 2021 v1.0 unit groups, including previously missing NOC 00013 |
| Detailed employment | 485/516 | COPS employment file, observed 2023 base year; covered total 20,136,800 |
| Wages | 515/516 | Job Bank national release, November 19, 2025; original unit and period retained |
| Outlook | 485/516 | COPS 2024 to 2033 labour market balance categories |
| TEER and career fields | 516/516 | Second and first digits of NOC 2021, respectively |
| Experimental AI index | 516/516 | 900 OaSIS 2025 sub profiles, 39 activity ratings each; CANAGI rubric |
| Latest national context | One total | 21,173,100 people, August 2026, seasonally adjusted; Statistics Canada 14-10-0310-01 |

The national context does not replace the occupation employment base. The COPS file’s later employment columns are projections. The 2025 annual LFS occupational table (14-10-0416-01) contains broader aggregates, including management grouped across occupational families. Neither newer source can be divided into these 516 occupations without unsupported allocation assumptions. Counts are people, not vacancies.

Unknown values remain null. The covered employment total is not the full COPS all occupations total (20,170,900), which includes employment not separately available at this granularity. The map excludes 31 occupations lacking a published size; the directory retains them.

## Wage replacement

The prior undocumented annual estimates have been replaced with national rows from the November 2025 Job Bank release. There are 498 hourly source rows and 18 annual source rows, with one missing national wage. References: 483 records use 2023 to 2024, 18 use 2024, 14 use 2021, and one is unavailable. A release date is not a wage reference period.

For hourly medians, annualized pay = hourly median × 40 hours/week × 52 weeks = hourly median × 2,080. Published annual values remain annual. Annualized values are rounded to whole CAD. They are full time equivalents, not observed annual earnings, starting salaries, offers, or forecasts. Actual hours and weeks vary. Published annual series may have a different earnings concept; their source and notes are preserved.

Examples: NOC 21232 has a published median of $48.08/hour, annualized to $100,006. NOC 31301 has $43.27/hour, annualized to $90,002. NOC 00013 has no published national wage and remains unavailable.

Each record retains low, median, high, source unit, reference period, revision date, named source and wage comment. Every detail view displays the original median and period. The filter, rankings, summaries and comparison plots use the same annualized field.

## Outlook and pathways

Outlook counts: 6 strong surplus, 11 moderate surplus, 365 balance, 65 moderate shortage, 38 strong shortage, 31 not assessed. Numerical legacy values are categorical ordering codes, never growth percentages or averaged outlook scores. Shortage means projected moderate or strong risk of labour shortage over 2024 to 2033.

TEER 0 is management, not a university degree requirement. TEER includes training, education, experience and responsibility. Categories are not years of schooling or proof of eligibility. Full NOC descriptions, main duties and employment requirements are available for the occupation profiles. Local licensing rules still require the relevant regulator’s current guidance.

## AI exposure

Inherited scores with undocumented provenance have been replaced by a reproducible experimental relative index. See [AI_EXPOSURE_METHOD.md](AI_EXPOSURE_METHOD.md). It is not a government-produced score or a validated forecast. No paid inference or visitor API call is involved.

The raw weighted activity scores are relatively concentrated, so relative ranks deliberately expand small raw differences onto a 0 to 10 display. Users must not interpret the spread as equivalent differences in automation capability. A score of 8 denotes approximately the 80th percentile in this model, not 80% of tasks or jobs automated. Sensitivity ranges cover only the tested assumptions, not all model uncertainty.

## Aggregation and filtering

- All records are deduplicated by five digit NOC.
- Employment sums known nonnegative values. No coverage yields unavailable; a known zero remains zero.
- Pay quartiles use linear interpolation over equally weighted occupation medians. They are not worker earnings percentiles.
- Education mixes count occupations, not workers.
- AI means, AI distributions and shortage shares use covered 2023 employment weights, excluding missing pairs.
- Relative AI bands partition decimal scores without gaps: [0,4), [4,7), [7,10].
- Field exposure histograms share a vertical scale expressed as the proportion of each field’s covered employment.
- Shortage share divides employment in shortage occupations by employment with an assessed outlook.
- Field comparisons use full NOC families, ignoring saved career filters. Drilling into a field clears conflicting filters and retains comparison selections.
- Different filter categories use AND; multiple options within a category use OR. Numeric endpoints are inclusive; unknown values cannot match numeric limits. Inverted ranges remain empty.
- Ranks use matching records only. Equal values share competition ranks (1, 1, 3); ties are alphabetical; unknowns are last in both directions.

Current preset counts: projected shortages 103; lower AI index 0 to 3 gives 158; annualized pay $50K to $80K gives 239; TEER 4/5 gives 140.

## Sources and reproducibility

`scripts/refresh-data.py` pins source download URLs and writes SHA-256 checksums to `public/data/release.json`. Cached inputs are explicit inputs, not an automatic claim of freshness. Review the releases before changing the verification date. `public/data/evidence/{NOC}.json` retains original activity levels for each sub-profile, calculated contributions, rationales and official occupation text.

- [Job Bank national wages](https://open.canada.ca/data/en/dataset/adad580f-76b0-4502-bd05-20c125de9116)
- [COPS occupation downloads](https://occupations.esdc.gc.ca/sppc-cops/content.jsp?cid=occupationdatasearch&lang=en)
- [NOC 2021 v1.0](https://www.statcan.gc.ca/en/subjects/standard/noc/2021/indexV1)
- [OaSIS 2025](https://open.canada.ca/data/en/dataset/10ce43bd-fb58-4969-806b-4bffebc87bec)
- [Monthly employment, table 14-10-0310-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410031001)
- [Annual occupational employment, table 14-10-0416-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410041601)

Preserve source attribution and applicable licence conditions. The COPS download page specifically identifies restrictions on commercial redistribution of unpublished LFS data. This release is an owner private research preview and does not assert permission for other uses.

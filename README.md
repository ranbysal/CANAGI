# CANAGI

CANAGI is an interactive view of how employment, wages, education requirements, labour demand, and AI task exposure intersect across Canada's job market.

The explorer covers all 516 NOC occupations. The visualizer sizes 485 occupations by their published employment, covering more than 20 million jobs, then recolours them as the selected data layer changes.

## What it includes

- A full-screen editorial introduction
- Four interactive data layers: COPS outlook, annualized pay, training pathways, and relative AI exposure
- Job-weighted summaries and distributions that update with each layer
- A responsive treemap covering every occupation with employment data
- Hover details for jobs, pay, outlook, education, and AI exposure
- Direct links to official NOC occupation profiles
- Light and dark themes
- Career search, filters, rankings and two- or three-career comparisons
- Field comparisons with shared employment scales, pay distributions and training mixes
- Explainable activity-based AI estimates and source evidence for every occupation
- Shared navigation, timed page transitions and animated list/treemap changes
- A mint, teal, lavender and pink map palette with contrast-aware labels

## Data and interpretation

Wages use Job Bank’s November 2025 national release, with original units and reference periods retained. Hourly medians are annualized at 2,080 hours; published annual figures remain annual. Detailed employment uses the COPS 2023 base year, and labour outlook uses COPS 2024–2033. August 2026 national employment is displayed separately. Education requirements follow NOC 2021 TEER categories.

AI exposure is an experimental CANAGI relative index using 39 OaSIS 2025 activity ratings and a documented capability rubric. Each occupation includes its inputs, reasoning and sensitivity range. It is not an official or validated index, a percentage of automated tasks, or a forecast of job losses.

See the [data audit](docs/DATA_AUDIT.md) and [exposure methodology](docs/AI_EXPOSURE_METHOD.md) for sources, calculations and limitations.

Source releases were checked September 7, 2026. A check date is not a new observation period. The launch page and visualizer distinguish the 516-occupation coverage from the 485 occupations that can be sized by employment.

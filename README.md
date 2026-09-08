# CANAGI

CANAGI is an interactive view of how employment, wages, education requirements, labour demand, and AI task exposure intersect across Canada's job market.

The explorer covers all 516 NOC occupations. The visualizer sizes 485 occupations by their published employment, covering more than 20 million jobs, then recolours them as the selected data layer changes.

## What it includes

- An animated introduction
- Four interactive data layers: COPS outlook, annualized pay, training pathways, and relative AI exposure
- Employment summaries and distributions that update with each layer
- A responsive treemap covering every occupation with employment data
- Hover details for jobs, pay, outlook, education, and AI exposure
- Direct links to official NOC occupation profiles
- Light and dark themes
- Career search, filters, rankings and comparisons of two or three careers
- Field comparisons with shared employment scales, pay distributions and training mixes
- AI exposure estimates with calculation inputs and source evidence for every occupation
- Shared navigation, timed page transitions and animated list/treemap changes
- A continuous teal, mint and pink map scale with readable labels

## Data and interpretation

Wages use Job Bank’s November 2025 national release, with original units and reference periods retained. Hourly medians are annualized at 2,080 hours; published annual figures remain annual. Detailed employment uses the COPS 2023 base year, and labour outlook uses COPS 2024 to 2033. August 2026 national employment is displayed separately. Education requirements follow NOC 2021 TEER categories.

AI exposure is an experimental CANAGI relative index using 39 OaSIS 2025 activity ratings and a documented capability rubric. Each occupation includes its inputs, reasoning and sensitivity range. It is not an official or validated index, a percentage of automated tasks, or a forecast of job losses.

See the [data audit](docs/DATA_AUDIT.md) and [exposure methodology](docs/AI_EXPOSURE_METHOD.md) for sources, calculations and limitations.

Source releases were checked September 7, 2026. A check date is not a new observation period. The launch page and visualizer distinguish the coverage of 516 occupations from the 485 occupations that can be sized by employment.

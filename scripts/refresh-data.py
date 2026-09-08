#!/usr/bin/env python3
"""Rebuild the public snapshot from pinned official downloads, with provenance.

python scripts/refresh-data.py --cache-dir /path/to/downloads --checked YYYY-MM-DD
The cache is an explicit reproducibility input, never an automatic latest claim.
Review source releases and the exposure rubric before updating the pinned URLs.
"""
import argparse
import csv
import hashlib
import io
import json
import re
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path
from exposure_model import RUBRIC, score_occupation, relative_indices

ROOT = Path(__file__).resolve().parents[1]
OPEN = 'https://open.canada.ca/data/dataset/'
OASIS = OPEN + '10ce43bd-fb58-4969-806b-4bffebc87bec/resource/'
SOURCES = {
    'wages2025.csv': OPEN + 'adad580f-76b0-4502-bd05-20c125de9116/resource/9da94d63-b178-4a64-aeb3-b6a3bd721ad2/download/2a71-das-wage2025opendata-esdc-all-19nov2025-vf.csv',
    'noc-structure.csv': 'https://www.statcan.gc.ca/en/subjects/standard/noc/2021/indexV1/noc-2021-v1.0-classification-structure.csv',
    'noc-elements.csv': 'https://www.statcan.gc.ca/en/subjects/standard/noc/2021/indexV1/noc-2021-v1.0-elements.csv',
    'cops-employment.csv': 'https://occupations.esdc.gc.ca/sppc-cops/maint/file/download/Employment_emploi_2024_2033_NOC2021.csv',
    'cops-outlook.csv': 'https://occupations.esdc.gc.ca/sppc-cops/maint/file/download/FLMC_CFMT_2024_2033_NOC2021.csv',
    'oasis-activities.csv': OASIS + '44e666cc-f12d-4b3f-9369-6e0843d2bb48/download/work-activities_oasis_2025_v1.1.csv',
    'oasis-context.csv': OASIS + '594cabeb-ebb8-4bfd-80a3-fa1c0bdb64f3/download/work-context_oasis_2025_v1.1.csv',
    'oasis-guide.csv': OASIS + '2a7a17bf-b67c-4fc2-b636-959c7f1d7ae4/download/guide_oasis_2025_v4.0.csv',
    'lfs-monthly.zip': 'https://www150.statcan.gc.ca/n1/tbl/csv/14100310-eng.zip',
}

def read_csv(cache, name):
    encoding = 'cp1252' if name.startswith('cops-') else 'utf-8-sig'
    separator = ';' if name.startswith('oasis-') else ','
    return list(csv.DictReader((cache / name).open(encoding=encoding), delimiter=separator))

def number(value):
    try:
        result = float(value)
        if result < 0 or not result < float('inf'):
            raise ValueError(value)
        return int(result) if result.is_integer() else result
    except (ValueError, TypeError):
        return None

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n')

def build(cache, checked):
    provenance = []
    for name, url in SOURCES.items():
        path = cache / name
        if not path.exists():
            path.write_bytes(urllib.request.urlopen(url, timeout=60).read())
        provenance.append({'file': name, 'url': url, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'checked': checked})
    structure = read_csv(cache, 'noc-structure.csv')
    units = {r['Code - NOC 2021 V1.0']: r for r in structure if r['Level'] == '5'}
    groups = {r['Code - NOC 2021 V1.0']: r['Class title'] for r in structure if r['Level'] == '1'}
    assert len(units) == 516, 'Review classification changes before replacing this snapshot'
    wages = {r['NOC_CNP'].removeprefix('NOC_'): r for r in read_csv(cache, 'wages2025.csv') if r['prov'] == 'NAT' and r['ER_Code_Code_RE'] == 'ER00'}
    employment = {r['Code']: r for r in read_csv(cache, 'cops-employment.csv')}
    outlooks = {r['Code']: r for r in read_csv(cache, 'cops-outlook.csv')}
    elements = defaultdict(lambda: defaultdict(list))
    for row in read_csv(cache, 'noc-elements.csv'):
        text = row['Element Description English'].strip()
        if text and text not in elements[row['Code - NOC 2021 V1.0']][row['Element Type Label English']]:
            elements[row['Code - NOC 2021 V1.0']][row['Element Type Label English']].append(text)
    profiles = defaultdict(list)
    for row in read_csv(cache, 'oasis-activities.csv'):
        profiles[row['Code OaSIS'].split('.')[0]].append({'code': row['Code OaSIS'], 'title': row['OaSIS Label - Final'], 'levels': {key.strip(): int(value) for key, value in list(row.items())[2:]}})
    contexts = {r['OaSIS Code - Final']: {key: int(value) for key, value in list(r.items())[2:]} for r in read_csv(cache, 'oasis-context.csv')}
    model = {code: score_occupation(profiles[code], [contexts[p['code']] for p in profiles[code]]) for code in units}
    indices = relative_indices({code: values[0] for code, values in model.items()})
    sensitivity = [relative_indices({code: v[2]['sensitivityRaw'][i] for code, v in model.items()}) for i in range(6)]
    records = []
    outlook_values = {'strong risk of surplus': -6, 'moderate risk of surplus': -2, 'balance': 4, 'moderate risk of shortage': 7, 'strong risk of shortage': 15}
    for code, unit in units.items():
        source_wage = wages.get(code)
        assert source_wage is not None, f'Missing national wage source row: {code}'
        wage = {'low': number(source_wage['Low_Wage_Salaire_Minium']), 'median': number(source_wage['Median_Wage_Salaire_Median']), 'high': number(source_wage['High_Wage_Salaire_Maximal']), 'unit': 'year' if source_wage['Annual_Wage_Flag_Salaire_annuel'] == '1' else 'hour', 'reference': source_wage['Reference_Period'], 'updated': source_wage['Revision_Date_Date_revision'], 'source': source_wage['Data_Source_E'], 'note': source_wage['Wage_Comment_E'].strip()}
        pay = None if wage['median'] is None else round(wage['median'] * (2080 if wage['unit'] == 'hour' else 1))
        source_outlook = outlooks[code]['Future_Labour_Market_Conditions'].lower()
        outlook = outlook_values.get(source_outlook)
        description = source_outlook[:1].upper() + source_outlook[1:] if outlook is not None else 'Not assessed'
        raw, ai, evidence = model[code]
        ai['range'] = [min(s[code] for s in sensitivity), max(s[code] for s in sensitivity)]
        ai['rawScore'] = round(raw, 2)
        ai['assessed'] = checked
        title = unit['Class title']
        records.append({'title': title, 'slug': re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-'), 'noc_code': code, 'category': groups[code[0]], 'pay': pay, 'wage': wage, 'jobs': number(employment[code]['_2023']), 'employment_reference': '2023', 'outlook': outlook, 'outlook_desc': description, 'education': None, 'exposure': indices[code], 'ai': ai})
        evidence.pop('sensitivityRaw')
        evidence['rawScore'] = round(raw, 6)
        evidence['score'] = indices[code]
        evidence['sensitivityRange'] = ai['range']
        evidence['assessed'] = checked
        evidence['cohort'] = len(units)
        write_json(ROOT / f'public/data/evidence/{code}.json', {'noc': code, 'description': unit['Class definition'], 'duties': elements[code]['Main duties'], 'requirements': elements[code]['Employment requirements'], 'ai': evidence})
    assert len(records) == len(wages) == 516
    assert len({r['noc_code'] for r in records}) == 516
    assert all(0 <= r['exposure'] <= 10 for r in records)
    archive = zipfile.ZipFile(cache / 'lfs-monthly.zip')
    monthly = csv.DictReader(io.TextIOWrapper(archive.open('14100310.csv'), encoding='utf-8-sig'))
    total_rows = [r for r in monthly if r['GEO'] == 'Canada' and r['Statistics'] == 'Estimate' and r['National Occupational Classification (NOC)'] == 'Total employed, all occupations [00-95]' and r['VALUE']]
    current = max(total_rows, key=lambda r: r['REF_DATE'])
    assert current['REF_DATE'] <= checked[:7], 'Do not publish a future reference period'
    national = {'reference': current['REF_DATE'], 'jobs': round(float(current['VALUE']) * 1000), 'unit': 'people', 'adjustment': 'Seasonally adjusted', 'source': 'Statistics Canada, Table 14-10-0310-01', 'url': 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410031001', 'status': current['STATUS']}
    metadata = {'checked': checked, 'wageRelease': '2025-11-19', 'wageReference': '2023–2024 for most occupations; some 2024 or 2021', 'employmentReference': '2023', 'outlookHorizon': '2024–2033', 'classification': 'NOC 2021 v1.0', 'activitySource': 'OaSIS 2025 v1.0 (activity file v1.1)', 'annualization': 'Hourly medians × 40 hours/week × 52 weeks = 2,080 hours. Published annual figures are not multiplied.', 'national': national, 'occupations': len(records), 'employmentCoverage': sum(r['jobs'] is not None for r in records), 'wageCoverage': sum(r['pay'] is not None for r in records), 'exposureCoverage': sum(r['exposure'] is not None for r in records), 'files': provenance}
    write_json(ROOT / 'public/data/occupations.json', records)
    write_json(ROOT / 'public/data/release.json', metadata)
    (ROOT / 'src/data/dataRelease.ts').write_text('// Generated by scripts/refresh-data.py from pinned official sources.\nexport const DATA_RELEASE = ' + json.dumps({k: v for k, v in metadata.items() if k != 'files'}, ensure_ascii=False, indent=2) + ' as const\n')
    print(json.dumps({k: v for k, v in metadata.items() if k != 'files'}, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache-dir', type=Path, required=True)
    parser.add_argument('--checked', required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', args.checked):
        raise ValueError('Use an explicit ISO check date')
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    build(args.cache_dir, args.checked)

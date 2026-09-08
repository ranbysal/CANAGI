export interface ReviewedProfile { description: string; requirements: string; source: string; sourceModified: string; checked: string }

// Concise reviewed paraphrases of NOC 2021 v1.0, not live licensing advice.
const statcan = (code: string) => `https://www23.statcan.gc.ca/imdb/p3VD.pl?CLV=5&CPV=${code}&CST=01052021&CVD=1322870&Function=getVD&MLV=5&TVD=1322554`
const dates = { sourceModified: '2024-09-11', checked: '2026-09-06' }
export const REVIEWED_PROFILES: Record<string, ReviewedProfile> = {
  '21232': {
    description: 'Developers create and maintain software, test how programs work together, investigate changes to systems, and document their work. The group includes application, game and interactive media programmers.',
    requirements: 'The NOC lists a relevant bachelor’s degree or a computer science related college program as usual preparation. Previous programming experience is usually expected. A TEER 1 classification does not mean a degree is the only route.',
    source: statcan('21232'), ...dates,
  },
  '31301': {
    description: 'Nurses assess care needs, coordinate patient care, monitor changes in health, and educate patients and families. This group also includes psychiatric nursing, nursing research and specialist roles.',
    requirements: 'An approved nursing program and registration with the relevant regulator are required. Specialist roles can require further study and experience. Psychiatric nursing has its own program and registration requirements. Confirm current rules with the regulator where you plan to work.',
    source: statcan('31301'), ...dates,
  },
  '72200': {
    description: 'These electricians install and maintain wiring and electrical equipment in buildings, interpret circuit plans, test installations, and diagnose faults. The group includes apprentices, but excludes industrial and power system electricians.',
    requirements: 'The NOC describes secondary school and a four to five year apprenticeship as usual preparation. Certification rules vary by trade and jurisdiction. Check the current provincial or territorial requirements before choosing training.',
    source: statcan('72200'), ...dates,
  },
  '11100': {
    description: 'Auditors check financial records and controls, report findings, and recommend improvements. Accountants organize accounting systems, prepare statements and tax returns, and analyse financial information. Accounting articling students are included.',
    requirements: 'Professional accounting designations generally involve university study, approved professional training, work experience and certification. Auditing requires related accounting preparation and experience. Public practice can require additional licensing. Check today’s designation and regulator requirements directly.',
    source: statcan('11100'), ...dates,
  },
}

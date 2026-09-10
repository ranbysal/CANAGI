import { Fragment, useState } from 'react'
import { Dialog } from './CareerPanels'
import { EXPOSURE_NOTE, PAY_NOTE, TEER_DEFINITIONS } from '../lib/careers'

const definitions = {
  teer: { title: 'What does TEER mean?', text: 'TEER stands for Training, Education, Experience and Responsibilities. It groups occupations by their usual entry requirements and responsibilities. Lower numbers generally involve more education or training, but TEER 0 is management, not an education level. Pink does not mean a career is worse, and the categories are not years of school.' },
  pay: { title: 'Annualized pay', text: PAY_NOTE },
  outlook: { title: 'COPS outlook', text: 'COPS is the Canadian Occupational Projection System. Its 2024 to 2033 outlook compares projected labour demand with supply. A shortage means there may be too few workers; a surplus means there may be more workers than demand. Balance means neither is projected to dominate. These are national projections, not current vacancies or a guarantee of finding work.' },
  exposure: { title: 'AI exposure index', text: EXPOSURE_NOTE },
  noc: { title: 'What is a NOC code?', text: 'NOC means National Occupational Classification, Canada’s system for grouping jobs by their work and responsibilities. Each occupation has a five digit code. You can search by this code or by a job title.' },
} as const
export type HelpTerm = keyof typeof definitions
export function TermHelp({ term }: { term: HelpTerm }) {
  const [open, setOpen] = useState(false)
  const definition = definitions[term]
  return <span className="term-help">
    <button className="term-help-button" type="button" aria-label={`Explain ${term === 'teer' ? 'TEER' : definition.title}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>i</button>
    {open && <Dialog title={definition.title} eyebrow="A QUICK EXPLANATION" onClose={() => setOpen(false)}><div className="term-definition"><p>{definition.text}</p>{term === 'teer' && <dl>{TEER_DEFINITIONS.map(t => <Fragment key={t.id}><dt>TEER {t.id}</dt><dd>{t.description}</dd></Fragment>)}</dl>}</div></Dialog>}
  </span>
}

import { useSyncExternalStore, type CSSProperties } from 'react'
import { DATA_RELEASE } from '../data/dataRelease'
import { formatCompact } from '../lib/format'
import { motionState, stageOf, subscribeMotion } from '../lib/motionStore'

const readStage = () => stageOf(motionState.charge)

/** Annotations around the launch formation. Each scroll step advances one stage. */
export function StageHud({ jobs }: { jobs: number | null }) {
  const stage = useSyncExternalStore(subscribeMotion, readStage, () => 0)
  const stages = [
    { label: 'Canada', figure: String(DATA_RELEASE.occupations), unit: 'occupations', text: 'Every NOC 2021 occupation, in one connected view.' },
    { label: 'Today', figure: jobs ? formatCompact(jobs) : '—', unit: 'jobs', text: `Sized by 2023 employment across ${DATA_RELEASE.employmentCoverage} occupations.` },
    { label: 'Tomorrow', figure: '39', unit: 'work activities', text: 'OaSIS ratings behind every relative AI exposure score.' },
    { label: 'Together', figure: '10', unit: 'fields', text: 'Pay, pathways, outlook and AI exposure on one map.' },
  ]
  const current = stages[stage]
  return (
    <div className="stage-hud" style={{ '--stage': stage } as CSSProperties}>
      <ol className="stage-index">
        {stages.map((item, index) => (
          <li key={item.label} aria-current={index === stage ? 'step' : undefined}>
            <span>{String(index).padStart(2, '0')}</span>{item.label}
          </li>
        ))}
      </ol>
      <div className="stage-caption" key={stage}>
        <p className="stage-figure"><strong>{current.figure}</strong><span>{current.unit}</span></p>
        <p className="stage-text">{current.text}</p>
      </div>
      <p className="stage-coordinates"><span>45.4215° N</span><span>75.6972° W</span></p>
      <i className="stage-cross" style={{ '--x': '6%', '--y': '14%' } as CSSProperties} />
      <i className="stage-cross" style={{ '--x': '92%', '--y': '78%' } as CSSProperties} />
      <i className="stage-cross" style={{ '--x': '18%', '--y': '64%' } as CSSProperties} />
      <i className="stage-cross" style={{ '--x': '74%', '--y': '8%' } as CSSProperties} />
      <i className="stage-rule stage-rule--left" />
      <i className="stage-rule stage-rule--right" />
    </div>
  )
}

import type { CareerEvidence, Occupation } from '../types'
import { SOURCES } from '../lib/careers'

export function ExposureEvidence({ item, evidence, error }: { item: Occupation; evidence?: CareerEvidence; error?: boolean }) {
  const ai = evidence?.ai
  return <section className="exposure-evidence detail-section">
    <div className="evidence-heading"><div><p className="utility-label">EXPLAINING THE ESTIMATE</p><h3>Why this exposure score?</h3></div><strong>{item.exposure?.toFixed(1) ?? 'N/A'}<small>/ 10</small></strong></div>
    <p>{item.ai?.explanation}</p>
    <p className="data-caveat">Relative position among 516 occupations in CANAGI’s model. This is not the percentage of tasks automated or a probability of job loss.</p>
    {item.ai && <dl className="evidence-facts"><div><dt>Sensitivity range</dt><dd>{item.ai.range[0].toFixed(1)} to {item.ai.range[1].toFixed(1)}</dd><small>Alternative assumptions, not a confidence interval</small></div><div><dt>OaSIS profiles</dt><dd>{item.ai.profiles}</dd><small>Equally weighted within this NOC</small></div><div><dt>Human oversight context</dt><dd>{item.ai.humanOversight.toFixed(1)}<small> / 5</small></dd><small>Maximum of error consequence and safety responsibility</small></div></dl>}
    {ai ? <>
      <div className="evidence-columns"><div><h4>What raises the estimate</h4>{ai.drivers.map(d => <div className="evidence-driver" key={d.name}><p><strong>{d.name}</strong><span>Level {d.level.toFixed(1)} / 5</span></p><div className="evidence-meter"><i style={{ width: `${d.level * 20}%` }} /></div><p>{d.reason}</p></div>)}</div><div><h4>Where people remain important</h4>{ai.constraints.map(d => <div className="evidence-driver" key={d.name}><p><strong>{d.name}</strong><span>Level {d.level.toFixed(1)} / 5</span></p><div className="evidence-meter"><i style={{ width: `${d.level * 20}%` }} /></div><p>{d.reason}</p></div>)}</div></div>
      <details className="detail-source-note"><summary>Inspect the calculation and all 39 inputs</summary>
        <p>For each OaSIS profile: raw score = 10 × Σ(activity level × capability assumption) ÷ Σ(activity level). The level is OaSIS’s 0 to 5 proficiency or complexity rating, used as an explicit weighting assumption. It is not time spent or task frequency.</p>
        <p>Raw scores are averaged equally across this NOC’s profiles, then ranked among all 516 NOC occupations. Index = 10 × (midrank − 1) ÷ 515. Rounded to one decimal. Here the raw score is {ai.rawScore.toFixed(3)}; its relative index is {ai.score.toFixed(1)}.</p>
        <p>We test six scenarios: linear or squared activity weights, each with the capability assumptions lowered by 0.15, unchanged, or raised by 0.15. Coefficients are bounded to 0 to 1; physical only activities stay zero. Each scenario re ranks the complete cohort. The displayed range is the minimum and maximum resulting index, not an estimate of statistical confidence.</p>
        <p>Capabilities are CANAGI’s judgment based rubric for generative software assistance, not measured task completion rates. Robotics, demand forecasts, wages, education, demographic traits and job titles are excluded. This model has not been validated against observed job losses or occupation specific productivity outcomes.</p>
        <div className="model-inputs"><table><caption>Activity contributions to the raw score, before relative ranking</caption><thead><tr><th>Activity</th><th>OaSIS level / 5</th><th>Capability assumption</th><th>Raw contribution</th></tr></thead><tbody>{ai.activities.map(a => <tr key={a.name}><th scope="row">{a.name}</th><td>{a.level.toFixed(2)}</td><td>{a.capability.toFixed(2)}</td><td>{a.contribution.toFixed(3)}</td></tr>)}</tbody></table></div>
        <p>Multiple profile contributions are averaged after calculating each profile separately, so the displayed rounded mean levels need not reproduce the exact contribution. <a href={`/data/evidence/${item.noc_code}.json`} target="_blank" rel="noreferrer">Download this occupation’s full input evidence</a>, including the original activity levels for every sub profile.</p>
        <ul className="profile-source-list">{ai.profiles.map(p => <li key={p.code}><a href={`https://noc.esdc.gc.ca/OaSIS/OaSISOccProfile?GocTemplateCulture=en-CA&code=${p.code}&version=2025.0`} target="_blank" rel="noreferrer">{p.title} · {p.code}</a><span>Raw {p.rawScore.toFixed(2)}</span></li>)}</ul>
      </details>
    </> : <p className="source-caption">{error ? 'The full evidence file could not be loaded. The source link below remains available.' : 'Full input evidence is loading. The score summary is available above.'}</p>}
    <p className="source-caption">Source: <a href={SOURCES.oasis} target="_blank" rel="noreferrer">ESDC OaSIS 2025</a>. {item.ai?.model}, calculated {item.ai?.assessed}. An experimental CANAGI index, not an ESDC, Statistics Canada or ILO score.</p>
  </section>
}

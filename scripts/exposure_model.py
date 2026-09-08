"""CANAGI activity exposure v1.0. An explicit heuristic, not an official AI index.

OaSIS supplies activity COMPLEXITY levels, not time shares or AI capabilities.
Capability assumptions below are CANAGI's rubric for software-based generative AI.
Robotics, adoption, wages, employment and job titles never enter the calculation.
"""
from statistics import mean

MODEL = 'CANAGI OaSIS exposure index v1.0'
# coefficient, rationale. These assumptions are deliberately inspectable.
RUBRIC = {
    'Estimating Quantifiable Characteristics': (.6, 'Software can assist estimates and calculations; obtaining reliable real-world inputs still matters.'),
    'Getting Information': (.7, 'Search, retrieval and summarization can assist gathering digital information; access and verification remain constraints.'),
    'Identifying Objects, Actions and Events': (.35, 'Models can help classify supplied information or images, but direct observation and context are often needed.'),
    'Inspecting Equipment, Structures or Material': (.15, 'Image or document review can assist inspection; physical access, measurement and accountability remain human work.'),
    'Monitoring Processes, Materials or Systems': (.3, 'Software can summarize readings and flag anomalies; monitoring physical processes requires sensors and intervention.'),
    'Controlling Machines and Processes': (.05, 'Generating instructions does not itself control or safely operate physical equipment. Robotics is outside this index.'),
    'Developing Technical Instructions': (.85, 'Drafting, explaining and revising technical instructions are digital language tasks, with expert verification required.'),
    'Documenting and Recording Information': (.9, 'Transcription, structured extraction and document drafting are directly addressable by generative software.'),
    'Electronic Maintenance': (.1, 'Diagnostic advice can assist, while handling, repairing and testing equipment remain physical activities.'),
    'Handling and Manipulating Objects': (0, 'Software alone cannot handle physical objects. This index excludes robotics.'),
    'Managing Resources': (.4, 'Planning and analysis can be assisted; allocating resources and accepting responsibility require organizational authority.'),
    'Mechanical Maintenance': (.05, 'Instructions can assist troubleshooting, but software does not perform hands-on mechanical repairs.'),
    'Operating Vehicles, Mechanized Devices or Equipment': (0, 'Vehicle and equipment operation are outside this software-only generative AI scope.'),
    'Performing Physical Activities': (0, 'Bodily effort and movement cannot be performed by software alone.'),
    'Processing Information': (.9, 'Compiling, classifying, coding and checking digital information offer substantial software assistance potential.'),
    'Analyzing Data or Information': (.8, 'Models and analytical tools can assist interpretation and analysis; data quality and specialist judgment remain necessary.'),
    'Setting Objectives and Formulating Strategies': (.5, 'Models can develop options and scenarios; organizational priorities and final decisions remain accountable human choices.'),
    'Evaluating': (.5, 'Comparing evidence can be assisted; context, judgment and verification limit unattended use.'),
    'Judging Quality': (.35, 'Digital evidence may be reviewed by models, but physical quality, standards and acceptance often require people.'),
    'Making Decisions': (.4, 'Decision support is feasible; authority, consequences of error and context limit autonomous decisions.'),
    'Planning and Organizing': (.65, 'Software can draft plans, schedules and workflows; implementation and coordination remain necessary.'),
    'Scheduling Work and Activities': (.8, 'Constraint-based schedules and routine coordination can be substantially assisted by software.'),
    'Thinking Creatively': (.65, 'Generative tools can produce drafts, code, designs and ideas; direction, originality and quality control vary by setting.'),
    'Updating and Applying Knowledge': (.6, 'Retrieval and explanation support learning and application, but reliable domain expertise is still needed.'),
    'Assisting and Caring for Others': (.15, 'Information support can assist care, while hands-on help, trust and personal responsibility remain human activities.'),
    'Coaching and Developing Others': (.3, 'Feedback and learning materials can be assisted; personal development depends on relationships and context.'),
    'Communicating with Persons Outside Organization': (.65, 'Drafts, translation and routine messages can be assisted; negotiation and accountable representation still need people.'),
    'Communicating with Coworkers': (.65, 'Summaries, drafts and translations can support workplace communication; shared context and relationships remain.'),
    'Coordinating the Work and Activities of Others': (.4, 'Plans and messages can be assisted, while resolving constraints and aligning people require human participation.'),
    'Establishing and Maintaining Interpersonal Relationships': (.15, 'Suggested messages can help, but software does not replace reciprocal human trust and relationships.'),
    'Interpreting the Meaning of Information for Others': (.8, 'Explanation, translation and summarization are directly supported by generative models, with verification.'),
    'Performing for or Working Directly with the Public': (.2, 'Some digital interaction can be assisted; live performance, service and physical presence limit substitution.'),
    'Providing Consultation and Advice': (.5, 'Models can draft analyses and options; professional accountability and client context constrain unattended advice.'),
    'Resolving Conflicts and Negotiating with Others': (.25, 'Preparation and scenario analysis can be assisted; trust, authority and resolution involve people.'),
    'Selling or Influencing Others': (.45, 'Digital outreach and preparation can be assisted; persuasion, relationships and physical service vary by role.'),
    'Staffing': (.4, 'Administrative drafting and matching can be assisted; fair selection and final hiring decisions require accountable oversight.'),
    'Supervising Subordinates': (.2, 'Administrative supervision can be supported; responsibility, feedback and staff relationships remain human work.'),
    'Team Building': (.15, 'Software can suggest activities, but building shared trust and cooperation requires people.'),
    'Training and Teaching': (.4, 'Content and feedback can be assisted; pedagogy, supervision, motivation and practical instruction remain contextual.'),
}

CONTEXT = {
    'Consequence of Error (Degree of Consequence of Error)': ('Consequences of error', 'Higher consequences strengthen the case for human verification.'),
    'Responsibility for Health and Safety (Responsibility Degree)': ('Health and safety responsibility', 'Responsibility for people’s safety makes human oversight important.'),
    'Responsibility for Outcomes and Results (Responsibility Degree)': ('Responsibility for outcomes', 'Accountability for outcomes remains with people and organizations.'),
    'Face-to-Face Discussions (Frequency)': ('Face-to-face discussion', 'Frequent in-person discussion provides context that software alone does not supply.'),
}

def profile_score(levels, power=1, shift=0):
    weights = [levels[name] ** power for name in RUBRIC]
    if not sum(weights):
        return None
    # Physical-only coefficients remain zero in both sensitivity scenarios.
    capacities = [0 if c == 0 else max(0, min(1, c + shift)) for c, _ in RUBRIC.values()]
    return 10 * sum(w * c for w, c in zip(weights, capacities)) / sum(weights)

def score_occupation(profiles, contexts):
    if not profiles:
        raise ValueError('Missing OaSIS profiles, do not invent a score')
    for profile in profiles:
        if set(profile['levels']) != set(RUBRIC) or any(v < 0 or v > 5 for v in profile['levels'].values()):
            raise ValueError('Incomplete or out-of-range activity ratings')
    scores = [profile_score(p['levels']) for p in profiles]
    if any(s is None for s in scores):
        raise ValueError('An all-zero profile must be reviewed')
    raw = mean(scores)
    scenarios = [mean(profile_score(p['levels'], power, shift) for p in profiles) for power in (1, 2) for shift in (-.15, 0, .15)]
    rows = []
    for name, (capability, rationale) in RUBRIC.items():
        contribution = mean(10 * p['levels'][name] * capability / sum(p['levels'].values()) for p in profiles)
        rows.append({'name': name, 'level': round(mean(p['levels'][name] for p in profiles), 2), 'capability': capability, 'contribution': round(contribution, 4), 'reason': rationale})
    drivers = sorted(rows, key=lambda x: (-x['contribution'], x['name']))[:3]
    constraints = sorted([r for r in rows if r['capability'] <= .25], key=lambda x: (-x['level'], x['name']))[:3]
    human = [{'name': title, 'level': round(mean(c[key] for c in contexts), 2), 'reason': reason} for key, (title, reason) in CONTEXT.items()]
    explanation = f"The largest modeled contributions are {drivers[0]['name'].lower()} and {drivers[1]['name'].lower()}. {constraints[0]['name']} remains a lower-exposure activity in this software-only model."
    summary = {'model': MODEL, 'range': [round(min(scenarios), 1), round(max(scenarios), 1)], 'profiles': len(profiles), 'explanation': explanation, 'drivers': [d['name'] for d in drivers], 'humanOversight': round(max(human[0]['level'], human[1]['level']), 1)}
    evidence = {'model': MODEL, 'rawScore': raw, 'sensitivityRaw': scenarios, 'profileRange': [round(min(scores), 2), round(max(scores), 2)], 'profiles': [{'code': p['code'], 'title': p['title'], 'rawScore': s, 'levels': p['levels']} for p, s in zip(profiles, scores)], 'drivers': drivers, 'constraints': constraints, 'humanContext': human, 'activities': rows}
    return raw, summary, evidence

def relative_indices(values):
    """Midrank among the fixed NOC cohort, 0 to 10. Never a probability."""
    ordered = sorted(values.items(), key=lambda pair: (pair[1], pair[0]))
    result = {}
    i = 0
    while i < len(ordered):
        j = i + 1
        while j < len(ordered) and abs(ordered[j][1] - ordered[i][1]) < 1e-12:
            j += 1
        index = 10 * (i + j - 1) / 2 / max(1, len(ordered) - 1)
        for code, _ in ordered[i:j]:
            result[code] = round(index, 1)
        i = j
    return result

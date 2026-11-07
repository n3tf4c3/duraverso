import { functioningStatuses, type DurabilitySummary } from '@duraverso/core';
import { fill } from '@/lib/i18n';
import type { extraCopy } from '@/lib/copy';

type Copy = ReturnType<typeof extraCopy>;
const statusLabel = (copy: Copy) => ({ working: copy.working, with_problem: copy.problem, not_working: copy.stopped });

/** Contagens reais dos relatos aprovados; sem percentual, nota ou estimativa de vida útil. */
export function DurabilityPanel({ summary, copy }: { summary: DurabilitySummary; copy: Copy }) {
  if (summary.total === 0) return null;
  const labels = statusLabel(copy);
  return (
    <div className="info-panel durability-panel">
      <h3>{copy.durabilityTitle}</h3>
      <p>{fill(copy.durabilityLead, { n: summary.total })}</p>
      <ul className="durability-counts">
        {functioningStatuses.map((status) => (
          <li key={status}>
            <strong>{summary.functioning[status]}</strong> {labels[status]}
          </li>
        ))}
        <li>
          <strong>{summary.hadRepair}</strong> {copy.durabilityRepairs}
        </li>
      </ul>
      <table className="data-table">
        <caption>{copy.durabilityByUsage}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.durabilityUsage}</th>
            {functioningStatuses.map((status) => (
              <th scope="col" key={status}>
                {labels[status]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.byUsage
            .filter((band) => band.total > 0)
            .map((band) => (
              <tr key={band.band}>
                <th scope="row">{copy.usageBands[band.band]}</th>
                {functioningStatuses.map((status) => (
                  <td key={status}>{band[status]}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      <p className="small">{copy.durabilityNote}</p>
    </div>
  );
}

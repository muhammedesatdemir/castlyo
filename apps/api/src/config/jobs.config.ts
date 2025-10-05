// Visible and applyable job statuses, configurable via env.

function parseCsv(value: string | undefined, fallback: readonly string[]): readonly string[] {
  if (!value) return fallback;
  const parts = value.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : fallback;
}

const defaultVisible = ['OPEN', 'PUBLISHED'] as const;
const defaultApplyable = ['OPEN', 'PUBLISHED'] as const;

export const JOB_VISIBLE_STATUSES = parseCsv(process.env.JOB_VISIBLE_STATUSES, defaultVisible);
export const JOB_APPLYABLE_STATUSES = parseCsv(process.env.JOB_APPLYABLE_STATUSES, defaultApplyable);

 
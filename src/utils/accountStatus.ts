/**
 * Account status helpers (active/inactive detection)
 */

export const getInactiveReason = (profileData: any): string | null => {
  if (!profileData || typeof profileData !== 'object') return null;

  const pick = (obj: any, key: string) =>
    Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;

  // Common top-level keys used by backends/admin panels
  const candidates: Array<[string, any]> = [
    ['status', pick(profileData, 'status')],
    ['employee_status', pick(profileData, 'employee_status')],
    ['employment_status', pick(profileData, 'employment_status')],
    ['is_active', pick(profileData, 'is_active')],
    ['active', pick(profileData, 'active')],
    ['employment_active', pick(profileData, 'employment_active')],
    ['employment_is_active', pick(profileData, 'employment_is_active')],
  ];

  for (const [k, v] of candidates) {
    if (v == null) continue;
    if (typeof v === 'boolean') {
      if (v === false) return `${k}=false`;
      continue;
    }
    if (typeof v === 'number') {
      if (v === 0) return `${k}=0`;
      continue;
    }
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (
        s === 'inactive' ||
        s === 'disabled' ||
        s === 'deactivated' ||
        s === 'terminated'
      ) {
        return `${k}=${v}`;
      }
      continue;
    }
  }

  // Common nested employment object (one level deep)
  const employment = pick(profileData, 'employment') ?? pick(profileData, 'employment_details');
  if (employment && typeof employment === 'object') {
    const nested = [
      ['employment.is_active', pick(employment, 'is_active')],
      ['employment.active', pick(employment, 'active')],
      ['employment.status', pick(employment, 'status')],
    ] as const;
    for (const [k, v] of nested) {
      if (v == null) continue;
      if (typeof v === 'boolean' && v === false) return `${k}=false`;
      if (typeof v === 'number' && v === 0) return `${k}=0`;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (
          s === 'inactive' ||
          s === 'disabled' ||
          s === 'deactivated' ||
          s === 'terminated'
        ) {
          return `${k}=${v}`;
        }
      }
    }
  }

  return null;
};


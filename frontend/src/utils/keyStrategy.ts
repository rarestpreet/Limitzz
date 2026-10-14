import { KeyComponent, KeyStrategyConfig, KeyStrategyType } from '../types/policy';

export interface KeyStrategyMeta {
  type: 'IP' | 'USER_ID' | 'ENDPOINT' | 'CUSTOM';
  label: string;
  badge: string;
  shortDesc: string;
  hoverOverview: string;
  example: string;
}

export const KEY_STRATEGY_DETAILS: Record<'IP' | 'USER_ID' | 'ENDPOINT' | 'CUSTOM', KeyStrategyMeta> = {
  IP: {
    type: 'IP',
    label: 'Client IP',
    badge: 'Network Origin',
    shortDesc: 'Rate limits per client IP origin',
    hoverOverview:
      'Extracts clientIp from request body. Clamps rate limits per remote IP address, protecting against DDoS or brute-force attacks from a single client host.',
    example: 'ip:192.168.1.100',
  },
  USER_ID: {
    type: 'USER_ID',
    label: 'User ID',
    badge: 'Identity Scoped',
    shortDesc: 'Rate limits per authenticated user',
    hoverOverview:
      'Extracts userId from request body. Unique and constant for a device or authenticated user across network switches and IP churn, maintaining persistent per-user quotas.',
    example: 'user:usr_98a72b',
  },
  ENDPOINT: {
    type: 'ENDPOINT',
    label: 'Endpoint',
    badge: 'Global Route',
    shortDesc: 'Generic limit on API route',
    hoverOverview:
      'Extracts endpoint from request body. Enforces a generic shared rate limit on an API route across all callers, regardless of device, IP, or user identity.',
    example: 'endpoint:/api/v1/checkout',
  },
  CUSTOM: {
    type: 'CUSTOM',
    label: 'Custom (Composite)',
    badge: 'Multi-Attribute',
    shortDesc: 'Combines multiple keys into composite key',
    hoverOverview:
      'Combines multiple strategies together (e.g. User ID + Client IP, or User ID + Endpoint) into a composite compound key for fine-grained multi-tier throttling.',
    example: 'user:usr_98a:ip:10.0.0.1',
  },
};

export interface CompositeFieldMeta {
  key: KeyComponent;
  label: string;
  attribute: string;
  description: string;
}

export const COMPOSITE_FIELD_OPTIONS: CompositeFieldMeta[] = [
  {
    key: 'USER_ID',
    label: 'User ID',
    attribute: 'userId',
    description: 'Unique and constant identifier for the authenticated user/account.',
  },
  {
    key: 'IP',
    label: 'Client IP',
    attribute: 'clientIp',
    description: 'Remote IP address of client origin.',
  },
  {
    key: 'ENDPOINT',
    label: 'API Endpoint',
    attribute: 'endpoint',
    description: 'API route name / path for route-specific scoping.',
  },
];

export function formatKeyStrategyLabel(config?: KeyStrategyConfig): string {
  if (!config) return 'UNKNOWN';

  const type = config.type;
  if (type === 'CUSTOM' || type === 'COMPOSITE') {
    const fields = config.fields || config.custom || [];
    if (fields.length > 0) {
      return `CUSTOM (${fields.join(' + ')})`;
    }
    return 'CUSTOM (Composite)';
  }

  if (type === 'USER' || type === 'USER_ID') {
    return 'USER_ID';
  }

  return type;
}

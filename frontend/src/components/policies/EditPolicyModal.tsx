import React, { useState, useEffect } from 'react';
import { updatePolicy } from '../../api/policies';
import { AlgorithmType, FailMode, KeyStrategyConfig, Policy, PolicyStatus, UpdatePolicyRequest } from '../../types/policy';
import { Edit3, X, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import { KeyStrategySelector } from './KeyStrategySelector';

interface EditPolicyModalProps {
  isOpen: boolean;
  policy: Policy | null;
  projectName: string;
  onClose: () => void;
  onPolicyUpdated: (updated: Policy) => void;
}

export const EditPolicyModal: React.FC<EditPolicyModalProps> = ({
  isOpen,
  policy,
  projectName,
  onClose,
  onPolicyUpdated,
}) => {
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('TOKEN_BUCKET');

  // Token Bucket fields
  const [capacity, setCapacity] = useState<number>(20);
  const [refillRate, setRefillRate] = useState<number>(5);
  const [refillIntervalMs, setRefillIntervalMs] = useState<number>(1000);
  const [ttlMs, setTtlMs] = useState<number>(60000);

  // Anchored Window fields
  const [windowLimit, setWindowLimit] = useState<number>(100);
  const [windowMs, setWindowMs] = useState<number>(60000);

  // Key Strategy & FailMode & Status
  const [keyStrategy, setKeyStrategy] = useState<KeyStrategyConfig>({ type: 'IP' });
  const [failMode, setFailMode] = useState<FailMode>('FAIL_OPEN');
  const [status, setStatus] = useState<PolicyStatus>('ACTIVE');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or re-populate when policy prop changes
  useEffect(() => {
    if (policy) {
      setName(policy.name || '');
      setEndpoint(policy.endpoint || '');
      setAlgorithmType(policy.algorithmType || 'TOKEN_BUCKET');

      if (policy.algorithmType === 'TOKEN_BUCKET') {
        const cfg = policy.algorithmConfig as any;
        setCapacity(cfg?.capacity ?? 20);
        setRefillRate(cfg?.refillRate ?? 5);
        setRefillIntervalMs(cfg?.refillIntervalMs ?? 1000);
        setTtlMs(cfg?.ttlMs ?? 60000);
      } else {
        const cfg = policy.algorithmConfig as any;
        setWindowLimit(cfg?.limit ?? 100);
        setWindowMs(cfg?.windowMs ?? 60000);
      }

      setKeyStrategy(policy.keyStrategy || { type: 'IP' });
      setFailMode(policy.failMode || 'FAIL_OPEN');
      setStatus(policy.status || 'ACTIVE');
      setError(null);
    }
  }, [policy, isOpen]);

  if (!isOpen || !policy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: UpdatePolicyRequest = {
      name,
      endpoint: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      algorithmType,
      algorithmConfig: algorithmType === 'TOKEN_BUCKET'
        ? {
            capacity: Number(capacity),
            refillRate: Number(refillRate),
            refillIntervalMs: Number(refillIntervalMs),
            ttlMs: Number(ttlMs),
          }
        : {
            limit: Number(windowLimit),
            windowMs: Number(windowMs),
          },
      keyStrategy,
      failMode,
      status,
    };

    try {
      const updated = await updatePolicy(policy.id, payload);
      onPolicyUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update rate limiting policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-[#18181b] border border-white/[0.12] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fb923c]/20 border border-[#fb923c]/40 flex items-center justify-center text-[#fb923c]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fafafa]">Edit Policy Configuration</h3>
              <span className="text-[11px] text-[#fb923c] font-mono">
                Project: {projectName} · Policy: {policy.name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#a1a1aa] hover:text-[#fafafa] hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Policy Name & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[#a1a1aa]">Policy Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. standard-auth-limiter"
                className="px-3 py-2 rounded-lg bg-[#131315] border border-white/[0.1] text-xs text-[#fafafa] focus:outline-none focus:border-[#fb923c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[#a1a1aa]">API Route Endpoint</label>
              <input
                type="text"
                required
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                placeholder="/api/v1/auth/login"
                className="px-3 py-2 rounded-lg bg-[#131315] border border-white/[0.1] font-mono text-xs text-[#fafafa] focus:outline-none focus:border-[#fb923c]"
              />
            </div>
          </div>

          {/* Algorithm Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-[#a1a1aa]">Rate Limiting Engine Algorithm</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlgorithmType('TOKEN_BUCKET')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  algorithmType === 'TOKEN_BUCKET'
                    ? 'bg-[#fb923c]/10 border-[#fb923c] text-[#fafafa]'
                    : 'bg-[#131315] border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.2]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#fb923c]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Token Bucket</span>
                </div>
                <span className="text-[10px] text-[#71717a]">
                  Smooth token refilling algorithm with burst capacity support.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAlgorithmType('ANCHORED_WINDOW')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  algorithmType === 'ANCHORED_WINDOW'
                    ? 'bg-[#fb923c]/10 border-[#fb923c] text-[#fafafa]'
                    : 'bg-[#131315] border-white/[0.08] text-[#a1a1aa] hover:border-white/[0.2]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#fb923c]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Anchored Window</span>
                </div>
                <span className="text-[10px] text-[#71717a]">
                  Fixed time-window quota counter reset at window boundary.
                </span>
              </button>
            </div>
          </div>

          {/* Algorithm Config Inputs */}
          {algorithmType === 'TOKEN_BUCKET' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#131315] p-3 rounded-xl border border-white/[0.06]">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#a1a1aa]">Capacity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#a1a1aa]">Refill Rate</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={refillRate}
                  onChange={e => setRefillRate(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#a1a1aa]">Interval (ms)</label>
                <input
                  type="number"
                  min="10"
                  step="100"
                  required
                  value={refillIntervalMs}
                  onChange={e => setRefillIntervalMs(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#a1a1aa]">Key TTL (ms)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={ttlMs}
                  onChange={e => setTtlMs(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa]"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 bg-[#131315] p-3 rounded-xl border border-white/[0.06]">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#a1a1aa]">Max Requests (Limit)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={windowLimit}
                  onChange={e => setWindowLimit(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-[#a1a1aa]">Window Duration (ms)</label>
                <input
                  type="number"
                  min="100"
                  step="1000"
                  required
                  value={windowMs}
                  onChange={e => setWindowMs(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa]"
                />
              </div>
            </div>
          )}

          {/* Key Strategy Selector */}
          <KeyStrategySelector value={keyStrategy} onChange={setKeyStrategy} />

          {/* Failure Semantics & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fail Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-[#a1a1aa]">Failure Mode (Circuit Breaker)</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#131315] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setFailMode('FAIL_OPEN')}
                  className={`py-1.5 text-xs font-mono rounded transition-all ${
                    failMode === 'FAIL_OPEN'
                      ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                      : 'text-[#a1a1aa] hover:text-[#fafafa]'
                  }`}
                >
                  FAIL_OPEN
                </button>
                <button
                  type="button"
                  onClick={() => setFailMode('FAIL_CLOSED')}
                  className={`py-1.5 text-xs font-mono rounded transition-all ${
                    failMode === 'FAIL_CLOSED'
                      ? 'bg-[#f43f5e]/20 text-[#f43f5e] font-bold border border-[#f43f5e]/40'
                      : 'text-[#a1a1aa] hover:text-[#fafafa]'
                  }`}
                >
                  FAIL_CLOSED
                </button>
              </div>
            </div>

            {/* Policy Status */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-[#a1a1aa]">Policy Status</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#131315] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setStatus('ACTIVE')}
                  className={`py-1.5 text-xs font-mono rounded transition-all ${
                    status === 'ACTIVE'
                      ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                      : 'text-[#a1a1aa] hover:text-[#fafafa]'
                  }`}
                >
                  ACTIVE
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('INACTIVE')}
                  className={`py-1.5 text-xs font-mono rounded transition-all ${
                    status === 'INACTIVE'
                      ? 'bg-[#fb923c]/20 text-[#fb923c] font-bold border border-[#fb923c]/40'
                      : 'text-[#a1a1aa] hover:text-[#fafafa]'
                  }`}
                >
                  INACTIVE
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#a1a1aa] hover:text-[#fafafa] hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#f97316] text-[#09090b] hover:bg-[#fb923c] shadow-lg shadow-[#f97316]/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Update Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

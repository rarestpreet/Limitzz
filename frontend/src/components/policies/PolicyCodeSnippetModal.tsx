import React, { useState, useEffect } from 'react';
import { Policy } from '../../types/policy';
import { ApiKey } from '../../types/apiKey';
import { fetchApiKeys } from '../../api/apiKeys';
import { 
  generateJavaScriptSnippet, 
  generateJavaSnippet, 
  generatePythonSnippet, 
  generateCurlSnippet, 
  SupportedLanguage 
} from '../../utils/codeSnippetGenerator';
import { formatKeyStrategyLabel } from '../../utils/keyStrategy';
import { 
  Code2, 
  X, 
  Copy, 
  Check, 
  Key, 
  Globe, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  FileCode2 
} from 'lucide-react';

interface PolicyCodeSnippetModalProps {
  isOpen: boolean;
  policy: Policy | null;
  projectName: string;
  onClose: () => void;
}

export const PolicyCodeSnippetModal: React.FC<PolicyCodeSnippetModalProps> = ({
  isOpen,
  policy,
  projectName,
  onClose,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [copied, setCopied] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('rlaas_live_your_api_key_here');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);

  // Default gateway host: check if in browser
  const defaultHost = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8081`
    : 'http://localhost:8081';

  const [hostUrl, setHostUrl] = useState<string>(defaultHost);

  // Load tenant's active API keys on mount/open
  useEffect(() => {
    if (isOpen) {
      fetchApiKeys()
        .then(keys => {
          const activeKeys = keys.filter(k => k.status === 'ACTIVE');
          setApiKeys(activeKeys);
          if (activeKeys.length > 0) {
            // Mask or use prefix + truncated
            setSelectedApiKey(`rlaas_live_${activeKeys[0].prefix}_...`);
          } else {
            setSelectedApiKey('rlaas_live_your_api_key_here');
          }
        })
        .catch(() => {
          // Fallback to placeholder
          setSelectedApiKey('rlaas_live_your_api_key_here');
        });
    }
  }, [isOpen]);

  if (!isOpen || !policy) return null;

  const effectiveApiKey = useCustomKey && customApiKey.trim()
    ? customApiKey.trim()
    : selectedApiKey;

  // Generate code dynamically based on current language and policy
  let snippetCode = '';
  switch (selectedLanguage) {
    case 'javascript':
      snippetCode = generateJavaScriptSnippet({ policy, hostUrl, apiKey: effectiveApiKey });
      break;
    case 'java':
      snippetCode = generateJavaSnippet({ policy, hostUrl, apiKey: effectiveApiKey });
      break;
    case 'python':
      snippetCode = generatePythonSnippet({ policy, hostUrl, apiKey: effectiveApiKey });
      break;
    case 'curl':
      snippetCode = generateCurlSnippet({ policy, hostUrl, apiKey: effectiveApiKey });
      break;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy snippet', err);
    }
  };

  const strategyLabel = formatKeyStrategyLabel(policy.keyStrategy);
  const strategyType = policy.keyStrategy?.type || 'IP';
  const customFields = (policy.keyStrategy?.fields || policy.keyStrategy?.custom || []) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-[#18181b] border border-white/[0.12] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 my-8 max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fb923c]/20 border border-[#fb923c]/40 flex items-center justify-center text-[#fb923c]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#fafafa]">
                  RLaaS Gateway Integration Snippet
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fb923c]/15 text-[#fb923c] font-semibold border border-[#fb923c]/30">
                  {strategyLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#a1a1aa] font-mono">
                <span>Project: <strong className="text-[#fafafa] font-sans">{projectName}</strong></span>
                <span>·</span>
                <span>Policy: <strong className="text-[#fafafa] font-sans">{policy.name}</strong></span>
                <span>·</span>
                <span className="text-[#fb923c]">{policy.endpoint}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#fafafa] hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar (Host URL, API Key & Language Tabs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[#131315] rounded-xl border border-white/[0.06] text-xs">
          {/* Host URL input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#fb923c]" />
              RLaaS Gateway Host
            </label>
            <input
              type="text"
              value={hostUrl}
              onChange={e => setHostUrl(e.target.value)}
              placeholder="http://localhost:8081"
              className="px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa] focus:outline-none focus:border-[#fb923c]"
            />
          </div>

          {/* API Key selector */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1">
                <Key className="w-3 h-3 text-[#fb923c]" />
                Target API Key
              </label>
              <button
                type="button"
                onClick={() => setUseCustomKey(!useCustomKey)}
                className="text-[10px] text-[#fb923c] hover:underline font-mono"
              >
                {useCustomKey ? 'Use Existing Key' : 'Enter Custom Secret'}
              </button>
            </div>

            {useCustomKey ? (
              <input
                type="text"
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                placeholder="rlaas_live_..."
                className="px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa] focus:outline-none focus:border-[#fb923c]"
              />
            ) : (
              <select
                value={selectedApiKey}
                onChange={e => setSelectedApiKey(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-white/[0.1] font-mono text-xs text-[#fafafa] focus:outline-none focus:border-[#fb923c]"
              >
                {apiKeys.length > 0 ? (
                  apiKeys.map(k => (
                    <option key={k.id} value={`rlaas_live_${k.prefix}_[YOUR_SECRET]`}>
                      {k.name} ({k.prefix}...) - Active
                    </option>
                  ))
                ) : (
                  <option value="rlaas_live_your_api_key_here">
                    Placeholder (rlaas_live_your_api_key_here)
                  </option>
                )}
              </select>
            )}
          </div>
        </div>

        {/* Language Tabs & Copy Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-[#131315] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setSelectedLanguage('javascript')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedLanguage === 'javascript'
                  ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30 font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              JavaScript (Node)
            </button>
            <button
              onClick={() => setSelectedLanguage('java')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedLanguage === 'java'
                  ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30 font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              Java (HttpClient)
            </button>
            <button
              onClick={() => setSelectedLanguage('python')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedLanguage === 'python'
                  ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30 font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              Python (Requests)
            </button>
            <button
              onClick={() => setSelectedLanguage('curl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedLanguage === 'curl'
                  ? 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30 font-bold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              cURL
            </button>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border ${
              copied
                ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40'
                : 'bg-[#27272a] text-[#fafafa] border-white/[0.1] hover:bg-[#353437] hover:border-[#fb923c]/40'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#fb923c]" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-xl bg-[#0d0d0e] border border-white/[0.1] p-4 font-mono text-xs text-[#fafafa] overflow-x-auto max-h-[380px] shadow-inner">
          <pre className="leading-relaxed">
            <code>{snippetCode}</code>
          </pre>
        </div>

        {/* Key Strategy & Execution Overview Note */}
        <div className="p-3 rounded-xl bg-[#131315] border border-white/[0.06] flex items-center justify-between text-xs text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
            <span>
              Pre-execution guard queries <code className="text-[#fb923c]">POST /v1/check</code> before invoking your dummy business method.
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#71717a]">
            Status 200 = Allowed · Status 429 = Throttled
          </span>
        </div>
      </div>
    </div>
  );
};

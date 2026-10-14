import React, { useState } from 'react';
import { KeyComponent, KeyStrategyConfig, KeyStrategyType } from '../../types/policy';
import { KEY_STRATEGY_DETAILS, COMPOSITE_FIELD_OPTIONS } from '../../utils/keyStrategy';
import { Info, Check, Sparkles, Layers } from 'lucide-react';

interface KeyStrategySelectorProps {
  value: KeyStrategyConfig;
  onChange: (config: KeyStrategyConfig) => void;
}

export const KeyStrategySelector: React.FC<KeyStrategySelectorProps> = ({ value, onChange }) => {
  const currentType = (value?.type === 'USER' ? 'USER_ID' : value?.type === 'COMPOSITE' ? 'CUSTOM' : value?.type) || 'IP';
  
  // Custom composite fields
  const currentFields: KeyComponent[] = (value?.fields as KeyComponent[]) || (value?.custom as KeyComponent[]) || ['USER_ID', 'IP'];

  const [hoveredStrategy, setHoveredStrategy] = useState<'IP' | 'USER_ID' | 'ENDPOINT' | 'CUSTOM' | null>(null);

  const handleSelectType = (selectedType: 'IP' | 'USER_ID' | 'ENDPOINT' | 'CUSTOM') => {
    if (selectedType === 'CUSTOM') {
      onChange({
        type: 'CUSTOM',
        fields: currentFields.length > 0 ? currentFields : ['USER_ID', 'IP'],
      });
    } else {
      onChange({
        type: selectedType,
      });
    }
  };

  const handleToggleField = (fieldKey: KeyComponent) => {
    const exists = currentFields.includes(fieldKey);
    let updated: KeyComponent[];
    if (exists) {
      updated = currentFields.filter(f => f !== fieldKey);
    } else {
      updated = [...currentFields, fieldKey];
    }
    // Prevent leaving with 0 fields
    if (updated.length === 0) {
      updated = [fieldKey];
    }
    onChange({
      type: 'CUSTOM',
      fields: updated,
    });
  };

  const activeMeta = KEY_STRATEGY_DETAILS[currentType as 'IP' | 'USER_ID' | 'ENDPOINT' | 'CUSTOM'] || KEY_STRATEGY_DETAILS.IP;
  const displayMeta = hoveredStrategy ? KEY_STRATEGY_DETAILS[hoveredStrategy] : activeMeta;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#fb923c]" />
          Key Extraction Strategy
        </label>
        <span className="text-[10px] font-mono text-[#71717a]">
          Extracted strictly from Request Body
        </span>
      </div>

      {/* Strategy Selector Buttons */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#131315] p-1.5 rounded-xl border border-white/[0.08]">
        {(['IP', 'USER_ID', 'ENDPOINT', 'CUSTOM'] as const).map(strategy => {
          const meta = KEY_STRATEGY_DETAILS[strategy];
          const isSelected = currentType === strategy;
          return (
            <div
              key={strategy}
              className="relative group"
              onMouseEnter={() => setHoveredStrategy(strategy)}
              onMouseLeave={() => setHoveredStrategy(null)}
            >
              <button
                type="button"
                onClick={() => handleSelectType(strategy)}
                className={`w-full py-2 px-2 text-xs font-mono rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 border ${
                  isSelected
                    ? 'bg-[#27272a] text-[#fb923c] border-[#fb923c]/40 font-bold shadow-md shadow-black/40'
                    : 'text-[#a1a1aa] hover:text-[#fafafa] border-transparent hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-xs">{strategy === 'CUSTOM' ? 'CUSTOM' : strategy}</span>
                <span className="text-[9px] font-sans opacity-70 truncate max-w-full">
                  {meta.label}
                </span>
              </button>

              {/* Hover Tooltip Overview */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-lg bg-[#222225] border border-white/[0.15] shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-[11px] text-[#fafafa]">{meta.label}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#fb923c]/20 text-[#fb923c]">
                    {meta.badge}
                  </span>
                </div>
                <p className="text-[10px] text-[#d4d4d8] leading-tight mb-1.5">
                  {meta.hoverOverview}
                </p>
                <div className="text-[9px] font-mono text-[#a1a1aa] bg-[#18181b] p-1 rounded border border-white/[0.06]">
                  Key: <code className="text-[#fb923c]">{meta.example}</code>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Strategy Overview Card */}
      <div className="p-3 rounded-xl bg-[#18181b] border border-white/[0.08] flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#fb923c]/15 text-[#fb923c] flex items-center justify-center">
              <Info className="w-3 h-3" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#fafafa]">{displayMeta.label}</span>
              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#a1a1aa]">
                {displayMeta.badge}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#a1a1aa]">
            Sample: <code className="text-[#fb923c]">{displayMeta.example}</code>
          </span>
        </div>
        <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
          {displayMeta.hoverOverview}
        </p>
      </div>

      {/* Composite / Custom Multi-Select Options */}
      {currentType === 'CUSTOM' && (
        <div className="p-3.5 rounded-xl bg-[#141416] border border-[#fb923c]/30 flex flex-col gap-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#fb923c]" />
              <span className="text-xs font-bold text-[#fafafa]">
                Select Composite Key Attributes
              </span>
            </div>
            <span className="text-[10px] text-[#fb923c] font-mono">
              Combined into Compound Redis Key
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COMPOSITE_FIELD_OPTIONS.map(field => {
              const isChecked = currentFields.includes(field.key);
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => handleToggleField(field.key)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                    isChecked
                      ? 'bg-[#fb923c]/10 border-[#fb923c]/50 text-[#fafafa]'
                      : 'bg-[#18181b] border-white/[0.08] text-[#71717a] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#fb923c]">
                      {field.key}
                    </span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked
                          ? 'bg-[#fb923c] border-[#fb923c] text-black'
                          : 'border-white/[0.2] bg-transparent'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#a1a1aa]">
                    payload.{field.attribute}
                  </span>
                  <span className="text-[9px] text-[#71717a] line-clamp-2">
                    {field.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Composite Key Formula Preview */}
          <div className="p-2 rounded-lg bg-[#0d0d0e] border border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] text-[#a1a1aa] font-mono">Formula:</span>
            <code className="text-xs font-mono text-[#fb923c]">
              {currentFields.map(f => {
                if (f === 'USER_ID') return 'user:{userId}';
                if (f === 'IP') return 'ip:{clientIp}';
                if (f === 'ENDPOINT') return 'endpoint:{endpoint}';
                return String(f).toLowerCase();
              }).join(':')}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};

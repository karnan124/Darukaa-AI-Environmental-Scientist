import React, { useState } from 'react';
import type { EnvironmentalContext } from '../types/environmental.js';
import { Layers, Sprout, CloudRain, Bug, ShieldAlert, MapPin, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface ContextPillarsPanelProps {
  context: EnvironmentalContext;
  onUpdateContext: (updated: Partial<EnvironmentalContext>) => void;
  onRunAnalysis: () => void;
  isLoading: boolean;
}

export const ContextPillarsPanel: React.FC<ContextPillarsPanelProps> = ({
  context,
  onUpdateContext,
  onRunAnalysis,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active observed variables
  let activeCount = 0;
  if (context.location.region) activeCount++;
  if (context.soil.organic_carbon_percent !== null) activeCount++;
  if (context.soil.ph !== null) activeCount++;
  if (context.soil.moisture_percent !== null) activeCount++;
  if (context.land.crop) activeCount++;
  if (context.land.cropping_system) activeCount++;
  if (context.land.land_use) activeCount++;
  if (context.climate.rainfall_pattern) activeCount++;
  if (context.climate.rainfall_mm !== null) activeCount++;
  if (context.biodiversity.species_richness) activeCount++;
  if (context.biodiversity.pollinator_diversity) activeCount++;
  if (context.human_impact.pollution_level) activeCount++;

  return (
    <div id="context-pillars-panel" className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Layers className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-stone-900 tracking-tight">Active Environmental Context</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {activeCount} / 12 Variables Observed
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-run-analysis"
            type="button"
            disabled={isLoading || activeCount === 0}
            onClick={onRunAnalysis}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-stone-900 hover:bg-stone-800 text-white transition disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Analysis</span>
          </button>

          <button
            id="btn-toggle-context-expand"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-md transition"
            aria-label="Toggle parameter configuration"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Always visible summary pills) */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 bg-stone-50/50">
        {/* Region */}
        <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
            <MapPin className="w-3 h-3 text-stone-400" />
            <span>Region</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900 truncate">
            {context.location.region || <span className="text-stone-400 font-normal italic">Unspecified</span>}
          </p>
        </div>

        {/* Soil Organic Carbon */}
        <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
            <Sprout className="w-3 h-3 text-amber-600" />
            <span>Soil Carbon</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900">
            {context.soil.organic_carbon_percent !== null ? (
              <span className={context.soil.organic_carbon_percent < 0.8 ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                {context.soil.organic_carbon_percent}%
              </span>
            ) : (
              <span className="text-stone-400 font-normal italic">Unspecified</span>
            )}
          </p>
        </div>

        {/* Soil pH */}
        <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
            <span className="text-[10px] font-bold text-stone-400">pH</span>
            <span>Soil Reaction</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900">
            {context.soil.ph !== null ? (
              <span>pH {context.soil.ph}</span>
            ) : (
              <span className="text-stone-400 font-normal italic">Unspecified</span>
            )}
          </p>
        </div>

        {/* Crop & System */}
        <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
            <Sprout className="w-3 h-3 text-emerald-600" />
            <span>Crop & System</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900 truncate">
            {context.land.crop ? (
              <span>
                {context.land.crop} ({context.land.cropping_system || 'crop'})
              </span>
            ) : (
              <span className="text-stone-400 font-normal italic">Unspecified</span>
            )}
          </p>
        </div>

        {/* Rainfall Regime */}
        <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
            <CloudRain className="w-3 h-3 text-sky-600" />
            <span>Precipitation</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900 truncate">
            {context.climate.rainfall_pattern ? (
              <span className="capitalize">{context.climate.rainfall_pattern}</span>
            ) : (
              <span className="text-stone-400 font-normal italic">Unspecified</span>
            )}
          </p>
        </div>

        {/* Biodiversity */}
        <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium">
            <Bug className="w-3 h-3 text-purple-600" />
            <span>Biodiversity</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900 truncate">
            {context.biodiversity.species_richness || context.biodiversity.pollinator_diversity ? (
              <span className="capitalize">{context.biodiversity.pollinator_diversity || context.biodiversity.species_richness}</span>
            ) : (
              <span className="text-stone-400 font-normal italic">Unspecified</span>
            )}
          </p>
        </div>
      </div>

      {/* Collapsible Direct Editor */}
      {isExpanded && (
        <div className="p-4 border-t border-stone-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Soil Pillar */}
          <div className="space-y-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
              <Sprout className="w-3.5 h-3.5 text-amber-700" />
              <span>Soil Health Pillar</span>
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Soil Organic Carbon (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="e.g. 0.3"
                value={context.soil.organic_carbon_percent ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    soil: {
                      ...context.soil,
                      organic_carbon_percent: e.target.value === '' ? null : parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Soil pH</label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="11"
                placeholder="e.g. 7.2"
                value={context.soil.ph ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    soil: {
                      ...context.soil,
                      ph: e.target.value === '' ? null : parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Soil Moisture (%)</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 8.5"
                value={context.soil.moisture_percent ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    soil: {
                      ...context.soil,
                      moisture_percent: e.target.value === '' ? null : parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Land & Crop Pillar */}
          <div className="space-y-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Land & Crop Architecture</span>
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Primary Crop</label>
              <input
                type="text"
                placeholder="e.g. wheat, barley, maize"
                value={context.land.crop ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    land: {
                      ...context.land,
                      crop: e.target.value === '' ? null : e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Cropping System</label>
              <select
                value={context.land.cropping_system ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    land: {
                      ...context.land,
                      cropping_system: e.target.value === '' ? null : e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">-- Select System --</option>
                <option value="monoculture">Monoculture</option>
                <option value="crop rotation">Crop Rotation</option>
                <option value="intercropping">Intercropping / Polyculture</option>
                <option value="agroforestry">Agroforestry</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Geographic Region</label>
              <input
                type="text"
                placeholder="e.g. semi-arid, Mediterranean"
                value={context.location.region ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    location: {
                      ...context.location,
                      region: e.target.value === '' ? null : e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Climate & Biodiversity Pillar */}
          <div className="space-y-2.5 p-3 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
              <CloudRain className="w-3.5 h-3.5 text-sky-700" />
              <span>Climate & Ecosystem</span>
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Precipitation Regime</label>
              <select
                value={context.climate.rainfall_pattern ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    climate: {
                      ...context.climate,
                      rainfall_pattern: e.target.value === '' ? null : e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">-- Select Rainfall --</option>
                <option value="low">Low (&lt;400mm / semi-arid)</option>
                <option value="erratic">Erratic / Seasonal</option>
                <option value="moderate">Moderate (400 - 800mm)</option>
                <option value="high">High (&gt;800mm)</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Pollinator / Insect Status</label>
              <select
                value={context.biodiversity.pollinator_diversity ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    biodiversity: {
                      ...context.biodiversity,
                      pollinator_diversity: e.target.value === '' ? null : e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">-- Select Status --</option>
                <option value="severely low">Severely low / Absent</option>
                <option value="declining">Declining</option>
                <option value="moderate">Moderate</option>
                <option value="high">High / Healthy</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 mb-1">Landscape Fragmentation</label>
              <select
                value={context.land.habitat_fragmentation ?? ''}
                onChange={(e) =>
                  onUpdateContext({
                    land: {
                      ...context.land,
                      habitat_fragmentation: e.target.value === '' ? null : e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">-- Select Fragmentation --</option>
                <option value="high">High (isolated field patches)</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low (connected corridors)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

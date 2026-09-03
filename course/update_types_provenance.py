import os

with open('../src/core/types.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Add CapabilityScope and CapabilityProvenance to types.ts
scope_types = """export type CapabilityScope = 
  | 'production' 
  | 'test' 
  | 'example' 
  | 'benchmark' 
  | 'fixture' 
  | 'infrastructure' 
  | 'documentation' 
  | 'unknown';

export interface CapabilityProvenance {
  primaryScope: CapabilityScope;
  scopes: CapabilityScope[];
  filePaths: string[];
}
"""

if 'export type CapabilityScope' not in text:
    target_spot = 'export interface AgentCapability {'
    idx = text.find(target_spot)
    if idx != -1:
        text = text[:idx] + scope_types + '\n' + text[idx:]
        
        # Add scope and provenance to AgentCapability interface
        old_cap_end = "  anomalies: CapabilityAnomaly[];\n}"
        new_cap_end = "  anomalies: CapabilityAnomaly[];\n  scope?: CapabilityScope;\n  provenance?: CapabilityProvenance;\n}"
        text = text.replace(old_cap_end, new_cap_end, 1)

with open('../src/core/types.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated src/core/types.ts with CapabilityScope and CapabilityProvenance')

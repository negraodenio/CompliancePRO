import os

files_to_update = [
    "../src/core/types.ts",
    "../src/core/capability-detector.ts",
    "../tests/capability-discovery.test.ts",
    "../tests/capability-provenance.test.ts",
    "../tests/capability-calibration-benchmark.test.ts",
    "../tests/capability-calibration-regression.test.ts"
]

for fpath in files_to_update:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        count = content.count("DESTRUCTIVE_ACTION_WITHOUT_HITL")
        if count > 0:
            updated = content.replace("DESTRUCTIVE_ACTION_WITHOUT_HITL", "DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL")
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Updated {fpath}: replaced {count} occurrences of DESTRUCTIVE_ACTION_WITHOUT_HITL -> DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL")
        else:
            print(f"No occurrences in {fpath}")

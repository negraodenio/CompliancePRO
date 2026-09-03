import os

files_to_update = [
    "../src/core/types.ts",
    "../src/core/capability-detector.ts",
    "../tests/capability-discovery.test.ts",
    "../tests/capability-provenance.test.ts",
    "../tests/capability-calibration-benchmark.test.ts",
    "../tests/capability-calibration-regression.test.ts",
    "06_CERTIFICATION_EXAM_AND_RUBRIC.md"
]

for fpath in files_to_update:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        count = content.count("OBSERVED_BUT_UNAUTHORIZED")
        if count > 0:
            updated = content.replace("OBSERVED_BUT_UNAUTHORIZED", "OBSERVED_WITHOUT_VERIFIED_AUTH")
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"Updated {fpath}: replaced {count} occurrences of OBSERVED_BUT_UNAUTHORIZED -> OBSERVED_WITHOUT_VERIFIED_AUTH")
        else:
            print(f"No occurrences in {fpath}")

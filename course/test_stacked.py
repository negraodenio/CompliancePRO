import re

sample_autogen = """
from autogen import register_function

def calculate_mortgage(principal: float, rate: float, years: int) -> float:
    return principal * (rate / 12)

register_function(
    calculate_mortgage,
    caller=assistant,
    executor=user_proxy,
    name="mortgage_calculator",
    description="Calculate monthly mortgage repayment"
)

@user_proxy.register_for_execution()
@assistant.register_for_llm(name="currency_converter", description="Convert currency amounts")
def convert_fx(amount: float, from_curr: str, to_curr: str) -> float:
    return amount * 1.08
"""

# Test matching stacked decorators
decorator_matches = re.finditer(r'@(?:[\w\.]+(?:\([^)]*\))?\s*)*?\bdef\s+([a-zA-Z0-9_]+)', sample_autogen)
for m in decorator_matches:
    print('Decorated func:', m.group(1))

# Check for name="currency_converter" inside decorator arguments
named_matches = re.finditer(r'@[\w\.]+\s*\([^)]*?name\s*=\s*["\']([a-zA-Z0-9_\-\.]+)["\']', sample_autogen)
for m in named_matches:
    print('Named decorator tool:', m.group(1))

# Tournament of Type Alias Names for `T | null`

aliases = [
    # Core suggestions
    "IfPresent",
    "Explicit",
    "Known",
    "Resolved",
    "Definite",
    "Nullable",
    "Maybe",
    "Optional",
    # If… Pattern
    "IfActuallyPresent", "IfExplicitlyPresent", "IfIntentionallyPresent", "IfKnownPresent",
    "IfConfirmedPresent", "IfDefinitelyPresent", "IfReallyPresent", "IfProperlyPresent",
    "IfUniquelyPresent", "IfPresentElseAbsent", "IfPresentOtherwiseAbsent", "IfPresentOrAbsent",
    "IfPresentOrNull", "IfNotAbsent", "IfNonAbsent", "IfFullyPresent",
    # Nullable Synonyms
    "Absent", "AbsenceAllowed", "AbsencePossible", "AbsenceExplicit", "IntentionallyAbsent",
    "KnownAbsent", "ExplicitAbsence", "IntentionalAbsence", "PresentOrAbsent", "PresentOrMissing",
    "PresentOrEmpty", "PresentOrVoid", "PresentOrGone", "PresentOrLost", "PresentOrNothing",
    "PresentOrNullish",
    # Optional Style
    "ExplicitOptional", "NonUndefinedOptional", "DefinedOptional", "ConcreteOptional",
    "CertainOptional", "NullableOptional", "PresentOptional", "PresentOnlyOptional",
    "ExplicitlyOptional",
    # Result/Outcome Style
    "Resolvable", "Resolution", "Unambiguous", "UniqueResult", "CertainResult", "Determined",
    "DefinedResult", "KnownResult", "SingularResult", "Outcome", "ExplicitOutcome",
    # State/Condition Style
    "PresentState", "KnownState", "CertainState", "Confirmed", "DefinedState", "ExplicitState",
    "ConfirmedValue", "CertainValue", "DefinedValue",
    # Value/Entity Style
    "ExplicitValue", "DefiniteValue", "ConcreteValue", "UniqueValue", "SingularValue",
    "ExclusiveValue", "PresentValue", "IntentionalValue",
    # Presence/Absence Pair
    "PresentOrNull", "PresentOrAbsent", "PresentOrMissing", "PresentOrEmpty",
    "PresentOrVoid", "PresentOrNothing", "PresentOrGone",
    # Short/Abstract
    "Nullish", "NullOr", "Option", "Opt", "Val", "Pres", "AbsentOrPresent",
    # Domain-Agnostic
    "Intentional", "Definitive", "Decided",
    # Presence Only If…
    "PresentIf", "PresentIfTrue", "PresentIfValid", "PresentIfKnown",
    "PresentIfResolved", "PresentIfConfirmed", "PresentIfDetermined",
    # Philosophical/Metaphorical
    "Manifest", "Actual", "Realized", "Existing", "Concrete", "Attained",
    # Longer Descriptive
    "PresentWhenIntentionallyDefined", "PresentOnlyIfKnown", "PresentIfExplicitlySet",
    "PresentIfIntentionallySet", "PresentOrIntentionallyAbsent", "PresentOrIntentionallyNull",
    # Pairing for undefined variants (just for completeness, but excluded)
    # "IfDefined", "PossiblyPresent", "OptionallyPresent", "MaybePresent"
]

import random

def snippet(alias: str) -> str:
    return (
        f"\n"
        f"\n"
        f"function getWinningPlayer(): {alias}<Player> {{}}\n"
        f"\n"
        f"interface User {{\n"
				f"	firstName: string;\n"
				f"	middleName: {alias}<string>;\n"
				f"	lastName: string;\n"
				f"}}"
    )

def run_tournament(candidates):
    round_num = 1
    while len(candidates) > 1:
        print(f"\n=== Round {round_num}: {len(candidates)} candidates ===")
        winners = []
        random.shuffle(candidates)
        for i in range(0, len(candidates), 2):
            a = candidates[i]
            b = candidates[i + 1] if i + 1 < len(candidates) else None
            if not b:
                winners.append(a)
                continue

            print(f"\nMatch: 1) {a} vs 2) {b}\n")
            print("Snippet for 1:\n" + snippet(a))
            print("Snippet for 2:\n" + snippet(b))
            choice = None
            while choice not in ("1", "2"):
                choice = input("Choose your preferred alias (1 or 2): ").strip()
            winners.append(a if choice == "1" else b)
        candidates = winners
        round_num += 1

    print(f"\n🏆 Champion: {candidates[0]} 🏆")
    return candidates[0]

if __name__ == "__main__":
    print("Welcome to the Type Alias Tournament!")
    champion = run_tournament(aliases)
    print(f"\nThe most preferred alias is: {champion}")

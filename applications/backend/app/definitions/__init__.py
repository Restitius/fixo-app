"""Definitions — declarative private home for governed system definitions.

    app/definitions/
    |-- queries/          SQL manifest + *.sql (canonical store: app/queries/)
    |-- integrations/     INT-* declarative definitions
    |-- workflows/        WF-* state machines
    |-- screens/          SCR-* screen map
    |-- notifications/    NTF-* notification policies
    |-- pricing/          PRICE-* rules
    '-- permissions/      policy definitions

Registries (`app/registries/`) are populated FROM these definitions at startup;
definitions themselves remain infrastructure-private (never imported by
application/domain code).
"""
"""phase3 service catalog — columns, fuzzy-search indexes, service seed.

Revision ID: 0004_phase3_catalog
Revises: 0003_phase2_functions

Search runs inside PostgreSQL (pg_trgm + GIN) rather than an external engine:
the dataset is small, the index keeps it fast, and no extra infrastructure.
"""
from __future__ import annotations

from alembic import op

revision = "0004_phase3_catalog"
down_revision = "0003_phase2_functions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Catalog display fields.
    op.execute('ALTER TABLE "SERVICES" ADD COLUMN IF NOT EXISTS sort_order SMALLINT NOT NULL DEFAULT 0')
    op.execute('ALTER TABLE "SERVICES" ADD COLUMN IF NOT EXISTS icon VARCHAR(60)')

    # Fuzzy search inside Postgres: trigram similarity + GIN acceleration.
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_SERVICES_NAME_TRGM" '
        'ON "SERVICES" USING gin (name gin_trgm_ops)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_SERVICES_DESC_TRGM" '
        'ON "SERVICES" USING gin (description gin_trgm_ops)'
    )

    op.execute(
        """
        INSERT INTO "SERVICES" (category_id, name, slug, description, sort_order, icon)
        SELECT c.category_id, v.name, v.slug, v.description, v.sort_order, v.icon
        FROM (VALUES
            ('PLUMBING',   'Leak Repair',            'leak-repair',          'Fix dripping taps, burst pipes and hidden leaks.',      1, 'droplets'),
            ('PLUMBING',   'Water Heater Install',   'water-heater-install', 'Supply and install electric or solar water heaters.',   2, 'flame'),
            ('ELECTRICAL', 'Wiring & Rewiring',      'wiring-rewiring',      'Safe wiring for new builds and older homes.',           1, 'cable'),
            ('ELECTRICAL', 'Socket & Switch Fix',    'socket-switch-fix',    'Repair or replace faulty sockets and switches.',         2, 'plug'),
            ('CLEANING',   'Deep Home Cleaning',     'deep-home-cleaning',   'Top-to-bottom scrub for kitchens, baths and floors.',   1, 'sparkles'),
            ('CLEANING',   'Sofa & Carpet Shampoo',  'sofa-carpet-shampoo',  'Stain removal and shampoo for upholstery.',             2, 'brush'),
            ('CARPENTRY',  'Door & Lock Fitting',    'door-lock-fitting',    'Hang doors, fit locks and repair frames.',              1, 'door-open'),
            ('CARPENTRY',  'Custom Shelving',        'custom-shelving',      'Built-in shelves and cabinets made to measure.',        2, 'layout-grid'),
            ('PAINTING',   'Interior Painting',      'interior-painting',    'Two-coat interior painting with clean finish.',         1, 'paint-roller'),
            ('PAINTING',   'Exterior Wall Coating',  'exterior-wall-coating','Weather-proof coating for outside walls.',              2, 'cloud-sun'),
            ('APPLIANCE',  'Fridge Repair',          'fridge-repair',        'Diagnostics and repairs for all fridge brands.',        1, 'refrigerator'),
            ('APPLIANCE',  'Washing Machine Repair', 'washing-machine-repair','Drum, pump and electronics fixed on site.',            2, 'washing-machine'),
            ('AC',         'AC Servicing',           'ac-servicing',         'Filter wash, gas top-up and performance check.',        1, 'wind'),
            ('AC',         'AC Installation',        'ac-installation',      'Split-unit mounting and commissioning.',                2, 'snowflake'),
            ('GARDENING',  'Lawn Care',              'lawn-care',            'Mowing, edging and seasonal lawn treatment.',           1, 'leaf'),
            ('GARDENING',  'Tree Trimming',          'tree-trimming',        'Prune branches safely and clear debris.',               2, 'trees'),
            ('PEST',       'Cockroach Treatment',    'cockroach-treatment',  'Gel-bait and residual spray programme.',                1, 'bug'),
            ('PEST',       'Termite Control',        'termite-control',      'Soil treatment and wood protection.',                   2, 'shield'),
            ('MOVING',     'House Relocation',       'house-relocation',     'Packing, transport and reassembly at your new home.',   1, 'truck'),
            ('MOVING',     'Furniture Assembly',     'furniture-assembly',   'Flat-pack assembly and wall mounting.',                 2, 'wrench'),
            ('MAINTENANCE','Annual Home Checkup',    'annual-home-checkup',  'Scheduled inspection of key home systems.',             1, 'clipboard-check'),
            ('MAINTENANCE','Gutter Cleaning',        'gutter-cleaning',      'Clear blockages before the rainy season.',              2, 'droplets'),
            ('EMERGENCY',  '24/7 Emergency Plumber', 'emergency-plumber',    'Round-the-clock response for flooding and bursts.',     1, 'siren'),
            ('EMERGENCY',  'Emergency Electrician',  'emergency-electrician','Power-fault response at any hour.',                     2, 'zap')
        ) AS v(cat_code, name, slug, description, sort_order, icon)
        JOIN "SERVICE_CATEGORIES" c ON c.code = v.cat_code
        WHERE NOT EXISTS (SELECT 1 FROM "SERVICES" s WHERE s.slug = v.slug)
        """
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM \"SERVICES\" WHERE slug IN ("
        "'leak-repair','water-heater-install','wiring-rewiring','socket-switch-fix',"
        "'deep-home-cleaning','sofa-carpet-shampoo','door-lock-fitting','custom-shelving',"
        "'interior-painting','exterior-wall-coating','fridge-repair','washing-machine-repair',"
        "'ac-servicing','ac-installation','lawn-care','tree-trimming',"
        "'cockroach-treatment','termite-control','house-relocation','furniture-assembly',"
        "'annual-home-checkup','gutter-cleaning','emergency-plumber','emergency-electrician')"
    )
    op.execute('DROP INDEX IF EXISTS "IX_SERVICES_DESC_TRGM"')
    op.execute('DROP INDEX IF EXISTS "IX_SERVICES_NAME_TRGM"')
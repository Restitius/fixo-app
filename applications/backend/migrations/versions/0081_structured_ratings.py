"""Structured ratings: per-aspect scores, tags and a recommendation.

The customer apps collect quality / punctuality / communication / value scores,
highlight tags and (now) a recommendation, but RATINGS only had one overall score
and one comment, so the apps packed the extra data into the comment text as
"[[A:Q5P4C5V4]][[T:...]]" - which providers then saw as the review text. The data
gets real columns; existing packed comments are unpacked into them.
"""

import json
import re

import sqlalchemy as sa
from alembic import op

revision = "0081"
down_revision = "0080"

_PACKED = re.compile(r"^\[\[A:([^\]]*)\]\](?:\[\[T:([^\]]*)\]\])?\s?")
_ASPECT_KEYS = {"Q": "quality", "P": "punctuality", "C": "communication", "V": "value"}


def upgrade() -> None:
    op.execute("ALTER TABLE \"RATINGS\" ADD COLUMN IF NOT EXISTS aspects JSONB NOT NULL DEFAULT '{}'::jsonb")
    op.execute("ALTER TABLE \"RATINGS\" ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb")
    op.execute("ALTER TABLE \"RATINGS\" ADD COLUMN IF NOT EXISTS recommend BOOLEAN")

    bind = op.get_bind()
    rows = bind.execute(
        sa.text("SELECT rating_id, comment FROM \"RATINGS\" WHERE comment LIKE '[[A:%'")
    ).fetchall()
    for rating_id, comment in rows:
        match = _PACKED.match(comment or "")
        if not match:
            continue
        aspects: dict[str, int] = {}
        packed = match.group(1) or ""
        for letter, name in _ASPECT_KEYS.items():
            idx = packed.find(letter)
            if idx >= 0 and idx + 1 < len(packed) and packed[idx + 1].isdigit() and int(packed[idx + 1]) > 0:
                aspects[name] = int(packed[idx + 1])
        tags = [t for t in (match.group(2) or "").split(",") if t]
        bind.execute(
            sa.text(
                "UPDATE \"RATINGS\" SET aspects = CAST(:a AS jsonb), tags = CAST(:t AS jsonb), "
                "comment = NULLIF(:c, '') WHERE rating_id = :id"
            ),
            {"a": json.dumps(aspects), "t": json.dumps(tags), "c": (comment or "")[match.end():].strip(), "id": rating_id},
        )


def downgrade() -> None:
    op.execute('ALTER TABLE "RATINGS" DROP COLUMN IF EXISTS recommend')
    op.execute('ALTER TABLE "RATINGS" DROP COLUMN IF EXISTS tags')
    op.execute('ALTER TABLE "RATINGS" DROP COLUMN IF EXISTS aspects')

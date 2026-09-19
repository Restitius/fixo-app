"""JSON typing primitives for typed dict boundaries."""
from __future__ import annotations

from typing import Any, Union

JSONScalar = Union[str, int, float, bool, None]
JSONValue = Any  # pragmatic alias; tighten with recursive types when mypy strict lands
JsonDict = dict[str, JSONValue]
JsonList = list[JSONValue]

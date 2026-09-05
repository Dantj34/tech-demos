#!/usr/bin/env python3
"""build123d sidecar: JSON {kind, params, out_dir} → model.stl + model.glb."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from build123d import (
    Align,
    Box,
    Cylinder,
    PolarLocations,
    Pos,
    export_gltf,
    export_stl,
)


def build_cube(params: dict) -> object:
    size = float(params.get("size", 20))
    return Box(size, size, size)


def build_cube_with_hole(params: dict) -> object:
    size = float(params.get("size", 20))
    hole = float(params.get("hole", 5))
    height = float(params.get("height", size))
    return Box(size, size, height) - Cylinder(hole / 2, height)


def build_cylinder(params: dict) -> object:
    diameter = float(params.get("diameter", 20))
    height = float(params.get("height", 30))
    return Cylinder(diameter / 2, height)


def build_washer(params: dict) -> object:
    od = float(params.get("od", 24))
    inner = float(params.get("id", 8))
    thickness = float(params.get("thickness", 3))
    return Cylinder(od / 2, thickness) - Cylinder(inner / 2, thickness)


def build_bracket(params: dict) -> object:
    width = float(params.get("width", 40))
    height = float(params.get("height", 30))
    depth = float(params.get("depth", 30))
    thickness = float(params.get("thickness", 4))
    hole = float(params.get("hole", 6))
    upright = Box(width, thickness, height, align=(Align.CENTER, Align.MIN, Align.MIN))
    base = Box(width, depth, thickness, align=(Align.CENTER, Align.MIN, Align.MIN))
    part = upright + base
    part -= Pos(0, thickness / 2, height * 0.65) * Cylinder(hole / 2, thickness + 2)
    part -= Pos(0, depth * 0.65, thickness / 2) * Cylinder(hole / 2, thickness + 2)
    return part


def build_flange(params: dict) -> object:
    od = float(params.get("od", 50))
    inner = float(params.get("id", 16))
    thickness = float(params.get("thickness", 6))
    bolt_count = int(params.get("bolt_count", 4))
    bolt = float(params.get("bolt", 6))
    bolt_circle = float(params.get("bolt_circle", (od + inner) / 2))
    disc = Cylinder(od / 2, thickness) - Cylinder(inner / 2, thickness)
    for loc in PolarLocations(bolt_circle / 2, bolt_count):
        disc -= loc * Cylinder(bolt / 2, thickness + 1)
    return disc


BUILDERS = {
    "cube": build_cube,
    "cube_with_hole": build_cube_with_hole,
    "cylinder": build_cylinder,
    "washer": build_washer,
    "bracket": build_bracket,
    "flange": build_flange,
}


def build_one(req: dict) -> dict:
    kind = req["kind"]
    if kind not in BUILDERS:
        raise ValueError(f"unknown kind: {kind}")
    params = req.get("params") or {}
    out_dir = Path(req["out_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    shape = BUILDERS[kind](params)
    stl = out_dir / "model.stl"
    glb = out_dir / "model.glb"
    if not export_stl(shape, stl, tolerance=0.05, angular_tolerance=0.2):
        raise RuntimeError("export_stl failed")
    if not export_gltf(shape, glb, binary=True, linear_deflection=0.05, angular_deflection=0.2):
        raise RuntimeError("export_gltf failed")
    bbox = shape.bounding_box()
    return {
        "stl": str(stl),
        "glb": str(glb),
        "bbox": {"x": bbox.size.X, "y": bbox.size.Y, "z": bbox.size.Z},
    }


def main() -> None:
    if "--loop" in sys.argv:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                result = build_one(json.loads(line))
                sys.stdout.write(json.dumps(result) + "\n")
                sys.stdout.flush()
            except Exception as exc:  # noqa: BLE001 — sidecar reports errors to Bun
                sys.stdout.write(json.dumps({"error": str(exc)}) + "\n")
                sys.stdout.flush()
        return

    result = build_one(json.load(sys.stdin))
    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()

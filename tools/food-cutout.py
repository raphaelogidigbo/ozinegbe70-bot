"""One-time preprocess: remove the backgrounds from the food item photos.

Usage:
    pip install "rembg[cpu]"
    python tools/food-cutout.py            # every item in store-config.json
    python tools/food-cutout.py stockfish  # just the named items

Produces assets/food/cutouts/<item>.png (transparent PNG) for each food item
in store-config.json. render-store-flyer.js uses a cutout when one exists and
falls back to the original photo otherwise.

An item may set "crop": {"top": f, "bottom": f, "left": f, "right": f}
(fractions of the source) to trim off clutter — e.g. a bag in the foreground —
before segmentation, when the saliency model would otherwise pick the wrong
subject. The same crop is applied to the photo fallback in
render-store-flyer.js.
"""

import io
import json
import re
import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "store-config.json"
OUT_DIR = ROOT / "assets" / "food" / "cutouts"

MODELS = ["birefnet-general", "isnet-general-use"]


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


def load_session():
    for model in MODELS:
        try:
            print(f"loading model: {model}")
            return new_session(model)
        except Exception as exc:  # model download / runtime failures
            print(f"{model} failed: {exc}", file=sys.stderr)
    sys.exit("all models failed — check network and rembg install")


def main() -> None:
    items = json.loads(CONFIG.read_text(encoding="utf-8"))["foodItems"]
    wanted = {
        a.lower() for a in sys.argv[1:]
        if re.fullmatch(r"[a-z0-9][a-z0-9 -]*", a.lower())
    }
    if wanted:
        items = [i for i in items if i["name"].lower() in wanted]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    session = load_session()
    for item in items:
        # Only allow simple repo-relative image paths (e.g. assets/food/x.jpg)
        if not re.fullmatch(r"[\w./-]+\.(jpe?g|png|webp)", item["image"], re.I):
            print(f"skip {item['name']}: unsafe image path", file=sys.stderr)
            continue
        rel = Path(item["image"])
        if rel.is_absolute() or ".." in rel.parts:
            print(f"skip {item['name']}: unsafe image path", file=sys.stderr)
            continue
        src = (ROOT / rel).resolve()
        if not src.is_relative_to(ROOT) or not src.exists():
            print(f"skip {item['name']}: {item['image']} missing or outside repo", file=sys.stderr)
            continue
        data = src.read_bytes()
        crop = item.get("crop")
        if crop:
            im = Image.open(io.BytesIO(data))
            w, h = im.size
            box = (
                int(w * crop.get("left", 0)),
                int(h * crop.get("top", 0)),
                int(w * (1 - crop.get("right", 0))),
                int(h * (1 - crop.get("bottom", 0))),
            )
            buf = io.BytesIO()
            im.crop(box).save(buf, format=im.format or "JPEG")
            data = buf.getvalue()
        out = (OUT_DIR / f"{slug(item['name'])}.png").resolve()
        if out.parent != OUT_DIR:
            print(f"skip {item['name']}: unsafe name", file=sys.stderr)
            continue
        out.write_bytes(remove(data, session=session))
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

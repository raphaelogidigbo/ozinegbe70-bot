"""One-time preprocess: remove the studio backdrop from the couple's portrait.

Usage:
    pip install "rembg[cpu]"
    python tools/cutout.py

Produces assets/couple-cutout.png (transparent PNG). Tries BiRefNet first
(best edges on formal wear), falls back to ISNet.
"""

import sys
from pathlib import Path

from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "couple.jpg"
OUT = ROOT / "assets" / "couple-cutout.png"

MODELS = ["birefnet-general", "isnet-general-use"]


def main() -> None:
    data = SRC.read_bytes()
    for model in MODELS:
        try:
            print(f"trying model: {model}")
            session = new_session(model)
            result = remove(data, session=session)
            OUT.write_bytes(result)
            print(f"wrote {OUT} using {model}")
            return
        except Exception as exc:  # model download / runtime failures
            print(f"{model} failed: {exc}", file=sys.stderr)
    sys.exit("all models failed — check network and rembg install")


if __name__ == "__main__":
    main()

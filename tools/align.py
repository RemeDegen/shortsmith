#!/usr/bin/env python3
"""
Maps whisper timestamps onto the script's CORRECTLY SPELLED words.

Why this exists:
  Whisper transcribes — it guesses what was said. On technical terms it gets
  the spelling wrong ("API" -> "epi", "API's" -> "epi 'ss"). Those spellings
  must never reach the burned-in captions. But whisper's *timing* is good.
  So: TIMING from whisper, WORDS from the script.

Only needed when audio was produced manually instead of through the API.
`tools/tts.py` already returns exact word timings.

Output format is identical to tts.py's, so nothing downstream changes.

Usage:
  python3 tools/align.py <slug> <whisper.json>
"""

import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def script_words(slug: str) -> list[str]:
    md = (ROOT / "scripts" / f"{slug}.md").read_text(encoding="utf-8")
    block = re.search(r"```\n(\[SCENE.*?)```", md, re.S)
    if not block:
        sys.exit(f"ERROR: no fenced script block found in scripts/{slug}.md")
    return re.sub(r"\[SCENE:\w+\]", "", block.group(1)).split()


def key(w: str) -> str:
    """Matching key: lowercase, accents stripped, punctuation removed.

    Whisper's misspellings tend to be phonetically close, so normalised forms
    partially overlap; ordering information covers the rest.
    """
    w = unicodedata.normalize("NFKD", w.lower())
    w = "".join(c for c in w if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", w)


def align(script: list[str], heard: list[dict]) -> tuple[list[dict], list[tuple[str, str]]]:
    sm = SequenceMatcher(
        None, [key(w) for w in script], [key(h["word"]) for h in heard], autojunk=False
    )
    out: list[dict] = []
    diffs: list[tuple[str, str]] = []

    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                out.append({"text": script[i1 + k],
                            "start_ms": round(heard[j1 + k]["start"] * 1000),
                            "end_ms": round(heard[j1 + k]["end"] * 1000)})
        else:
            # Mismatched block: split the heard span proportionally across the
            # script's words. (e.g. "API's" <-> "epi" + "'ss")
            n = i2 - i1
            if n == 0:
                continue
            if j2 > j1:
                t0, t1 = heard[j1]["start"], heard[j2 - 1]["end"]
            else:  # nothing heard here — borrow time from the neighbours
                t0 = heard[j1 - 1]["end"] if j1 > 0 else 0.0
                t1 = heard[j1]["start"] if j1 < len(heard) else t0
            step = (t1 - t0) / n if t1 > t0 else 0.0
            for k in range(n):
                out.append({"text": script[i1 + k],
                            "start_ms": round((t0 + k * step) * 1000),
                            "end_ms": round((t0 + (k + 1) * step) * 1000)})
            diffs.append((" ".join(script[i1:i2]),
                          " ".join(h["word"].strip() for h in heard[j1:j2]) or "—"))
    return out, diffs


def main(slug: str, whisper_json: str) -> None:
    script = script_words(slug)
    data = json.loads(Path(whisper_json).read_text(encoding="utf-8"))
    heard = [w for s in data["segments"] for w in s.get("words", [])]
    if not heard:
        sys.exit("ERROR: no word timestamps in whisper output "
                 "(was it run with --word-timestamps True?)")

    words, diffs = align(script, heard)

    out = ROOT / "audio" / f"{slug}.words.json"
    out.write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")

    approx = sum(len(d[0].split()) for d in diffs)
    print(f"script  : {len(script)} words")
    print(f"heard   : {len(heard)} words")
    print(f"timing  : {len(script)-approx} exact from whisper, {approx} interpolated")
    print(f"output  → audio/{slug}.words.json  ({len(words)} words, "
          f"ends {words[-1]['end_ms']/1000:.2f}s)")

    if diffs:
        # Timing in these blocks is estimated — worth eyeballing in the render.
        print("\nmismatched blocks (timing split proportionally):")
        for s, h in diffs:
            print(f"  script: {s!r}")
            print(f"  heard : {h!r}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    main(sys.argv[1], sys.argv[2])

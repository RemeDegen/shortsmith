#!/usr/bin/env python3
"""
ElevenLabs narration — audio plus word timestamps from a single call.

The `with-timestamps` endpoint returns character-level alignment, which this
script folds into word-level timings. That removes the need for a separate
forced-alignment step (whisper / MFA) entirely.

Usage:
  python3 tools/tts.py check                # verify setup (spends no credits)
  python3 tools/tts.py voices               # list voices, find a voice_id
  python3 tools/tts.py say <slug>           # generate from scripts/<slug>.md

Configuration lives in .env (see .env.example).

Output:
  audio/<slug>.mp3
  audio/<slug>.words.json
  video/public/<slug>.mp3
"""

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.elevenlabs.io/v1"


def load_env() -> None:
    """Read .env. Does NOT override variables already set in the environment."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        if v and not os.environ.get(k.strip()):
            os.environ[k.strip()] = v


load_env()

# The channel's voice identity. Keep these stable across videos or the tone
# drifts from one upload to the next.
VOICE_ID = os.environ.get("ELEVEN_VOICE_ID", "")
MODEL_ID = os.environ.get("ELEVEN_MODEL_ID", "eleven_multilingual_v2")
VOICE_SETTINGS = {
    "stability": float(os.environ.get("ELEVEN_STABILITY", 0.50)),
    "similarity_boost": float(os.environ.get("ELEVEN_SIMILARITY", 0.50)),
    # Keep style at 0 for explanatory content: the higher it goes, the more the
    # calm, falling intonation a corrective script needs gets flattened out.
    "style": float(os.environ.get("ELEVEN_STYLE", 0.0)),
    "speed": float(os.environ.get("ELEVEN_SPEED", 1.0)),
    "use_speaker_boost": True,
}


def api_key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY", "")
    if not k:
        sys.exit("ERROR: ELEVENLABS_API_KEY missing. Add it to .env — see .env.example")
    return k


def request(path: str, payload: dict | None = None) -> dict:
    url = f"{API}/{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data,
        headers={"xi-api-key": api_key(), "Content-Type": "application/json"},
        method="POST" if data else "GET",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        # ElevenLabs states the reason plainly in the body; surface that
        # instead of a stack trace.
        try:
            detail = json.loads(e.read()).get("detail", {})
            msg = detail.get("message") or detail
        except Exception:
            msg = e.reason
        sys.exit(f"ERROR {e.code}: {msg}")


def cmd_check() -> None:
    """Verify setup without generating anything (spends no credits).

    Listing voices is NOT a sufficient check: on the free tier you can read the
    voice list but generating with a library voice returns 402. The plan tier is
    what actually decides.
    """
    sub = request("user/subscription")
    tier = sub.get("tier", "?")
    used, limit = sub.get("character_count"), sub.get("character_limit")
    print(f"  plan     : {tier}  ({used}/{limit} credits)")
    print(f"  voice_id : {VOICE_ID or 'NOT SET'}")
    print(f"  model    : {MODEL_ID}")
    print("  status   : " + ("ready" if tier != "free" else
          "FREE TIER — library voices are blocked via API (402). A paid plan is required."))


def cmd_voices() -> None:
    for v in request("voices")["voices"]:
        labels = v.get("labels") or {}
        print(f"{v['voice_id']}  {v['name']}")
        if labels:
            print(f"    {', '.join(f'{k}={x}' for k, x in labels.items())}")


def narration(slug: str) -> str:
    """Extract the spoken text from the [SCENE:x] blocks in scripts/<slug>.md."""
    md = (ROOT / "scripts" / f"{slug}.md").read_text(encoding="utf-8")
    block = re.search(r"```\n(\[SCENE.*?)```", md, re.S)
    if not block:
        sys.exit(f"ERROR: no fenced script block found in scripts/{slug}.md")
    text = re.sub(r"\[SCENE:\w+\]", "", block.group(1))
    return " ".join(text.split())


def to_words(chars: list[str], starts: list[float], ends: list[float]) -> list[dict]:
    """Fold character-level alignment into word-level timings."""
    words, cur, cur_start, prev_end = [], "", None, 0.0
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append({"text": cur, "start_ms": round(cur_start * 1000),
                              "end_ms": round(prev_end * 1000)})
                cur, cur_start = "", None
        else:
            if not cur:
                cur_start = s
            cur += ch
        prev_end = e
    if cur:
        words.append({"text": cur, "start_ms": round(cur_start * 1000),
                      "end_ms": round(prev_end * 1000)})
    return words


def cmd_say(slug: str) -> None:
    if not VOICE_ID:
        sys.exit("ERROR: ELEVEN_VOICE_ID not set. Find one with `tools/tts.py voices`.")
    text = narration(slug)
    print(f"text  : {len(text.split())} words")
    print(f"voice : {VOICE_ID} · {MODEL_ID}")

    res = request(
        f"text-to-speech/{VOICE_ID}/with-timestamps",
        {"text": text, "model_id": MODEL_ID, "voice_settings": VOICE_SETTINGS},
    )

    mp3 = base64.b64decode(res["audio_base64"])
    a = res["alignment"]
    words = to_words(a["characters"],
                     a["character_start_times_seconds"],
                     a["character_end_times_seconds"])

    for target in (ROOT / "audio" / f"{slug}.mp3", ROOT / "video" / "public" / f"{slug}.mp3"):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(mp3)

    (ROOT / "audio" / f"{slug}.words.json").write_text(
        json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"audio → audio/{slug}.mp3  ({words[-1]['end_ms']/1000:.2f}s)")
    print(f"times → audio/{slug}.words.json  ({len(words)} words)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    if sys.argv[1] == "check":
        cmd_check()
    elif sys.argv[1] == "voices":
        cmd_voices()
    elif sys.argv[1] == "say" and len(sys.argv) > 2:
        cmd_say(sys.argv[2])
    else:
        print(__doc__); sys.exit(1)

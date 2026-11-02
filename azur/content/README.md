# Content: Reels und TikToks

Hier liegt alles, was für Reels und TikToks von AZUR dauerhaft gebraucht wird.

| Was | Wo |
|---|---|
| Regeln, Marke, Ablauf für ein Reel | `.claude/skills/azur-reels/SKILL.md` |
| Schnitt im Takt der Musik (Anleitung) | `.claude/skills/azur-beat-schnitt/SKILL.md` |
| Werkzeug für den Schnitt | `azur/content/tools/beat_cut.py` |
| Plan für Kamerafahrten aus Blender | `azur/content/KAMERAFAHRTEN.md` |
| Allgemeine Content-Skills (MIT, Ootto) | `.claude/skills/<name>/SKILL.md` |

Claude Code lädt die Skills im Ordner `.claude/skills/` automatisch, in der Cloud und am PC, sobald dieses Repo offen ist.

## Schnell

```bash
pip install librosa            # einmal, kostenlos; ffmpeg muss installiert sein
python3 azur/content/tools/beat_cut.py analyze song.mp3
python3 azur/content/tools/beat_cut.py auto song.mp3 clips/ plan.json --dur 15
python3 azur/content/tools/beat_cut.py render plan.json reel.mp4
```

## Wichtig

- Das Repo ist öffentlich. Rohclips, Songs, Gesichter und fertige Videos kommen **nicht** hier hinein.
- Gepostet wird nur vom Owner selbst.

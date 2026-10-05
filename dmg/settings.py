# dmgbuild settings, run once to produce dmg/DS_Store (the styled Finder window that
# scripts/release.sh copies into every DMG). Regenerate only if the layout changes:
#   uvx dmgbuild -s dmg/settings.py -D app=<path to Notched.app> Notched build/layout.dmg
#   hdiutil attach build/layout.dmg; cp /Volumes/Notched/.DS_Store dmg/DS_Store; hdiutil detach /Volumes/Notched
app = defines["app"]  # noqa: F821 (dmgbuild injects `defines`)
format = "UDZO"
files = [app]
symlinks = {"Applications": "/Applications"}
background = "dmg/background.tiff"
window_rect = ((200, 120), (660, 400))
icon_size = 128
text_size = 13
icon_locations = {"Notched.app": (170, 190), "Applications": (490, 190)}
show_status_bar = False
show_tab_view = False
show_toolbar = False
show_pathbar = False
show_sidebar = False

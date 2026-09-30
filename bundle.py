import re
from pathlib import Path

def create_bundle():
    static_dir = Path(__file__).parent / "static"
    index_file = static_dir / "index.html"
    if not index_file.exists():
        print("static/index.html not found")
        return None
        
    html = index_file.read_text(encoding="utf-8")

    # Inline CSS stylesheets
    def replace_css(match):
        css_name = match.group(1)
        css_path = static_dir / "assets" / css_name
        if css_path.exists():
            return f"<style>\n{css_path.read_text(encoding='utf-8')}\n</style>"
        return match.group(0)

    html = re.sub(r'<link\s+[^>]*href=["\']\./assets/([^"\']+\.css)["\'][^>]*>', replace_css, html)

    # Inline JS scripts
    def replace_js(match):
        js_name = match.group(1)
        js_path = static_dir / "assets" / js_name
        if js_path.exists():
            return f'<script type="module">\n{js_path.read_text(encoding="utf-8")}\n</script>'
        return match.group(0)

    html = re.sub(r'<script\s+[^>]*src=["\']\./assets/([^"\']+\.js)["\'][^>]*></script>', replace_js, html)

    bundle_path = static_dir / "bundle.html"
    bundle_path.write_text(html, encoding="utf-8")
    print(f"Created bundle.html ({len(html)} bytes)")
    return html

if __name__ == "__main__":
    create_bundle()

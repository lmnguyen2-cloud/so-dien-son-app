#!/usr/bin/env bash
# Dựng lại: Trạm (core+tram, rút gọn), nhúng bookmarklet vào trang, xuất index.html cho APK.
set -e
cd "$(dirname "$0")"
cat core.js tram.js > /tmp/tram_full.js
npx -y terser@5.31.0 /tmp/tram_full.js -c -m -o tram.min.js
npx -y terser@5.31.0 core.js -c -m -o core.min.js
python3 - <<'PY'
import urllib.parse,re,html
h=open('so-dien-son.html').read()
bm='javascript:'+urllib.parse.quote(open('tram.min.js').read().strip(),safe='')
h=re.sub(r'<a class="btn" id="k-link" href="[^"]*"',lambda m:f'<a class="btn" id="k-link" href="{bm}"',h)
g=open('../apps-script/cau-noi-so-thang.gs').read()
h=re.sub(r'(<pre class="msg" id="k-gs">)[\s\S]*?(</pre>)',lambda m:m.group(1)+html.escape(g)+m.group(2),h)
open('so-dien-son.html','w').write(h)
PY
A=../app/src/main/assets
{ echo '<!doctype html><html lang="vi"><head><meta charset="utf-8">'; sed 's#^<style>#</head><body><style>#' so-dien-son.html; echo '</body></html>'; } > $A/index.html
cp tram.min.js $A/tram.js; cp core.min.js $A/core.js
echo "Đã dựng xong. Đẩy lên main để GitHub tự build APK."

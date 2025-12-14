TOOLS_DIR=~/tools
THREADS=200
USER_AGENT="GoogleBot"
COOKIE="SESSION=Hacked"
DATE=$(date +"%Y-%m-%d_%H-%M")
WEBHOOK_URL="" # <--- replace this with your webhook url

send_discord() {
  local message="$1"
  if [ -z "$WEBHOOK_URL" ]; then
    return 0
  fi
  curl -s -H "Content-Type: application/json" \
       -X POST -d "{\"content\": \"$message\"}" "$WEBHOOK_URL" >/dev/null 2>&1 || true
}

ROOT_DIR="${1:-.}"
cd "$ROOT_DIR" || { echo "Invalid target dir: $ROOT_DIR"; exit 1; }

echo "Recon started at $DATE in $ROOT_DIR"
send_discord "Recon started at $DATE — target: \`$ROOT_DIR\`"

for dir in */; do
  [ -d "$dir" ] || continue
  cd "$dir" || continue

  echo "================================"
  echo "Running recon in: $dir"
  echo "================================"

  HAS_ROOTS=false; HAS_URLS=false
  [[ -f "roots.txt" ]] && HAS_ROOTS=true
  [[ -f "urls.txt" ]] && HAS_URLS=true

  if [ "$HAS_ROOTS" = false ] && [ "$HAS_URLS" = false ]; then
    echo "[!] Skipping $dir — no roots.txt or urls.txt"
    send_discord "❌ Skipped \`$dir\` — no roots.txt or urls.txt"
    cd ..; continue
  fi

  mkdir -p results logs

  # DOMAIN-BASED recon (subdomain enumeration + verification)
  if [ "$HAS_ROOTS" = true ]; then
    echo "[*] Domain-based recon (roots.txt)"
    sed 's/^\*\.\?//' wildcards.txt | sort -u > roots.txt
    subfinder -dL roots.txt -all -recursive 2>/dev/null | anew results/all.txt
    chaos -dL roots.txt 2>/dev/null | anew results/chaos.txt
    amass enum -df roots.txt -passive 2>/dev/null | anew results/all.txt || true

    # optional assetfinder per domain
    while IFS= read -r domain; do
      [ -z "$domain" ] && continue
      assetfinder -subs-only "$domain" 2>/dev/null | anew results/all.txt
    done < roots.txt

    # split wildcard results
    if [ -f results/chaos.txt ]; then
      grep -v "*" results/chaos.txt | anew results/all.txt || true
      grep "*" results/chaos.txt | anew results/wild.txt || true
    fi

    # verify live with httpx
    if [ -f results/all.txt ]; then
      httpx -l results/all.txt -sc -title -tech-detect -favicon -http2 \
        -random-agent -fr -threads "$THREADS" 2>/dev/null | anew results/withdetailalive.txt || true
    fi

    # CORS checks (Corsy) and simple nuclei check (takeovers)
    if command -v python3 >/dev/null 2>&1 && [ -d "$TOOLS_DIR/Corsy" ]; then
      sed 's/^/https:\/\//' results/all.txt | python3 "$TOOLS_DIR/Corsy/corsy.py" -t 10 \
        --headers "User-Agent: $USER_AGENT\nCookie: $COOKIE" 2>/dev/null | anew results/corsyres.txt || true
    fi

    nuclei -l results/all.txt -t ~/nuclei-templates/http/takeovers/ -o results/takeover-results.txt 2>/dev/null || true
  fi

  # URL-BASED recon (just aggregate)
  if [ "$HAS_URLS" = true ]; then
    echo "[*] URL-based recon (urls.txt)"
    cat urls.txt >> results/allurls.txt
  fi

  # CRAWL (Katana)
  echo "[*] Crawling with Katana..."
  if [ -f results/all.txt ]; then
    cat results/all.txt | katana -d 5 -jc -fx -kf -ef woff,css,png,svg,jpg,woff2,jpeg,gif 2>/dev/null | anew results/allurls.txt || true
  fi
  if [ -f urls.txt ]; then
    cat urls.txt | katana -d 5 -jc -fx -kf -ef woff,css,png,svg,jpg,woff2,jpeg,gif 2>/dev/null | anew results/allurls.txt || true
  fi

  echo "[+] Recon completed for: $dir"
  send_discord "✅ Recon completed for \`$dir\` — results in \`$dir/results/\`"

  cd ..
done

send_discord "Recon finished for $ROOT_DIR at $DATE"
echo "Recon completed for all programs in $ROOT_DIR"
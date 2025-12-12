#!/bin/bash
# ==============================
# 🚀 Advanced Recon Automation Script + Discord Notifications
# Merged features requested by user (JSLEAKS, Nuclei advanced templates/portal discovery,
# Wayback, Naabu fast port scan, Corsy on all.txt/allurls with skip filters,
# Dirsearch fast, screenshot tool, ParamSpider for all subdomains, etc.)
# Author: Shanks Recon Setup (merged features)
# ==============================

# ---- CONFIG ----
TOOLS_DIR=~/tools
THREADS=200
USER_AGENT="GoogleBot"
COOKIE="SESSION=Hacked"
DATE=$(date +"%Y-%m-%d_%H-%M")
WEBHOOK_URL="" #<--- replace
APPLY_HTTPX_ON_ALL=true

# Paths to template dirs for nuclei (adjust to your setup)
NUCLEI_ADV_TEMPLATES=~/Nuclei-templates-Collection/
NUCLEI_PORTAL_TEMPLATES=~/nuclei-templates/http/exposed-panels/

# Extensions we consider "stupid" for Corsy/filtering (skip media / assets)
SKIP_EXTENSIONS="woff|woff2|css|png|svg|jpg|jpeg|gif|ico|mp4|zip|rar|pdf|ttf|map"

# Tools used (expected to exist in PATH or in $TOOLS_DIR)
# - subfinder, chaos, assetfinder, amass, httpx, Corsy (corsy.py), nuclei, waybackurls,
#   naabu, katana, jsleaks, paramspider, dirsearch, gowitness (or aquatone), anew, katana
# Make sure these are installed and accessible.

# === Function to send Discord notification ===
send_discord() {
    local message="$1"
    if [[ -z "$WEBHOOK_URL" || "$WEBHOOK_URL" == *"REPLACE"* ]]; then
        echo "[!] WEBHOOK not configured - skipping discord message."
        return
    fi
    curl -s -H "Content-Type: application/json" \
         -X POST -d "{\"content\": \"$message\"}" "$WEBHOOK_URL" >/dev/null 2>&1 || true
}

echo "🔥 Automated Recon Started at $DATE"
send_discord "🚀 **Recon Started** at $DATE"

# Helper: run a command only if tool exists
run_if_exists() {
    local cmd="$1"
    if command -v $(echo "$cmd" | awk '{print $1}') >/dev/null 2>&1; then
        eval "$cmd"
    else
        echo "[!] Skipping: $(echo "$cmd" | awk '{print $1}') not found in PATH"
    fi
}

# Helper: filter out "stupid" URLs (assets) from a url list
filter_skip_stupid_urls() {
    # stdin -> stdout
    grep -Eiv "$SKIP_EXTENSIONS"
}

# Loop through each target directory (assumes each target is a subfolder)
for dir in */; do
    cd "$dir" || continue
    echo ""
    echo "=============================="
    echo "🎯 Running recon in: $dir"
    echo "=============================="

    send_discord "⚡ **Starting recon for:** \`$dir\`"

    HAS_ROOTS=false
    HAS_URLS=false

    [[ -f "roots.txt" ]] && HAS_ROOTS=true
    [[ -f "urls.txt" ]] && HAS_URLS=true

    if [ "$HAS_ROOTS" = false ] && [ "$HAS_URLS" = false ]; then
        echo "[!] Skipping $dir — No roots.txt or urls.txt found!"
        send_discord "❌ Skipped \`$dir\` — no roots.txt or urls.txt found!"
        cd ..
        continue
    fi

    mkdir -p results logs results/screenshots

    # ---- DOMAIN-BASED RECON ----
    if [ "$HAS_ROOTS" = true ]; then
        echo "[*] Found roots.txt — Running domain-based recon..."
        # 1) Subdomain discovery (multiple tools)
        run_if_exists "subfinder -dL roots.txt -all -o results/subfinder.txt -silent"
        run_if_exists "chaos -dL roots.txt -o results/chaos.txt -silent"
        run_if_exists "assetfinder -subs-only -quiet $(paste -sd, roots.txt) 2>/dev/null | sort -u > results/assetfinder.txt" || true
        run_if_exists "amass enum -df roots.txt -passive -o results/amass.txt" || true

        # Merge discovered subdomains
        cat results/*.txt 2>/dev/null | sort -u | grep -v "^$" | anew results/all.txt || true

        # If chaos produced wildcard entries, separate them
        if [ -f results/chaos.txt ]; then
            grep "*" results/chaos.txt > results/wild.txt 2>/dev/null || true
            grep -v "*" results/chaos.txt | anew results/all.txt || true
        fi

        # 2) Verify alive and collect details with httpx (if toggles allow)
        if [ "$APPLY_HTTPX_ON_ALL" = true ] && [ -f results/all.txt ]; then
            echo "[*] Verifying subdomains with httpx (all discovered)..."
            run_if_exists "httpx -l results/all.txt -sc -title -tech-detect -favicon -http2 -random-agent -fr -threads $THREADS | anew results/withdetailalive.txt"
        else
            echo "[*] Skipping httpx on all discovered subdomains (APPLY_HTTPX_ON_ALL=false)"
        fi

        # 3) Corsy checks (on subdomains and urls)
        if [ -f "$TOOLS_DIR/Corsy/corsy.py" ]; then
            echo "[*] Checking CORS using Corsy on subdomains (filtered to skip assets)..."
            # prefix with https:// for corsy input
            if [ -f results/all.txt ]; then
                sed 's|^|https://|' results/all.txt ./urls.txt | filter_skip_stupid_urls | python3 "$TOOLS_DIR/Corsy/corsy.py" -t 10 --headers "User-Agent: $USER_AGENT\nCookie: $COOKIE" | anew results/corsy_subdomains.txt
            fi
        else
            echo "[!] Corsy not found at $TOOLS_DIR/Corsy/corsy.py - skipping corsy on subdomains"
        fi

        # Also run Corsy on all urls (allurls.txt) later after katana aggregation

        # 4) Nuclei: advanced and portal discovery (only targeted templates)
        if command -v nuclei >/dev/null 2>&1; then
            echo "[*] Running Nuclei advanced & portal templates (targeted) against alive hosts..."
            if [ -f results/all.txt ]; then
                nuclei -c 25 -timeout 2 -l results/all.txt -t ~/Nuclei-templates-Collection/Folder2 -t "$NUCLEI_ADV_TEMPLATES" -o results/nuclei_advanced.txt || true
                nuclei -c 20 -timeout 2 -l results/all.txt -t ~/Nuclei-templates-Collection/Folder1 -t "$NUCLEI_PORTAL_TEMPLATES" -o results/nuclei_portal.txt || true
            fi
        else
            echo "[!] nuclei not installed - skipping nuclei"
        fi

        # 5) Wayback / Archive discovery for URLs
        if command -v waybackurls >/dev/null 2>&1; then
            echo "[*] Gathering Wayback URLs (waybackurls) for roots..."
            while IFS= read -r domain; do
                echo "$domain" | waybackurls | anew results/allurls.txt
            done < roots.txt
        else
            echo "[!] waybackurls not installed - skipping wayback"
        fi

        # 6) Naabu - fast port scan (targets are the hosts in results/all.txt)
        if command -v naabu >/dev/null 2>&1 && [ -f results/all.txt ]; then
            echo "[*] Running Naabu fast port scan (common ports)..."
            naabu -list results/all.txt -top-ports 100 -rate 3000 -o results/naabu_top100.txt || true
        else
            echo "[!] naabu not found or no results/all.txt - skipping Naabu"
        fi

        # 7) JSLEAKS on discovered URLs (if tool exists)
        if command -v jsleaks >/dev/null 2>&1; then
            if [ -f results/allurls.txt ]; then
                echo "[*] Running JSLEAKS on aggregated URLs..."
                jsleak -i results/allurls.txt -o results/jsleaks.txt || true
            else
                # fallback: try run jsleaks on wayback output (if present)
                if [ -f results/allurls.txt ]; then
                    jsleak -i results/allurls.txt -o results/jsleaks.txt || true
                fi
            fi
        else
            echo "[!] jsleaks not found - skipping"
        fi

        # 8) Paramspider on all subdomains (look for parameters)
        if [ -f results/all.txt ] && command -v python3 >/dev/null 2>&1 && [ -f "$TOOLS_DIR/paramspider/paramspider.py" ]; then
            echo "[*] Running ParamSpider on all subdomains (this can be noisy/slow)..."
            while IFS= read -r host; do
                python3 paramspider -d "$host" -o "results/params_${host//./_}.txt" || true
                cat "results/params_${host//./_}.txt" 2>/dev/null | anew results/all_params.txt || true
            done < results/all.txt
        else
            echo "[!] paramspider not found in $TOOLS_DIR/paramspider - skipping parameter discovery"
        fi

        # 9) Do not add: Basic Nuclei Scans & SecretFinder (explicitly excluded)
        echo "[*] Skipped: basic nuclei scans and SecretFinder as requested by user."
    fi # end HAS_ROOTS

    # ---- URL-BASED RECON ----
    if [ "$HAS_URLS" = true ]; then
        echo "[*] Found urls.txt — Running URL-based recon..."
        cat urls.txt >> results/allurls.txt
    fi

    # ---- KATANA crawling (urls aggregator) ----
    echo "[*] Crawling URLs with Katana to expand url list..."
    if [ -f "results/all.txt" ]; then
        cat results/all.txt | katana -d 5 -jc -fx -kf -ef woff,css,png,svg,jpg,woff2,jpeg,gif | filter_skip_stupid_urls | anew results/allurls.txt
    fi
    if [ -f "urls.txt" ]; then
        cat urls.txt | katana -d 5 -jc -fx -kf -ef woff,css,png,svg,jpg,woff2,jpeg,gif | filter_skip_stupid_urls | anew results/allurls.txt
    fi

    # ---- Naabu results (ports) to be appended to results for later port-specific work ----
    if [ -f results/naabu_top100.txt ]; then
        echo "[*] Naabu port scan results saved to results/naabu_top100.txt"
    fi

    # ---- Param findings: run httpx on params if desired (light touch) ----
    if [ -f results/all_params.txt ] && command -v httpx >/dev/null 2>&1; then
        echo "[*] Checking parameter-containing URLs with httpx to see live ones..."
        cat results/all_params.txt | httpx -silent -fr -title -threads 100 | anew results/params_alive.txt || true
    fi

    # Finalize: dedupe main files
    if [ -f results/allurls.txt ]; then sort -u results/allurls.txt -o results/allurls.txt || true; fi
    if [ -f results/all.txt ]; then sort -u results/all.txt -o results/all.txt || true; fi

    echo "[+] Recon completed for: $dir ✅"
    send_discord "✅ **Recon completed for:** \`$dir\`\n🗂️ Results saved in: \`$dir/results/\`"

    cd ..
done

send_discord "🔥 **Recon Finished for all programs!** at $DATE"
echo "🔥 Recon Completed for All Programs!"
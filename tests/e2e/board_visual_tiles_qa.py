"""Board-only Chrome QA: real pastel MAP and Diploma tiles, historical controls, accessibility."""
import os,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-visual-tiles");OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def require(condition,message):
    if not condition:raise AssertionError(message)
def capture(page,name):
    page.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def scenario(name,fn,page=None):
    try:
        details=fn()
        checks.append({"name":name,"passed":True,"details":str(details)})
        print("PASS |",name,"|",details,flush=True)
    except Exception as e:
        checks.append({"name":name,"passed":False,"error":str(e)})
        print("FAIL |",name,"|",str(e),flush=True)
        if page:
            try:capture(page,"FAIL-"+re.sub('[^a-z0-9]+','-',name.lower())[:45])
            except Exception:pass
def no_documents(page):
    visible=page.locator(".board-view").inner_text()
    require(not re.search(r'\.xlsx|\.csv|\.pdf|KPIs!|Dashboard SY\d|Source:|workbook',visible,re.I),
            "No file references should appear on the Board")

def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,
            executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
            args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            ctx=browser.new_context(viewport={"width":1440,"height":900},
                locale="en-GB",permissions=["clipboard-read","clipboard-write"])
            pg=ctx.new_page();errors=[]
            pg.on("pageerror",lambda e:errors.append(str(e)))
            pg.goto(BASE+"/#/board",wait_until="domcontentloaded")
            pg.locator(".board-view").wait_for(timeout=16000)

            def top():
                tabs=pg.locator(".board-nav-tabs button").all_text_contents()
                require([x.strip() for x in tabs]==["Overview","MAP","IB Diploma"],"Board tabs should be renamed")
                require(pg.locator(".board-strength-card").count()==4,"Overview four strengths still present")
                no_documents(pg)
                return "Overview preserved, tab names are Overview / MAP / IB Diploma"
            scenario("Board navigation and original Overview",top,pg)

            def map_latest():
                pg.locator('.board-nav-tabs [data-board-view="explore"]').click()
                require(pg.locator(".board-comparison-display").count()==1,"Live comparison panel missing")
                require(pg.locator(".board-comparison-window").count()==1,"SY26–27 must have only Fall 2026")
                require(pg.locator(".board-comparison-subject").count()==3,"All three subject panels")
                require(pg.locator(".board-comparison-mini").count()==6,"U.S./EARCOS tiles for all three")
                require(pg.locator(".board-comparison-mini.unavailable").count()==3,"EARCOS Fall 2026 missing")
                require("+22.2 RIT" in pg.locator(".board-comparison-math").inner_text(),"Fall Math real average gap")
                require("+6.6 RIT" in pg.locator(".board-comparison-reading").inner_text(),"Fall Reading real average gap")
                require("+10.4 RIT" in pg.locator(".board-comparison-language").inner_text(),"Fall Language real gap")
                require(pg.locator(".board-comparison-math").get_attribute("aria-pressed")=="true","Math selected")
                no_documents(pg)
                capture(pg,"01-MAP-fall2026-desktop")
                return "Fall 2026 true U.S. RIT gaps, unavailable EARCOS, pastel real components"
            scenario("MAP tile fidelity and accuracy",map_latest,pg)

            def full_year():
                pg.locator('[data-board-select="year"]').select_option("2025")
                require(pg.locator(".board-comparison-window").count()==2,"SY25–26 must display Fall and Spring")
                require(pg.locator(".board-comparison-subject").count()==6,"Both seasons, three subjects each")
                require("Spring 2026" in pg.locator(".board-comparison-display").inner_text(),"Spring missing")
                require("Fall 2025" in pg.locator(".board-comparison-display").inner_text(),"Fall missing")
                require(pg.locator(".board-comparison-mini.unavailable").count()==0,
                        "Regional benchmark should be present in 2025–26")
                capture(pg,"02-MAP-2025-26-both-windows")
                return "Both Fall 2025 and Spring 2026 visually grouped by subject"
            scenario("MAP school-year comparison of two seasons",full_year,pg)

            def click_tile():
                select=pg.locator('[data-board-tile-window="spring2026"][data-board-tile-subject="language"]')
                select.click()
                require(select.count()==1,"Subject panel inaccessible after interaction")
                require(pg.locator('[data-board-window="spring2026"]').get_attribute("aria-pressed")=="true",
                        "Selecting a Spring tile must change the active MAP testing window")
                require(pg.locator('[data-board-subject="language"]').get_attribute("aria-pressed")=="true",
                        "Selecting a Language tile must change MAP subject")
                require("Language Usage · Spring 2026" in pg.locator(".board-context").inner_text(),
                        "Grade detail not updated")
                return "Selecting a colored tile updates the connected grade-detail chart"
            scenario("MAP tile drilldown interaction",click_tile,pg)

            def grade_filters():
                pg.locator('[data-board-select="division"]').select_option("secondary")
                pg.locator('[data-board-select="grade"]').select_option("8")
                require("Grade 8 mean difference" in pg.locator(".board-comparison-display").inner_text(),
                        "Grade filters not reflected in MAP tiles")
                require("Grade 8" in pg.locator(".board-context").inner_text(),
                        "Grade 8 context missing")
                require(pg.locator(".board-grade-row").count()==1,"Only selected grade should be charted")
                pg.locator('[data-board-select="division"]').select_option("elementary")
                require(pg.locator('[data-board-select="grade"]').input_value()=="all",
                        "Grade should reset with division")
                require("Unweighted mean of 3 grade-level gaps" in pg.locator(".board-comparison-display").inner_text(),
                        "Elementary tile values should use three grade gaps")
                pg.locator('[data-board-select="division"]').select_option("all")
                pg.locator('[data-board-select="year"]').select_option("2026")
                return "Division/grade filters recalculate all comparison tiles and reset correctly"
            scenario("MAP division and grade filtering",grade_filters,pg)

            def dp_main():
                pg.locator('.board-nav-tabs [data-board-view="dp"]').click()
                require(pg.locator(".board-dp-controls").count()==1,"DP filter row missing")
                require(pg.locator(".board-dp-graphic-grid").count()==1,"Graphic cards missing")
                require(pg.locator(".board-dp-graphic-card").count()==3,"Three pastel DP tiles expected")
                require(pg.locator(".board-dp-graphic-average").count()==1,"Blue average tile missing")
                require(pg.locator(".board-dp-graphic-pass").count()==1,"Lilac pass tile missing")
                require(pg.locator(".board-dp-graphic-pathways").count()==1,"Mint pathway tile missing")
                require("34.0" in pg.locator(".board-dp-graphic-average").inner_text(),"Current average not shown")
                require("93%" in pg.locator(".board-dp-graphic-pass").inner_text(),"Current pass rate not shown")
                require("56" in pg.locator(".board-dp-graphic-pathways").inner_text(),"Current G12 pathway missing")
                require(pg.locator('[data-board-dp-select="year"]').input_value()=="2026","Default DP cohort year")
                require(pg.locator('[data-board-dp-select="range"]').input_value()=="all","Default all years")
                no_documents(pg)
                capture(pg,"03-DP-current-year-desktop")
                return "Real blue/lilac/mint Diploma cards, selectable year and historical range"
            scenario("Diploma graphic tile fidelity and filters",dp_main,pg)

            def dp_year():
                pg.locator('[data-board-dp-select="year"]').select_option("2024")
                require(pg.locator('[data-board-dp-select="year"]').input_value()=="2024","DP selection")
                require("2023–24" in pg.locator(".board-dp-panel-heading").inner_text(),"Selected DP cohort header")
                require("34.0" in pg.locator(".board-dp-graphic-average").inner_text(),"DP avg 2024")
                require("92%" in pg.locator(".board-dp-graphic-pass").inner_text(),"DP pass 2024")
                require("38" in pg.locator(".board-dp-graphic-pathways").inner_text(),"DP pathway 2024")
                require(pg.locator(".board-dp-point.is-selected").count()==1,"Selected historical point highlighted")
                capture(pg,"04-DP-historical-2023-24")
                pg.locator('[data-board-dp-select="year"]').select_option("2020")
                require("35.7" in pg.locator(".board-dp-graphic-average").inner_text(),"2019–20 DP average")
                require("—" in pg.locator(".board-dp-graphic-pass").inner_text(),"Missing 2019–20 pass")
                require("—" in pg.locator(".board-dp-graphic-pathways").inner_text(),"Missing pathway count")
                return "DP filter updates all three cards, including honest unavailable results"
            scenario("Diploma historical year and missing data",dp_year,pg)

            def dp_range():
                pg.locator('[data-board-dp-select="range"]').select_option("recent")
                require(pg.locator('[data-board-dp-select="year"]').input_value()=="2026",
                        "Selecting latest 3 should move an older selected year into visible range")
                require(pg.locator(".board-dp-point").count()==3,"Last 3 DP points")
                require(pg.locator(".board-dp-chart-scroll").count()==1,"Historical chart intact")
                pg.locator('[data-board-dp-metric="passRate"]').click()
                require(pg.locator(".board-dp-point").count()==3,"Last 3 pass rate points")
                pg.locator('[data-board-dp-select="year"]').select_option("2022")
                require(pg.locator('[data-board-dp-select="range"]').input_value()=="all",
                        "Older cohort should automatically expose full history")
                require(pg.locator(".board-dp-point").count()==6,"Full pass-rate history with one missing value")
                require(pg.locator('[data-board-dp-select="year"]').input_value()=="2022","Year selection persists")
                return "DP year, range and metric controls work together without hidden cohorts"
            scenario("Diploma historical range and metric",dp_range,pg)

            def select_dp_point():
                pg.locator('[data-board-dp-point="passRate:2025"]').click()
                require(pg.locator('[data-board-dp-select="year"]').input_value()=="2025",
                        "Clicking trend point should update the selected cohort")
                require("2024–25" in pg.locator(".board-dp-panel-heading").inner_text(),
                        "Selected point must update card header")
                require(pg.locator(".board-dp-point.is-selected").count()==1,"Selected chart point highlighted")
                require("93%" in pg.locator(".board-dp-inspector").inner_text(),"Inline point explanation missing")
                return "Interactive historical chart selects year and updates Diploma tiles"
            scenario("Diploma chart point selects cohort",select_dp_point,pg)

            def share():
                pg.locator('[data-board-share]').click()
                pg.wait_for_timeout(180)
                status=pg.locator("#board-share-feedback").inner_text()
                require("Link copied" in status or "Copy this link:" in status,"Share feedback absent")
                url=pg.evaluate("navigator.clipboard.readText()") if "Link copied" in status else status.split("Copy this link:",1)[-1].strip()
                require("view=dp" in url and "metric=passRate" in url and "year=2025" in url,
                        "Share URL must encode Diploma metric and selected cohort")
                second=ctx.new_page()
                try:
                    second.goto(url,wait_until="domcontentloaded")
                    second.locator(".board-dp-controls").wait_for(timeout=16000)
                    require(second.locator('[data-board-dp-select="year"]').input_value()=="2025",
                            "Direct link cohort mismatch")
                    require(second.locator('[data-board-dp-metric="passRate"]').get_attribute("aria-pressed")=="true",
                            "Direct link metric mismatch")
                finally:second.close()
                return "Board share link restores Diploma year, metric and trend range"
            scenario("Diploma shareable filtered view",share,pg)

            def roles():
                pg.locator('[data-role="faculty"]').click()
                require(pg.locator(".roster").count()==1,"Faculty roster changed")
                pg.locator('[data-role="student"]').click()
                require(pg.locator(".profile-head").count()==1,"Student profile changed")
                pg.locator('[data-role="leader"]').click()
                require(pg.locator(".leader-kpis").count()==1,"Leader dashboard changed")
                return "Faculty, Student and Leader pages unaffected"
            scenario("Other role regression",roles,pg)
            require(not errors,"JavaScript browser errors: "+str(errors))
            ctx.close()
            for w,h in [(360,800),(390,844),(768,1024),(1280,900)]:
                c=browser.new_context(viewport={"width":w,"height":h},has_touch=w<600,is_mobile=w<600)
                p=c.new_page();js=[]
                p.on("pageerror",lambda e:js.append(str(e)))
                def mobile():
                    p.goto(BASE+"/#/board?view=explore&window=spring2026&subject=math",wait_until="domcontentloaded")
                    p.locator(".board-comparison-display").wait_for(timeout=17000)
                    require(p.locator(".board-comparison-window").count()==2,"MAP Fall and Spring sections missing")
                    require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
                            "MAP page horizontal overflow at "+str(w))
                    require(p.locator(".board-comparison-subject").first.is_visible(),"MAP tiles hidden on device")
                    if w==390:capture(p,"05-MAP-mobile-390")
                    p.locator('.board-nav-tabs [data-board-view="dp"]').click()
                    require(p.locator(".board-dp-graphic-card").count()==3,"DP tiles missing on device")
                    require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
                            "DP page horizontal overflow at "+str(w))
                    require(p.locator('[data-board-dp-select="year"]').is_visible(),"DP year filter hidden")
                    if w==390:capture(p,"06-DP-mobile-390")
                    p.locator('[data-board-dp-select="year"]').select_option("2024")
                    require("92%" in p.locator(".board-dp-graphic-pass").inner_text(),"Mobile DP filtered pass rate")
                    require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
                            "Filtered DP page horizontal overflow at "+str(w))
                    require(not js,"Page JS errors: "+str(js))
                    return str(w)+"px MAP/DP comparison tiles and Diploma filters fit without page overflow"
                scenario("Responsive "+str(w)+"px",mobile,p)
                c.close()
        finally:
            browser.close()
    passed=sum(item["passed"] for item in checks)
    (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(checks),"checks":checks},indent=2))
    print("SUMMARY",passed,"/",len(checks),flush=True)
    return 0 if passed==len(checks) else 1
if __name__=="__main__":
    raise SystemExit(main())

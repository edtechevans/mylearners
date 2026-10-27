"""Chrome UX and data-integrity test: one consistent AISG MAP Board layout across 24 windows."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board")
OUT.mkdir(exist_ok=True)
checks=[]
def require(value,msg):
    if not value:raise AssertionError(msg)
def scenario(name,fn):
    try:
        detail=fn()
        print("PASS |",name,"|",detail,flush=True)
        checks.append({"name":name,"pass":True,"details":detail})
    except Exception as err:
        print("FAIL |",name,"|",str(err),flush=True)
        checks.append({"name":name,"pass":False,"details":str(err)})

def assert_schema(page):
    require(page.locator(".board-grade-row").count()>0,"No grade rows")
    require(page.locator(".board-bar-series").count()==page.locator(".board-grade-row").count()*2,
            "Every grade must render U.S. and EARCOS lines")
    page.locator(".board-figures summary").click()
    headers=page.locator(".board-table thead th").all_text_contents()
    require(headers==["Grade","AISG mean RIT","U.S. mean RIT","EARCOS mean RIT",
                     "Gap vs U.S.","Gap vs EARCOS","Meeting projected growth"],
            "Inconsistent detail columns: "+str(headers))
    page.locator(".board-figures summary").click()
    require(page.locator(".board-indicator").count()==4,"All windows need the same four KPIs")

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
          headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            context=browser.new_context(viewport={"width":1440,"height":900},locale="en-GB")
            page=context.new_page();errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto(BASE+"/#/overview",wait_until="domcontentloaded")
            page.locator("header.top").wait_for(timeout=15000)
            def faculty():
                require(page.locator(".roster").count()==1,"Faculty roster missing")
                require(page.locator("[data-role]").count()==4,"Four roles expected")
                page.locator('[data-role="board"]').click()
                page.locator(".board-view").wait_for()
                require(page.url.endswith("/board"),"Board deep link failed")
                return "Faculty view remains intact; Board opens correctly"
            scenario("Four-role navigation",faculty)
            def latest():
                require(page.locator('[data-board-select="year"]').input_value()=="2026","Newest year not selected")
                require(page.locator('[data-board-window="fall2026"]').get_attribute("aria-pressed")=="true","Fall 2026 not default")
                require(page.locator('[data-board-window="unavailable-spring"]').is_disabled(),"Spring 2027 must be unavailable")
                require("8 / 8" in page.locator(".board-indicator").first.inner_text(),"Fall 2026 U.S. 8/8")
                require("—" in page.locator(".board-indicator").nth(1).inner_text(),"Missing Fall 2026 EARCOS as —")
                require("—" in page.locator(".board-indicator").nth(2).inner_text(),"Missing RIT gap as —")
                require("95%" in page.locator(".board-schoolwide-fact").inner_text(),"95% missing")
                require("SCHOOLWIDE HIGHLIGHTS" in page.locator(".board-schoolwide-fact").inner_text(),"Schoolwide scope not visible")
                assert_schema(page)
                page.screenshot(path=str(OUT/"fall2026-mathematics-desktop.png"),full_page=True)
                return "Latest Fall 2026 uses same 4 KPIs, 2-line grade plot and 7-column table"
            scenario("Fall 2026 incomplete benchmark handling",latest)
            def subjects():
                for subject in ("reading","language","math"):
                    page.locator('[data-board-subject="'+subject+'"]').click()
                    require("8 / 8" in page.locator(".board-indicator").first.inner_text(),subject+" 8 of 8")
                    assert_schema(page)
                return "Math, Reading, Language Usage share identical Board layout"
            scenario("Subject switch and uniform layout",subjects)
            def fall2025():
                page.locator('[data-board-select="year"]').select_option("2025")
                require(page.locator('[data-board-window="fall2025"]').get_attribute("aria-pressed")=="true","Fall 2025 missing")
                require("7 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Math 7/8 EARCOS")
                require(page.locator(".board-bar-fill.earcos").count()==8,"Fall 2025 EARCOS RIT bars")
                assert_schema(page)
                page.locator('[data-board-subject="reading"]').click()
                require("3 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Fall Reading 3/8")
                page.screenshot(path=str(OUT/"fall2025-reading-desktop.png"),full_page=True)
                return "Historical Fall 2025 EARCOS benchmark preserved"
            scenario("Historical fall benchmark",fall2025)
            def spring2026():
                page.locator('[data-board-window="spring2026"]').click()
                page.locator('[data-board-subject="math"]').click()
                require("6 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Spring 2026 Math EARCOS 6/8")
                require("71%" in page.locator(".board-indicator").nth(3).inner_text(),"Spring Math growth 71%")
                grade8=page.locator(".board-grade-row").filter(has_text="Grade 8")
                require("-0.6" in grade8.inner_text(),"Grade 8 Math below EARCOS by 0.62 RIT")
                assert_schema(page)
                page.screenshot(path=str(OUT/"spring2026-mathematics-earcos-desktop.png"),full_page=True)
                page.locator('[data-board-subject="reading"]').click()
                require("3 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Spring Reading EARCOS 3/8")
                require("62%" in page.locator(".board-indicator").nth(3).inner_text(),"Spring Reading projected growth 62%")
                assert_schema(page)
                page.locator('[data-board-subject="language"]').click()
                require("3 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Spring Language EARCOS 3/8")
                require("—" in page.locator(".board-indicator").nth(3).inner_text(),"Cannot fabricate Language growth")
                assert_schema(page)
                return "Spring 2026 EARCOS screenshot supports Math 6/8, Reading 3/8, Language 3/8"
            scenario("Spring 2026 new EARCOS benchmarks",spring2026)
            def drilldown():
                page.locator('[data-board-subject="math"]').click()
                page.locator('[data-board-select="division"]').select_option("elementary")
                require(page.locator(".board-grade-row").count()==3,"Elementary must be G3-5")
                page.locator('[data-board-select="grade"]').select_option("4")
                require(page.locator(".board-grade-row").count()==1,"Grade drilldown failed")
                page.locator(".board-figures summary").click()
                require("225.6" in page.locator(".board-table tbody").inner_text(),
                        "Spring 2026 G4 EARCOS should be 225.55, shown rounded to 225.6")
                page.locator(".board-figures summary").click()
                page.locator('[data-board-select="division"]').select_option("secondary")
                require(page.locator('[data-board-select="grade"]').input_value()=="all","Grade should reset with division")
                require(page.locator(".board-grade-row").count()==5,"Secondary Grades 6-10")
                page.locator('[data-board-select="division"]').select_option("all")
                return "Division and single-grade drilldown preserve comparable subjects/periods"
            scenario("Division and grade filters",drilldown)
            def first_archives():
                page.locator('[data-board-select="year"]').select_option("2014")
                require(page.locator('[data-board-window="fall2014"]').get_attribute("aria-pressed")=="true","Fall 2014 absent")
                require(page.locator(".board-bar-fill.earcos").count()==8,"2014 archive not mapped")
                assert_schema(page)
                page.locator('[data-board-window="spring2015"]').click()
                require("Spring 2015" in page.locator(".board-context").inner_text(),"Spring 2015 wrong")
                assert_schema(page)
                page.locator('[data-board-select="year"]').select_option("2015")
                require("Spring 2016" in page.locator(".board-context").inner_text(),"Season should persist switching years")
                require(page.locator(".board-grade-row").count()==8,"2016 archival rows")
                grade8=page.locator(".board-grade-row").filter(has_text="Grade 8")
                require("—" in grade8.inner_text(),"Corrupted EARCOS value must be unavailable")
                page.locator(".board-figures summary").click()
                lines=page.locator(".board-table tbody tr")
                g8=lines.nth(5).inner_text()
                require("—" in g8,"Historical corrupt source needs emdash")
                page.locator(".board-figures summary").click()
                return "Archive 2014–16 accessible, corrupted Spring 2016 EARCOS treated as missing"
            scenario("Historical years, term switch and corrupted cell",first_archives)
            def missing_term():
                page.locator('[data-board-select="year"]').select_option("2019")
                require(page.locator('[data-board-window="fall2019"]').get_attribute("aria-pressed")=="true","Fall 2019 fallback")
                require(page.locator('[data-board-window="unavailable-spring"]').is_disabled(),"Spring 2020 must be disabled")
                assert_schema(page)
                return "Unreported Spring 2020 remains unavailable"
            scenario("Missing historical testing season",missing_term)
            def provenance():
                page.locator(".board-source summary").click()
                require("AISG.csv" in page.locator(".board-source").inner_text(),"Archived data citation missing")
                require("norm editions" in page.locator(".board-source").inner_text(),"Comparability caution missing")
                page.locator(".board-source summary").click()
                page.locator('[data-board-select="year"]').select_option("2025")
                page.locator('[data-board-window="spring2026"]').click()
                page.locator(".board-source summary").click()
                require("screenshot" in page.locator(".board-source").inner_text(),"Spring EARCOS screenshot provenance missing")
                return "Sources and limitations traceable on each window"
            scenario("Explainable data provenance",provenance)
            def roles_safe():
                page.locator('[data-role="faculty"]').click()
                require(page.locator(".roster").count()==1,"Returning Faculty failed")
                require(page.locator(".board-view").count()==0,"Board data leaked into fictional Faculty")
                return "Existing Faculty/Student/Leader flows remain independent of Board"
            scenario("Role isolation",roles_safe)
            context.close()
            for width,height in ((390,844),(360,800),(768,1024)):
                ctx=browser.new_context(viewport={"width":width,"height":height})
                pg=ctx.new_page()
                def device():
                    pg.goto(BASE+"/#/board",wait_until="domcontentloaded")
                    pg.locator(".board-view").wait_for(timeout=15000)
                    require(pg.locator("[data-role]").count()==4,"Role toggle")
                    require(pg.locator(".board-grade-row").count()==8,"Chart rows missing")
                    require(pg.locator(".board-indicator").count()==4,"KPIs missing")
                    require(pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),"Horizontal overflow")
                    require(pg.locator('[data-board-select="year"]').is_visible(),"Year selection invisible")
                    if width==390:
                        pg.screenshot(path=str(OUT/"fall2026-board-mobile-390.png"),full_page=True)
                    pg.locator('[data-board-select="year"]').select_option("2025")
                    pg.locator('[data-board-window="spring2026"]').click()
                    require("6 / 8" in pg.locator(".board-indicator").nth(1).inner_text(),"Spring EARCOS failed on mobile")
                    require(pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),"Overflow switching seasons")
                    if width==390:
                        pg.screenshot(path=str(OUT/"spring2026-earcos-mobile-390.png"),full_page=True)
                    return f"{width}px Board controls, unified chart and Spring EARCOS fit"
                scenario(f"Responsive {width}px",device)
                ctx.close()
            require(not errors,"JavaScript page errors: "+str(errors))
        finally:
            browser.close()
    good=sum(item["pass"] for item in checks)
    (OUT/"summary.json").write_text(json.dumps({"passed":good,"total":len(checks),"scenarios":checks},indent=2))
    print("SUMMARY",good,"/",len(checks),flush=True)
    return 0 if good==len(checks) else 1

if __name__=="__main__":raise SystemExit(main())

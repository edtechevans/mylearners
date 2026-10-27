"""Board-only Chrome UI/UX audit: Fall 2026 U.S. norms, Language Usage, and
accessible historical grade hover/tap/focus details. No student data published.
"""
import os,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-overview");OUT.mkdir(parents=True,exist_ok=True)
results=[]
def check(cond,msg):
    if not cond:raise AssertionError(msg)
def snap(pg,name):
    pg.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def scenario(name,fn,pg=None):
    try:
        note=fn()
        results.append({"scenario":name,"pass":True,"details":str(note)})
        print("PASS | "+name+" | "+str(note),flush=True)
    except Exception as error:
        results.append({"scenario":name,"pass":False,"error":str(error)})
        print("FAIL | "+name+" | "+str(error),flush=True)
        if pg:
            try:snap(pg,"FAIL-"+re.sub(r'[^a-z0-9]+','-',name.lower())[:42])
            except Exception:pass

def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
           args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            ctx=browser.new_context(viewport={"width":1440,"height":900},permissions=["clipboard-read","clipboard-write"])
            pg=ctx.new_page()
            errors=[]
            pg.on("pageerror",lambda e:errors.append(str(e)))
            pg.goto(BASE+"/#/faculty",wait_until="domcontentloaded",timeout=20000)
            pg.locator("header.top").wait_for(timeout=20000)

            def roles():
                check(pg.locator(".roster").count()==1,"Original teacher roster must be intact")
                check(pg.locator("[data-role]").count()==4,"Four demo role toggles")
                pg.locator('[data-role="board"]').click()
                pg.locator(".board-overview").wait_for(timeout=10000)
                check(pg.locator(".board-nav-tabs button").count()==2,"Two Board pages")
                check(pg.locator(".board-overview-card").count()==3,"Three Board headline cards")
                check(pg.locator(".board-controls").count()==0,"Detailed filters should not clutter Board Overview")
                snap(pg,"01-board-three-subject-overview")
                return "Faculty intact, Board Overview first, 3 headline cards"
            scenario("Board-only changes and role switch",roles,pg)

            def metrics():
                text=pg.locator(".board-overview-cards").inner_text()
                check("24 / 24" in text,"Fall 2026 24/24")
                check(pg.locator(".board-overview-three-metrics").count()==3,"Each headline needs three subject metrics")
                check(pg.locator(".board-overview-subject").count()==9,"Math/Reading/Language Usage in each card")
                check("Language Usage" in text,"Language Usage missing")
                check("6 / 8" in text and "3 / 8" in text,"Spring regional comparison")
                check("71%" in text and "62%" in text,"Spring Math/Reading growth")
                check("Language Usage data not supplied" in text,"Language growth missing note")
                check(pg.locator(".board-trend-series").count()==3,"History should plot Math, Reading and Language")
                check(pg.locator('.board-overview-table').count()==1,"Accessible yearly values needed")
                return "All three subjects present in every headline and EARCOS history"
            scenario("Overview three-subject parity",metrics,pg)

            def fall_table():
                pg.locator(".board-overview-table summary").click()
                headings=pg.locator(".board-overview-table thead th").all_text_contents()
                check(len(headings)==4,"Annual values need Fall/Spring, Math, Reading, Language Usage columns")
                check("Language Usage" in headings[3],"Last table column should be Language Usage")
                rows=pg.locator(".board-overview-table tbody tr")
                check(rows.count()==13,"2014–2026 Fall rows")
                check("—" in rows.last.inner_text(),"Fall 2026 EARCOS absence shown as —")
                pg.locator(".board-overview-table summary").click()
                return "13 Fall windows, three subjects, Fall 2026 EARCOS not fabricated"
            scenario("Historical annual table and absent EARCOS",fall_table,pg)

            def grade_hover():
                point=pg.locator('[data-board-point="fall:2025:math"]')
                check(point.count()==1,"Specific Fall 2025 math point")
                point.hover()
                panel=pg.locator(".board-trend-inspector")
                check("Mathematics · Fall 2025" in panel.inner_text(),"Wrong tooltip title")
                check("7 of 8" in panel.inner_text(),"Math Fall 2025 7/8")
                chips=panel.locator(".board-trend-grade")
                check(chips.count()==8,"Need chips G3–G10")
                check(panel.locator(".board-trend-grade.is-above").count()==7,"Above status grade count")
                check(panel.locator(".board-trend-grade.is-below").count()==1,"Below status grade count")
                check("G8" in panel.locator(".board-trend-grade.is-below").inner_text(),"G8 should be below EARCOS")
                check(point.get_attribute("role")=="button","Point should be keyboard operable")
                snap(pg,"02-chart-hover-shows-grades")
                return "Hover Fall 2025 Math: G3,G4,G5,G6,G7,G9,G10 above; G8 not above"
            scenario("Hover point highlights exact grades",grade_hover,pg)

            def keyboard():
                point=pg.locator('[data-board-point="fall:2025:language"]')
                point.focus()
                check("Language Usage · Fall 2025" in pg.locator(".board-trend-inspector").inner_text(),"Keyboard focus update")
                point.press("Enter")
                check(point.evaluate("e=>e.classList.contains('is-active')"),"Keyboard selects point")
                check("G10" in pg.locator(".board-trend-grade-chips").inner_text(),"Grade chips accessible")
                return "Keyboard focus and Enter reveal Language Usage grade details"
            scenario("Accessible keyboard point inspection",keyboard,pg)

            def spring():
                pg.locator('[data-board-trend="spring"]').click()
                check(pg.locator('[data-board-point="spring:2026:language"]').count()==1,"Spring 2026 Language point missing")
                pg.locator('[data-board-focus="language"]').click()
                check(pg.locator('[data-board-series="language"]').count()==1,"Language filtered")
                check(pg.locator('[data-board-series="math"]').count()==0,"Math line should hide when focused")
                pg.locator('[data-board-point="spring:2026:language"]').hover()
                check("3 of 8" in pg.locator(".board-trend-inspector").inner_text(),"Spring Language EARCOS 3/8")
                pg.locator(".board-overview-table summary").click()
                row=pg.locator(".board-overview-table tbody tr").filter(has_text="Spring 2020")
                check("—" in row.inner_text(),"2020 Spring should remain unavailable")
                pg.locator(".board-overview-table summary").click()
                pg.locator('[data-board-focus="all"]').click()
                check(pg.locator(".board-trend-series").count()==3,"All series restored")
                snap(pg,"03-board-spring-language-comparison")
                return "Spring Language 3/8 EARCOS; missing spring 2020 preserved"
            scenario("Language Usage chart focus and historical gaps",spring,pg)

            def latest_us():
                pg.locator('.board-nav-tabs [data-board-view="explore"]').click()
                pg.locator('[data-board-select="year"]').select_option("2026")
                pg.locator('[data-board-subject="math"]').click()
                check("8 / 8" in pg.locator(".board-indicator").first.inner_text(),"All 8 math grade means above US")
                check("—" in pg.locator(".board-indicator").nth(1).inner_text(),"EARCOS remains unavailable")
                check("RIT" in pg.locator(".board-indicator").nth(2).inner_text(),"Actual U.S. gap should show RIT")
                check(pg.locator(".board-bar-series").count()==8,"8 real US comparison bars without repeated empty EARCOS")
                check(pg.locator(".board-bar-fill.us").count()==8,"Numeric U.S. RIT bars missing")
                check(pg.locator(".board-bar-fill.earcos").count()==0,"Invented EARCOS bars")
                check("week 4" in pg.locator(".board-benchmark-note").inner_text().lower(),"2025 school norm source context")
                pg.locator(".board-figures summary").click()
                row=pg.locator(".board-table tbody tr").first.inner_text()
                check("200.7" in row and "184.0" in row and "16.7" in row,"Grade 3 math AISG/US/gap mismatch")
                check("n=75" in row,"Source grade count missing")
                pg.locator(".board-figures summary").click()
                snap(pg,"04-fall2026-us-math-rit")
                return "Fall 2026 Math G3 AISG 200.7, US 184, gap +16.7; EARCOS —"
            scenario("Fall 2026 U.S. school norms and real AISG RIT",latest_us,pg)

            def subject_and_grade():
                pg.locator('[data-board-subject="reading"]').click()
                pg.locator(".board-figures summary").click()
                check("187.4" in pg.locator(".board-table tbody tr").first.inner_text(),"Fall G3 Reading AISG")
                pg.locator(".board-figures summary").click()
                pg.locator('[data-board-subject="language"]').click()
                pg.locator('[data-board-select="division"]').select_option("secondary")
                pg.locator('[data-board-select="grade"]').select_option("8")
                check(pg.locator(".board-grade-row").count()==1,"G8 single bar")
                pg.locator(".board-figures summary").click()
                row=pg.locator(".board-table tbody tr").first.inner_text()
                check("225.8" in row and "213.0" in row and "12.8" in row,"G8 Language 2026 actual RIT gap")
                check("n=90" in row,"Language G8 n")
                pg.locator(".board-figures summary").click()
                return "Reading and Language Usage actual RIT means, division and grade filters"
            scenario("Three-subject grade-level U.S. comparisons",subject_and_grade,pg)

            def source():
                pg.locator(".board-source summary").click()
                body=pg.locator(".board-source").inner_text()
                check("2025" in body and "school" in body.lower(),"NWEA school norms source")
                check("Student-level data remain private" in body,"Privacy and aggregation disclosure")
                link=pg.locator('.board-source a[href*="2025-norms-quick-reference"]')
                check(link.count()==1,"Official US norms reference not linked")
                pg.locator(".board-source summary").click()
                return "Clear source link, grades aggregated without published student records"
            scenario("Official norms and privacy explanation",source,pg)

            def links():
                pg.locator('[data-board-share]').click()
                pg.wait_for_timeout(250)
                copied=pg.locator("#board-share-feedback").inner_text()
                check("Link copied" in copied or "Copy this link:" in copied,"Copy link feedback")
                url=pg.evaluate("navigator.clipboard.readText()") if "Link copied" in copied else copied.split("Copy this link:",1)[-1].strip()
                check("subject=language" in url and "window=fall2026" in url and "grade=8" in url,"Subject/grade share state")
                tab=ctx.new_page()
                try:
                    tab.goto(url,wait_until="domcontentloaded")
                    tab.locator(".board-grade-row").wait_for(timeout=15000)
                    check(tab.locator('[data-board-select="grade"]').input_value()=="8","Restored grade")
                    check(tab.locator('[data-board-subject="language"]').get_attribute("aria-pressed")=="true","Restored Language")
                finally:tab.close()
                return "Grade 8 Language Fall 2026 deep link restores exact results"
            scenario("Share new Language Usage Board view",links,pg)

            def isolation():
                pg.locator('[data-role="faculty"]').click()
                check(pg.locator(".roster").count()==1,"Faculty view regression")
                pg.locator('[data-role="student"]').click()
                check(pg.locator(".profile-head").count()==1,"Student view regression")
                pg.locator('[data-role="leader"]').click()
                check(pg.locator(".leader-kpis").count()==1,"Leader view regression")
                return "Faculty, Student, Leader views function as before"
            scenario("Other three roles unchanged",isolation,pg)
            check(not errors,"Page Javascript errors: "+str(errors))
            ctx.close()

            for width,height in [(360,800),(390,844),(768,1024),(1280,900)]:
                context=browser.new_context(viewport={"width":width,"height":height})
                mobile=context.new_page();e=[]
                mobile.on("pageerror",lambda err:e.append(str(err)))
                def responsive():
                    mobile.goto(BASE+"/#/board",wait_until="domcontentloaded")
                    mobile.locator(".board-overview").wait_for(timeout=16000)
                    check(mobile.locator(".board-trend-series").count()==3,"All 3 subjects in mobile chart")
                    check(mobile.locator(".board-overview-subject").count()==9,"All 3 subjects in cards")
                    check(mobile.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),"Page horizontal overflow")
                    if width==390:
                        snap(mobile,"05-three-subjects-mobile")
                        mobile.locator('[data-board-point="fall:2025:math"]').click()
                        check("G8" in mobile.locator(".board-trend-inspector").inner_text(),"Tap point grades")
                        snap(mobile,"06-mobile-tap-grades")
                    mobile.locator('.board-nav-tabs [data-board-view="explore"]').click()
                    check(mobile.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),"Explorer page overflow")
                    check(mobile.locator(".board-grade-row").count()==8,"8 grades")
                    if width==390:snap(mobile,"07-mobile-fall26-us")
                    mobile.locator('.board-nav-tabs [data-board-view="overview"]').click()
                    check(mobile.locator(".board-overview").count()==1,"Return overview")
                    check(not e,"Javascript errors: "+str(e))
                    return f"{width}px: three subjects, interactive grade detail and U.S. norm results"
                scenario(f"Responsive Board {width}px",responsive,mobile)
                context.close()
        finally:browser.close()
    passed=sum(x["pass"] for x in results)
    (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(results),"checks":results},indent=2))
    print("SUMMARY",passed,"/",len(results),flush=True)
    return 0 if passed==len(results) else 1

if __name__=="__main__":raise SystemExit(main())

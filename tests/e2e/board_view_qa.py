"""AISG My Learners Board MAP end-to-end QA.
A browser test with historical, aggregated school data only (no student records).
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json,traceback
BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board")
OUT.mkdir(parents=True,exist_ok=True)
results=[]
def check(condition,label):
    if not condition:raise AssertionError(label)
def step(label,action):
    try:
        note=action()
        results.append({"name":label,"status":"passed","note":note})
        print("PASS |",label,"|",note,flush=True)
    except Exception as exc:
        results.append({"name":label,"status":"failed","error":str(exc)})
        print("FAIL |",label,"|",exc,flush=True)
def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
          headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            context=browser.new_context(viewport={"width":1440,"height":900},locale="en-GB")
            page=context.new_page();errors=[]
            page.on("pageerror",lambda exc:errors.append(str(exc)))
            page.goto(BASE+"/#/overview",wait_until="domcontentloaded")
            page.locator(".top").wait_for(timeout=18000)
            def default_role():
                check(page.locator('[data-role="faculty"]').get_attribute("aria-pressed")=="true","Default Faculty state")
                check(page.locator('[data-role]').count()==4,"Four role choices")
                check(page.locator(".roster").count()==1,"Faculty roster retained")
                return "Faculty remains default; fourth role is Board"
            step("Faculty preserved with four-level toggle",default_role)
            def open_board():
                page.locator('[data-role="board"]').click()
                page.locator(".board-view").wait_for()
                check(page.url.endswith("/board"),"Board deep link")
                check("ACTUAL AISG AGGREGATES" in page.locator("main").inner_text(),"Actual data correctly signposted")
                check(page.locator('[data-board-window="fall2026"]').get_attribute("aria-pressed")=="true","Newest Fall 2026 opens by default")
                check("8 / 8" in page.locator(".board-indicator").nth(0).inner_text(),"Fall 2026 Math vs US 8/8")
                check(page.locator(".board-status-item").count()==8,"Directional status shown for all eight grades")
                check(page.locator(".board-bar-fill").count()==0,"Fall 2026 must not invent RIT bars")
                check("95%" in page.locator(".board-schoolwide-fact").inner_text(),"Schoolwide growth 95%")
                check("not specific to the selected" in page.locator(".board-schoolwide-fact").inner_text(),"Scope note for 95%")
                page.screenshot(path=str(OUT/"board-math-fall2026-desktop.png"),full_page=True)
                page.locator('[data-board-window="fall2025"]').click()
                check("7 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Fall 2025 Math vs EARCOS 7/8")
                check(page.locator(".board-grade-row").count()==8,"Historical Fall 2025 RIT comparison intact")
                return "Fall 2026 Math 8/8 US and 95% schoolwide growth; Fall 2025 EARCOS preserved"
            step("Board landing with real Fall 2026 summary",open_board)
            def regional_differences():
                grade8=page.locator(".board-grade-row").filter(has_text="Grade 8")
                check("-1.0" in grade8.inner_text(),"Grade 8 Math must be below EARCOS by 1 RIT")
                page.locator('[data-board-subject="reading"]').click()
                check("3 / 8" in page.locator(".board-indicator").nth(1).inner_text(),"Reading EARCOS count 3/8")
                check(page.locator(".board-grade-row").count()==8,"Grade table after subject switch")
                page.screenshot(path=str(OUT/"board-reading-fall-desktop.png"),full_page=True)
                return "Reading vs EARCOS 3/8; Grade 8 Mathematics negative regional gap preserved"
            step("Reading benchmark and honest negative values",regional_differences)
            def latest_summary_filters():
                page.locator('[data-board-window="fall2026"]').click()
                page.locator('[data-board-subject="reading"]').click()
                check("8 / 8" in page.locator(".board-indicator").first.inner_text(),"Reading Fall 2026 8/8")
                check(page.locator(".board-status-item").count()==8,"Reading grade-level status")
                page.locator('[data-board-select="division"]').select_option("elementary")
                check(page.locator(".board-status-item").count()==3,"Elementary Fall 2026 statuses")
                check("3 / 3" in page.locator(".board-indicator").first.inner_text(),"Elementary 3 of 3 grades")
                page.locator('[data-board-select="grade"]').select_option("5")
                check(page.locator(".board-status-item").count()==1,"Grade 5 Fall 2026")
                check("1 / 1" in page.locator(".board-indicator").first.inner_text(),"Single grade true")
                check("95%" in page.locator(".board-schoolwide-fact").inner_text(),"Schoolwide stat retains explicit scope")
                page.locator(".board-source summary").click()
                check("NOT give grade-level mean RIT" in page.locator(".board-source").inner_text(),"Methodology makes absent data explicit")
                page.locator('[data-board-select="division"]').select_option("all")
                page.locator('[data-board-window="fall2025"]').click()
                return "Fall 2026 Reading 8/8, Elementary 3/3, G5 1/1, no RIT or EARCOS fabrication"
            step("Fall 2026 grade and division filters",latest_summary_filters)
            def filters():
                page.locator('[data-board-select="division"]').select_option("elementary")
                check(page.locator(".board-grade-row").count()==3,"Elementary grades 3–5")
                page.locator('[data-board-select="grade"]').select_option("4")
                check(page.locator(".board-grade-row").count()==1,"Grade 4 only")
                check("Grade 4" in page.locator(".board-grade-row").inner_text(),"Correct grade")
                page.locator('[data-board-select="division"]').select_option("secondary")
                check(page.locator('[data-board-select="grade"]').input_value()=="all","Grade resets on division")
                check(page.locator(".board-grade-row").count()==5,"Secondary five grades")
                page.locator('[data-board-select="division"]').select_option("all")
                return "Division and grade drilldowns never mix cohorts"
            step("Division and grade navigation",filters)
            def spring_math():
                page.locator('[data-board-subject="math"]').click()
                page.locator('[data-board-window="spring2026"]').click()
                check(page.locator(".board-indicator").nth(0).inner_text().find("8 / 8")>=0,"Spring Math above US 8/8")
                check("71%" in page.locator(".board-indicator").nth(2).inner_text(),"Projected growth Math 71%")
                check(page.locator(".board-bar-fill.earcos").count()==0,"EARCOS not shown when unavailable")
                check("not supplied" in page.locator(".board-benchmark-note").inner_text(),"EARCOS absence explained")
                page.screenshot(path=str(OUT/"board-math-spring-desktop.png"),full_page=True)
                return "Spring 2026 Math — 71% matched growth; no invented EARCOS benchmark"
            step("Spring 2026 mathematics and benchmark integrity",spring_math)
            def spring_reading():
                page.locator('[data-board-subject="reading"]').click()
                check("62%" in page.locator(".board-indicator").nth(2).inner_text(),"Spring Reading growth 62%")
                check(page.locator(".board-grade-row").count()==8,"All eight grades reading")
                page.locator(".board-details").first.locator("summary").click()
                check(page.locator(".board-table tbody tr").count()==8,"Exact data table has eight grades")
                check("233.5" in page.locator(".board-table").inner_text(),"Grade 9 reading derived mean")
                return "Spring Reading 62% growth and exact RIT table"
            step("Spring 2026 Reading and accessible exact figures",spring_reading)
            def missing_growth():
                page.locator('[data-board-select="grade"]').select_option("3")
                check(page.locator(".board-grade-row").count()==1,"G3 filter")
                check("No matched spring-to-spring cohort" in page.locator(".board-indicator").nth(2).inner_text(),"Missing growth clearly described")
                page.locator('[data-board-select="grade"]').select_option("all")
                return "Missing Grade 3 growth is not misrepresented as 0%"
            step("No fabricated Grade 3 prior-year growth",missing_growth)
            def sources():
                page.locator(".board-source summary").click()
                check("Spring 2026" in page.locator(".board-source").inner_text(),"Source window")
                check("earliest dated test" in page.locator(".board-source").inner_text(),"Duplicate handling documented")
                check("Grade 3" in page.locator(".board-source").inner_text(),"Growth eligibility note")
                return "Visible sources, methods and limitations"
            step("Sources and interpretation",sources)
            def restore_faculty():
                page.locator('[data-role="faculty"]').click()
                check(page.locator(".roster").count()==1,"Return to faculty roster")
                check(page.locator(".board-view").count()==0,"No Board data mixed into Faculty")
                return "Roles separate real Board aggregates from fictional learner examples"
            step("Return from Board to Faculty",restore_faculty)
            context.close()
            deep=browser.new_context(viewport={"width":1360,"height":870})
            pg=deep.new_page()
            def direct_board():
                pg.goto(BASE+"/#/board",wait_until="domcontentloaded")
                pg.locator(".board-view").wait_for(timeout=18000)
                check(pg.locator('[data-role="board"]').get_attribute("aria-pressed")=="true","Board URL loads Board role")
                check(pg.locator('[data-board-window="fall2026"]').get_attribute("aria-pressed")=="true","Direct Board URL defaults to Fall 2026")
                return "Sharable #/board link opens newest Fall 2026 window"
            step("Direct Board URL works",direct_board)
            deep.close()
            phone=browser.new_context(viewport={"width":390,"height":844},device_scale_factor=1)
            mobile=phone.new_page()
            def mobile_board():
                mobile.goto(BASE+"/#/board",wait_until="domcontentloaded")
                mobile.locator(".board-view").wait_for(timeout=18000)
                check(mobile.locator('[data-role]').count()==4,"Four role options on mobile")
                check(all(mobile.locator('[data-role]').nth(i).is_visible() for i in range(4)),"All role toggles visible")
                check(mobile.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),"No page overflow")
                check(mobile.locator(".board-status-item").count()==8,"Fall 2026 status chart visible")
                mobile.screenshot(path=str(OUT/"board-mobile-fall2026.png"),full_page=True)
                mobile.locator('[data-board-subject="reading"]').click()
                mobile.locator('[data-board-window="spring2026"]').click()
                check(mobile.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),"No mobile overflow after switches")
                mobile.locator('[data-board-select="division"]').select_option("elementary")
                check(mobile.locator(".board-grade-row").count()==3,"Mobile division filter works")
                mobile.screenshot(path=str(OUT/"board-mobile-spring-elementary.png"),full_page=True)
                return "390px responsive layout, role/subject/window/division controls and chart fit"
            step("Mobile Board usability",mobile_board)
            phone.close()
            check(not errors,"Browser JavaScript errors: "+str(errors))
        finally:
            browser.close()
    passed=sum(r["status"]=="passed" for r in results)
    (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(results),"results":results},indent=2))
    print("SUMMARY",passed,"/",len(results),flush=True)
    return 0 if passed==len(results) else 1
if __name__=="__main__":raise SystemExit(main())

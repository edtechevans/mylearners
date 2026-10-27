"""Chromium Board-only UI/UX audit — summary-first navigation, trends, detail and deep links.
Tests use public, aggregated AISG MAP results. Other role code and data stay untouched.
"""
import os,json,re,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-overview");OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(cond,msg):
    if not cond:raise AssertionError(msg)
def screenshot(pg,name):
    pg.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def scenario(name,run,pg=None):
    try:
        note=run()
        checks.append({"name":name,"passed":True,"description":str(note)})
        print("PASS | "+name+" | "+str(note),flush=True)
    except Exception as ex:
        checks.append({"name":name,"passed":False,"error":str(ex)})
        print("FAIL | "+name+" | "+str(ex),flush=True)
        if pg:
            try:screenshot(pg,"FAIL-"+re.sub(r'[^a-z0-9]+','-',name.lower())[:45])
            except Exception:pass

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
            args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            ctx=browser.new_context(viewport={"width":1440,"height":900},permissions=["clipboard-read","clipboard-write"])
            pg=ctx.new_page();errors=[]
            pg.on("pageerror",lambda error:errors.append(str(error)))
            pg.goto(BASE+"/#/faculty",wait_until="domcontentloaded")
            pg.locator("header.top").wait_for(timeout=20000)
            def faculty_to_board():
                check(pg.locator(".roster").count()==1,"Teacher homepage changed")
                check(pg.locator("[data-role]").count()==4,"Four top role buttons")
                pg.locator('[data-role="board"]').click()
                pg.locator(".board-overview").wait_for(timeout=10000)
                check(pg.locator(".board-nav-tabs button").count()==2,"Two simple Board tabs required")
                check(pg.locator('[data-board-view="overview"]').get_attribute("aria-current")=="page","Overview should be default")
                check(pg.locator(".board-overview-card").count()==3,"Three headline summaries")
                check(pg.locator(".board-controls").count()==0,"Detailed filters must not clutter Overview")
                screenshot(pg,"01-board-overview-desktop")
                return "Board defaults to 3 key indicators and historical chart, not detailed filters"
            scenario("Faculty role retained and Overview opens first",faculty_to_board,pg)

            def latest_and_chart():
                summary=pg.locator(".board-overview-cards").inner_text()
                check("24 / 24" in summary,"Latest Fall 2026 achievement missing")
                check("6 / 8 · 3 / 8" in summary,"Latest Spring 2026 EARCOS findings missing")
                check("71% · 62%" in summary,"Matched growth data missing")
                check(pg.locator(".board-trend-svg").count()==1,"Single historical line chart")
                check(pg.locator('[data-board-series="math"]').count()==1,"Math line missing")
                check(pg.locator('[data-board-series="reading"]').count()==1,"Reading line missing")
                check(pg.locator(".board-trend-svg").locator("text.board-trend-value").count()>=20,"Visible numeric point labels missing")
                check("not individual student growth" in pg.locator(".board-overview-method").inner_text(),"Longitudinal caveat missing")
                pg.locator(".board-overview-table summary").click()
                rows=pg.locator(".board-overview-table tbody tr")
                check(rows.count()==13,"Fall axis should include 2014–2026")
                check("—" in rows.last.inner_text(),"Fall 2026 absent EARCOS must show dash")
                check("7" in rows.first.inner_text() and "4" in rows.first.inner_text(),"Historical start values wrong")
                pg.locator(".board-overview-table summary").click()
                return "Fall 2014–2026 Math/Reading lines, point counts and missing 2026 gap"
            scenario("Actual Fall historical chart and accessible values",latest_and_chart,pg)

            def term_switch():
                pg.locator('[data-board-trend="spring"]').click()
                check(pg.locator('[data-board-trend="spring"]').get_attribute("aria-pressed")=="true","Spring not selected")
                pg.locator(".board-overview-table summary").click()
                rows=pg.locator(".board-overview-table tbody tr")
                check(rows.count()==12,"Spring axis should include 2015–2026")
                missing=rows.filter(has_text="Spring 2020")
                check(missing.count()==1 and missing.inner_text().count("—")>=2,"Missing Spring 2020 gap lost")
                recent=rows.filter(has_text="Spring 2026").inner_text()
                check("6" in recent and "3" in recent,"Spring 2026 EARCOS values wrong")
                pg.locator(".board-overview-table summary").click()
                screenshot(pg,"02-board-overview-spring-desktop")
                return "Spring 2020 excluded, Spring 2026 EARCOS Math 6/8 and Reading 3/8"
            scenario("Spring season and historical missing-data integrity",term_switch,pg)

            def filter_lines():
                pg.locator('[data-board-focus="math"]').click()
                check(pg.locator('[data-board-series="reading"]').count()==0,"Reading line should be hidden")
                check(pg.locator('[data-board-series="math"]').count()==1,"Math line should remain")
                pg.locator('[data-board-focus="reading"]').click()
                check(pg.locator('[data-board-series="math"]').count()==0,"Math line should be hidden")
                check(pg.locator('[data-board-series="reading"]').count()==1,"Reading line should remain")
                pg.locator('[data-board-focus="both"]').click()
                check(pg.locator(".board-trend-series").count()==2,"Both lines should return")
                return "Subject focus responds immediately without adding a second chart"
            scenario("Historical chart subject filter",filter_lines,pg)

            def overview_card_to_explorer():
                pg.locator('[data-board-go="spring2026:math"]').click()
                check(pg.locator('[data-board-view="explore"]').get_attribute("aria-current")=="page","Explorer tab inactive")
                check(pg.locator(".board-controls").count()==1,"Detailed filters missing")
                check(pg.locator(".board-indicator").count()==4,"Detailed snapshot should preserve 4 KPI slots")
                check("6 / 8" in pg.locator(".board-indicator").nth(1).inner_text(),"Spring 2026 Maths EARCOS 6/8")
                check("71%" in pg.locator(".board-indicator").nth(3).inner_text(),"Spring 2026 Math growth 71%")
                check("Unweighted" in pg.locator(".board-indicator").nth(2).inner_text(),"Mean grade gap method label missing")
                screenshot(pg,"03-explore-spring2026-math-desktop")
                return "One click from overview summary to grade-level Spring 2026 detail"
            scenario("Overview to Explore with correct data",overview_card_to_explorer,pg)

            def year_filter_and_missing():
                pg.locator('[data-board-select="year"]').select_option("2026")
                check(pg.locator('[data-board-window="fall2026"]').get_attribute("aria-pressed")=="true","Fall 2026 fallback missing")
                check(pg.locator(".board-achievement-grade").count()==8,"2026 needs compact grade summary")
                check(pg.locator(".board-bar-series").count()==0,"Do not draw 8 empty EARCOS bar tracks")
                check("EARCOS comparison —" in pg.locator(".board-not-available").inner_text(),"Unavailable EARCOS not explained")
                check("—" in pg.locator(".board-indicator.is-unavailable").first.inner_text(),"Missing benchmark KPI not muted")
                pg.locator(".board-figures summary").click()
                check(pg.locator(".board-table tbody tr").count()==8,"Exact figures table must remain")
                check("—" in pg.locator(".board-table tbody tr").first.inner_text(),"Blank EARCOS must show dash, not zero")
                pg.locator(".board-figures summary").click()
                screenshot(pg,"04-explore-fall2026-desktop")
                return "Fall 2026 shows achieved grades but avoids eight empty benchmark rows"
            scenario("No misleading 2026 EARCOS bars",year_filter_and_missing,pg)

            def grade_detail_and_source():
                pg.locator('[data-board-select="year"]').select_option("2025")
                pg.locator('[data-board-window="spring2026"]').click()
                pg.locator('[data-board-subject="reading"]').click()
                pg.locator('[data-board-select="division"]').select_option("secondary")
                pg.locator('[data-board-select="grade"]').select_option("8")
                check("Grade 8" in pg.locator(".board-context").inner_text(),"Selected Grade 8 missing")
                check("All tested grades" in pg.locator('[data-board-select="division"] option').first.inner_text(),"Scope label imprecise")
                check(pg.locator(".board-grade-row").count()==1,"Grade drilldown should show one row")
                pg.locator(".board-source summary").click()
                check("screenshot" in pg.locator(".board-source").inner_text(),"EARCOS source not documented")
                pg.locator(".board-source summary").click()
                return "Division, grade and season drilldowns remain intact"
            scenario("Grade 8 Reading Spring 2026 detail and sources",grade_detail_and_source,pg)

            def share():
                button=pg.locator('[data-board-share]')
                button.click()
                pg.wait_for_timeout(220)
                feedback=pg.locator('#board-share-feedback').inner_text()
                check("Link copied" in feedback or "Copy this link:" in feedback,"Share feedback missing")
                if "Link copied" in feedback:
                    url=pg.evaluate("navigator.clipboard.readText()")
                    check("view=explore" in url and "window=spring2026" in url and "subject=reading" in url and "grade=8" in url,"Copied URL misses filter state")
                else:
                    url=feedback.split("Copy this link:",1)[-1].strip()
                direct=ctx.new_page()
                try:
                    direct.goto(url,wait_until="domcontentloaded")
                    direct.locator(".board-grade-row").wait_for(timeout=12000)
                    check(direct.locator('[data-board-view="explore"]').get_attribute("aria-current")=="page","Deep link did not restore Explorer")
                    check(direct.locator('[data-board-select="grade"]').input_value()=="8","Deep link did not restore grade")
                    check(direct.locator('[data-board-subject="reading"]').get_attribute("aria-pressed")=="true","Deep link did not restore subject")
                finally:direct.close()
                return "Copy link shares selected Board view; direct URL restores year, subject and grade"
            scenario("Share exact Board year/grade selection",share,pg)

            def overview_deeplink():
                pg.goto(BASE+"/#/board?view=overview&term=spring&focus=reading",wait_until="domcontentloaded")
                pg.locator(".board-overview").wait_for(timeout=15000)
                check(pg.locator('[data-board-focus="reading"]').get_attribute("aria-pressed")=="true","Subject focus not restored")
                check(pg.locator('[data-board-trend="spring"]').get_attribute("aria-pressed")=="true","Spring focus not restored")
                check(pg.locator(".board-trend-series").count()==1,"Shared filtered chart wrong")
                check(pg.locator('[data-board-series="reading"]').count()==1,"Reading line missing")
                return "Share link restores filtered historical chart"
            scenario("Share historical Overview URL",overview_deeplink,pg)

            def back_to_faculty():
                pg.locator('[data-role="faculty"]').click()
                check(pg.locator(".roster").count()==1,"Teacher page changed")
                check(pg.locator(".board-view").count()==0,"Board data leaked into Faculty")
                pg.locator('[data-role="board"]').click()
                check(pg.locator(".board-overview").count()==1,"Board toggle should open Overview afresh")
                return "Other My Learners roles remain unchanged"
            scenario("Board-only changes and role isolation",back_to_faculty,pg)
            check(not errors,"Browser JS errors: "+str(errors))
            ctx.close()

            for width,height in [(360,800),(390,844),(768,1024),(1280,900)]:
                context=browser.new_context(viewport={"width":width,"height":height},locale="en-GB")
                mobile=context.new_page();errs=[]
                mobile.on("pageerror",lambda error:errs.append(str(error)))
                def mobile_tasks():
                    mobile.goto(BASE+"/#/board",wait_until="domcontentloaded")
                    mobile.locator(".board-overview").wait_for(timeout=14000)
                    check(mobile.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),"Page-level horizontal overflow")
                    check(mobile.locator('.board-overview-card').count()==3,"Overview headline cards not visible")
                    check(mobile.locator(".board-trend-svg").count()==1,"Trend absent")
                    check(mobile.locator(".board-nav-tabs button").count()==2,"Board section controls missing")
                    if width<=390:
                        scroll=mobile.locator(".board-trend-scroller")
                        info=scroll.evaluate("e=>({scroll:e.scrollWidth,client:e.clientWidth,left:e.scrollLeft})")
                        check(info["scroll"]>info["client"],"History should scroll horizontally on a phone")
                        check(info["left"]>0,"Mobile should start near most recent years")
                    if width==390:screenshot(mobile,"05-board-overview-mobile-390")
                    mobile.locator('[data-board-view="explore"]').click()
                    check(mobile.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),"Explorer overflow")
                    if width==390:screenshot(mobile,"06-board-explore-mobile-390")
                    mobile.locator('[data-board-view="overview"]').click()
                    check(mobile.locator(".board-overview").count()==1,"Return to Overview failed")
                    check(not errs,"JS errors: "+str(errs))
                    return str(width)+"px mobile/tablet/desktop: chart, navigation and detail without page overflow"
                scenario("Responsive Board experience "+str(width)+"px",mobile_tasks,mobile)
                context.close()
        finally:browser.close()
    passed=sum(x["passed"] for x in checks)
    (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(checks),"checks":checks},indent=2))
    print("SUMMARY",passed,"/",len(checks),flush=True)
    return 0 if passed==len(checks) else 1

if __name__=="__main__":raise SystemExit(main())

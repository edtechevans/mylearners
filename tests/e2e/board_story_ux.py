"""Board learning-story QA: four clickable outcomes, one switchable chart, no file labels."""
import os,re,json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-story");OUT.mkdir(parents=True,exist_ok=True)
results=[]
BAD=re.compile(r'\.xlsx|\.csv|\.pdf|Dashboard SY\d|KPIs!|Source:|workbook',re.I)

def require(cond,msg):
    if not cond:raise AssertionError(msg)
def screenshot(page,name):
    page.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def check(label,fn,page=None):
    try:
        info=fn()
        results.append({"label":label,"passed":True,"detail":info})
        print("PASS |",label,"|",info,flush=True)
    except Exception as e:
        results.append({"label":label,"passed":False,"error":str(e)})
        print("FAIL |",label,"|",str(e),flush=True)
        if page:
            try:screenshot(page,"ERROR-"+re.sub('[^a-z0-9]+','-',label.lower())[:44])
            except Exception:pass
def no_restricted_text(page):
    body=page.locator("main").inner_text()
    require(not BAD.search(body),"Underlying document name or file reference appears on Board")

def main():
  with sync_playwright() as pw:
    browser=pw.chromium.launch(
        executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
        headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    try:
      context=browser.new_context(viewport={"width":1440,"height":900},
          permissions=["clipboard-read","clipboard-write"])
      page=context.new_page();errors=[]
      page.on("pageerror",lambda err:errors.append(str(err)))
      page.goto(BASE+"/#/board",wait_until="domcontentloaded")
      page.locator(".board-strength-card").first.wait_for(timeout=18000)

      def landing():
          require(page.locator(".board-strength-card").count()==4,"Four strengths cards expected")
          require(page.locator(".board-overview").count()==1,"Overview should be default")
          require(page.locator(".board-trend-svg").count()==1,"MAP chart default")
          require(page.locator(".board-dp-svg").count()==0,"No duplicate DP chart")
          require(page.locator('.board-strength-card[data-board-go]').count()==2,"Two MAP indicators")
          require(page.locator('.board-strength-card[data-board-dp-go]').count()==2,"Two DP indicators")
          text=page.locator(".board-strength-grid").inner_text()
          for expected in ("24 / 24","95%","34","/45","93%"):
              require(expected in text,"Missing headline outcome "+expected)
          require("confirmation pending" in text.lower(),"DP outcomes should be qualified")
          require(page.locator('[data-board-overview-chart]').count()==2,"One two-option historical selector")
          require(page.locator(".board-overview-insight").count()==0,"No duplicate long-form KPI report")
          no_restricted_text(page)
          screenshot(page,"01-four-strengths-overview-desktop")
          return "Four strengths and one MAP trend, with dated DP qualifications"

      check("Overview visual hierarchy and no document references",landing,page)

      def map_details():
          page.locator('.board-strength-card[data-board-go="fall2026:math"]').click()
          require(page.locator('[data-board-view="explore"]').get_attribute("aria-current")=="page",
                  "MAP card did not open detailed Board view")
          require("Fall 2026" in page.locator(".board-context").inner_text(),"Wrong assessment period")
          require("8 / 8" in page.locator(".board-indicator").first.inner_text(),"US benchmark grade count")
          page.locator(".board-source summary").click()
          no_restricted_text(page)
          require("school-achievement norms" in page.locator(".board-source").inner_text(),
                  "Methodology not explained")
          page.locator(".board-source summary").click()
          page.locator('.board-nav-tabs [data-board-view="overview"]').click()
          return "MAP achievement card opens Fall 2026 grade-level detail"

      check("MAP achievement card and definitions",map_details,page)

      def map_growth_card():
          page.locator('.board-strength-card[data-board-go="fall2026:reading"]').click()
          require("Reading" in page.locator(".board-context").inner_text(),"Wrong MAP subject")
          require("95%" in page.locator(".board-schoolwide-fact").inner_text(),
                  "Schoolwide 95% growth detail missing")
          page.locator('.board-nav-tabs [data-board-view="overview"]').click()
          return "Growth card opens MAP detail without falsely attributing growth to Reading alone"

      check("MAP growth card preserves schoolwide scope",map_growth_card,page)

      def dp_cards():
          page.locator('.board-strength-card[data-board-dp-go="average"]').click()
          require(page.locator(".board-dp").count()==1,"Diploma detailed view missing")
          require(page.locator('[data-board-dp-metric="average"]').get_attribute("aria-pressed")=="true",
                  "Average point chart not selected")
          require("34.0" in page.locator(".board-dp-tile").first.inner_text(),"DP point metric incorrect")
          page.locator('.board-nav-tabs [data-board-view="overview"]').click()
          page.locator('.board-strength-card[data-board-dp-go="passRate"]').click()
          require(page.locator('[data-board-dp-metric="passRate"]').get_attribute("aria-pressed")=="true",
                  "Pass rate card did not choose pass rate")
          require("93%" in page.locator(".board-dp-tile").nth(1).inner_text(),"DP pass rate incorrect")
          page.locator(".board-dp-table summary").click()
          no_restricted_text(page)
          require("Verification" in page.locator(".board-dp-table").inner_text(),
                  "Diploma verification status missing")
          page.locator(".board-dp-table summary").click()
          page.locator(".board-dp-method summary").click()
          no_restricted_text(page)
          require("candidate" in page.locator(".board-dp-method").inner_text().lower(),
                  "DP examination denominator caveat missing")
          page.locator(".board-dp-method summary").click()
          page.locator('.board-nav-tabs [data-board-view="overview"]').click()
          return "Both Diploma cards open correct measure and exclude document names"

      check("Diploma cards, table and methodological cautions",dp_cards,page)

      def switch():
          page.locator('[data-board-overview-chart="dp"]').click()
          require(page.locator(".board-dp-overview-trend").count()==1,"DP overview trend missing")
          require(page.locator(".board-dp-svg").count()==1,"Diploma trend not displayed")
          require(page.locator(".board-trend-svg").count()==0,"MAP chart should not render simultaneously")
          require(page.locator(".board-strength-card").count()==4,"Headline strengths disappeared")
          screenshot(page,"02-diploma-historical-overview-desktop")
          page.locator('[data-board-dp-metric="passRate"]').click()
          require(page.locator('[data-board-dp-point="passRate:2026"]').count()==1,
                  "Latest Diploma pass rate point missing")
          require(page.locator('[data-board-dp-point="passRate:2020"]').count()==0,
                  "Missing pass rate must not be interpolated")
          point=page.locator('[data-board-dp-point="passRate:2026"]')
          point.hover()
          require(page.locator(".board-floating-tooltip").is_visible(),"DP hover card missing")
          require("93%" in page.locator(".board-floating-tooltip").inner_text(),"DP hover card incorrect")
          screenshot(page,"03-diploma-hover-outcome")
          no_restricted_text(page)
          return "Overview switches to one DP chart and hover details show verified definitions"

      check("Single chart toggle with interactive Diploma timeline",switch,page)

      def share():
          page.locator('[data-board-share]').click()
          page.wait_for_timeout(180)
          feedback=page.locator("#board-share-feedback").inner_text()
          require("Link copied" in feedback or "Copy this link" in feedback,
                  "Sharing feedback missing")
          url=page.evaluate("navigator.clipboard.readText()") if "Link copied" in feedback else feedback.split("Copy this link:",1)[-1].strip()
          require("view=overview" in url and "chart=dp" in url and "metric=passRate" in url,
                  "Share link must preserve DP historical chart")
          second=context.new_page()
          try:
              second.goto(url,wait_until="domcontentloaded")
              second.locator(".board-dp-overview-trend").wait_for(timeout=13000)
              require(second.locator('[data-board-overview-chart="dp"]').get_attribute("aria-pressed")=="true",
                      "DP chart selection not restored")
              require(second.locator('[data-board-dp-metric="passRate"]').get_attribute("aria-pressed")=="true",
                      "DP rate selection not restored")
          finally:second.close()
          return "Shareable link preserves DP chart and pass-rate selection"

      check("Shareable Overview with Diploma visualization",share,page)

      def map_revisit():
          page.locator('[data-board-overview-chart="map"]').click()
          require(page.locator(".board-trend-svg").count()==1,"MAP history did not return")
          require(page.locator(".board-dp-svg").count()==0,"DP chart still shown")
          point=page.locator('[data-board-point="fall:2025:math"]')
          point.hover()
          tile=page.locator(".board-floating-tooltip")
          require(tile.is_visible(),"MAP hover tile missing")
          require("-1.0 RIT" in tile.inner_text(),"Grade 8 negative comparison missing")
          require("G8" in tile.inner_text(),"Grade chips missing")
          screenshot(page,"04-map-historical-hover")
          return "MAP history returns with existing signed RIT grade-level tooltip"

      check("Return to MAP historical grade hover",map_revisit,page)

      def isolation():
          page.locator('[data-role="faculty"]').click()
          require(page.locator(".roster").count()==1,"Faculty view regression")
          page.locator('[data-role="student"]').click()
          require(page.locator(".profile-head").count()==1,"Student profile regression")
          page.locator('[data-role="leader"]').click()
          require(page.locator(".leader-kpis").count()==1,"Leader page regression")
          return "Faculty, Student and Leader unchanged"
      check("Role isolation",isolation,page)
      require(not errors,"JavaScript errors: "+str(errors))
      context.close()

      for w,h in [(360,800),(390,844),(768,1024),(1280,900)]:
          ctx=browser.new_context(viewport={"width":w,"height":h},has_touch=w<600,is_mobile=w<600)
          pg=ctx.new_page();js=[]
          pg.on("pageerror",lambda err:js.append(str(err)))
          def responsive():
              pg.goto(BASE+"/#/board",wait_until="domcontentloaded")
              pg.locator(".board-strength-grid").wait_for(timeout=15000)
              require(pg.locator(".board-strength-card").count()==4,"Four headline cards required at "+str(w))
              require(pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
                      "Horizontal page overflow at "+str(w))
              if w==390:screenshot(pg,"05-overview-mobile")
              pg.locator('[data-board-overview-chart="dp"]').click()
              require(pg.locator(".board-dp-svg").count()==1,"DP historical missing")
              require(pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
                      "DP historical panel overflows page")
              if w<600:
                  require(pg.locator(".board-dp-chart-scroll").evaluate("e=>e.scrollLeft")>0,
                      "Mobile Diploma should start with the latest years")
              if w==390:screenshot(pg,"06-diploma-trend-mobile")
              pg.locator('[data-board-dp-metric="passRate"]').click()
              if w<600:
                  pg.locator('[data-board-dp-point="passRate:2026"]').click(force=True)
                  require("93%" in pg.locator(".board-dp-inspector").inner_text(),
                          "Touch Diploma point does not update inline details")
              pg.locator('[data-board-overview-chart="map"]').click()
              require(pg.locator(".board-trend-svg").count()==1,"MAP historical missing after switch")
              no_restricted_text(pg)
              require(not js,"Mobile JS errors "+str(js))
              return str(w)+"px: all cards, one chart and navigation without overflow"
          check("Responsive Board "+str(w)+"px",responsive,pg)
          ctx.close()
    finally:
      browser.close()
  count=sum(item["passed"] for item in results)
  (OUT/"summary.json").write_text(json.dumps({"passed":count,"total":len(results),"scenarios":results},indent=2))
  print("SUMMARY",count,"/",len(results),flush=True)
  return 0 if count==len(results) else 1

if __name__=="__main__":raise SystemExit(main())

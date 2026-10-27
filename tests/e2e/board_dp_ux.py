"""End-to-end Board MAP + IB Diploma Chrome user journey QA. Public aggregates only."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-dp");OUT.mkdir(exist_ok=True)
results=[]
def require(b,msg):
 if not b:raise AssertionError(msg)
def screenshot(pg,name):
 pg.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def check(name,fn,pg=None):
 try:
  detail=fn();results.append({"name":name,"pass":True,"details":detail})
  print("PASS |",name,"|",detail,flush=True)
 except Exception as exc:
  results.append({"name":name,"pass":False,"error":str(exc)})
  print("FAIL |",name,"|",str(exc),flush=True)
  if pg:
   try:screenshot(pg,"FAIL-"+re.sub('[^a-z0-9]','-',name.lower())[:35])
   except Exception:pass

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),headless=True,
      args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   ctx=browser.new_context(viewport={"width":1440,"height":900},permissions=["clipboard-read","clipboard-write"])
   pg=ctx.new_page();errors=[]
   pg.on("pageerror",lambda e:errors.append(str(e)))
   pg.goto(BASE+"/#/board",wait_until="domcontentloaded")
   pg.locator(".board-view").wait_for(timeout=14000)
   def overview():
    require(pg.locator(".board-nav-tabs button").count()==3,"Expected Overview/MAP by Year/IB Diploma tabs")
    require(pg.locator(".board-overview").count()==1,"Overview not default")
    require(pg.locator(".board-overview-card").count()==3,"Three MAP headline areas")
    require(pg.locator(".board-overview-dp").count()==0,"No invented secondary Board dashboard")
    require(pg.locator(".board-dp-preview").count()==1,"Diploma discovery link missing")
    require(pg.locator(".board-trend-series").count()==3,"Math/Reading/Language Usage trend")
    screenshot(pg,"01-board-overview")
    return "Compact MAP summary with a distinct IB Diploma path"
   check("Overview navigation and information hierarchy",overview,pg)
   def gap_tiles():
    target=pg.locator('[data-board-point="fall:2025:math"]')
    target.hover()
    tile=pg.locator(".board-floating-tooltip")
    require(tile.is_visible(),"Hover tile should be visible next to mouse")
    require("-1.0 RIT" in tile.inner_text(),"Exact signed Grade 8 gap absent")
    require("G8" in tile.inner_text(),"Selected grades missing")
    require(tile.locator(".board-trend-grade").count()==8,"All eight grades visible")
    bbox=tile.bounding_box();require(bbox["x"]>=0 and bbox["x"]+bbox["width"]<=1440,"Tile beyond viewport")
    screenshot(pg,"02-map-hover-tile")
    return "Floating mouse tile shows all eight signed RIT gaps and stays in viewport"
   check("Interactive MAP grade RIT floating tile",gap_tiles,pg)
   def overlap():
    a=pg.locator('[data-board-point="fall:2016:reading"]')
    b=pg.locator('[data-board-point="fall:2016:language"]')
    pa=a.bounding_box();pb=b.bounding_box()
    require(pa is not None and pb is not None,"Historical subject markers unavailable")
    require(abs((pa["x"]+pa["width"]/2)-(pb["x"]+pb["width"]/2))>=15,
       "Same-year same-value points still overlap")
    a.hover();require("Reading · Fall 2016" in pg.locator(".board-floating-tooltip").inner_text(),
      "Reading marker not individually selectable")
    b.hover();require("Language Usage · Fall 2016" in pg.locator(".board-floating-tooltip").inner_text(),
      "Language marker not individually selectable")
    return "Reading and Language Usage remain independently hoverable at shared values"
   check("Coincident MAP series interaction",overlap,pg)
   def norm():
    pg.locator('.board-nav-tabs [data-board-view="explore"]').click()
    pg.locator('[data-board-select="year"]').select_option("2025")
    pg.locator('[data-board-window="fall2025"]').click()
    pg.locator('[data-board-subject="math"]').click()
    require("2025" in pg.locator(".board-benchmark-note").inner_text(),"2025 school reference not disclosed")
    pg.locator('[data-board-select="division"]').select_option("secondary")
    pg.locator('[data-board-select="grade"]').select_option("8")
    pg.locator(".board-figures summary").click()
    row=pg.locator(".board-table tbody tr").first.inner_text()
    require("245.5" in row and "220.0" in row and "25.5" in row,"Fall 2025 Grade 8 school norm not rebased")
    pg.locator(".board-figures summary").click()
    pg.locator('[data-board-window="spring2026"]').click()
    pg.locator(".board-figures summary").click()
    row=pg.locator(".board-table tbody tr").first.inner_text()
    require("252.7" in row and "227.0" in row and "25.7" in row,"Spring 2026 Grade 8 school norm not rebased")
    pg.locator(".board-figures summary").click()
    return "NWEA 2025 school norm Grade 8 math Fall 220 and Spring 227"
   check("Consistent school norm references 2025–26",norm,pg)
   def historical_caveat():
    pg.locator('[data-board-select="year"]').select_option("2024")
    require("not independently verified" in pg.locator(".board-benchmark-note").inner_text(),
      "Historical unknown U.S. benchmark edition not disclosed")
    pg.locator(".board-source summary").click()
    require("norm type" in pg.locator(".board-source").inner_text(),
      "Historical source caveat missing")
    pg.locator(".board-source summary").click()
    return "Older archive clearly distinguishes unverified norm type"
   check("Historical U.S. norms provenance",historical_caveat,pg)
   def diploma():
    pg.locator('.board-nav-tabs [data-board-view="dp"]').click()
    require(pg.locator(".board-dp").count()==1,"IB Diploma tab missing")
    require(pg.locator(".board-dp-tile").count()==3,"Expected score, pass and pathway distinctions")
    require("34.0" in pg.locator(".board-dp-tile").nth(0).inner_text(),"Latest DP average")
    require("93%" in pg.locator(".board-dp-tile").nth(1).inner_text(),"Latest DP pass")
    require("56" in pg.locator(".board-dp-tile").nth(2).inner_text(),"Latest Grade 12 pathway")
    require("verify" in pg.locator(".board-dp-alert").inner_text().lower(),"Verify-results caveat missing")
    require(pg.locator(".board-dp-point").count()==7,"Seven years of average DP scores")
    screenshot(pg,"03-diploma-score")
    return "DP 34.0/45, 93% reported, G12 pathway 56 with separate definitions"
   check("DP dashboard academic outcomes",diploma,pg)
   def dp_hover():
    point=pg.locator('[data-board-dp-point="average:2026"]')
    point.hover()
    tooltip=pg.locator(".board-floating-tooltip")
    require(tooltip.is_visible(),"DP floating tooltip missing")
    require("2025–26" in tooltip.inner_text() and "34.0" in tooltip.inner_text(),
      "DP hovered year/value wrong")
    require("Dashboard SY2526" in tooltip.inner_text(),"Source cell citation missing")
    screenshot(pg,"04-diploma-hover-tile")
    return "Diploma score hover opens year/value/source tile"
   check("IB Diploma hover card",dp_hover,pg)
   def dp_rate():
    pg.locator('[data-board-dp-metric="passRate"]').click()
    require(pg.locator(".board-dp-point").count()==6,"2020 pass rate missing: shouldn't invent 2019–20")
    pg.locator('[data-board-dp-point="passRate:2021"]').focus()
    require("95%" in pg.locator(".board-dp-inspector").inner_text(),"Keyboard DP pass rate 2021")
    pg.locator('[data-board-dp-point="passRate:2026"]').hover()
    require("93%" in pg.locator(".board-floating-tooltip").inner_text(),"Latest DP rate tile")
    pg.locator(".board-dp-pathways summary").click()
    require(pg.locator(".board-dp-pathways tbody tr").count()==3,"Three Grade 12 pathway years")
    pg.locator(".board-dp-pathways summary").click()
    pg.locator(".board-dp-method summary").click()
    require("117" in pg.locator(".board-dp-method").inner_text(),"Inconsistent cohort denominator caveat")
    pg.locator(".board-dp-method summary").click()
    return "Six reported pass-rate years, three pathway cohorts, no calculated candidate count"
   check("DP pass rates and pathway integrity",dp_rate,pg)
   def share():
    pg.locator('[data-board-share]').click()
    pg.wait_for_timeout(180)
    msg=pg.locator("#board-share-feedback").inner_text()
    require("Link copied" in msg or "Copy this link" in msg,"Copy link feedback")
    url=pg.evaluate("navigator.clipboard.readText()") if "Link copied" in msg else msg.split("Copy this link:",1)[-1].strip()
    require("view=dp" in url and "metric=passRate" in url,"DP share route missing")
    child=ctx.new_page()
    try:
     child.goto(url,wait_until="domcontentloaded")
     child.locator(".board-dp").wait_for(timeout=12000)
     require(child.locator('[data-board-dp-metric="passRate"]').get_attribute("aria-pressed")=="true",
       "DP share link failed to restore pass-rate selection")
    finally:child.close()
    return "Deep link to specific Diploma metric restores correct Board tab"
   check("Shareable IB Diploma outcome chart",share,pg)
   def other_roles():
    pg.locator('[data-role="faculty"]').click();require(pg.locator(".roster").count()==1,"Faculty modified")
    pg.locator('[data-role="student"]').click();require(pg.locator(".profile-head").count()==1,"Student modified")
    pg.locator('[data-role="leader"]').click();require(pg.locator(".leader-kpis").count()==1,"Leader modified")
    return "Faculty, Student, Leader experiences remain intact"
   check("No regressions in existing three roles",other_roles,pg)
   require(not errors,"JS errors: "+str(errors))
   ctx.close()
   for width,height in [(360,800),(390,844),(768,1024),(1280,900)]:
    c=browser.new_context(viewport={"width":width,"height":height},has_touch=width<600,is_mobile=width<600)
    p2=c.new_page();err=[]
    p2.on("pageerror",lambda e:err.append(str(e)))
    def responsive():
     p2.goto(BASE+"/#/board",wait_until="domcontentloaded")
     p2.locator(".board-view").wait_for(timeout=14000)
     require(p2.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
       "Overview causes page horizontal overflow")
     require(p2.locator('.board-nav-tabs button').count()==3,"Board tabs inaccessible")
     if width==390:
      screenshot(p2,"05-board-overview-mobile")
      p2.locator('[data-board-point="fall:2025:math"]').click(force=True)
      require("G8" in p2.locator(".board-trend-inspector").inner_text(),
        "Mobile chart tap doesn't show grade inspector")
     p2.locator('.board-nav-tabs [data-board-view="dp"]').click()
     require(p2.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
       "DP page horizontal overflow")
     require(p2.locator(".board-dp-point").count()==7,"DP markers missing")
     if width==390:screenshot(p2,"06-dp-mobile")
     p2.locator('[data-board-dp-metric="passRate"]').click()
     require(p2.locator(".board-dp-point").count()==6,"DP pass rate markers mobile")
     if width==390:
      p2.locator('[data-board-dp-point="passRate:2026"]').click(force=True)
      require("93%" in p2.locator(".board-dp-inspector").inner_text(),
        "Mobile DP tap not reflected in inspector")
      screenshot(p2,"07-dp-mobile-interaction")
     require(not err,"JS errors "+str(err))
     return str(width)+"px Board, tooltip/tap and DP trend without page overflow"
    check("Responsive Board "+str(width)+"px",responsive,p2)
    c.close()
  finally:browser.close()
 total=sum(x["pass"] for x in results)
 (OUT/"summary.json").write_text(json.dumps({"passed":total,"total":len(results),"checks":results},indent=2))
 print("SUMMARY",total,"/",len(results),flush=True)
 return 0 if total==len(results) else 1

if __name__=="__main__":raise SystemExit(main())

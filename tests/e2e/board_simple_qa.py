"""Chrome-first Board simplicity audit. Live-code UI, no mock image substitutes."""
import os,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-simple");OUT.mkdir(parents=True,exist_ok=True)
scenarios=[]
def need(ok,msg):
 if not ok:raise AssertionError(msg)
def snap(page,name):
 page.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def run(name,fn,page=None):
 try:
  detail=fn();scenarios.append({"name":name,"passed":True,"detail":str(detail)})
  print("PASS | "+name+" | "+str(detail),flush=True)
 except Exception as ex:
  scenarios.append({"name":name,"passed":False,"error":str(ex)})
  print("FAIL | "+name+" | "+str(ex),flush=True)
  if page:
   try:snap(page,"FAIL-"+re.sub('[^a-z0-9]+','-',name.lower())[:48])
   except Exception:pass
def no_file_names(page):
 text=page.locator(".board-view").inner_text()
 need(not re.search(r'\.xlsx|\.csv|\.pdf|KPIs!|Dashboard SY\d|Source:|workbook',text,re.I),
      "Board-facing document names should remain absent")

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),headless=True,
                             args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   context=browser.new_context(viewport={"width":1440,"height":900},permissions=["clipboard-read","clipboard-write"])
   page=context.new_page();errors=[]
   page.on("pageerror",lambda e:errors.append(str(e)))
   page.goto(BASE+"/#/board",wait_until="domcontentloaded")
   page.locator(".board-strength-grid").wait_for(timeout=17000)
   def overview():
    need(page.locator(".board-nav-tabs button").all_text_contents()==["Overview","MAP","IB Diploma"],"3 simple tabs")
    need(page.locator(".board-strength-card").count()==4,"4 schoolwide headlines")
    need(page.locator(".board-trend-svg").count()==1,"one MAP history only")
    need(page.locator(".board-dp-svg").count()==0,"no simultaneous DP history")
    chart=page.locator(".board-historical-chart").inner_text()
    need("2021" in chart and "2025" in chart,"recent five years")
    need("2014" not in chart,"long history should not be default")
    need(page.locator('[data-board-trend-range="recent"]').get_attribute("aria-pressed")=="true","recent selected")
    need(page.locator('[data-board-trend-range="all"]').count()==1,"full history available")
    need(page.locator('[data-board-go="fall2026:growth"]').count()==1,"growth has its own explanation")
    no_file_names(page)
    snap(page,"01-overview-chrome-1440")
    return "4 outcome headlines, 5 recent years, all history optional"
   run("Overview: meaningful, uncluttered first screen",overview,page)
   def trend():
    page.locator('[data-board-trend-range="all"]').click()
    need("2014" in page.locator(".board-historical-chart").inner_text(),"full range appears")
    page.locator('[data-board-trend-range="recent"]').click()
    need("2014" not in page.locator(".board-historical-chart").inner_text(),"short range restored")
    page.locator('[data-board-point="fall:2025:math"]').hover()
    tile=page.locator(".board-floating-tooltip")
    need(tile.is_visible(),"hover card available")
    need("G8" in tile.inner_text() and "-1.0 RIT" in tile.inner_text(),"signed grade details")
    return "last 5/all history toggles and historic RIT hover remain accessible"
   run("Historical years and point inspection",trend,page)
   def presentation():
    need(page.locator(".roles").is_visible(),"role switch visible in regular mode")
    page.locator("[data-board-presentation]").click()
    need(page.locator(".roles").is_hidden(),"role switch hidden during Board presentation")
    need(page.locator("[data-board-presentation]").inner_text()=="Exit presentation","obvious exit")
    need("present=1" in page.url,"presentation state deep-linkable")
    snap(page,"02-presentation-chrome-1440")
    page.locator("[data-board-presentation]").click()
    need(page.locator(".roles").is_visible(),"role switch restored")
    need("present=1" not in page.url,"presentation route removed")
    return "Chrome presentation removes global role switch and exits cleanly"
   run("Chrome presentation mode",presentation,page)
   def map_start():
    page.locator('.board-nav-tabs [data-board-view="explore"]').click()
    need(page.locator(".board-simple-controls").count()==1,"compact MAP controls")
    need(page.locator('[data-board-subject]').count()==0,"no duplicate subject selector")
    need(page.locator(".board-comparison-subject").count()==3,"three coloured subject cards")
    need(page.locator(".board-comparison-window").count()==1,"one season by default")
    need(page.locator(".board-grade-plot").count()==0,"grade chart hidden until selected")
    need(page.locator(".board-stats").count()==0,"repeated KPI row removed")
    need(page.locator(".board-choose-prompt").count()==1,"clear call to action")
    need(page.locator('[data-board-select="grade"]').count()==0,"grade is secondary, not top-level filter")
    need("MAP pts" in page.locator(".board-comparison-math").inner_text(),"plain-language points")
    need(page.locator(".board-comparison-mini.unavailable").count()==3,"missing EARCOS not zero")
    no_file_names(page)
    snap(page,"03-map-one-season-chrome-1440")
    return "3 subject cards, no duplicated measures or visible grade chart"
   run("MAP: three-card introduction",map_start,page)
   def drill():
    page.locator('[data-board-tile-subject="reading"]').click()
    need(page.locator(".board-map-drilldown").count()==1,"drilldown opened")
    need(page.locator(".board-grade-row").count()==8,"eight grade rows")
    need(page.locator('[data-board-select="grade"]').count()==1,"grade filter now contextual")
    need(page.locator(".board-comparison-reading").get_attribute("aria-pressed")=="true","reading selected")
    page.locator('[data-board-select="grade"]').select_option("8")
    need(page.locator(".board-grade-row").count()==1,"one selected grade")
    snap(page,"04-map-reading-grade-8")
    page.locator("[data-board-close-details]").click()
    need(page.locator(".board-grade-row").count()==0,"detail truly hidden")
    return "select tile → contextual grade detail → close"
   run("MAP progressive disclosure and grade filter",drill,page)
   def compare():
    page.locator('[data-board-select="year"]').select_option("2025")
    need(page.locator(".board-comparison-window").count()==1,"Fall/Spring not forced")
    page.locator("[data-board-compare-seasons]").click()
    need(page.locator(".board-comparison-window").count()==2,"both seasons on demand")
    need(page.locator(".board-comparison-subject").count()==6,"3 subjects in 2 periods")
    page.locator('[data-board-tile-window="spring2026"][data-board-tile-subject="language"]').click()
    need(page.locator(".board-map-drilldown").count()==1,"Spring Language opened")
    need("Spring 2026" in page.locator(".board-map-drilldown-heading").inner_text(),"season updated")
    need("Language Usage" in page.locator(".board-map-drilldown-heading").inner_text(),"subject updated")
    snap(page,"05-map-optional-fall-spring-comparison")
    page.locator("[data-board-close-details]").click()
    page.locator("[data-board-compare-seasons]").click()
    need(page.locator(".board-comparison-window").count()==1,"comparison reversible")
    return "Fall vs Spring side-by-side only on request"
   run("Optional season comparison",compare,page)
   def growth():
    page.locator('.board-nav-tabs [data-board-view="overview"]').click()
    page.locator('[data-board-go="fall2026:growth"]').click()
    need(page.locator(".board-growth-explainer").count()==1,"growth explanation displayed")
    need("one or more" in page.locator(".board-growth-explainer").inner_text(),"95 percent properly scoped")
    need("not the percentage reaching projected growth" in page.locator(".board-growth-explainer").inner_text(),
         "growth and projected growth distinguished")
    need(page.locator(".board-grade-plot").count()==0,"not silently a subject achievement chart")
    return "Growth headline opens accurate schoolwide explanation"
   run("Growth measure not confused with achievement",growth,page)
   def diploma():
    page.locator('.board-nav-tabs [data-board-view="dp"]').click()
    need(page.locator('[data-board-dp-select="year"]').count()==1,"one year picker")
    need(page.locator('[data-board-dp-select="range"]').count()==0,"redundant range removed")
    need(page.locator(".board-dp-graphic-card").count()==3,"three Diploma headlines")
    need("34.0" in page.locator(".board-dp-graphic-average").inner_text(),"reported average")
    need("93%" in page.locator(".board-dp-graphic-pass").inner_text(),"reported pass rate")
    need("7 / 7" in page.locator(".board-dp-graphic-consistency").inner_text(),"historical consistency")
    need(page.locator(".board-dp-graphic-pathways").count()==0,"pathway not mixed with exam outcomes")
    need(page.locator(".board-dp-pathways").count()==1,"pathways still optional")
    need(page.locator(".board-dp-point").count()==7,"7-year chart is full")
    snap(page,"06-diploma-simple-chrome-1440")
    return "year above outcome cards; chart metrics inside chart; pathways separate"
   run("Diploma meaningful controls",diploma,page)
   def diploma_year():
    page.locator('[data-board-dp-select="year"]').select_option("2024")
    need("92%" in page.locator(".board-dp-graphic-pass").inner_text(),"year filter pass")
    need("34.0" in page.locator(".board-dp-graphic-average").inner_text(),"year filter avg")
    need("7 / 7" in page.locator(".board-dp-graphic-consistency").inner_text(),"full history consistency")
    page.locator('[data-board-dp-metric="passRate"]').click()
    need(page.locator(".board-dp-point").count()==6,"no invented 2019–20 pass rate")
    point=page.locator('[data-board-dp-point="passRate:2025"]')
    point.hover()
    need(page.locator(".board-floating-tooltip").is_visible(),"Diploma hover tile visible")
    point.click()
    need(page.locator('[data-board-dp-select="year"]').input_value()=="2025","chart point selects year")
    need("93%" in page.locator(".board-dp-graphic-pass").inner_text(),"updated cards")
    page.locator(".board-dp-pathways summary").click()
    need(page.locator(".board-dp-pathways tbody tr").count()==3,"historic pathways retain detail")
    page.locator(".board-dp-pathways summary").click()
    no_file_names(page)
    return "year selector and chart metric work independently; year points clickable"
   run("Diploma year, chart and pathways",diploma_year,page)
   def share():
    page.locator("[data-board-share]").click()
    page.wait_for_timeout(250)
    msg=page.locator("#board-share-feedback").inner_text()
    need("Link copied" in msg or "Copy this link" in msg,"copy feedback")
    url=page.evaluate("navigator.clipboard.readText()") if "Link copied" in msg else msg.split("Copy this link:",1)[-1].strip()
    need("view=dp" in url and "year=2025" in url and "metric=passRate" in url,"correct Diploma deep link")
    tab=context.new_page()
    try:
     tab.goto(url,wait_until="domcontentloaded")
     tab.locator(".board-dp-graphic-grid").wait_for(timeout=14000)
     need(tab.locator('[data-board-dp-select="year"]').input_value()=="2025","year restored")
    finally:tab.close()
    return "Share link restores selected Diploma year and measure"
   run("Shareable Board filters",share,page)
   def roles():
    for id,selector in [("faculty",".roster"),("student",".profile-head"),("leader",".leader-kpis")]:
     page.locator(f'[data-role="{id}"]').click()
     need(page.locator(selector).count()==1,id+" experience regression")
    return "three other My Learners views still work"
   run("Other-role isolation",roles,page)
   need(not errors,"JavaScript exceptions: "+str(errors))
   context.close()

   for w,h in [(1280,900),(1024,768),(390,844)]:
    ctx=browser.new_context(viewport={"width":w,"height":h},has_touch=w<600,is_mobile=w<600)
    pg=ctx.new_page();js=[]
    pg.on("pageerror",lambda e:js.append(str(e)))
    def width_check():
     pg.goto(BASE+"/#/board?view=explore&window=spring2026&division=all",wait_until="domcontentloaded")
     pg.locator(".board-comparison-display").wait_for(timeout=15000)
     need(pg.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),"MAP body overflow")
     need(pg.locator(".board-comparison-subject").count()==3,"MAP three-card layout")
     pg.locator('.board-nav-tabs [data-board-view="dp"]').click()
     need(pg.locator(".board-dp-graphic-grid").count()==1,"DP not rendered")
     need(pg.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),"Diploma body overflow")
     if w==1280:snap(pg,"07-diploma-chrome-1280")
     if w==390:snap(pg,"08-diploma-mobile-smoke")
     need(not js,"Browser JS exceptions at "+str(w)+": "+str(js))
     return f"{w}px: core Board layouts fit and remain interactive"
    run("Board layout "+str(w)+"px",width_check,pg)
    ctx.close()
  finally:
   browser.close()
 total=sum(x["passed"] for x in scenarios)
 (OUT/"summary.json").write_text(json.dumps({"passed":total,"total":len(scenarios),"scenarios":scenarios},indent=2))
 print("SUMMARY",total,"/",len(scenarios),flush=True)
 return 0 if total==len(scenarios) else 1
if __name__=="__main__":raise SystemExit(main())

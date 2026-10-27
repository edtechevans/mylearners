"""AISG Board Chrome-first future-design audit.

Checks the real DOM, data-driven MAP comparisons, MAP drawer keyboard behavior,
visible story annotations, IB Diploma hover/pinned details and role separation.
"""
import json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-board-future");OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def ensure(ok,msg):
 if not ok:raise AssertionError(msg)
def screenshot(page,name):
 page.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def scenario(name,fn,page=None):
 try:
  result=fn()
  print("PASS | "+name+" | "+str(result),flush=True)
  checks.append({"name":name,"pass":True,"details":str(result)})
 except Exception as e:
  print("FAIL | "+name+" | "+str(e),flush=True)
  checks.append({"name":name,"pass":False,"error":str(e)})
  if page:
   try:screenshot(page,"FAILED-"+re.sub("[^a-z0-9]+","-",name.lower())[:45])
   except Exception:pass
def no_filenames(page):
 board=page.locator(".board-view").inner_text()
 ensure(not re.search(r'\.xlsx|\.csv|\.pdf|KPIs!|Dashboard SY\d|Source:|workbook',board,re.I),
        "Visible Board details must omit document names and paths")

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,
    executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
    args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   ctx=browser.new_context(viewport={"width":1440,"height":900},
     permissions=["clipboard-read","clipboard-write"],locale="en-GB")
   pg=ctx.new_page();errors=[]
   pg.on("pageerror",lambda e:errors.append(str(e)))
   pg.goto(BASE+"/#/board",wait_until="domcontentloaded")
   pg.locator(".board-strength-card").first.wait_for(timeout=16000)
   def overview():
    ensure(pg.locator(".board-heading h1").inner_text()=="Learning at AISG","Executive heading")
    ensure(pg.locator(".board-strength-card").count()==4,"Four strengths")
    ensure("From Grade 3 to graduation" in pg.locator(".board-overview-intro").inner_text(),
           "Distinct section heading")
    ensure(pg.locator(".board-historical-chart").count()==1,"One history only")
    ensure(pg.locator(".board-story-insight").count()==1,"Evidence-based chart takeaway")
    ensure("fall 2025" in pg.locator(".board-story-insight").text_content().lower(),"Right EARCOS window")
    ensure("mathematics 7/8" in pg.locator(".board-story-insight").text_content().lower(),"Dynamic exact grades")
    ensure(pg.locator(".board-trend-series").count()==3,"All three subjects")
    ensure(pg.locator('[data-board-trend-range="recent"]').get_attribute("aria-pressed")=="true",
           "Five-year view default")
    no_filenames(pg)
    screenshot(pg,"01-overview-future-desktop")
    return "Distinct executive heading, four strengths, dynamic history summary"
   scenario("Executive Overview design and source restraint",overview,pg)

   def pins():
    point=pg.locator('[data-board-point="fall:2025:math"]')
    point.hover()
    ensure(pg.locator(".board-floating-tooltip").is_visible(),"Hover preview should appear")
    ensure("G8" in pg.locator(".board-floating-tooltip").inner_text(),"Exact grade details")
    point.click()
    ensure(pg.locator(".board-trend-inspector.is-pinned").count()==1,"Click must pin details")
    ensure(pg.locator(".board-trend-point.is-pinned").count()==1,"Point visually pinned")
    ensure(pg.locator("[data-board-unpin]").count()==1,"Accessible unpin action")
    ensure("-1.0 RIT" in pg.locator(".board-trend-inspector").inner_text(),"Signed difference visible")
    screenshot(pg,"02-history-pin")
    pg.locator("[data-board-unpin]").click()
    ensure(pg.locator(".board-trend-inspector.is-pinned").count()==0,"Unpin removes pinned state")
    return "Hover previews, click pins and unpin removes selection"
   scenario("MAP historical point preview and pin",pins,pg)

   def dp_overview():
    pg.locator('[data-board-overview-chart="dp"]').click()
    ensure(pg.locator(".board-dp-overview-trend").count()==1,"DP trend visible")
    ensure(pg.locator(".board-chart-range-annotation").count()==1,"DP range context")
    ensure("34.0–36.4" in pg.locator(".board-chart-range-annotation").inner_text(),"Recorded seven-year range")
    ensure(pg.locator(".board-dp-point").count()==7,"Seven full-scale annual points")
    pg.locator('[data-board-dp-point="average:2026"]').hover()
    ensure(pg.locator(".board-floating-tooltip").is_visible(),"DP hover preview")
    pg.locator('[data-board-dp-point="average:2026"]').click()
    ensure(pg.locator(".board-dp-inspector.is-pinned").count()==1,"DP point pinned")
    screenshot(pg,"03-diploma-overview-history")
    return "DP chart shows full-scale values, recorded range and pinning"
   scenario("Diploma historical insights and pointer interaction",dp_overview,pg)

   def map_latest():
    pg.locator('.board-nav-tabs [data-board-view="explore"]').click()
    ensure(pg.locator(".board-comparison-window").count()==1,"One selected window")
    ensure(pg.locator(".board-comparison-subject").count()==3,"Three subjects")
    ensure(pg.locator(".board-availability-note").count()==1,"Consolidated missing EARCOS")
    ensure(pg.locator(".board-comparison-mini.unavailable").count()==0,
           "No repeated empty EARCOS boxes")
    ensure(pg.locator(".board-comparison-mini").count()==3,"Only available US values")
    ensure("+22.2" in pg.locator(".board-comparison-math").inner_text(),"Exact Math gap")
    ensure("+6.6" in pg.locator(".board-comparison-reading").inner_text(),"Exact Reading gap")
    ensure("+10.4" in pg.locator(".board-comparison-language").inner_text(),"Exact Language gap")
    ensure(pg.locator(".board-map-drawer").count()==0,"No drawer before selection")
    no_filenames(pg)
    screenshot(pg,"04-map-clean-2026")
    return "Fall 2026 uses three dominant U.S. values and one regional availability notice"
   scenario("MAP adaptive subject cards with actual data",map_latest,pg)

   def drawer():
    tile=pg.locator('[data-board-tile-window="fall2026"][data-board-tile-subject="reading"]')
    tile.click()
    modal=pg.locator(".board-map-drawer")
    ensure(modal.count()==1,"Right drawer opens from subject card")
    ensure(modal.get_attribute("role")=="dialog","Semantic dialog")
    ensure(modal.get_attribute("aria-modal")=="true","Modal semantics")
    ensure(pg.locator(".board-drawer-backdrop").count()==1,"Accessible backdrop")
    ensure(pg.locator("body").evaluate("e=>e.classList.contains('board-drawer-open')"),"Background scroll locked")
    ensure(pg.locator(".board-drawer-close").evaluate("e=>document.activeElement===e"),"Focus moves into dialog")
    ensure("Reading" in modal.locator("h2").first.inner_text(),"Selected subject title")
    ensure(modal.locator(".board-grade-row").count()==8,"All eight grade comparisons")
    ensure(modal.locator(".board-drawer-highlights").count()==1,"Two concise context metrics")
    snap_bbox=modal.bounding_box()
    ensure(snap_bbox["x"]>450,"Drawer should be on right on desktop")
    screenshot(pg,"05-map-right-evidence-drawer")
    return "Right-side modal preserves MAP context and focuses the Close control"
   scenario("MAP right evidence drawer and focus management",drawer,pg)

   def drawer_interactions():
    pg.locator('[data-board-select="grade"]').select_option("8")
    modal=pg.locator(".board-map-drawer")
    ensure(modal.locator(".board-grade-row").count()==1,"Grade selector updates drawer")
    ensure(pg.locator('[data-board-select="grade"]').input_value()=="8","Selected grade retained")
    ensure(pg.locator('[data-board-select="grade"]').evaluate("e=>document.activeElement===e"),
           "Keyboard focus stays on grade selector")
    pg.keyboard.press("Escape")
    ensure(pg.locator(".board-map-drawer").count()==0,"Escape closes evidence drawer")
    ensure(not pg.locator("body").evaluate("e=>e.classList.contains('board-drawer-open')"),
           "Scroll unlocks on close")
    ensure(pg.locator('[data-board-tile-subject="reading"]').evaluate("e=>document.activeElement===e"),
           "Focus returns to subject card")
    pg.locator('[data-board-tile-subject="language"]').click()
    ensure("Language Usage" in pg.locator(".board-map-drawer h2").first.inner_text(),"Other subject opens")
    pg.locator(".board-drawer-backdrop").click(position={"x":30,"y":100})
    ensure(pg.locator(".board-map-drawer").count()==0,"Backdrop closes drawer")
    return "Grade filter, Escape, backdrop and focus return work correctly"
   scenario("Drawer keyboard Escape and contextual grade update",drawer_interactions,pg)

   def regional():
    pg.locator('[data-board-select="year"]').select_option("2025")
    pg.locator('[data-board-window="spring2026"]').click()
    ensure(pg.locator(".board-availability-note").count()==0,"No missing-data note when EARCOS exists")
    ensure(pg.locator(".board-comparison-mini").count()==6,"Both comparisons each subject")
    pg.locator("[data-board-compare-seasons]").click()
    ensure(pg.locator(".board-comparison-window").count()==2,"Side-by-side option works")
    ensure(pg.locator(".board-comparison-mini").count()==12,"Both windows real comparisons")
    screenshot(pg,"06-map-2025-26-region")
    return "Available regional comparisons show both benchmarks; seasonal comparison reversible"
   scenario("MAP EARCOS availability and optional season comparison",regional,pg)

   def dp_full():
    pg.locator('.board-nav-tabs [data-board-view="dp"]').click()
    ensure(pg.locator(".board-dp-graphic-card").count()==3,"Three Diploma achievement tiles")
    ensure(pg.locator('[data-board-dp-select="year"]').input_value()=="2026","Latest year default")
    ensure(pg.locator(".board-chart-range-annotation").count()==1,"Scale interpretation present")
    ensure("34.0–36.4" in pg.locator(".board-chart-range-annotation").inner_text(),"Real range")
    ensure(pg.locator(".board-dp-point").count()==7,"Seven years")
    no_filenames(pg)
    screenshot(pg,"07-diploma-future-desktop")
    pg.locator('[data-board-dp-metric="passRate"]').click()
    ensure("91–100" in pg.locator(".board-chart-range-annotation").inner_text(),
           "Recorded six-year pass-rate range")
    ensure(pg.locator(".board-dp-point").count()==6,"No invented missing pass year")
    return "DP benchmark-free narrative explains history without distorted axis"
   scenario("Diploma future design and consistent scale",dp_full,pg)

   def presentation():
    pg.locator("[data-board-presentation]").click()
    ensure(pg.locator(".roles").is_hidden(),"Hide demo role switching")
    ensure(pg.locator("[data-board-presentation]").inner_text()=="Exit presentation","Exit affordance")
    header=pg.locator(".top")
    bg=header.evaluate("e=>getComputedStyle(e).backgroundImage")
    ensure("gradient" in bg,"Premium presentation header")
    screenshot(pg,"08-presentation-chrome")
    pg.locator("[data-board-presentation]").click()
    ensure(pg.locator(".roles").is_visible(),"Demo roles restored")
    return "Presentation mode removes distractions with reversible visual emphasis"
   scenario("Chrome presentation experience",presentation,pg)

   def deep_link():
    tab=ctx.new_page()
    try:
     tab.goto(BASE+"/#/board?view=explore&window=spring2026&subject=math&details=1",
              wait_until="domcontentloaded")
     tab.locator(".board-map-drawer").wait_for(timeout=15000)
     ensure("Mathematics" in tab.locator("#board-drawer-heading").inner_text(),"Deep-linked subject")
     ensure(tab.locator("body").evaluate("e=>e.classList.contains('board-drawer-open')"),
            "Direct-link drawer should lock the page")
     tab.keyboard.press("Escape")
     ensure(tab.locator(".board-map-drawer").count()==0,"Escape on direct link")
    finally:tab.close()
    return "Published deep links preserve context and accessible close behavior"
   scenario("MAP evidence deep-link compatibility",deep_link,pg)

   def roles():
    for role,selector in [("faculty",".roster"),("student",".profile-head"),("leader",".leader-kpis")]:
     pg.locator('[data-role="'+role+'"]').click()
     ensure(pg.locator(selector).count()==1,role+" view must be unchanged")
    return "Faculty, Student and Leader experiences still render"
   scenario("Other demo roles untouched",roles,pg)
   ensure(not errors,"JavaScript errors: "+str(errors))
   ctx.close()

   for w,h in [(1920,1080),(1280,900),(1024,768),(390,844)]:
    c=browser.new_context(viewport={"width":w,"height":h},
      has_touch=w<600,is_mobile=w<600)
    page=c.new_page();err=[]
    page.on("pageerror",lambda e:err.append(str(e)))
    def size_check():
     page.goto(BASE+"/#/board?view=explore&window=fall2026&subject=math",wait_until="domcontentloaded")
     page.locator(".board-comparison-subject").first.wait_for(timeout=15000)
     ensure(page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
            "MAP horizontal page overflow at "+str(w))
     page.locator('[data-board-tile-subject="math"]').first.click()
     ensure(page.locator(".board-map-drawer").count()==1,"Drawer opens")
     ensure(page.locator(".board-map-drawer").bounding_box()["width"]<=w+1,"Drawer fits viewport")
     if w==1920:screenshot(page,"09-map-panel-chrome-1920")
     page.keyboard.press("Escape")
     page.locator('.board-nav-tabs [data-board-view="overview"]').click()
     ensure(page.locator(".board-strength-card").count()==4,"Overview renders")
     page.locator('.board-nav-tabs [data-board-view="dp"]').click()
     ensure(page.locator(".board-chart-range-annotation").count()==1,"Diploma range remains visible")
     ensure(page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
            "Diploma horizontal body overflow at "+str(w))
     if w==390:screenshot(page,"10-mobile-smoke")
     ensure(not err,"Browser JS exceptions at "+str(w)+": "+str(err))
     return str(w)+"px desktop/tablet/mobile check passed"
    scenario("Viewport "+str(w)+"px",size_check,page)
    c.close()
  finally:browser.close()
 passed=sum(x["pass"] for x in checks)
 (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(checks),"checks":checks},indent=2))
 print("SUMMARY",passed,"/",len(checks),flush=True)
 return 0 if passed==len(checks) else 1
if __name__=="__main__":raise SystemExit(main())

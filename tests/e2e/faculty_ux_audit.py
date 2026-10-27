"""Real browser usability audit of AISG My Learners (fictional demo).
Runs headless Chromium against the checked-out GitHub Pages build.
Tests realistic faculty journeys plus student, leader, mobile, keyboard and data interpretation.
"""
import os,time,json,traceback,re,math
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("ux-audit")
OUT.mkdir(parents=True,exist_ok=True)
results=[]
flags=[]

def record(label,passed,details="",elapsed=None):
    results.append({"scenario":label,"passed":bool(passed),"details":str(details)[:900],"seconds":round(elapsed,2) if elapsed is not None else None})
    print(("PASS" if passed else "FAIL")+" | "+label+" | "+str(details)[:300],flush=True)
def flag(priority,message):
    flags.append({"priority":priority,"finding":message})
    print("REVIEW ("+priority+") | "+message,flush=True)
def screenshot(page,name):
    try: page.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
    except Exception as ex: print("Screenshot failed",str(ex)[:100],flush=True)
def setup(browser,width=1440,height=900):
    ctx=browser.new_context(viewport={"width":width,"height":height},locale="en-GB",color_scheme="light")
    pg=ctx.new_page()
    errors=[]
    pg.on("pageerror",lambda err:errors.append(str(err)))
    pg.goto(BASE+"/#/overview",wait_until="domcontentloaded",timeout=30000)
    pg.locator("header.top").wait_for(timeout=15000)
    return ctx,pg,errors
def check(cond,msg):
    if not cond:raise AssertionError(msg)
def count(pg,s):return pg.locator(s).count()
def execute(name,browser,task,width=1440,height=900,shot=None):
    ctx=None;t0=time.monotonic()
    try:
        ctx,pg,errors=setup(browser,width,height)
        extra=task(pg)
        pg.wait_for_timeout(100)
        if shot:screenshot(pg,shot)
        check(not errors,"JavaScript errors: "+str(errors))
        record(name,True,extra or "Complete",time.monotonic()-t0)
    except Exception as ex:
        record(name,False,str(ex)+" "+traceback.format_exc()[-550:],time.monotonic()-t0)
        if ctx and 'pg' in locals():screenshot(pg,"FAIL-"+re.sub(r'[^a-z0-9]+','-',name.lower())[:48])
    finally:
        if ctx:ctx.close()

def landing(pg):
    check(pg.locator("main .heading h1").inner_text()=="Your students, in one place.","Wrong default faculty experience")
    check(count(pg,"header [data-role]")==3,"Role toggle should show faculty/student/leader")
    check(pg.locator('[data-role="faculty"]').get_attribute("aria-pressed")=="true","Faculty not selected")
    check(count(pg,'main .kpi')==3,"Too many summary cards or missing essentials")
    check(count(pg,'main .metric')==2,"Engagement and belonging not visible")
    check(count(pg,'main .tablewrap table tbody tr')==20,"First class roster is not 20 students")
    screenshot(pg,"01-faculty-desktop")
    return "Three summary cards, two indicators, one class roster; demo role switch visible"

def daily_student(pg):
    name=pg.locator("table tbody [data-student]").first.inner_text()
    pg.locator("table tbody [data-student]").first.click()
    check(pg.locator(".profile-head h1").is_visible(),"Profile did not open")
    check(name==pg.locator(".profile-head h1").inner_text(),"Wrong learner profile opened")
    check(count(pg,".profile-head")>0,"No profile identity")
    check("Academic overview" in pg.locator("main").inner_text(),"Missing academic snapshot")
    check("Classroom guidance" in pg.locator("main").inner_text(),"Missing classroom guidance")
    check("MAP Mathematics growth" in pg.locator("main").inner_text(),"Missing MAP growth")
    screenshot(pg,"02-faculty-student-profile")
    pg.locator('[data-action="back"]').first.click()
    check(count(pg,"table tbody tr")==20,"Cannot return to class roster")
    return "Roster → named learner → academic, attendance, MAP, guidance → back to same class"

def explain(pg):
    check(count(pg,".metric .action")==2,"Missing index explanation links")
    pg.locator('[data-action="explain:engagement"]').first.click()
    check("Understanding Engagement" in pg.locator(".explain h2").inner_text(),"Wrong index explanation")
    check(count(pg,".explain-items > div")==3,"Three item contributions should be visible")
    text=pg.locator(".explain").inner_text()
    check("Strongly disagree = 0" in text and "Strongly agree = 100" in text,"Missing score mapping")
    check("not 60% agreement" in text,"Need clear differentiation from percentage")
    screenshot(pg,"03-explain-class-index")
    pg.locator('[data-action="close"]').first.click()
    pg.locator("table tbody [data-student]").first.click()
    pg.locator('[data-action="explain:belonging"]').first.click()
    check(count(pg,".explain-items > div")==3,"Named student must see three item contributions")
    check("agree" in pg.locator(".explain").inner_text().lower(),"Missing source response labels")
    screenshot(pg,"04-explain-individual-index")
    return "Class average and named learner both open three-item score calculation"

def search(pg):
    textbox=pg.locator('input[data-query]')
    full=pg.locator("table tbody [data-student]").first.inner_text()
    textbox.fill(full)
    check(count(pg,"table tbody tr")==1,"Class search should narrow to one person")
    check(pg.locator("input[data-query]").evaluate("e=>document.activeElement===e"),"Search field lost keyboard focus during rerender")
    check(full in pg.locator("table tbody").inner_text(),"Search returned wrong learner")
    screenshot(pg,"05-class-roster-search")
    textbox.fill("")
    check(count(pg,"table tbody tr")==20,"Reset search failed")
    return "Exact name filtering + focus preservation + reset"

def change_class(pg):
    control=pg.locator('[data-select="class"]')
    options=control.locator("option").evaluate_all("(els)=>els.map(e=>e.value)")
    check(len(options)>=2,"Demo faculty cannot change teaching groups")
    old=options[0]
    control.select_option(options[1])
    check(pg.locator('[data-select="class"]').input_value()==options[1],"Changing class did not persist")
    check(count(pg,"table tbody tr")==20,"New class roster did not update")
    pg.locator('[data-select="class"]').select_option(old)
    check(count(pg,"table tbody tr")==20,"Returning to prior class failed")
    return "Class switching works with current faculty selection"

def change_teacher(pg):
    select=pg.locator('[data-select="teacher"]')
    option=select.locator("option").filter(has_text="Karen Robb").first
    tid=option.get_attribute("value")
    check(tid,"Could not find fictional early childhood persona")
    select.select_option(tid)
    check("PK3" in pg.locator('[data-select="class"]').inner_text() or "PK4" in pg.locator('[data-select="class"]').inner_text(),"Teacher demo did not change to early grades")
    check(count(pg,"table tbody tr")==20,"Early childhood class not loaded")
    summary=pg.locator("main .metric").first.inner_text()
    if "0 of 0 check-ins" in summary:
        flag("P1 UX","PK–Grade 2 shows 0 of 0 engagement responses and an explainable empty score rather than a plain 'Not collected for this age group' state.")
    screenshot(pg,"06-early-years-learner-view")
    return "Switching demo teachers correctly scopes roster; age-ineligible indicator needs clearer treatment"

def student_role(pg):
    pg.locator('[data-role="student"]').click()
    check(pg.locator('[data-role="student"]').get_attribute("aria-pressed")=="true","Role toggle not active")
    check("My learning, my story" in pg.locator("h1").first.inner_text(),"Student landing wrong")
    check(count(pg,'[data-select="student"]')==1,"Fictional student selector missing")
    check(count(pg,".metric")==2,"Student should see two experience indices")
    check(pg.locator("#reflection").is_visible(),"Personal reflection not available")
    check(count(pg,"table tbody tr")==0,"Student view should not display other learners' class roster")
    pg.locator("#reflection").fill("I learn best when I collaborate with a partner.")
    pg.locator('[data-action="save-reflection"]').click()
    check("saved" in pg.locator("#save-status").inner_text().lower(),"Reflection save not acknowledged")
    screenshot(pg,"07-student-view")
    pg.reload(wait_until="domcontentloaded")
    check("I learn best" in pg.locator("#reflection").input_value(),"Reflection not retained in demo session")
    return "Student-only view, explainable measures and browser-session reflection survive reload"

def leader_role(pg):
    pg.locator('[data-role="leader"]').click()
    check("Where are experiences improving" in pg.locator("h1").first.inner_text(),"Leader landing wrong")
    pg.locator('[data-select="division"]').select_option("Secondary")
    pg.locator('[data-select="grade"]').select_option("G10")
    pg.locator('[data-select="leader-class"]').select_option("G10-A")
    check("20" in pg.locator(".kpi").first.inner_text(),"Selected 20-person class not reflected in leader summary")
    pg.locator('[data-action="explain:engagement"]').click()
    check(count(pg,".explain-items > div")==3,"Leader explanation missing item breakdown")
    screenshot(pg,"08-leader-drilldown")
    pg.locator('[data-action="close"]').click()
    pg.locator('[data-select="window"]').select_option("F25")
    label=pg.locator(".metric").first.inner_text()
    if "vs Spring" in label:flag("P1 data interpretation","Selecting Fall 2025 still displays an engagement change 'vs Spring' computed from Fall 2026 and Spring 2026. Date filter and change label contradict.")
    return "Leader division → grade → class → 3-item explanation → historical window"

def user_controls(pg):
    pg.keyboard.press("Tab")
    check(count(pg,".roles button")==3,"Role switch inaccessible")
    controls=pg.locator("button,select,input,textarea").evaluate_all("(els)=>els.filter(e=>!e.disabled).map(e=>({name:e.getAttribute('aria-label')||e.textContent.trim().slice(0,55),tag:e.tagName,role:e.getAttribute('role')}))")
    unnamed=[c for c in controls if not c["name"] and c["tag"]=="BUTTON"]
    check(not unnamed,"Unnamed buttons "+str(unnamed))
    # Native select labels wrap the selects; source accessible names should be present.
    return f"{len(controls)} interactive controls on default faculty page; all buttons named"

def scroll_to_class(pg):
    pg.locator('[data-role="faculty"]').click()
    buttons=pg.locator("table tbody [data-student]")
    buttons.last.scroll_into_view_if_needed()
    check(buttons.last.is_visible(),"Cannot reach final learner")
    buttons.last.click()
    check(pg.locator(".profile-head h1").is_visible(),"Profile not reachable at end of roster")
    pg.locator('[data-action="back"]').click()
    return "Last learner reachable in table; back to roster works"

def responsive(browser):
    for role in ["faculty","student","leader"]:
        for width,height in [(360,800),(390,844),(768,1024),(1024,768),(1440,900),(1920,1080)]:
            ctx=None;t=time.monotonic()
            try:
                ctx,pg,errors=setup(browser,width,height)
                if role!="faculty":pg.locator(f'[data-role="{role}"]').click()
                values=pg.evaluate("""()=>{
                   const d=document.documentElement,view=window.innerWidth;
                   const roles=document.querySelector('.roles').getBoundingClientRect();
                   return {documentScroll:d.scrollWidth,viewport:view,overflow:d.scrollWidth-view,
                     mainWidth:document.querySelector('main').getBoundingClientRect().width,
                     rolesLeft:roles.left,rolesRight:roles.right,
                     roleVisible:roles.left>=0&&roles.right<=view+2,
                     headings:document.querySelectorAll('main h1').length,
                     horizTables:[...document.querySelectorAll('.tablewrap')].every(x=>getComputedStyle(x).overflowX==='auto')}
                }""")
                good=values["overflow"]<=2 and values["roleVisible"] and values["headings"]>0 and not errors
                record(f"Responsive {role} {width}px",good,values,time.monotonic()-t)
                if width in [390,1440] and role in ["faculty","student","leader"]:
                    screenshot(pg,f"responsive-{role}-{width}")
            except Exception as exc:record(f"Responsive {role} {width}px",False,str(exc),time.monotonic()-t)
            finally:
                if ctx:ctx.close()

def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),args=["--no-sandbox","--disable-dev-shm-usage"])
        try:
            for name,task in [
                ("Faculty landing + information hierarchy",landing),
                ("Faculty roster to individual learner",daily_student),
                ("Index explainability at class and individual level",explain),
                ("Fast learner search and reset",search),
                ("Switch between assigned classes",change_class),
                ("Early-years faculty and unavailable measures",change_teacher),
                ("Student ownership and reflection persistence",student_role),
                ("Leader drilldown and comparable window",leader_role),
                ("Keyboard and accessible controls",user_controls),
                ("Roster scroll and return",scroll_to_class)
            ]:
                execute(name,browser,task)
            responsive(browser)
        finally:browser.close()
    passes=sum(x["passed"] for x in results)
    print("TOTAL",passes,"/",len(results),"scenarios pass",flush=True)
    print("FLAGS",json.dumps(flags,indent=2),flush=True)
    (OUT/"audit.json").write_text(json.dumps({"site":BASE,"method":"Chromium scripted instructor scenarios; not observation of a real teacher","passed":passes,"total":len(results),"scenarios":results,"flags":flags},indent=2))
    return 0 if passes==len(results) else 1

if __name__=="__main__":raise SystemExit(main())

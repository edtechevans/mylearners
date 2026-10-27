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
    pg.goto(BASE+"/#/overview",wait_until="domcontentloaded",timeout=20000)
    pg.wait_for_timeout(900)
    if not pg.locator("header.top").count():
        raise AssertionError("App did not render; page errors: "+str(errors)+"; body: "+pg.locator("body").inner_text()[:350])
    pg.locator("header.top").wait_for(timeout=6000)
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
    check(count(pg,'.quick-summary .quick-tile')==4,"Expected four compact summary tiles")
    check(count(pg,'.quick-score')==2,"Engagement and belonging quick scores must be visible")
    check(count(pg,'main .metric')==0,"Large indicator panels should not crowd the faculty landing page")
    check(count(pg,'main .roster-desktop tbody tr')==20,"First class roster is not 20 students")
    check("Demo snapshot:" in pg.locator(".heading").inner_text(),"Missing as-of date")
    check("Grade" not in pg.locator(".roster-desktop thead").inner_text(),"Grade column duplicates selected class")
    toolbar=pg.locator(".faculty-toolbar").bounding_box()
    roster=pg.locator(".roster").bounding_box()
    check(toolbar["y"]<roster["y"],"Learner find input should appear before roster")
    screenshot(pg,"01-faculty-desktop")
    return "Class and search first; four compact tiles; 20 learners; data date is visible"
def daily_student(pg):
    name=pg.locator("table tbody [data-student]").first.inner_text()
    pg.locator("table tbody [data-student]").first.click()
    check(pg.locator(".profile-head h1").is_visible(),"Profile did not open")
    check(name==pg.locator(".profile-head h1").inner_text(),"Wrong learner profile opened")
    check(count(pg,".profile-head")>0,"No profile identity")
    check("Academic overview" in pg.locator("main").inner_text(),"Missing academic snapshot")
    check("Classroom guidance" in pg.locator("main").inner_text(),"Missing classroom guidance")
    check("map mathematics growth" in pg.locator("main").inner_text().lower(),"Missing MAP growth")
    screenshot(pg,"02-faculty-student-profile")
    pg.locator('[data-action="back"]').first.click()
    check(count(pg,"table tbody tr")==20,"Cannot return to class roster")
    return "Roster → named learner → academic, attendance, MAP, guidance → back to same class"

def explain(pg):
    check(count(pg,'.quick-score')==2,"Missing index explanation buttons")
    pg.locator('[data-action="explain:faculty:engagement"]').click()
    check("Understanding Engagement" in pg.locator(".explain h2").inner_text(),"Wrong explanation")
    check(count(pg,".explain-items > div")==3,"Three index ingredients should be visible")
    text=pg.locator(".explain").inner_text()
    check("Strongly disagree 0" in text and "Strongly agree 100" in text,"Missing mapping")
    check("not a percentage" in text,"Should distinguish index from percentages")
    check("Fall 2026 student check-in" in text,"Missing source information")
    screenshot(pg,"03-explain-class-index")
    pg.locator('[data-action="close"]').click()
    pg.locator("table tbody [data-student]").first.click()
    pg.locator('[data-action="explain:profile:belonging"]').click()
    check(count(pg,".explain-items > div")==3,"Named learner's three responses must appear")
    check("My response:" in pg.locator(".explain").inner_text(),"Underlying responses missing")
    screenshot(pg,"04-explain-individual-index")
    return "Both class and learner index scores are traceable to three responses"
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
    check(tid,"Demo faculty missing")
    select.select_option(tid)
    check("PK3" in pg.locator('[data-select="class"]').inner_text() or "PK4" in pg.locator('[data-select="class"]').inner_text(),"Early-years teacher did not update")
    check(count(pg,"table tbody tr")==20,"Early years roster missing")
    check(count(pg,".quick-score")==0,"PK–Grade 2 must not show empty indices")
    check("not collected for PK" in pg.locator(".quick-note").inner_text(),"Clear age-ineligible message missing")
    screenshot(pg,"06-early-years-learner-view")
    return "Early years get class/attendance with no meaningless empty engagement scores"
def student_role(pg):
    pg.locator('[data-role="student"]').click()
    check(pg.locator('[data-role="student"]').get_attribute("aria-pressed")=="true","Role switch not active")
    check("My learning, my story" in pg.locator("h1").first.inner_text(),"Wrong Student landing")
    check(count(pg,'[data-select="student"]')==1,"Fictional student selector missing")
    check(count(pg,".metric")==2,"Student needs both experience measures")
    check("My check-ins over time" in pg.locator("main").inner_text(),"Progress history missing")
    check(count(pg,'[data-action="studenthome"]')==0,"Misleading no-op back button remains")
    check(pg.locator("#reflection").is_visible(),"Reflection draft not available")
    check(count(pg,"table tbody tr")==0,"Student should not see class roster")
    pg.locator("#reflection").fill("I learn best when I collaborate with a partner.")
    pg.locator('[data-action="save-reflection"]').click()
    check("saved" in pg.locator("#save-status").inner_text().lower(),"Draft save feedback missing")
    screenshot(pg,"07-student-view")
    pg.reload(wait_until="domcontentloaded")
    check("I learn best" in pg.locator("#reflection").input_value(),"Draft did not survive session reload")
    return "Student sees own check-in history, academic progress and private browser reflection"
def leader_role(pg):
    pg.locator('[data-role="leader"]').click()
    check("Where are experiences improving" in pg.locator("h1").first.inner_text(),"Wrong Leader landing")
    pg.locator('[data-select="division"]').select_option("Secondary")
    pg.locator('[data-select="grade"]').select_option("G10")
    pg.locator('[data-select="leader-class"]').select_option("G10-A")
    check("20" in pg.locator(".kpi").first.inner_text(),"Selected class size not reflected")
    check(count(pg,".card table tbody tr")==1,"Selected class should appear as one row")
    pg.locator('[data-action="explain:leader:engagement"]').click()
    check(count(pg,".explain-items > div")==3,"Leader index question breakdown missing")
    screenshot(pg,"08-leader-drilldown")
    pg.locator('[data-action="close"]').click()
    pg.locator('[data-select="window"]').select_option("F25")
    label=pg.locator(".metric").first.inner_text()
    check("First available check-in" in label,"Fall 2025 must not compare against later check-ins")
    check("vs Spring" not in label,"Historic period label is inaccurate")
    pg.locator('[data-select="window"]').select_option("S26")
    label=pg.locator(".metric").first.inner_text()
    check("vs Fall 2025" in label,"Spring 2026 should compare with Fall 2025")
    return "Division → grade → class, valid historical comparisons and question-level explanation"
def leader_schoolwide(pg):
    pg.locator('[data-role="leader"]').click()
    txt=pg.locator("main").inner_text()
    check("Elementary student experience" in txt and "Secondary student experience" in txt,
          "Whole school must show two non-interchangeable age-appropriate indices")
    pg.locator('[data-action="explain:elementary:engagement"]').click()
    check("Understanding Engagement" in pg.locator("#score-explanation h2").inner_text(),"Elementary item explanation missing")
    pg.locator('[data-action="close"]').click()
    pg.locator('[data-action="explain:secondary:belonging"]').click()
    check("Understanding Belonging" in pg.locator("#score-explanation h2").inner_text(),"Secondary item explanation missing")
    return "Separate Elementary and Secondary measurement instruments and scope-specific explanations"

def mobile_student_lookup(pg):
    check(pg.locator(".roster-mobile").is_visible(),"Mobile cards should replace wide table")
    btn=pg.locator(".roster-mobile .roster-item").first
    name=btn.locator("strong").inner_text()
    btn.click()
    check(pg.locator(".profile-head h1").inner_text()==name,"Wrong mobile student profile")
    pg.locator('[data-action="back"]').click()
    check(pg.locator(".roster-mobile").is_visible(),"Cannot return to mobile roster")
    return "One tap into student profile and one tap back from phone"

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
                   return {scrollWidth:d.scrollWidth,viewport:view,overflow:d.scrollWidth-view,
                     rolesVisible:roles.left>=0&&roles.right<=view+2,
                     headings:document.querySelectorAll('main h1').length}
                }""")
                good=values["overflow"]<=2 and values["rolesVisible"] and values["headings"]>0 and not errors
                if width==390 and role=="faculty":
                    roster_y=pg.locator(".roster-mobile").evaluate("e=>e.getBoundingClientRect().top+window.scrollY")
                    values["rosterTopPx"]=round(roster_y)
                    values["mobileStudentCards"]=count(pg,".roster-mobile .roster-item")
                    good=good and roster_y<900 and values["mobileStudentCards"]==20 and pg.locator(".roster-mobile").is_visible()
                record(f"Responsive {role} {width}px",good,values,time.monotonic()-t)
                if width in [390,1440]:
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
                ("Whole-school age-appropriate measures",leader_schoolwide),
                ("Keyboard and accessible controls",user_controls),
                ("Roster scroll and return",scroll_to_class)
            ]:
                execute(name,browser,task)
            responsive(browser)
            execute("Mobile one-tap learner lookup",browser,mobile_student_lookup,390,844)
        finally:browser.close()
    passes=sum(x["passed"] for x in results)
    print("TOTAL",passes,"/",len(results),"scenarios pass",flush=True)
    print("FLAGS",json.dumps(flags,indent=2),flush=True)
    (OUT/"audit.json").write_text(json.dumps({"site":BASE,"method":"Chromium scripted instructor scenarios; not observation of a real teacher","passed":passes,"total":len(results),"scenarios":results,"flags":flags},indent=2))
    return 0 if passes==len(results) else 1

if __name__=="__main__":raise SystemExit(main())

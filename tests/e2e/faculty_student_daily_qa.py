"""Chrome-first Faculty and Student everyday-use QA (real UI, fake data).

Exercises assigned-class search, compact roster, academic controls, saved
preferences, age-appropriate student landing, collapsible history, reflection,
and unchanged Board, Leader and classroom guidance placement.
"""
import json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-faculty-student-daily");OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def require(ok,message):
 if not ok:raise AssertionError(message)
def capture(page,name):
 page.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def scenario(name,fn,page=None):
 try:
  v=fn();print("PASS | "+name+" | "+str(v),flush=True)
  checks.append({"name":name,"passed":True,"detail":str(v)})
 except Exception as e:
  print("FAIL | "+name+" | "+str(e),flush=True)
  checks.append({"name":name,"passed":False,"error":str(e)})
  if page:
   try:capture(page,"FAIL-"+re.sub('[^a-z0-9]+','-',name.lower())[:42])
   except Exception:pass

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,
   executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
   args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   context=browser.new_context(viewport={"width":1440,"height":900},
    permissions=["clipboard-read","clipboard-write"])
   pg=context.new_page();errors=[]
   pg.on("pageerror",lambda e:errors.append(str(e)))
   pg.goto(BASE+"/#/faculty",wait_until="domcontentloaded")
   pg.locator(".roster-daily").wait_for(timeout=16000)

   data=pg.evaluate("""async () => {
    const {generateDemoData,gradeNumber}=await import('./src/data.mjs');
    const {applyFacultyDemo}=await import('./src/faculty-demo.mjs');
    const d=applyFacultyDemo(generateDemoData());
    const t=d.teachers.find(t=>t.classIds.filter(id=>{
      const n=gradeNumber(d.classIndex.get(id).grade);return n>=3&&n<=10;
    }).length>=2);
    if(!t)throw Error('No suitable demo teacher with two assigned classes');
    const classes=t.classIds.filter(id=>{const n=gradeNumber(d.classIndex.get(id).grade);return n>=3&&n<=10});
    const cls1=d.classIndex.get(classes[0]),cls2=d.classIndex.get(classes[1]);
    const secondStudent=d.userIndex.get(cls2.studentIds[0]);
    const others={};
    for(const grade of ['PK3','K','G1','G3','G7','G12']){
      const c=d.classes.find(c=>c.grade===grade);
      others[grade]={teacher:c.teacherId,class:c.id,student:c.studentIds[0]};
    }
    return {teacher:t.id,classA:cls1.id,classB:cls2.id,
      acrossStudent:secondStudent.id,acrossName:secondStudent.name,others}
   }""")

   def initial():
    require(pg.locator(".roster-daily").count()==1,"Class roster visible")
    require(pg.locator(".academic-class-compact").count()==1,"Compact academic controls present")
    require(pg.locator(".academic-class-panel").count()==1,"One academic selector")
    require(pg.locator(".academic-class-breakdown").count()==1,"Optional class distribution")
    require(not pg.locator(".academic-class-breakdown").evaluate("e=>e.open"),
            "Class distribution collapsed by default")
    require(pg.locator(".roster-daily").evaluate("e=>e.contains(document.querySelector('.academic-class-panel'))"),
            "Class academic controls integrated into roster")
    require(pg.locator(".roster-daily").evaluate("e=>e.getBoundingClientRect().top") <
            pg.locator(".quick-summary").evaluate("e=>e.getBoundingClientRect().bottom")+35,
            "Roster directly below compact daily summary")
    require(pg.locator('[data-query]').get_attribute("aria-label")=="Search for a student across all assigned classes",
            "Global assigned class search labelled")
    capture(pg,"01-faculty-roster-first-desktop")
    return "Roster is the main default destination, with compact academic tabs and class analysis hidden"
   scenario("Faculty first-screen hierarchy",initial,pg)

   def cross_class():
    pg.locator('[data-select="teacher"]').select_option(data['teacher'])
    pg.locator('[data-select="class"]').select_option(data['classA'])
    pg.locator('[data-query]').fill(data['acrossName'])
    require(pg.locator(".roster-daily").count()==1,"Search result roster")
    require("across all classes" in pg.locator(".roster-daily .sectionhead").inner_text().lower(),
            "Search scope explicit")
    require(pg.locator('.roster-desktop [data-student="'+data['acrossStudent']+'"]').count()==1,
            "Other assigned class learner found")
    require(data['classB'] in pg.locator('.roster-desktop').inner_text(),
            "Search results show learner's class")
    require(pg.locator(".quick-summary").count()==0,"Unrelated selected-class figures hidden while global searching")
    require(pg.locator(".academic-class-panel").count()==0,
            "No misleading class-specific academic selector while searching multiple classes")
    capture(pg,"02-across-classes-search")
    pg.locator('.roster-desktop [data-student="'+data['acrossStudent']+'"]').first.click()
    require(pg.locator(".profile-head").count()==1,"Cross-class profile opens")
    require(data['classB'] in pg.locator(".profile-head").inner_text(),"Correct class on profile")
    return "Search finds and opens learners in another authorised assigned demo class"
   scenario("Search across all assigned classes",cross_class,pg)

   def guidance():
    require(pg.locator(".academic-profile").count()==1,"Faculty academic profile retained")
    require(pg.locator(".academic-next-step h2").inner_text()=="Classroom guidance",
            "Faculty guidance still present")
    loc=pg.locator(".academic-next-step").evaluate("e=>e.getBoundingClientRect().top")
    academic=pg.locator(".academic-profile").evaluate("e=>e.getBoundingClientRect().top")
    require(loc>academic,"Guidance remains below academic evidence, as explicitly requested")
    require(pg.locator(".profile-kpis article").count()<=3,"Inapplicable KPIs hidden")
    pg.locator('[data-action="back"]').click()
    require(pg.locator('[data-query]').input_value()==data['acrossName'],"Search retained on return")
    pg.locator('[data-clear-search]').click()
    require(pg.locator('[data-query]').input_value()=="","Clear search works")
    return "Guidance stays at bottom; cross-class navigation returns to the saved search"
   scenario("Faculty guidance placement and back navigation",guidance,pg)

   def academic():
    pg.locator('[data-select="class"]').select_option(data['classB'])
    require(pg.locator(".academic-class-compact").count()==1,"Academic selector back")
    pg.locator('[data-academic-mode="ixl"]').click()
    require(pg.locator('[data-academic-mode="ixl"]').get_attribute("aria-pressed")=="true","IXL selected")
    require("IXL Math" in pg.locator('.roster-desktop thead').inner_text(),"Roster switches IXL measure")
    pg.reload(wait_until="domcontentloaded")
    pg.locator(".academic-class-compact").wait_for(timeout=16000)
    require(pg.locator('[data-select="class"]').input_value()==data['classB'],
            "Last class persisted across browser reload")
    require(pg.locator('[data-academic-mode="ixl"]').get_attribute("aria-pressed")=="true",
            "Teacher measure persisted across reload")
    pg.locator('[data-academic-mode="report"]').click()
    pg.locator('[data-academic-subject]').select_option("Sciences")
    require("Sciences" in pg.locator('.roster-desktop thead').inner_text(),"Subject selection updates result")
    pg.locator(".academic-class-breakdown summary").click()
    require(pg.locator(".academic-class-breakdown").evaluate("e=>e.open"),"Class analysis available on demand")
    capture(pg,"03-faculty-subject-detail-open")
    pg.locator(".academic-class-breakdown summary").click()
    return "Teacher preference survives reload; roster academic mode and subject change immediately"
   scenario("Academic measure and class persistence",academic,pg)

   def early_and_secondary_faculty():
    for grade in ['K','G12']:
     x=data['others'][grade]
     pg.locator('[data-select="teacher"]').select_option(x['teacher'])
     pg.locator('[data-select="class"]').select_option(x['class'])
     require(pg.locator(".roster-daily").count()==1,"Roster for "+grade)
     require("MAP Math growth" not in pg.locator(".roster-desktop thead").inner_text(),
             "Do not show ineligible MAP growth for "+grade)
     if grade=='K':
      require("Engagement" not in pg.locator(".roster-desktop thead").inner_text(),
              "No K SEL index column")
      require(pg.locator('[data-academic-mode="core"]').count()==1,"K phonics")
     if grade=='G12':
      require(pg.locator('[data-academic-mode="ixl"]').count()==0,"No G12 IXL")
      require("Engagement" in pg.locator(".roster-desktop thead").inner_text(),"G12 SEL remains")
    return "Academic, MAP and wellbeing columns remain grade-relevant"
   scenario("Faculty age-relevant columns",early_and_secondary_faculty,pg)

   def student_landing():
    pg.locator('[data-role="student"]').click()
    require(pg.locator(".student-landing").count()==1,"New Student landing")
    require(pg.locator(".student-today-tile").count()==3,"Three meaningful questions")
    require(pg.locator(".student-detail-section").count()==2,"Two deeper sections")
    require(pg.locator(".student-detail-section[open]").count()==0,
            "Historical content hidden until requested")
    require(pg.locator("#reflection").count()==1,"One personal goal field")
    require(pg.locator(".profile-kpis").count()==0,"No duplicate school-style KPI row")
    require(pg.locator(".academic-next-step").count()==0,"No duplicate reflection section below")
    require(pg.locator(".student-landing").evaluate("e=>e.getBoundingClientRect().top")<
            pg.locator(".student-detail-section").first.evaluate("e=>e.getBoundingClientRect().top"),
            "Student first sees meaning, not all historic data")
    capture(pg,"04-student-simple-first-screen")
    return "Student defaults to strengths, recent evidence and a reflection—not a stack of reports"
   scenario("Student landing simplicity",student_landing,pg)

   def report_expand():
    pg.locator('[data-student-panel="reports"] summary').click()
    require(pg.locator('[data-student-panel="reports"]').evaluate("e=>e.open"),
            "Academic accordion opens")
    require(pg.locator(".academic-subject-result").count()>=5,"Subject report detail")
    years=pg.locator("[data-academic-report-year]")
    require(years.count()>=1,"Issued report years")
    if years.count()>1:
     older=years.nth(1).get_attribute("data-academic-report-year")
     years.nth(1).click()
     require(pg.locator('[data-student-panel="reports"]').evaluate("e=>e.open"),
             "Report accordion stays open after changing year")
     require(older in pg.locator(".academic-report-meta").inner_text(),
             "Historical report content changes")
    pg.locator('[data-student-panel="wellbeing"] summary').click()
    require(pg.locator('[data-student-panel="wellbeing"]').evaluate("e=>e.open"),
            "Wellbeing panel opens")
    require(pg.locator(".student-checkin-history").count()==1,
            "Wellbeing index and history are together")
    capture(pg,"05-student-reports-and-wellbeing-expanded")
    return "Older reports and wellbeing history are one-click accessible, and expansion persists"
   scenario("Student detail and historical navigation",report_expand,pg)

   def reflection():
    pg.locator("#reflection").fill("I want to practise explaining my thinking.")
    pg.locator('[data-action="save-reflection"]').click()
    require("Draft saved" in pg.locator("#save-status").inner_text(),"Reflection saved")
    require(pg.evaluate("sessionStorage.getItem('reflection-'+document.querySelector('[data-select=student]').value)")==
            "I want to practise explaining my thinking.","Saved only in this browser session")
    pg.locator('[data-select="student-grade"]').select_option("K")
    require(pg.locator(".student-stage-early").count()==1,"Early age layout")
    require(pg.locator(".student-detail-section").count()==1,"No kindergarten wellbeing panel")
    require(pg.locator(".student-checkin-history").count()==0,"No empty SEL trends")
    require(pg.locator(".student-today-tile").count()==3,"Still 3 friendly questions")
    require("MAP Mathematics growth" not in pg.locator(".student-landing").inner_text(),
            "No K MAP")
    capture(pg,"06-kindergarten-simple-student")
    pg.locator('[data-select="student-grade"]').select_option("G12")
    require(pg.locator(".student-stage-secondary").count()==1,"Secondary layout")
    require("MAP Mathematics growth" not in pg.locator(".student-landing").inner_text(),
            "No Grade 12 MAP Growth")
    require(pg.locator(".student-detail-section").count()==2,"G12 wellbeing available")
    capture(pg,"07-grade12-student-landing")
    return "Reflection saves locally; Kindergarten and G12 hide invalid or empty measures"
   scenario("Student reflection and age-specific adaptation",reflection,pg)

   def roles():
    pg.locator('[data-role="leader"]').click()
    require(pg.locator(".leader-kpis").count()==1,"Leader preserved")
    pg.locator('[data-role="board"]').click()
    require(pg.locator(".board-strength-card").count()==4,"Board preserved")
    require(not errors,"Browser errors "+str(errors))
    return "Leader and Board unchanged"
   scenario("Non-target dashboard isolation",roles,pg)
   context.close()

   for width,height in [(1920,1080),(1280,900),(390,844)]:
    ctx=browser.new_context(viewport={"width":width,"height":height},
      has_touch=width<600,is_mobile=width<600)
    p=ctx.new_page();err=[]
    p.on("pageerror",lambda e:err.append(str(e)))
    def layout():
     p.goto(BASE+"/#/faculty",wait_until="domcontentloaded")
     p.locator(".roster-daily").wait_for(timeout=16000)
     require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
             "Faculty page horizontal overflow at "+str(width))
     p.locator('[data-role="student"]').click()
     require(p.locator(".student-landing").count()==1,"Student landing exists")
     require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
             "Student page horizontal overflow at "+str(width))
     if width==1920:capture(p,"08-student-chrome-1920")
     if width==390:capture(p,"09-student-mobile-smoke")
     require(not err,"JavaScript errors "+str(err))
     return str(width)+"px faculty/student layouts fit"
    scenario("Chrome viewport "+str(width)+"px",layout,p)
    ctx.close()
  finally:browser.close()
 passed=sum(x["passed"] for x in checks)
 (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(checks),"checks":checks},indent=2))
 print("SUMMARY",passed,"/",len(checks),flush=True)
 return 0 if passed==len(checks) else 1
if __name__=="__main__":raise SystemExit(main())

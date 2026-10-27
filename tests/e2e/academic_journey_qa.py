"""Chrome QA for fictional AISG Faculty and Student academic snapshots.

Checks class roster filters, full-grade coverage, student histories,
no fabricated current-year final reports, role isolation and Chrome layouts.
"""
import os,re,json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get("MYLEARNERS_URL","http://127.0.0.1:8765").rstrip("/")
OUT=Path("qa-academic-journey");OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def require(ok,why):
 if not ok:raise AssertionError(why)
def capture(p,name):
 p.screenshot(path=str(OUT/(name+".png")),full_page=True,animations="disabled")
def run(name,fn,page=None):
 try:
  result=fn()
  print("PASS | "+name+" | "+str(result),flush=True)
  checks.append({"name":name,"passed":True,"details":str(result)})
 except Exception as e:
  print("FAIL | "+name+" | "+str(e),flush=True)
  checks.append({"name":name,"passed":False,"error":str(e)})
  if page:
   try:capture(page,"FAILED-"+re.sub(r'[^a-z0-9]+','-',name.lower())[:45])
   except Exception:pass
def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,
    executable_path=os.environ.get("CHROME_BIN","/usr/bin/google-chrome"),
    args=["--no-sandbox","--disable-dev-shm-usage"])
  try:
   ctx=browser.new_context(viewport={"width":1440,"height":900},locale="en-GB")
   page=ctx.new_page();js=[]
   page.on("pageerror",lambda e:js.append(str(e)))
   page.goto(BASE+"/#/faculty",wait_until="domcontentloaded")
   page.locator(".roster").wait_for(timeout=15000)
   mapping=page.evaluate("""async () => {
     const {generateDemoData}=await import('./src/data.mjs');
     const {applyFacultyDemo}=await import('./src/faculty-demo.mjs');
     const {createAcademicDemoRecords,academicFor}=await import('./src/academic-journey-data.mjs');
     const d=applyFacultyDemo(generateDemoData()), academic=createAcademicDemoRecords(d.students);
     const out={};
     for(const grade of ['PK3','K','G1','G3','G5','G7','G11','G12']){
       const cls=d.classes.find(x=>x.grade===grade);
       const candidates=cls.studentIds.map(id=>d.userIndex.get(id));
       const student=candidates.find(s=>academicFor(academic,s.id).reports.length>=3)||candidates[0];
       out[grade]={class:cls.id,teacher:cls.teacherId,student:student.id};
     }
     return out;
   }""")
   def set_class(g):
    d=mapping[g]
    page.locator('[data-select="teacher"]').select_option(d['teacher'])
    page.locator('[data-select="class"]').select_option(d['class'])
    require(page.locator(".roster").count()==1,"Roster after selecting "+g)
    return d

   def default_faculty():
    require(page.locator(".academic-class-panel").count()==1,"Faculty academic panel appears")
    require(page.locator(".academic-mode-tabs [data-academic-mode='report']").count()==1,
            "Report cards are primary")
    require(page.locator(".academic-distribution-track").count()==1,"Class report breakdown")
    require(page.locator(".academic-subject-picker select").count()==1,"Report subject selection")
    require(page.locator('.roster-desktop th').all_text_contents()[2].startswith('Report ·'),
            "Roster reflects selected academic evidence")
    require(page.locator(".roster-desktop tbody tr").count()==20,"Twenty assigned students")
    require("Fictional" in page.locator(".academic-class-panel").inner_text(),"Data labelled demo")
    capture(page,"01-faculty-default")
    return "Teacher sees one class subject picker, latest report coverage and twenty student results"
   run("Default Faculty academic results",default_faculty,page)

   def elementary_class():
    set_class('G3')
    require(page.locator(".academic-mode-tabs button").count()==4,"G3 four eligible measures")
    subject=page.locator('[data-academic-subject]')
    require('Science' in subject.locator('option').all_text_contents(),"Science appears")
    subject.select_option('Science')
    require('Science' in page.locator('.roster-desktop th').all_text_contents()[2],
            "Changing subject updates roster label")
    require(page.locator(".academic-distribution-track").count()==1,"Class results by subject")
    capture(page,"02-grade3-science-reports")
    for mode in ['ixl','core','fp']:
     page.locator('[data-academic-mode="'+mode+'"]').click()
     require(page.locator('[data-academic-mode="'+mode+'"]').get_attribute('aria-pressed')=="true",
             mode+" selected")
     require(page.locator(".roster-desktop tbody .academic-roster-"+mode).count()==20,
             mode+" each learner in class")
    page.locator('[data-academic-mode="report"]').click()
    return "Grade 3 roster switches subject reports, IXL diagnostic, phonics and F&P"
   run("Elementary class filters and subject reports",elementary_class,page)

   def student_profile():
    set_class("G3")
    d=mapping["G3"]
    page.locator('[data-student="'+d["student"]+'"]').first.click()
    require(page.locator(".academic-profile").count()==1,"Faculty student profile academic")
    require(page.locator(".academic-report-years button").count()>=1,"Issued report years")
    require(page.locator(".academic-subject-result").count()>=5,"Every latest report subject")
    require(page.locator(".academic-evidence-ixl").count()==1,"IXL visible")
    require(page.locator(".academic-evidence-core").count()==1,"Core visible")
    require(page.locator(".academic-evidence-fp").count()==1,"F&P visible")
    require(page.locator(".academic-evidence-card").count()==3,"No extra irrelevant scores")
    years=page.locator(".academic-report-years button")
    if years.count()>=2:
     old=years.nth(1).get_attribute("data-academic-report-year")
     years.nth(1).click()
     require(page.locator('[data-academic-report-year="'+old+'"]').get_attribute("aria-pressed")=="true",
             "Previous issued year displayed")
     require(old in page.locator(".academic-report-meta").inner_text(),"History content updates")
    capture(page,"03-grade3-profile-academic-history")
    page.locator('[data-action="back"]').click()
    return "Faculty sees each subject and up to three issued years, plus skill check-in timelines"
   run("Faculty individual academic history",student_profile,page)

   def primary_and_secondary():
    set_class("K")
    require(page.locator('[data-academic-mode="core"]').count()==1,"K Core available")
    require(page.locator('[data-academic-mode="fp"]').count()==1,"K F&P available")
    require(page.locator('[data-academic-mode="ixl"]').count()==0,"K IXL must be absent")
    set_class("G7")
    require(page.locator('[data-academic-mode="ixl"]').count()==1,"G7 IXL available")
    require(page.locator('[data-academic-mode="core"]').count()==0,"G7 Core absent")
    require(page.locator('[data-academic-mode="fp"]').count()==0,"G7 F&P absent")
    set_class("G11")
    require(page.locator(".academic-mode-tabs button").count()==1,"G11 only report cards")
    require(page.locator('[data-academic-mode="ixl"]').count()==0,"No IXL in G11")
    set_class("PK3")
    require("No completed reports yet" in page.locator(".academic-class-panel").inner_text(),
            "PK3 has no invented final report")
    return "K, G7, G11, PK3 follow exact grade-specific availability"
   run("All class grade eligibility and no fabricated current final grades",primary_and_secondary,page)

   def student_selector():
    page.locator('[data-role="student"]').click()
    require(page.locator('[data-select="student-grade"]').count()==1,"Grade picker added")
    for grade,expected in [('K',['core','fp']),('G1',['ixl','core','fp']),
                           ('G5',['ixl','core','fp']),('G7',['ixl']),('G12',[])]:
     page.locator('[data-select="student-grade"]').select_option(grade)
     require(page.locator('[data-select="student"] option').count()==80,
             "Student list limited to one grade "+grade)
     require("· "+grade in page.locator(".profile-head").inner_text(),
             "Selected student matches grade "+grade)
     for mode in ['ixl','core','fp']:
      expect=mode in expected
      require((page.locator(".academic-evidence-"+mode).count()==1)==expect,
              grade+" eligibility: "+mode)
     require(page.locator(".academic-profile").count()==1,"Student report area visible")
     require(page.locator(".academic-subject-result").count()>=5,
             "Recent subject report available for "+grade)
     if grade=='K':capture(page,"04-student-kindergarten-phonics-reading")
     if grade=='G5':capture(page,"05-student-grade5-full-journey")
     if grade=='G12':capture(page,"06-student-grade12-diploma-reports")
    return "Student grade dropdown unlocks K–G2 and all grade-specific academic measures"
   run("Student all-grade selection and individual learning evidence",student_selector,page)

   def student_history():
    page.locator('[data-select="student-grade"]').select_option("G12")
    d=mapping["G12"]
    page.locator('[data-select="student"]').select_option(d["student"])
    latest=page.locator('.academic-report-years button').first
    require('2025–26' in latest.inner_text(),"Latest is last completed report")
    yearBtns=page.locator(".academic-report-years button")
    require(yearBtns.count()>=2,"Historical G12 learner with at least 2 issued years")
    older=yearBtns.nth(yearBtns.count()-1)
    label=older.get_attribute('data-academic-report-year')
    older.click()
    require(label in page.locator('.academic-report-meta').inner_text(),"Selected historical year")
    require("IB MYP" in page.locator(".academic-report-meta").inner_text() or
            "IB Diploma" in page.locator(".academic-report-meta").inner_text(),"Proper framework")
    require("must not be averaged or compared directly" in page.locator(".academic-report-note").inner_text(),
            "Explain noncomparable scales")
    return "Student can choose previous years with MYP/DP framework labels"
   run("Student report history and appropriate grade framework",student_history,page)

   def protections():
    require("fictional" in page.locator(".notice").inner_text().lower(),"Demo status clear")
    require("2026–27" not in page.locator(".academic-report-years").inner_text(),"No future report")
    for role,selector in [('board','.board-strength-grid'),('leader','.leader-kpis')]:
     page.locator('[data-role="'+role+'"]').click()
     require(page.locator(selector).count()==1,"Unrelated "+role+" view intact")
    require(not js,"Chrome JavaScript exceptions "+str(js))
    return "Board and Leader experiences remain intact with no live student data"
   run("Isolation of other roles and no final current report grades",protections,page)
   ctx.close()

   for width,height in [(1920,1080),(1280,900),(390,844)]:
    c=browser.new_context(viewport={"width":width,"height":height},has_touch=width<600,is_mobile=width<600)
    p=c.new_page();errors=[]
    p.on("pageerror",lambda e:errors.append(str(e)))
    def layout():
     p.goto(BASE+"/#/faculty",wait_until="domcontentloaded")
     p.locator(".academic-class-panel").wait_for(timeout=15000)
     require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
             "Faculty page overflow "+str(width))
     p.locator('[data-role="student"]').click()
     p.locator('[data-select="student-grade"]').select_option("G3")
     require(p.locator(".academic-profile").count()==1,"Student profile")
     require(p.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
             "Student page overflow "+str(width))
     if width==1920:capture(p,"07-student-large-chrome")
     if width==390:capture(p,"08-student-mobile-smoke")
     require(not errors,"JS errors at "+str(width)+": "+str(errors))
     return str(width)+"px responsive layout"
    run("Chrome responsive "+str(width)+"px",layout,p);c.close()
  finally:browser.close()
 passed=sum(item["passed"] for item in checks)
 (OUT/"summary.json").write_text(json.dumps({"passed":passed,"total":len(checks),"checks":checks},indent=2))
 print("SUMMARY",passed,"/",len(checks),flush=True)
 return 0 if passed==len(checks) else 1
if __name__=="__main__":raise SystemExit(main())

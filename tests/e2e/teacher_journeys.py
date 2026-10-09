"""AISG My Learners first-release teacher usability regression tests.
Ten simulated persona journeys; these do not substitute for human teacher testing.
Run with a local web server and playwright + installed Chromium.
"""
import os,re,json,time,shutil,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('MYLEARNERS_URL','http://127.0.0.1:8765').rstrip('/')
OUT=Path(os.environ.get('MYLEARNERS_QA_DIR','qa-artifacts'))
(OUT/'screenshots').mkdir(parents=True,exist_ok=True)
PEOPLE=[
 ('PK3 learning and guidance','Karen Robb','PK3-A','early'),
 ('Kindergarten attendance','Kenya Colebrooke','K-A','attendance'),
 ('Grade 2 class search','Kylie M Munce','G2-A','search'),
 ('Grade 4 MAP growth',"Brittany O'Neal",'G4-A','growth'),
 ('Grade 5 learning evidence','Audrey Lawler','G5-A','academic'),
 ('Grade 7 class switching','Zach Navarro','G7-A','multiclass'),
 ('Grade 8 Reading MAP','Jesse Ridolfo','G8-B','reading'),
 ('Grade 9 classroom information','Joseph Boettcher','G9-C','support'),
 ('Grade 10 attendance and return','Alexis Partee','G10-D','filter'),
 ('Grade 12 DP mobile','Kennedi Crosby','G12-A','dp')
]
def check(v,m):
 if not v:raise AssertionError(m)
def load(page,url='home'):
 page.goto(BASE+'/#/'+url,wait_until='domcontentloaded')
 expect(page.locator('.first-release')).to_be_visible(timeout=15000)
def persona(page,name):
 option=page.locator('#v2-faculty option').filter(has_text=name).first
 value=option.get_attribute('value')
 check(bool(value),'Faculty persona missing: '+name)
 page.locator('#v2-faculty').select_option(value)
 expect(page.locator('#v2-faculty')).to_have_value(value)
def class_page(page,id):
 page.locator('.v2-nav [data-nav="class"]').click()
 page.locator('#v2-class-select').select_option(id)
 expect(page).to_have_url(re.compile('#/class/'+re.escape(id)+'$'))
def open_student(page):
 btn=page.locator('button[data-open-student]').first
 expect(btn).to_be_visible()
 sid=btn.get_attribute('data-open-student')
 btn.click()
 expect(page.locator('.v2-profile-hero h1')).to_be_visible()
 return sid
def tab(page,t):
 page.locator('.v2-profile-tabs [data-student-tab="'+t+'"]').click()
 expect(page.locator('#v2-student-panel')).to_be_visible()
 check(page.url.endswith('/'+t) if t!='overview' else bool(re.search('/student/DEMO-[0-9]{4}$',page.url)),
  'Profile tab route not shareable: '+t)
def back(page,path):
 page.locator('[data-return-profile]').click()
 expect(page).to_have_url(re.compile('#/'+re.escape(path)+'$'))
def journey(browser,index,person):
 name,staff,cid,kind=person
 mobile=kind=='dp'
 context=browser.new_context(viewport={'width':390 if mobile else 1440,'height':844 if mobile else 900},locale='en-GB')
 page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 started=time.monotonic()
 try:
  load(page);persona(page,staff)
  expect(page.locator('.launch-class-grid')).to_be_visible()
  check(page.locator('.v2-nav [data-nav]').count()==4,'Not exactly four navigation destinations')
  check(page.locator('[data-create-action],[data-group-student],[data-insight]').count()==0,'An advanced feature remains visible')
  if kind=='growth':
   page.locator('.v2-nav [data-nav="growth"]').click()
   expect(page.locator('.v2-growth-banner')).to_be_visible()
   page.locator('[data-open-class="'+cid+'"]').first.click()
   expect(page.locator('[data-return-class]')).to_contain_text('MAP Growth')
   page.locator('[data-return-class]').click()
   expect(page).to_have_url(re.compile('#/growth$'))
   page.locator('[data-target-tab="map"]').first.click()
   expect(page.locator('.growth-summary')).to_be_visible()
   page.locator('.rit-details summary').click()
   expect(page.locator('.rit-details')).to_have_attribute('open','')
   back(page,'growth')
  else:
   if mobile:
    page.locator('[data-menu]').first.click()
    expect(page.locator('.v2-sidebar.open')).to_be_visible()
   class_page(page,cid)
   expect(page.locator('.launch-roster-table')).to_be_visible()
   if kind=='filter':
    page.locator('[data-roster-filter="attendance"]').click()
    expect(page.locator('[data-roster-filter="attendance"]')).to_have_attribute('aria-pressed','true')
    count=page.locator('tbody tr').count()
    if count==0:
     page.locator('[data-roster-filter="all"]').click();count=20
   if kind=='search':
    search=page.locator('#v2-roster-search')
    first=page.locator('tbody [data-open-student]').first
    student_name=first.locator('strong').inner_text()
    search.fill(student_name)
    expect(page.locator('tbody tr')).to_have_count(1)
   if kind=='multiclass':
    values=page.locator('#v2-class-select option').evaluate_all('(els)=>els.map(e=>e.value)')
    check(len(values)>=2,'A secondary demo teacher needs multiple fictional classes')
    another=next(x for x in values if x!=cid)
    page.locator('#v2-class-select').select_option(another)
    expect(page.locator('#v2-class-select')).to_have_value(another)
    page.locator('#v2-class-select').select_option(cid)
   if kind=='attendance':
    expect(page.locator('.launch-class-stats')).to_contain_text('Absent')
   sid=open_student(page)
   if kind in ('early','dp','academic','search'):tab(page,'learning')
   if kind in ('early','support','dp'):tab(page,'support')
   if kind in ('filter','attendance'):tab(page,'attendance')
   if kind=='reading':
    tab(page,'map')
    page.locator('[data-subject="Reading"]').click()
    expect(page.locator('[data-subject="Reading"]')).to_have_attribute('aria-pressed','true')
   if kind=='dp':
    tab(page,'map')
    expect(page.get_by_text('MAP not assessed')).to_be_visible()
   back(page,'class/'+cid)
   if kind=='filter' and count!=20:
    expect(page.locator('[data-roster-filter="attendance"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('tbody tr')).to_have_count(count)
   if kind=='search':
    expect(page.locator('#v2-roster-search')).to_have_value(student_name)
   if mobile:
    page.locator('[data-menu]').first.click()
    expect(page.locator('.v2-sidebar.open')).to_be_visible()
   page.locator('.v2-nav [data-nav="home"]').click()
   expect(page).to_have_url(re.compile('#/home$'))
  check(not errors,'Unexpected Javascript errors: '+str(errors))
  return {'name':name,'teacher':staff,'class':cid,'status':'passed',
    'automationElapsedSeconds':round(time.monotonic()-started,2)}
 except Exception as exc:
  path=str(OUT/'screenshots'/f'failure-{index:02d}.png')
  try:page.screenshot(path=path,full_page=True)
  except Exception:pass
  return {'name':name,'teacher':staff,'class':cid,'status':'failed','error':str(exc)[:1100],
   'trace':traceback.format_exc()[-1600:],'automationElapsedSeconds':round(time.monotonic()-started,2)}
 finally:context.close()
def responsive(browser):
 result=[]
 for width,height in [(1920,1080),(1440,900),(1280,800),(1024,768),(768,1024),(390,844),(360,800)]:
  context=browser.new_context(viewport={'width':width,'height':height})
  page=context.new_page()
  for route in ['home','class/G7-A','learners','growth','student/DEMO-0721']:
   load(page,route)
   checkdata=page.evaluate('''()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     headings:document.querySelectorAll('main h1').length,logo:!!document.querySelector('img[alt*="American International School"]'),
     actionButtons:document.querySelectorAll('[data-create-action],[data-insight]').length})''')
   good=checkdata['overflow']<=2 and checkdata['headings']>=1 and checkdata['logo'] and checkdata['actionButtons']==0
   result.append({'viewport':f'{width}x{height}','route':route,'status':'passed' if good else 'failed',**checkdata})
   if width in [1440,390] and route in ['home','class/G7-A','growth','student/DEMO-0721']:
    page.screenshot(path=str(OUT/'screenshots'/f'{width}-{route.replace("/","-")}.png'),full_page=True)
  context.close()
 return result
def tag_journeys(browser):
 """Verify that all five support badges filter correctly and link to fictional guidance."""
 result=[]
 context=browser.new_context(viewport={'width':1440,'height':900},locale='en-GB')
 page=context.new_page()
 try:
  load(page)
  persona(page,'Zach Navarro')
  class_page(page,'G7-A')
  for tag in ['eal','ss','iep','medical','behavioural']:
   page.locator('#v2-support-filter').select_option(tag)
   expect(page.locator('#v2-support-filter')).to_have_value(tag)
   chips=page.locator('.launch-roster-table [data-tag-focus="'+tag+'"]')
   check(chips.count()>0,tag+' badge missing in the filtered fictional roster')
   student=chips.first.get_attribute('data-open-student')
   chips.first.click()
   expect(page).to_have_url(re.compile('#/student/'+re.escape(student)+'/support/'+tag+'$'))
   detail=page.locator('[data-support-detail="'+tag+'"]')
   expect(detail).to_be_visible()
   expect(detail).to_have_class(re.compile('selected'))
   expect(detail).to_contain_text('Useful classroom approaches')
   if tag in ['medical','behavioural']:
    expect(detail).to_contain_text('Detailed health, behavioural, counselling or safeguarding records are not available')
   if tag=='medical':
    page.screenshot(path=str(OUT/'screenshots'/'1440-medical-tag-guidance.png'),full_page=True)
   page.locator('[data-return-profile]').click()
   expect(page).to_have_url(re.compile('#/class/G7-A$'))
   expect(page.locator('#v2-support-filter')).to_have_value(tag)
   result.append({'tag':tag,'status':'passed'})
  page.screenshot(path=str(OUT/'screenshots'/'1440-class-support-tags.png'),full_page=True)
 finally:context.close()
 phone=browser.new_context(viewport={'width':390,'height':844})
 pg=phone.new_page()
 try:
  load(pg)
  persona(pg,'Zach Navarro')
  pg.locator('[data-menu]').first.click()
  class_page(pg,'G7-A')
  pg.locator('#v2-support-filter').select_option('medical')
  badge=pg.locator('.launch-roster-table [data-tag-focus="medical"]').first
  expect(badge).to_be_visible()
  badge.click()
  expect(pg.locator('[data-support-detail="medical"]')).to_be_visible()
  pg.screenshot(path=str(OUT/'screenshots'/'390-mobile-support-guidance.png'),full_page=True)
  result.append({'tag':'medical-mobile','status':'passed'})
 finally:phone.close()
 return result

def keyboard(browser):
 context=browser.new_context(viewport={'width':1440,'height':900})
 page=context.new_page()
 load(page)
 page.locator('[data-open-class="G7-A"]').first.click()
 sid=open_student(page)
 page.locator('[data-student-tab="overview"]').focus()
 page.keyboard.press('ArrowRight')
 check(page.url.endswith('/learning'),'Learner tabs require working keyboard arrows')
 page.go_back()
 expect(page).to_have_url(re.compile('#/student/'+sid+'$'))
 page.locator('[data-return-profile]').click()
 expect(page).to_have_url(re.compile('#/class/G7-A$'))
 page.locator('.v2-nav [data-nav="learners"]').press('Enter')
 expect(page).to_have_url(re.compile('#/learners$'))
 context.close()
 return {'keyboardTabs':True,'browserHistory':True,'contextReturn':True,'keyboardNavigation':True}

def main():
 chrome=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium') or '/usr/bin/chromium'
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   journeys=[]
   for i,person in enumerate(PEOPLE,1):
    result=journey(browser,i,person);journeys.append(result)
    print(('PASS' if result['status']=='passed' else 'FAIL'),result['name'],result.get('error','')[:140],flush=True)
   sizes=responsive(browser)
   try: tags=tag_journeys(browser)
   except Exception as ex: tags=[{'tag':'tag-flow','status':'failed','error':str(ex)}]
   try: keys=keyboard(browser)
   except Exception as ex: keys={'error':str(ex),'keyboardTabs':False,'browserHistory':False,'contextReturn':False,'keyboardNavigation':False}
   summary={'journeysPassed':sum(j['status']=='passed' for j in journeys),'journeysTotal':len(journeys),
    'responsivePagesPassed':sum(v['status']=='passed' for v in sizes),'responsivePagesTotal':len(sizes),
    'supportTagChecksPassed':sum(t['status']=='passed' for t in tags),
    'supportTagChecksTotal':6,'keyboard':keys}
   (OUT/'ux-journeys.json').write_text(json.dumps({'method':'simulated personas in Chromium, not human teacher research',
     'baseUrl':BASE,'summary':summary,'journeys':journeys,'responsive':sizes,'supportTags':tags},indent=2))
   print('SUMMARY',json.dumps(summary),flush=True)
   return int(summary['journeysPassed']!=10 or summary['responsivePagesPassed']!=len(sizes) or
     summary['supportTagChecksPassed']!=6 or
     not all(keys.get(k) for k in ['keyboardTabs','browserHistory','contextReturn','keyboardNavigation']))
  finally:browser.close()

if __name__=='__main__':raise SystemExit(main())

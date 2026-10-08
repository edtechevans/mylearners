"""Ten simulated AISG teacher journeys in real Chromium (Playwright).
These are expert workflow simulations, not human teacher usability observations.
Run: MYLEARNERS_URL=http://127.0.0.1:8765 python tests/e2e/teacher_journeys.py
Requires: pip install playwright==1.57.0; Chromium or Google Chrome installed.
"""
import os, re, json, time, shutil, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('MYLEARNERS_URL','http://127.0.0.1:8765').rstrip('/')
OUT=Path(os.environ.get('MYLEARNERS_QA_DIR','qa-artifacts'))
(OUT/'screenshots').mkdir(parents=True,exist_ok=True)
RESULTS=[]
PERSONAS=[
 ('PK3 development & guidance','Karen Robb','PK3-A','early'),
 ('Kindergarten temporary groups','Kenya Colebrooke','K-A','groups'),
 ('Grade 2 filtered return','Kylie M Munce','G2-A','filter'),
 ('Grade 4 growth context',"Brittany O'Neal",'G4-A','growth'),
 ('Grade 5 follow-up','Audrey Lawler','G5-A','actions'),
 ('Grade 7 multi-class','Zach Navarro','G7-A','multiclass'),
 ('Grade 8 reading development','Jesse Ridolfo','G8-B','reading'),
 ('Grade 9 scientific reasoning','Joseph Boettcher','G9-C','evidence'),
 ('Grade 10 follow-up review','Alexis Partee','G10-D','review'),
 ('Grade 12 DP learning','Kennedi Crosby','G12-A','dp'),
]
def check(value,message):
 if not value:raise AssertionError(message)
def load(page,route='today'):
 page.goto(BASE+'/#/'+route,wait_until='domcontentloaded')
 expect(page.locator('.v2-app')).to_be_visible(timeout=15000)
def persona(page,name):
 opt=page.locator('#v2-faculty option').filter(has_text=name).first
 value=opt.get_attribute('value')
 check(value, 'Missing faculty '+name)
 page.locator('#v2-faculty').select_option(value)
 expect(page.locator('#v2-faculty')).to_have_value(value)
def class_page(page,id):
 page.locator('[data-nav="class"]').click()
 page.locator('#v2-class-select').select_option(id)
 expect(page).to_have_url(re.compile('#/class/'+re.escape(id)+'$'))
def open_student(page):
 row=page.locator('button[data-open-student]').first
 expect(row).to_be_visible()
 student=row.get_attribute('data-open-student');row.click()
 expect(page.locator('.v2-profile-hero h1')).to_be_visible()
 return student
def tab(page,name):
 page.locator('[data-student-tab="'+name+'"]').click()
 expect(page.locator('#v2-student-panel')).to_be_visible()
 check(page.url.endswith('/'+name) if name!='overview' else bool(re.search(r'/student/DEMO-\d{4}$',page.url)),
       'Profile tab not deep-linked: '+name)
def back(page,route):
 page.locator('[data-return-profile]').click()
 expect(page).to_have_url(re.compile('#/'+re.escape(route)+'$'))
def make_action(page,class_id,title):
 page.locator('[data-create-action="'+class_id+'"]').first.click()
 form=page.locator('#v2-create-form')
 expect(form).to_be_visible()
 form.locator('[name="title"]').fill(title)
 form.locator('[name="strategy"]').fill('Try modelling, partner discussion and an exit check.')
 form.locator('button[type="submit"]').click()
 expect(page).to_have_url(re.compile('#/actions$'))
 expect(page.locator('.v2-action-card',has_text=title)).to_be_visible()
def journey(browser,index,item):
 name,person,cid,kind=item
 context=browser.new_context(viewport={'width':390 if kind=='dp' else 1440,'height':844 if kind=='dp' else 900},locale='en-GB')
 page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.on('console',lambda msg: print('BROWSER-CONSOLE',name,msg.text[:900],flush=True) if '[AISG-UX-QA]' in msg.text else None)
 start=time.monotonic()
 try:
  load(page)
  persona(page,person)
  if kind=='growth':
   page.locator('.v2-nav [data-nav="growth"]').click()
   expect(page.locator('.v2-growth-banner')).to_be_visible()
   page.locator('[data-open-class="'+cid+'"]').first.click()
   expect(page.locator('[data-return-class]')).to_contain_text('Growth & Evidence')
   page.locator('[data-return-class]').click()
   expect(page).to_have_url(re.compile('#/growth$'))
   page.locator('[data-target-tab="map"]').first.click()
   expect(page.locator('.growth-summary')).to_be_visible()
   page.locator('.rit-details summary').click()
   expect(page.locator('.rit-details')).to_have_attribute('open','')
   back(page,'growth')
  else:
   if kind=='dp':
    page.locator('[data-menu]').first.click()
    expect(page.locator('.v2-sidebar.open')).to_be_visible()
   class_page(page,cid)
   if kind in ('filter','evidence'):
    page.locator('[data-roster-filter="revisit"]').click()
    before=page.locator('tbody tr').count()
   if kind=='groups':
    page.locator('.v2-tabs [data-class-mode="groups"]').click()
    chooser=page.locator('[data-group-student]').first
    student=chooser.get_attribute('data-group-student')
    old=chooser.input_value();new='extend' if old!='extend' else 'secure'
    chooser.select_option(new)
    expect(page.locator('[data-group-student="'+student+'"]').first).to_have_value(new)
    page.reload()
    expect(page.locator('[data-group-student="'+student+'"]').first).to_have_value(new)
    page.once('dialog',lambda dlg:dlg.accept())
    page.locator('[data-reset-groups]').click()
    expect(page.locator('[data-group-student="'+student+'"]').first).to_have_value(old)
    page.locator('.v2-tabs [data-class-mode="roster"]').click()
   if kind=='evidence':
    page.locator('[data-insight]').first.click()
    expect(page.get_by_role('dialog')).to_contain_text('DECISION RULE')
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).to_have_count(0)
   open_student(page)
   if kind in ('early','filter','dp'):tab(page,'learning');tab(page,'support')
   if kind in ('reading','multiclass','review'):tab(page,'attendance')
   if kind=='reading':
    tab(page,'map');page.locator('[data-subject="Reading"]').click()
    expect(page.locator('[data-subject="Reading"]')).to_have_attribute('aria-pressed','true')
   if kind=='dp':
    tab(page,'map');expect(page.get_by_text('MAP not assessed')).to_be_visible()
   back(page,'class/'+cid)
   if kind in ('filter','evidence'):
    expect(page.locator('[data-roster-filter="revisit"]')).to_have_attribute('aria-pressed','true')
    check(page.locator('tbody tr').count()==before,'Filtered roster was not retained')
   if kind=='multiclass':
    opts=page.locator('#v2-class-select option').evaluate_all('(es)=>es.map(e=>e.value)')
    other=next(x for x in opts if x!=cid)
    page.locator('#v2-class-select').select_option(other)
    expect(page.locator('#v2-class-select')).to_have_value(other)
   if kind in ('actions','review','dp'):
    make_action(page,cid,'Teacher follow-up '+cid)
    if kind=='review':
     card=page.locator('.v2-action-card',has_text='Teacher follow-up '+cid)
     card.locator('[data-review-action]').click()
     form=page.locator('#v2-review-form')
     form.locator('[name="outcome"]').fill('Reviewed evidence after the lesson.')
     form.locator('[name="status"]').select_option('completed')
     print('ACTION REVIEW INPUT:',form.locator('[name="status"]').input_value(),form.locator('[name="id"]').input_value(),
       form.evaluate('(f)=>({nameStatus:f.elements.namedItem("status")?.value,submittedStatus:new FormData(f).get("status"),all:[...new FormData(f)]})'),flush=True)
     form.locator('[type="submit"]').click()
     print('ACTION REVIEW URL:',page.url,'FORM EXISTS:',page.locator('#v2-review-form').count(),'TOAST:',page.locator('.v2-toast').all_inner_texts(),flush=True)
     print('ACTION REVIEW RESULT:',page.locator('.v2-action-card',has_text='Teacher follow-up '+cid).inner_text()[:280],
       'ERRORS:',page.locator('.v2-form-error').all_inner_texts(),flush=True)
     print('ACTION LOCAL STORAGE:',page.evaluate('Object.entries(localStorage).filter(([k])=>k.includes("aisg-mylearners-v2-actions")).map(([k,v])=>[k,v.slice(0,480)])'),flush=True)
     expect(page.locator('.v2-action-card',has_text='Teacher follow-up '+cid)).to_contain_text('Reviewed')
     page.locator('.v2-action-card',has_text='Teacher follow-up '+cid).locator('[data-open-class]').click()
    else:
     page.locator('[data-return-actions]').click()
    expect(page).to_have_url(re.compile('#/class/'+re.escape(cid)+'$'))
   if kind=='dp':
    page.locator('[data-menu]').first.click()
    expect(page.locator('.v2-sidebar.open')).to_be_visible()
   page.locator('.v2-nav [data-nav="today"]').click()
   expect(page).to_have_url(re.compile('#/today
  check(not errors, 'Browser JavaScript errors: '+str(errors))
  row={'name':name,'persona':person,'class':cid,'status':'passed',
       'automationElapsedSeconds':round(time.monotonic()-start,2)}
 except Exception as exc:
  filename='failure-'+str(index).zfill(2)+'.png'
  try:page.screenshot(path=str(OUT/'screenshots'/filename),full_page=True)
  except Exception:pass
  row={'name':name,'persona':person,'class':cid,'status':'failed',
       'error':str(exc)[:1200],'trace':traceback.format_exc()[-1800:],
       'automationElapsedSeconds':round(time.monotonic()-start,2)}
 finally:context.close()
 return row
def responsive(browser):
 report=[]
 for w,h in [(1920,1080),(1440,900),(1280,800),(1024,768),(768,1024),(390,844),(360,800)]:
  ctx=browser.new_context(viewport={'width':w,'height':h});page=ctx.new_page()
  for route in ['today','class','learners','growth','actions','student/DEMO-0721']:
   load(page,route)
   v=page.evaluate('''() => ({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        h1:document.querySelectorAll("main h1").length,
        logo:!!document.querySelector("img[alt*='American International School']")})''')
   good=v['overflow']<=2 and v['h1']>=1 and v['logo']
   report.append({'viewport':f'{w}x{h}','route':route,'status':'passed' if good else 'failed',**v})
   if w in (1440,390) and route in ('today','class','growth','actions','student/DEMO-0721'):
    page.screenshot(path=str(OUT/'screenshots'/f'{w}-{route.replace("/","-")}.png'),full_page=True)
  ctx.close()
 return report
def keyboard(browser):
 ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();load(page)
 page.locator('.v2-day-hero [data-create-action]').click()
 focused=page.evaluate('document.querySelector(".v2-modal")?.contains(document.activeElement)')
 page.keyboard.press('Escape');expect(page.locator('.v2-modal')).to_have_count(0)
 page.locator('[data-open-class="G7-A"]').first.click()
 open_student(page)
 page.locator('[data-student-tab="overview"]').focus()
 page.keyboard.press('ArrowRight')
 check(page.url.endswith('/learning'),'Profile tabs not keyboard-accessible')
 page.go_back();expect(page).to_have_url(re.compile('#/student/DEMO-\d{4}$'))
 ctx.close()
 return {'modalFocus':bool(focused),'escapeClosed':True,'keyboardTabs':True,'historyBack':True}
def main():
 chrome=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium') or '/usr/bin/chromium'
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   for n,item in enumerate(PERSONAS,1):
    x=journey(browser,n,item);RESULTS.append(x)
    print(('PASS' if x['status']=='passed' else 'FAIL'),x['name'],x.get('error','')[:160],flush=True)
   sizes=responsive(browser)
   try: keys=keyboard(browser)
   except Exception as exc: keys={'error':str(exc),'modalFocus':False,'keyboardTabs':False,'historyBack':False}
   summary={'journeysPassed':sum(x['status']=='passed' for x in RESULTS),
            'journeysTotal':len(PERSONAS),
            'viewportPagesPassed':sum(x['status']=='passed' for x in sizes),
            'viewportPagesTotal':len(sizes),'keyboard':keys}
   output={'method':'Playwright automated simulated personas, not actual teacher participants',
            'baseUrl':BASE,'summary':summary,'journeys':RESULTS,'responsive':sizes}
   (OUT/'ux-journeys.json').write_text(json.dumps(output,indent=2,ensure_ascii=False))
   print('SUMMARY',json.dumps(summary),flush=True)
   return int(summary['journeysPassed']!=10 or summary['viewportPagesPassed']!=len(sizes) or not all(keys.get(k) for k in ['modalFocus','keyboardTabs','historyBack']))
  finally:browser.close()
if __name__=='__main__':raise SystemExit(main())
))
  check(not errors, 'Browser JavaScript errors: '+str(errors))
  row={'name':name,'persona':person,'class':cid,'status':'passed',
       'automationElapsedSeconds':round(time.monotonic()-start,2)}
 except Exception as exc:
  filename='failure-'+str(index).zfill(2)+'.png'
  try:page.screenshot(path=str(OUT/'screenshots'/filename),full_page=True)
  except Exception:pass
  row={'name':name,'persona':person,'class':cid,'status':'failed',
       'error':str(exc)[:1200],'trace':traceback.format_exc()[-1800:],
       'automationElapsedSeconds':round(time.monotonic()-start,2)}
 finally:context.close()
 return row
def responsive(browser):
 report=[]
 for w,h in [(1920,1080),(1440,900),(1280,800),(1024,768),(768,1024),(390,844),(360,800)]:
  ctx=browser.new_context(viewport={'width':w,'height':h});page=ctx.new_page()
  for route in ['today','class','learners','growth','actions','student/DEMO-0721']:
   load(page,route)
   v=page.evaluate('''() => ({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        h1:document.querySelectorAll("main h1").length,
        logo:!!document.querySelector("img[alt*='American International School']")})''')
   good=v['overflow']<=2 and v['h1']>=1 and v['logo']
   report.append({'viewport':f'{w}x{h}','route':route,'status':'passed' if good else 'failed',**v})
   if w in (1440,390) and route in ('today','class','growth','actions','student/DEMO-0721'):
    page.screenshot(path=str(OUT/'screenshots'/f'{w}-{route.replace("/","-")}.png'),full_page=True)
  ctx.close()
 return report
def keyboard(browser):
 ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();load(page)
 page.locator('.v2-day-hero [data-create-action]').click()
 focused=page.evaluate('document.querySelector(".v2-modal")?.contains(document.activeElement)')
 page.keyboard.press('Escape');expect(page.locator('.v2-modal')).to_have_count(0)
 page.locator('[data-open-class="G7-A"]').first.click()
 open_student(page)
 page.locator('[data-student-tab="overview"]').focus()
 page.keyboard.press('ArrowRight')
 check(page.url.endswith('/learning'),'Profile tabs not keyboard-accessible')
 page.go_back();expect(page).to_have_url(re.compile('#/student/DEMO-\d{4}$'))
 ctx.close()
 return {'modalFocus':bool(focused),'escapeClosed':True,'keyboardTabs':True,'historyBack':True}
def main():
 chrome=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium') or '/usr/bin/chromium'
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   for n,item in enumerate(PERSONAS,1):
    x=journey(browser,n,item);RESULTS.append(x)
    print(('PASS' if x['status']=='passed' else 'FAIL'),x['name'],x.get('error','')[:160],flush=True)
   sizes=responsive(browser)
   try: keys=keyboard(browser)
   except Exception as exc: keys={'error':str(exc),'modalFocus':False,'keyboardTabs':False,'historyBack':False}
   summary={'journeysPassed':sum(x['status']=='passed' for x in RESULTS),
            'journeysTotal':len(PERSONAS),
            'viewportPagesPassed':sum(x['status']=='passed' for x in sizes),
            'viewportPagesTotal':len(sizes),'keyboard':keys}
   output={'method':'Playwright automated simulated personas, not actual teacher participants',
            'baseUrl':BASE,'summary':summary,'journeys':RESULTS,'responsive':sizes}
   (OUT/'ux-journeys.json').write_text(json.dumps(output,indent=2,ensure_ascii=False))
   print('SUMMARY',json.dumps(summary),flush=True)
   return int(summary['journeysPassed']!=10 or summary['viewportPagesPassed']!=len(sizes) or not all(keys.get(k) for k in ['modalFocus','keyboardTabs','historyBack']))
  finally:browser.close()
if __name__=='__main__':raise SystemExit(main())

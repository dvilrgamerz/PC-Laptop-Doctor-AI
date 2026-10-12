const test=require('node:test');
const assert=require('node:assert/strict');
const {isSafeExternalLink,secureDoctorWindow}=require('../electron/security.cjs');
test('rejects file, javascript, data, local HTTP and credential URLs',()=>{
  for(const url of ['file:///C:/secret','javascript:alert(1)','data:text/html,test','http://example.com','https://user:secret@example.com','bad']){
    assert.equal(isSafeExternalLink(url),false,url);
  }
  assert.equal(isSafeExternalLink('https://example.com/docs'),true);
});
test('desktop window denies web permission and in-app navigation',async()=>{
  let popup,nav,permission;const opened=[];
  const win={webContents:{
    setWindowOpenHandler(fn){popup=fn},
    on(name,fn){if(name==='will-navigate')nav=fn},
    session:{setPermissionRequestHandler(fn){permission=fn}}
  }};
  secureDoctorWindow(win,{openExternal:async url=>opened.push(url)});
  assert.equal(popup({url:'file:///tmp/secret'}).action,'deny');
  assert.equal(popup({url:'https://example.com/help'}).action,'deny');
  await Promise.resolve();
  assert.deepEqual(opened,['https://example.com/help']);
  let prevented=false;nav({preventDefault(){prevented=true}});
  assert.equal(prevented,true);
  let allowed;permission(null,'camera',value=>allowed=value);
  assert.equal(allowed,false);
});

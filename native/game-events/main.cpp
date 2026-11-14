// Optional read-only WMI event watcher. No elevation, service changes or process control.
// Emits wake-up events only; Electron re-verifies candidates against trusted game paths.
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <wbemidl.h>
#include <iostream>
#include <string>
#pragma comment(lib, "wbemuuid.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")

int wmain(){
 HRESULT hr=CoInitializeEx(nullptr,COINIT_MULTITHREADED);
 if(FAILED(hr)){return 2;}
 const HRESULT sec=CoInitializeSecurity(nullptr,-1,nullptr,nullptr,
  RPC_C_AUTHN_LEVEL_DEFAULT,RPC_C_IMP_LEVEL_IMPERSONATE,nullptr,EOAC_NONE,nullptr);
 if(FAILED(sec) && sec!=RPC_E_TOO_LATE){CoUninitialize();return 3;}
 IWbemLocator* locator=nullptr;
 hr=CoCreateInstance(CLSID_WbemLocator,nullptr,CLSCTX_INPROC_SERVER,
  IID_IWbemLocator,reinterpret_cast<void**>(&locator));
 if(FAILED(hr)||!locator){CoUninitialize();return 4;}
 IWbemServices* services=nullptr;
 BSTR ns=SysAllocString(L"ROOT\\CIMV2");
 hr=locator->ConnectServer(ns,nullptr,nullptr,nullptr,0,nullptr,nullptr,&services);
 SysFreeString(ns);locator->Release();
 if(FAILED(hr)||!services){CoUninitialize();return 5;}
 hr=CoSetProxyBlanket(services,RPC_C_AUTHN_WINNT,RPC_C_AUTHZ_NONE,nullptr,
  RPC_C_AUTHN_LEVEL_CALL,RPC_C_IMP_LEVEL_IMPERSONATE,nullptr,EOAC_NONE);
 if(FAILED(hr)){services->Release();CoUninitialize();return 6;}
 BSTR language=SysAllocString(L"WQL");
 BSTR query=SysAllocString(L"SELECT * FROM Win32_ProcessTrace");
 IEnumWbemClassObject* events=nullptr;
 hr=services->ExecNotificationQuery(language,query,
  WBEM_FLAG_RETURN_IMMEDIATELY|WBEM_FLAG_FORWARD_ONLY,nullptr,&events);
 SysFreeString(language);SysFreeString(query);
 services->Release();
 if(FAILED(hr)||!events){CoUninitialize();return 7;}
 std::cout<<"{\"watcher\":\"ready\"}"<<std::endl;
 while(std::cout.good()){
  IWbemClassObject* current=nullptr;
  ULONG returned=0;
  hr=events->Next(2000,1,&current,&returned);
  if(hr==WBEM_S_TIMEDOUT)continue;
  if(FAILED(hr))break;
  if(returned && current){
   std::cout<<"{\"event\":\"process-change\"}"<<std::endl;
   current->Release();
  }
 }
 events->Release();
 CoUninitialize();
 return 0;
}

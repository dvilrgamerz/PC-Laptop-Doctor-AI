// PC Doctor native booster: fixed, non-elevated, narrow process-scoped API.
// Does NOT stop services, terminate processes, suspend threads or change privileges.
// All requested process identity and original-state values are rechecked in Win32.
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <processthreadsapi.h>
#include <cstdint>
#include <cwchar>
#include <cwctype>
#include <iostream>
#include <limits>
#include <string>
#include <algorithm>
#include <vector>
#include <winsvc.h>
#pragma comment(lib, "advapi32.lib")

namespace {
struct Handle {
 HANDLE h = nullptr;
 explicit Handle(HANDLE p): h(p) {}
 ~Handle() { if(h && h!=INVALID_HANDLE_VALUE) CloseHandle(h); }
 Handle(const Handle&)=delete;
 Handle& operator=(const Handle&)=delete;
 explicit operator bool() const { return h && h!=INVALID_HANDLE_VALUE; }
};
void fail(const char* reason,DWORD code=0){
 std::cout << "{\"ok\":false,\"error\":\"" << reason << "\",\"win32Error\":" << code << "}\n";
}
void success(const char* extra=""){
 std::cout << "{\"ok\":true" << extra << "}\n";
}
bool parse(const wchar_t* input,std::uint64_t limit,std::uint64_t& value){
 if(!input || !*input) return false;
 std::uint64_t n=0;
 for(const wchar_t* p=input;*p;++p){
  if(*p<L'0'||*p>L'9')return false;
  const auto digit=static_cast<std::uint64_t>(*p-L'0');
  if(n>(limit-digit)/10)return false;
  n=n*10+digit;
 }
 value=n;
 return true;
}
std::wstring lower(std::wstring s){
 std::transform(s.begin(),s.end(),s.begin(),[](wchar_t c){return static_cast<wchar_t>(std::towlower(c));});
 return s;
}
bool prefix(const std::wstring& s,const std::wstring& p){
 return s.size()>=p.size()&&s.compare(0,p.size(),p)==0;
}
bool protectedImage(const std::wstring& p){
 const auto lo=lower(p);
 wchar_t win[MAX_PATH]{};
 if(GetWindowsDirectoryW(win,MAX_PATH)){
  std::wstring root=lower(win);
  if(!root.empty() && root.back()!=L'\\') root+=L'\\';
  if(prefix(lo,root))return true;
 }
 if(lo.find(L"\\windowsapps\\")!=std::wstring::npos)return true;
 const std::wstring filename=lo.substr(lo.find_last_of(L"\\")+1);
 const wchar_t* sensitive[]={L"easyanticheat",L"battleye",L"vanguard",L"vgc.exe",
  L"vgk",L"anticheat",L"msmpeng",L"securityhealth",L"defender",L"crowdstrike",
  L"sentinelone",L"bitdefender",L"kaspersky",L"malwarebytes",L"windefend",
  L"lsass.exe",L"svchost.exe",L"winlogon.exe",L"csrss.exe",L"dwm.exe",
  L"explorer.exe",L"steam.exe",L"steamwebhelper",L"epicgameslauncher",
  L"riotclient",L"beservice",L"nvcontainer",L"onedrive.exe",L"dropbox.exe"};
 for(const wchar_t* s:sensitive)if(filename.find(s)!=std::wstring::npos)return true;
 return false;
}
// Fail closed if the process belongs to a service or another Windows logon session.
bool forbiddenServiceOrSession(DWORD pid){
 DWORD ours=0,theirs=0;
 if(!ProcessIdToSessionId(GetCurrentProcessId(),&ours) ||
    !ProcessIdToSessionId(pid,&theirs) || ours!=theirs) return true;
 SC_HANDLE scm=OpenSCManagerW(nullptr,nullptr,SC_MANAGER_ENUMERATE_SERVICE);
 if(!scm)return true;
 DWORD required=0,returned=0,resume=0;
 const BOOL initial=EnumServicesStatusExW(scm,SC_ENUM_PROCESS_INFO,SERVICE_WIN32,
  SERVICE_STATE_ALL,nullptr,0,&required,&returned,&resume,nullptr);
 if(!initial && GetLastError()!=ERROR_MORE_DATA){CloseServiceHandle(scm);return true;}
 if(initial&&required==0){CloseServiceHandle(scm);return false;}
 std::vector<BYTE> buffer(static_cast<std::size_t>(required)+4096);
 required=0;returned=0;resume=0;
 const BOOL ok=EnumServicesStatusExW(scm,SC_ENUM_PROCESS_INFO,SERVICE_WIN32,
  SERVICE_STATE_ALL,buffer.data(),static_cast<DWORD>(buffer.size()),&required,&returned,&resume,nullptr);
 CloseServiceHandle(scm);
 if(!ok || resume!=0)return true;
 const auto services=reinterpret_cast<const ENUM_SERVICE_STATUS_PROCESSW*>(buffer.data());
 for(DWORD i=0;i<returned;++i){
  if(services[i].ServiceStatusProcess.dwProcessId==pid)return true;
 }
 return false;
}
bool identicalPath(const std::wstring& a,const std::wstring& b){
 // Fail closed on path aliases/reparse points. No search-path or shell expansion.
 if(a.empty()||b.empty()||a.size()>32760||b.size()>32760)return false;
 return CompareStringOrdinal(a.c_str(),-1,b.c_str(),-1,TRUE)==CSTR_EQUAL;
}
bool processPath(HANDLE h,std::wstring& image){
 std::wstring buf(32768,L'\0');
 DWORD chars=static_cast<DWORD>(buf.size());
 if(!QueryFullProcessImageNameW(h,0,buf.data(),&chars))return false;
 buf.resize(chars);
 image=std::move(buf);
 return true;
}
bool creationTicks(HANDLE h,std::uint64_t& out){
 FILETIME created{},exited{},kernel{},user{};
 if(!GetProcessTimes(h,&created,&exited,&kernel,&user))return false;
 ULARGE_INTEGER u{};
 u.LowPart=created.dwLowDateTime;
 u.HighPart=created.dwHighDateTime;
 // .NET DateTime ticks from 0001-01-01; compatible with beta.1 journals.
 out=u.QuadPart+504911232000000000ULL;
 return true;
}
void emitState(DWORD pid,std::uint64_t ticks,const PROCESS_POWER_THROTTLING_STATE& state){
 std::cout<<"{\"ok\":true,\"pid\":"<<pid<<",\"startTicks\":\""<<ticks
  <<"\",\"controlMask\":"<<state.ControlMask<<",\"stateMask\":"<<state.StateMask<<"}\n";
}
}
int wmain(int argc,wchar_t** argv){
 // inspect <pid> <full.exe>
 // probe <pid> <full.exe> <originalStartTicks>
 // apply <pid> <full.exe> <originalStartTicks> <beforeControl> <beforeState>
 // restore <pid> <full.exe> <originalStartTicks> <beforeControl> <beforeState> <appliedControl> <appliedState>
 if(argc<4){fail("Invalid fixed command");return 0;}
 const std::wstring op=argv[1];
 const bool inspect=op==L"inspect",probe=op==L"probe",apply=op==L"apply",restore=op==L"restore";
 if((inspect&&argc!=4)||(probe&&argc!=5)||(apply&&argc!=7)||(restore&&argc!=9)||
  (!inspect&&!probe&&!apply&&!restore)){fail("Unknown or incomplete command");return 0;}
 std::uint64_t requested=0;
 if(!parse(argv[2],std::numeric_limits<DWORD>::max(),requested)||requested<=4){
  fail("Invalid or protected process ID");return 0;
 }
 const auto pid=static_cast<DWORD>(requested);
 const std::wstring expected=argv[3];
 if(expected.size()<7 || expected.size()>1024 || !((expected[0]>=L'a'&&expected[0]<=L'z')||
   (expected[0]>=L'A'&&expected[0]<=L'Z')) ||expected[1]!=L':'||expected[2]!=L'\\' ||
   lower(expected).substr(expected.size()-4)!=L".exe"){
  fail("Invalid absolute executable path");return 0;
 }
 if(protectedImage(expected)){fail("Protected process denied");return 0;}
 std::uint64_t start=0,beforeControl=0,beforeState=0,appliedControl=0,appliedState=0;
 if(!inspect && !parse(argv[4],std::numeric_limits<std::uint64_t>::max(),start)){
  fail("Invalid process creation time");return 0;
 }
 if((apply||restore)&&
   (!parse(argv[5],std::numeric_limits<DWORD>::max(),beforeControl)||
    !parse(argv[6],std::numeric_limits<DWORD>::max(),beforeState))){
  fail("Invalid snapshot");return 0;
 }
 if(restore &&
  (!parse(argv[7],std::numeric_limits<DWORD>::max(),appliedControl)||
   !parse(argv[8],std::numeric_limits<DWORD>::max(),appliedState))){
  fail("Invalid expected applied state");return 0;
 }
 const DWORD rights=PROCESS_QUERY_LIMITED_INFORMATION|((apply||restore)?PROCESS_SET_INFORMATION:0);
 Handle h(OpenProcess(rights,FALSE,pid));
 if(!h){
  if(probe&&GetLastError()==ERROR_INVALID_PARAMETER){success(",\"same\":false,\"exists\":false");return 0;}
  fail("Cannot access process",GetLastError());return 0;
 }
 std::wstring actual;
 if(!processPath(h.h,actual)){fail("Cannot verify process executable",GetLastError());return 0;}
 if(protectedImage(actual)){fail("Protected process denied");return 0;}
 if((inspect||apply) && forbiddenServiceOrSession(pid)){
  fail("Windows service or cross-session process denied");return 0;
 }
 std::uint64_t ticks=0;
 if(!creationTicks(h.h,ticks)){fail("Cannot verify process creation time",GetLastError());return 0;}
 const bool same=identicalPath(actual,expected) && (inspect||ticks==start);
 if(probe){
  success(same?",\"same\":true,\"exists\":true":",\"same\":false,\"exists\":true");
  return 0;
 }
 if(!same){fail("Executable or process lifetime changed");return 0;}
 PROCESS_POWER_THROTTLING_STATE state{};
 state.Version=PROCESS_POWER_THROTTLING_CURRENT_VERSION;
 if(!GetProcessInformation(h.h,ProcessPowerThrottling,&state,sizeof(state))){
  fail("Cannot query original process EcoQoS state",GetLastError());return 0;
 }
 if(inspect){emitState(pid,ticks,state);return 0;}
 if(restore && beforeControl==state.ControlMask && beforeState==state.StateMask){
  success(",\"alreadyOriginal\":true");return 0;
 }
 if(apply && (beforeControl!=state.ControlMask || beforeState!=state.StateMask)){
  fail("QoS state changed since snapshot");return 0;
 }
 if(restore && (appliedControl!=state.ControlMask || appliedState!=state.StateMask)){
  fail("QoS state changed externally; preserving current state");return 0;
 }
 PROCESS_POWER_THROTTLING_STATE target{};
 target.Version=PROCESS_POWER_THROTTLING_CURRENT_VERSION;
 if(apply){
  target.ControlMask=state.ControlMask|PROCESS_POWER_THROTTLING_EXECUTION_SPEED;
  target.StateMask=state.StateMask|PROCESS_POWER_THROTTLING_EXECUTION_SPEED;
 }else{
  target.ControlMask=static_cast<ULONG>(beforeControl);
  target.StateMask=static_cast<ULONG>(beforeState);
 }
 if(!SetProcessInformation(h.h,ProcessPowerThrottling,&target,sizeof(target))){
  fail("Windows refused process EcoQoS change",GetLastError());return 0;
 }
 std::cout << "{\"ok\":true,\"pid\":" << pid << ",\"controlMask\":" << target.ControlMask
  << ",\"stateMask\":" << target.StateMask << "}\n";
 return 0;
}

!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

!macro customInit
  ; 관리자 권한 요구하지 않음 (사용자 디렉토리에 설치)
!macroend

!macro customInstallMode
  ; 현재 사용자용 설치
  SetShellVarContext current
!macroend

!macro customUnInstallMode
  ; 현재 사용자용 언설치
  SetShellVarContext current
!macroend

!macro customRemoveFiles
  ; 사용자 데이터 보존 (설정, 프로젝트 등)
  RMDir /r "$INSTDIR\resources"
  Delete "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  Delete "$INSTDIR\electron.exe"
  Delete "$INSTDIR\*.dll"
  Delete "$INSTDIR\*.pak"
  Delete "$INSTDIR\version"
  Delete "$INSTDIR\LICENSE"
  RMDir /r "$INSTDIR\locales"
!macroend
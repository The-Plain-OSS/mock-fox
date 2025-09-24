// 버전 관리 UI 로직
import { versionManager, formatTimestamp, getVersionBadgeClass, truncateMessage } from "./version.js";
import { project, saveProject, setCurrent, updateProjectMeta } from "./state.js";

const $ = (id) => document.getElementById(id);

// 버전 관리 UI 클래스
export class VersionUI {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  init() {
    // 이벤트 리스너 등록
    $("versionBtn")?.addEventListener("click", () => this.openModal());
    $("closeVersionModal")?.addEventListener("click", () => this.closeModal());
    $("saveVersionBtn")?.addEventListener("click", () => this.saveVersion());

    // 모달 외부 클릭 시 닫기
    $("versionModal")?.addEventListener("click", (e) => {
      if (e.target.id === "versionModal") {
        this.closeModal();
      }
    });

    // Enter 키로 버전 저장
    $("versionMessage")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.saveVersion();
      }
    });

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeModal();
      }
    });
  }

  openModal() {
    this.isOpen = true;
    const modal = $("versionModal");
    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      // 애니메이션을 위한 초기 상태
      const modalContent = modal.querySelector("div");
      if (modalContent) {
        modalContent.style.transform = "scale(0.95) translateY(20px)";
        modalContent.style.opacity = "0";
      }

      this.renderVersionList();
      this.updateStats();

      // 애니메이션 시작
      requestAnimationFrame(() => {
        if (modalContent) {
          modalContent.style.transform = "scale(1) translateY(0)";
          modalContent.style.opacity = "1";
        }
      });

      // 메시지 입력에 포커스
      setTimeout(() => {
        $("versionMessage")?.focus();
      }, 200);
    }
  }

  closeModal() {
    this.isOpen = false;
    const modal = $("versionModal");
    if (modal) {
      const modalContent = modal.querySelector("div");

      // 닫기 애니메이션
      if (modalContent) {
        modalContent.style.transform = "scale(0.95) translateY(20px)";
        modalContent.style.opacity = "0";
      }

      // 애니메이션 완료 후 숨김
      setTimeout(() => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";

        // 메시지 입력 초기화
        const messageInput = $("versionMessage");
        if (messageInput) messageInput.value = "";
      }, 150);
    }
  }

  async saveVersion() {
    try {
      const messageInput = $("versionMessage");
      const message = messageInput?.value?.trim() || "";

      const version = versionManager.saveVersion(project, message, "manual");

      // UI 업데이트
      this.renderVersionList();
      this.updateStats();
      messageInput.value = "";

      // 성공 피드백
      this.showToast("버전이 저장되었습니다");

    } catch (error) {
      console.error("[VersionUI] saveVersion failed:", error);
      this.showToast("버전 저장에 실패했습니다: " + error.message, "error");
    }
  }

  async loadVersion(versionId) {
    try {
      if (!confirm("현재 작업을 잃고 이 버전으로 복원하시겠습니까?")) {
        return;
      }

      const restoredData = versionManager.loadVersion(versionId);

      // 프로젝트 데이터 복원
      Object.assign(project, restoredData);
      setCurrent(project.endpoints[0]?.id || null);

      // 로컬 스토리지에 저장
      saveProject();

      // UI 업데이트 (메인 화면에서 처리될 수 있도록 이벤트 발생)
      updateProjectMeta();
      window.dispatchEvent(new CustomEvent("project-restored"));

      this.closeModal();
      this.showToast("버전이 복원되었습니다");

    } catch (error) {
      console.error("[VersionUI] loadVersion failed:", error);
      this.showToast("버전 복원에 실패했습니다: " + error.message, "error");
    }
  }

  async deleteVersion(versionId) {
    try {
      const version = versionManager.getVersion(versionId);
      if (!version) return;

      const message = `"${truncateMessage(version.message, 30)}" 버전을 삭제하시겠습니까?`;
      if (!confirm(message)) return;

      versionManager.deleteVersion(versionId);

      // UI 업데이트
      this.renderVersionList();
      this.updateStats();

      this.showToast("버전이 삭제되었습니다");

    } catch (error) {
      console.error("[VersionUI] deleteVersion failed:", error);
      this.showToast("버전 삭제에 실패했습니다: " + error.message, "error");
    }
  }

  // 현재 버전인지 확인
  isCurrentVersion(version) {
    try {
      // 현재 프로젝트와 버전의 엔드포인트 데이터를 비교
      const currentEndpoints = JSON.stringify(project.endpoints || []);
      const versionEndpoints = JSON.stringify(version.data?.endpoints || []);

      return currentEndpoints === versionEndpoints;
    } catch (error) {
      console.warn("[VersionUI] isCurrentVersion check failed:", error);
      return false;
    }
  }

  renderVersionList() {
    const versions = versionManager.getAllVersions();
    const listEl = $("versionList");
    const emptyEl = $("versionEmpty");

    if (!listEl || !emptyEl) return;

    if (versions.length === 0) {
      listEl.style.display = "none";
      emptyEl.classList.remove("hidden");
      return;
    }

    listEl.style.display = "block";
    emptyEl.classList.add("hidden");

    listEl.innerHTML = versions.map(version => this.renderVersionItem(version)).join("");

    // 이벤트 리스너 등록
    this.bindVersionEvents();
  }

  renderVersionItem(version) {
    const isManual = version.type === "manual";
    const timeStr = formatTimestamp(version.timestamp);
    const endpointCount = version.data?.endpoints?.length || 0;
    const shortId = version.id.split("-")[0];
    const projectName = version.data?.name || "Untitled";

    // 현재 버전인지 확인
    const isCurrent = this.isCurrentVersion(version);

    const badgeColor = isCurrent
      ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200"
      : isManual
      ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200"
      : "bg-gradient-to-r from-neutral-100 to-slate-100 text-neutral-600 border border-neutral-200";

    const badgeText = isCurrent ? "현재 버전" : isManual ? "수동 저장" : "자동 백업";

    const iconSvg = isCurrent
      ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
         </svg>`
      : isManual
      ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
         </svg>`
      : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
         </svg>`;

    return `
      <div class="group relative bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300 ease-out overflow-hidden ${isCurrent ? 'ring-2 ring-yellow-200 dark:ring-yellow-700' : ''}">

        <!-- 그라데이션 보더 이펙트 -->
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div class="relative p-6">
          <div class="flex items-start justify-between gap-4">

            <!-- 왼쪽 컨텐츠 -->
            <div class="flex-1 min-w-0">

              <!-- 헤더 -->
              <div class="flex items-center gap-3 mb-3">
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl ${badgeColor} font-medium text-xs">
                  ${iconSvg}
                  ${badgeText}
                </div>
                <div class="flex items-center gap-2 text-xs text-neutral-500">
                  <span class="font-medium">${timeStr}</span>
                  <span class="w-1 h-1 rounded-full bg-neutral-300"></span>
                  <span>${endpointCount}개 엔드포인트</span>
                </div>
              </div>

              <!-- 제목 -->
              <h4 class="font-semibold text-base text-neutral-900 dark:text-neutral-100 mb-2 leading-tight">
                ${version.message || (isCurrent ? "현재 버전" : isManual ? "수동 저장 버전" : "자동 백업")}
              </h4>

              <!-- 메타 정보 -->
              <div class="flex items-center gap-4 text-xs text-neutral-500">
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  <span class="font-mono">${shortId}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <span class="truncate max-w-[120px]">${projectName}</span>
                </div>
              </div>
            </div>

            <!-- 우측 액션 -->
            <div class="flex gap-2 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-200">
              ${isCurrent
                ? `<button
                    class="current-version-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 hover:text-yellow-800 font-medium text-sm transition-all duration-200 hover:scale-105"
                    data-version-id="${version.id}"
                    title="현재 버전입니다"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    현재 버전
                  </button>`
                : `<button
                    class="version-load-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 font-medium text-sm transition-all duration-200 hover:scale-105"
                    data-version-id="${version.id}"
                    title="이 버전으로 복원"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    복원
                  </button>`
              }
              <button
                class="version-delete-btn flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-105 ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}"
                data-version-id="${version.id}"
                title="${isCurrent ? '현재 버전은 삭제할 수 없습니다' : '이 버전 삭제'}"
                ${isCurrent ? 'disabled' : ''}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindVersionEvents() {
    // 복원 버튼
    document.querySelectorAll(".version-load-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const versionId = e.currentTarget.getAttribute("data-version-id");
        if (versionId) this.loadVersion(versionId);
      });
    });

    // 현재 버전 버튼
    document.querySelectorAll(".current-version-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showToast("현재 버전입니다", "info");
      });
    });

    // 삭제 버튼
    document.querySelectorAll(".version-delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const versionId = e.currentTarget.getAttribute("data-version-id");
        if (versionId && !e.currentTarget.disabled) {
          this.deleteVersion(versionId);
        }
      });
    });
  }

  updateStats() {
    const stats = versionManager.getVersionStats();
    const usage = versionManager.getStorageUsage();
    const statsEl = $("versionStats");

    if (statsEl) {
      const sizeStr = usage.sizeMB > 1
        ? `${usage.sizeMB}MB`
        : `${usage.sizeKB}KB`;

      statsEl.textContent = `버전 ${stats.total}개 · ${sizeStr}`;
    }
  }

  showToast(message, type = "success") {
    const toast = $("toast");
    if (!toast) return;

    // 타입별 스타일
    const styles = {
      success: "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
      error: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
      info: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
    };

    // 아이콘
    const icons = {
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                 </svg>`,
      error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>`,
      info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
             </svg>`
    };

    toast.innerHTML = `
      <div class="flex items-center gap-3">
        ${icons[type] || icons.success}
        <span class="font-medium">${message}</span>
      </div>
    `;

    toast.className = `fixed left-1/2 -translate-x-1/2 bottom-8 px-6 py-4 rounded-2xl ${styles[type]} shadow-2xl backdrop-blur-sm transform transition-all duration-300 ease-out z-[70]`;

    // 초기 상태 (숨김)
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px) scale(0.95)";
    toast.classList.remove("hidden");

    // 애니메이션 시작
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0) scale(1)";
    });

    // 자동 숨김
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-20px) scale(0.95)";
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, 3000);
  }

  // 자동 백업 트리거
  triggerAutoBackup() {
    try {
      const version = versionManager.autoBackup(project);
      if (version) {
        console.log("[VersionUI] Auto backup created:", version.id);

        // 모달이 열려있으면 UI 업데이트
        if (this.isOpen) {
          this.renderVersionList();
          this.updateStats();
        }
      }
    } catch (error) {
      console.warn("[VersionUI] Auto backup failed:", error);
    }
  }
}

// 전역 인스턴스
export const versionUI = new VersionUI();

// 프로젝트 복원 이벤트 리스너 (다른 모듈에서 사용)
window.addEventListener("project-restored", () => {
  // 사이드바와 에디터 새로고침 트리거
  window.dispatchEvent(new CustomEvent("refresh-ui"));
});
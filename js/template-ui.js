// 템플릿 선택 UI 관리
import { templates, getTemplateById } from './templates.js';
import { project, saveProject, setCurrent, updateProjectMeta } from './state.js';

const $ = (id) => document.getElementById(id);

class TemplateUI {
  constructor() {
    this.modal = $('templateModal');
    this.templateList = $('templateList');
    this.isOpen = false;
    this.currentCategory = 'all';

    this.initEventListeners();
    this.setupEventListeners();
  }

  initEventListeners() {
    // 새프로젝트 버튼 클릭 시 템플릿 모달 열기
    const newProjectBtn = $('newProjectBtn');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    }

    // 모달 닫기
    const closeBtn = $('closeTemplateModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // 모달 외부 클릭 시 닫기
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });

    // 카테고리 필터 이벤트
    document.addEventListener('click', (e) => {
      if (e.target.matches('.category-filter')) {
        const category = e.target.dataset.category;
        this.filterByCategory(category);
      }
    });
  }

  openModal() {
    if (this.modal) {
      this.renderTemplates();
      this.modal.showModal();
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.close();
      this.isOpen = false;
      document.body.style.overflow = '';
    }
  }

  renderTemplates() {
    if (!this.templateList) return;

    // 카테고리 필터링
    const filteredTemplates = this.currentCategory === 'all'
      ? templates
      : templates.filter(template => template.category === this.currentCategory);

    // 템플릿 카드들 생성
    const templateCards = filteredTemplates.map(template => this.createTemplateCard(template)).join('');
    this.templateList.innerHTML = templateCards;

    // 이벤트 리스너는 한 번만 등록하므로 여기서는 제거
  }

  setupEventListeners() {
    // 템플릿 카드와 빈 프로젝트 클릭 이벤트를 한 번만 등록
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        // 템플릿 카드 클릭
        const templateCard = e.target.closest('.template-card[data-template-id]');
        if (templateCard) {
          const templateId = templateCard.dataset.templateId;
          this.applyTemplate(templateId);
          return;
        }

        // 빈 프로젝트 카드 클릭
        const blankCard = e.target.closest('.template-card[data-template="blank"]');
        if (blankCard) {
          this.createBlankProject();
          return;
        }
      });
    }
  }

  filterByCategory(category) {
    this.currentCategory = category;

    // 카테고리 버튼 활성화 상태 업데이트
    const filterButtons = document.querySelectorAll('.category-filter');
    filterButtons.forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.remove('bg-neutral-700', 'hover:bg-neutral-600', 'text-neutral-300', 'hover:text-white');
        btn.classList.add('bg-purple-600', 'text-white', 'active');
      } else {
        btn.classList.remove('bg-purple-600', 'text-white', 'active');
        btn.classList.add('bg-neutral-700', 'hover:bg-neutral-600', 'text-neutral-300', 'hover:text-white');
      }
    });

    // 템플릿 다시 렌더링
    this.renderTemplates();
  }

  createTemplateCard(template) {
    const categoryIconMap = {
      '비즈니스': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 9H6l-1-9z',
      '컨텐츠': 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
      '소셜': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      '생산성': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      '헬스': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      '교육': 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
    };

    const iconPath = categoryIconMap[template.category] || 'M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';

    return `
      <div class="template-card group cursor-pointer p-4 rounded-xl border border-neutral-700 hover:border-purple-500/50 bg-neutral-800/50 hover:bg-neutral-800/80 transition-all hover:scale-[1.02]" data-template-id="${template.id}">
        <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-colors mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
          </svg>
        </div>
        <h3 class="font-semibold text-neutral-100 mb-2">${template.name}</h3>
        <p class="text-sm text-neutral-400 mb-3 line-clamp-2">${template.description}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="text-neutral-500">${template.endpoints.length}개 엔드포인트</span>
          <span class="px-2 py-1 bg-neutral-700 text-neutral-300 rounded-full">${template.category}</span>
        </div>
      </div>
    `;
  }

  createBlankProject() {
    if (!confirm("현재 내용을 초기화하고 새 프로젝트를 시작할까요?")) return;

    const fresh = {
      id: this.generateId(),
      name: "새 프로젝트",
      version: "v1.0.0",
      updatedAt: new Date().toISOString(),
      endpoints: []
    };

    Object.assign(project, fresh);
    setCurrent(null);
    saveProject();
    updateProjectMeta();

    // UI 새로고침 이벤트 발생
    window.dispatchEvent(new CustomEvent("refresh-ui"));

    this.closeModal();
    this.showToast("새 프로젝트가 생성되었습니다");
  }

  applyTemplate(templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
      this.showToast("템플릿을 찾을 수 없습니다", "error");
      return;
    }

    if (!confirm(`"${template.name}" 템플릿으로 새 프로젝트를 시작할까요?\n현재 작업 중인 내용은 사라집니다.`)) {
      return;
    }

    try {
      // 새 프로젝트 데이터 생성
      const projectData = {
        id: this.generateId(),
        name: template.name.replace(/^[🛍️📝💬✅]\s*/, ''), // 이모지 제거
        version: "v1.0.0",
        updatedAt: new Date().toISOString(),
        endpoints: template.endpoints.map(endpoint => ({
          ...endpoint,
          id: this.generateId() // 새로운 ID 생성
        }))
      };

      // 프로젝트 데이터 적용
      Object.assign(project, projectData);
      setCurrent(project.endpoints[0]?.id || null);
      saveProject();
      updateProjectMeta();

      // UI 새로고침 이벤트 발생
      window.dispatchEvent(new CustomEvent("refresh-ui"));

      this.closeModal();
      this.showToast(`${template.name} 템플릿이 적용되었습니다`);

    } catch (error) {
      console.error("[TemplateUI] applyTemplate failed:", error);
      this.showToast("템플릿 적용에 실패했습니다", "error");
    }
  }

  generateId() {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch {}
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  showToast(message, type = "success") {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 transform transition-all duration-300 translate-x-full opacity-0 ${
      type === "error"
        ? "bg-red-600 text-white"
        : "bg-green-600 text-white"
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // 애니메이션으로 표시
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 100);

    // 자동 숨김
    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// 전역 인스턴스
export const templateUI = new TemplateUI();
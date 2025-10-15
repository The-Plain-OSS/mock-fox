/**
 * @license
 * Copyright (c) 2025 The-Plain-OSS
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// 버전 관리 모듈 - localStorage 기반 스냅샷 시스템

import { $ } from "./state.js";

const isRenderer = typeof window !== "undefined" && typeof document !== "undefined";
const memoryStore = (() => {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
})();
const storage = (isRenderer && window.localStorage) ? window.localStorage : memoryStore;

// UUID 생성
function uuid() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return "version-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

// 버전 관리 클래스
export class VersionManager {
  constructor() {
    this.STORAGE_KEY = "api-spec-versions";
    this.MAX_VERSIONS = 50; // 최대 보관 버전 수
  }

  // 모든 버전 조회 (최신순)
  getAllVersions() {
    try {
      const raw = storage.getItem(this.STORAGE_KEY);
      const versions = raw ? JSON.parse(raw) : [];
      return versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
      console.warn("[VersionManager] getAllVersions failed:", e);
      return [];
    }
  }

  // 버전 저장
  saveVersion(projectData, message = "", type = "manual") {
    try {
      const version = {
        id: uuid(),
        projectId: projectData.id || "unknown",
        timestamp: new Date().toISOString(),
        message: message.trim() || (type === "auto" ? "자동 저장" : "버전 저장"),
        type: type, // "manual" | "auto"
        data: JSON.parse(JSON.stringify(projectData)) // 깊은 복사
      };

      const versions = this.getAllVersions();
      versions.unshift(version); // 최신 버전을 앞에 추가

      // 최대 버전 수 제한
      if (versions.length > this.MAX_VERSIONS) {
        versions.splice(this.MAX_VERSIONS);
      }

      storage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
      console.log("[VersionManager] Version saved:", version.id, version.message);
      return version;
    } catch (e) {
      console.error("[VersionManager] saveVersion failed:", e);
      throw new Error("버전 저장에 실패했습니다: " + e.message);
    }
  }

  // 특정 버전 조회
  getVersion(versionId) {
    const versions = this.getAllVersions();
    return versions.find(v => v.id === versionId);
  }

  // 버전 삭제
  deleteVersion(versionId) {
    try {
      const versions = this.getAllVersions();
      const filtered = versions.filter(v => v.id !== versionId);

      if (filtered.length === versions.length) {
        throw new Error("삭제할 버전을 찾을 수 없습니다.");
      }

      storage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log("[VersionManager] Version deleted:", versionId);
      return true;
    } catch (e) {
      console.error("[VersionManager] deleteVersion failed:", e);
      throw new Error("버전 삭제에 실패했습니다: " + e.message);
    }
  }

  // 버전 복원 (프로젝트 데이터 반환)
  loadVersion(versionId) {
    try {
      const version = this.getVersion(versionId);
      if (!version) {
        throw new Error("버전을 찾을 수 없습니다.");
      }

      // 복원할 때 새로운 updatedAt 설정
      const restoredData = {
        ...version.data,
        updatedAt: new Date().toISOString()
      };

      console.log("[VersionManager] Version loaded:", versionId, version.message);
      return restoredData;
    } catch (e) {
      console.error("[VersionManager] loadVersion failed:", e);
      throw new Error("버전 로드에 실패했습니다: " + e.message);
    }
  }


  // 버전 통계
  getVersionStats() {
    const versions = this.getAllVersions();
    return {
      total: versions.length,
      manual: versions.filter(v => v.type === "manual").length,
      auto: versions.filter(v => v.type === "auto").length,
      oldest: versions.length > 0 ? versions[versions.length - 1].timestamp : null,
      newest: versions.length > 0 ? versions[0].timestamp : null
    };
  }

  // 버전 정리 (오래된 버전 삭제)
  cleanup() {
    try {
      const versions = this.getAllVersions();

      // 최대 버전 수 제한만 적용
      if (versions.length > this.MAX_VERSIONS) {
        const filtered = versions.slice(0, this.MAX_VERSIONS);
        storage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        console.log("[VersionManager] Cleanup completed:", versions.length - filtered.length, "versions removed");
      }
    } catch (e) {
      console.warn("[VersionManager] cleanup failed:", e);
    }
  }

  // 스토리지 용량 체크
  getStorageUsage() {
    try {
      const versions = this.getAllVersions();
      const dataSize = JSON.stringify(versions).length;
      return {
        versions: versions.length,
        sizeBytes: dataSize,
        sizeKB: Math.round(dataSize / 1024),
        sizeMB: Math.round(dataSize / 1024 / 1024 * 100) / 100
      };
    } catch (e) {
      return { versions: 0, sizeBytes: 0, sizeKB: 0, sizeMB: 0 };
    }
  }
}

// 전역 인스턴스
export const versionManager = new VersionManager();

// 유틸리티 함수들
export function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 0 ? "방금" : `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}시간 전`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  } catch (e) {
    return timestamp;
  }
}

export function getVersionBadgeClass(type) {
  return type === "manual"
    ? "bg-blue-100 text-blue-700"
    : "bg-neutral-100 text-neutral-600";
}

export function truncateMessage(message, maxLength = 50) {
  if (!message || message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
}
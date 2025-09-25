// API 프로젝트 템플릿 데이터
// 새로운 템플릿을 추가하려면 이 파일을 편집하세요

export const templates = [
  {
    id: "ecommerce",
    name: "이커머스 프로젝트",
    description: "쇼핑몰과 온라인 스토어를 위한 기본적인 API 구조",
    category: "비즈니스",
    endpoints: [
      {
        id: "get-products",
        method: "GET",
        path: "/api/products",
        description: "상품 목록 조회",
        query: {
          "page": 1,
          "limit": 20,
          "category": "electronics"
        },
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "products": [
            {
              "id": 1,
              "name": "스마트폰",
              "price": 899000,
              "category": "electronics",
              "stock": 50
            }
          ],
          "total": 1,
          "page": 1,
          "limit": 20
        }
      },
      {
        id: "create-product",
        method: "POST",
        path: "/api/products",
        description: "새 상품 등록",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "name": "새 상품명",
          "price": 50000,
          "category": "electronics",
          "description": "상품 설명",
          "stock": 100
        },
        responseStatus: 201,
        responseBody: {
          "id": 2,
          "name": "새 상품명",
          "price": 50000,
          "category": "electronics",
          "description": "상품 설명",
          "stock": 100,
          "createdAt": "2024-01-01T00:00:00Z"
        }
      },
      {
        id: "get-orders",
        method: "GET",
        path: "/api/orders",
        description: "주문 내역 조회",
        query: {
          "status": "pending"
        },
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "orders": [
            {
              "id": "order_123",
              "userId": 1,
              "items": [
                {
                  "productId": 1,
                  "quantity": 2,
                  "price": 899000
                }
              ],
              "total": 1798000,
              "status": "pending",
              "createdAt": "2024-01-01T00:00:00Z"
            }
          ]
        }
      },
      {
        id: "create-order",
        method: "POST",
        path: "/api/orders",
        description: "새 주문 생성",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "items": [
            {
              "productId": 1,
              "quantity": 2
            }
          ],
          "shippingAddress": {
            "street": "강남대로 123",
            "city": "서울",
            "zipCode": "12345"
          }
        },
        responseStatus: 201,
        responseBody: {
          "id": "order_124",
          "status": "pending",
          "total": 1798000,
          "estimatedDelivery": "2024-01-05T00:00:00Z"
        }
      }
    ]
  },
  {
    id: "blog",
    name: "블로그 프로젝트",
    description: "개인 블로그나 CMS를 위한 기본적인 API 구조",
    category: "컨텐츠",
    endpoints: [
      {
        id: "get-posts",
        method: "GET",
        path: "/api/posts",
        description: "게시글 목록 조회",
        query: {
          "page": 1,
          "limit": 10,
          "category": "tech"
        },
        headers: null,
        body: null,
        responseStatus: 200,
        responseBody: {
          "posts": [
            {
              "id": 1,
              "title": "API 설계 가이드",
              "excerpt": "좋은 API를 설계하는 방법에 대해 알아보겠습니다.",
              "author": "개발자",
              "category": "tech",
              "publishedAt": "2024-01-01T00:00:00Z"
            }
          ],
          "total": 1,
          "page": 1
        }
      },
      {
        id: "get-post",
        method: "GET",
        path: "/api/posts/{id}",
        description: "특정 게시글 조회",
        query: null,
        headers: null,
        body: null,
        responseStatus: 200,
        responseBody: {
          "id": 1,
          "title": "API 설계 가이드",
          "content": "# API 설계 가이드\n\n좋은 API를 설계하는 방법...",
          "author": "개발자",
          "category": "tech",
          "tags": ["api", "design", "backend"],
          "publishedAt": "2024-01-01T00:00:00Z",
          "updatedAt": "2024-01-01T00:00:00Z"
        }
      },
      {
        id: "create-post",
        method: "POST",
        path: "/api/posts",
        description: "새 게시글 작성",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "title": "새 게시글 제목",
          "content": "게시글 내용입니다.",
          "category": "tech",
          "tags": ["새글", "테스트"]
        },
        responseStatus: 201,
        responseBody: {
          "id": 2,
          "title": "새 게시글 제목",
          "slug": "new-post-title",
          "publishedAt": "2024-01-01T00:00:00Z"
        }
      },
      {
        id: "get-comments",
        method: "GET",
        path: "/api/posts/{id}/comments",
        description: "게시글 댓글 조회",
        query: null,
        headers: null,
        body: null,
        responseStatus: 200,
        responseBody: {
          "comments": [
            {
              "id": 1,
              "author": "댓글러",
              "content": "좋은 글 감사합니다!",
              "createdAt": "2024-01-01T00:00:00Z"
            }
          ]
        }
      }
    ]
  },
  {
    id: "social",
    name: "소셜 미디어 프로젝트",
    description: "소셜 네트워크 서비스를 위한 기본적인 API 구조",
    category: "소셜",
    endpoints: [
      {
        id: "get-feed",
        method: "GET",
        path: "/api/feed",
        description: "사용자 피드 조회",
        query: {
          "limit": 20,
          "offset": 0
        },
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "posts": [
            {
              "id": 1,
              "userId": 123,
              "username": "johndoe",
              "content": "안녕하세요! 오늘도 좋은 하루 보내세요 ☀️",
              "likes": 42,
              "comments": 5,
              "createdAt": "2024-01-01T00:00:00Z"
            }
          ],
          "hasMore": true
        }
      },
      {
        id: "create-post",
        method: "POST",
        path: "/api/posts",
        description: "새 게시물 작성",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "content": "새 게시물 내용입니다!",
          "media": [
            {
              "type": "image",
              "url": "https://example.com/image.jpg"
            }
          ]
        },
        responseStatus: 201,
        responseBody: {
          "id": 2,
          "content": "새 게시물 내용입니다!",
          "likes": 0,
          "comments": 0,
          "createdAt": "2024-01-01T00:00:00Z"
        }
      },
      {
        id: "like-post",
        method: "POST",
        path: "/api/posts/{id}/like",
        description: "게시물 좋아요",
        query: null,
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "liked": true,
          "totalLikes": 43
        }
      },
      {
        id: "follow-user",
        method: "POST",
        path: "/api/users/{id}/follow",
        description: "사용자 팔로우",
        query: null,
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "following": true,
          "followersCount": 156
        }
      }
    ]
  },
  {
    id: "task-management",
    name: "할일 관리 프로젝트",
    description: "프로젝트 관리와 할일 관리를 위한 기본적인 API 구조",
    category: "생산성",
    endpoints: [
      {
        id: "get-projects",
        method: "GET",
        path: "/api/projects",
        description: "프로젝트 목록 조회",
        query: null,
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "projects": [
            {
              "id": 1,
              "name": "웹사이트 리뉴얼",
              "description": "회사 웹사이트를 새롭게 디자인합니다",
              "status": "active",
              "tasksCount": 12,
              "completedTasks": 7,
              "dueDate": "2024-02-01T00:00:00Z"
            }
          ]
        }
      },
      {
        id: "get-tasks",
        method: "GET",
        path: "/api/projects/{id}/tasks",
        description: "프로젝트의 할일 목록 조회",
        query: {
          "status": "pending",
          "assignee": "me"
        },
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "tasks": [
            {
              "id": 1,
              "title": "로그인 페이지 디자인",
              "description": "사용자 친화적인 로그인 페이지를 디자인합니다",
              "status": "pending",
              "priority": "high",
              "assignee": "designer",
              "dueDate": "2024-01-15T00:00:00Z"
            }
          ]
        }
      },
      {
        id: "create-task",
        method: "POST",
        path: "/api/projects/{id}/tasks",
        description: "새 할일 생성",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "title": "새로운 할일",
          "description": "할일 설명",
          "priority": "medium",
          "assignee": "developer",
          "dueDate": "2024-01-20T00:00:00Z"
        },
        responseStatus: 201,
        responseBody: {
          "id": 2,
          "title": "새로운 할일",
          "status": "pending",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      },
      {
        id: "update-task",
        method: "PATCH",
        path: "/api/tasks/{id}",
        description: "할일 상태 업데이트",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "status": "completed"
        },
        responseStatus: 200,
        responseBody: {
          "id": 1,
          "status": "completed",
          "completedAt": "2024-01-01T00:00:00Z"
        }
      }
    ]
  },
  {
    id: "fitness-app",
    name: "헬스케어 프로젝트",
    description: "운동 기록과 건강 관리를 위한 API 구조",
    category: "헬스",
    endpoints: [
      {
        id: "get-workouts",
        method: "GET",
        path: "/api/workouts",
        description: "운동 기록 조회",
        query: {
          "date": "2024-01-01",
          "type": "strength"
        },
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 200,
        responseBody: {
          "workouts": [
            {
              "id": 1,
              "type": "strength",
              "exercises": [
                {
                  "name": "벤치프레스",
                  "sets": 3,
                  "reps": 10,
                  "weight": 80
                }
              ],
              "duration": 3600,
              "calories": 350,
              "date": "2024-01-01T00:00:00Z"
            }
          ]
        }
      },
      {
        id: "log-workout",
        method: "POST",
        path: "/api/workouts",
        description: "운동 기록 저장",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "type": "cardio",
          "exercises": [
            {
              "name": "러닝",
              "duration": 1800,
              "distance": 5000,
              "pace": "6:00"
            }
          ]
        },
        responseStatus: 201,
        responseBody: {
          "id": 2,
          "calories": 300,
          "createdAt": "2024-01-01T00:00:00Z"
        }
      }
    ]
  },
  {
    id: "food-delivery",
    name: "음식 배달 프로젝트",
    description: "음식 주문과 배달 서비스를 위한 API 구조",
    category: "비즈니스",
    endpoints: [
      {
        id: "get-restaurants",
        method: "GET",
        path: "/api/restaurants",
        description: "음식점 목록 조회",
        query: {
          "location": "강남구",
          "cuisine": "korean"
        },
        headers: null,
        body: null,
        responseStatus: 200,
        responseBody: {
          "restaurants": [
            {
              "id": 1,
              "name": "맛있는 한식당",
              "cuisine": "korean",
              "rating": 4.5,
              "deliveryTime": 30,
              "deliveryFee": 3000,
              "minimumOrder": 15000
            }
          ]
        }
      },
      {
        id: "place-order",
        method: "POST",
        path: "/api/orders",
        description: "음식 주문하기",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "restaurantId": 1,
          "items": [
            {
              "menuId": 101,
              "quantity": 2,
              "options": ["매운맛", "추가밥"]
            }
          ],
          "deliveryAddress": "서울시 강남구 테헤란로 123"
        },
        responseStatus: 201,
        responseBody: {
          "orderId": "ORD123456",
          "estimatedDelivery": "2024-01-01T12:30:00Z",
          "total": 25000
        }
      }
    ]
  },
  {
    id: "education",
    name: "온라인 교육 프로젝트",
    description: "온라인 강의와 학습 관리를 위한 API 구조",
    category: "교육",
    endpoints: [
      {
        id: "get-courses",
        method: "GET",
        path: "/api/courses",
        description: "강의 목록 조회",
        query: {
          "category": "programming",
          "level": "beginner"
        },
        headers: null,
        body: null,
        responseStatus: 200,
        responseBody: {
          "courses": [
            {
              "id": 1,
              "title": "JavaScript 기초",
              "instructor": "김개발",
              "duration": 1200,
              "level": "beginner",
              "price": 99000,
              "rating": 4.8,
              "students": 1250
            }
          ]
        }
      },
      {
        id: "enroll-course",
        method: "POST",
        path: "/api/courses/{id}/enroll",
        description: "강의 수강신청",
        query: null,
        headers: {
          "Authorization": "Bearer {token}"
        },
        body: null,
        responseStatus: 201,
        responseBody: {
          "enrollmentId": "ENR789",
          "courseId": 1,
          "progress": 0,
          "enrolledAt": "2024-01-01T00:00:00Z"
        }
      },
      {
        id: "update-progress",
        method: "PATCH",
        path: "/api/enrollments/{id}/progress",
        description: "학습 진도 업데이트",
        query: null,
        headers: {
          "Authorization": "Bearer {token}",
          "Content-Type": "application/json"
        },
        body: {
          "lessonId": 5,
          "completed": true,
          "watchTime": 900
        },
        responseStatus: 200,
        responseBody: {
          "progress": 25,
          "completedLessons": 5,
          "totalLessons": 20
        }
      }
    ]
  },
  {
    id: "real-estate",
    name: "부동산 프로젝트",
    description: "부동산 매물 관리와 검색을 위한 API 구조",
    category: "비즈니스",
    endpoints: [
      {
        id: "search-properties",
        method: "GET",
        path: "/api/properties",
        description: "부동산 매물 검색",
        query: {
          "type": "apartment",
          "location": "강남구",
          "minPrice": 50000,
          "maxPrice": 100000,
          "rooms": 3
        },
        headers: null,
        body: null,
        responseStatus: 200,
        responseBody: {
          "properties": [
            {
              "id": 1,
              "type": "apartment",
              "address": "서울시 강남구 청담동",
              "price": 75000,
              "deposit": 10000,
              "rooms": 3,
              "area": 84,
              "floor": 15,
              "totalFloors": 25,
              "features": ["주차가능", "엘리베이터", "발코니"]
            }
          ],
          "total": 1
        }
      },
      {
        id: "create-inquiry",
        method: "POST",
        path: "/api/properties/{id}/inquiries",
        description: "매물 문의하기",
        query: null,
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          "name": "홍길동",
          "phone": "010-1234-5678",
          "message": "매물 상세 문의드립니다.",
          "preferredTime": "오후"
        },
        responseStatus: 201,
        responseBody: {
          "inquiryId": "INQ456",
          "status": "pending",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      }
    ]
  }
];

// 템플릿을 ID로 찾기
export function getTemplateById(id) {
  return templates.find(template => template.id === id);
}

// 카테고리별 템플릿 그룹핑
export function getTemplatesByCategory() {
  const categories = {};
  templates.forEach(template => {
    if (!categories[template.category]) {
      categories[template.category] = [];
    }
    categories[template.category].push(template);
  });
  return categories;
}
# SmartContractAuction

블록체인 기반의 차량 경매 시스템입니다. 이더리움 스마트 컨트랙트를 활용하여 투명하고 안전한 경매 프로세스를 구현했습니다.

## 프로젝트 구조

```txt
SmartContractAuction/
├── contract/
│   └── Auction.sol      # 스마트 컨트랙트 소스 코드
├── web/
│   ├── index.html       # 메인 웹 페이지
│   └── auction.js       # 경매 관련 자바스크립트 로직
├── css/
│   └── style.css        # 스타일시트
└── README.md
```

## 주요 기능

### 스마트 컨트랙트 (Auction.sol)

- 경매 생성 및 관리
- 실시간 입찰 시스템
- 자동 환불 메커니즘
- 경매 취소 및 종료 기능
- 이벤트 기반 상태 추적

### 웹 인터페이스

- 직관적인 경매 참여 UI
- 실시간 입찰 현황 표시
- 메타마스크 연동
- 반응형 디자인

## 시작하기

### 스마트 컨트랙트 배포

1. [Remix IDE](https://remix.ethereum.org/) 접속
2. `contract/Auction.sol` 파일 업로드
3. 컴파일러 버전 0.8.0 이상 선택
4. "Deploy & Run Transactions" 탭에서 컨트랙트 배포
   - 배포 시 필요한 파라미터:
     - `_biddingTime`: 경매 진행 시간 (시간 단위)
     - `_owner`: 경매 소유자 주소
     - `_brand`: 차량 브랜드
     - `_Rnumber`: 차량 등록번호

### 웹 인터페이스 실행

1. 로컬 환경에서 웹 서버 실행
    ```bash
    # 예시: Python을 사용한 경우
    python -m http.server 8000
    ```
2. 웹 브라우저에서 `http://localhost:8000` 접속
3. 메타마스크 지갑 연결
4. 경매 참여 시작

## 기술 스택

- Solidity ^0.8.0
- Web3.js
- HTML/CSS/JavaScript
- MetaMask

## 보안 기능

- 소유자 권한 검증
- 경매 상태 검증
- 안전한 자금 전송 처리
- 이벤트 기반 상태 추적

## 주의사항

- 테스트넷에서 충분한 테스트 후 메인넷 배포 권장
- 메타마스크 지갑의 네트워크 설정 확인
- 가스비 고려 필요

## 라이선스

MIT License

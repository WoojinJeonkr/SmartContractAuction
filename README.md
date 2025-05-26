# 스마트 컨트랙트 경매 시스템

이 프로젝트는 이더리움 블록체인을 기반으로 한 경매 시스템입니다.  
Ganache 로컬 네트워크를 사용하여 테스트하고, Remix IDE를 통해 스마트 컨트랙트를 배포할 수 있습니다.

## 프로젝트 구조

```
SmartContractAuction
├── contract/          # 스마트 컨트랙트 소스 코드
│   └── Auction.sol    # 경매 컨트랙트
├── css/              # 스타일시트 파일
├── server/           # 백엔드 서버 코드
├── web/              # 프론트엔드 웹 애플리케이션
└── package.json      # 프로젝트 의존성 관리
```

## 시작하기

### 1. Ganache 설치 및 실행

1. [Ganache 공식 웹사이트](https://trufflesuite.com/ganache/)에서 Ganache를 다운로드하여 설치합니다.
2. Ganache를 실행하고 로컬 블록체인 네트워크를 시작합니다.
3. 기본 RPC URL은 `http://127.0.0.1:7545`입니다.

### 2. Remix IDE를 통한 컨트랙트 배포

1. [Remix IDE](https://remix.ethereum.org/)에 접속합니다.
2. `contract/Auction.sol` 파일을 Remix IDE에 업로드합니다.
3. Solidity 컴파일러를 사용하여 컨트랙트를 컴파일합니다.
4. "Deploy & Run Transactions" 탭에서:
   - Environment를 "Dev - Ganache Provider"로 설정
   - Ganache의 RPC URL(`http://127.0.0.1:7545`)을 입력
   - Ganache 계정 중 하나를 선택하여 컨트랙트 배포

### 3. 로컬 개발 환경 설정

web 디렉토리의 abi.json, wallet.json을 현재 경매 정보로 최신화하신 뒤 진행하세요.

```bash
# 프로젝트 의존성 설치
npm install

# 개발 서버 실행
cd server
node server.js # 또는 supervisor server.js로 실행
```

## 주요 기능

- 경매 생성 및 관리
- 입찰 기능
- 경매 종료 및 정산
- 이더리움 기반 결제 시스템

## 기술 스택

- Solidity (스마트 컨트랙트)
- Ganache (로컬 블록체인)
- Remix IDE (컨트랙트 배포 및 테스트)
- Web3.js (블록체인 상호작용)

## 주의사항

- 이 프로젝트는 Ganache 로컬 네트워크를 사용하므로 실제 이더리움 네트워크와는 다릅니다.
- 테스트를 위해 Ganache에서 제공하는 테스트 이더를 사용합니다.
- MetaMask는 사용하지 않으며, Remix IDE를 통해 직접 컨트랙트와 상호작용합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요. 

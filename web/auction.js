var web3 = new Web3('ws://localhost:7545');
var bidder;
var participants = new Set();
var cancel_time;
var end_time;

var AUCTION_STATES = {
  0: { text: "진행 중", className: "state-ongoing" },
  1: { text: "취소됨", className: "state-cancelled" },
  2: { text: "종료됨", className: "state-ended" }
};

web3.eth.getAccounts().then(function(acc){
  console.log(acc)
  web3.eth.defaultAccount = acc[0]
  bidder = acc[0]

  auctionContract.methods.auction_start().call().then((result)=>{
    document.getElementById("auction_start").innerHTML=new Date(result * 1000).toLocaleString();
  });
  
  auctionContract.methods.auction_end().call().then((result)=>{
    document.getElementById("auction_end").innerHTML=new Date(result * 1000).toLocaleString();
  });

  auctionContract.methods.highestBidder().call().then((result)=>{
    document.getElementById("HighestBidder").innerHTML = anonymizeAddress(result);
  }); 
      
  auctionContract.methods.highestBid().call().then((result)=>{
    console.log("highest bid info: ", result)
    var bidEther = web3.utils.fromWei(web3.utils.toBN(result), 'ether');
    document.getElementById("HighestBid").innerHTML = bidEther + " ETH";

  }); 

  auctionContract.methods.STATE().call().then((result)=>{
    const stateInfo = AUCTION_STATES[result] || { text: "알 수 없음", className: "state-unknown" };
    const stateElement = document.getElementById("STATE");
    stateElement.innerHTML = stateInfo.text;
    stateElement.className = `auction-status ${stateInfo.className}`;
  }); 

  auctionContract.methods.Mycar().call().then((result)=>{
    document.getElementById("car_brand").innerHTML=result[0];
    document.getElementById("registration_number").innerHTML=result[1];
  }); 

  auctionContract.methods.bids(bidder).call().then((result) => {
    var bidEther = web3.utils.fromWei(web3.utils.toBN(result), 'ether');
    document.getElementById("MyBid").innerHTML=bidEther;
    console.log(bidder);
  }); 
});

var auctionContract =  new web3.eth.Contract(
  [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_biddingTime",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_brand",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_Rnumber",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "AuctionEnded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "highestBidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "highestBid",
          "type": "uint256"
        }
      ],
      "name": "BidEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "message",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "time",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "highestBidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "refundAmount",
          "type": "uint256"
        }
      ],
      "name": "CanceledEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "bidder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "RefundEvent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "enum Auction.auction_state",
          "name": "newState",
          "type": "uint8"
        }
      ],
      "name": "StateUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "withdrawer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "WithdrawalEvent",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "Mycar",
      "outputs": [
        {
          "internalType": "string",
          "name": "Brand",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "Rnumber",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "STATE",
      "outputs": [
        {
          "internalType": "enum Auction.auction_state",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "actual_end",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "auctionEnd",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "auction_end",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "auction_start",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "bid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "bids",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "cancel_auction",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "deactivateAuction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "get_owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "highestBid",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "highestBidder",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "pendingReturns",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "enum Auction.auction_state",
          "name": "newState",
          "type": "uint8"
        }
      ],
      "name": "updateAuctionState",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userMaxBids",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawRemainingFunds",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
);

// 경매 트랜잭션 주소
auctionContract.options.address = '0xAecE7B76929A2a75157608a501A0dd6c56d70355';
// 경매 참여자 지갑 주소
var userWalletAddress = '0x746BBAA792B8bE13c05E3624fC34d67a35Fc2649';

function bid() {
  var mybid = document.getElementById('value').value;

  // 입력값 검증 추가
  if (!mybid || isNaN(mybid) || mybid <= 0) {
    document.getElementById("biding_status").innerHTML = "유효한 입찰 금액을 입력하세요";
    return;
  }

  auctionContract.methods.highestBid().call().then((currentBid) => {
    var currentBidEther = web3.utils.fromWei(web3.utils.toBN(currentBid), 'ether');
    if (parseFloat(mybid) <= parseFloat(currentBidEther)) {
      document.getElementById("biding_status").innerHTML = "현재 최고 입찰가보다 높은 금액을 입력하세요";
      return;
    }
    
    // 검증 통과 후 트랜잭션 실행
    auctionContract.methods.bid().send({
      from: userWalletAddress, 
      value: web3.utils.toWei(mybid, "ether"), 
      gas: 200000
    }).then((result) => {
      console.log(result);
      document.getElementById("biding_status").innerHTML = "입찰 성공, 트랜잭션 ID: " + result.transactionHash;
    }).catch((error) => {
      document.getElementById("biding_status").innerHTML = "입찰 실패: " + error.message;
    });
  });
}

auctionContract.events.BidEvent(function(error, event){
  console.log(event);
}).on("connected", function(subscriptionId){
  console.log(subscriptionId);
}).on('data', function(event){
  console.log(event);
  // 참여자 주소 추가
  participants.add(event.returnValues.highestBidder);
  // 참여자 목록 업데이트
  updateParticipantsList();
  $("#eventslog").html(event.returnValues.highestBidder + ' has bidden(' + event.returnValues.highestBid + ' wei)');
});

// 참여자 목록 업데이트 함수 추가
function updateParticipantsList() {
  var listElement = document.getElementById('participants-list');
  listElement.innerHTML = ''; // 목록 초기화
  
  participants.forEach(function(address) {
    var listItem = document.createElement('li');
    listItem.textContent = anonymizeAddress(address);
    listElement.appendChild(listItem);
  });
}

function anonymizeAddress(address) {
  if (!address || address.length !== 42) return address;
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}
	
function init(){
 // setTimeout(() => alert("아무런 일도 일어나지 않습니다."), 3000);

  auctionContract.getPastEvents('allEvents', {
    fromBlock: 0,
    toBlock: 'latest'
  }).then(function(events) {
  events.reverse().forEach(function(event) { // 최신 이벤트가 아래로 오도록
    const logEntry = document.createElement('div');
    logEntry.className = 'event-entry';
    
    switch(event.event) {
      case 'BidEvent':
        logEntry.className += ' event-bid';
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${anonymizeAddress(event.returnValues.highestBidder)} 님이 ${web3.utils.fromWei(event.returnValues.highestBid, 'ether')} ETH 입찰`;
        break;
      case 'CanceledEvent':
        logEntry.className += ' event-cancel';
        const CANCEL_REASONS = {
          1: "소유자 취소",
          2: "시간 만료 자동 취소"
        };
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 경매 취소됨 (사유 코드: ${CANCEL_REASONS[event.returnValues.message] || '기타'})`;
        break;
      case 'RefundEvent':
        logEntry.className += ' event-refund';
        const refundAmount = web3.utils.fromWei(event.returnValues.amount, 'ether');
        const refundTime = new Date(event.returnValues.timestamp * 1000).toLocaleTimeString();
        logEntry.innerHTML = `[${refundTime}] ${anonymizeAddress(event.returnValues.bidder)} 님에게 ${refundAmount} ETH 환불 완료`;
        break;
      case 'AuctionEnded':
        logEntry.className += ' event-end';
        const winner = anonymizeAddress(event.returnValues.winner);
        const finalAmount = web3.utils.fromWei(event.returnValues.amount, 'ether');
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 경매 종료됨. 낙찰자: ${winner}, 낙찰 금액: ${finalAmount} ETH`;
        break;
      default:
        logEntry.className += ' event-unknown';
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 이벤트 발생: ${event.event || '알 수 없는 타입'}`;
        break;
    }
    
    document.getElementById('eventslog').appendChild(logEntry);
  });
  });
  // 과거 입찰 이벤트 조회하여 참여자 목록 초기화
  auctionContract.getPastEvents('BidEvent', {
    fromBlock: 0,
    toBlock: 'latest'
  }, function(error, events) {
    if (!error) {
      events.forEach(function(event) {
        participants.add(event.returnValues.highestBidder);
      });
      updateParticipantsList();
    }
  });
}

var auction_owner=null;
auctionContract.methods.get_owner().call().then((result)=>{
  auction_owner=result;
  // if(bidder!=auction_owner)
  // $("#auction_owner_operations").hide();
  if (userWalletAddress.toLowerCase() !== auction_owner.toLowerCase()) {
    $("#auction_owner_operations").hide();
  } else {
    // 소유자에게만 자동 환불 UI 표시
    $('#auto-refund-toggle').show();
  }
})

// 사용자별 최대 입찰액 조회
auctionContract.methods.userMaxBids(userWalletAddress).call().then((userMax) => {
  const userMaxEther = web3.utils.fromWei(userMax, 'ether');
  
  if (parseFloat(mybid) <= parseFloat(userMaxEther)) {
    document.getElementById("biding_status").innerHTML = 
      `기존 입찰액(${userMaxEther} ETH) 이상 입력 필요`;
    return;
  }
  
  if (parseFloat(mybid) <= parseFloat(currentHighest)) {
    document.getElementById("biding_status").innerHTML =
      `현재 최고가(${currentHighest} ETH) 초과 필요`;
    return;
  }
});
  
function cancel_auction(){
  // 경매 주최자인지 확인
  auctionContract.methods.get_owner().call().then((owner) => {
    if (userWalletAddress.toLowerCase() !== owner.toLowerCase()) {
      document.getElementById("cancel_status").innerHTML = "경매 주최자만 취소할 수 있습니다.";
      return;
    }
    
    // 경매 상태 확인
    auctionContract.methods.STATE().call().then((state) => {
      if (state != 0) {
        document.getElementById("cancel_status").innerHTML = "이미 종료되었거나 취소된 경매입니다.";
        return;
      }
      
      // 경매 취소 실행
      auctionContract.methods.cancel_auction().send({
        from: userWalletAddress,
        gas: 200000
      })
      .then((result) => {
        console.log(result);

        document.getElementById("cancel_status").innerHTML = "경매가 성공적으로 취소되었습니다.";
        cancel_time = new Date(Date.now()).toLocaleString();

        // UI 상태 업데이트
        auctionContract.methods.STATE().call().then(() => {
          const stateElement = document.getElementById("STATE");
          stateElement.innerHTML = AUCTION_STATES[1].text;
          stateElement.className = `auction-status ${AUCTION_STATES[1].className}`;
          document.getElementById("auction_end").innerHTML=cancel_time;
        });
      })
      .catch((error) => {
        console.error(error);
        document.getElementById("cancel_status").innerHTML = "경매 취소 중 오류가 발생했습니다: " + error.message;
      });
    });
  });
}

function withdraw() {
  auctionContract.methods.withdraw().send({ from: userWalletAddress, gas: 200000 })
  .then((result) => {
    console.log(result);
    document.getElementById("withdraw_status").innerHTML = "Withdraw successful, transaction ID: " + result.transactionHash;
  })
  .catch((error) => {
    console.error(error);
    document.getElementById("withdraw_status").innerHTML = "Withdraw failed: " + error.message;
  });
}

function triggerAutoRefund(targetAddress) {
  // 컨트랙트 인스턴스 복제 (주소 변경)
  const tempContract = new web3.eth.Contract(
      auctionContract._jsonInterface,
      auctionContract.options.address,
      { from: targetAddress } // 대상 주소로 컨텍스트 변경
  );

  if (userWalletAddress.toLowerCase() !== auction_owner.toLowerCase()) {
    console.log("권한 없음: 오직 컨트랙트 소유자만 자동 환불 실행 가능");
    return;
  }

  // 가스 추정
  tempContract.methods.withdraw().estimateGas()
  .then(gasAmount => {
      // 실제 트랜잭션 전송 (메타마스크 서명 우회 불가)
      tempContract.methods.withdraw().send({
          gas: gasAmount
      })
      .catch(error => {
          console.log(`자동 환불 실패 (${targetAddress}):`, error);
      });
  })
  .catch(error => {
      console.log(`가스 추정 실패 (${targetAddress}):`, error);
  });
}

// 관리자용 자동 환불 트리거
function triggerRefund(targetAddress) {
  if (userWalletAddress.toLowerCase() !== auction_owner.toLowerCase()) return;

  auctionContract.methods.withdraw().send({
      from: targetAddress,
      gas: 200000
  }).catch(console.error);
}

function endAuction() {
  auctionContract.methods.auctionEnd().send({
      from: userWalletAddress,
      gas: 200000
  })
  .then((result) => {
      console.log(result);
      document.getElementById("end_status").innerHTML = "경매가 성공적으로 종료되었습니다.";
      end_time = new Date(Date.now()).toLocaleString();

      auctionContract.methods.STATE().call().then(() => {
        const stateElement = document.getElementById("STATE");
        stateElement.innerHTML = AUCTION_STATES[2].text;
        stateElement.className = `auction-status ${AUCTION_STATES[2].className}`;
        document.getElementById("auction_end").innerHTML = end_time;
      });
  })
  .catch((error) => {
      console.error(error);
      document.getElementById("end_status").innerHTML = "경매 종료 중 오류가 발생했습니다: " + error.message;
  });
}

auctionContract.events.BidEvent()
.on('data', function(error, event) {
  if (error) {
    console.log(error);
  } else {
    // 이전 입찰자 추적
    const previousBidder = currentHighestBidder;
    currentHighestBidder = event.returnValues.highestBidder;

    // 이전 입찰자 환불 알림
    if (previousBidder && previousBidder !== '0x000...') {
      auctionContract.methods.pendingReturns(previousBidder).call()
      .then(balance => {
          if (balance > 0) {
            showRefundNotification(previousBidder, balance);
          }
      });
    }

    const logEntry = document.createElement('div');
    logEntry.className = 'event-entry event-bid';
    logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${anonymizeAddress(event.returnValues.highestBidder)} 님이 ${web3.utils.fromWei(event.returnValues.highestBid, 'ether')} ETH 입찰`;
    document.getElementById('eventslog').prepend(logEntry);
  }
});

auctionContract.events.CanceledEvent()
.on('data', function(error, event) {
  if (error) {
    console.error(error);
  } else {
    document.getElementById("STATE").innerHTML = event.returnValues.newState;
    const logEntry = document.createElement('div');
    logEntry.className = 'event-entry event-cancel';
    // 취소 사유 및 환불 정보 표시
    let CANCEL_REASONS = {
      1: "소유자 취소",
      2: "시간 만료 자동 취소"
    };

    let message = `[${new Date().toLocaleTimeString()}] 경매 취소됨 (사유: ${CANCEL_REASONS[event.returnValues.message] || '기타'})`;
    
    if (event.returnValues.highestBidder && event.returnValues.refundAmount > 0) {
      const refundEth = web3.utils.fromWei(event.returnValues.refundAmount, 'ether');
      message += `, ${anonymizeAddress(event.returnValues.highestBidder)}님에게 ${refundEth} ETH 환불됨`;
    }

    logEntry.innerHTML = message
    document.getElementById('eventslog').prepend(logEntry);
  }
});

auctionContract.events.StateUpdated()
.on('data', function(event) {
  const logEntry = document.createElement('div');
  logEntry.className = 'event-entry event-state';
  
  const states = ["진행 중", "취소됨", "종료됨"];
  const newState = event.returnValues.newState;
  const stateText = states[newState] || `알 수 없는 상태(${newState})`;
  
  logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 경매 상태 변경: ${stateText}`;
  document.getElementById('eventslog').prepend(logEntry);
});

// RefundEvent 이벤트 리스너 추가
auctionContract.events.RefundEvent(function(error, event){
  if (error) {
      console.error(error);
      return;
  }
  console.log(event);
}).on("connected", function(subscriptionId){
  console.log("RefundEvent 구독 ID:", subscriptionId);
}).on('data', function(event){
  // 이벤트 로그에 환불 정보 추가
  const logEntry = document.createElement('div');
  logEntry.className = 'event-entry event-refund';
  const amount = web3.utils.fromWei(event.returnValues.amount, 'ether');
  const bidder = anonymizeAddress(event.returnValues.bidder);
  const time = new Date(event.returnValues.timestamp * 1000).toLocaleTimeString();
  
  logEntry.innerHTML = `[${time}] ${bidder} 님에게 ${amount} ETH 자동 환불됨`;
  document.getElementById('eventslog').prepend(logEntry);
});

auctionContract.events.AuctionEnded()
  .on('error', function(error) {
    console.error('AuctionEnded 이벤트 오류:', error);
  })
  .on('data', function(event) {
    console.log('AuctionEnded 이벤트 수신:', event);
    document.getElementById("STATE").innerHTML = "종료됨";
    document.getElementById("STATE").className = "auction-status state-ended";
    const logEntry = document.createElement('div');
    logEntry.className = 'event-entry event-end';
    const winner = event.returnValues.winner ? anonymizeAddress(event.returnValues.winner) : '알 수 없음';
    const amount = event.returnValues.amount ? web3.utils.fromWei(event.returnValues.amount, 'ether') : '0';
    logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 경매 종료됨. 낙찰자: ${winner}, 낙찰 금액: ${amount} ETH`;
    document.getElementById('eventslog').prepend(logEntry);
  });

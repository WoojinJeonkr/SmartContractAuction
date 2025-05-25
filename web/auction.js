// ABI, 지갑 주소 정보 동적 로딩
var bidder;
var participants = new Set();
var cancel_time;
var end_time;

var AUCTION_STATES = {
	0: { text: '진행 중', className: 'state-ongoing' },
	1: { text: '취소됨', className: 'state-cancelled' },
	2: { text: '종료됨', className: 'state-ended' },
};

// 전역 함수들
function updateParticipantsList() {
	var listElement = document.getElementById('participants-list');
	if (!listElement) return;
	listElement.innerHTML = '';
	participants.forEach(function (address) {
		var listItem = document.createElement('li');
		listItem.textContent = anonymizeAddress(address);
		listElement.appendChild(listItem);
	});
}

function anonymizeAddress(address) {
	if (!address || address.length !== 42) return address;
	return `${address.substring(0, 6)}...${address.substring(38)}`;
}

Promise.all([
	fetch('/abi.json').then((res) => res.json()),
	fetch('/wallet.json').then((res) => res.json()),
]).then(([abi, walletInfo]) => {
	window.web3 = new Web3('ws://localhost:7545');
	window.auctionContract = new window.web3.eth.Contract(
		abi,
		walletInfo.contractAddress
	);
	window.userWalletAddress = walletInfo.userWalletAddress;
	window.auction_owner = walletInfo.auctionOwner;

	// 전역 함수로 bid 선언
	window.bid = function() {
		var mybid = document.getElementById('value').value;

		// 경매 주최자 입찰 제한
		if (
			window.auction_owner &&
			window.userWalletAddress.toLowerCase() ===
				window.auction_owner.toLowerCase()
		) {
			alert('경매 주최자는 참가 불가능합니다');
			return;
		}

		// 입력값 검증 추가
		if (!mybid || isNaN(mybid) || mybid <= 0) {
			document.getElementById('biding_status').innerHTML =
				'유효한 입찰 금액을 입력하세요';
			return;
		}

		window.auctionContract.methods
			.highestBid()
			.call()
			.then((currentBid) => {
				var currentBidEther = window.web3.utils.fromWei(
					window.web3.utils.toBN(currentBid),
					'ether'
				);
				if (parseFloat(mybid) <= parseFloat(currentBidEther)) {
					document.getElementById('biding_status').innerHTML =
						'현재 최고 입찰가보다 높은 금액을 입력하세요';
					return;
				}

				// 검증 통과 후 트랜잭션 실행
				window.auctionContract.methods
					.bid()
					.send({
						from: window.userWalletAddress,
						value: window.web3.utils.toWei(mybid, 'ether'),
						gas: 200000,
					})
					.then((result) => {
						document.getElementById('biding_status').innerHTML =
							'입찰 성공, 트랜잭션 ID: ' + result.transactionHash;
						refreshAuctionInfo();
					})
					.catch((error) => {
						document.getElementById('biding_status').innerHTML =
							'입찰 실패: ' + error.message;
					});
			});
	};

	// init 함수를 여기서 정의
	function init() {
		participants = new Set();
		if (document.getElementById('eventslog')) {
			document.getElementById('eventslog').innerHTML = '';
		}
		if (window.auctionContract) {
			Promise.all([
				window.auctionContract.getPastEvents('BidEvent', {
					fromBlock: 0,
					toBlock: 'latest',
				}),
				window.auctionContract.getPastEvents('RefundEvent', {
					fromBlock: 0,
					toBlock: 'latest',
				}),
			]).then(async ([bidEvents, refundEvents]) => {
				const allEvents = [...bidEvents, ...refundEvents];
				// 각 이벤트의 블록 타임스탬프 조회
				const eventsWithTime = await Promise.all(
					allEvents.map(async (event) => {
						const block = await window.web3.eth.getBlock(event.blockNumber);
						return { ...event, timestamp: block.timestamp };
					})
				);
				// 타임스탬프 기준 내림차순 정렬
				eventsWithTime.sort(
					(a, b) =>
						b.timestamp - a.timestamp || (b.logIndex || 0) - (a.logIndex || 0)
				);
				// 상위 20개만 표시
				const N = 20;
				const latestEvents = eventsWithTime.slice(0, N);
				if (document.getElementById('eventslog')) {
					document.getElementById('eventslog').innerHTML = '';
					latestEvents.forEach(function (event) {
						const timeStr = new Date(event.timestamp * 1000).toLocaleTimeString();
						const logEntry = document.createElement('div');
						if (event.event === 'BidEvent') {
							logEntry.className = 'event-entry event-bid';
							logEntry.innerHTML = `[${timeStr}] ${anonymizeAddress(
								event.returnValues.highestBidder
							)} 님이 ${window.web3.utils.fromWei(
								event.returnValues.highestBid,
								'ether'
							)} ETH 입찰`;
							// 참여자 목록에 추가
							participants.add(event.returnValues.highestBidder);
						} else if (event.event === 'RefundEvent') {
							logEntry.className = 'event-entry event-refund';
							const amount = window.web3.utils.fromWei(
								event.returnValues.amount,
								'ether'
							);
							const bidder = anonymizeAddress(event.returnValues.bidder);
							logEntry.innerHTML = `[${timeStr}] ${bidder} 님에게 ${amount} ETH 환불 완료`;
						}
						document.getElementById('eventslog').appendChild(logEntry);
					});
					// 스크롤을 맨 위로 이동
					document.getElementById('eventslog').scrollTop = 0;
				}
				// 참여자 목록 업데이트
				updateParticipantsList();
			});
		}

		// 경매 시작 시간
		if (document.getElementById('auction_start')) {
			window.auctionContract.methods
				.auction_start()
				.call()
				.then((result) => {
					document.getElementById('auction_start').innerHTML = new Date(
						result * 1000
					).toLocaleString();
				});
		}
		// 경매 종료 시간
		if (document.getElementById('auction_end')) {
			window.auctionContract.methods
				.auction_end()
				.call()
				.then((result) => {
					document.getElementById('auction_end').innerHTML = new Date(
						result * 1000
					).toLocaleString();
				});
		}
		// 최고 입찰가
		if (document.getElementById('HighestBid')) {
			window.auctionContract.methods
				.highestBid()
				.call()
				.then((result) => {
					var bidEther = window.web3.utils.fromWei(
						window.web3.utils.toBN(result),
						'ether'
					);
					document.getElementById('HighestBid').innerHTML = bidEther + ' ETH';
				});
		}
		// 최고 입찰자
		if (document.getElementById('HighestBidder')) {
			window.auctionContract.methods
				.highestBidder()
				.call()
				.then((result) => {
					document.getElementById('HighestBidder').innerHTML =
						anonymizeAddress(result);
				});
		}
		// 경매 상태
		if (document.getElementById('STATE')) {
			window.auctionContract.methods
				.STATE()
				.call()
				.then((result) => {
					const stateInfo = AUCTION_STATES[result] || {
						text: '알 수 없음',
						className: 'state-unknown',
					};
					const stateElement = document.getElementById('STATE');
					stateElement.innerHTML = stateInfo.text;
					stateElement.className = `auction-status ${stateInfo.className}`;
				});
		}
		// 차량 정보
		if (
			document.getElementById('car_brand') &&
			document.getElementById('registration_number')
		) {
			window.auctionContract.methods
				.Mycar()
				.call()
				.then((result) => {
					document.getElementById('car_brand').innerHTML = result[0];
					document.getElementById('registration_number').innerHTML = result[1];
				});
		}
	}

	// 기존의 web3.eth.getAccounts(), auctionContract 정보 조회, init() 등 모든 초기화 코드를 이 안에 넣음
	window.web3.eth.getAccounts().then(function (acc) {
		window.web3.eth.defaultAccount = acc[0];
		bidder = acc[0];
		// init() 함수를 여기서 호출
		init();
	});

	window.auctionContract.events
		.BidEvent(function (error, event) {
			console.log(event);
		})
		.on('connected', function (subscriptionId) {
			console.log(subscriptionId);
		})
		.on('data', function (event) {
			console.log(event);
			// 참여자 주소 추가
			if (event.returnValues && event.returnValues.highestBidder) {
				participants.add(event.returnValues.highestBidder);
				// 참여자 목록 업데이트
				updateParticipantsList();
			}
			// 실시간 입찰 이벤트 발생 시 전체 정보 갱신
			refreshAuctionInfo();
		});

	var auction_owner = null;
	window.auctionContract.methods
		.get_owner()
		.call()
		.then((result) => {
			auction_owner = result;
			// if(bidder!=auction_owner)
			// $("#auction_owner_operations").hide();
			if (
				window.userWalletAddress.toLowerCase() !== auction_owner.toLowerCase()
			) {
				$('#auction_owner_operations').hide();
			} else {
				// 소유자에게만 자동 환불 UI 표시
				$('#auto-refund-toggle').show();
			}
		});

	// 사용자별 최대 입찰액 조회
	window.auctionContract.methods
		.userMaxBids(window.userWalletAddress)
		.call()
		.then((userMax) => {
			var mybid = document.getElementById('value').value;
			const userMaxEther = window.web3.utils.fromWei(userMax, 'ether');

			window.auctionContract.methods
				.highestBid()
				.call()
				.then((currentBid) => {
					var currentHighest = window.web3.utils.fromWei(
						window.web3.utils.toBN(currentBid),
						'ether'
					);
					if (parseFloat(mybid) <= parseFloat(userMaxEther)) {
						document.getElementById(
							'biding_status'
						).innerHTML = `기존 입찰액(${userMaxEther} ETH) 이상 입력 필요`;
						return;
					}
					if (parseFloat(mybid) <= parseFloat(currentHighest)) {
						document.getElementById(
							'biding_status'
						).innerHTML = `현재 최고가(${currentHighest} ETH) 초과 필요`;
						return;
					}
					// ... 이하 로직 ...
				});
		});

	function cancel_auction() {
		// 경매 주최자인지 확인
		window.auctionContract.methods
			.get_owner()
			.call()
			.then((owner) => {
				if (window.userWalletAddress.toLowerCase() !== owner.toLowerCase()) {
					document.getElementById('cancel_status').innerHTML =
						'경매 주최자만 취소할 수 있습니다.';
					return;
				}

				// 경매 상태 확인
				window.auctionContract.methods
					.STATE()
					.call()
					.then((state) => {
						if (state != 0) {
							document.getElementById('cancel_status').innerHTML =
								'이미 종료되었거나 취소된 경매입니다.';
							return;
						}

						// 경매 취소 실행
						window.auctionContract.methods
							.cancel_auction()
							.send({
								from: window.userWalletAddress,
								gas: 200000,
							})
							.then((result) => {
								console.log(result);

								document.getElementById('cancel_status').innerHTML =
									'경매가 성공적으로 취소되었습니다.';
								cancel_time = new Date(Date.now()).toLocaleString();

								// UI 상태 업데이트
								window.auctionContract.methods
									.STATE()
									.call()
									.then(() => {
										const stateElement = document.getElementById('STATE');
										stateElement.innerHTML = AUCTION_STATES[1].text;
										stateElement.className = `auction-status ${AUCTION_STATES[1].className}`;
										document.getElementById('auction_end').innerHTML =
											cancel_time;
									});
							})
							.catch((error) => {
								console.error(error);
								document.getElementById('cancel_status').innerHTML =
									'경매 취소 중 오류가 발생했습니다: ' + error.message;
							});
					});
			});
	}

	function withdraw() {
		window.auctionContract.methods
			.withdraw()
			.send({ from: window.userWalletAddress, gas: 200000 })
			.then((result) => {
				console.log(result);
				document.getElementById('withdraw_status').innerHTML =
					'Withdraw successful, transaction ID: ' + result.transactionHash;
			})
			.catch((error) => {
				console.error(error);
				document.getElementById('withdraw_status').innerHTML =
					'Withdraw failed: ' + error.message;
			});
	}

	function triggerAutoRefund(targetAddress) {
		// 컨트랙트 인스턴스 복제 (주소 변경)
		const tempContract = new window.web3.eth.Contract(
			window.auctionContract._jsonInterface,
			window.auctionContract.options.address,
			{ from: targetAddress } // 대상 주소로 컨텍스트 변경
		);

		if (
			window.userWalletAddress.toLowerCase() !==
			window.auction_owner.toLowerCase()
		) {
			console.log('권한 없음: 오직 컨트랙트 소유자만 자동 환불 실행 가능');
			return;
		}

		// 가스 추정
		tempContract.methods
			.withdraw()
			.estimateGas()
			.then((gasAmount) => {
				// 실제 트랜잭션 전송 (메타마스크 서명 우회 불가)
				tempContract.methods
					.withdraw()
					.send({
						gas: gasAmount,
					})
					.catch((error) => {
						console.log(`자동 환불 실패 (${targetAddress}):`, error);
					});
			})
			.catch((error) => {
				console.log(`가스 추정 실패 (${targetAddress}):`, error);
			});
	}

	// 관리자용 자동 환불 트리거
	function triggerRefund(targetAddress) {
		if (
			window.userWalletAddress.toLowerCase() !==
			window.auction_owner.toLowerCase()
		)
			return;

		window.auctionContract.methods
			.withdraw()
			.send({
				from: targetAddress,
				gas: 200000,
			})
			.catch(console.error);
	}

	function endAuction() {
		window.auctionContract.methods
			.auctionEnd()
			.send({
				from: window.userWalletAddress,
				gas: 200000,
			})
			.then((result) => {
				console.log(result);
				document.getElementById('end_status').innerHTML =
					'경매가 성공적으로 종료되었습니다.';
				end_time = new Date(Date.now()).toLocaleString();

				window.auctionContract.methods
					.STATE()
					.call()
					.then(() => {
						const stateElement = document.getElementById('STATE');
						stateElement.innerHTML = AUCTION_STATES[2].text;
						stateElement.className = `auction-status ${AUCTION_STATES[2].className}`;
						document.getElementById('auction_end').innerHTML = end_time;
					});
			})
			.catch((error) => {
				console.error(error);
				document.getElementById('end_status').innerHTML =
					'경매 종료 중 오류가 발생했습니다: ' + error.message;
			});
	}

	window.auctionContract.events.BidEvent().on('data', function (error, event) {
		if (error) {
			console.log(error);
		} else {
			// 이전 입찰자 추적
			const previousBidder = currentHighestBidder;
			currentHighestBidder = event.returnValues.highestBidder;

			// 이전 입찰자 환불 알림
			if (previousBidder && previousBidder !== '0x000...') {
				window.auctionContract.methods
					.pendingReturns(previousBidder)
					.call()
					.then((balance) => {
						if (balance > 0) {
							showRefundNotification(previousBidder, balance);
						}
					});
			}

			const logEntry = document.createElement('div');
			logEntry.className = 'event-entry event-bid';
			logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${anonymizeAddress(
				event.returnValues.highestBidder
			)} 님이 ${window.web3.utils.fromWei(
				event.returnValues.highestBid,
				'ether'
			)} ETH 입찰`;
			document.getElementById('eventslog').prepend(logEntry);
		}
	});

	window.auctionContract.events
		.CanceledEvent()
		.on('data', function (error, event) {
			if (error) {
				console.error(error);
			} else {
				document.getElementById('STATE').innerHTML =
					event.returnValues.newState;
				const logEntry = document.createElement('div');
				logEntry.className = 'event-entry event-cancel';
				// 취소 사유 및 환불 정보 표시
				let CANCEL_REASONS = {
					1: '소유자 취소',
					2: '시간 만료 자동 취소',
				};

				let message = `[${new Date().toLocaleTimeString()}] 경매 취소됨 (사유: ${
					CANCEL_REASONS[event.returnValues.message] || '기타'
				})`;

				if (
					event.returnValues.highestBidder &&
					event.returnValues.refundAmount > 0
				) {
					const refundEth = window.web3.utils.fromWei(
						event.returnValues.refundAmount,
						'ether'
					);
					message += `, ${anonymizeAddress(
						event.returnValues.highestBidder
					)}님에게 ${refundEth} ETH 환불됨`;
				}

				logEntry.innerHTML = message;
				document.getElementById('eventslog').prepend(logEntry);
			}
		});

	window.auctionContract.events.StateUpdated().on('data', function (event) {
		const logEntry = document.createElement('div');
		logEntry.className = 'event-entry event-state';

		const states = ['진행 중', '취소됨', '종료됨'];
		const newState = event.returnValues.newState;
		const stateText = states[newState] || `알 수 없는 상태(${newState})`;

		logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 경매 상태 변경: ${stateText}`;
		document.getElementById('eventslog').prepend(logEntry);
	});

	// RefundEvent 이벤트 리스너 추가
	window.auctionContract.events
		.RefundEvent(function (error, event) {
			if (error) {
				console.error(error);
				return;
			}
			console.log(event);
		})
		.on('connected', function (subscriptionId) {
			console.log('RefundEvent 구독 ID:', subscriptionId);
		})
		.on('data', function (event) {
			// 이벤트 로그에 환불 정보 추가
			const logEntry = document.createElement('div');
			logEntry.className = 'event-entry event-refund';
			const amount = window.web3.utils.fromWei(
				event.returnValues.amount,
				'ether'
			);
			const bidder = anonymizeAddress(event.returnValues.bidder);
			const time = new Date(
				event.returnValues.timestamp * 1000
			).toLocaleTimeString();

			logEntry.innerHTML = `[${time}] ${bidder} 님에게 ${amount} ETH 자동 환불됨`;
			document.getElementById('eventslog').prepend(logEntry);
		});

	window.auctionContract.events
		.AuctionEnded()
		.on('error', function (error) {
			console.error('AuctionEnded 이벤트 오류:', error);
		})
		.on('data', function (event) {
			console.log('AuctionEnded 이벤트 수신:', event);
			document.getElementById('STATE').innerHTML = '종료됨';
			document.getElementById('STATE').className = 'auction-status state-ended';
			const logEntry = document.createElement('div');
			logEntry.className = 'event-entry event-end';
			const winner = event.returnValues.winner
				? anonymizeAddress(event.returnValues.winner)
				: '알 수 없음';
			const amount = event.returnValues.amount
				? window.web3.utils.fromWei(event.returnValues.amount, 'ether')
				: '0';
			logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] 경매 종료됨. 낙찰자: ${winner}, 낙찰 금액: ${amount} ETH`;
			document.getElementById('eventslog').prepend(logEntry);
		});

	// 입찰 성공 후 정보 갱신 함수
	function refreshAuctionInfo() {
		// 최고 입찰가 갱신
		window.auctionContract.methods
			.highestBid()
			.call()
			.then((result) => {
				var bidEther = window.web3.utils.fromWei(
					window.web3.utils.toBN(result),
					'ether'
				);
				document.getElementById('HighestBid').innerHTML = bidEther + ' ETH';
			});
		// 최고 입찰자 갱신
		window.auctionContract.methods
			.highestBidder()
			.call()
			.then((result) => {
				document.getElementById('HighestBidder').innerHTML =
					anonymizeAddress(result);
			});
		// 남은 시간(종료 시간) 갱신
		window.auctionContract.methods
			.auction_end()
			.call()
			.then((result) => {
				document.getElementById('auction_end').innerHTML = new Date(
					result * 1000
				).toLocaleString();
			});
		// 경매 상태 갱신
		window.auctionContract.methods
			.STATE()
			.call()
			.then((result) => {
				const stateInfo = AUCTION_STATES[result] || {
					text: '알 수 없음',
					className: 'state-unknown',
				};
				const stateElement = document.getElementById('STATE');
				stateElement.innerHTML = stateInfo.text;
				stateElement.className = `auction-status ${stateInfo.className}`;
			});
		// 이벤트 로그, 참여자 목록 갱신 (이벤트 기록 영역 초기화 후 init 호출)
		document.getElementById('eventslog').innerHTML = '';
		init();
	}
});

/**
 * 영단어 플래피버드 - 메인 앱
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const screens = {
        start: document.getElementById('start-screen'),
        game: document.getElementById('game-screen'),
        gameover: document.getElementById('gameover-screen')
    };

    const elements = {
        gradeSelect: document.getElementById('grade-select'),
        publisherSelect: document.getElementById('publisher-select'),
        lessonSelect: document.getElementById('lesson-select'),
        startBtn: document.getElementById('start-btn'),
        loadingText: document.getElementById('loading-text'),
        errorText: document.getElementById('error-text'),
        canvas: document.getElementById('game-canvas'),
        score: document.getElementById('score'),
        wordCount: document.getElementById('word-count'),
        hpDisplay: document.getElementById('hp-display'),
        quizModal: document.getElementById('quiz-modal'),
        quizWord: document.getElementById('quiz-word'),
        quizOptions: document.getElementById('quiz-options'),
        finalScore: document.getElementById('final-score'),
        correctCount: document.getElementById('correct-count'),
        wrongCount: document.getElementById('wrong-count'),
        retryBtn: document.getElementById('retry-btn'),
        homeBtn: document.getElementById('home-btn'),
        clearEffect: document.getElementById('clear-effect'),
        damageFlash: document.getElementById('damage-flash')
    };

    // 게임 상태
    let game = null;
    let currentQuestions = [];
    let currentSettings = {
        grade: 3,
        publisher: 'DK',
        lesson: 1
    };

    // 초기화
    init();

    function init() {
        // 단원 선택 옵션 생성
        updateLessonOptions();

        // 이벤트 리스너
        elements.gradeSelect.addEventListener('change', updateLessonOptions);
        elements.publisherSelect.addEventListener('change', updateLessonOptions);
        elements.startBtn.addEventListener('click', startGame);
        elements.retryBtn.addEventListener('click', retryGame);
        elements.homeBtn.addEventListener('click', goHome);

        // 게임 인스턴스는 화면 전환 후 생성하므로 여기서는 생성하지 않음
    }

    function updateLessonOptions() {
        const grade = parseInt(elements.gradeSelect.value);
        const lessonCount = ARGongAPI.defaultLessonCounts[grade] || 10;

        elements.lessonSelect.innerHTML = '';
        for (let i = 1; i <= lessonCount; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}단원`;
            elements.lessonSelect.appendChild(option);
        }
    }

    async function startGame() {
        // 설정 저장
        currentSettings.grade = parseInt(elements.gradeSelect.value);
        currentSettings.publisher = elements.publisherSelect.value;
        currentSettings.lesson = parseInt(elements.lessonSelect.value);

        // UI 상태 변경
        elements.startBtn.disabled = true;
        elements.loadingText.classList.remove('hidden');
        elements.errorText.classList.add('hidden');

        try {
            // 문제풀 가져오기
            currentQuestions = await ARGongAPI.getGameQuestions(
                currentSettings.grade,
                currentSettings.publisher,
                currentSettings.lesson
            );

            if (currentQuestions.length < 4) {
                throw new Error('문제가 너무 적습니다. (최소 4개 필요)');
            }

            // 1) 먼저 게임 화면으로 전환
            showScreen('game');

            // 2) 레이아웃 반영을 기다린 후 게임 시작
            await waitForLayout();

            // 3) 게임 인스턴스 생성 또는 리사이즈
            if (!game) {
                game = new FlappyBirdGame(elements.canvas, {
                    onScore: updateScore,
                    onQuiz: showQuiz,
                    onGameOver: handleGameOver,
                    onWordCountChange: updateWordCount,
                    onHpChange: updateHp
                });
                window._gameRef = game; // 디버깅/테스트용
            } else {
                game.resize();
            }

            // 4) 게임 초기화 및 시작
            game.init(currentQuestions);
            game.start();

        } catch (error) {
            console.error('게임 시작 실패:', error);
            elements.errorText.textContent = error.message || '문제를 불러오는데 실패했습니다.';
            elements.errorText.classList.remove('hidden');
            showScreen('start');
        } finally {
            elements.startBtn.disabled = false;
            elements.loadingText.classList.add('hidden');
        }
    }

    function retryGame() {
        showScreen('game');

        // 레이아웃 반영 후 게임 재시작
        requestAnimationFrame(() => {
            if (game) {
                game.resize();
                game.init(currentQuestions);
                game.start();
            }
        });
    }

    function goHome() {
        if (game) {
            game.stop();
        }
        showScreen('start');
    }

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenName].classList.add('active');
    }

    /** 브라우저 레이아웃 반영을 기다립니다 */
    function waitForLayout() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    function updateScore(score) {
        elements.score.textContent = score;
    }

    function updateWordCount(count) {
        elements.wordCount.textContent = count;
    }

    let lastHp = 3;

    function updateHp(hp, maxHp) {
        elements.hpDisplay.textContent =
            '\u2764\uFE0F'.repeat(hp) + '\uD83D\uDDA4'.repeat(maxHp - hp);

        // HP가 감소했을 때 이펙트
        if (hp < lastHp) {
            // HP 흔들림
            elements.hpDisplay.classList.remove('hp-hit');
            void elements.hpDisplay.offsetWidth; // reflow로 애니메이션 리셋
            elements.hpDisplay.classList.add('hp-hit');

            // 화면 빨간 플래시
            elements.damageFlash.classList.remove('active');
            void elements.damageFlash.offsetWidth;
            elements.damageFlash.classList.add('active');
        }
        lastHp = hp;
    }

    function showQuiz(question, options, callback) {
        elements.quizWord.textContent = question.english;
        elements.quizOptions.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'quiz-option';
            button.textContent = option.text;

            button.addEventListener('click', () => {
                // 모든 버튼 비활성화
                const allButtons = elements.quizOptions.querySelectorAll('button');
                allButtons.forEach(btn => btn.disabled = true);

                if (option.isCorrect) {
                    button.classList.add('correct');
                    setTimeout(() => {
                        elements.quizModal.classList.add('hidden');
                        callback(true);
                    }, 500);
                } else {
                    button.classList.add('wrong');
                    // 정답 표시
                    allButtons.forEach(btn => {
                        if (btn.textContent === question.korean) {
                            btn.classList.add('correct');
                        }
                    });
                    setTimeout(() => {
                        elements.quizModal.classList.add('hidden');
                        callback(false);
                    }, 1000);
                }
            });

            elements.quizOptions.appendChild(button);
        });

        elements.quizModal.classList.remove('hidden');
    }

    function handleGameOver(result) {
        elements.finalScore.textContent = result.score;
        elements.correctCount.textContent = result.correctCount;
        elements.wrongCount.textContent = result.wrongCount;

        // 게임 클리어 시 메시지 변경
        const gameoverScreen = screens.gameover;
        const title = gameoverScreen.querySelector('h2');

        if (result.cleared) {
            title.textContent = '\uD83C\uDF89 축하합니다! \uD83C\uDF89';
            gameoverScreen.style.background = 'linear-gradient(180deg, #27ae60 0%, #2ecc71 100%)';
            elements.clearEffect.classList.remove('hidden');
        } else {
            title.textContent = '게임 오버!';
            gameoverScreen.style.background = 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)';
            elements.clearEffect.classList.add('hidden');
        }

        showScreen('gameover');
    }
});

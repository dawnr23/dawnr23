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
        quizModal: document.getElementById('quiz-modal'),
        quizWord: document.getElementById('quiz-word'),
        quizOptions: document.getElementById('quiz-options'),
        finalScore: document.getElementById('final-score'),
        correctCount: document.getElementById('correct-count'),
        wrongCount: document.getElementById('wrong-count'),
        retryBtn: document.getElementById('retry-btn'),
        homeBtn: document.getElementById('home-btn')
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

        // 게임 인스턴스 생성
        game = new FlappyBirdGame(elements.canvas, {
            onScore: updateScore,
            onQuiz: showQuiz,
            onGameOver: handleGameOver,
            onWordCountChange: updateWordCount
        });
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

            // 게임 시작
            showScreen('game');
            game.init(currentQuestions);
            game.start();

        } catch (error) {
            console.error('게임 시작 실패:', error);
            elements.errorText.textContent = error.message || '문제를 불러오는데 실패했습니다.';
            elements.errorText.classList.remove('hidden');
        } finally {
            elements.startBtn.disabled = false;
            elements.loadingText.classList.add('hidden');
        }
    }

    function retryGame() {
        showScreen('game');
        game.init(currentQuestions);
        game.start();
    }

    function goHome() {
        showScreen('start');
    }

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        screens[screenName].classList.add('active');

        if (screenName === 'game') {
            game.resize();
        }
    }

    function updateScore(score) {
        elements.score.textContent = score;
    }

    function updateWordCount(count) {
        elements.wordCount.textContent = count;
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
            title.textContent = '🎉 축하합니다!';
            gameoverScreen.style.background = 'linear-gradient(180deg, #27ae60 0%, #2ecc71 100%)';
        } else {
            title.textContent = '게임 오버!';
            gameoverScreen.style.background = 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)';
        }

        showScreen('gameover');
    }
});

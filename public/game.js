/**
 * 플래피버드 게임 엔진
 */

class FlappyBirdGame {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // 게임 설정
        this.gravity = options.gravity || 0.5;
        this.jumpForce = options.jumpForce || -5;
        this.fallSpeed = options.fallSpeed || 3;
        this.pipeSpeed = options.pipeSpeed || 2;
        this.pipeGap = options.pipeGap || 180;
        this.pipeWidth = options.pipeWidth || 60;
        this.pipeSpacing = options.pipeSpacing || 440;

        // 게임 상태
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.maxHp = 3;
        this.hp = this.maxHp;

        // 새 (플레이어)
        this.bird = {
            x: 80,
            y: 0,
            width: 40,
            height: 30,
            velocity: 0,
            rotation: 0
        };

        // 파이프 배열
        this.pipes = [];

        // 문제풀
        this.questions = [];
        this.currentQuestionIndex = 0;

        // 콜백
        this.onScore = options.onScore || (() => {});
        this.onQuiz = options.onQuiz || (() => {});
        this.onGameOver = options.onGameOver || (() => {});
        this.onWordCountChange = options.onWordCountChange || (() => {});
        this.onHpChange = options.onHpChange || (() => {});

        // 캔버스 크기 설정 (bird 초기화 후 호출)
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 입력 이벤트 바인딩
        this.bindEvents();

        // 애니메이션 프레임 ID
        this.animationId = null;
    }

    resize() {
        // #app 컨테이너 또는 viewport 기준으로 크기 계산
        const appEl = document.getElementById('app');
        const availableWidth = appEl ? appEl.clientWidth : window.innerWidth;
        const canvasWidth = Math.min(Math.max(availableWidth, 320), 480);
        const canvasHeight = Math.max(window.innerHeight - 50, 400);

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // CSS 크기도 명시적으로 설정
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';

        this.bird.y = canvasHeight / 2;
    }

    bindEvents() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isRunning && !this.isPaused) {
                e.preventDefault();
                this.jump();
            }
        });

        // 터치/클릭 이벤트
        this.canvas.addEventListener('click', () => {
            if (this.isRunning && !this.isPaused) {
                this.jump();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isRunning && !this.isPaused) {
                this.jump();
            }
        });
    }

    init(questions) {
        this.allQuestions = [...questions];
        this.questions = this.shuffleArray([...questions]).slice(0, 8);
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.hp = this.maxHp;
        this.pipes = [];

        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;

        this.onWordCountChange(this.questions.length);
        this.onScore(0);
        this.onHpChange(this.hp, this.maxHp);
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    jump() {
        this.bird.velocity = this.jumpForce;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;

        try {
            this.update();
            this.draw();
        } catch (error) {
            console.error('게임 루프 오류:', error);
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // 새 물리 (등속 낙하: fallSpeed에 수렴)
        if (this.bird.velocity < this.fallSpeed) {
            this.bird.velocity += this.gravity;
            if (this.bird.velocity > this.fallSpeed) {
                this.bird.velocity = this.fallSpeed;
            }
        } else {
            this.bird.velocity = this.fallSpeed;
        }
        this.bird.y += this.bird.velocity;

        // 새 회전 (속도에 따라)
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

        // 천장 충돌
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }

        // 바닥 충돌 → 게임오버
        if (this.bird.y + this.bird.height > this.canvas.height - 25) {
            this.gameOver();
            return;
        }

        // 파이프 생성
        if (this.pipes.length === 0 ||
            this.pipes[this.pipes.length - 1].x < this.canvas.width - this.pipeSpacing) {
            this.createPipe();
        }

        // 파이프 업데이트
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;

            // 화면 밖으로 나간 파이프 제거 (퀴즈 트리거 후에만)
            if (pipe.x + this.pipeWidth < -this.pipeSpacing && pipe.quizTriggered) {
                this.pipes.splice(i, 1);
                continue;
            }

            // 파이프 통과 마킹
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
            }

            // 기둥 사이 중간지점에서 퀴즈 출제
            if (pipe.passed && !pipe.quizTriggered) {
                const midGapX = pipe.x + this.pipeWidth + (this.pipeSpacing - this.pipeWidth) / 2;
                if (midGapX < this.bird.x) {
                    pipe.quizTriggered = true;
                    this.triggerQuiz();
                }
            }

            // 파이프 충돌 — HP 차감 + 물리적 벽
            if (this.checkCollision(pipe)) {
                if (!pipe.hitDamaged) {
                    pipe.hitDamaged = true;
                    this.hp--;
                    this.onHpChange(this.hp, this.maxHp);
                    if (this.hp <= 0) {
                        this.gameOver();
                        return;
                    }
                }

                const birdRight = this.bird.x + this.bird.width;
                const pipeLeft = pipe.x;
                const pipeRight = pipe.x + this.pipeWidth;

                if (birdRight > pipeLeft && this.bird.x < pipeRight) {
                    if (this.bird.y < pipe.topHeight) {
                        this.bird.y = pipe.topHeight;
                        this.bird.velocity = 2;
                    }
                    if (this.bird.y + this.bird.height > pipe.bottomY) {
                        this.bird.y = pipe.bottomY - this.bird.height;
                        this.bird.velocity = this.jumpForce * 1.5;
                    }
                }
            } else {
                pipe.hitDamaged = false;
            }
        }
    }

    createPipe() {
        const minHeight = 80;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            passed: false
        });
    }

    checkCollision(pipe) {
        const birdBox = {
            left: this.bird.x + 5,
            right: this.bird.x + this.bird.width - 5,
            top: this.bird.y + 5,
            bottom: this.bird.y + this.bird.height - 5
        };

        const pipeBox = {
            left: pipe.x,
            right: pipe.x + this.pipeWidth
        };

        // 파이프와 x축 겹침 확인
        if (birdBox.right > pipeBox.left && birdBox.left < pipeBox.right) {
            // 위쪽 파이프 충돌
            if (birdBox.top < pipe.topHeight) {
                return true;
            }
            // 아래쪽 파이프 충돌
            if (birdBox.bottom > pipe.bottomY) {
                return true;
            }
        }

        return false;
    }

    triggerQuiz() {
        if (this.currentQuestionIndex >= this.questions.length) {
            // 모든 문제를 풀었으면 게임 클리어
            this.gameOver(true);
            return;
        }

        this.pause();
        const currentQuestion = this.questions[this.currentQuestionIndex];
        const options = ARGongAPI.generateQuizOptions(currentQuestion, this.allQuestions);

        this.onQuiz(currentQuestion, options, (isCorrect) => {
            if (isCorrect) {
                this.correctCount++;
                this.score += 10;
                this.onScore(this.score);
            } else {
                this.wrongCount++;
                this.hp--;
                this.onHpChange(this.hp, this.maxHp);
                if (this.hp <= 0) {
                    this.gameOver();
                    return;
                }
            }

            this.currentQuestionIndex++;
            this.onWordCountChange(this.questions.length - this.currentQuestionIndex);

            // 모든 문제를 풀었는지 확인
            if (this.currentQuestionIndex >= this.questions.length) {
                this.gameOver(true);
                return;
            }

            this.resume();
        });
    }

    gameOver(cleared = false) {
        this.stop();
        this.onGameOver({
            score: this.score,
            correctCount: this.correctCount,
            wrongCount: this.wrongCount,
            cleared: cleared
        });
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 배경 그리기 (하늘 그라데이션)
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8C8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 구름 그리기
        this.drawClouds();

        // 파이프 그리기
        this.pipes.forEach(pipe => this.drawPipe(pipe));

        // 바닥 그리기
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, height - 20, width, 20);
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, height - 25, width, 5);

        // 새 그리기
        this.drawBird();
    }

    drawClouds() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // 간단한 구름들
        const clouds = [
            { x: 50, y: 80, size: 40 },
            { x: 200, y: 120, size: 50 },
            { x: 350, y: 60, size: 35 }
        ];

        clouds.forEach(cloud => {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - 10, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 1.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawPipe(pipe) {
        const ctx = this.ctx;
        const width = this.pipeWidth;

        // 파이프 색상
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + width, 0);
        pipeGradient.addColorStop(0, '#2ECC71');
        pipeGradient.addColorStop(0.5, '#58D68D');
        pipeGradient.addColorStop(1, '#27AE60');

        // 위쪽 파이프
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(pipe.x, 0, width, pipe.topHeight);

        // 위쪽 파이프 입구
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, width + 10, 30);

        // 아래쪽 파이프
        ctx.fillRect(pipe.x, pipe.bottomY, width, this.canvas.height - pipe.bottomY);

        // 아래쪽 파이프 입구
        ctx.fillRect(pipe.x - 5, pipe.bottomY, width + 10, 30);

        // 파이프 테두리
        ctx.strokeStyle = '#1E8449';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, width, pipe.topHeight);
        ctx.strokeRect(pipe.x, pipe.bottomY, width, this.canvas.height - pipe.bottomY);
    }

    drawBird() {
        const ctx = this.ctx;
        const { x, y, width, height, rotation } = this.bird;

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        // 몸통 (노란색)
        ctx.fillStyle = '#F1C40F';
        ctx.beginPath();
        ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 몸통 테두리
        ctx.strokeStyle = '#D68910';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 눈 (흰색)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 8, 0, Math.PI * 2);
        ctx.fill();

        // 눈동자
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        // 부리 (주황색)
        ctx.fillStyle = '#E67E22';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(25, 3);
        ctx.lineTo(15, 6);
        ctx.closePath();
        ctx.fill();

        // 날개
        ctx.fillStyle = '#F39C12';
        ctx.beginPath();
        ctx.ellipse(-5, 5, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 전역으로 노출
window.FlappyBirdGame = FlappyBirdGame;

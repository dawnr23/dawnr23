/**
 * ARGong 문제풀 API 연동 모듈
 * Azure Blob Storage에서 학년/출판사/단원별 문제풀을 가져옵니다.
 */

const ARGongAPI = {
    // 베이스 URL
    BASE_URL: 'https://argame3.blob.core.windows.net/questionpool-jsons',

    // 출판사 정보
    publishers: {
        'DK': '동아출판',
        'DA': '대교',
        'CJ': '천재교육',
        'YBMC': 'YBM (최희경)',
        'YBMK': 'YBM (김혜리)',
        'MN': '미래엔',
        'CJL': '천재교육 (이재근)',
        'CJK': '천재교육 (김)',
        'IC': '아이스크림'
    },

    // 학년별 기본 단원 수 (출판사마다 다를 수 있음)
    defaultLessonCounts: {
        3: 10,
        4: 10,
        5: 12,
        6: 12
    },

    /**
     * 문제풀을 가져옵니다.
     * @param {number} grade - 학년 (3-6)
     * @param {string} publisher - 출판사 코드
     * @param {number} lesson - 단원 번호
     * @returns {Promise<Array>} 문제 배열
     */
    async fetchQuestionPool(grade, publisher, lesson) {
        const url = `${this.BASE_URL}/activity/${publisher}-${grade}-${lesson}.json`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: 문제풀을 찾을 수 없습니다.`);
            }

            const questions = await response.json();
            return questions;
        } catch (error) {
            console.error('문제풀 로드 실패:', error);
            throw error;
        }
    },

    /**
     * 단어(word) 타입 문제만 필터링합니다.
     * @param {Array} questions - 전체 문제 배열
     * @returns {Array} 단어 문제만 포함된 배열
     */
    filterWordQuestions(questions) {
        return questions.filter(q =>
            q.category === 'word' &&
            q.except !== 1 &&
            q.content &&
            q.kor
        );
    },

    /**
     * 게임용으로 문제를 포맷팅합니다.
     * @param {Array} questions - 문제 배열
     * @returns {Array} 게임용 포맷된 문제 배열
     */
    formatForGame(questions) {
        return questions.map(q => ({
            id: q.ID,
            english: q.content.trim(),
            korean: q.kor.trim(),
            topic: q.Topic || '',
            image: q.img ? `${this.BASE_URL}/activity/images/${q.img}` : null,
            audio: q.audio || null
        }));
    },

    /**
     * 게임에 사용할 문제풀을 가져와 포맷팅합니다.
     * @param {number} grade - 학년
     * @param {string} publisher - 출판사 코드
     * @param {number} lesson - 단원 번호
     * @returns {Promise<Array>} 게임용 포맷된 단어 문제 배열
     */
    async getGameQuestions(grade, publisher, lesson) {
        const allQuestions = await this.fetchQuestionPool(grade, publisher, lesson);
        const wordQuestions = this.filterWordQuestions(allQuestions);

        if (wordQuestions.length === 0) {
            throw new Error('해당 단원에 단어 문제가 없습니다.');
        }

        return this.formatForGame(wordQuestions);
    },

    /**
     * 퀴즈 보기를 생성합니다 (정답 1개 + 오답 3개)
     * @param {Object} correctQuestion - 정답 문제
     * @param {Array} allQuestions - 전체 문제 배열
     * @returns {Array} 섞인 4개의 보기 배열
     */
    generateQuizOptions(correctQuestion, allQuestions) {
        const options = [{ text: correctQuestion.korean, isCorrect: true }];

        // 오답 후보 생성 (정답 제외)
        const wrongCandidates = allQuestions
            .filter(q => q.id !== correctQuestion.id)
            .map(q => q.korean);

        // 중복 제거
        const uniqueWrongAnswers = [...new Set(wrongCandidates)];

        // 랜덤하게 3개 선택
        const shuffled = uniqueWrongAnswers.sort(() => Math.random() - 0.5);
        const wrongAnswers = shuffled.slice(0, 3);

        // 오답이 3개 미만이면 기본 오답 추가
        const defaultWrongAnswers = ['사과', '학교', '친구', '선생님', '책', '연필'];
        while (wrongAnswers.length < 3) {
            const randomDefault = defaultWrongAnswers[Math.floor(Math.random() * defaultWrongAnswers.length)];
            if (!wrongAnswers.includes(randomDefault) && randomDefault !== correctQuestion.korean) {
                wrongAnswers.push(randomDefault);
            }
        }

        // 오답 추가
        wrongAnswers.forEach(answer => {
            options.push({ text: answer, isCorrect: false });
        });

        // 보기 섞기
        return options.sort(() => Math.random() - 0.5);
    }
};

// 전역으로 노출
window.ARGongAPI = ARGongAPI;

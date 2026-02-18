/**
 * Cloudflare Worker - Azure Blob Storage 프록시
 * 프론트엔드에서 /api/questions 요청 시 Azure에 인증 후 데이터 반환
 */

const AZURE_ACCOUNT = 'argame3';
// AZURE_ACCESS_KEY는 Cloudflare Workers Secret으로 주입 (env.AZURE_ACCESS_KEY)
// 배포 시: npx wrangler secret put AZURE_ACCESS_KEY
const AZURE_API_VERSION = '2020-10-02';

/**
 * HMAC-SHA256 서명 생성
 */
async function createSignature(stringToSign, key) {
    const keyBytes = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(stringToSign));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Azure Blob Storage SharedKey 인증 헤더 생성
 */
async function createAzureAuthHeaders(method, container, blobPath, accessKey) {
    const now = new Date().toUTCString();

    const canonicalizedHeaders = `x-ms-date:${now}\nx-ms-version:${AZURE_API_VERSION}\n`;
    const canonicalizedResource = `/${AZURE_ACCOUNT}/${container}/${blobPath}`;

    const stringToSign = [
        method,    // VERB
        '',        // Content-Encoding
        '',        // Content-Language
        '',        // Content-Length
        '',        // Content-MD5
        '',        // Content-Type
        '',        // Date
        '',        // If-Modified-Since
        '',        // If-Match
        '',        // If-None-Match
        '',        // If-Unmodified-Since
        '',        // Range
        canonicalizedHeaders + canonicalizedResource
    ].join('\n');

    const signature = await createSignature(stringToSign, accessKey);

    return {
        'x-ms-date': now,
        'x-ms-version': AZURE_API_VERSION,
        'Authorization': `SharedKey ${AZURE_ACCOUNT}:${signature}`
    };
}

/**
 * Azure Blob에서 문제풀 JSON 가져오기
 */
async function fetchFromAzure(container, blobPath, accessKey) {
    const headers = await createAzureAuthHeaders('GET', container, blobPath, accessKey);
    const url = `https://${AZURE_ACCOUNT}.blob.core.windows.net/${container}/${blobPath}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`Azure Blob 응답: ${response.status} ${response.statusText}`);
    }

    return response;
}

/**
 * 출판사 코드로 컨테이너 결정
 */
function getContainer(publisher) {
    const vnPublishers = ['GDTA', 'GDFF', 'GDGS'];
    if (vnPublishers.includes(publisher)) {
        return 'questionpool-jsons-vn';
    }
    return 'questionpool-jsons';
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // API 라우트: /api/questions/:publisher/:grade/:lesson
        if (url.pathname.startsWith('/api/questions/')) {
            const parts = url.pathname.replace('/api/questions/', '').split('/');
            if (parts.length !== 3) {
                return new Response(JSON.stringify({ error: 'Invalid path. Use /api/questions/{publisher}/{grade}/{lesson}' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const [publisher, grade, lesson] = parts;
            const container = getContainer(publisher);
            const blobPath = `activity/${publisher}-${grade}-${lesson}.json`;

            try {
                const accessKey = env.AZURE_ACCESS_KEY;
                if (!accessKey) {
                    return new Response(JSON.stringify({ error: 'AZURE_ACCESS_KEY가 설정되지 않았습니다.' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                const azureResponse = await fetchFromAzure(container, blobPath, accessKey);
                const data = await azureResponse.text();

                return new Response(data, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=3600'
                    }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 정적 파일은 Assets로 서빙
        return env.ASSETS.fetch(request);
    }
};

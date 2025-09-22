export function loadKakaoSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve(window.kakao)
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
    }&autoload=false&libraries=services` // ✅ autoload=false 추가
    script.onload = () => {
      // SDK 초기화
      window.kakao.maps.load(() => {
        resolve(window.kakao)
      })
    }
    script.onerror = () => reject(new Error('카카오 지도 SDK 로드 실패'))
    document.head.appendChild(script)
  })
}

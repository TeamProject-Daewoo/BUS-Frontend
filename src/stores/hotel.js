// src/stores/hotel.js
import { defineStore } from 'pinia'
import { listMyHotels } from '@/api/business'

const STORAGE_KEY = 'selectedContentId'

export const useHotelStore = defineStore('hotel', {
  state: () => ({
    hotels: [],
    selectedContentId: localStorage.getItem(STORAGE_KEY) || '',
    loading: false,
    error: null,

    showHotelRegisterModal: false, // 모달 상태는 여전히 관리
  }),

  getters: {
    selectedHotel(state) {
      return state.hotels.find(h => h.contentid === state.selectedContentId) || null
    },
    hasHotels(state) {
      return Array.isArray(state.hotels) && state.hotels.length > 0
    }
  },

  actions: {
    persist() {
      if (this.selectedContentId) localStorage.setItem(STORAGE_KEY, this.selectedContentId)
      else localStorage.removeItem(STORAGE_KEY)
    },

    restore() {
      const saved = localStorage.getItem(STORAGE_KEY)
      this.selectedContentId = saved || ''
    },

    setSelected(contentid) {
      this.selectedContentId = contentid || ''
      this.persist()
    },

    async loadHotels() {
      this.loading = true
      this.error = null
      try {
        const { data } = await listMyHotels()
        this.hotels = Array.isArray(data) ? data : []
        if (
          !this.selectedContentId ||
          !this.hotels.some(h => h.contentid === this.selectedContentId)
        ) {
          this.selectedContentId = this.hotels[0]?.contentid || ''
          this.persist()
        }
      } catch (e) {
        if (e.response?.status === 403) {
          console.warn('[hotelStore] 호텔 없음')
          this.hotels = []
          this.selectedContentId = ''
        } else {
          console.error('[hotelStore] loadHotels failed', e)
          this.error = e?.message || 'failed'
        }
      } finally {
        console.log('호텔 불러오기')
        this.loading = false
      }
    }
  }
})

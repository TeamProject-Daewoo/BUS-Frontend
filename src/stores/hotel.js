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
  }),

  getters: {
    selectedHotel(state) {
      return state.hotels.find(h => h.contentid === state.selectedContentId) || null
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
        // 저장된 값이 없거나 더 이상 유효하지 않으면 첫 번째로 고정
        if (!this.selectedContentId || !this.hotels.some(h => h.contentid === this.selectedContentId)) {
          this.selectedContentId = this.hotels[0]?.contentid || ''
          this.persist()
        }
      } catch (e) {
        console.error('[hotelStore] loadHotels failed', e)
        this.error = e?.message || 'failed'
      } finally {
        this.loading = false
      }
    }
  }
})

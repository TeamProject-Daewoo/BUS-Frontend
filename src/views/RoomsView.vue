<template>
  <div>
    <h1>객실 관리</h1>

    <div class="card">
      <h3>객실 추가</h3>
      <div class="grid">
        <input v-model="form.roomtitle" placeholder="객실명"/>
        <input v-model.number="form.roombasecount" type="number" placeholder="기준인원"/>
        <input v-model.number="form.roommaxcount" type="number" placeholder="최대인원"/>
        <input v-model.number="form.roomoffseasonminfee1" type="number" placeholder="비수기 요금"/>
        <input v-model.number="form.roompeakseasonminfee1" type="number" placeholder="성수기 요금"/>
        <button class="btn" @click="add">추가</button>
      </div>
    </div>

    <div class="room-list">
      <div class="card room" v-for="r in rooms" :key="r.id">
        <div>
          <div class="title">{{ r.roomtitle }}</div>
          <div class="meta">기준 {{ r.roombasecount }} / 최대 {{ r.roommaxcount }}</div>
          <div class="meta">₩ {{ n(r.roomoffseasonminfee1) }} ~ {{ n(r.roompeakseasonminfee1) }}</div>
        </div>
        <div class="actions">
          <button class="btn-outline" @click="edit(r)">수정</button>
          <button class="btn-danger" @click="remove(r.id)">삭제</button>
        </div>
      </div>
    </div>

    <dialog ref="dlg">
      <div class="card">
        <h3>객실 수정</h3>
        <div class="grid">
          <input v-model="editForm.roomtitle" placeholder="객실명"/>
          <input v-model.number="editForm.roombasecount" type="number" placeholder="기준인원"/>
          <input v-model.number="editForm.roommaxcount" type="number" placeholder="최대인원"/>
          <input v-model.number="editForm.roomoffseasonminfee1" type="number" placeholder="비수기 요금"/>
          <input v-model.number="editForm.roompeakseasonminfee1" type="number" placeholder="성수기 요금"/>
          <div class="gap"></div>
          <button class="btn" @click="save">저장</button>
          <button class="btn-outline" @click="close">닫기</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRooms, createRoom, updateRoomApi, deleteRoomApi } from '@/api/business'

const rooms = ref([])
const form = ref({
  roomtitle: '',
  roombasecount: 2,
  roommaxcount: 2,
  roomoffseasonminfee1: 50000,
  roompeakseasonminfee1: 80000
})

const dlg = ref(null)
const editForm = ref({})
const editingId = ref(null)

onMounted(load)

async function load() {
  try {
    const { data } = await getRooms()
    rooms.value = data ?? []
  } catch (e) {
    console.error('[rooms] load failed', e)
    rooms.value = []
  }
}

async function add() {
  if (!form.value.roomtitle) return
  try {
    await createRoom(form.value)
    Object.assign(form.value, {
      roomtitle: '',
      roombasecount: 2,
      roommaxcount: 2,
      roomoffseasonminfee1: 50000,
      roompeakseasonminfee1: 80000
    })
    await load()
  } catch (e) {
    console.error('[rooms] create failed', e)
  }
}

function edit(r) {
  editingId.value = r.id
  editForm.value = { ...r }
  dlg.value?.showModal()
}

function close() {
  dlg.value?.close()
}

async function save() {
  try {
    await updateRoomApi(editingId.value, editForm.value)
    close()
    await load()
  } catch (e) {
    console.error('[rooms] update failed', e)
  }
}

async function remove(id) {
  if (!confirm('삭제할까요?')) return
  try {
    await deleteRoomApi(id)
    await load()
  } catch (e) {
    console.error('[rooms] delete failed', e)
  }
}

function n(v) { return (v ?? 0).toLocaleString() }
</script>

<style scoped>
.grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:8px; }
.room-list { display:grid; gap:12px; margin-top:16px; }
.room { display:flex; justify-content:space-between; align-items:center; }
.title { font-weight:700; }
.meta { color:#6b7280; font-size:14px; }
.btn { background:#22c55e; color:#fff; border:none; padding:8px 12px; border-radius:6px; }
.btn-outline { border:1px solid #ddd; background:#fff; padding:8px 12px; border-radius:6px; }
.btn-danger { background:#ef4444; color:#fff; border:none; padding:8px 12px; border-radius:6px; }
dialog { border:none; padding:0; }
</style>

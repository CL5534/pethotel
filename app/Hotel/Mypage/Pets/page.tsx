"use client";
import { useState } from "react";

type Pet = {
  id: number;
  name: string;
  breed: string;
  weight: string;
  neutered: boolean;
  notes: string;
  imageUrl: string;
};

const INITIAL_PETS: Pet[] = [
  { id: 1, name: "초코", breed: "말티즈", weight: "3.2", neutered: true, notes: "낯선 사람에게 짖어요. 사료는 로얄캐닌 급여 중.", imageUrl: "" },
  { id: 2, name: "뭉치", breed: "비숑프리제", weight: "4.8", neutered: false, notes: "활발하고 사람 좋아해요.", imageUrl: "" },
];

const EMPTY_FORM = { name: "", breed: "", weight: "", neutered: false, notes: "", imageUrl: "" };

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSubmit = () => {
    if (!form.name || !form.breed || !form.weight) return;
    if (editId !== null) {
      setPets((prev) => prev.map((p) => (p.id === editId ? { ...p, ...form } : p)));
      setEditId(null);
    } else {
      setPets((prev) => [...prev, { ...form, id: Date.now() }]);
    }
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  };

  const handleEdit = (pet: Pet) => {
    setForm({ name: pet.name, breed: pet.breed, weight: pet.weight, neutered: pet.neutered, notes: pet.notes, imageUrl: pet.imageUrl });
    setEditId(pet.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="mb-8">
        <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          🐾 마이펫 관리
        </span>
        <h2 className="text-3xl font-bold text-gray-900">우리 아이 정보 관리</h2>
        <p className="text-gray-500 mt-2">한 번 등록하면 예약이 10초 만에 끝나요!</p>
      </div>

      {/* 프로모 배너 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 mb-8 flex items-center justify-between text-white">
        <div>
          <p className="font-bold text-lg">🚀 예약 시간을 줄여보세요</p>
          <p className="text-blue-100 text-sm mt-1">펫 정보를 미리 저장하면 예약할 때 바로 선택만 하면 됩니다.</p>
        </div>
        <span className="text-5xl">🐶</span>
      </div>

      {/* 펫 리스트 */}
      <div className="space-y-4 mb-6">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* 아바타 */}
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {pet.imageUrl ? <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" /> : "🐾"}
              </div>
              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-gray-900">{pet.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pet.breed}</span>
                  {pet.neutered && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">중성화 ✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">⚖️ {pet.weight}kg</p>
                {pet.notes && <p className="text-sm text-gray-400 mt-1 truncate">💬 {pet.notes}</p>}
              </div>
              {/* 버튼 */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(pet)}
                  className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 font-medium"
                >
                  수정
                </button>
                <button
                  onClick={() => setDeleteId(pet.id)}
                  className="text-sm border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-500 font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 추가 버튼 */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM }); }}
          className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-colors"
        >
          + 반려동물 등록하기
        </button>
      )}

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mt-4">
          <h3 className="font-bold text-gray-900 text-lg mb-5">
            {editId !== null ? "✏️ 정보 수정" : "🐾 새 반려동물 등록"}
          </h3>
          <div className="space-y-4">
            {/* 이름 + 종 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 초코"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">견종 *</label>
                <input
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  placeholder="예: 말티즈"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* 몸무게 */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">몸무게 (kg) *</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="예: 3.2"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* 중성화 여부 */}
            <div
              onClick={() => setForm({ ...form, neutered: !form.neutered })}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors
                ${form.neutered ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div>
                <p className="font-semibold text-gray-800 text-sm">중성화 여부</p>
                <p className="text-xs text-gray-400 mt-0.5">중성화 수술을 받았나요?</p>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 
                ${form.neutered ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.neutered ? "translate-x-6" : ""}`} />
              </div>
            </div>

            {/* 특이사항 */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">특이사항 / 건강 정보</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="예: 낯선 사람에게 짖어요 / 알레르기 있어요 / 약 복용 중"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 min-h-[80px] resize-none"
              />
            </div>

            {/* 사진 업로드 */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">사진 업로드</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm hover:border-blue-300 cursor-pointer transition-colors">
                📸 클릭하여 사진을 업로드하세요
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.breed || !form.weight}
                className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {editId !== null ? "수정 완료" : "등록하기"} 🐾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-3xl text-center mb-3">🗑️</div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-2">정말 삭제하시겠어요?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">삭제하면 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50">
                취소
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
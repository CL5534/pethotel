"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PetSize = "small" | "medium"; // ✅ DB에 저장할 값

type PetRow = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  breed: string | null;
  weight: number;
  size: PetSize | null; // ✅ 추가
  is_neutered: boolean | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string | null;
};

type PetForm = {
  name: string;
  type: "dog" | "cat";
  breed: string;
  weight: string;
  neutered: boolean;
  notes: string;
  imageUrl: string;
  size: PetSize; // ✅ 추가(선택형)
};

const EMPTY_FORM: PetForm = {
  name: "",
  type: "dog",
  breed: "",
  weight: "",
  neutered: false,
  notes: "",
  imageUrl: "",
  size: "small",
};

// ✅ 기준
const SMALL_MAX = 5;
const MEDIUM_MAX = 15;
const HARD_LIMIT = 15;

function sizeLabel(size: PetSize) {
  return size === "small" ? "소형견(≤5kg)" : "중형견(>5kg ~ ≤15kg)";
}

function isSizeWeightMatch(size: PetSize, weight: number) {
  if (!Number.isFinite(weight) || weight <= 0) return false;
  if (weight > HARD_LIMIT) return false;

  if (size === "small") return weight <= SMALL_MAX;
  return weight > SMALL_MAX && weight <= MEDIUM_MAX;
}

function inferSizeByWeight(weight: number): PetSize {
  return weight <= SMALL_MAX ? "small" : "medium";
}

export default function Pets() {
  const [pets, setPets] = useState<PetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PetForm>({ ...EMPTY_FORM });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ✅ 사진 파일
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ✅ weight 숫자화 + 유효성
  const weightNum = useMemo(() => {
    const n = Number(form.weight);
    if (!Number.isFinite(n)) return NaN;
    return n;
  }, [form.weight]);

  const isWeightValidNumber = Number.isFinite(weightNum) && weightNum > 0;
  const isOverLimit = isWeightValidNumber && weightNum > HARD_LIMIT;

  // ✅ 현재 선택(size)과 몸무게가 규칙에 맞는지
  const isMatch = useMemo(() => {
    if (!isWeightValidNumber) return false;
    return isSizeWeightMatch(form.size, weightNum);
  }, [form.size, isWeightValidNumber, weightNum]);

  const hint = useMemo(() => {
    if (!form.weight) return "몸무게를 입력하고 소형/중형을 선택하세요.";
    if (!isWeightValidNumber) return "몸무게는 0보다 큰 숫자여야 합니다.";
    if (isOverLimit) return "15kg 초과는 등록할 수 없습니다.";

    if (!isMatch) {
      if (form.size === "small") return "소형은 5kg 이하여야 합니다.";
      return "중형은 5kg 초과 ~ 15kg 이하여야 합니다.";
    }

    return `선택 분류: ${sizeLabel(form.size)} ✅`;
  }, [form.size, form.weight, isMatch, isOverLimit, isWeightValidNumber]);

  async function fetchPets() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setPets([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("id, owner_id, name, type, breed, weight, size, is_neutered, notes, photo_url, created_at")
      .eq("owner_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("펫 목록 조회 실패");
      setPets([]);
    } else {
      setPets((data ?? []) as PetRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPets();
  }, []);

  // ✅ Storage 업로드 (버킷명: pet_image)
  async function uploadPhoto(ownerId: string, petId: string, f: File) {
    const ext = f.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${ext}`;
    const path = `${ownerId}/${petId}/${fileName}`;

    const { error } = await supabase.storage.from("pet_image").upload(path, f, {
      upsert: true,
      contentType: f.type,
    });
    if (error) throw error;

    const { data } = supabase.storage.from("pet_image").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!form.name || !form.weight || !form.type) return;

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!isWeightValidNumber) {
      alert("몸무게를 올바르게 입력하세요. (0보다 큰 숫자)");
      return;
    }
    if (weightNum > HARD_LIMIT) {
      alert("15kg 초과 반려동물은 현재 호텔 규정상 등록할 수 없습니다.");
      return;
    }
    if (!isSizeWeightMatch(form.size, weightNum)) {
      alert(form.size === "small" ? "소형은 5kg 이하여야 합니다." : "중형은 5kg 초과 ~ 15kg 이하여야 합니다.");
      return;
    }

    try {
      // ✅ 수정
      if (editId) {
        let photoUrl = form.imageUrl || null;

        if (file) {
          photoUrl = await uploadPhoto(user.id, editId, file);
        }

        const { error } = await supabase
          .from("pets")
          .update({
            name: form.name,
            type: form.type,
            breed: form.breed || null,
            weight: weightNum,
            size: form.size, // ✅ DB 저장
            is_neutered: form.neutered,
            notes: form.notes || null,
            photo_url: photoUrl,
          })
          .eq("id", editId);

        if (error) throw error;

        setShowForm(false);
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setFile(null);

        await fetchPets();
        return;
      }

      // ✅ 신규 등록
      const { data: inserted, error: insertError } = await supabase
        .from("pets")
        .insert({
          owner_id: user.id,
          name: form.name,
          type: form.type,
          breed: form.breed || null,
          weight: weightNum,
          size: form.size, // ✅ DB 저장
          is_neutered: form.neutered,
          notes: form.notes || null,
          photo_url: null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (file) {
        const url = await uploadPhoto(user.id, inserted.id, file);
        const { error: photoErr } = await supabase.from("pets").update({ photo_url: url }).eq("id", inserted.id);
        if (photoErr) throw photoErr;
      }

      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
      setFile(null);

      await fetchPets();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ? `저장 실패: ${e.message}` : "저장 실패");
    }
  }

  function handleEdit(pet: PetRow) {
    const safeSize: PetSize =
      pet.size ?? inferSizeByWeight(Number(pet.weight ?? 0)); // ✅ 기존 데이터 size가 없으면 weight로 보정

    setForm({
      name: pet.name ?? "",
      type: pet.type === "cat" ? "cat" : "dog",
      breed: pet.breed ?? "",
      weight: String(pet.weight ?? ""),
      neutered: Boolean(pet.is_neutered),
      notes: pet.notes ?? "",
      imageUrl: pet.photo_url ?? "",
      size: safeSize,
    });
    setEditId(pet.id);
    setFile(null);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("pets").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("삭제 실패");
      return;
    }
    setDeleteId(null);
    await fetchPets();
  }

  const canSubmit =
    Boolean(form.name) &&
    Boolean(form.type) &&
    Boolean(form.weight) &&
    isWeightValidNumber &&
    !isOverLimit &&
    isMatch;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="mb-8">
        <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          🐾 마이펫 관리
        </span>
        <h2 className="text-3xl font-bold text-gray-900">우리 아이 정보 관리</h2>
        <p className="text-gray-500 mt-2">소형/중형은 DB에 저장됩니다.</p>
      </div>

      {loading && <div className="text-gray-400 text-sm mb-6">불러오는 중...</div>}

      {/* 리스트 */}
      <div className="space-y-4 mb-6">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  "🐾"
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-lg text-gray-900">{pet.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {pet.type === "cat" ? "고양이" : "강아지"}
                  </span>
                  {pet.size && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {pet.size === "small" ? "소형" : "중형"}
                    </span>
                  )}
                  {pet.breed && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pet.breed}</span>
                  )}
                  {pet.is_neutered && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">중성화 ✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">⚖️ {pet.weight}kg</p>
                {pet.notes && <p className="text-sm text-gray-400 mt-1 truncate">💬 {pet.notes}</p>}
              </div>

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
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({ ...EMPTY_FORM });
            setFile(null);
          }}
          className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-colors"
        >
          + 반려동물 등록하기
        </button>
      )}

      {/* 폼 */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mt-4">
          <h3 className="font-bold text-gray-900 text-lg mb-5">{editId ? "✏️ 정보 수정" : "🐾 새 반려동물 등록"}</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">종류 *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "dog" | "cat" })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="dog">강아지</option>
                </select>
              </div>
            </div>

            {/* ✅ 소형/중형 선택 */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="text-sm font-semibold text-gray-700 mb-2">🐶 크기 선택 (DB 저장)</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, size: "small" }))}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-colors ${
                    form.size === "small"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {sizeLabel("small")}
                </button>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, size: "medium" }))}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-colors ${
                    form.size === "medium"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {sizeLabel("medium")}
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                규정: 소형 ≤ {SMALL_MAX}kg / 중형 ≤ {MEDIUM_MAX}kg / 15kg 초과 등록 불가
              </div>
            </div>

            {/* ✅ 몸무게 */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">몸무게 (kg) *</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none ${
                  isOverLimit || (form.weight && !isMatch)
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-400"
                }`}
              />

              <div className={`mt-2 text-xs ${isOverLimit || (form.weight && !isMatch) ? "text-red-600" : "text-gray-500"}`}>
                {hint}
              </div>

              {isOverLimit && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  ❌ 15kg 초과는 등록할 수 없습니다. (현재 입력: {weightNum}kg)
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">품종(견종/묘종)</label>
              <input
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div
              onClick={() => setForm({ ...form, neutered: !form.neutered })}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors
                ${form.neutered ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div>
                <p className="font-semibold text-gray-800 text-sm">중성화 여부</p>
                <p className="text-xs text-gray-400 mt-0.5">중성화 수술을 받았나요?</p>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${form.neutered ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.neutered ? "translate-x-6" : ""}`} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">특이사항 / 건강 정보</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 min-h-[80px] resize-none"
              />
            </div>

            {/* 사진 */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">사진 업로드</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : form.imageUrl ? (
                    <img src={form.imageUrl} alt="current" className="w-full h-full object-cover" />
                  ) : (
                    "🐾"
                  )}
                </div>

                <label className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm hover:border-blue-300 cursor-pointer transition-colors">
                  📸 클릭하여 사진 선택
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({ ...EMPTY_FORM });
                  setFile(null);
                }}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50"
              >
                취소
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {editId ? "수정 완료" : "등록하기"} 🐾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {deleteId && (
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